export type BorderType = 'none' | 'white-fit' | 'polaroid';

export interface Adjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  warmth: number; // -100 to 100 (temperature)
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
  sharpness: number; // 0 to 100
  vignette: number; // 0 to 100
  grain: number; // 0 to 100
  fade: number; // 0 to 100
  borderType: BorderType;
}

export interface Preset {
  id: string;
  name: string;
  adjustments: Partial<Omit<Adjustments, 'borderType'>>;
  description: string;
  gradient: string; // Tailwind gradient colors for visual UI background cards
}

export interface CropArea {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export interface CropAspectRatio {
  id: string;
  name: string;
  value: number | null; // width / height, null for free crop / original
  iconName: string;
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
  vignette: 0,
  grain: 0,
  fade: 0,
  borderType: 'none',
};

export interface TextOverlay {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number; // percentage of canvas size (e.g. 5 to 100)
  color: string;
  opacity: number; // 0 to 100
  x: number; // percentage 0-100 of canvas width
  y: number; // percentage 0-100 of canvas height
  rotation: number; // -180 to 180 degrees
  blendMode: 'behind' | 'above';
  shadowColor: string;
  shadowBlur: number; // 0 to 50
  gradientColors?: [string, string]; // Optional background gradient colors
}
