export function preloadImage(url: string): Promise<boolean> {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = async () => {
      try {
        if (image.decode) await image.decode();
      } catch {}
      resolve(true);
    };
    image.onerror = () => resolve(false);
    image.src = url;
  });
}
