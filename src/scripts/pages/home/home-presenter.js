export default class HomePresenter {
  #view;
  #model;
  #idb;

  constructor({ view, model, idb }) {
    this.#view = view;
    this.#model = model;
    this.#idb = idb;
  }

  async initialGalleryAndMap() {
    try {
      this.#view.initialMap();

      const response = await this.#model.getAllStories();

      if (!response.ok) {
        const cached = await this.#idb.getAllCachedStories();
        if (cached.length > 0) {
          await this.#view.populateStoryList('Dari cache', cached);
          return;
        }
        this.#view.populateStoryListError(response.message);
        return;
      }

      const stories = response.listStory || [];

      if (stories.length > 0) {
        await this.#idb.putCachedStories(stories);
      }

      await this.#view.populateStoryList(response.message, stories);
    } catch (error) {
      try {
        const cached = await this.#idb.getAllCachedStories();
        if (cached.length > 0) {
          await this.#view.populateStoryList('Dari cache (offline)', cached);
          return;
        }
      } catch {
        // ignore
      }
      this.#view.populateStoryListError(error.message);
    }
  }
}
