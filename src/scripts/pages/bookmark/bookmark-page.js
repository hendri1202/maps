import BookmarkPresenter from './bookmark-presenter.js';
import * as IdbHelper from '../../data/idb-helper.js';
import MapHelper from '../../utils/map-helper.js';
import showToast from '../../utils/toast.js';

function esc(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

export default class BookmarkPage {
  #presenter = null;
  #map = null;
  #markers = {};

  async render() {
    return `
      <section class="home-container">
        <h1 class="page-title" tabindex="-1">Cerita Tersimpan</h1>

        <div class="bookmark-toolbar">
          <div class="search-group">
            <label for="search-input" class="sr-only">Cari cerita tersimpan</label>
            <input type="search" id="search-input" class="search-input" placeholder="Cari berdasarkan nama atau deskripsi..." aria-label="Cari cerita tersimpan">
          </div>
          <div class="sort-group">
            <label for="sort-select" class="sr-only">Urutkan</label>
            <select id="sort-select" class="sort-select" aria-label="Urutkan cerita tersimpan">
              <option value="newest">Terbaru disimpan</option>
              <option value="oldest">Terlama disimpan</option>
              <option value="name-asc">Nama A-Z</option>
              <option value="name-desc">Nama Z-A</option>
            </select>
          </div>
        </div>

        <div class="home-layout">
          <div class="story-list-section" aria-label="Daftar cerita tersimpan">
            <h2 class="sr-only">Daftar cerita yang disimpan</h2>
            <ul id="bookmark-list" class="story-list">
              <li>Sedang memuat...</li>
            </ul>
          </div>
          <div class="map-section">
            <h2 class="sr-only">Peta lokasi cerita tersimpan</h2>
            <div id="bookmark-map" class="map-container" role="application" aria-label="Peta lokasi cerita tersimpan"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new BookmarkPresenter({
      view: this,
      model: IdbHelper,
    });

    this.#map = MapHelper.initMap('bookmark-map');

    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');

    let debounceTimer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.#presenter.searchBookmarks(searchInput.value);
      }, 300);
    });

    sortSelect.addEventListener('change', () => {
      this.#presenter.searchBookmarks(searchInput.value);
    });

    await this.#presenter.loadBookmarks();
  }

  #getSortedItems(items) {
    const sortSelect = document.getElementById('sort-select');
    const sortValue = sortSelect ? sortSelect.value : 'newest';

    const sorted = [...items];
    switch (sortValue) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt));
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.bookmarkedAt) - new Date(b.bookmarkedAt));
        break;
      case 'name-asc':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
    }
    return sorted;
  }

  showBookmarks(bookmarks) {
    const listEl = document.getElementById('bookmark-list');
    listEl.innerHTML = '';
    this.#clearMarkers();

    const sorted = this.#getSortedItems(bookmarks);

    sorted.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'story-card';
      li.tabIndex = 0;

      const tanggal = new Date(item.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const safeName = esc(item.name);
      const safeDesc = esc(item.description);

      li.innerHTML = `
        <img src="${esc(item.photoUrl)}" alt="Foto oleh ${safeName}" loading="lazy">
        <div class="story-info">
          <h3>${safeName}</h3>
          <p>${safeDesc}</p>
          <time datetime="${esc(item.createdAt)}">${tanggal}</time>
        </div>
        <button type="button" class="btn-remove-bookmark" aria-label="Hapus bookmark ${safeName}" title="Hapus dari tersimpan">✕</button>
      `;

      const removeBtn = li.querySelector('.btn-remove-bookmark');
      removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.#presenter.removeBookmark(item.id);
        showToast('Cerita dihapus dari tersimpan.', 'success');
      });

      const hasCoords = item.lat != null && item.lon != null;
      const goToMarker = () => {
        if (hasCoords && this.#markers[item.id]) {
          this.#map.setView([item.lat, item.lon], 14);
          this.#markers[item.id].openPopup();
        }
      };

      li.addEventListener('click', goToMarker);
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToMarker();
        }
      });

      listEl.appendChild(li);

      if (hasCoords) {
        const popup = `<strong>${safeName}</strong><br>${safeDesc.slice(0, 40)}...`;
        this.#markers[item.id] = MapHelper.addMarker(this.#map, item.lat, item.lon, popup, {
          title: `Lokasi cerita ${safeName}`,
          alt: `Penanda peta untuk cerita ${safeName}`,
        });
      }
    });

    const bounds = sorted
      .filter((s) => s.lat != null && s.lon != null)
      .map((s) => [s.lat, s.lon]);
    if (bounds.length) this.#map.fitBounds(bounds);
  }

  showEmptyState() {
    document.getElementById('bookmark-list').innerHTML =
      '<li class="empty-state">Belum ada cerita tersimpan. Kembali ke <a href="#/">Beranda</a> untuk menyimpan cerita.</li>';
    this.#clearMarkers();
  }

  showEmptySearch(query) {
    const safeQuery = esc(query);
    document.getElementById('bookmark-list').innerHTML =
      `<li class="empty-state">Tidak ditemukan cerita untuk "${safeQuery}".</li>`;
    this.#clearMarkers();
  }

  showError(message) {
    document.getElementById('bookmark-list').innerHTML =
      '<li class="empty-state">Gagal memuat data. Silakan coba lagi.</li>';
  }

  #clearMarkers() {
    Object.values(this.#markers).forEach((marker) => {
      this.#map.removeLayer(marker);
    });
    this.#markers = {};
  }
}
