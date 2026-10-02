/**
 * Compress an image file using Canvas API.
 * Resizes to max dimension and converts to WebP.
 *
 * @param {File} file - Original image file
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Max width in px (default: 1920)
 * @param {number} options.maxHeight - Max height in px (default: 1920)
 * @param {number} options.quality - WebP quality 0-1 (default: 0.85)
 * @param {string} options.type - Output mime type (default: 'image/webp')
 * @returns {Promise<Blob>} Compressed image blob
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    type = 'image/webp',
  } = options;

  // If file is already small enough and already webp, skip compression
  if (file.type === 'image/webp' && file.size < 500 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          type,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image and return a File object (for FormData uploads).
 *
 * @param {File} file - Original image file
 * @param {Object} options - Compression options
 * @returns {Promise<File>} Compressed image as File
 */
export async function compressImageToFile(file, options = {}) {
  const blob = await compressImage(file, options);
  const extension = options.type === 'image/webp' ? 'webp' : 'jpg';
  const filename = file.name.replace(/\.[^/.]+$/, '') + '.' + extension;
  return new File([blob], filename, { type: options.type || 'image/webp' });
}
