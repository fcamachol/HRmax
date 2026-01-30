import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";

let io: SocketServer;

export function initializeWebSocket(server: HttpServer) {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5000"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Join a denuncia room by ID (for admin panel)
    socket.on("join-denuncia", (denunciaId: string) => {
      socket.join(`denuncia:${denunciaId}`);
    });

    // Leave a denuncia room by ID
    socket.on("leave-denuncia", (denunciaId: string) => {
      socket.leave(`denuncia:${denunciaId}`);
    });

    // Join a denuncia room by case number (for anonymous reporters)
    socket.on("join-denuncia-case", (caseNumber: string) => {
      socket.join(`denuncia-case:${caseNumber}`);
    });

    // Leave a denuncia room by case number
    socket.on("leave-denuncia-case", (caseNumber: string) => {
      socket.leave(`denuncia-case:${caseNumber}`);
    });
  });

  return io;
}

// Helper to emit events from anywhere in the server (by denuncia ID)
export function emitDenunciaUpdate(denunciaId: string, event: string, data?: any) {
  if (io) {
    io.to(`denuncia:${denunciaId}`).emit(event, data);
  }
}

// Helper to emit events by case number (for anonymous reporters)
export function emitDenunciaCaseUpdate(caseNumber: string, event: string, data?: any) {
  if (io) {
    io.to(`denuncia-case:${caseNumber}`).emit(event, data);
  }
}
