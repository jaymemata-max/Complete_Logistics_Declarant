-- locations_of_goods (18 records)
insert into locations_of_goods (code, place) values
  ('CK01', 'CONTAINERKADE'),
  ('AL01', 'ANDERE LOKATIE'),
  ('HB01', 'HAVEN BARCADERA'),
  ('HN01', 'HAVEN SAN NICOLAS'),
  ('LO-01', 'GOUVERMENTS ENTREPOT LOODS 6'),
  ('LO-02', 'LOS LOODS'),
  ('OT01', 'OIL TERMINAL'),
  ('PB01', 'PIER B'),
  ('RT-04', 'WORLD WIDE COURIER (DHL)'),
  ('RT-08', 'FAST DELIVERY'),
  ('GE-30', 'GE-30'),
  ('PEPIA', 'PEPIA'),
  ('AMERIJET', 'AMERIJET'),
  ('RT-06', 'AMERIJET'),
  ('DHL', 'RT-04'),
  ('RT-01', 'SWISSPORT'),
  ('RT-07', 'AMERICAN AIRLINES'),
  ('HB-03', 'BARCADERA')
on conflict do nothing;

