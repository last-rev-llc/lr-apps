import { getStorageClient } from "./storage-client";
import { validateUpload } from "./validate";
import {
  StorageError,
  type UploadParams,
  type UploadResult,
  type ValidationOptions,
} from "./types";

export async function uploadFile(
  params: UploadParams,
  opts: ValidationOptions = {},
): Promise<UploadResult> {
  const { bucket, path, file, contentType, upsert = false } = params;

  validateUpload(file, contentType, opts);

  const storage = getStorageClient();
  const { error } = await storage.from(bucket).upload(path, file, {
    contentType,
    upsert,
  });

  if (error) {
    throw new StorageError(`upload failed: ${error.message}`);
  }
  return { bucket, path };
}
