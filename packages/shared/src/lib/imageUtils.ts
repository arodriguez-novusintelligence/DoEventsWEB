export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxOutputBytes?: number;
}

const DEFAULT_OPTS: Required<CompressImageOptions> = {
  maxWidth: 2400,
  maxHeight: 1200,
  quality: 0.82,
  maxOutputBytes: 4 * 1024 * 1024,
};

const COVER_MAX_INPUT_BYTES = 50 * 1024 * 1024;
const COVER_MAX_OUTPUT_BYTES = 20 * 1024 * 1024;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen. Prueba con JPG, PNG o WEBP.'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen'))),
      type,
      quality,
    );
  });
}

export async function prepareImageForUpload(
  file: File,
  options?: CompressImageOptions & { forceProcess?: boolean },
): Promise<File> {
  const opts = { ...DEFAULT_OPTS, ...options };
  const isImage = file.type.startsWith('image/');
  if (!isImage) throw new Error('Selecciona un archivo de imagen válido');

  if (!options?.forceProcess && file.size <= opts.maxOutputBytes && file.size <= 1_500_000) {
    return file;
  }

  const img = await loadImageFromFile(file);
  let { width, height } = img;
  const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');
  ctx.drawImage(img, 0, 0, width, height);

  let quality = opts.quality;
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  while (blob.size > opts.maxOutputBytes && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'cover';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

export async function prepareCoverImageForUpload(file: File): Promise<File> {
  const isImage = file.type.startsWith('image/');
  if (!isImage) throw new Error('Selecciona un archivo de imagen válido');

  if (file.size > COVER_MAX_INPUT_BYTES) {
    throw new Error('La imagen supera 50 MB. Comprímela un poco e inténtalo de nuevo.');
  }

  if (file.type === 'image/jpeg' && file.size <= COVER_MAX_OUTPUT_BYTES) {
    return file;
  }

  return prepareImageForUpload(file, {
    maxWidth: 4096,
    maxHeight: 4096,
    quality: 0.9,
    maxOutputBytes: COVER_MAX_OUTPUT_BYTES,
    forceProcess: true,
  });
}

const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export function validateProfileImageFile(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona una imagen válida (JPG, PNG o WEBP).');
  }
  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    throw new Error(`La imagen supera el máximo de ${formatFileSize(PROFILE_IMAGE_MAX_BYTES)}.`);
  }
  if (file.type && !PROFILE_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    throw new Error('Formato no soportado. Usa JPG, PNG o WEBP.');
  }
}

export async function prepareProfileAvatarForUpload(file: File): Promise<File> {
  validateProfileImageFile(file);
  if (file.size <= 1_500_000) return file;
  return prepareImageForUpload(file, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.88,
    maxOutputBytes: PROFILE_IMAGE_MAX_BYTES,
    forceProcess: true,
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
