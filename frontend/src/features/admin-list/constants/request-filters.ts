import type { RequestStatus } from "@/src/types/request";

export const categoryOptions = [
  "Limpeza Urbana e Manejo de Resíduos",
  "Manutenção de Áreas Verdes e Paisagismo",
  "Infraestrutura e Conservação do Mobiliário Urbano",
  "Drenagem e Saneamento",
  "Poluição Visual e Ambiental",
  "Controle de Zoonoses e Pragas",
  "Outros",
];

export const priorityOptions = ["Alta", "Média", "Baixa"];

export const statusOptions: RequestStatus[] = [
  "Pendente",
  "Resolvida",
  "Cancelada",
];
