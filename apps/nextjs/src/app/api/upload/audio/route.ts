import { NextResponse } from "next/server";

import {
  createStorageClient,
  generateFilePath,
  uploadFile,
} from "@ogm/storage";

import { auth } from "~/auth/server";
import { env } from "~/env";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type (audio files including voice notes)
  const allowedTypes = [
    "audio/webm",
    "audio/mp3",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/m4a",
    "audio/aac",
    "audio/mp4",
  ];

  if (!allowedTypes.includes(file.type) && !file.type.startsWith("audio/")) {
    return NextResponse.json(
      { error: "File must be an audio file" },
      { status: 400 },
    );
  }

  // Validate file size (20MB max for audio/voice notes)
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File size must be less than 20MB" },
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
      bucket: "audio",
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
    console.error("Audio upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload audio" },
      { status: 500 },
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
    bodyParser: false,
  },
};
