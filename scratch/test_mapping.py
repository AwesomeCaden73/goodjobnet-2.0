import csv
import json

def parse_complex_field(val):
    if not val or not str(val).strip():
        return ""
    val_str = str(val).strip()
    try:
        data = json.loads(val_str)
        if isinstance(data, list):
            items = []
            for item in data:
                if isinstance(item, dict) and 'Value' in item:
                    items.append(str(item['Value']).strip())
                elif isinstance(item, str):
                    items.append(item.strip())
            return ", ".join([i for i in items if i])
        elif isinstance(data, dict) and 'Value' in data:
            return str(data['Value']).strip()
    except Exception:
        pass
    return val_str

target_headers = [
    'Full Name',
    'Employment Advisor',
    'Phone',
    'City',
    'Street Address',
    'ZipCode',
    'Desired Job Types',
    'Special Considerations',
    'Engagement Level',
    'Comments'
]

with open('datafiles/JobSeekerList.csv', mode='r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    transformed_rows = []
    for r in reader:
        row_dict = {
            'Full Name': r.get('FullName', '').strip(),
            'Employment Advisor': r.get('EmploymentAdvisor', '').strip(),
            'Phone': r.get('Phone', '').strip(),
            'City': r.get('City', '').strip(),
            'Street Address': r.get('StreetAddress', '').strip(),
            'ZipCode': r.get('ZipCode', '').strip(),
            'Desired Job Types': parse_complex_field(r.get('JobTypesDesired')),
            'Special Considerations': parse_complex_field(r.get('SpecialConsiderations')),
            'Engagement Level': parse_complex_field(r.get('EngagementLevel')),
            'Comments': r.get('Comments', '').strip()
        }
        transformed_rows.append(row_dict)

print(f"Parsed {len(transformed_rows)} rows successfully.")
print("\nFirst 5 rows:")
for r in transformed_rows[:5]:
    print(r)
