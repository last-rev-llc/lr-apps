/**
 * Logical bucket name. Buckets must be created in the Supabase dashboard
 * (Storage → New bucket) before use. Recommended buckets:
 *   - `user-uploads` (private — accessed via signed URLs)
 *   - `avatars`     (public — readable without auth)
 */
export type StorageBucket = string;

export interface UploadParams {
  bucket: StorageBucket;
  path: string;
  file: Blob | ArrayBuffer | Uint8Array | Buffer;
  contentType?: string;
  upsert?: boolean;
}

export interface UploadResult {
  bucket: StorageBucket;
  path: string;
}

export interface ValidationOptions {
  /** Maximum allowed size in bytes. Throws StorageValidationError when exceeded. */
  maxBytes?: number;
  /** Allowed mime types (exact match). Throws StorageValidationError if contentType is missing or unlisted. */
  allowedMimeTypes?: string[];
}

export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageValidationError";
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}
