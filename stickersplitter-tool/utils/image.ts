
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
 * Removes background from an image using flood-fill from edges.
 * Only removes background pixels connected to the image border,
 * preserving internal areas. Applies soft alpha at edges for smooth results.
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

      // Flood-fill from all border pixels to mark connected background
      // 0 = unvisited, 1 = background (to remove), 2 = foreground (keep)
      const mask = new Uint8Array(w * h);

      // Use a manual stack-based flood fill to avoid call stack overflow
      const stack: number[] = [];

      // Seed the stack with all border pixels that match the background
      for (let x = 0; x < w; x++) {
        // Top row
        stack.push(x);
        // Bottom row
        stack.push((h - 1) * w + x);
      }
      for (let y = 1; y < h - 1; y++) {
        // Left column
        stack.push(y * w);
        // Right column
        stack.push(y * w + (w - 1));
      }

      // Soft edge tolerance: pixels within this extended range get partial alpha
      const softEdge = Math.min(tolerance * 0.5, 20);
      const outerTolerance = tolerance + softEdge;

      while (stack.length > 0) {
        const idx = stack.pop()!;
        if (mask[idx] !== 0) continue;

        const pi = idx * 4;
        const r = data[pi];
        const g = data[pi + 1];
        const b = data[pi + 2];

        const distance = Math.sqrt(
          (r - bgR) ** 2 +
          (g - bgG) ** 2 +
          (b - bgB) ** 2
        );

        if (distance < outerTolerance) {
          mask[idx] = 1; // mark as background

          const x = idx % w;
          const y = (idx - x) / w;

          // Add 4-connected neighbors
          if (x > 0) stack.push(idx - 1);
          if (x < w - 1) stack.push(idx + 1);
          if (y > 0) stack.push(idx - w);
          if (y < h - 1) stack.push(idx + w);
        } else {
          mask[idx] = 2; // foreground
        }
      }

      // Apply transparency based on mask
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 1) {
          const pi = i * 4;
          const r = data[pi];
          const g = data[pi + 1];
          const b = data[pi + 2];

          const distance = Math.sqrt(
            (r - bgR) ** 2 +
            (g - bgG) ** 2 +
            (b - bgB) ** 2
          );

          if (distance < tolerance) {
            // Fully transparent for core background
            data[pi + 3] = 0;
          } else {
            // Soft edge: gradual transparency for transition pixels
            const alpha = Math.round(((distance - tolerance) / softEdge) * 255);
            data[pi + 3] = Math.min(data[pi + 3], alpha);
          }
        }
        // mask[0] (unvisited interior) and mask[2] (foreground) stay opaque
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = sourceUrl;
  });
}
