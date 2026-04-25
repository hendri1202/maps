import LoginPresenter from './login-presenter.js';
import * as StoryAPI from '../../data/story-api.js';
import { putAccessToken } from '../../utils/auth.js';
import showToast from '../../utils/toast.js';

export default class LoginPage {
  #presenter;

  async render() {
    return `
      <div class="add-container container" style="max-width:460px">
        <h1 class="page-title" tabindex="-1">Masuk</h1>
        <form id="login-form" class="add-form">
          <div class="form-group">
            <label for="email-input">Email</label>
            <input type="email" id="email-input" name="email" required autocomplete="email" placeholder="contoh@email.com">
          </div>
          <div class="form-group">
            <label for="password-input">Password</label>
            <input type="password" id="password-input" name="password" required autocomplete="current-password" minlength="8" placeholder="Minimal 8 karakter">
          </div>
          <button type="submit" id="submit-btn" class="btn btn-primary">Masuk</button>
          <p class="auth-link">Belum punya akun? <a href="#/register">Daftar di sini</a></p>
        </form>
      </div>
    `;
  }

  async afterRender() {
    this.#presenter = new LoginPresenter({
      view: this,
      model: StoryAPI,
    });

    const form = document.getElementById('login-form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email-input').value;
      const password = document.getElementById('password-input').value;

      await this.#presenter.getLogin({ email, password });
    });
  }

  loginSuccessfully(message, loginResult) {
    putAccessToken(loginResult.token);
    location.hash = '/';
  }

  loginFailed(message) {
    showToast('Login gagal: ' + message, 'error');
  }

  showSubmitLoading() {
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Memproses...';
  }

  hideSubmitLoading() {
    const btn = document.getElementById('submit-btn');
    btn.disabled = false;
    btn.textContent = 'Masuk';
  }
}
