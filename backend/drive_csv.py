"""Read the SharePoint CSV export from Drive without mutating any files."""
import csv
import io

CSV_DRIVE_ID = '15rGolLs1_3u8qEbtZyrGZGGrtzLWoV3I'


def fetch_csv_content_from_drive(gc, drive_id=CSV_DRIVE_ID):
    files_api = gc.drive.service.files()
    metadata = files_api.get(fileId=drive_id, fields='id,name,mimeType').execute()
    target_id = drive_id
    if metadata.get('mimeType') == 'application/vnd.google-apps.folder':
        files = []
        page_token = None
        while True:
            options = {'q': f"'{drive_id}' in parents and trashed = false",
                       'fields': 'nextPageToken,files(id,name,mimeType)'}
            if page_token:
                options['pageToken'] = page_token
            response = files_api.list(**options).execute()
            files.extend(response.get('files', []))
            page_token = response.get('nextPageToken')
            if not page_token:
                break
        candidates = [file for file in files if file.get('name') == 'JobSeekerList.csv']
        if not candidates:
            candidates = [file for file in files if file.get('name', '').lower().endswith('.csv')]
        if len(candidates) != 1:
            raise ValueError('Drive folder must contain JobSeekerList.csv or one unambiguous CSV export.')
        target_id = candidates[0]['id']
    content = files_api.get_media(fileId=target_id).execute()
    return content.decode('utf-8-sig')


def validated_csv_rows(csv_text):
    reader = csv.DictReader(io.StringIO(csv_text))
    if not reader.fieldnames or 'FullName' not in reader.fieldnames:
        raise ValueError('SharePoint CSV must contain the FullName column.')
    rows = list(reader)
    if not rows or not any((row.get('FullName') or '').strip() for row in rows):
        raise ValueError('SharePoint CSV contains no named job seekers; destination was not cleared.')
    return rows
