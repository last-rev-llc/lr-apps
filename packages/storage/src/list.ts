import { getStorageClient } from "./storage-client";
import { StorageError, type StorageBucket } from "./types";

export interface ListParams {
  bucket: StorageBucket;
  prefix?: string;
  limit?: number;
  offset?: number;
}

export interface ListedFile {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: Record<string, unknown> | null;
}

export async function listFiles(params: ListParams): Promise<ListedFile[]> {
  const { bucket, prefix = "", limit, offset } = params;
  const storage = getStorageClient();
  const { data, error } = await storage.from(bucket).list(prefix, {
    limit,
    offset,
  });
  if (error) {
    throw new StorageError(`list failed: ${error.message}`);
  }
  return (data ?? []) as ListedFile[];
}
