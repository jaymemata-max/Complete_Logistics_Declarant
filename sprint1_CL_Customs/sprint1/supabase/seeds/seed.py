#!/usr/bin/env python3
"""
CL Customs — Sprint 1 Seed Script
Reads VD DBF files and outputs SQL INSERT statements for all reference tables.

Usage:
  python3 seed.py --dbf-dir /path/to/VDAUA5/data --output seed_data.sql

Then run seed_data.sql in your Supabase SQL editor.
"""

import struct
import argparse
import os
import sys

# ── DBF reader ────────────────────────────────────────────────────────────────

def read_dbf(path):
    if not os.path.exists(path):
        print(f"  SKIP: {path} not found", file=sys.stderr)
        return []
    with open(path, 'rb') as f:
        header = f.read(32)
        num_records = struct.unpack('<I', header[4:8])[0]
        header_size = struct.unpack('<H', header[8:10])[0]
        record_size = struct.unpack('<H', header[10:12])[0]
        fields = []
        while True:
            fd = f.read(32)
            if not fd or fd[0] == 0x0D:
                break
            name = fd[:11].replace(b'\x00', b'').decode('ascii', errors='replace')
            ftype = chr(fd[11])
            length = fd[16]
            fields.append((name, ftype, length))
        f.seek(header_size)
        rows = []
        for _ in range(num_records):
            rec = f.read(record_size)
            if not rec or len(rec) < record_size:
                break
            if rec[0] == 0x2A:  # deleted
                continue
            row = {}
            offset = 1
            for fname, ftype, flen in fields:
                val = rec[offset:offset + flen]
                try:
                    row[fname] = val.decode('latin-1').strip()
                except Exception:
                    row[fname] = ''
                offset += flen
            rows.append(row)
    return rows


def esc(val):
    """Escape a string for SQL single-quoted literal."""
    if val is None or val == '':
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"


def num(val):
    """Return a numeric SQL literal or NULL."""
    v = str(val).strip() if val else ''
    if v == '' or v == '0.00' or v == '0':
        return 'NULL'
    try:
        float(v)
        return v
    except ValueError:
        return 'NULL'


# ── Seed functions ────────────────────────────────────────────────────────────

def seed_countries(dbf_dir):
    rows = read_dbf(f'{dbf_dir}/landen.dbf')
    lines = []
    for r in rows:
        if not r.get('CCODE'):
            continue
        lines.append(
            f"({esc(r['CCODE'])}, {esc(r.get('CLANDNAAM',''))}, {esc(r.get('CZONE',''))})"
        )
    return 'countries', '(code, name, zone)', lines


def seed_package_types(dbf_dir):
    rows = read_dbf(f'{dbf_dir}/colli.dbf')
    lines = []
    for r in rows:
        if not r.get('CCODE'):
            continue
        lines.append(f"({esc(r['CCODE'])}, {esc(r.get('CDESCRIPTI',''))})")
    return 'package_types', '(code, description)', lines


def seed_delivery_terms(dbf_dir):
    rows = read_dbf(f'{dbf_dir}/leveringsvoorwaarde.dbf')
    lines = []
    for r in rows:
        if not r.get('CCODE'):
            continue
        lines.append(
            f"({esc(r['CCODE'])}, {esc(r.get('COMSCHRIJV',''))}, {esc(r.get('CPLAATS',''))})"
        )
    return 'delivery_terms', '(code, description, place)', lines


def seed_locations_of_goods(dbf_dir):
    rows = read_dbf(f'{dbf_dir}/plaatsgoederen.dbf')
    lines = []
    for r in rows:
        if not r.get('CCODE'):
            continue
        lines.append(f"({esc(r['CCODE'])}, {esc(r.get('CPLAATS',''))})")
    return 'locations_of_goods', '(code, place)', lines


def seed_entrepots(dbf_dir):
    rows = read_dbf(f'{dbf_dir}/entrepots.dbf')
    lines = []
    for r in rows:
        if not r.get('CCODE'):
            continue
        lines.append(f"({esc(r['CCODE'])}, {esc(r.get('CDESCRIPT',''))})")
    return 'entrepots', '(code, description)', lines


def seed_payment_accounts(dbf_dir):
    rows = read_dbf(f'{dbf_dir}/rekeninghouder.dbf')
    lines = []
    for r in rows:
        if not r.get('CCODE'):
            continue
        lines.append(f"({esc(r['CCODE'])}, {esc(r.get('CDESCRIPTI',''))})")
    return 'payment_accounts', '(code, description)', lines


def seed_iso_container_codes(dbf_dir):
    rows = read_dbf(f'{dbf_dir}/isocontcode.dbf')
    lines = []
    for r in rows:
        if not r.get('CCODE'):
            continue
        lines.append(f"({esc(r['CCODE'])}, {esc(r.get('CDESCRIPTI',''))})")
    return 'iso_container_codes', '(code, description)', lines


def seed_cpc_codes(dbf_dir):
    rows = read_dbf(f'{dbf_dir}/apc.dbf')
    lines = []
    for r in rows:
        code = r.get('CMODELCODE', '')
        if not code:
            continue
        # Derive extended and national from code (format: 4000-000)
        parts = code.split('-')
        extended = parts[0] if len(parts) > 0 else ''
        national = parts[1] if len(parts) > 1 else ''
        lines.append(
            f"({esc(code)}, {esc(extended)}, {esc(national)}, "
            f"{esc(r.get('CTYPE',''))}, {esc(r.get('CTAXCODE',''))}, "
            f"{esc(r.get('COMSCHRIJV',''))}, {esc(r.get('CVRIJSTELL',''))})"
        )
    return 'cpc_codes', '(code, extended, national, type, tax_code, description, exemption)', lines


def seed_ports(dbf_dir):
    rows = read_dbf(f'{dbf_dir}/ports.dbf')
    lines = []
    seen = set()
    for r in rows:
        code = r.get('CCODE', '')
        if not code or code in seen:
            continue
        seen.add(code)
        lines.append(
            f"({esc(code)}, {esc(r.get('CDESCRIP',''))}, {esc(r.get('CLANDCODE',''))})"
        )
    return 'ports', '(code, description, country_code)', lines


def seed_commodity_master(dbf_dir):
    rows = read_dbf(f'{dbf_dir}/handelsbenaming.dbf')
    lines = []
    for r in rows:
        keyword = r.get('CHANDELSBE', '')
        if not keyword:
            continue
        lines.append(
            f"({esc(keyword)}, {esc(r.get('CGOEDERENC',''))}, "
            f"{esc(r.get('COMSCHRIJV',''))}, {esc(r.get('CDOMSCHRIJ',''))}, "
            f"{esc(r.get('CDOMSCHRI2',''))}, {esc(r.get('CDOMSCHRI3',''))}, "
            f"{esc(r.get('CDOMSCHRI4',''))}, "
            f"{esc(r.get('CMERKEN1',''))}, {esc(r.get('CMERKEN2',''))}, {esc(r.get('CMERKEN3',''))}, "
            f"{esc(r.get('CCOLLICODE',''))}, {esc(r.get('CQTYCOLLIC',''))}, "
            f"{num(r.get('NQUANTITY_',''))}, {num(r.get('NQUANTITY2',''))}, {num(r.get('NQUANTITY3',''))})"
        )
    return 'commodity_master', (
        '(keyword, hs_code, commercial_description, goods_description, '
        'goods_description_2, goods_description_3, goods_description_4, '
        'marks_1, marks_2, marks_3, package_code, supp_unit_code, '
        'supp_unit_qty_1, supp_unit_qty_2, supp_unit_qty_3)'
    ), lines


def seed_importers(dbf_dir):
    rows = read_dbf(f'{dbf_dir}/namen.dbf')
    lines = []
    seen = set()
    for r in rows:
        code = r.get('CNAMECODE', '')
        if not code or code in seen:
            continue
        seen.add(code)
        lines.append(
            f"({esc(code)}, {esc(r.get('CNAME',''))}, "
            f"{esc(r.get('CADDRESS1',''))}, {esc(r.get('CADDRESS2',''))}, {esc(r.get('CADDRESS3',''))}, "
            f"{esc(r.get('CAANGEVERN',''))}, {esc(r.get('CCONTACT',''))}, "
            f"{esc(r.get('CTELEPHONE',''))}, {esc(r.get('CFAX',''))}, "
            f"{esc(r.get('CEMAIL',''))}, {esc(r.get('CKVKNUMMER',''))}, "
            f"{esc(r.get('CDUTYTERMS',''))})"
        )
    return 'importers', (
        '(asycuda_code, name, address1, address2, address3, '
        'asycuda_name, contact, phone, fax, email, kvk_number, default_duty_terms)'
    ), lines


def seed_freight_rates(dbf_dir):
    rows = read_dbf(f'{dbf_dir}/freightrates.dbf')
    lines = []
    for r in rows:
        w = r.get('NWEIGHT', '')
        if not w:
            continue
        lines.append(
            f"({num(w)}, {esc(r.get('CCURRENCY',''))}, "
            f"{num(r.get('NZONEA',''))}, {num(r.get('NZONEB',''))}, "
            f"{num(r.get('NZONEC',''))}, {num(r.get('NZONED',''))}, "
            f"{num(r.get('NZONEE',''))}, {num(r.get('NZONEF',''))}, "
            f"{num(r.get('NZONEG',''))}, {num(r.get('NZONEH',''))})"
        )
    return 'freight_rates', '(weight, currency, zone_a, zone_b, zone_c, zone_d, zone_e, zone_f, zone_g, zone_h)', lines


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Generate seed SQL from VD DBF files')
    parser.add_argument('--dbf-dir', required=True, help='Path to VD data/ directory')
    parser.add_argument('--output', default='seed_data.sql', help='Output SQL file')
    args = parser.parse_args()

    seeders = [
        seed_countries,
        seed_package_types,
        seed_delivery_terms,
        seed_locations_of_goods,
        seed_entrepots,
        seed_payment_accounts,
        seed_iso_container_codes,
        seed_cpc_codes,
        seed_ports,
        seed_commodity_master,
        seed_importers,
        seed_freight_rates,
    ]

    with open(args.output, 'w', encoding='utf-8') as out:
        out.write('-- CL Customs — Reference Table Seed Data\n')
        out.write('-- Generated from VD DBF files\n')
        out.write('-- Run in Supabase SQL editor AFTER running 001_schema.sql\n\n')

        for seeder in seeders:
            table, columns, lines = seeder(args.dbf_dir)
            if not lines:
                print(f'  WARN: no records for {table}', file=sys.stderr)
                continue

            print(f'  {table}: {len(lines)} records')
            out.write(f'-- {table} ({len(lines)} records)\n')
            out.write(f'insert into {table} {columns} values\n')

            # Write in batches of 500 to avoid hitting SQL editor limits
            batch_size = 500
            for i in range(0, len(lines), batch_size):
                batch = lines[i:i + batch_size]
                is_last_batch = (i + batch_size) >= len(lines)
                if i > 0:
                    out.write(f'insert into {table} {columns} values\n')
                out.write(',\n'.join(f'  {l}' for l in batch))
                out.write('\non conflict do nothing;\n\n')

    print(f'\nDone. SQL written to {args.output}')


if __name__ == '__main__':
    main()
