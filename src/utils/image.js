import { validateImageFile } from './validation';

/**
 * Validate and compress an uploaded image in the browser.
 * Resizes to fit within `maxDim` and re-encodes as JPEG so the
 * resulting data URL is small enough for Local Storage.
 */
export const compressImage = (file, { maxDim = 1200, quality = 0.78 } = {}) =>
  new Promise((resolve, reject) => {
    const err = validateImageFile(file);
    if (err) {
      reject(new Error(err));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('The selected file is not a valid image.'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export const dataUrlSizeKB = (dataUrl = '') => Math.round((dataUrl.length * 3) / 4 / 1024);
