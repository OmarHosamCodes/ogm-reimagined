import { getBaseUrl } from "./base-url";

export type StorageBucket = "images" | "videos" | "audio";

interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

interface PresignedUrlResponse {
  signedUrl: string;
  token: string;
  path: string;
  publicUrl: string;
  contentType: string;
}

/**
 * Upload a file to the server using form data
 */
export async function uploadFile(
  bucket: StorageBucket,
  file: {
    uri: string;
    name: string;
    type: string;
  },
  authToken: string,
): Promise<UploadResult> {
  const baseUrl = getBaseUrl();
  const endpoint = `${baseUrl}/api/upload/${bucket === "audio" ? "audio" : bucket === "videos" ? "video" : "image"}`;

  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Upload failed");
  }

  return response.json();
}

/**
 * Get a presigned URL for direct upload (for large files)
 */
export async function getPresignedUploadUrl(
  bucket: StorageBucket,
  filename: string,
  contentType: string,
  authToken: string,
): Promise<PresignedUrlResponse> {
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/api/upload/presigned`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      bucket,
      filename,
      contentType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get presigned URL");
  }

  return response.json();
}

/**
 * Upload a file directly to storage using presigned URL
 */
export async function uploadWithPresignedUrl(
  presignedUrl: string,
  file: {
    uri: string;
    type: string;
  },
): Promise<void> {
  // Fetch the file as blob from local URI
  const response = await fetch(file.uri);
  const blob = await response.blob();

  // Upload to presigned URL
  const uploadResponse = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error("Direct upload failed");
  }
}

/**
 * Upload image from device
 */
export async function uploadImage(
  uri: string,
  filename: string,
  authToken: string,
): Promise<UploadResult> {
  return uploadFile(
    "images",
    {
      uri,
      name: filename,
      type: "image/jpeg",
    },
    authToken,
  );
}

/**
 * Upload video from device
 */
export async function uploadVideo(
  uri: string,
  filename: string,
  authToken: string,
): Promise<UploadResult> {
  return uploadFile(
    "videos",
    {
      uri,
      name: filename,
      type: "video/mp4",
    },
    authToken,
  );
}

/**
 * Upload audio/voice note from device
 */
export async function uploadAudio(
  uri: string,
  filename: string,
  authToken: string,
): Promise<UploadResult> {
  return uploadFile(
    "audio",
    {
      uri,
      name: filename,
      type: "audio/webm",
    },
    authToken,
  );
}
