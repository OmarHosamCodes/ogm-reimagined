import { NextResponse } from "next/server";
import { z } from "zod/v4";

import {
    createSignedUploadUrl,
    createStorageClient,
    generateFilePath,
} from "@ogm/storage";

import { getSession } from "~/auth/server";
import { env } from "~/env";

const RequestSchema = z.object({
  bucket: z.enum(["images", "videos", "audio"]),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bucket, filename, contentType } = RequestSchema.parse(body);

    // Create Supabase storage client
    const storage = createStorageClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // Generate a unique file path
    const path = generateFilePath(session.user.id, filename);

    // Create signed upload URL
    const {
      signedUrl,
      token,
      path: fullPath,
    } = await createSignedUploadUrl(storage, { bucket, path });

    // Get the public URL for after upload
    const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${fullPath}`;

    return NextResponse.json({
      signedUrl,
      token,
      path: fullPath,
      publicUrl,
      contentType,
    });
  } catch (error) {
    console.error("Presigned URL error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create presigned URL" },
      { status: 500 },
    );
  }
}
