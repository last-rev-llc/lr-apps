import { getStorageClient } from "./storage-client";
import { StorageError, type StorageBucket } from "./types";

export async function downloadFile(params: {
  bucket: StorageBucket;
  path: string;
}): Promise<Blob> {
  const { bucket, path } = params;
  const storage = getStorageClient();
  const { data, error } = await storage.from(bucket).download(path);
  if (error) {
    throw new StorageError(`download failed: ${error.message}`);
  }
  if (!data) {
    throw new StorageError("download returned no data");
  }
  return data;
}
