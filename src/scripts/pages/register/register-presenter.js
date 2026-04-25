export default class RegisterPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async getRegistered({ name, email, password }) {
    this.#view.showSubmitLoading();
    try {
      const response = await this.#model.getRegistered({ name, email, password });

      if (!response.ok) {
        this.#view.registerFailed(response.message);
        return;
      }

      this.#view.registerSuccessfully(response.message);
    } catch (error) {
      this.#view.registerFailed(error.message);
    } finally {
      this.#view.hideSubmitLoading();
    }
  }
}
