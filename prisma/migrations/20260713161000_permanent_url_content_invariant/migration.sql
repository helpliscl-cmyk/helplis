UPDATE "Device"
SET "qrContent" = "publicUrl"
WHERE "qrContent" IS NULL OR "qrContent" <> "publicUrl";

UPDATE "Device"
SET "nfcContent" = "publicUrl"
WHERE "nfcContent" IS NULL OR "nfcContent" <> "publicUrl";
