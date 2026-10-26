// Flyers are saved as flyers/<random-id>.<ext>, never with the user's filename.
export const FLYER_PATH_RE = /^flyers\/[0-9a-f-]{36}\.(jpg|png|webp)$/;
export const MAX_FLYER_BYTES = 5 * 1024 * 1024;

export function flyerUrl(path: string | null | undefined) {
  return path ? `/uploads/${path}` : null;
}