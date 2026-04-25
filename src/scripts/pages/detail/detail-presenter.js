export default class DetailPresenter {
  #view;
  #model;
  #idb;

  constructor({ view, model, idb }) {
    this.#view = view;
    this.#model = model;
    this.#idb = idb;
  }

  async loadDetail(storyId) {
    try {
      const response = await this.#model.getStoryDetail(storyId);

      if (!response.ok) {
        const cached = await this.#idb.getBookmarkById(storyId);
        if (cached) {
          this.#view.showDetail(cached);
          return;
        }
        this.#view.showError(response.message || "Cerita tidak ditemukan.");
        return;
      }

      this.#view.showDetail(response.story);
    } catch (error) {
      try {
        const cached = await this.#idb.getBookmarkById(storyId);
        if (cached) {
          this.#view.showDetail(cached);
          return;
        }
      } catch {}
      this.#view.showError(error.message);
    }
  }
}
