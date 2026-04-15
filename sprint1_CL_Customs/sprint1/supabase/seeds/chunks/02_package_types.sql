-- package_types (25 records)
insert into package_types (code, description) values
  ('CTNS', 'KARTONS, DOZEN'),
  ('KSTN', 'KISTEN'),
  ('ZKEN', 'ZAKKEN'),
  ('BLEN', 'BALEN'),
  ('RLEN', 'ROLLEN'),
  ('HSPL', 'HASPELS'),
  ('BDLS', 'BUNDELS'),
  ('EMRS', 'EMMERS'),
  ('STKS', 'STUKS'),
  ('VTEN', 'VATEN'),
  ('TNKS', 'TANKS'),
  ('BLKN', 'BLIKKEN'),
  ('FLSN', 'FLESSEN'),
  ('PLTS', 'PALLETS'),
  ('LSGS', 'LOS GESTORT'),
  ('KRTN', 'KRATTEN'),
  ('COLLI', 'COLLI'),
  ('HLTS', 'HECTOLITERS'),
  ('PKJS', '20 STUKS'),
  ('MTNN', 'METRIEKE TONNEN'),
  ('PREN', 'PAREN'),
  ('MTRS', 'METERS'),
  ('KMTS', 'KUBIEKE METERS'),
  ('KGMN', 'KILOGRAMMEN'),
  ('VMTRS', 'VIERKANTE METERS')
on conflict do nothing;

