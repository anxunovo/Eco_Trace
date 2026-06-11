/**
 * Compress an image for API upload.
 * Target: max 800px longest side, JPEG 0.7 quality.
 * Returns base64 data URL.
 */
export async function compressForApi(fileOrDataUrl, maxWidth = 800, quality = 0.7) {
  const img = await loadImage(fileOrDataUrl);
  const canvas = document.createElement('canvas');
  let { width, height } = img;

  if (width > maxWidth || height > maxWidth) {
    if (width > height) {
      height = Math.round(height * maxWidth / width);
      width = maxWidth;
    } else {
      width = Math.round(width * maxWidth / height);
      height = maxWidth;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Get image file size in bytes from a base64 data URL.
 */
export function getBase64Size(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  return Math.ceil(base64.length * 3 / 4);
}

/**
 * Validate images for API upload.
 * Max 5 images, each max 4MB.
 */
export function validateImages(images) {
  const errors = [];
  if (images.length === 0) errors.push('至少上传一张图片');
  if (images.length > 5) errors.push('最多上传5张图片');
  for (let i = 0; i < images.length; i++) {
    const size = getBase64Size(images[i]);
    if (size > 4 * 1024 * 1024) errors.push(`图片${i + 1}超过4MB限制`);
  }
  return errors;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
