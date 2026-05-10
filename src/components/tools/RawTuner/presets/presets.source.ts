import type { PresetSource } from './types'

/**
 * Hand-curated preset bank. Each entry is a `PresetSource`; the build script
 * `build/embed-presets.ts` runs CLIP's text encoder over `description` and
 * writes the embeddings into `presets.json`.
 *
 * Descriptions are written in CLIP-friendly photography language: visible
 * subjects, mood adjectives, technical descriptors.
 */
export const PRESET_SOURCES: readonly PresetSource[] = [
  {
    name: 'Editorial portrait',
    description:
      'clean studio editorial portrait, neutral skin tones, gentle highlights, defined eyes, soft micro-contrast, magazine cover lighting',
    sliders: {
      exposure: 0.1,
      contrast: 12,
      highlights: -15,
      shadows: 8,
      whites: 5,
      blacks: -5,
      vibrance: 8,
    },
  },
  {
    name: 'Airy pastel',
    description:
      'airy pastel photography, lifted blacks, low contrast, dreamy soft skin, gentle wash of pink and cream, fashion lifestyle look',
    sliders: {
      exposure: 0.3,
      contrast: -15,
      highlights: -10,
      shadows: 25,
      whites: 10,
      blacks: 18,
      saturation: -5,
      vibrance: 6,
    },
  },
  {
    name: 'Moody film noir',
    description:
      'moody monochromatic film noir, deep shadows, smoky highlights, silver halide grain, 1950s street photography',
    sliders: {
      exposure: -0.2,
      contrast: 35,
      highlights: -25,
      shadows: -30,
      whites: 0,
      blacks: -45,
      saturation: -100,
    },
  },
  {
    name: 'Cinematic teal-orange',
    description:
      'cinematic teal and orange colour grade, warm midtones, cool shadows, anamorphic film look, modern action movie',
    sliders: {
      exposure: 0,
      contrast: 18,
      highlights: -10,
      shadows: 12,
      whites: 6,
      blacks: -12,
      temp: 8,
      tint: 4,
      vibrance: 10,
    },
  },
  {
    name: 'Natural daylight',
    description:
      'natural daylight photograph, accurate colours, balanced white balance, neutral skin tones, no creative grade',
    sliders: { exposure: 0, contrast: 5, highlights: -5, shadows: 5, whites: 0, blacks: 0 },
  },
  {
    name: 'Golden hour landscape',
    description:
      'warm golden hour landscape, glowing sun, long shadows, saturated foliage, amber sky, late afternoon light',
    sliders: {
      exposure: 0.2,
      contrast: 20,
      highlights: -20,
      shadows: 18,
      whites: 12,
      blacks: -10,
      temp: 18,
      vibrance: 18,
      saturation: 6,
    },
  },
  {
    name: 'Blue hour cityscape',
    description:
      'blue hour cityscape after sunset, deep navy sky, glowing window lights, neon reflections, long exposure feel',
    sliders: {
      exposure: -0.1,
      contrast: 22,
      highlights: -10,
      shadows: 10,
      whites: 0,
      blacks: -18,
      temp: -25,
      tint: -5,
      vibrance: 14,
    },
  },
  {
    name: 'High-key black and white',
    description:
      'high-key black and white portrait, bright airy whites, soft skin, gentle gradients, fine art photography',
    sliders: {
      exposure: 0.5,
      contrast: -5,
      highlights: -20,
      shadows: 30,
      whites: 25,
      blacks: 20,
      saturation: -100,
    },
  },
  {
    name: 'Low-key black and white',
    description:
      'low-key black and white photograph, deep blacks, sculpted highlights, dramatic chiaroscuro lighting, fine art',
    sliders: {
      exposure: -0.4,
      contrast: 30,
      highlights: -30,
      shadows: -20,
      whites: -5,
      blacks: -45,
      saturation: -100,
    },
  },
  {
    name: 'Vintage film',
    description:
      'vintage faded film photograph, warm cast, lifted blacks, Kodak Portra grain, lo-fi 1970s home movie',
    sliders: {
      exposure: 0.1,
      contrast: -12,
      highlights: -15,
      shadows: 18,
      whites: -5,
      blacks: 22,
      temp: 10,
      vibrance: -8,
      saturation: -10,
    },
  },
  {
    name: 'Faded matte',
    description:
      'matte faded photograph, lifted blacks, washed-out shadows, low contrast aesthetic, hipster Instagram filter',
    sliders: {
      exposure: 0.2,
      contrast: -10,
      highlights: -10,
      shadows: 15,
      whites: -8,
      blacks: 30,
      saturation: -10,
    },
  },
  {
    name: 'Punchy editorial',
    description:
      'punchy high-contrast editorial photograph, vibrant saturation, crisp shadows, defined highlights, advertising shoot',
    sliders: {
      exposure: 0,
      contrast: 35,
      highlights: -10,
      shadows: 5,
      whites: 18,
      blacks: -25,
      vibrance: 22,
      saturation: 8,
    },
  },
  {
    name: 'Romantic wedding',
    description:
      'romantic warm wedding photograph, soft skin tones, golden highlights, gentle film grain, dreamy bokeh, lifestyle photography',
    sliders: {
      exposure: 0.2,
      contrast: 8,
      highlights: -15,
      shadows: 20,
      whites: 8,
      blacks: 12,
      temp: 12,
      vibrance: 6,
    },
  },
  {
    name: 'Documentary neutral',
    description:
      'documentary photojournalism photograph, neutral colours, gritty texture, accurate skin, news editorial style',
    sliders: {
      exposure: 0,
      contrast: 10,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: -5,
      vibrance: -3,
    },
  },
  {
    name: 'Punchy travel',
    description:
      'vibrant travel photograph, saturated tropical colours, deep blue sky, lush foliage, postcard look',
    sliders: {
      exposure: 0,
      contrast: 15,
      highlights: -10,
      shadows: 10,
      whites: 8,
      blacks: -10,
      vibrance: 28,
      saturation: 10,
    },
  },
  {
    name: 'Pale Scandinavian',
    description:
      'pale Scandinavian winter photograph, cold neutral whites, gentle blue cast, low contrast, minimalist',
    sliders: {
      exposure: 0.1,
      contrast: -8,
      highlights: -10,
      shadows: 8,
      whites: 10,
      blacks: 10,
      temp: -12,
      saturation: -15,
    },
  },
  {
    name: 'Sun-bleached desert',
    description:
      'sun-bleached desert photograph, faded warm sand tones, hazy highlights, dry vintage palette, southwestern Americana',
    sliders: {
      exposure: 0.15,
      contrast: 10,
      highlights: -25,
      shadows: 5,
      whites: -5,
      blacks: 12,
      temp: 18,
      tint: -3,
      saturation: -8,
    },
  },
  {
    name: 'Forest green moody',
    description:
      'moody dark forest photograph, deep evergreen foliage, dim filtered light, cold green shadows, wilderness atmosphere',
    sliders: {
      exposure: -0.2,
      contrast: 18,
      highlights: -15,
      shadows: -10,
      whites: -10,
      blacks: -25,
      temp: -8,
      tint: 8,
      vibrance: 12,
    },
  },
  {
    name: 'Sunset portrait',
    description:
      'warm sunset portrait, glowing skin, orange rim light, dreamy backlit hair, late summer evening',
    sliders: {
      exposure: 0.2,
      contrast: 12,
      highlights: -20,
      shadows: 18,
      whites: 15,
      blacks: -8,
      temp: 22,
      vibrance: 10,
    },
  },
  {
    name: 'Foggy morning',
    description:
      'foggy morning landscape, soft diffused light, low contrast, muted colours, ethereal atmosphere, dreamlike',
    sliders: {
      exposure: 0.2,
      contrast: -10,
      highlights: -10,
      shadows: 15,
      whites: -5,
      blacks: 18,
      saturation: -20,
      vibrance: -5,
    },
  },
  {
    name: 'Concrete urban',
    description:
      'gritty urban concrete photograph, brutalist architecture, cool neutral tones, hard shadows, street style',
    sliders: {
      exposure: -0.1,
      contrast: 22,
      highlights: -15,
      shadows: -10,
      whites: 5,
      blacks: -25,
      temp: -8,
      saturation: -12,
    },
  },
  {
    name: 'Velvia saturation',
    description:
      'velvia colour reversal film look, hyper-saturated reds and greens, punchy contrast, professional landscape slide film',
    sliders: {
      exposure: 0,
      contrast: 22,
      highlights: -10,
      shadows: 10,
      whites: 8,
      blacks: -15,
      vibrance: 15,
      saturation: 25,
    },
  },
  {
    name: 'Faded Polaroid',
    description:
      'faded Polaroid instant photograph, soft warm cast, lifted blacks, slight green shift in shadows, vintage instant film',
    sliders: {
      exposure: 0.1,
      contrast: -8,
      highlights: -10,
      shadows: 12,
      whites: -5,
      blacks: 25,
      temp: 8,
      tint: -8,
      saturation: -8,
    },
  },
  {
    name: 'Cyberpunk neon',
    description:
      'cyberpunk neon city photograph, magenta and cyan colour grade, deep blacks, glowing signage, science fiction street',
    sliders: {
      exposure: -0.2,
      contrast: 28,
      highlights: -20,
      shadows: 5,
      whites: 0,
      blacks: -35,
      temp: -15,
      tint: 15,
      vibrance: 22,
      saturation: 10,
    },
  },
  {
    name: 'Matte black metal',
    description:
      'high-contrast monochrome with crushed blacks, brooding metal album artwork, dramatic underexposed silhouettes',
    sliders: {
      exposure: -0.5,
      contrast: 40,
      highlights: -10,
      shadows: -25,
      whites: 5,
      blacks: -55,
      saturation: -100,
    },
  },
  {
    name: 'Soft skin beauty',
    description:
      'soft skin beauty portrait, smooth gradients, even tonality, gentle highlights, cosmetic advertising style',
    sliders: {
      exposure: 0.1,
      contrast: 5,
      highlights: -25,
      shadows: 18,
      whites: 8,
      blacks: 5,
      vibrance: 5,
    },
  },
  {
    name: 'Crunchy street',
    description:
      'crunchy high-grain street photograph, hard contrast, deep shadows, gritty mood, classic Magnum Photos style',
    sliders: {
      exposure: -0.1,
      contrast: 32,
      highlights: -15,
      shadows: -15,
      whites: 10,
      blacks: -30,
    },
  },
  {
    name: 'Pastel anime',
    description:
      'pastel anime aesthetic, soft pink and cyan, lifted blacks, dreamy gradients, kawaii Japanese photography',
    sliders: {
      exposure: 0.2,
      contrast: -12,
      highlights: -8,
      shadows: 18,
      whites: 5,
      blacks: 28,
      temp: -3,
      tint: 10,
      vibrance: 12,
    },
  },
  {
    name: 'Misty mountain',
    description:
      'misty mountain landscape, layered haze, cool blue tones, soft diffuse light, alpine wilderness',
    sliders: {
      exposure: 0.1,
      contrast: 10,
      highlights: -20,
      shadows: 15,
      whites: 5,
      blacks: -8,
      temp: -10,
      vibrance: 8,
    },
  },
  {
    name: 'Warm coffee shop',
    description:
      'warm cozy coffee shop interior, soft tungsten light, golden highlights, gentle shadows, rustic wood textures',
    sliders: {
      exposure: 0.1,
      contrast: 8,
      highlights: -15,
      shadows: 12,
      whites: 5,
      blacks: 5,
      temp: 15,
      vibrance: 8,
    },
  },
] as const
