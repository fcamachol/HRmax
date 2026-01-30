import { useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io({
      autoConnect: true,
    });
  }
  return socket;
}

export function useSocket() {
  return getSocket();
}

// Hook for admin panel - joins room by denuncia ID
export function useDenunciaSocket(
  denunciaId: string | null,
  onNewMessage: () => void
) {
  const socket = useSocket();

  // Memoize the callback to prevent unnecessary effect re-runs
  const stableCallback = useCallback(onNewMessage, [onNewMessage]);

  useEffect(() => {
    if (!denunciaId) return;

    socket.emit("join-denuncia", denunciaId);
    socket.on("new-message", stableCallback);

    return () => {
      socket.emit("leave-denuncia", denunciaId);
      socket.off("new-message", stableCallback);
    };
  }, [denunciaId, stableCallback, socket]);
}

// Hook for anonymous reporter - joins room by case number
export function useDenunciaCaseSocket(
  caseNumber: string | null,
  onNewMessage: () => void
) {
  const socket = useSocket();

  // Memoize the callback to prevent unnecessary effect re-runs
  const stableCallback = useCallback(onNewMessage, [onNewMessage]);

  useEffect(() => {
    if (!caseNumber) return;

    socket.emit("join-denuncia-case", caseNumber);
    socket.on("new-message", stableCallback);

    return () => {
      socket.emit("leave-denuncia-case", caseNumber);
      socket.off("new-message", stableCallback);
    };
  }, [caseNumber, stableCallback, socket]);
}
