export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;

  try {
    const url = new URL(input);
    const hostname = url.hostname.replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id || null;
    }

    if (hostname.endsWith('youtube.com')) {
      if (url.pathname.startsWith('/watch')) {
        return url.searchParams.get('v');
      }

      const pathParts = url.pathname.split('/').filter(Boolean);
      const embedIndex = pathParts.indexOf('embed');
      if (embedIndex !== -1 && pathParts[embedIndex + 1]) {
        return pathParts[embedIndex + 1];
      }

      const shortsIndex = pathParts.indexOf('shorts');
      if (shortsIndex !== -1 && pathParts[shortsIndex + 1]) {
        return pathParts[shortsIndex + 1];
      }
    }
  } catch (_) {
    const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
    if (watchMatch) return watchMatch[1];
    const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
    if (shortMatch) return shortMatch[1];
    const embedMatch = input.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
    if (embedMatch) return embedMatch[1];
    const shortsMatch = input.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
    if (shortsMatch) return shortsMatch[1];
  }

  return null;
}

export function toYouTubeEmbedUrl(input: string): string {
  const id = extractYouTubeVideoId(input);
  if (!id) return input;

  const params = new URLSearchParams({
    rel: '0',
    playsinline: '1',
  });

  if (typeof window !== 'undefined' && window.location.origin) {
    params.set('origin', window.location.origin);
  }

  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function toYouTubeThumbnailUrl(input: string): string | null {
  const id = extractYouTubeVideoId(input);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
