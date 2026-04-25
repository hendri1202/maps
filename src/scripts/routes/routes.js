import HomePage from '../pages/home/home-page.js';
import AddPage from '../pages/add/add-page.js';
import BookmarkPage from '../pages/bookmark/bookmark-page.js';
import LoginPage from '../pages/login/login-page.js';
import RegisterPage from '../pages/register/register-page.js';

export const routes = {
  '/': () => new HomePage(),
  '/add': () => new AddPage(),
  '/bookmark': () => new BookmarkPage(),
  '/login': () => new LoginPage(),
  '/register': () => new RegisterPage(),
};
