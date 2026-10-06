export function phoneNumbers(...values) {
  const seen = new Set();
  return values.flatMap(value => String(value || '').split(/[,;\n/|&]|\s+or\s+|\s+and\s+/i)).map(value => {
    const label = value.trim();
    const number = label.replace(/(?:ext\.?|extension|x)\s*\d+\s*$/i, '').replace(/[^\d+]/g, '');
    return { label, number };
  }).filter(({ number }) => {
    const key = number.replace(/\D/g, '');
    if (key.length < 7 || key.length > 15 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function matchingJob(records, record) {
  const normalize = value => String(value || '').trim().toLowerCase();
  let matches = records.filter(job => normalize(job.company_name) === normalize(record.company)
    && normalize(job.available_jobs || 'Various') === normalize(record.role || 'Various')
    && normalize([job.company_street, job.company_city, job.company_state ?? 'FL'].join(', ').replace(/^[, ]+|[, ]+$/g, '')) === normalize(record.location));
  if (matches.length > 1 && record.date_verified) matches = matches.filter(job => normalize(job.date_last_verified) === normalize(record.date_verified));
  if (matches.length > 1 && typeof record.hiring === 'boolean') matches = matches.filter(job => ['true', 'yes', '1', 'y'].includes(normalize(job.currently_hiring)) === record.hiring);
  return matches.length === 1 ? matches[0] : null;
}
