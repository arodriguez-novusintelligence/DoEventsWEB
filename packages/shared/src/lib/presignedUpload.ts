/**
 * Subida directa a URL prefirmada de S3 vía XHR (más fiable que fetch en navegadores).
 */
export async function putBlobToPresignedUrl(
  url: string,
  body: Blob,
  contentType: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`El almacenamiento respondió ${xhr.status}`));
    };
    xhr.onerror = () => {
      reject(new Error(
        'No se pudo subir el archivo al almacenamiento. Verifica tu conexión e intenta de nuevo.',
      ));
    };
    xhr.send(body);
  });
}
