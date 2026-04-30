insert into public.categories (name, slug, sort_order, is_active)
values
  ('Tools', 'tools', 10, true),
  ('Landscape tools', 'landscape-tools', 20, true),
  ('Vanity''s', 'vanitys', 30, true),
  ('Appliances', 'appliances', 40, true),
  ('Lights', 'lights', 50, true),
  ('Doors and windows', 'doors-and-windows', 60, true),
  ('Bathtub, shower set & base', 'bathtub-shower-set-base', 70, true),
  ('Sink', 'sink', 80, true),
  ('For Kids', 'for-kids', 90, true)
on conflict (slug) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
