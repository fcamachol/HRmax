import { pesosToBp, bpToPesos } from './basisPoints';

export interface UMAValues {
  valorDiario: number;
  valorMensual: number;
  valorAnual: number;
  valorDiarioBp: bigint;
  valorMensualBp: bigint;
  valorAnualBp: bigint;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
}

export function convertUmasToPesosBp(umas: number, umaDiariaBp: bigint): bigint {
  const umasBp = pesosToBp(umas);
  return (umasBp * umaDiariaBp) / BigInt(10000);
}

export function convertUmasMensualesAPesosBp(umas: number, umaMensualBp: bigint): bigint {
  const umasBp = pesosToBp(umas);
  return (umasBp * umaMensualBp) / BigInt(10000);
}

export function convertPesosBpToUmas(pesosBp: bigint, umaDiariaBp: bigint): number {
  if (umaDiariaBp === BigInt(0)) return 0;
  const umasBp = (pesosBp * BigInt(10000)) / umaDiariaBp;
  return bpToPesos(umasBp);
}

export function calcularTopeEfectivoBp(
  topeBp: bigint | null | undefined,
  topeUmas: number | null | undefined,
  unidadTope: 'MXN' | 'UMA',
  umaValorBp: bigint
): bigint | null {
  if (unidadTope === 'UMA' && topeUmas != null) {
    return convertUmasMensualesAPesosBp(topeUmas, umaValorBp);
  }
  return topeBp ?? null;
}

export function calcularDisponibleEnTope(
  topeEfectivoBp: bigint | null,
  consumoActualBp: bigint
): bigint {
  if (topeEfectivoBp === null) {
    return BigInt(Number.MAX_SAFE_INTEGER);
  }
  const disponible = topeEfectivoBp - consumoActualBp;
  return disponible > BigInt(0) ? disponible : BigInt(0);
}

export function calcularDisponibleMinimo(
  disponibleMensualBp: bigint,
  disponibleAnualBp: bigint
): bigint {
  return disponibleMensualBp < disponibleAnualBp ? disponibleMensualBp : disponibleAnualBp;
}
