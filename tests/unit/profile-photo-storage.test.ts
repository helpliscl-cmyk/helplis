import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  deletePrivateProfilePhoto,
  processProfilePhotoBuffer,
  processProfilePhotoDataUrl,
  readPrivateProfilePhoto,
  storeProcessedProfilePhoto,
} from "@/server/services/profile-photo-storage";

async function pngDataUrl(width = 24, height = 24) {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#20c7bd",
    },
  })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

describe("profile photo storage", () => {
  it("processes valid photos into bounded WebP without metadata dependency", async () => {
    const processed = await processProfilePhotoDataUrl(await pngDataUrl(1600, 1200));

    expect(processed.mimeType).toBe("image/webp");
    expect(processed.width).toBeLessThanOrEqual(1024);
    expect(processed.height).toBeLessThanOrEqual(1024);
    expect(processed.sizeBytes).toBe(processed.buffer.length);
  });

  it("rejects svg and oversized inputs", async () => {
    await expect(processProfilePhotoBuffer("image/svg+xml", Buffer.from("<svg />"))).rejects.toThrow(/JPG, PNG o WebP/);
    await expect(processProfilePhotoBuffer("image/png", Buffer.alloc(5_300_000))).rejects.toThrow(/5 MB/);
  });

  it("stores and deletes private local objects by random owner/profile path", async () => {
    const processed = await processProfilePhotoDataUrl(await pngDataUrl());
    const stored = await storeProcessedProfilePhoto({
      userId: "user_test",
      profileId: "profile_test",
      photo: processed,
    });

    expect(stored.storagePath).toMatch(/^users\/user_test\/profiles\/profile_test\/[0-9a-f-]+\.webp$/);
    expect(await readPrivateProfilePhoto(stored.storagePath)).toBeTruthy();

    await deletePrivateProfilePhoto(stored.storagePath);
    expect(await readPrivateProfilePhoto(stored.storagePath)).toBeNull();
  });
});
