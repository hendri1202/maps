const TOKEN_KEY = 'user_token';

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function putAccessToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getLogout() {
  localStorage.removeItem(TOKEN_KEY);
}
