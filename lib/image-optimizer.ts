/**
 * Otimiza imagens (prints de comentários / vídeos) no navegador antes de enviar para a API da OpenAI Vision.
 *
 * Por que isso reduz drasticamente os tokens de entrada (Input Tokens)?
 * - No modo Vision da OpenAI (especialmente no gpt-4o-mini, onde cada bloco de 512x512 custa 5.667 tokens + 2.833 base),
 *   um print sem redimensionar que passe de 1024px de largura ou 512px de altura é fatiado em 4 a 6 blocos (25.500 a 36.835 tokens por print!).
 * - Ao limitar o print a no máximo 1000x500px (ou 800x450px) em JPEG otimizado, garantimos no máximo 1 a 2 blocos,
 *   reduzindo o consumo de tokens de imagem em 60% a 80% sem perder nitidez para leitura do texto (OCR).
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.readAsDataURL(file);
  });

  return optimizeImageDataUrl(rawDataUrl, options);
}

export async function optimizeImageDataUrl(
  dataUrl: string,
  options: OptimizeImageOptions = {}
): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  const maxWidth = options.maxWidth ?? 960;
  const maxHeight = options.maxHeight ?? 480;
  const quality = options.quality ?? 0.82;

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;

        // Calcula proporção para caber estritamente dentro de maxWidth x maxHeight (máx 2 blocos de 512x512)
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Fundo branco caso seja PNG com transparência
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, width, height);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
