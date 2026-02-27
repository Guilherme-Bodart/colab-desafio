type CategoryPinConfig = {
  color: string;
  symbolSvg: string;
};

const defaultPin: CategoryPinConfig = {
  color: "#6B7280",
  symbolSvg:
    '<circle cx="21" cy="18" r="2.2" fill="#ffffff" /><circle cx="27" cy="18" r="2.2" fill="#ffffff" /><circle cx="33" cy="18" r="2.2" fill="#ffffff" />',
};

const greenLeafPinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><ellipse cx="12" cy="22" rx="4" ry="1.5" fill="rgba(0,0,0,0.15)" /><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#10B981" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" /><g transform="translate(0.35 0.15)" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M16 5 C 8 5 7 9 8 14 C 13 14 16 11 16 5 Z" /><path d="M8 13 L 6.5 15.5" /><path d="M8 14 L 16 5" /><path d="M10 9 L 12 11" /></g></svg>`;

function normalizeCategory(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveCategoryPinConfig(category: string): CategoryPinConfig {
  const normalized = normalizeCategory(category);

  if (normalized.includes("residuo") || normalized.includes("limpeza")) {
    return {
      color: "#2563EB",
      symbolSvg:
        '<rect x="20" y="13" width="14" height="14" rx="2" fill="none" stroke="#ffffff" stroke-width="2.6" /><line x1="18" y1="13" x2="36" y2="13" stroke="#ffffff" stroke-width="2.6" /><line x1="24" y1="10" x2="30" y2="10" stroke="#ffffff" stroke-width="2.6" />',
    };
  }

  if (normalized.includes("verde") || normalized.includes("paisagismo")) {
    return {
      color: "#16A34A",
      symbolSvg:
        '<path d="M27 10.8c-6.5 0-10.5 5.1-10.5 11.1 0 4.6 3.2 7.8 7.6 7.8 7.2 0 11.8-6.2 11.8-16.9 0-1-.1-1.5-.1-1.5S32.9 10.8 27 10.8z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /><path d="M18.1 31.1l3-2.9M21.1 28.2c3.4-3.5 6.9-8 10.7-14M23.6 24.9c2.3-.1 4.7-.7 7-1.6M24.9 21.2c2-.1 4.1-.6 6.1-1.4" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />',
    };
  }

  if (normalized.includes("infraestrutura") || normalized.includes("mobiliario")) {
    return {
      color: "#F59E0B",
      symbolSvg:
        '<path d="M27 11.5l8.5 15.5h-17L27 11.5z" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" /><line x1="21.5" y1="21" x2="32.5" y2="21" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" /><line x1="19.2" y1="27.8" x2="34.8" y2="27.8" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />',
    };
  }

  if (normalized.includes("drenagem") || normalized.includes("saneamento")) {
    return {
      color: "#06B6D4",
      symbolSvg:
        '<path d="M27 10c0 0-9 9-9 14a9 9 0 0018 0c0-5-9-14-9-14z" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linejoin="round" />',
    };
  }

  if (normalized.includes("poluicao") || normalized.includes("ambiental")) {
    return {
      color: "#DC2626",
      symbolSvg:
        '<path d="M16 20c2.8-4.5 6.5-6.8 11-6.8S35.2 15.5 38 20c-2.8 4.5-6.5 6.8-11 6.8S18.8 24.5 16 20z" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linejoin="round" /><circle cx="27" cy="20" r="3.2" fill="none" stroke="#ffffff" stroke-width="2.6" /><line x1="17.5" y1="28.5" x2="36.5" y2="11.5" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" />',
    };
  }

  if (normalized.includes("zoonose") || normalized.includes("praga")) {
    return {
      color: "#7C3AED",
      symbolSvg:
        '<ellipse cx="27" cy="20" rx="6" ry="8" fill="none" stroke="#ffffff" stroke-width="2.6" /><circle cx="27" cy="12.5" r="2.5" fill="none" stroke="#ffffff" stroke-width="2.6" /><line x1="21" y1="19" x2="16" y2="16" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" /><line x1="21" y1="22" x2="16" y2="25" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" /><line x1="33" y1="19" x2="38" y2="16" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" /><line x1="33" y1="22" x2="38" y2="25" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />',
    };
  }

  return defaultPin;
}

export function buildCategoryPinIcon(category: string): string {
  const normalized = normalizeCategory(category);
  if (normalized.includes("verde") || normalized.includes("paisagismo")) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(greenLeafPinSvg)}`;
  }

  const pin = resolveCategoryPinConfig(category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54" fill="none"><path d="M27 2C17.1 2 9 10.1 9 20c0 12.2 14.7 27.9 17.1 30.4a1.3 1.3 0 0 0 1.9 0C30.3 47.9 45 32.2 45 20 45 10.1 36.9 2 27 2z" fill="${pin.color}" stroke="#0f172a" stroke-opacity="0.15" stroke-width="1.5"/><circle cx="27" cy="20" r="12.5" fill="#ffffff" fill-opacity="0.12"/>${pin.symbolSvg}</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
