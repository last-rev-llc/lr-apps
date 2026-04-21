import { StorageValidationError, type ValidationOptions } from "./types";

function byteLength(file: Blob | ArrayBuffer | Uint8Array | Buffer): number {
  if (file instanceof ArrayBuffer) return file.byteLength;
  if (ArrayBuffer.isView(file)) return file.byteLength;
  if (typeof Blob !== "undefined" && file instanceof Blob) return file.size;
  return 0;
}

export function validateUpload(
  file: Blob | ArrayBuffer | Uint8Array | Buffer,
  contentType: string | undefined,
  opts: ValidationOptions = {},
): void {
  if (opts.maxBytes !== undefined) {
    const size = byteLength(file);
    if (size > opts.maxBytes) {
      throw new StorageValidationError(
        `file size ${size} exceeds maxBytes ${opts.maxBytes}`,
      );
    }
  }

  if (opts.allowedMimeTypes !== undefined) {
    if (!contentType) {
      throw new StorageValidationError(
        "contentType is required when allowedMimeTypes is set",
      );
    }
    if (!opts.allowedMimeTypes.includes(contentType)) {
      throw new StorageValidationError(
        `contentType ${contentType} not in allowedMimeTypes [${opts.allowedMimeTypes.join(", ")}]`,
      );
    }
  }
}
