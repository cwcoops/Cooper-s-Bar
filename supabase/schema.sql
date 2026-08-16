-- Cooper's Bar — Supabase schema, RLS policies, realtime, and seed data.
-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run.
--
-- (If you already ran an older version of this file, don't re-run this one
-- — it'll fail trying to recreate tables that already exist. Use the
-- matching numbered migration files instead, in order:
-- 002_tips_categories_siesta.sql, 003_custom_categories.sql,
-- 004_announcements.sql, 005_location.sql, 006_drink_options.sql. This
-- file is only for a brand-new project.)

create extension if not exists pgcrypto;

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🍹',
  created_at timestamptz not null default now()
);

create unique index categories_name_unique_ci on categories (lower(name));

create table drinks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid not null references categories(id) on delete restrict,
  description text,
  sold_out boolean not null default false,
  -- If set, customers must pick one of option_choices (e.g. option_label
  -- 'flavour', option_choices '["Strawberry","Orange"]') before this drink
  -- can be added to an order. Both null means no dropdown is shown.
  option_label text,
  option_choices jsonb,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  location text,
  priority text not null check (priority in ('immediate','casual','spanish_way')),
  items jsonb not null, -- snapshot: [{ name, category, quantity }]
  ice boolean not null default false,
  comment text,
  tip numeric(10,2) not null default 0 check (tip >= 0), -- theoretical only, nobody is charged
  status text not null default 'pending' check (status in ('pending','completed')),
  created_at timestamptz not null default now(),
  -- confirmed_at is when the order actually starts counting toward wait
  -- time. Normally set the instant the order is placed. If placed during a
  -- siesta, it stays null until siesta ends (see bar_status below), so nap
  -- time is never counted as part of anyone's wait.
  confirmed_at timestamptz,
  completed_at timestamptz
);

-- Singleton row tracking whether the barman is currently on siesta, plus
-- any announcement currently shown on the customer Home screen.
create table bar_status (
  id int primary key default 1,
  siesta boolean not null default false,
  announcement text,
  updated_at timestamptz not null default now(),
  constraint bar_status_singleton check (id = 1)
);

insert into bar_status (id, siesta) values (1, false);

alter table categories enable row level security;
alter table drinks enable row level security;
alter table orders enable row level security;
alter table bar_status enable row level security;

-- No accounts/login in this app — every visitor with the link reads and
-- writes freely. Fine for a private link shared with friends only.
create policy "open access" on categories for all using (true) with check (true);
create policy "open access" on drinks for all using (true) with check (true);
create policy "open access" on orders for all using (true) with check (true);
create policy "open access" on bar_status for all using (true) with check (true);

-- Realtime: add all tables to the publication so postgres_changes
-- subscriptions fire on insert/update/delete. If this errors with
-- "relation is already member of publication", Realtime is already on for
-- that table (some projects enable it for every table by default) — ignore
-- the error and move on.
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table drinks;
alter publication supabase_realtime add table orders;
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

create trigger orders_set_confirmed_at
  before insert on orders
  for each row execute function set_order_confirmed_at();

-- When siesta ends, every order that queued up during it gets confirmed at
-- that exact moment, all at once.
create or replace function confirm_queued_orders()
returns trigger as $$
begin
  if old.siesta = true and new.siesta = false then
    update orders set confirmed_at = now() where confirmed_at is null;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger bar_status_confirm_orders
  after update on bar_status
  for each row execute function confirm_queued_orders();

-- Seed categories, then seed drinks by looking up each category's id by
-- name. "Other" (and Snacks / Ice Cream) are left empty — add drinks to
-- them later from the bartender's Drinks admin screen. The bartender can
-- also add, rename, or delete categories entirely from that same screen.
insert into categories (name, emoji) values
  ('Fizzy Drinks', '🥤'),
  ('Beers', '🍺'),
  ('Juices', '🧃'),
  ('Wine', '🍷'),
  ('Water', '💧'),
  ('Combos', '🍹'),
  ('Snacks', '🍿'),
  ('Ice Cream', '🍦'),
  ('Other', '✨');

insert into drinks (name, category_id, description)
select v.name, c.id, v.description
from (values
  ('Coke Zero', 'Fizzy Drinks', null),
  ('Amstel Normal', 'Beers', null),
  ('Alhambra', 'Beers', null),
  ('Amstel Lemon', 'Beers', null),
  ('El Aguila', 'Beers', null),
  ('Apple juice', 'Juices', null),
  ('Champagne', 'Wine', null),
  ('Chardonnay', 'Wine', null),
  ('Water', 'Water', null),
  ('Fizzy water', 'Water', null),
  ('Amaretto + Coke', 'Combos', null),
  ('Emelia Special', 'Combos', 'Strawberry gin, sprite and orange juice')
) as v(name, category_name, description)
join categories c on c.name = v.category_name;
