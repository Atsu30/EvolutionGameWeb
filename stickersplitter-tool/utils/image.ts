
/**
 * Converts a File object to a Base64 string.
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the prefix (data:image/png;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Splits a source image into a grid of smaller images.
 */
export async function splitImage(sourceUrl: string, rows: number, cols: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const results: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No context');

      const cellWidth = img.width / cols;
      const cellHeight = img.height / rows;

      canvas.width = cellWidth;
      canvas.height = cellHeight;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.clearRect(0, 0, cellWidth, cellHeight);
          ctx.drawImage(
            img,
            c * cellWidth, r * cellHeight, cellWidth, cellHeight,
            0, 0, cellWidth, cellHeight
          );
          results.push(canvas.toDataURL('image/png'));
        }
      }
      resolve(results);
    };
    img.onerror = reject;
    img.src = sourceUrl;
  });
}

/**
 * Detects the background color by sampling multiple points along the edges.
 * Returns the most common color among edge samples.
 */
function detectBackgroundColor(data: Uint8ClampedArray, width: number, height: number): [number, number, number] {
  const samples: [number, number, number][] = [];

  // Sample points: 4 corners + midpoints of each edge
  const points = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1], // corners
    [Math.floor(width / 2), 0], [Math.floor(width / 2), height - 1],   // top/bottom center
    [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)],   // left/right center
  ];

  for (const [x, y] of points) {
    const i = (y * width + x) * 4;
    if (data[i + 3] > 0) { // skip fully transparent pixels
      samples.push([data[i], data[i + 1], data[i + 2]]);
    }
  }

  if (samples.length === 0) return [255, 255, 255];

  // Group similar colors (within distance 30) and pick the largest cluster
  const used = new Array(samples.length).fill(false);
  let bestCluster: [number, number, number][] = [];

  for (let i = 0; i < samples.length; i++) {
    if (used[i]) continue;
    const cluster: [number, number, number][] = [samples[i]];
    used[i] = true;
    for (let j = i + 1; j < samples.length; j++) {
      if (used[j]) continue;
      const dist = Math.sqrt(
        (samples[i][0] - samples[j][0]) ** 2 +
        (samples[i][1] - samples[j][1]) ** 2 +
        (samples[i][2] - samples[j][2]) ** 2
      );
      if (dist < 30) {
        cluster.push(samples[j]);
        used[j] = true;
      }
    }
    if (cluster.length > bestCluster.length) {
      bestCluster = cluster;
    }
  }

  // Average the largest cluster
  const avg: [number, number, number] = [0, 0, 0];
  for (const c of bestCluster) {
    avg[0] += c[0];
    avg[1] += c[1];
    avg[2] += c[2];
  }
  return [
    Math.round(avg[0] / bestCluster.length),
    Math.round(avg[1] / bestCluster.length),
    Math.round(avg[2] / bestCluster.length),
  ];
}

/**
 * Removes background from an image using global color matching + color despill.
 *
 * 1. Detects background color from edge samples
 * 2. Removes ALL pixels matching the background (including internal areas)
 * 3. Applies soft alpha at transition edges for smooth anti-aliasing
 * 4. Runs color decontamination (despill) to remove background color bleed
 *    from semi-transparent and near-edge opaque pixels
 */
export async function removeBackground(sourceUrl: string, tolerance: number = 30): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return reject('No context');

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Detect background color from edge samples
      const [bgR, bgG, bgB] = detectBackgroundColor(data, w, h);

      // Soft edge range: pixels between tolerance and outerTolerance get partial alpha
      const softEdge = Math.max(tolerance * 0.4, 8);
      const outerTolerance = tolerance + softEdge;

      // Pass 1: Global color matching — remove all pixels similar to background
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const distance = Math.sqrt(
          (r - bgR) ** 2 +
          (g - bgG) ** 2 +
          (b - bgB) ** 2
        );

        if (distance < tolerance) {
          data[i + 3] = 0; // fully transparent
        } else if (distance < outerTolerance) {
          // Soft edge: gradual alpha
          const alpha = Math.round(((distance - tolerance) / softEdge) * 255);
          data[i + 3] = Math.min(data[i + 3], alpha);
        }
      }

      // Pass 2: Color decontamination (despill)
      // Remove background color bleed from semi-transparent edge pixels
      // and from opaque pixels that are adjacent to transparent ones.
      //
      // For semi-transparent pixels, reverse alpha blending to recover
      // the true foreground color:
      //   displayed = alpha * foreground + (1 - alpha) * background
      //   foreground = (displayed - (1 - alpha) * background) / alpha

      // First, build a flag for pixels adjacent to any transparent pixel
      const adjacentToTransparent = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          if (data[idx * 4 + 3] === 0) continue; // skip transparent
          // Check 8-connected neighbors
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
              if (data[(ny * w + nx) * 4 + 3] === 0) {
                adjacentToTransparent[idx] = 1;
                break;
              }
            }
            if (adjacentToTransparent[idx]) break;
          }
        }
      }

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a === 0) continue; // skip fully transparent

        const pixelIdx = i / 4;
        const isSemiTransparent = a < 255;
        const isEdgePixel = adjacentToTransparent[pixelIdx] === 1;

        if (isSemiTransparent || isEdgePixel) {
          const alpha = a / 255;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Strength of despill: full for semi-transparent, partial for opaque edge pixels
          const strength = isSemiTransparent ? 1.0 : 0.6;

          // Reverse the alpha blending to estimate true foreground color
          const fgR = r + strength * (1 - alpha) * (r - bgR);
          const fgG = g + strength * (1 - alpha) * (g - bgG);
          const fgB = b + strength * (1 - alpha) * (b - bgB);

          data[i]     = Math.max(0, Math.min(255, Math.round(fgR)));
          data[i + 1] = Math.max(0, Math.min(255, Math.round(fgG)));
          data[i + 2] = Math.max(0, Math.min(255, Math.round(fgB)));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = sourceUrl;
  });
}
