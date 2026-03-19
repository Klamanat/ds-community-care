-- Add image_id (Storage path) to idp_posters so old images can be deleted on re-upload
alter table idp_posters add column if not exists image_id text;
