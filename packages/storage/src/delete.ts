import { getStorageClient } from "./storage-client";
import { StorageError, type StorageBucket } from "./types";

export async function deleteFiles(params: {
  bucket: StorageBucket;
  paths: string[];
}): Promise<{ bucket: StorageBucket; deleted: string[] }> {
  const { bucket, paths } = params;
  const storage = getStorageClient();
  const { data, error } = await storage.from(bucket).remove(paths);
  if (error) {
    throw new StorageError(`delete failed: ${error.message}`);
  }
  return { bucket, deleted: (data ?? []).map((row) => row.name) };
}
