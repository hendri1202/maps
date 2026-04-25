import { getActiveRoute, getActivePathId } from '../routes/url-parser.js';
import { routes } from '../routes/routes.js';
import { getAccessToken, getLogout } from '../utils/auth.js';
import { subscribe, unsubscribe, isSubscribed } from '../utils/push-helper.js';
import { getRegistration } from '../utils/sw-register.js';
import showToast from '../utils/toast.js';

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;
  #skipLinkButton;
  #currentPage = null;

  constructor({ content, drawerNavigation, drawerButton, skipLinkButton }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#drawerNavigation = drawerNavigation;
    this.#skipLinkButton = skipLinkButton;

    this.#init();
  }

  #init() {
    this.#setupSkipToContent();
    this.#setupDrawer();
  }

  #setupSkipToContent() {
    this.#skipLinkButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.#content.setAttribute('tabindex', '-1');
      this.#content.focus();
    });
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      const open = this.#drawerNavigation.classList.toggle('open');
      this.#drawerButton.setAttribute('aria-expanded', String(open));

      if (open) {
        const first = this.#drawerNavigation.querySelector('a, button');
        if (first) first.focus();
      }
    });

    document.body.addEventListener('click', (event) => {
      const isInsideDrawer = this.#drawerNavigation.contains(event.target);
      const isInsideButton = this.#drawerButton.contains(event.target);

      if (!(isInsideDrawer || isInsideButton)) {
        this.#drawerNavigation.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }

      this.#drawerNavigation.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#drawerNavigation.classList.remove('open');
          this.#drawerButton.setAttribute('aria-expanded', 'false');
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.#drawerNavigation.classList.contains('open')) {
        this.#drawerNavigation.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
        this.#drawerButton.focus();
      }

      if (this.#drawerNavigation.classList.contains('open') && e.key === 'Tab') {
        const items = [...this.#drawerNavigation.querySelectorAll('a, button')];
        if (!items.length) return;

        const first = items[0];
        const last = items[items.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  async #setupNavigationList() {
    const isLogin = !!getAccessToken();
    const navList = document.getElementById('nav-list');

    if (!isLogin) {
      navList.innerHTML = `
        <li><a href="#/">Beranda</a></li>
        <li><a href="#/login">Masuk</a></li>
      `;
      return;
    }

    navList.innerHTML = `
      <li><a href="#/">Beranda</a></li>
      <li><a href="#/add">Tambah Cerita</a></li>
      <li><a href="#/bookmark">Tersimpan</a></li>
      <li><button type="button" id="notif-toggle-btn" class="nav-notif-btn" aria-label="Toggle notifikasi" title="Toggle push notification">🔔</button></li>
      <li><button type="button" id="logout-btn" class="nav-logout-btn">Keluar</button></li>
    `;

    const logoutButton = document.getElementById('logout-btn');
    logoutButton.addEventListener('click', () => {
      getLogout();
      location.hash = '/login';
    });

    await this.#setupNotifToggle();
  }

  async #setupNotifToggle() {
    const notifBtn = document.getElementById('notif-toggle-btn');
    if (!notifBtn) return;

    const registration = getRegistration();
    if (!registration) {
      notifBtn.style.display = 'none';
      return;
    }

    const subscribed = await isSubscribed(registration);
    notifBtn.textContent = subscribed ? '🔔' : '🔕';
    notifBtn.setAttribute('aria-label', subscribed ? 'Nonaktifkan notifikasi' : 'Aktifkan notifikasi');

    notifBtn.addEventListener('click', async () => {
      notifBtn.disabled = true;
      try {
        const currentlySubscribed = await isSubscribed(registration);

        if (currentlySubscribed) {
          await unsubscribe(registration);
          notifBtn.textContent = '🔕';
          notifBtn.setAttribute('aria-label', 'Aktifkan notifikasi');
          showToast('Push notification dinonaktifkan.', 'success');
        } else {
          await subscribe(registration);
          notifBtn.textContent = '🔔';
          notifBtn.setAttribute('aria-label', 'Nonaktifkan notifikasi');
          showToast('Push notification diaktifkan!', 'success');
        }
      } catch (error) {
        showToast('Gagal: ' + error.message, 'error');
      } finally {
        notifBtn.disabled = false;
      }
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const route = routes[url];

    if (!route) {
      location.hash = '/';
      return;
    }

    const isLogin = !!getAccessToken();
    const needsAuth = url !== '/login' && url !== '/register';

    if (!isLogin && needsAuth) {
      location.hash = '/login';
      return;
    }
    if (isLogin && !needsAuth) {
      location.hash = '/';
      return;
    }

    if (this.#currentPage && typeof this.#currentPage.onDestroy === 'function') {
      this.#currentPage.onDestroy();
    }

    const pathId = getActivePathId();
    const page = route(pathId);
    this.#currentPage = page;

    const renderContent = async () => {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
      this.#focusHeading();
    };

    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        await renderContent();
      });
    } else {
      await renderContent();
    }

    await this.#setupNavigationList();
  }

  #focusHeading() {
    const heading = this.#content.querySelector('h1, h2');
    if (heading) heading.focus();
  }
}
