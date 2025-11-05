import OpenAI from "openai";
import { objectStorageClient } from "./objectStorage";
import { Buffer } from "node:buffer";
import { pdfToImg } from "pdftoimg-js";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

interface LawsuitDocumentData {
  title: string;
  employeeName: string;
  description: string;
}

export async function analyzeLawsuitDocument(documentUrl: string): Promise<LawsuitDocumentData> {
  try {
    // Extract bucket and object name from the GCS URL
    const url = new URL(documentUrl);
    const pathParts = url.pathname.split('/').filter(p => p);
    
    if (pathParts.length < 2) {
      throw new Error('Invalid document URL');
    }

    const bucketName = pathParts[0];
    const objectName = pathParts.slice(1).join('/');
    
    // Download the document from object storage
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    const [fileContents] = await file.download();
    const [metadata] = await file.getMetadata();
    
    const mimeType = metadata.contentType || 'application/pdf';
    let base64Document: string;
    let finalMimeType: string;
    
    // If it's a PDF, convert the first page to an image
    if (mimeType === 'application/pdf' || objectName.toLowerCase().endsWith('.pdf')) {
      console.log('Converting PDF to image for analysis...');
      
      // pdfToImg expects a file path or buffer
      // Convert first page only for efficiency
      const images = await pdfToImg(fileContents, {
        pages: "firstPage",
        imgType: "png",
        scale: 2,
      });
      
      if (!images || images.length === 0) {
        throw new Error('Failed to convert PDF to image');
      }
      
      // Extract base64 from data URL (format: data:image/png;base64,...)
      const dataUrl = images[0];
      const base64Match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
      
      if (!base64Match) {
        throw new Error('Invalid image data from PDF conversion');
      }
      
      base64Document = base64Match[1];
      finalMimeType = 'image/png';
      console.log('PDF converted to image successfully');
    } else {
      // It's already an image
      base64Document = fileContents.toString('base64');
      finalMimeType = mimeType;
    }
    
    // Use GPT-5 with vision to analyze the document
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analiza este documento de demanda laboral en México y extrae la siguiente información en formato JSON:
{
  "title": "Título breve de la demanda",
  "employeeName": "Nombre completo del empleado demandante",
  "description": "Descripción detallada de la demanda, motivos y reclamos principales"
}

Si algún campo no está claramente visible en el documento, usa un valor descriptivo razonable basado en el contexto. Por ejemplo, si no hay un título explícito pero puedes ver que es una demanda por despido injustificado, usa ese como título.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${finalMimeType};base64,${base64Document}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const extractedData = JSON.parse(content) as LawsuitDocumentData;
    
    return {
      title: extractedData.title || "Demanda laboral",
      employeeName: extractedData.employeeName || "No especificado",
      description: extractedData.description || "Demanda laboral pendiente de análisis detallado"
    };
  } catch (error) {
    console.error('Error analyzing lawsuit document:', error);
    throw new Error('Failed to analyze document');
  }
}
