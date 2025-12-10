import type { StorageClient } from "./client";

export type StorageBucket = "images" | "videos" | "audio";

export interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File | Blob | Buffer;
  contentType?: string;
  upsert?: boolean;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  contentType: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  client: StorageClient,
  options: UploadOptions,
): Promise<UploadResult> {
  const { bucket, path, file, contentType, upsert = false } = options;

  // Determine content type
  const fileContentType =
    contentType ||
    (file instanceof File ? file.type : "application/octet-stream");

  // Upload to Supabase Storage
  const { data, error } = await client.storage.from(bucket).upload(path, file, {
    contentType: fileContentType,
    upsert,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = client.storage.from(bucket).getPublicUrl(data.path);

  // Get file size
  const size = file instanceof File ? file.size : (file as Blob).size || 0;

  return {
    url: publicUrl,
    path: data.path,
    size,
    contentType: fileContentType,
  };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  client: StorageClient,
  bucket: StorageBucket,
  path: string,
): Promise<void> {
  const { error } = await client.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Generate a unique file path for uploads
 */
export function generateFilePath(
  userId: string,
  filename: string,
  prefix?: string,
): string {
  const timestamp = Date.now();
  const extension = filename.split(".").pop() ?? "";
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);

  const parts = [userId, `${timestamp}-${safeName}`];
  if (prefix) {
    parts.unshift(prefix);
  }

  return parts.join("/");
}

/**
 * Validate file type against allowed types
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      return file.type.startsWith(type.replace("/*", "/"));
    }
    return file.type === type;
  });
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes;
}
