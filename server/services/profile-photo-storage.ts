import crypto from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const PROFILE_PHOTO_BUCKET = process.env.SUPABASE_STORAGE_PROFILE_BUCKET || "profile-photos";
export const PROFILE_PHOTO_MAX_ORIGINAL_BYTES = 5 * 1024 * 1024;
export const PROFILE_PHOTO_MAX_DIMENSION = 1024;
export const PROFILE_PHOTO_PUBLIC_CACHE = "private, no-store, max-age=0";
export const ALLOWED_PROFILE_PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type AllowedProfilePhotoMimeType = (typeof ALLOWED_PROFILE_PHOTO_MIME_TYPES)[number];

export type StoredProfilePhoto = {
  storagePath: string;
  mimeType: "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
  updatedAt: Date;
};

type ProcessedProfilePhoto = {
  buffer: Buffer;
  mimeType: "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
};

export class ProfilePhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfilePhotoError";
  }
}

function isAllowedMimeType(value: string): value is AllowedProfilePhotoMimeType {
  return (ALLOWED_PROFILE_PHOTO_MIME_TYPES as readonly string[]).includes(value);
}

export function profilePhotoStorageProvider() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "local";
}

export function buildProfilePhotoPublicUrl(profileId: string, updatedAt?: Date | null) {
  const version = updatedAt?.getTime() ?? Date.now();
  return `/api/public/profile-photo/${profileId}?v=${version}`;
}

export function parseProfilePhotoDataUrl(value: string) {
  const match = value.match(/^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new ProfilePhotoError("La foto debe ser JPG, PNG o WebP.");

  const mimeType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  return validateProfilePhotoSource(mimeType, buffer);
}

export function validateProfilePhotoSource(mimeType: string, buffer: Buffer) {
  const normalizedMimeType = mimeType.toLowerCase();
  if (!isAllowedMimeType(normalizedMimeType)) throw new ProfilePhotoError("La foto debe ser JPG, PNG o WebP.");
  if (!buffer.length) throw new ProfilePhotoError("La foto no se pudo leer.");
  if (buffer.length > PROFILE_PHOTO_MAX_ORIGINAL_BYTES) {
    throw new ProfilePhotoError("La foto debe pesar como maximo 5 MB.");
  }

  return { mimeType: normalizedMimeType, buffer };
}

export async function processProfilePhotoDataUrl(value: string): Promise<ProcessedProfilePhoto> {
  const source = parseProfilePhotoDataUrl(value);
  return processProfilePhotoBuffer(source.mimeType, source.buffer);
}

export async function processProfilePhotoBuffer(mimeType: string, buffer: Buffer): Promise<ProcessedProfilePhoto> {
  const source = validateProfilePhotoSource(mimeType, buffer);
  const image = sharp(source.buffer, { animated: false, limitInputPixels: 20_000_000 });
  const metadata = await image.metadata().catch(() => {
    throw new ProfilePhotoError("La foto esta corrupta o no es una imagen valida.");
  });

  if (!metadata.format || !["jpeg", "jpg", "png", "webp"].includes(metadata.format)) {
    throw new ProfilePhotoError("La foto debe ser JPG, PNG o WebP.");
  }

  const { data, info } = await image
    .rotate()
    .resize({
      width: PROFILE_PHOTO_MAX_DIMENSION,
      height: PROFILE_PHOTO_MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 84, effort: 4 })
    .toBuffer({ resolveWithObject: true })
    .catch(() => {
      throw new ProfilePhotoError("La foto no se pudo procesar.");
    });

  return {
    buffer: data,
    mimeType: "image/webp",
    width: info.width,
    height: info.height,
    sizeBytes: data.length,
  };
}

export function buildProfilePhotoStoragePath(userId: string, profileId: string) {
  const randomId = crypto.randomUUID();
  return `users/${userId}/profiles/${profileId}/${randomId}.webp`;
}

export async function storeProcessedProfilePhoto(input: {
  userId: string;
  profileId: string;
  photo: ProcessedProfilePhoto;
}): Promise<StoredProfilePhoto> {
  const storagePath = buildProfilePhotoStoragePath(input.userId, input.profileId);
  await writePrivatePhotoObject(storagePath, input.photo.buffer, input.photo.mimeType);

  return {
    storagePath,
    mimeType: input.photo.mimeType,
    width: input.photo.width,
    height: input.photo.height,
    sizeBytes: input.photo.sizeBytes,
    updatedAt: new Date(),
  };
}

export async function storeProfilePhotoFromDataUrl(input: {
  userId: string;
  profileId: string;
  dataUrl: string;
}) {
  const photo = await processProfilePhotoDataUrl(input.dataUrl);
  return storeProcessedProfilePhoto({ userId: input.userId, profileId: input.profileId, photo });
}

export async function readPrivateProfilePhoto(storagePath: string) {
  if (profilePhotoStorageProvider() === "supabase") {
    const response = await supabaseStorageFetch(storagePath, { method: "GET" });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  }

  return readFile(localPhotoPath(storagePath)).catch(() => null);
}

export async function deletePrivateProfilePhoto(storagePath: string | null | undefined) {
  if (!storagePath) return;

  if (profilePhotoStorageProvider() === "supabase") {
    await fetch(`${supabaseStorageBaseUrl()}/object/${PROFILE_PHOTO_BUCKET}`, {
      method: "DELETE",
      headers: supabaseStorageHeaders("application/json"),
      body: JSON.stringify({ prefixes: [storagePath] }),
    }).catch(() => null);
    return;
  }

  await rm(localPhotoPath(storagePath), { force: true }).catch(() => null);
}

async function writePrivatePhotoObject(storagePath: string, buffer: Buffer, mimeType: string) {
  if (profilePhotoStorageProvider() === "supabase") {
    const response = await supabaseStorageFetch(storagePath, {
      method: "POST",
      headers: {
        ...supabaseStorageHeaders(mimeType),
        "cache-control": "no-store",
        "x-upsert": "false",
      },
      body: new Uint8Array(buffer),
    });
    if (!response.ok) {
      throw new ProfilePhotoError("No se pudo guardar la foto en Storage.");
    }
    return;
  }

  const targetPath = localPhotoPath(storagePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, buffer);
}

function localPhotoPath(storagePath: string) {
  const root = path.join(process.cwd(), "data", "profile-photos");
  const resolved = path.resolve(root, storagePath);
  if (!resolved.startsWith(path.resolve(root))) throw new ProfilePhotoError("Ruta de foto invalida.");
  return resolved;
}

function supabaseStorageBaseUrl() {
  return `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1`;
}

function supabaseStorageHeaders(contentType?: string) {
  return {
    authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    ...(contentType ? { "content-type": contentType } : {}),
  };
}

function supabaseStorageFetch(storagePath: string, init: RequestInit) {
  const safePath = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const headers = new Headers(init.headers);
  Object.entries(supabaseStorageHeaders()).forEach(([key, value]) => headers.set(key, value));
  return fetch(`${supabaseStorageBaseUrl()}/object/${PROFILE_PHOTO_BUCKET}/${safePath}`, {
    ...init,
    headers,
  });
}
