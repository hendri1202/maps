export default class BookmarkPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async loadBookmarks() {
    try {
      const bookmarks = await this.#model.getAllBookmarks();
      if (bookmarks.length === 0) {
        this.#view.showEmptyState();
        return;
      }
      this.#view.showBookmarks(bookmarks);
    } catch (error) {
      this.#view.showError(error.message);
    }
  }

  async removeBookmark(id) {
    try {
      await this.#model.deleteBookmark(id);
      await this.loadBookmarks();
    } catch (error) {
      this.#view.showError(error.message);
    }
  }

  async searchBookmarks(query) {
    try {
      const bookmarks = await this.#model.getAllBookmarks();
      const q = query.toLowerCase().trim();

      if (!q) {
        if (bookmarks.length === 0) {
          this.#view.showEmptyState();
          return;
        }
        this.#view.showBookmarks(bookmarks);
        return;
      }

      const filtered = bookmarks.filter((item) => {
        const nameMatch = item.name?.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        return nameMatch || descMatch;
      });

      if (filtered.length === 0) {
        this.#view.showEmptySearch(query);
        return;
      }

      this.#view.showBookmarks(filtered);
    } catch (error) {
      this.#view.showError(error.message);
    }
  }
}
