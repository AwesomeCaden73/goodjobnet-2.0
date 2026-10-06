import sys
import os

sys.path.insert(0, os.path.abspath('backend'))
from app import app

with app.test_client() as client:
    res = client.post('/api/sync-jobseekers-csv-to-drive')
    print("Status code:", res.status_code)
    print("Response JSON:", res.get_json())
