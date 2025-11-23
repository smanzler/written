
alter table "public"."settings" 
  add column "encrypted_master" text,
  add column "key_salt" text;

