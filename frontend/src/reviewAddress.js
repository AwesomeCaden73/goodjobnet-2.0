export function fullAddress(job) {
  return [job.company_street, job.company_city, [job.company_state, job.company_zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

export function addressFields(value, job) {
  if (value.trim() === fullAddress(job)) return {};
  if (!value.trim()) return { company_street: '', company_city: '', company_state: '', company_zip: '' };
  const match = value.trim().match(/^(.+),\s*([^,]+),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (!match) throw new Error('Enter the full address as Street, City, ST ZIP (for example, 123 Main St, Orlando, FL 32801).');
  return { company_street: match[1].trim(), company_city: match[2].trim(), company_state: match[3].toUpperCase(), company_zip: match[4] };
}
