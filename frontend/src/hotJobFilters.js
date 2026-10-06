// Both modes use the existing search endpoint and its existing field names.
export function hotJobFilters(formData) {
  const company = String(formData.get('company_name') || '').trim();
  const address = String(formData.get('address') || '').trim();
  const jobTypes = formData.getAll('job_type');
  const other = String(formData.get('other_job_type') || '').trim();
  if (other) jobTypes.push(other);
  if (company && !jobTypes.length && !address) {
    return { search_type: 'company', company_name: company };
  }
  return {
    search_type: 'type-location',
    ...(company ? { company_name: company } : {}),
    job_types: jobTypes,
    address,
    radius: formData.get('radius') || '20',
  };
}
