// Browser-side cache of preloaded template images. Keys by URL so re-rendering
// the same template doesn't refetch.
const cache = new Map<string, Promise<HTMLImageElement>>();

export function loadTemplateImage(url: string): Promise<HTMLImageElement> {
  const hit = cache.get(url);
  if (hit) return hit;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      cache.delete(url);
      reject(new Error(`Failed to load template image: ${url}`));
    };
    img.src = url;
  });

  cache.set(url, promise);
  return promise;
}

export function _resetTemplateImageCache(): void {
  cache.clear();
}
