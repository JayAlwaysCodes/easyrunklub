import { randomUUID } from "crypto";
import { access, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

import { FLYER_PATH_RE } from "@/lib/uploads";

// On the VPS, set UPLOAD_DIR to an absolute path (and include it in backups).
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "storage", "uploads");

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Decide the type from the file's actual bytes, not its name or claimed type.
export function detectImageExt(bytes: Buffer): "jpg" | "png" | "webp" | null {
  if (bytes.length > 12) {
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
    if (
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
    ) {
      return "png";
    }
    if (
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    ) {
      return "webp";
    }
  }
  return null;
}

// Checks it's a real image, shrinks it, and saves it as WebP.
// Returns the stored path ("flyers/....webp"), or null if it can't be used.
export async function saveFlyer(bytes: Buffer): Promise<string | null> {
  if (!detectImageExt(bytes)) return null;

  let output: Buffer;
  try {
    output = await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate() // respect phone orientation; also drops hidden EXIF/GPS data
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return null;
  }

  const relativePath = `flyers/${randomUUID()}.webp`;
  const fullPath = path.join(UPLOAD_DIR, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, output);
  return relativePath;
}

export async function uploadExists(relativePath: string) {
  if (!FLYER_PATH_RE.test(relativePath)) return false;
  try {
    await access(path.join(UPLOAD_DIR, relativePath));
    return true;
  } catch {
    return false;
  }
}

export async function readUpload(relativePath: string) {
  // The strict pattern is what stops anyone from reading other files (../ tricks).
  if (!FLYER_PATH_RE.test(relativePath)) return null;
  try {
    const data = await readFile(path.join(UPLOAD_DIR, relativePath));
    const ext = relativePath.split(".").pop() as string;
    return { data, mime: MIME_BY_EXT[ext] };
  } catch {
    return null;
  }
}