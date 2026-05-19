import type { Adjustments, CropArea, TextOverlay } from './types';

/**
 * Applies adjustments and cropping to a source image and draws it on a destination canvas.
 * Handles both fast low-resolution previews and full-resolution exports.
 */
export function processImage(
  sourceImage: HTMLImageElement,
  destCanvas: HTMLCanvasElement,
  adjustments: Adjustments,
  cropArea: CropArea,
  maxDimensions?: { width: number; height: number },
  textOverlays: TextOverlay[] = [],
  foregroundImage: HTMLImageElement | null = null,
  maskCanvas: HTMLCanvasElement | null = null
): void {
  const ctx = destCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // 1. Calculate Source Crop Coordinates
  const naturalWidth = sourceImage.naturalWidth;
  const naturalHeight = sourceImage.naturalHeight;

  const sx = (cropArea.x / 100) * naturalWidth;
  const sy = (cropArea.y / 100) * naturalHeight;
  const sw = (cropArea.width / 100) * naturalWidth;
  const sh = (cropArea.height / 100) * naturalHeight;

  // 2. Determine Destination Canvas Size
  let dw = sw;
  let dh = sh;

  if (maxDimensions) {
    const scale = Math.min(
      maxDimensions.width / sw,
      maxDimensions.height / sh,
      1 // Don't upscale
    );
    dw = Math.round(sw * scale);
    dh = Math.round(sh * scale);
  } else {
    // Ensure canvas dimensions are rounded integers
    dw = Math.round(dw);
    dh = Math.round(dh);
  }

  // Set canvas size
  destCanvas.width = dw;
  destCanvas.height = dh;

  let tx = 0;
  let ty = 0;
  let tw = dw;
  let th = dh;

  if (adjustments.borderType === 'white-fit') {
    const margin = Math.round(Math.min(dw, dh) * 0.05); // 5% border
    tx = margin;
    ty = margin;
    tw = dw - margin * 2;
    th = dh - margin * 2;
  } else if (adjustments.borderType === 'polaroid') {
    const margin = Math.round(Math.min(dw, dh) * 0.06);
    const bottomMargin = Math.round(margin * 3.5);
    tx = margin;
    ty = margin;
    tw = dw - margin * 2;
    th = dh - margin - bottomMargin;
  }

  // Draw background if border is active
  if (adjustments.borderType !== 'none') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, dw, dh);
  }

  // Draw the cropped source image onto destination canvas within calculated bounds
  ctx.drawImage(sourceImage, sx, sy, sw, sh, tx, ty, tw, th);

  // 3. Apply Pixel-Level Adjustments ONLY within image bounds
  const imgData = ctx.getImageData(tx, ty, tw, th);
  const data = imgData.data;
  const totalPixels = tw * th;

  // A. Sharpness (Convolution filter)
  if (adjustments.sharpness > 0) {
    // We need a source buffer for convolution
    const srcBuffer = new Uint8ClampedArray(data);
    const k = (adjustments.sharpness / 100) * 0.6; // Scale down for natural look
    const rowBytes = tw * 4;

    for (let y = 1; y < th - 1; y++) {
      const yRow = y * tw;
      for (let x = 1; x < tw - 1; x++) {
        const idx = (yRow + x) * 4;

        // Apply laplacian sharpening kernel:
        // [  0, -k,  0 ]
        // [ -k, 1+4k, -k ]
        // [  0, -k,  0 ]
        for (let c = 0; c < 3; c++) {
          const center = srcBuffer[idx + c];
          const up = srcBuffer[idx - rowBytes + c];
          const down = srcBuffer[idx + rowBytes + c];
          const left = srcBuffer[idx - 4 + c];
          const right = srcBuffer[idx + 4 + c];

          let val = center * (1 + 4 * k) - (up + down + left + right) * k;
          if (val < 0) val = 0;
          else if (val > 255) val = 255;
          data[idx + c] = val;
        }
      }
    }
  }

  // B. Precompute adjustment scalars to avoid inside-loop division
  const brightnessOffset = adjustments.brightness * 2.55;
  
  // Contrast factor formula
  const cVal = adjustments.contrast;
  const contrastFactor = (259 * (cVal + 255)) / (255 * (259 - cVal));

  // Saturation factor
  const sVal = adjustments.saturation;
  const saturationFactor = sVal >= 0 ? 1 + (sVal / 100) * 1.5 : 1 + (sVal / 100);

  // Warmth factors
  const wVal = adjustments.warmth;
  const warmthR = wVal * 0.6;
  const warmthG = wVal * 0.2;
  const warmthB = -wVal * 0.6;

  // Highlights and Shadows coefficients
  const highlightsOffset = adjustments.highlights * 0.4;
  const shadowsOffset = adjustments.shadows * 0.4;

  // Fade coefficients
  const fadeVal = adjustments.fade;
  const fadeScale = 1 - fadeVal / 100;
  const fadeOffset = (fadeVal / 100) * 35; // Lift black levels to soft grey/indigo

  // Grain setup (pre-generated noise table for speed)
  const hasGrain = adjustments.grain > 0;
  const grainTable = hasGrain ? new Float32Array(2048) : null;
  if (grainTable && hasGrain) {
    const grainScale = adjustments.grain * 0.7;
    for (let j = 0; j < 2048; j++) {
      grainTable[j] = (Math.random() - 0.5) * grainScale;
    }
  }

  // Loop through all pixels for fast CPU adjustment processing
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    let r = data[idx];
    let g = data[idx + 1];
    let b = data[idx + 2];

    // 1. Brightness
    if (brightnessOffset !== 0) {
      r += brightnessOffset;
      g += brightnessOffset;
      b += brightnessOffset;
    }

    // 2. Contrast
    if (cVal !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // 3. Highlights & Shadows
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    
    if (highlightsOffset !== 0 && lum > 128) {
      const hWeight = (lum - 128) / 128;
      const hAmt = highlightsOffset * hWeight;
      r += hAmt; g += hAmt; b += hAmt;
    }
    if (shadowsOffset !== 0 && lum < 128) {
      const sWeight = (128 - lum) / 128;
      const sAmt = shadowsOffset * sWeight;
      r += sAmt; g += sAmt; b += sAmt;
    }

    // 4. Saturation
    if (sVal !== 0) {
      const curLum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = curLum + (r - curLum) * saturationFactor;
      g = curLum + (g - curLum) * saturationFactor;
      b = curLum + (b - curLum) * saturationFactor;
    }

    // 5. Warmth (Color Temperature)
    if (wVal !== 0) {
      r += warmthR;
      g += warmthG;
      b += warmthB;
    }

    // 6. Fade (lifts shadows, flattens whites)
    if (fadeVal > 0) {
      r = r * fadeScale + fadeOffset;
      g = g * fadeScale + fadeOffset;
      b = b * fadeScale + fadeOffset;
    }

    // 7. Film Grain
    if (grainTable) {
      const noise = grainTable[i % 2048];
      r += noise;
      g += noise;
      b += noise;
    }

    // Clamp values to [0, 255]
    data[idx] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[idx + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[idx + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }

  // Put manipulated pixels back to canvas at target coordinates
  ctx.putImageData(imgData, tx, ty);

  // 4. Vignette (radial gradient multiplier - fast canvas native blend, clipped to photo bounds)
  if (adjustments.vignette > 0) {
    ctx.save();
    // Clip the vignette so it only applies inside the photo boundaries
    ctx.beginPath();
    ctx.rect(tx, ty, tw, th);
    ctx.clip();

    const cx = tx + tw / 2;
    const cy = ty + th / 2;
    const maxDist = Math.sqrt((tw / 2) * (tw / 2) + (th / 2) * (th / 2));
    const grad = ctx.createRadialGradient(cx, cy, maxDist * 0.2, cx, cy, maxDist);
    
    // Vignette opacity scales with adjustment value
    const opacity = (adjustments.vignette / 100) * 0.9;
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, `rgba(0,0,0,${opacity * 0.2})`);
    grad.addColorStop(1, `rgba(0,0,0,${opacity})`);

    ctx.fillStyle = grad;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillRect(tx, ty, tw, th);
    ctx.restore();
  }

  // 5. Draw 3D Text & Foreground Compositing
  const behindOverlays = textOverlays.filter((o) => o.blendMode === 'behind');
  const aboveOverlays = textOverlays.filter((o) => o.blendMode === 'above');
  const hasBehindText = behindOverlays.length > 0;

  // A. If using painted Brush Mask, capture the adjusted image pixels BEFORE drawing text
  let fgCanvas: HTMLCanvasElement | null = null;
  if (hasBehindText && maskCanvas) {
    fgCanvas = document.createElement('canvas');
    fgCanvas.width = dw;
    fgCanvas.height = dh;
    const fgCtx = fgCanvas.getContext('2d');
    if (fgCtx) {
      // Draw currently adjusted canvas (which contains the base image + all edits)
      fgCtx.drawImage(destCanvas, 0, 0);
      // Clip to maskCanvas alpha channel
      fgCtx.globalCompositeOperation = 'destination-in';
      fgCtx.drawImage(maskCanvas, 0, 0, dw, dh);
    }
  }

  // B. Draw Behind Text Overlays
  behindOverlays.forEach((overlay) => {
    drawTextOverlay(ctx, overlay, tx, ty, tw, th);
  });

  // C. Draw Foreground Subject (to overlay the text)
  if (hasBehindText) {
    if (foregroundImage) {
      // Draw uploaded transparent PNG cutout
      ctx.save();
      // Clip to photo boundaries so it doesn't bleed outside frames
      ctx.beginPath();
      ctx.rect(tx, ty, tw, th);
      ctx.clip();
      ctx.drawImage(foregroundImage, sx, sy, sw, sh, tx, ty, tw, th);
      ctx.restore();
    } else if (fgCanvas) {
      // Draw the painted brush mask foreground cutout
      ctx.drawImage(fgCanvas, 0, 0);
    }
  }

  // D. Draw Above Text Overlays
  aboveOverlays.forEach((overlay) => {
    drawTextOverlay(ctx, overlay, tx, ty, tw, th);
  });
}

/**
 * Helper to render styled text overlays on canvas with rotation and gradients.
 */
function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: TextOverlay,
  tx: number,
  ty: number,
  tw: number,
  th: number
): void {
  ctx.save();

  // Clip to image boundaries so text doesn't overflow white borders/frames
  ctx.beginPath();
  ctx.rect(tx, ty, tw, th);
  ctx.clip();

  // Calculate coordinates relative to photo boundaries (tx, ty, tw, th)
  const x = tx + (overlay.x / 100) * tw;
  const y = ty + (overlay.y / 100) * th;

  // Translate to target coordinate and rotate
  ctx.translate(x, y);
  ctx.rotate((overlay.rotation * Math.PI) / 180);

  // Set font size relative to photo height (scales proportionally on export!)
  const fontSizePx = Math.max(10, Math.round((overlay.fontSize / 100) * th));
  ctx.font = `bold ${fontSizePx}px "${overlay.fontFamily}", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = overlay.opacity / 100;

  // Set drop shadow
  if (overlay.shadowBlur > 0) {
    ctx.shadowColor = overlay.shadowColor;
    ctx.shadowBlur = overlay.shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.max(1, Math.round(fontSizePx * 0.03));
  }

  // Set fill style
  if (overlay.gradientColors && overlay.gradientColors.length === 2) {
    const textWidth = ctx.measureText(overlay.text).width;
    const grad = ctx.createLinearGradient(-textWidth / 2, 0, textWidth / 2, 0);
    grad.addColorStop(0, overlay.gradientColors[0]);
    grad.addColorStop(1, overlay.gradientColors[1]);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = overlay.color;
  }

  // Render fill
  ctx.fillText(overlay.text, 0, 0);

  ctx.restore();
}
