
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
 * Removes background from an image URL by sampling the top-left pixel.
 * Uses Euclidean color distance to determine transparency.
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

      // Sample the target background color from the top-left pixel
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate Euclidean distance between current pixel and background color
        const distance = Math.sqrt(
          Math.pow(r - bgR, 2) + 
          Math.pow(g - bgG, 2) + 
          Math.pow(b - bgB, 2)
        );

        // If the color is similar enough to the background, make it transparent
        if (distance < tolerance) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = sourceUrl;
  });
}
