export function enteredZip(address) {
  return String(address || '').match(/\b\d{5}\b/g)?.at(-1) || '';
}

export function zipOnlySeekers(results, zip) {
  const matches = person => enteredZip(person.zipcode) === zip;
  return { ...results, nearby: (results.nearby || []).filter(matches), other: (results.other || []).filter(matches) };
}
