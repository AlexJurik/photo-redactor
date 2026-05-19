import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'No adjustments applied',
    adjustments: {},
    gradient: 'from-gray-700 to-gray-800',
  },
  {
    id: 'clean-bright',
    name: 'Clean Bright',
    description: 'Fresh, airy, and illuminated look',
    adjustments: {
      brightness: 12,
      contrast: 8,
      saturation: 5,
      shadows: 10,
    },
    gradient: 'from-amber-100 via-sky-100 to-indigo-100 text-gray-900',
  },
  {
    id: 'soft-film',
    name: 'Soft Film',
    description: 'Charming analog colors with grain',
    adjustments: {
      contrast: -5,
      saturation: -8,
      fade: 12,
      grain: 8,
    },
    gradient: 'from-amber-200/40 via-rose-200/40 to-teal-200/40',
  },
  {
    id: 'warm-golden',
    name: 'Warm Golden',
    description: 'Sun-drenched, warm profile tones',
    adjustments: {
      warmth: 18,
      highlights: 8,
      saturation: 10,
    },
    gradient: 'from-yellow-600 via-orange-500 to-amber-400',
  },
  {
    id: 'moody-contrast',
    name: 'Moody Contrast',
    description: 'Deep shadows and high drama',
    adjustments: {
      brightness: -5,
      contrast: 22,
      shadows: -12,
      vignette: 15,
    },
    gradient: 'from-slate-900 via-zinc-800 to-neutral-950 border-neutral-700',
  },
  {
    id: 'urban-fade',
    name: 'Urban Fade',
    description: 'Desaturated city vibe with low contrast',
    adjustments: {
      contrast: 10,
      saturation: -12,
      fade: 18,
      grain: 6,
    },
    gradient: 'from-slate-600 to-zinc-700',
  },
  {
    id: 'natural-skin',
    name: 'Natural Skin',
    description: 'Flattering tones optimized for portraits',
    adjustments: {
      brightness: 6,
      contrast: 4,
      warmth: 6,
      saturation: -3,
    },
    gradient: 'from-rose-100 via-orange-100 to-amber-100 text-gray-900',
  },
  {
    id: 'high-fashion',
    name: 'High Fashion',
    description: 'Crisp details and rich editorial contrast',
    adjustments: {
      contrast: 25,
      saturation: -15,
      sharpness: 12,
    },
    gradient: 'from-neutral-950 via-gray-950 to-neutral-950 border-neutral-600',
  },
  {
    id: 'vintage-matte',
    name: 'Vintage Matte',
    description: 'Retro washed-out film simulation',
    adjustments: {
      fade: 20,
      warmth: 10,
      grain: 14,
      contrast: -8,
    },
    gradient: 'from-amber-900/60 to-zinc-800',
  },
  {
    id: 'cool-editorial',
    name: 'Cool Editorial',
    description: 'Cold undertones with sharp contrast',
    adjustments: {
      warmth: -12,
      contrast: 18,
      saturation: -8,
    },
    gradient: 'from-sky-900 via-slate-800 to-cyan-950',
  },
  {
    id: 'black-white',
    name: 'Black & White',
    description: 'Classic silver-screen monochrome',
    adjustments: {
      saturation: -100,
      contrast: 20,
      brightness: 4,
    },
    gradient: 'from-neutral-900 via-gray-500 to-neutral-100',
  },
];
