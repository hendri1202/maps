import HomePresenter from './home-presenter.js';
import * as StoryAPI from '../../data/story-api.js';
import * as IdbHelper from '../../data/idb-helper.js';
import MapHelper from '../../utils/map-helper.js';
import showToast from '../../utils/toast.js';

function esc(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

export default class HomePage {
  #presenter = null;
  #map = null;
  #markers = {};

  async render() {
    return `
      <section class="home-container">
        <h1 class="page-title" tabindex="-1">Jelajahi Cerita</h1>
        <div class="home-layout">
          <div class="story-list-section" aria-label="Daftar cerita">
            <h2 class="sr-only">Daftar cerita pengguna</h2>
            <ul id="story-list" class="story-list">
              <li>Sedang memuat...</li>
            </ul>
          </div>
          <div class="map-section">
            <h2 class="sr-only">Peta lokasi cerita</h2>
            <div id="map" class="map-container" role="application" aria-label="Peta lokasi cerita"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({
      view: this,
      model: StoryAPI,
      idb: IdbHelper,
    });

    await this.#presenter.initialGalleryAndMap();
  }

  initialMap() {
    this.#map = MapHelper.initMap('map');
  }

  async populateStoryList(message, stories) {
    if (stories.length <= 0) {
      this.populateStoryListEmpty();
      return;
    }

    const listEl = document.getElementById('story-list');
    listEl.innerHTML = '';
    this.#markers = {};

    for (const item of stories) {
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

      const isBookmarked = await IdbHelper.getBookmarkById(item.id);
      const starClass = isBookmarked ? 'active' : '';

      li.innerHTML = `
        <img src="${esc(item.photoUrl)}" alt="Foto oleh ${safeName}" loading="lazy">
        <div class="story-info">
          <h3>${safeName}</h3>
          <p>${safeDesc}</p>
          <time datetime="${esc(item.createdAt)}">${tanggal}</time>
        </div>
        <button type="button" class="btn-bookmark ${starClass}" aria-label="${isBookmarked ? 'Hapus dari tersimpan' : 'Simpan cerita'}" title="${isBookmarked ? 'Hapus dari tersimpan' : 'Simpan cerita'}" data-id="${esc(item.id)}">★</button>
      `;

      const bookmarkBtn = li.querySelector('.btn-bookmark');
      bookmarkBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.#toggleBookmark(item, bookmarkBtn);
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
    }

    const bounds = stories
      .filter((s) => s.lat != null && s.lon != null)
      .map((s) => [s.lat, s.lon]);
    if (bounds.length) this.#map.fitBounds(bounds);
  }

  async #toggleBookmark(story, btn) {
    const existing = await IdbHelper.getBookmarkById(story.id);
    if (existing) {
      await IdbHelper.deleteBookmark(story.id);
      btn.classList.remove('active');
      btn.setAttribute('aria-label', 'Simpan cerita');
      btn.title = 'Simpan cerita';
      showToast('Cerita dihapus dari tersimpan.', 'success');
    } else {
      await IdbHelper.putBookmark(story);
      btn.classList.add('active');
      btn.setAttribute('aria-label', 'Hapus dari tersimpan');
      btn.title = 'Hapus dari tersimpan';
      showToast('Cerita disimpan!', 'success');
    }
  }

  populateStoryListEmpty() {
    document.getElementById('story-list').innerHTML =
      '<li>Belum ada cerita yang tersedia.</li>';
  }

  populateStoryListError(message) {
    document.getElementById('story-list').innerHTML =
      '<li>Gagal memuat data. Coba refresh halaman.</li>';
  }
}
