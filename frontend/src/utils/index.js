// Tập hợp các hàm tiện ích (utility functions) dùng chung trong toàn bộ frontend.

/**
 * Converts an ImgBB viewer URL (https://ibb.co/HASH) to a direct image URL
 * (https://i.ibb.co/HASH/image). Also accepts already-direct i.ibb.co links
 * and any other image URL unchanged.
 */
/**
 * Extracts the embed URL from a YouTube iframe code or normalises a raw
 * YouTube watch/short URL into an embed URL. Accepts:
 *   • Full <iframe … src="https://www.youtube.com/embed/ID"> code
 *   • https://www.youtube.com/embed/ID  (already embed)
 *   • https://www.youtube.com/watch?v=ID
 *   • https://youtu.be/ID
 * Returns the clean embed URL so it can be stored in the DB and
 * rendered directly in an <iframe>.
 */
// Chuẩn hóa mọi dạng link/iframe YouTube về dạng embed URL để dùng trong <iframe>.
export function resolveVideoUrl(input) {
  if (!input) return '';
  const s = input.trim();

  // Case 1: full <iframe> code — extract src attribute
  const iframeSrc = s.match(/\bsrc=["']([^"']+)["']/);
  if (iframeSrc) return iframeSrc[1];

  // Case 2: already an embed URL
  if (/youtube\.com\/embed\//.test(s)) return s;

  // Case 3: watch URL  https://www.youtube.com/watch?v=ID
  const watchMatch = s.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  // Case 4: short URL  https://youtu.be/ID
  const shortMatch = s.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  return s;
}

// Chuyển đổi URL viewer của ImgBB (ibb.co/HASH) sang URL ảnh trực tiếp (i.ibb.co/HASH/image.png).
// Nếu đã là i.ibb.co hoặc URL khác thì giữ nguyên.
export function resolveImageUrl(url) {
  if (!url) return '';
  // Already a direct ImgBB link — use as-is
  if (/i\.ibb\.co/.test(url)) return url;
  // Viewer URL: https://ibb.co/HASH  →  https://i.ibb.co/HASH/image.png
  // i.ibb.co ignores the filename — only the hash matters — but an extension is required.
  const match = url.match(/^https?:\/\/(?:www\.)?ibb\.co\/([A-Za-z0-9]+)\/?$/);
  if (match) return `https://i.ibb.co/${match[1]}/image.png`;
  return url;
}

