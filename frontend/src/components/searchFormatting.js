export function distanceLabel(value) {
  return typeof value === 'number' ? `${value} ${value === 1 ? 'mile' : 'miles'}` : value;
}

export function verificationDate(value) {
  const text = String(value || '').trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (!iso && !us) return 'Not available';
  const [year, month, day] = iso ? iso.slice(1).map(Number) : [Number(us[3]), Number(us[1]), Number(us[2])];
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return 'Not available';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

