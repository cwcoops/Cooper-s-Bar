-- Cooper's Bar — migration 005: order location.
-- Run this ONCE in the SQL Editor of your already-set-up project.
-- Nullable, so existing orders are completely unaffected — only new
-- orders from the updated Checkout screen will have a location set.

alter table orders add column if not exists location text;
