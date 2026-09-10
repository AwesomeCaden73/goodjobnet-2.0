export function distanceLabel(value) {
  return typeof value === 'number' ? `${value} ${value === 1 ? 'mile' : 'miles'}` : value;
}

