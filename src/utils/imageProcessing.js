import imageCompression from 'browser-image-compression';

// Preset filter configurations
export const PRESETS = {
  sunlit: {
    name: 'Sunlit Showcase',
    exposure: 20,
    contrast: 110,
    saturation: 105,
    warmth: 10
  },
  crisp: {
    name: 'Crisp Professional',
    exposure: 5,
    contrast: 115,
    saturation: 90,
    sharpness: 15
  },
  evening: {
    name: 'Evening Appeal',
    exposure: 25,
    shadows: 30,
    contrast: 105,
    saturation: 110,
    warmth: 20
  }
};

// iOS-style advanced auto-adjust function with intelligent image analysis
export const analyzeImageForAutoAdjust = (canvas, ctx) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const pixelCount = data.length / 4;
  
  // Initialize comprehensive analysis structures
  const analysis = {
    histogram: {
      r: new Array(256).fill(0),
      g: new Array(256).fill(0),
      b: new Array(256).fill(0),
      luma: new Array(256).fill(0)
    },
    stats: {
      avgR: 0, avgG: 0, avgB: 0, avgLuma: 0,
      minLuma: 255, maxLuma: 0,
      shadows: 0, midtones: 0, highlights: 0,
      underexposed: 0, overexposed: 0,
      totalSaturation: 0,
      colorBalance: { r: 0, g: 0, b: 0 }
    },
    zones: {
      // Divide image into 9 zones for local analysis (iOS-style)
      grid: Array(9).fill(0).map(() => ({ brightness: 0, count: 0 }))
    }
  };
  
  // First pass: Build histograms and collect statistics
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate luminance using ITU-R BT.709 formula (iOS standard)
    const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    
    // Update histograms
    analysis.histogram.r[r]++;
    analysis.histogram.g[g]++;
    analysis.histogram.b[b]++;
    analysis.histogram.luma[luma]++;
    
    // Accumulate for averages
    analysis.stats.avgR += r;
    analysis.stats.avgG += g;
    analysis.stats.avgB += b;
    analysis.stats.avgLuma += luma;
    
    // Track min/max
    analysis.stats.minLuma = Math.min(analysis.stats.minLuma, luma);
    analysis.stats.maxLuma = Math.max(analysis.stats.maxLuma, luma);
    
    // Categorize pixels by tonal range
    if (luma < 64) analysis.stats.shadows++;
    else if (luma < 192) analysis.stats.midtones++;
    else analysis.stats.highlights++;
    
    // Check for clipping
    if (luma < 5) analysis.stats.underexposed++;
    if (luma > 250) analysis.stats.overexposed++;
    
    // Calculate saturation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    analysis.stats.totalSaturation += saturation;
    
    // Zone-based analysis (3x3 grid)
    const pixelIndex = i / 4;
    const x = pixelIndex % canvas.width;
    const y = Math.floor(pixelIndex / canvas.width);
    const zoneX = Math.floor(x / (canvas.width / 3));
    const zoneY = Math.floor(y / (canvas.height / 3));
    const zoneIndex = Math.min(8, zoneY * 3 + zoneX);
    analysis.zones.grid[zoneIndex].brightness += luma;
    analysis.zones.grid[zoneIndex].count++;
  }
  
  // Calculate averages
  analysis.stats.avgR /= pixelCount;
  analysis.stats.avgG /= pixelCount;
  analysis.stats.avgB /= pixelCount;
  analysis.stats.avgLuma /= pixelCount;
  const avgSaturation = analysis.stats.totalSaturation / pixelCount;
  
  // Calculate zone averages
  analysis.zones.grid.forEach(zone => {
    if (zone.count > 0) {
      zone.brightness /= zone.count;
    }
  });
  
  // Find percentiles (iOS uses these for intelligent adjustments)
  const getPercentile = (histogram, percentile) => {
    const threshold = pixelCount * percentile;
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += histogram[i];
      if (sum >= threshold) return i;
    }
    return 255;
  };
  
  const blackPoint = getPercentile(analysis.histogram.luma, 0.002);
  const shadowPoint = getPercentile(analysis.histogram.luma, 0.1);
  const quarterPoint = getPercentile(analysis.histogram.luma, 0.25);
  const midPoint = getPercentile(analysis.histogram.luma, 0.5);
  const threeQuarterPoint = getPercentile(analysis.histogram.luma, 0.75);
  const highlightPoint = getPercentile(analysis.histogram.luma, 0.9);
  const whitePoint = getPercentile(analysis.histogram.luma, 0.998);
  
  // Detect scene type (iOS-style scene detection)
  const shadowRatio = analysis.stats.shadows / pixelCount;
  const highlightRatio = analysis.stats.highlights / pixelCount;
  const underexposedRatio = analysis.stats.underexposed / pixelCount;
  const overexposedRatio = analysis.stats.overexposed / pixelCount;
  
  const isLowKey = shadowRatio > 0.6 && analysis.stats.avgLuma < 80;
  const isHighKey = highlightRatio > 0.5 && analysis.stats.avgLuma > 176;
  const isBacklit = shadowRatio > 0.3 && highlightRatio > 0.25 && 
                    (analysis.zones.grid[4].brightness < analysis.stats.avgLuma * 0.7);
  const hasLowContrast = (whitePoint - blackPoint) < 160;
  const isFlat = (threeQuarterPoint - quarterPoint) < 50;
  
  // Detect color cast
  const expectedG = (analysis.stats.avgR + analysis.stats.avgB) / 2;
  const greenCast = (analysis.stats.avgG - expectedG) / 255;
  const warmthCast = (analysis.stats.avgR - analysis.stats.avgB) / 255;
  
  // Initialize iOS-style adjustments
  const adjustments = {
    exposure: 0,
    highlights: 0,
    shadows: 0,
    contrast: 100,
    brightness: 0,
    saturation: 100,
    vibrance: 0,
    warmth: 0,
    tint: 0,
    sharpness: 0,
    vignette: 0
  };
  
  // EXPOSURE CORRECTION (Primary adjustment)
  if (!isLowKey && !isHighKey) {
    // Target optimal middle gray (iOS targets ~118 for middle gray)
    const targetMid = 118;
    const exposureCorrection = (targetMid - midPoint) / 128;
    
    // Apply S-curve to prevent overcorrection
    const correction = Math.tanh(exposureCorrection * 1.5);
    adjustments.exposure = Math.round(correction * 35);
    
    // Fine-tune based on zones (face/subject detection simulation)
    const centerBrightness = analysis.zones.grid[4].brightness;
    if (centerBrightness < analysis.stats.avgLuma * 0.8) {
      // Center is darker - likely subject
      adjustments.exposure += 5;
    }
  } else if (isLowKey) {
    // Preserve artistic intent but lift deep shadows
    adjustments.exposure = Math.round(Math.min(10, (80 - analysis.stats.avgLuma) * 0.15));
  } else if (isHighKey) {
    // Preserve bright aesthetic
    adjustments.exposure = Math.round(Math.max(-10, (176 - analysis.stats.avgLuma) * 0.1));
  }
  
  // HIGHLIGHTS RECOVERY (iOS-style highlight management)
  if (overexposedRatio > 0.01 || whitePoint > 248) {
    // Progressive highlight recovery
    const severity = Math.min(1, overexposedRatio * 50 + (whitePoint - 248) / 7);
    adjustments.highlights = -Math.round(severity * 45);
  } else if (highlightPoint < 200 && !isHighKey) {
    // Boost weak highlights for more pop
    adjustments.highlights = Math.round((200 - highlightPoint) * 0.25);
  }
  
  // SHADOW LIFTING (Intelligent shadow detail recovery)
  if (isBacklit) {
    // Aggressive shadow lifting for backlit scenes
    adjustments.shadows = Math.round(Math.min(60, (60 - shadowPoint) * 0.8));
  } else if (underexposedRatio > 0.05 || blackPoint > 10) {
    // Lift crushed blacks
    const severity = Math.min(1, underexposedRatio * 10 + (blackPoint - 10) / 20);
    adjustments.shadows = Math.round(severity * 35);
  } else if (shadowPoint < 35 && !isLowKey) {
    // General shadow brightening
    adjustments.shadows = Math.round((35 - shadowPoint) * 0.6);
  }
  
  // CONTRAST OPTIMIZATION (Adaptive tone curve)
  if (hasLowContrast || isFlat) {
    // Boost contrast for flat images
    const boost = Math.min(25, (160 - (whitePoint - blackPoint)) * 0.15);
    adjustments.contrast = Math.round(100 + boost);
    
    // Add micro-contrast via S-curve simulation
    if (isFlat) {
      adjustments.contrast += 5;
    }
  } else if ((whitePoint - blackPoint) > 235 && !isBacklit) {
    // Slight reduction for very high contrast
    adjustments.contrast = 97;
  } else {
    // iOS-style micro-contrast enhancement
    adjustments.contrast = 103;
  }
  
  // COLOR OPTIMIZATION
  // Saturation (context-aware)
  if (avgSaturation < 0.15) {
    // Boost very desaturated images
    adjustments.saturation = Math.round(100 + Math.min(20, (0.2 - avgSaturation) * 100));
    adjustments.vibrance = 15; // Protect skin tones
  } else if (avgSaturation > 0.5) {
    // Tame oversaturated images
    adjustments.saturation = 95;
  } else {
    // Subtle enhancement for normal images
    adjustments.saturation = 105;
    adjustments.vibrance = 8;
  }
  
  // Color cast correction (iOS-style white balance)
  if (Math.abs(greenCast) > 0.02) {
    // Fix green/magenta cast
    adjustments.tint = Math.round(-greenCast * 30);
  }
  
  if (Math.abs(warmthCast) > 0.03) {
    // Fix warm/cool cast
    adjustments.warmth = Math.round(-warmthCast * 25);
  }
  
  // DETAIL ENHANCEMENT
  // Smart sharpening based on image quality
  if (analysis.stats.avgLuma > 50 && analysis.stats.avgLuma < 200) {
    // Good lighting conditions
    adjustments.sharpness = 8;
  } else {
    // Reduce sharpening in extreme lighting
    adjustments.sharpness = 4;
  }
  
  // Subtle vignette for professional look (iOS sometimes adds this)
  if (analysis.zones.grid[4].brightness > analysis.stats.avgLuma * 1.1) {
    // Center is brighter - add subtle vignette
    adjustments.vignette = 5;
  }
  
  // Final adjustments based on scene type
  if (isBacklit) {
    // Extra tweaks for backlit scenes
    adjustments.vibrance = Math.min(adjustments.vibrance + 5, 20);
    adjustments.contrast = Math.max(adjustments.contrast - 3, 95);
  }
  
  return adjustments;
};

export const applyImageEdits = (canvas, ctx, img, edits, preset = null) => {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Save original state
  ctx.save();
  
  // Apply base image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  // Get combined edits (preset + manual)
  const combinedEdits = getCombinedEdits(edits, preset);
  
  // Apply CSS filters first
  ctx.filter = buildFilterString(combinedEdits);
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';
  
  // Apply pixel-level adjustments
  if (combinedEdits.shadows !== 0 || combinedEdits.highlights !== 0) {
    applyShadowsHighlights(ctx, canvas, combinedEdits.shadows, combinedEdits.highlights);
  }
  
  if (combinedEdits.warmth !== 0 || combinedEdits.tint !== 0) {
    applyColorBalance(ctx, canvas, combinedEdits.warmth, combinedEdits.tint);
  }
  
  if (combinedEdits.vibrance !== 0) {
    applyVibrance(ctx, canvas, combinedEdits.vibrance);
  }
  
  if (combinedEdits.sharpness !== 0) {
    applySharpness(ctx, canvas, combinedEdits.sharpness);
  }
  
  if (combinedEdits.vignette !== 0) {
    applyVignette(ctx, canvas, combinedEdits.vignette);
  }
  
  // Restore state
  ctx.restore();
};

const getCombinedEdits = (manualEdits, presetKey) => {
  const preset = presetKey ? PRESETS[presetKey] : {};
  
  return {
    exposure: (preset.exposure || 0) + (manualEdits.exposure || 0),
    highlights: (preset.highlights || 0) + (manualEdits.highlights || 0),
    shadows: (preset.shadows || 0) + (manualEdits.shadows || 0),
    contrast: ((preset.contrast || 100) * (manualEdits.contrast || 100)) / 100,
    brightness: (preset.brightness || 0) + (manualEdits.brightness || 0),
    saturation: ((preset.saturation || 100) * (manualEdits.saturation || 100)) / 100,
    vibrance: (preset.vibrance || 0) + (manualEdits.vibrance || 0),
    warmth: (preset.warmth || 0) + (manualEdits.warmth || 0),
    tint: (preset.tint || 0) + (manualEdits.tint || 0),
    sharpness: (preset.sharpness || 0) + (manualEdits.sharpness || 0),
    vignette: (preset.vignette || 0) + (manualEdits.vignette || 0)
  };
};

const buildFilterString = (edits) => {
  const filters = [];
  
  // Exposure affects overall brightness
  if (edits.exposure !== 0) {
    filters.push(`brightness(${100 + edits.exposure}%)`);
  }
  
  // Additional brightness adjustment
  if (edits.brightness !== 0) {
    filters.push(`brightness(${100 + edits.brightness}%)`);
  }
  
  if (edits.contrast !== 100) {
    filters.push(`contrast(${edits.contrast}%)`);
  }
  
  if (edits.saturation !== 100) {
    filters.push(`saturate(${edits.saturation}%)`);
  }
  
  return filters.join(' ');
};

const applyShadowsHighlights = (ctx, canvas, shadows, highlights) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    
    // Apply shadows adjustment (affects darker pixels more)
    if (shadows !== 0 && luma < 128) {
      const shadowFactor = 1 - (luma / 128);
      const adjustment = shadows * shadowFactor * 0.5;
      data[i] = Math.min(255, Math.max(0, data[i] + adjustment));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjustment));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjustment));
    }
    
    // Apply highlights adjustment (affects brighter pixels more)
    if (highlights !== 0 && luma > 128) {
      const highlightFactor = (luma - 128) / 127;
      const adjustment = highlights * highlightFactor * 0.5;
      data[i] = Math.min(255, Math.max(0, data[i] + adjustment));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjustment));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjustment));
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

const applyColorBalance = (ctx, canvas, warmth, tint) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Warmth adjustment (orange-blue axis)
    if (warmth !== 0) {
      data[i] = Math.min(255, Math.max(0, data[i] + (warmth * 0.5))); // Red
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (warmth * 0.2))); // Green
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] - (warmth * 0.3))); // Blue
    }
    
    // Tint adjustment (green-magenta axis)
    if (tint !== 0) {
      data[i] = Math.min(255, Math.max(0, data[i] - (tint * 0.2))); // Red
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (tint * 0.4))); // Green
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] - (tint * 0.2))); // Blue
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

const applyVibrance = (ctx, canvas, amount) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  const amt = amount / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const max = Math.max(r, g, b);
    const avg = (r + g + b) / 3;
    const saturation = max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
    
    // Vibrance affects less saturated colors more
    const vibranceFactor = (1 - saturation) * amt;
    
    data[i] = Math.min(255, Math.max(0, r + (r - avg) * vibranceFactor));
    data[i + 1] = Math.min(255, Math.max(0, g + (g - avg) * vibranceFactor));
    data[i + 2] = Math.min(255, Math.max(0, b + (b - avg) * vibranceFactor));
  }
  
  ctx.putImageData(imageData, 0, 0);
};

const applyVignette = (ctx, canvas, amount) => {
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const vignetteFactor = 1 - (dist / maxDist) * (amount / 100);
      
      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, Math.max(0, data[idx] * vignetteFactor));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] * vignetteFactor));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] * vignetteFactor));
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

const applySharpness = (ctx, canvas, amount) => {
  // Simple sharpness implementation using convolution
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  const factor = amount / 100;
  const bias = 0;
  
  // Sharpen kernel
  const kernel = [
    0, -factor, 0,
    -factor, 1 + 4 * factor, -factor,
    0, -factor, 0
  ];
  
  const output = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let value = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            value += data[idx] * kernel[kernelIdx];
          }
        }
        const outputIdx = (y * width + x) * 4 + c;
        output[outputIdx] = Math.min(255, Math.max(0, value + bias));
      }
    }
  }
  
  const outputImageData = new ImageData(output, width, height);
  ctx.putImageData(outputImageData, 0, 0);
};

export const processImageForExport = async (photo) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = async () => {
      // Set canvas size (max width 1920px for MLS compliance)
      const maxWidth = 1920;
      const scale = Math.min(1, maxWidth / img.width);
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // Apply edits
      applyImageEdits(canvas, ctx, img, photo.edits, photo.edits.preset);
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        // Compress if needed
        if (blob.size > 5 * 1024 * 1024) { // If larger than 5MB
          const compressedBlob = await imageCompression(blob, {
            maxSizeMB: 5,
            maxWidthOrHeight: 1920,
            useWebWorker: true
          });
          resolve(compressedBlob);
        } else {
          resolve(blob);
        }
      }, 'image/jpeg', 0.95);
    };
    
    img.src = photo.original;
  });
};

export const generateFilename = (originalName, index, address = null) => {
  const extension = originalName.split('.').pop();
  const baseName = address || originalName.split('.')[0];
  const cleanName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${cleanName}_${String(index + 1).padStart(2, '0')}.${extension}`;
};
