alter table "public"."journals" add column "deleted_at" timestamp with time zone;

grant delete on table "public"."journals" to "postgres";

grant insert on table "public"."journals" to "postgres";

grant references on table "public"."journals" to "postgres";

grant select on table "public"."journals" to "postgres";

grant trigger on table "public"."journals" to "postgres";

grant truncate on table "public"."journals" to "postgres";

grant update on table "public"."journals" to "postgres";

grant delete on table "public"."settings" to "postgres";

grant insert on table "public"."settings" to "postgres";

grant references on table "public"."settings" to "postgres";

grant select on table "public"."settings" to "postgres";

grant trigger on table "public"."settings" to "postgres";

grant truncate on table "public"."settings" to "postgres";

grant update on table "public"."settings" to "postgres";


