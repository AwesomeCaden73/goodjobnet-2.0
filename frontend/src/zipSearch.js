export function enteredZip(address) {
  return String(address || '').match(/\b\d{5}\b/g)?.at(-1) || '';
}

export function zipOnlySeekers(results, zip) {
  const matches = person => enteredZip(person.zipcode) === zip;
  return { ...results, nearby: (results.nearby || []).filter(matches), other: (results.other || []).filter(matches) };
}

const normalize = value => String(value || '').trim().toLowerCase();
function sameJob(job, record) {
  const location = [record.company_street, record.company_city, record.company_state ?? 'FL'].join(', ').replace(/^[, ]+|[, ]+$/g, '');
  return normalize(job.company) === normalize(record.company_name)
    && normalize(job.role || 'Various') === normalize(record.available_jobs || 'Various')
    && normalize(job.location) === normalize(location);
}

// Search results omit ZIPs. Use existing read-only company details to verify them,
// including cases where neighboring ZIPs share the same geographic coordinates.
export async function zipOnlyJobs(results, zip, signal, request = fetch) {
  const jobs = [...(results.recent || []), ...(results.older || [])];
  const companies = [...new Set(jobs.map(job => job.company))];
  const records = new Map(await Promise.all(companies.map(async company => {
    const response = await request('/api/hot-jobs-review?category=company&company=' + encodeURIComponent(company), { signal });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error('Job ZIP codes could not be verified. Please try again.');
    return [company, data.jobs || []];
  })));
  const matches = job => {
    const candidates = (records.get(job.company) || []).filter(record => sameJob(job, record));
    return candidates.length > 0 && candidates.every(record => enteredZip(record.company_zip) === zip);
  };
  return { ...results, recent: (results.recent || []).filter(matches), older: (results.older || []).filter(matches) };
}
