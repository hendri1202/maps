import DetailPresenter from './detail-presenter.js';
import * as StoryAPI from '../../data/story-api.js';
import * as IdbHelper from '../../data/idb-helper.js';
import MapHelper from '../../utils/map-helper.js';
import showToast from '../../utils/toast.js';

function esc(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

export default class DetailPage {
  #presenter = null;
  #map = null;
  #storyId = null;

  constructor(id) {
    this.#storyId = id;
  }

  async render() {
    return `
      <section class="detail-container container">
        <h1 class="page-title" tabindex="-1">Detail Cerita</h1>
        <div id="detail-content" class="detail-content">
          <p>Sedang memuat...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new DetailPresenter({
      view: this,
      model: StoryAPI,
      idb: IdbHelper,
    });

    await this.#presenter.loadDetail(this.#storyId);
  }

  showDetail(story) {
    const content = document.getElementById('detail-content');

    const safeName = esc(story.name);
    const safeDesc = esc(story.description);
    const tanggal = new Date(story.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const hasCoords = story.lat != null && story.lon != null;
    const mapHtml = hasCoords
      ? `<div id="detail-map" class="map-container-small" role="application" aria-label="Lokasi cerita di peta"></div>`
      : '';

    content.innerHTML = `
      <article class="detail-card">
        <img src="${esc(story.photoUrl)}" alt="Foto oleh ${safeName}" class="detail-photo" />
        <div class="detail-info">
          <h2>${safeName}</h2>
          <time datetime="${esc(story.createdAt)}">${tanggal}</time>
          <p class="detail-desc">${safeDesc}</p>
        </div>
        ${mapHtml}
      </article>
      <a href="#/" class="btn btn-secondary detail-back-btn">← Kembali ke Beranda</a>
    `;

    if (hasCoords) {
      setTimeout(() => {
        this.#map = MapHelper.initMap('detail-map', {
          lat: story.lat,
          lng: story.lon,
          zoom: 13,
        });
        MapHelper.addMarker(this.#map, story.lat, story.lon, `<strong>${safeName}</strong>`, {
          title: `Lokasi cerita ${safeName}`,
          alt: `Penanda lokasi cerita ${safeName}`,
        });
      }, 200);
    }
  }

  showError(message) {
    document.getElementById('detail-content').innerHTML = `
      <p class="empty-state">Gagal memuat cerita. ${esc(message)}</p>
      <a href="#/" class="btn btn-secondary detail-back-btn">← Kembali ke Beranda</a>
    `;
  }
}
