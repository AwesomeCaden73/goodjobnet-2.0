import os
import csv
import json
import pygsheets

SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', 'credentials.json')
CSV_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'datafiles', 'JobSeekerList.csv')
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
    if not os.path.exists(CSV_FILE_PATH):
        raise FileNotFoundError(f"CSV file not found at {CSV_FILE_PATH}")

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

    with open(CSV_FILE_PATH, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
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

    print(f"Prepared {len(matrix) - 1} rows of data from {CSV_FILE_PATH}.")

    if "GOOGLE_CREDENTIALS" in os.environ:
        try:
            gc = pygsheets.authorize(service_account_env_var='GOOGLE_CREDENTIALS')
        except Exception:
            gc = pygsheets.authorize(service_file=SERVICE_ACCOUNT_FILE)
    else:
        gc = pygsheets.authorize(service_file=SERVICE_ACCOUNT_FILE)

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
