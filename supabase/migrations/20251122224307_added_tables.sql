
  create table "public"."journals" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "raw_blob" text,
    "encrypted_blob" text,
    "is_encrypted" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "version" bigint
      );


alter table "public"."journals" enable row level security;


  create table "public"."settings" (
    "user_id" uuid not null default auth.uid(),
    "lock_enabled" boolean,
    "cursor_color" text,
    "text_color" text,
    "cleanup_enabled" boolean,
    "cleanup_prompt" text,
    "selected_model" text,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."settings" enable row level security;

CREATE UNIQUE INDEX journals_pkey ON public.journals USING btree (id);

CREATE UNIQUE INDEX settings_pkey ON public.settings USING btree (user_id);

alter table "public"."journals" add constraint "journals_pkey" PRIMARY KEY using index "journals_pkey";

alter table "public"."settings" add constraint "settings_pkey" PRIMARY KEY using index "settings_pkey";

alter table "public"."journals" add constraint "journals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."journals" validate constraint "journals_user_id_fkey";

alter table "public"."settings" add constraint "settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."settings" validate constraint "settings_user_id_fkey";

grant delete on table "public"."journals" to "anon";

grant insert on table "public"."journals" to "anon";

grant references on table "public"."journals" to "anon";

grant select on table "public"."journals" to "anon";

grant trigger on table "public"."journals" to "anon";

grant truncate on table "public"."journals" to "anon";

grant update on table "public"."journals" to "anon";

grant delete on table "public"."journals" to "authenticated";

grant insert on table "public"."journals" to "authenticated";

grant references on table "public"."journals" to "authenticated";

grant select on table "public"."journals" to "authenticated";

grant trigger on table "public"."journals" to "authenticated";

grant truncate on table "public"."journals" to "authenticated";

grant update on table "public"."journals" to "authenticated";

grant delete on table "public"."journals" to "postgres";

grant insert on table "public"."journals" to "postgres";

grant references on table "public"."journals" to "postgres";

grant select on table "public"."journals" to "postgres";

grant trigger on table "public"."journals" to "postgres";

grant truncate on table "public"."journals" to "postgres";

grant update on table "public"."journals" to "postgres";

grant delete on table "public"."journals" to "service_role";

grant insert on table "public"."journals" to "service_role";

grant references on table "public"."journals" to "service_role";

grant select on table "public"."journals" to "service_role";

grant trigger on table "public"."journals" to "service_role";

grant truncate on table "public"."journals" to "service_role";

grant update on table "public"."journals" to "service_role";

grant delete on table "public"."settings" to "anon";

grant insert on table "public"."settings" to "anon";

grant references on table "public"."settings" to "anon";

grant select on table "public"."settings" to "anon";

grant trigger on table "public"."settings" to "anon";

grant truncate on table "public"."settings" to "anon";

grant update on table "public"."settings" to "anon";

grant delete on table "public"."settings" to "authenticated";

grant insert on table "public"."settings" to "authenticated";

grant references on table "public"."settings" to "authenticated";

grant select on table "public"."settings" to "authenticated";

grant trigger on table "public"."settings" to "authenticated";

grant truncate on table "public"."settings" to "authenticated";

grant update on table "public"."settings" to "authenticated";

grant delete on table "public"."settings" to "postgres";

grant insert on table "public"."settings" to "postgres";

grant references on table "public"."settings" to "postgres";

grant select on table "public"."settings" to "postgres";

grant trigger on table "public"."settings" to "postgres";

grant truncate on table "public"."settings" to "postgres";

grant update on table "public"."settings" to "postgres";

grant delete on table "public"."settings" to "service_role";

grant insert on table "public"."settings" to "service_role";

grant references on table "public"."settings" to "service_role";

grant select on table "public"."settings" to "service_role";

grant trigger on table "public"."settings" to "service_role";

grant truncate on table "public"."settings" to "service_role";

grant update on table "public"."settings" to "service_role";


  create policy "Enable delete for users based on user_id"
  on "public"."journals"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable insert for users based on user_id"
  on "public"."journals"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable update for users based on user_id"
  on "public"."journals"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable users to view their own data only"
  on "public"."journals"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable delete for users based on user_id"
  on "public"."settings"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable insert for users based on user_id"
  on "public"."settings"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable update for users based on user_id"
  on "public"."settings"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable users to view their own data only"
  on "public"."settings"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



