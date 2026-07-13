update public.devices
set qr_content = public_url
where qr_content is null or qr_content <> public_url;

update public.devices
set nfc_content = public_url
where nfc_content is null or nfc_content <> public_url;
