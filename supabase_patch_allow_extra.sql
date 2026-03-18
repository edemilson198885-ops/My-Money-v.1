-- Ajuste necessário porque o app usa recurrence = 'extra'

alter table public.movements drop constraint if exists movements_recurrence_check;

alter table public.movements
add constraint movements_recurrence_check
check (recurrence in ('fixa', 'variavel', 'extra'));
