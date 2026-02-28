import type { AdminRequest } from "@/src/types/request";

const SUMMARY_MAX_LENGTH = 180;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function truncate(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 3)}...`;
}

function formatCreatedAt(isoDate: string): string {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return escapeHtml(isoDate);

  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildAdminRequestInfoWindowContent(request: AdminRequest): string {
  const title = escapeHtml(request.title);
  const category = escapeHtml(request.category);
  const priority = escapeHtml(request.priority);
  const createdAt = formatCreatedAt(request.createdAt);
  const technicalSummary = escapeHtml(
    truncate(request.technicalSummary, SUMMARY_MAX_LENGTH)
  );

  return `
    <div style="max-width: 320px; padding: 4px 2px; font-family: Roboto, Arial, sans-serif; color: #1c2330;">
      <div style="font-size: 12px; font-weight: 700; color: #5a687c; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px;">
        Chamado
      </div>
      <div style="font-size: 16px; font-weight: 700; line-height: 1.3; margin-bottom: 10px;">
        ${title}
      </div>
      <div style="display: grid; gap: 6px; margin-bottom: 10px;">
        <div style="font-size: 13px;"><strong>Categoria:</strong> ${category}</div>
        <div style="font-size: 13px;"><strong>Prioridade:</strong> ${priority}</div>
        <div style="font-size: 13px;"><strong>Criado em:</strong> ${createdAt}</div>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 8px;">
        <div style="font-size: 12px; font-weight: 700; color: #2f4d73; margin-bottom: 4px;">
          Resumo tÃ©cnico (IA)
        </div>
        <div style="font-size: 13px; line-height: 1.45; color: #344256;">
          ${technicalSummary}
        </div>
      </div>
    </div>
  `.trim();
}

export function openAdminRequestInfoWindow(params: {
  infoWindow: google.maps.InfoWindow;
  marker: google.maps.Marker;
  map: google.maps.Map;
  request: AdminRequest;
}): void {
  const { infoWindow, marker, map, request } = params;
  infoWindow.setOptions({ headerDisabled: true });
  infoWindow.setContent(buildAdminRequestInfoWindowContent(request));
  infoWindow.open({ map, anchor: marker });
}

