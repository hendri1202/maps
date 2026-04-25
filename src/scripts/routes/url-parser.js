export function getActiveRoute() {
  const hash = window.location.hash.slice(1).toLowerCase() || '/';
  return hash;
}
