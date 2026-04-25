export function getActiveRoute() {
  const hash = window.location.hash.slice(1).toLowerCase() || '/';
  const splitUrl = hash.split('/');

  return `/${splitUrl[1] || ''}`;
}

export function getActivePathId() {
  const hash = window.location.hash.slice(1) || '/';
  const splitUrl = hash.split('/');

  return splitUrl[2] || null;
}
