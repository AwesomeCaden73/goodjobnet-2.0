import pygsheets

gc = pygsheets.authorize(service_file='backend/credentials.json')
sh = gc.open_by_key('1khmTUewP3EJremrR388R4-rjLZ8ej0RcnGyCfLFYpuY')
wks = sh.sheet1

all_rows = wks.get_all_values(include_tailing_empty_rows=False, include_tailing_empty=True)
if all_rows:
    print("Row 1 (Headers):")
    headers = all_rows[0]
    for idx, h in enumerate(headers):
        if h.strip():
            print(f"  Col {idx}: '{h}'")
    print("\nNon-empty row count:", len(all_rows))
else:
    print("Worksheet is completely empty.")
