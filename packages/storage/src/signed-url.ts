import { getStorageClient } from "./storage-client";
import { StorageError, type StorageBucket } from "./types";

export async function createSignedUrl(params: {
  bucket: StorageBucket;
  path: string;
  expiresInSeconds: number;
}): Promise<string> {
  const { bucket, path, expiresInSeconds } = params;
  const storage = getStorageClient();
  const { data, error } = await storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) {
    throw new StorageError(`signed url failed: ${error.message}`);
  }
  if (!data?.signedUrl) {
    throw new StorageError("signed url response missing signedUrl");
  }
  return data.signedUrl;
}
