import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Response } from "express";
import { randomUUID } from "crypto";

// ============================================================================
// BUCKET CONFIGURATION
// ============================================================================

/**
 * Storage bucket names for different document types
 * - documentos-empleados: Private bucket for employee documents (contracts, IDs, etc.)
 * - documentos-empresa: Private bucket for company documents (policies, reports, etc.)
 * - documentos-publicos: Public bucket for documents accessible without authentication
 */
export const STORAGE_BUCKETS = {
  DOCUMENTOS_EMPLEADOS: "documentos-empleados",
  DOCUMENTOS_EMPRESA: "documentos-empresa",
  DOCUMENTOS_PUBLICOS: "documentos-publicos",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

// Default expiration times in seconds
const DEFAULT_UPLOAD_EXPIRY = 60 * 15; // 15 minutes
const DEFAULT_DOWNLOAD_EXPIRY = 60 * 60; // 1 hour

// ============================================================================
// ERROR CLASSES
// ============================================================================

/**
 * Error thrown when a file is not found in storage
 */
export class StorageFileNotFoundError extends Error {
  public readonly bucket?: string;
  public readonly path?: string;

  constructor(bucket?: string, path?: string) {
    const message = bucket && path
      ? `File not found: ${bucket}/${path}`
      : "Object not found in Supabase storage";
    super(message);
    this.name = "StorageFileNotFoundError";
    this.bucket = bucket;
    this.path = path;
    Object.setPrototypeOf(this, StorageFileNotFoundError.prototype);
  }
}

// Alias for backward compatibility
export const SupabaseStorageNotFoundError = StorageFileNotFoundError;

/**
 * Error thrown when a storage operation fails
 */
export class StorageOperationError extends Error {
  public readonly operation: string;
  public readonly originalError: unknown;

  constructor(operation: string, message: string, originalError?: unknown) {
    super(`Storage ${operation} failed: ${message}`);
    this.name = "StorageOperationError";
    this.operation = operation;
    this.originalError = originalError;
    Object.setPrototypeOf(this, StorageOperationError.prototype);
  }
}

// ============================================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================================

/**
 * Extracts Supabase project URL from DATABASE_URL or uses SUPABASE_URL env var
 */
function getSupabaseUrl(): string {
  // First check for explicit SUPABASE_URL
  if (process.env.SUPABASE_URL) {
    return process.env.SUPABASE_URL;
  }

  // Try to extract from DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    try {
      // DATABASE_URL format: postgres://user:pass@host.pooler.supabase.com:port/db
      const url = new URL(databaseUrl);

      // Handle pooler URL: extract project ref from username (postgres.PROJECT_REF)
      if (url.hostname.includes(".pooler.supabase.com")) {
        const userParts = url.username.split(".");
        if (userParts.length > 1) {
          const projectRef = userParts[1];
          return `https://${projectRef}.supabase.co`;
        }
      }

      // Handle direct Supabase URL
      if (url.hostname.includes(".supabase.co")) {
        const hostParts = url.hostname.split(".");
        const projectRef = hostParts[0];
        return `https://${projectRef}.supabase.co`;
      }
    } catch (e) {
      // Fall through to warning
    }
  }

  console.warn(
    "SUPABASE_URL not configured. Set SUPABASE_URL environment variable " +
    "or ensure DATABASE_URL contains a valid Supabase connection string. " +
    "Supabase storage operations will fail."
  );
  return "";
}

/**
 * Gets the Supabase service role key for server-side operations
 */
function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY not configured. This key is required for " +
      "server-side storage operations. Get it from your Supabase project settings."
    );
    return "";
  }
  return key;
}

// Initialize Supabase client
const supabaseUrl = getSupabaseUrl();
const supabaseServiceKey = getSupabaseServiceRoleKey();

console.log("[Supabase Storage] Initializing with URL:", supabaseUrl || "(empty)");
console.log("[Supabase Storage] Service key configured:", supabaseServiceKey ? "yes" : "no");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[Supabase Storage] WARNING: Missing configuration - storage operations will fail");
}

const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseServiceKey || "placeholder", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Interface for signed URL response
 */
export interface SignedUrlResponse {
  signedUrl: string;
  path: string;
  expiresAt: Date;
}

/**
 * Interface for file upload options
 */
export interface UploadOptions {
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

/**
 * Interface for file metadata from listing
 */
export interface FileMetadata {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

// ============================================================================
// SUPABASE STORAGE SERVICE
// ============================================================================

/**
 * Supabase Storage Service for managing file uploads and downloads
 * Replaces the Replit ObjectStorageService with Supabase Storage
 */
export class SupabaseStorageService {
  private client: SupabaseClient;
  private defaultBucket: StorageBucket = STORAGE_BUCKETS.DOCUMENTOS_EMPLEADOS;

  constructor(client?: SupabaseClient) {
    this.client = client || supabase;
  }

  // ==========================================================================
  // PATH GENERATION UTILITIES
  // ==========================================================================

  /**
   * Generates a unique file path for storage
   * Format: {category}/{entityId}/{uuid}_{originalFilename}
   *
   * @param category - Document category (e.g., "contratos", "identificaciones")
   * @param entityId - The employee ID or company ID
   * @param originalFilename - Original filename for the document
   * @returns Formatted path string
   */
  generateFilePath(
    category: string,
    entityId: string,
    originalFilename: string
  ): string {
    const uuid = randomUUID();
    const sanitizedFilename = this.sanitizeFilename(originalFilename);
    return `${category}/${entityId}/${uuid}_${sanitizedFilename}`;
  }

  /**
   * Sanitizes a filename to remove special characters
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars with underscore
      .replace(/_+/g, "_") // Collapse multiple underscores
      .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
  }

  // ==========================================================================
  // SIGNED URL METHODS
  // ==========================================================================

  /**
   * Gets a signed URL for uploading a file
   * @param bucket - The storage bucket name
   * @param path - The file path within the bucket (optional, generates UUID if not provided)
   * @param expiresIn - Expiration time in seconds (default: 15 minutes)
   * @returns Object with upload URL and path
   */
  async getSignedUploadUrl(
    bucket: string = this.defaultBucket,
    path?: string,
    expiresIn: number = DEFAULT_UPLOAD_EXPIRY
  ): Promise<SignedUrlResponse> {
    const filePath = path || `uploads/${randomUUID()}`;

    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error) {
      throw new StorageOperationError(
        "getSignedUploadUrl",
        error.message,
        error
      );
    }

    if (!data?.signedUrl) {
      throw new StorageOperationError(
        "getSignedUploadUrl",
        "No signed URL returned from Supabase"
      );
    }

    return {
      signedUrl: data.signedUrl,
      path: filePath,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  /**
   * Gets a signed URL for downloading a file
   * @param bucket - The storage bucket name
   * @param path - The file path within the bucket
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Object with download URL and metadata
   */
  async getSignedDownloadUrl(
    bucket: string = this.defaultBucket,
    path: string,
    expiresIn: number = DEFAULT_DOWNLOAD_EXPIRY
  ): Promise<SignedUrlResponse> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new StorageOperationError(
        "getSignedDownloadUrl",
        error.message,
        error
      );
    }

    if (!data?.signedUrl) {
      throw new StorageOperationError(
        "getSignedDownloadUrl",
        "No signed URL returned from Supabase"
      );
    }

    return {
      signedUrl: data.signedUrl,
      path: path,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  /**
   * Gets the public URL for a file (only works for public buckets)
   * @param bucket - The storage bucket name
   * @param path - The file path within the bucket
   * @returns Public URL string
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // ==========================================================================
  // FILE OPERATIONS
  // ==========================================================================

  /**
   * Downloads a file and returns it as a Buffer with content type
   * @param bucket - The storage bucket name
   * @param path - The file path within the bucket
   * @returns Object containing the file buffer and content type
   */
  async downloadFile(
    bucket: string = this.defaultBucket,
    path: string
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .download(path);

    if (error) {
      if (error.message.includes("not found") || error.message.includes("404")) {
        throw new StorageFileNotFoundError(bucket, path);
      }
      throw new StorageOperationError("downloadFile", error.message, error);
    }

    if (!data) {
      throw new StorageFileNotFoundError(bucket, path);
    }

    const contentType = data.type || "application/octet-stream";
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return { buffer, contentType };
  }

  /**
   * Downloads a file and streams it directly to an Express response
   * @param bucket - The storage bucket name
   * @param path - The file path within the bucket
   * @param res - Express response object
   * @param cacheTtlSec - Cache TTL in seconds (default: 1 hour)
   */
  async downloadObject(
    bucket: string = this.defaultBucket,
    path: string,
    res: Response,
    cacheTtlSec: number = 3600
  ): Promise<void> {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .download(path);

      if (error) {
        throw new StorageFileNotFoundError(bucket, path);
      }

      if (!data) {
        throw new StorageFileNotFoundError(bucket, path);
      }

      const contentType = data.type || "application/octet-stream";

      res.set({
        "Content-Type": contentType,
        "Content-Length": data.size.toString(),
        "Cache-Control": `private, max-age=${cacheTtlSec}`,
      });

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } catch (error) {
      console.error("Error downloading from Supabase:", error);
      if (!res.headersSent) {
        if (error instanceof StorageFileNotFoundError) {
          res.status(404).json({ error: "File not found" });
        } else {
          res.status(500).json({ error: "Error downloading file" });
        }
      }
    }
  }

  /**
   * Uploads a file directly (for server-side uploads)
   * @param bucket - The storage bucket name
   * @param path - The file path within the bucket
   * @param file - File contents as Buffer or Blob
   * @param options - Upload options (contentType, cacheControl, upsert)
   * @returns The full path of the uploaded file (/{bucket}/{path})
   */
  async uploadFile(
    bucket: string = this.defaultBucket,
    path: string,
    file: Buffer | Blob,
    options?: UploadOptions
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType || "application/octet-stream",
        cacheControl: options?.cacheControl || "3600",
        upsert: options?.upsert || false,
      });

    if (error) {
      throw new StorageOperationError("uploadFile", error.message, error);
    }

    return `/${bucket}/${data.path}`;
  }

  /**
   * Deletes a file from storage
   * @param bucket - The storage bucket name
   * @param path - The file path within the bucket
   * @returns true if deletion was successful
   */
  async deleteFile(bucket: string = this.defaultBucket, path: string): Promise<boolean> {
    const { error } = await this.client.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new StorageOperationError("deleteFile", error.message, error);
    }

    return true;
  }

  /**
   * Deletes multiple files from storage
   * @param bucket - The storage bucket name
   * @param paths - Array of file paths within the bucket
   * @returns true if deletion was successful
   */
  async deleteFiles(bucket: string, paths: string[]): Promise<boolean> {
    if (paths.length === 0) return true;

    const { error } = await this.client.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      throw new StorageOperationError("deleteFiles", error.message, error);
    }

    return true;
  }

  // ==========================================================================
  // FILE QUERY METHODS
  // ==========================================================================

  /**
   * Lists files in a bucket/folder
   * @param bucket - The storage bucket name
   * @param folder - Optional folder path to list
   * @param options - Listing options (limit, offset, search)
   * @returns Array of file metadata
   */
  async listFiles(
    bucket: string,
    folder?: string,
    options?: { limit?: number; offset?: number; search?: string }
  ): Promise<FileMetadata[]> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .list(folder, {
        limit: options?.limit || 100,
        offset: options?.offset || 0,
        search: options?.search,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      throw new StorageOperationError("listFiles", error.message, error);
    }

    return (data || []) as FileMetadata[];
  }

  /**
   * Checks if a file exists in storage
   * @param bucket - The storage bucket name
   * @param path - The file path within the bucket
   * @returns true if file exists, false otherwise
   */
  async fileExists(bucket: string = this.defaultBucket, path: string): Promise<boolean> {
    try {
      const folder = path.split("/").slice(0, -1).join("/");
      const filename = path.split("/").pop();

      const { data, error } = await this.client.storage
        .from(bucket)
        .list(folder, { search: filename });

      if (error) return false;

      return (data?.length || 0) > 0;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // PATH NORMALIZATION METHODS
  // ==========================================================================

  /**
   * Normalizes a Supabase storage URL to a storage path
   * Converts full URLs back to relative path format for database storage
   *
   * @param rawUrl - The raw URL or path to normalize
   * @returns Normalized storage path in format "/{bucket}/{path}" or original if not a Supabase URL
   */
  normalizeStoragePath(rawUrl: string): string {
    if (!rawUrl) return rawUrl;

    // If it's already a normalized path (starts with /), return as-is
    if (rawUrl.startsWith("/")) {
      return rawUrl;
    }

    // Check if it's a Supabase storage URL
    // Format: https://PROJECT.supabase.co/storage/v1/object/public/BUCKET/PATH
    // or: https://PROJECT.supabase.co/storage/v1/object/sign/BUCKET/PATH?token=...
    // or: https://PROJECT.supabase.co/storage/v1/object/upload/sign/BUCKET/PATH?token=...
    if (rawUrl.includes(".supabase.co/storage/v1/object/")) {
      try {
        const url = new URL(rawUrl);
        // Handle upload/sign URLs (from createSignedUploadUrl)
        const uploadMatch = url.pathname.match(
          /\/storage\/v1\/object\/upload\/sign\/([^?]+)/
        );
        if (uploadMatch) {
          return `/${uploadMatch[1]}`;
        }
        // Handle regular signed/public/authenticated URLs
        const pathMatch = url.pathname.match(
          /\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^?]+)/
        );
        if (pathMatch) {
          return `/${pathMatch[1]}`;
        }
      } catch {
        // URL parsing failed, continue to other checks
      }
    }

    // Handle S3-compatible URLs
    // Format: https://PROJECT.supabase.co/storage/v1/s3/BUCKET/PATH
    if (rawUrl.includes(".supabase.co/storage/v1/s3/")) {
      try {
        const url = new URL(rawUrl);
        const pathMatch = url.pathname.match(/\/storage\/v1\/s3\/([^?]+)/);
        if (pathMatch) {
          return `/${pathMatch[1]}`;
        }
      } catch {
        // URL parsing failed, continue
      }
    }

    // If it's a simple path without leading slash, add it
    if (!rawUrl.startsWith("http")) {
      return rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    }

    return rawUrl;
  }

  /**
   * Extracts bucket and path from a normalized storage path
   * @param normalizedPath - Path in format "/{bucket}/{path}" or "{bucket}/{path}"
   * @returns Object with bucket and path
   */
  parseStoragePath(normalizedPath: string): { bucket: string; path: string } {
    // Remove leading slash if present
    const cleanPath = normalizedPath.startsWith("/")
      ? normalizedPath.slice(1)
      : normalizedPath;

    // Check for known bucket prefixes
    for (const bucketName of Object.values(STORAGE_BUCKETS)) {
      if (cleanPath.startsWith(`${bucketName}/`)) {
        return {
          bucket: bucketName,
          path: cleanPath.slice(bucketName.length + 1),
        };
      }
    }

    // Default: assume the whole thing is the path in the default bucket
    return {
      bucket: this.defaultBucket,
      path: cleanPath,
    };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Gets the underlying Supabase client for advanced operations
   * Use with caution - prefer using the service methods
   */
  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Sets the default bucket for operations
   */
  setDefaultBucket(bucket: StorageBucket): void {
    this.defaultBucket = bucket;
  }

  /**
   * Gets the current default bucket
   */
  getDefaultBucket(): StorageBucket {
    return this.defaultBucket;
  }

  /**
   * Alias for parseStoragePath - for backwards compatibility
   */
  parsePath(normalizedPath: string): { bucket: string; path: string } {
    return this.parseStoragePath(normalizedPath);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export singleton instance for convenience
export const supabaseStorage = new SupabaseStorageService();

// Export the class for cases where multiple instances are needed
export default SupabaseStorageService;
