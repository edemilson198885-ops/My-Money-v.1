-- My Money v5 - patch para simplificar RLS e evitar bloqueios no app
-- Uso recomendado apenas para seu app pessoal / ambiente controlado.

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.templates enable row level security;
alter table public.movements enable row level security;

-- Remove policies anteriores
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('households','profiles','members','templates','movements')
  LOOP
    EXECUTE format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Policies simples para usuário autenticado
create policy "households_authenticated_all" on public.households for all to authenticated using (true) with check (true);
create policy "profiles_authenticated_all" on public.profiles for all to authenticated using (true) with check (true);
create policy "members_authenticated_all" on public.members for all to authenticated using (true) with check (true);
create policy "templates_authenticated_all" on public.templates for all to authenticated using (true) with check (true);
create policy "movements_authenticated_all" on public.movements for all to authenticated using (true) with check (true);

-- Aceitar recorrência extra
alter table public.movements drop constraint if exists movements_recurrence_check;
alter table public.movements add constraint movements_recurrence_check check (recurrence in ('fixa', 'variavel', 'extra'));
