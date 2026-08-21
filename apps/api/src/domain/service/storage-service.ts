export type UploadObjectInput = {
  key: string;
  body: File | Blob | Uint8Array | ArrayBuffer;
  contentType: string;
};

export interface StorageService {
  upload(input: UploadObjectInput): Promise<string>;
  delete(key: string): Promise<void>;
  deletePublicUrl(url: string): Promise<void>;
}
