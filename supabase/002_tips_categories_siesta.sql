-- Cooper's Bar — migration 002: tips, new categories, siesta mode.
-- Run this ONCE in the SQL Editor of your already-set-up project (i.e. you
-- already ran schema.sql before). Safe to run even if you've already
-- placed test orders — existing rows are backfilled sensibly.

-- 1. New drink categories: Snacks, Ice Cream.
-- Finds whatever the category CHECK constraint is actually named (rather
-- than assuming) and replaces it with one that allows the two new values.
do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
    where rel.relname = 'drinks'
      and att.attname = 'category'
      and con.contype = 'c'
  loop
    execute format('alter table drinks drop constraint %I', constraint_row.conname);
  end loop;
end $$;

alter table drinks add constraint drinks_category_check
  check (category in ('fizzy_drinks','beers','juices','wine','water','combos','snacks','ice_cream','other'));

-- 2. Theoretical tips — a fun number stored with the order, nobody is
-- actually charged anything.
alter table orders add column if not exists tip numeric(10,2) not null default 0 check (tip >= 0);

-- 3. Siesta-aware timing. confirmed_at is the moment an order actually
-- starts counting toward wait-time stats. Normally that's the same instant
-- as created_at. If the order is placed while the barman is on siesta,
-- confirmed_at stays null until siesta ends, so nap time never counts as
-- part of anyone's wait.
alter table orders add column if not exists confirmed_at timestamptz;
update orders set confirmed_at = created_at where confirmed_at is null;

create table if not exists bar_status (
  id int primary key default 1,
  siesta boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint bar_status_singleton check (id = 1)
);

insert into bar_status (id, siesta)
  values (1, false)
  on conflict (id) do nothing;

alter table bar_status enable row level security;
drop policy if exists "open access" on bar_status;
create policy "open access" on bar_status for all using (true) with check (true);

-- If this errors with "relation is already member of publication", that's
-- fine — ignore it and move on (same caveat as in schema.sql).
alter publication supabase_realtime add table bar_status;

-- Sets confirmed_at on every new order based on the current siesta state.
create or replace function set_order_confirmed_at()
returns trigger as $$
begin
  if (select siesta from bar_status where id = 1) then
    new.confirmed_at := null;
  else
    new.confirmed_at := coalesce(new.created_at, now());
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_set_confirmed_at on orders;
create trigger orders_set_confirmed_at
  before insert on orders
  for each row execute function set_order_confirmed_at();

-- When siesta ends, every order that queued up during it gets confirmed
-- at that exact moment, all at once.
create or replace function confirm_queued_orders()
returns trigger as $$
begin
  if old.siesta = true and new.siesta = false then
    update orders set confirmed_at = now() where confirmed_at is null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists bar_status_confirm_orders on bar_status;
create trigger bar_status_confirm_orders
  after update on bar_status
  for each row execute function confirm_queued_orders();
