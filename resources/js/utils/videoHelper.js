/**
 * Convert YouTube URL to embed URL format
 * Handles:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID (returns as-is)
 * - https://vimeo.com/VIDEO_ID
 */
export function toEmbedUrl(url) {
  if (!url) return '';

  // If already an embed URL, return as-is
  if (url.includes('/embed/')) {
    return url;
  }

  // YouTube watch URL: youtube.com/watch?v=VIDEO_ID
  const youtubeWatchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (youtubeWatchMatch) {
    return `https://www.youtube.com/embed/${youtubeWatchMatch[1]}`;
  }

  // Shortened YouTube URL: youtu.be/VIDEO_ID
  const youtubeShortenedMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (youtubeShortenedMatch) {
    return `https://www.youtube.com/embed/${youtubeShortenedMatch[1]}`;
  }

  // Vimeo URL: vimeo.com/VIDEO_ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Return original if no match (assume already correct)
  return url;
}
