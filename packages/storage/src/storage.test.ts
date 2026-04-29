import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpload = vi.fn();
const mockDownload = vi.fn();
const mockRemove = vi.fn();
const mockList = vi.fn();
const mockCreateSignedUrl = vi.fn();

const mockBucket = {
  upload: mockUpload,
  download: mockDownload,
  remove: mockRemove,
  list: mockList,
  createSignedUrl: mockCreateSignedUrl,
};

const mockStorage = { from: vi.fn(() => mockBucket) };

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ storage: mockStorage }),
}));

import {
  createSignedUrl,
  deleteFiles,
  downloadFile,
  listFiles,
  StorageError,
  StorageValidationError,
  uploadFile,
  validateUpload,
} from "./index";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("uploadFile", () => {
  it("uploads to the right bucket/path with contentType + upsert", async () => {
    mockUpload.mockResolvedValue({ data: { path: "x.txt" }, error: null });

    const result = await uploadFile({
      bucket: "user-uploads",
      path: "u/1/x.txt",
      file: new Uint8Array([1, 2, 3]),
      contentType: "application/octet-stream",
      upsert: true,
    });

    expect(result).toEqual({ bucket: "user-uploads", path: "u/1/x.txt" });
    expect(mockStorage.from).toHaveBeenCalledWith("user-uploads");
    expect(mockUpload).toHaveBeenCalledWith(
      "u/1/x.txt",
      expect.any(Uint8Array),
      { contentType: "application/octet-stream", upsert: true },
    );
  });

  it("throws StorageError when supabase returns an error", async () => {
    mockUpload.mockResolvedValue({ data: null, error: { message: "denied" } });

    await expect(
      uploadFile({
        bucket: "user-uploads",
        path: "x.txt",
        file: new Uint8Array(0),
      }),
    ).rejects.toThrow(StorageError);
  });

  it("rejects oversize files via maxBytes", async () => {
    await expect(
      uploadFile(
        {
          bucket: "user-uploads",
          path: "big.bin",
          file: new Uint8Array(11),
        },
        { maxBytes: 10 },
      ),
    ).rejects.toThrow(StorageValidationError);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("rejects disallowed mime types", async () => {
    await expect(
      uploadFile(
        {
          bucket: "avatars",
          path: "a.exe",
          file: new Uint8Array(1),
          contentType: "application/x-msdownload",
        },
        { allowedMimeTypes: ["image/png", "image/jpeg"] },
      ),
    ).rejects.toThrow(StorageValidationError);
    expect(mockUpload).not.toHaveBeenCalled();
  });
});

describe("downloadFile", () => {
  it("returns the Blob on success", async () => {
    const blob = new Blob(["hello"]);
    mockDownload.mockResolvedValue({ data: blob, error: null });

    const result = await downloadFile({ bucket: "x", path: "f.txt" });
    expect(result).toBe(blob);
    expect(mockDownload).toHaveBeenCalledWith("f.txt");
  });

  it("throws when supabase errors", async () => {
    mockDownload.mockResolvedValue({ data: null, error: { message: "404" } });
    await expect(
      downloadFile({ bucket: "x", path: "missing" }),
    ).rejects.toThrow(StorageError);
  });
});

describe("deleteFiles", () => {
  it("returns the deleted names", async () => {
    mockRemove.mockResolvedValue({
      data: [{ name: "a" }, { name: "b" }],
      error: null,
    });

    const result = await deleteFiles({
      bucket: "x",
      paths: ["a", "b"],
    });
    expect(result).toEqual({ bucket: "x", deleted: ["a", "b"] });
    expect(mockRemove).toHaveBeenCalledWith(["a", "b"]);
  });

  it("throws on error", async () => {
    mockRemove.mockResolvedValue({ data: null, error: { message: "no" } });
    await expect(
      deleteFiles({ bucket: "x", paths: ["a"] }),
    ).rejects.toThrow(StorageError);
  });
});

describe("listFiles", () => {
  it("returns the list and forwards prefix/limit/offset", async () => {
    mockList.mockResolvedValue({
      data: [{ name: "f1" }, { name: "f2" }],
      error: null,
    });

    const result = await listFiles({
      bucket: "x",
      prefix: "u/1/",
      limit: 100,
      offset: 0,
    });
    expect(result).toHaveLength(2);
    expect(mockList).toHaveBeenCalledWith("u/1/", { limit: 100, offset: 0 });
  });

  it("throws on error", async () => {
    mockList.mockResolvedValue({ data: null, error: { message: "no" } });
    await expect(listFiles({ bucket: "x" })).rejects.toThrow(StorageError);
  });
});

describe("createSignedUrl", () => {
  it("returns the signed URL", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed.example/x?token=abc" },
      error: null,
    });

    const url = await createSignedUrl({
      bucket: "x",
      path: "f.txt",
      expiresInSeconds: 60,
    });
    expect(url).toBe("https://signed.example/x?token=abc");
    expect(mockCreateSignedUrl).toHaveBeenCalledWith("f.txt", 60);
  });

  it("throws on error", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "no" },
    });
    await expect(
      createSignedUrl({ bucket: "x", path: "f.txt", expiresInSeconds: 60 }),
    ).rejects.toThrow(StorageError);
  });

  it("throws when response is missing signedUrl", async () => {
    mockCreateSignedUrl.mockResolvedValue({ data: {}, error: null });
    await expect(
      createSignedUrl({ bucket: "x", path: "f.txt", expiresInSeconds: 60 }),
    ).rejects.toThrow(StorageError);
  });
});

describe("validateUpload", () => {
  it("passes when no options are set", () => {
    expect(() => validateUpload(new Uint8Array(99), undefined)).not.toThrow();
  });

  it("requires contentType when allowedMimeTypes is set", () => {
    expect(() =>
      validateUpload(new Uint8Array(1), undefined, {
        allowedMimeTypes: ["image/png"],
      }),
    ).toThrow(StorageValidationError);
  });

  it("measures Blob size", () => {
    const blob = new Blob([new Uint8Array(20)]);
    expect(() => validateUpload(blob, undefined, { maxBytes: 10 })).toThrow(
      StorageValidationError,
    );
    expect(() => validateUpload(blob, undefined, { maxBytes: 100 })).not.toThrow();
  });
});
