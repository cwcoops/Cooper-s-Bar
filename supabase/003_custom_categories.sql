-- Cooper's Bar — migration 003: barman-editable drink categories.
-- Run this ONCE in the SQL Editor of your already-set-up project (i.e. you
-- already ran schema.sql and 002_tips_categories_siesta.sql before).
-- Turns categories from a fixed list into a real table the bartender can
-- add/rename/delete from. Safe to run even with existing drinks/orders.

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🍹',
  created_at timestamptz not null default now()
);

create unique index if not exists categories_name_unique_ci on categories (lower(name));

alter table categories enable row level security;
drop policy if exists "open access" on categories;
create policy "open access" on categories for all using (true) with check (true);

-- Brand-new table, so this can't already be a member — should always
-- succeed. (If you ever re-run this after it already succeeded once, it
-- WILL error here with "already a member of publication" — that's fine,
-- ignore it and move on.)
alter publication supabase_realtime add table categories;

-- Seed categories to match the current fixed list, skipping any that
-- already exist (case-insensitively) so this is safe to re-run.
insert into categories (name, emoji)
select v.name, v.emoji
from (values
  ('Fizzy Drinks', '🥤'),
  ('Beers', '🍺'),
  ('Juices', '🧃'),
  ('Wine', '🍷'),
  ('Water', '💧'),
  ('Combos', '🍹'),
  ('Snacks', '🍿'),
  ('Ice Cream', '🍦'),
  ('Other', '✨')
) as v(name, emoji)
where not exists (
  select 1 from categories c where lower(c.name) = lower(v.name)
);

-- Point drinks at the new categories table instead of a fixed text value.
alter table drinks add column if not exists category_id uuid references categories(id) on delete restrict;

update drinks d
set category_id = c.id
from categories c
where d.category_id is null
  and lower(c.name) = lower(
    case d.category
      when 'fizzy_drinks' then 'Fizzy Drinks'
      when 'beers' then 'Beers'
      when 'juices' then 'Juices'
      when 'wine' then 'Wine'
      when 'water' then 'Water'
      when 'combos' then 'Combos'
      when 'snacks' then 'Snacks'
      when 'ice_cream' then 'Ice Cream'
      else 'Other'
    end
  );

alter table drinks alter column category_id set not null;
alter table drinks drop column if exists category;
