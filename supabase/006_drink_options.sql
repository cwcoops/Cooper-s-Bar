-- Cooper's Bar — migration 006: per-drink customer choices (e.g. flavour).
-- Run this ONCE in the SQL Editor of your already-set-up project.
-- Nullable columns, so every existing drink is completely unaffected —
-- only drinks the bartender explicitly configures will show a dropdown.

alter table drinks add column if not exists option_label text;
alter table drinks add column if not exists option_choices jsonb;

-- Demo drink so you can see it working immediately: an Ice Pop under Ice
-- Cream with a "Select your flavour" dropdown. Feel free to edit or delete
-- it from the Drinks admin screen once you've tried it — it's just an
-- example. Silently skipped if there's no Ice Cream category (e.g. you
-- renamed/deleted it) or an Ice Pop is already there, so this is safe to
-- run more than once.
insert into drinks (name, category_id, option_label, option_choices)
select 'Ice Pop', c.id, 'flavour', '["Strawberry", "Orange", "Cola", "Lemon"]'::jsonb
from categories c
where c.name = 'Ice Cream'
  and not exists (
    select 1 from drinks d where d.name = 'Ice Pop' and d.category_id = c.id
  );
