import { NextResponse } from "next/server";

import { requireAdmin } from "@/server/auth/require-admin";
import { saveFlyer } from "@/server/storage";
import { MAX_FLYER_BYTES } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Only accept uploads that come from our own site.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Couldn't read the upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (file.size > MAX_FLYER_BYTES) {
    return NextResponse.json(
      { error: "That image is over 5 MB. Please use a smaller one." },
      { status: 413 }
    );
  }

  const saved = await saveFlyer(Buffer.from(await file.arrayBuffer()));
  if (!saved) {
    return NextResponse.json(
      { error: "Please upload a JPG, PNG or WebP image." },
      { status: 415 }
    );
  }

  return NextResponse.json({ path: saved });
}