-- entrepots (9 records)
insert into entrepots (code, description) values
  ('BW-02', 'DUFRY (LUCHTHAVEN)'),
  ('BW-04', 'ARUBA INTERNATIONAL AIRPORT'),
  ('GE-01', 'EASY CARGO'),
  ('GE-03', 'BON BINI CARGO'),
  ('GE-05', 'MASTERCARGO'),
  ('GE-32', 'CAVALIER LOGISTICS'),
  ('VZOP-06', 'TABACAL FREEZOVE N.V.'),
  ('VZOP-07', 'TRANSIMEX FREEZONE N.V.'),
  ('GE-30', 'COMPLETE LOGISTICS')
on conflict do nothing;

