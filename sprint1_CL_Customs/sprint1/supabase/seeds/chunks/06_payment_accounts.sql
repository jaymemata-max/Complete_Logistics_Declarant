-- payment_accounts (3 records)
insert into payment_accounts (code, description) values
  ('NVT', 'NIET VAN TOEPASSING'),
  ('CONTANT', 'CONTANT'),
  ('KREDIET', 'KREDIET')
on conflict do nothing;

