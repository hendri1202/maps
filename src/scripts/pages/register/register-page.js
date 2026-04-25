import RegisterPresenter from './register-presenter.js';
import * as StoryAPI from '../../data/story-api.js';
import showToast from '../../utils/toast.js';

export default class RegisterPage {
  #presenter;

  async render() {
    return `
      <div class="add-container container" style="max-width:460px">
        <h1 class="page-title" tabindex="-1">Buat Akun Baru</h1>
        <form id="register-form" class="add-form">
          <div class="form-group">
            <label for="name-input">Nama</label>
            <input type="text" id="name-input" name="name" required autocomplete="name" placeholder="Nama lengkap kamu">
          </div>
          <div class="form-group">
            <label for="email-input">Email</label>
            <input type="email" id="email-input" name="email" required autocomplete="email" placeholder="contoh@email.com">
          </div>
          <div class="form-group">
            <label for="password-input">Password</label>
            <input type="password" id="password-input" name="password" required autocomplete="new-password" minlength="8" placeholder="Minimal 8 karakter">
          </div>
          <button type="submit" id="submit-btn" class="btn btn-primary">Daftar Akun</button>
          <p class="auth-link">Sudah punya akun? <a href="#/login">Masuk</a></p>
        </form>
      </div>
    `;
  }

  async afterRender() {
    this.#presenter = new RegisterPresenter({
      view: this,
      model: StoryAPI,
    });

    const form = document.getElementById('register-form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name-input').value;
      const email = document.getElementById('email-input').value;
      const password = document.getElementById('password-input').value;

      await this.#presenter.getRegistered({ name, email, password });
    });
  }

  registerSuccessfully(message) {
    showToast('Akun berhasil dibuat! Silakan login.', 'success');
    setTimeout(() => {
      location.hash = '/login';
    }, 1000);
  }

  registerFailed(message) {
    showToast('Gagal mendaftar: ' + (message || 'Email mungkin sudah terdaftar.'), 'error');
  }

  showSubmitLoading() {
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Mendaftar...';
  }

  hideSubmitLoading() {
    const btn = document.getElementById('submit-btn');
    btn.disabled = false;
    btn.textContent = 'Daftar Akun';
  }
}
