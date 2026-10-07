"""Offline integration tests. All Google services are mocked."""
import unittest
import json
from unittest.mock import MagicMock, patch

import app as backend
from drive_csv import fetch_csv_content_from_drive, validated_csv_rows


class UpstreamIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.client = backend.app.test_client()
        backend._cache.clear()
        self.sheet = MagicMock()
        self.sheet.get_row.return_value = ['Name', 'Phone', 'Desired Types', 'Approved', 'Username']
        self.sheet.get_col.return_value = ['Name', 'Existing person']
        self.gc = MagicMock()
        self.gc.open_by_key.return_value.sheet1 = self.sheet
        self.gc.open_by_key.return_value.worksheet_by_title.return_value = self.sheet
        self.gc.open.return_value.worksheet_by_title.return_value = self.sheet
        self.patcher = patch.object(backend, 'get_gsheets_client', return_value=self.gc)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)

    def test_seeker_creation_and_editing_remain_available(self):
        response = self.client.post('/api/submit-seeker', json={'name': 'Test Person', 'desired_job_types': ['Retail']})
        self.assertEqual(response.status_code, 200)
        self.sheet.append_table.assert_called_once()
        response = self.client.post('/api/update-seeker', json={'row_index': 4, 'phone': '5551234567', 'desired_job_types': ['Retail', 'Driver']})
        self.assertEqual(response.status_code, 200)
        self.sheet.update_value.assert_any_call((4, 2), '5551234567')
        self.sheet.update_value.assert_any_call((4, 3), 'Retail, Driver')

    def test_new_job_starts_at_column_a(self):
        response = self.client.post('/api/submit-job', json={'company_name': 'Test Co'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])
        self.sheet.append_table.assert_not_called()
        self.assertEqual(self.sheet.update_values.call_args.kwargs['crange'], 'A3')
        self.assertEqual(self.sheet.update_values.call_args.kwargs['values'][0][0], 'Test Co')

    def test_registration_starts_at_column_a(self):
        with patch.object(backend, 'get_users_records', return_value=[]):
            response = self.client.post('/api/register', json={'name': 'Test User', 'username': 'test', 'password': 'test-password'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])
        self.sheet.append_table.assert_not_called()
        self.assertEqual(self.sheet.update_values.call_args.kwargs['crange'], 'A3')

    def test_export_preserves_manual_rows_then_writes_new_jobs_from_column_a(self):
        types = MagicMock()
        types.get_all_records.return_value = [{'Job Types': 'Retail', 'City for Search Area (only one location can be listed)': 'Kissimmee, FL'}]
        companies = MagicMock()
        companies.get_all_records.return_value = []
        self.sheet.get_row.return_value = ['Name', 'Available Jobs', 'Career Page', 'Validated/Entered By (Name)']
        self.sheet.get_all_records.return_value = [{'Name': 'Manual Co', 'Available Jobs': 'Driver', 'Career Page': 'https://example.com/manual', 'Validated/Entered By (Name)': 'Reviewer'}]
        sheets = {'JobTypes to Search': types, 'Companies to Search': companies, 'Job_Postings': self.sheet}
        self.gc.open_by_key.return_value.worksheet_by_title.side_effect = sheets.__getitem__
        result = {'data': {'jobs': [{'employer_name': 'New Co', 'job_title': 'Retail', 'job_city': 'Kissimmee', 'job_state': 'FL', 'job_apply_link': 'https://example.com/new'}]}}
        with patch.object(backend.urllib.request, 'urlopen') as urlopen, patch.object(backend, 'search_company_career_sites', return_value=[]):
            urlopen.return_value.__enter__.return_value.read.return_value = json.dumps(result).encode()
            response = self.client.post('/api/export-jsearch-jobs', json={'rapidapi_key': 'offline-test'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['count'], 1)
        calls = self.sheet.update_values.call_args_list
        self.assertEqual([call.kwargs['crange'] for call in calls], ['A2', 'A3'])
        self.assertEqual(calls[0].kwargs['values'][0][0], 'Manual Co')
        self.assertEqual(calls[1].kwargs['values'][0][0], 'New Co')
        self.sheet.append_table.assert_not_called()

    def test_delete_invalid_indices_never_touch_sheets(self):
        for row in [None, 0, 1, -1, True, 2.5, 'invalid']:
            with self.subTest(row=row):
                response = self.client.post('/api/delete-hot-job', json={'row_index': row})
                self.assertEqual(response.status_code, 400)
        self.gc.open_by_key.assert_not_called()

    def test_delete_job_invalidates_cached_rows(self):
        backend._cache['master_jobs_records'] = {'data': [], 'timestamp': 0}
        response = self.client.post('/api/delete-hot-job', json={'row_index': 4})
        self.assertEqual(response.status_code, 200)
        self.sheet.delete_rows.assert_called_once_with(4)
        self.assertNotIn('master_jobs_records', backend._cache)

    def test_job_update_invalidates_cache_without_submitter_column(self):
        backend._cache['master_jobs_records'] = {'data': [], 'timestamp': 0}
        response = self.client.post('/api/update-hot-job', json={'row_index': 4, 'company_name': 'Changed'})
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('master_jobs_records', backend._cache)

    def test_zip_search_retains_combined_filters_and_both_hiring_groups(self):
        today = backend.datetime.date.today().isoformat()
        def job(company, role, zipcode, hiring='TRUE'):
            return {'Name': company, 'Available Jobs': role, 'Zip': zipcode, 'Currently Hiring': hiring, 'Date last verified': today}
        records = [job('Test Co', 'Retail', '01234'), job('Test Co', 'Retail', '01234-5678', 'FALSE'),
                   job('Test Co', 'Retail', '01235'), job('Other Co', 'Retail', '01234'), job('Test Co', 'Driver', '01234')]
        with patch.object(backend, 'get_master_jobs_records', return_value=records), patch.object(backend, 'get_zip_coordinates') as coordinates:
            response = self.client.post('/api/search-jobs', json={'search_type': 'type-location', 'location_mode': 'zipcode', 'zipcode': '01234', 'company_name': 'Test', 'job_types': ['Retail']})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json['results']['recent']), 1)
        self.assertEqual(len(response.json['results']['older']), 1)
        coordinates.assert_not_called()

    def test_invalid_zip_fails_instead_of_browsing_all_jobs(self):
        with patch.object(backend, 'get_master_jobs_records') as records:
            response = self.client.post('/api/search-jobs', json={'location_mode': 'zipcode', 'zipcode': 'invalid'})
        self.assertEqual(response.status_code, 400)
        records.assert_not_called()

    def test_drive_source_accepts_a_direct_csv_and_utf8_bom(self):
        files = self.gc.drive.service.files.return_value
        files.get.return_value.execute.return_value = {'mimeType': 'text/csv'}
        files.get_media.return_value.execute.return_value = b'\xef\xbb\xbfFullName\nTest Person\n'
        self.assertEqual(validated_csv_rows(fetch_csv_content_from_drive(self.gc, 'source'))[0]['FullName'], 'Test Person')
        files.get_media.assert_called_once_with(fileId='source')

    def test_drive_folder_finds_named_export_across_pages(self):
        files = self.gc.drive.service.files.return_value
        files.get.return_value.execute.return_value = {'mimeType': 'application/vnd.google-apps.folder'}
        files.list.return_value.execute.side_effect = [
            {'files': [{'id': 'other', 'name': 'Other.csv'}], 'nextPageToken': 'next'},
            {'files': [{'id': 'correct', 'name': 'JobSeekerList.csv'}]},
        ]
        files.get_media.return_value.execute.return_value = b'FullName\nTest Person\n'
        fetch_csv_content_from_drive(self.gc, 'folder')
        self.assertEqual(files.list.call_args.kwargs['pageToken'], 'next')
        files.get_media.assert_called_once_with(fileId='correct')

    def test_ambiguous_drive_folder_is_rejected(self):
        files = self.gc.drive.service.files.return_value
        files.get.return_value.execute.return_value = {'mimeType': 'application/vnd.google-apps.folder'}
        files.list.return_value.execute.return_value = {'files': [{'id': 'a', 'name': 'a.csv'}, {'id': 'b', 'name': 'b.csv'}]}
        with self.assertRaises(ValueError):
            fetch_csv_content_from_drive(self.gc, 'folder')
        files.get_media.assert_not_called()

    def test_invalid_or_empty_csv_never_clears_destination(self):
        for content in ['wrong,columns\na,b', 'FullName\n', 'FullName\n""\n']:
            with self.subTest(content=content), patch.object(backend, 'fetch_csv_content_from_drive', return_value=content):
                response = self.client.post('/api/sync-jobseekers-csv-to-drive')
                self.assertFalse(response.json['success'])
        self.sheet.clear.assert_not_called()
        self.sheet.update_values.assert_not_called()

    def test_drive_csv_translation_preserves_destination_columns(self):
        csv_text = 'FullName,Phone,ZipCode,JobTypesDesired\nTest Person,5551234567,01234,"[{""Value"":""Retail""}]"\n'
        with patch.object(backend, 'fetch_csv_content_from_drive', return_value=csv_text):
            response = self.client.post('/api/sync-jobseekers-csv-to-drive')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['count'], 1)
        values = self.sheet.update_values.call_args.kwargs['values']
        self.assertEqual(values[1][0], 'Test Person')
        self.assertEqual(values[1][5:7], ['01234', 'Retail'])


if __name__ == '__main__':
    unittest.main()
