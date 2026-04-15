-- delivery_terms (15 records)
insert into delivery_terms (code, description, place) values
  ('FOB', 'VRIJ AAN BOORD', NULL),
  ('CIF', 'KOSTEN, VERZEKERING, VRACHT', 'ARUBA'),
  ('EXW', 'AF FABRIEK', NULL),
  ('FCA', 'VRACHTVRIJ TOT VERVOERDER', NULL),
  ('FAS', 'VRIJ LANGSZIJ', NULL),
  ('CPT', 'VRACHTVRIJ TOT', NULL),
  ('CIP', 'VRACHTVRIJ INCLUSIEF VERZEKERI', 'ARUBA'),
  ('DAF', 'FRANCO GRENS', NULL),
  ('DES', 'FRANCO OF SHIP', NULL),
  ('DEQ', 'FRANCO AF KADE', NULL),
  ('DDK', 'FRANCO EXCLUSIEF RECHTEN', NULL),
  ('DDP', 'FRANCO INCLUSIEF RECHTEN', NULL),
  ('DES', 'DES', NULL),
  ('C&F', 'COST EN VRACHT', 'ARUBA'),
  ('CFR', 'COST AND  FREIGHT', 'ARUBA')
on conflict do nothing;

