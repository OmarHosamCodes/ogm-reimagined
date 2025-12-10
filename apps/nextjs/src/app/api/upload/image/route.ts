import { NextResponse } from "next/server";

import {
  createStorageClient,
  generateFilePath,
  uploadFile,
} from "@ogm/storage";

import { getSession } from "~/auth/server";
import { env } from "~/env";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "File must be an image" },
      { status: 400 },
    );
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File size must be less than 10MB" },
      { status: 400 },
    );
  }

  try {
    // Create Supabase storage client
    const storage = createStorageClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // Generate a unique file path
    const path = generateFilePath(session.user.id, file.name);

    // Upload to Supabase Storage
    const result = await uploadFile(storage, {
      bucket: "images",
      path,
      file,
      contentType: file.type,
    });

    return NextResponse.json({
      url: result.url,
      path: result.path,
      size: result.size,
      type: result.contentType,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
