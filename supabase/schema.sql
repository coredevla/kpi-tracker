-- =====================================================================
-- KPI Tracker · Esquema Supabase (Fase A: datos)
-- Ejecutar una sola vez en Supabase → SQL Editor.
--
-- Las columnas usan camelCase entre comillas para mapear 1:1 con los
-- objetos de la app (objetivoMensual, personalId, createdAt, etc.).
--
-- NOTA: la autenticación es por Supabase Auth (Fase B, al final de este archivo).
-- El primer administrador se crea manualmente (ver instrucciones en la sección Fase B).
-- Los 15 servicios se siembran automáticamente desde la app en el primer arranque.
-- =====================================================================

-- ---------- Trigger de updatedAt ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

-- ---------- Tablas ----------
create table if not exists personal (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cargo text,
  equipo text,
  "fechaIngreso" date,
  activo boolean default true,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- Migración idempotente: añade columnas faltantes si la tabla ya existía.
alter table personal add column if not exists cargo text;
alter table personal add column if not exists equipo text;
alter table personal add column if not exists "fechaIngreso" date;

create table if not exists servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text,
  color text,
  "objetivoMensual" numeric default 0,
  activo boolean default true,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table if not exists asignaciones (
  id uuid primary key default gen_random_uuid(),
  "personalId" uuid references personal(id) on delete cascade,
  "servicioId" uuid references servicios(id) on delete cascade,
  periodo text,
  "objetivoMensual" numeric default 0,
  activo boolean default true,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table if not exists ventas (
  id uuid primary key default gen_random_uuid(),
  "personalId" uuid references personal(id) on delete cascade,
  "servicioId" uuid references servicios(id) on delete cascade,
  fecha date,
  cantidad numeric default 1,
  monto numeric default 0,
  "tipoGestion" text default 'venta',
  cliente text,
  numeracion text,
  detalle text,
  activo boolean default true,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table if not exists "metasPri" (
  id uuid primary key default gen_random_uuid(),
  "personalId" uuid references personal(id) on delete cascade,
  periodo text,
  "objetivoMonto" numeric default 0,
  activo boolean default true,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  salt text,
  "passwordHash" text,
  rol text,
  "personalId" uuid references personal(id) on delete set null,
  "mustChangePassword" boolean default false,
  activo boolean default true,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- ---------- Triggers updatedAt por tabla ----------
drop trigger if exists trg_personal_upd on personal;
create trigger trg_personal_upd before update on personal for each row execute function set_updated_at();

drop trigger if exists trg_servicios_upd on servicios;
create trigger trg_servicios_upd before update on servicios for each row execute function set_updated_at();

drop trigger if exists trg_asignaciones_upd on asignaciones;
create trigger trg_asignaciones_upd before update on asignaciones for each row execute function set_updated_at();

drop trigger if exists trg_ventas_upd on ventas;
create trigger trg_ventas_upd before update on ventas for each row execute function set_updated_at();

drop trigger if exists trg_metaspri_upd on "metasPri";
create trigger trg_metaspri_upd before update on "metasPri" for each row execute function set_updated_at();

drop trigger if exists trg_usuarios_upd on usuarios;
create trigger trg_usuarios_upd before update on usuarios for each row execute function set_updated_at();

-- ---------- Row Level Security ----------
-- NOTA: las políticas abiertas (anon) de esta Fase A son TEMPORALES: más abajo,
-- la Fase B (paso 2) las reemplaza por políticas por rol (es_admin / mi_personal_id)
-- y elimina el acceso anónimo. El estado final del script NO permite anónimos.
alter table personal     enable row level security;
alter table servicios    enable row level security;
alter table asignaciones enable row level security;
alter table ventas       enable row level security;
alter table "metasPri"   enable row level security;
alter table usuarios     enable row level security;

drop policy if exists "all_personal" on personal;
create policy "all_personal" on personal for all to anon, authenticated using (true) with check (true);

drop policy if exists "all_servicios" on servicios;
create policy "all_servicios" on servicios for all to anon, authenticated using (true) with check (true);

drop policy if exists "all_asignaciones" on asignaciones;
create policy "all_asignaciones" on asignaciones for all to anon, authenticated using (true) with check (true);

drop policy if exists "all_ventas" on ventas;
create policy "all_ventas" on ventas for all to anon, authenticated using (true) with check (true);

drop policy if exists "all_metaspri" on "metasPri";
create policy "all_metaspri" on "metasPri" for all to anon, authenticated using (true) with check (true);

drop policy if exists "all_usuarios" on usuarios;
create policy "all_usuarios" on usuarios for all to anon, authenticated using (true) with check (true);

-- =====================================================================
-- FASE B (paso 1) · Autenticación con Supabase Auth
-- Requiere: Authentication → Providers → Email → desactivar "Confirm email".
-- (Si está activo, usuarios creados desde la app quedan "Waiting for verification".)
-- =====================================================================

-- Perfil 1:1 con auth.users (guarda rol y persona enlazada).
create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  email text,
  rol text default 'representante',
  "personalId" uuid references personal(id) on delete set null,
  activo boolean default true,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- Migración idempotente por si la tabla ya existía del paso 1.
alter table perfiles add column if not exists email text;
alter table perfiles add column if not exists activo boolean default true;

drop trigger if exists trg_perfiles_upd on perfiles;
create trigger trg_perfiles_upd before update on perfiles for each row execute function set_updated_at();

-- Crea automáticamente el perfil al registrarse un usuario en Auth.
-- (rol por defecto 'representante'; al primer admin se le sube el rol a mano).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, username, email, rol, activo)
  values (
    new.id,
    split_part(coalesce(new.email, ''), '@', 1),
    new.email,
    'representante',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS: cada usuario ve y edita SOLO su propio perfil.
-- (Las políticas para que el admin gestione todos los perfiles se añaden en el paso 2.)
alter table perfiles enable row level security;

drop policy if exists "perfil_propio_select" on perfiles;
create policy "perfil_propio_select" on perfiles for select to authenticated using (auth.uid() = id);

drop policy if exists "perfil_propio_update" on perfiles;
create policy "perfil_propio_update" on perfiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Permite al trigger insertar perfiles al crear usuarios en Auth.
drop policy if exists "perfiles_insert_auth" on perfiles;
create policy "perfiles_insert_auth" on perfiles
  for insert
  to authenticated, service_role
  with check (true);

grant insert on public.perfiles to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;

-- ---- Crear el primer admin (manual, una vez) ----
-- 1) Authentication → Users → Add user → email + contraseña (marca "Auto Confirm User").
-- 2) El trigger crea su perfil con rol 'representante'.
-- 3) Súbelo a admin:
--    update perfiles set rol = 'admin' where username = 'TU_USUARIO';

-- =====================================================================
-- FASE B (paso 2) · Gobernanza por rol (RLS) y gestión de usuarios
-- =====================================================================

-- Helpers SECURITY DEFINER (evitan recursión de RLS al leer `perfiles`).
create or replace function es_admin()
returns boolean as $$
  select exists (
    select 1 from perfiles
    where id = auth.uid() and rol = 'admin' and coalesce(activo, true)
  );
$$ language sql security definer set search_path = public;

create or replace function mi_personal_id()
returns uuid as $$
  select "personalId" from perfiles where id = auth.uid();
$$ language sql security definer set search_path = public;

-- ---- Perfiles: el admin gestiona todos; cada quien ve/edita el suyo ----
drop policy if exists "perfiles_admin_all" on perfiles;
create policy "perfiles_admin_all" on perfiles for all to authenticated
  using (es_admin()) with check (es_admin());

-- ---- Catálogos compartidos: lectura para autenticados, escritura solo admin ----
-- personal
drop policy if exists "all_personal" on personal;
drop policy if exists "personal_read" on personal;
drop policy if exists "personal_write" on personal;
create policy "personal_read"  on personal for select to authenticated using (true);
create policy "personal_write" on personal for all    to authenticated using (es_admin()) with check (es_admin());

-- servicios
drop policy if exists "all_servicios" on servicios;
drop policy if exists "servicios_read" on servicios;
drop policy if exists "servicios_write" on servicios;
create policy "servicios_read"  on servicios for select to authenticated using (true);
create policy "servicios_write" on servicios for all    to authenticated using (es_admin()) with check (es_admin());

-- asignaciones
drop policy if exists "all_asignaciones" on asignaciones;
drop policy if exists "asignaciones_read" on asignaciones;
drop policy if exists "asignaciones_write" on asignaciones;
create policy "asignaciones_read"  on asignaciones for select to authenticated using (true);
create policy "asignaciones_write" on asignaciones for all    to authenticated using (es_admin()) with check (es_admin());

-- metasPri
drop policy if exists "all_metaspri" on "metasPri";
drop policy if exists "metaspri_read" on "metasPri";
drop policy if exists "metaspri_write" on "metasPri";
create policy "metaspri_read"  on "metasPri" for select to authenticated using (true);
create policy "metaspri_write" on "metasPri" for all    to authenticated using (es_admin()) with check (es_admin());

-- ---- Ventas: el admin ve/gestiona todo; el representante solo lo suyo ----
drop policy if exists "all_ventas" on ventas;
drop policy if exists "ventas_scope" on ventas;
create policy "ventas_scope" on ventas for all to authenticated
  using (es_admin() or "personalId" = mi_personal_id())
  with check (es_admin() or "personalId" = mi_personal_id());

-- ---- Tabla legada `usuarios` (ya no se usa para autenticar) ----
-- Queda restringida solo al admin. Puedes eliminarla si quieres:
--   drop table if exists usuarios cascade;
drop policy if exists "all_usuarios" on usuarios;
drop policy if exists "usuarios_admin" on usuarios;
create policy "usuarios_admin" on usuarios for all to authenticated using (es_admin()) with check (es_admin());
