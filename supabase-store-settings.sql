-- Ejecuta TODO este archivo en Supabase → SQL Editor → Run
-- Si ya tienes `products`, solo fallará el create de products; el resto sí se aplica.

create table if not exists public.store_settings (
  id int primary key default 1,
  store_name text default 'Mi Vitrina',
  tagline text,
  whatsapp text,
  constraint single_row check (id = 1)
);

insert into public.store_settings (id, store_name, tagline, whatsapp)
values (1, 'Mi Vitrina', 'Todo lo que tengo para ti, en un solo lugar', '')
on conflict (id) do nothing;

alter table public.store_settings enable row level security;

drop policy if exists "Lectura publica settings" on public.store_settings;
create policy "Lectura publica settings"
  on public.store_settings for select
  using (true);

drop policy if exists "Admin puede editar settings" on public.store_settings;
create policy "Admin puede editar settings"
  on public.store_settings for update
  to authenticated
  using (true);

drop policy if exists "Admin puede insertar settings" on public.store_settings;
create policy "Admin puede insertar settings"
  on public.store_settings for insert
  to authenticated
  with check (id = 1);

-- Refresca el API para que vea la tabla nueva
notify pgrst, 'reload schema';
