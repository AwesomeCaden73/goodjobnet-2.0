import csv
import json

def parse_complex_field(val):
    if not val or not val.strip():
        return ""
    val_str = val.strip()
    try:
        data = json.loads(val_str)
        if isinstance(data, list):
            items = []
            for item in data:
                if isinstance(item, dict) and 'Value' in item:
                    items.append(str(item['Value']))
                elif isinstance(item, str):
                    items.append(item)
            return ", ".join([i for i in items if i])
        elif isinstance(data, dict) and 'Value' in data:
            return str(data['Value'])
    except Exception:
        pass
    return val_str

with open('datafiles/JobSeekerList.csv', mode='r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for idx, r in enumerate(reader):
        jt = parse_complex_field(r.get('JobTypesDesired'))
        sc = parse_complex_field(r.get('SpecialConsiderations'))
        el = parse_complex_field(r.get('EngagementLevel'))
        if jt or sc or el:
            print(f"Row {idx:2d} ({r.get('FullName').strip()}): JT='{jt}' | SC='{sc}' | EL='{el}'")
