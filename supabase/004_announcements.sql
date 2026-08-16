-- Cooper's Bar — migration 004: barman announcements.
-- Run this ONCE in the SQL Editor of your already-set-up project.
-- bar_status already has RLS, an open policy, and realtime enabled from
-- migration 002, so this new column is automatically covered by all of
-- that — nothing else to set up.

alter table bar_status add column if not exists announcement text;
