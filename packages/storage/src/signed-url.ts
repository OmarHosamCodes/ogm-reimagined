import type { StorageClient } from "./client";
import type { StorageBucket } from "./upload";

export interface SignedUrlOptions {
  bucket: StorageBucket;
  path: string;
  expiresIn?: number; // seconds, default 3600 (1 hour)
}

export interface SignedUploadUrlOptions {
  bucket: StorageBucket;
  path: string;
  expiresIn?: number; // seconds, default 3600 (1 hour)
}

/**
 * Generate a signed URL for downloading a file
 */
export async function createSignedUrl(
  client: StorageClient,
  options: SignedUrlOptions,
): Promise<string> {
  const { bucket, path, expiresIn = 3600 } = options;

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Generate a signed URL for uploading a file (presigned upload)
 */
export async function createSignedUploadUrl(
  client: StorageClient,
  options: SignedUploadUrlOptions,
): Promise<{ signedUrl: string; token: string; path: string }> {
  const { bucket, path } = options;

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error) {
    throw new Error(`Failed to create signed upload URL: ${error.message}`);
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
  };
}

/**
 * Get the public URL for a file (for public buckets)
 */
export function getPublicUrl(
  client: StorageClient,
  bucket: StorageBucket,
  path: string,
): string {
  const {
    data: { publicUrl },
  } = client.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}
