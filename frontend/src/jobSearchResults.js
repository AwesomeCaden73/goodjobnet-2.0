const meaningful = value => {
  const text = String(value ?? '').trim();
  return text && !['unknown', 'various', 'n/a', 'not available'].includes(text.toLowerCase());
};

export function checkedJobResults(results) {
  if (!results || !Array.isArray(results.recent) || !Array.isArray(results.older)) {
    throw new Error('The job bank returned an incomplete response. Please try the search again.');
  }
  const valid = job => job && (meaningful(job.company) || meaningful(job.role)
    || meaningful(job.notes) || meaningful(job.career_website)
    || (meaningful(job.location) && !/^(?:[,\s]*[A-Z]{2}[,\s]*)?$/.test(String(job.location).trim())));
  const recent = results.recent.filter(valid);
  const older = results.older.filter(valid);
  if (results.recent.length + results.older.length > 0 && recent.length + older.length === 0) {
    throw new Error('The job bank returned records without job details. Please try again later; the data source may be temporarily unavailable.');
  }
  return { ...results, recent, older };
}
