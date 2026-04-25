export default class LoginPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async getLogin({ email, password }) {
    this.#view.showSubmitLoading();
    try {
      const response = await this.#model.getLogin({ email, password });

      if (!response.ok) {
        this.#view.loginFailed(response.message);
        return;
      }

      this.#view.loginSuccessfully(response.message, response.loginResult);
    } catch (error) {
      this.#view.loginFailed(error.message);
    } finally {
      this.#view.hideSubmitLoading();
    }
  }
}
