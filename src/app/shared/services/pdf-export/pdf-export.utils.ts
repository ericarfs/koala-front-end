import { SensorStats } from "./pdf-expert.types";

export function computeSensorStats(
  name: string,
  values: readonly (number | null | undefined)[],
  unit?: string,
): SensorStats | null {
  const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (nums.length === 0) return null;

  let min = nums[0];
  let max = nums[0];
  let sum = 0;
  for (const n of nums) {
    if (n < min) min = n;
    if (n > max) max = n;
    sum += n;
  }
  return { name, unit, min, max, avg: sum / nums.length };
}

const LOCALES: Record<string, string> = { pt: 'pt-BR', en: 'en-US' };

export function localeFromLang(lang: string): string {
  return LOCALES[lang] ?? lang;
}

export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number } | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
