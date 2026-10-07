import os
import json
import pygsheets
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend'))
from drive_csv import CSV_DRIVE_ID, fetch_csv_content_from_drive, validated_csv_rows

SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', 'credentials.json')
SPREADSHEET_ID = '1khmTUewP3EJremrR388R4-rjLZ8ej0RcnGyCfLFYpuY'

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
                    v = str(item['Value']).strip()
                    if v:
                        items.append(v)
                elif isinstance(item, str):
                    v = item.strip()
                    if v:
                        items.append(v)
            return ", ".join(items)
        elif isinstance(data, dict) and 'Value' in data:
            return str(data['Value']).strip()
    except Exception:
        pass
    return val_str

def sync_jobseekers_csv_to_drive():
    if "GOOGLE_CREDENTIALS" in os.environ:
        try:
            gc = pygsheets.authorize(service_account_env_var='GOOGLE_CREDENTIALS')
        except Exception:
            gc = pygsheets.authorize(service_file=SERVICE_ACCOUNT_FILE)
    else:
        gc = pygsheets.authorize(service_file=SERVICE_ACCOUNT_FILE)

    csv_data = fetch_csv_content_from_drive(gc, CSV_DRIVE_ID)
    reader = validated_csv_rows(csv_data)
    source_desc = f"Google Drive (ID: {CSV_DRIVE_ID})"

    headers = [
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

    matrix = [headers]
    for r in reader:
        row = [
            r.get('FullName', '').strip(),
            r.get('EmploymentAdvisor', '').strip(),
            r.get('Phone', '').strip(),
            r.get('City', '').strip(),
            r.get('StreetAddress', '').strip(),
            r.get('ZipCode', '').strip(),
            parse_complex_field(r.get('JobTypesDesired')),
            parse_complex_field(r.get('SpecialConsiderations')),
            parse_complex_field(r.get('EngagementLevel')),
            r.get('Comments', '').strip()
        ]
        matrix.append(row)

    print(f"Prepared {len(matrix) - 1} rows of data from {source_desc}.")

    sh = gc.open_by_key(SPREADSHEET_ID)
    wks = sh.sheet1

    # Clear existing data on worksheet
    wks.clear()
    print("Cleared existing data on Google Drive spreadsheet.")

    # Update worksheet with new header and data rows
    wks.update_values(crange='A1', values=matrix)
    print(f"Successfully updated Google Drive spreadsheet '{sh.title}' ({SPREADSHEET_ID}) with {len(matrix) - 1} job seeker records!")

if __name__ == '__main__':
    sync_jobseekers_csv_to_drive()
