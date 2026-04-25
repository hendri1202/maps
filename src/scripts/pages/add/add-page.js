import AddPresenter from './add-presenter.js';
import * as StoryAPI from '../../data/story-api.js';
import CameraHelper from '../../utils/camera.js';
import MapHelper from '../../utils/map-helper.js';
import showToast from '../../utils/toast.js';

export default class AddPage {
  #presenter;
  #form;
  #map = null;
  #pickerMarker = null;
  #stream = null;
  #cameraActive = false;
  #photoBlob = null;

  async render() {
    return `
      <div class="add-container container">
        <h1 class="page-title" tabindex="-1">Bagikan Cerita Baru</h1>
        <form id="add-story-form" class="add-form">

          <div class="form-group media-section">
            <label for="btn-start-cam">Ambil Foto dari Kamera</label>
            <div class="camera-ui">
              <button type="button" id="btn-start-cam" class="btn btn-secondary">Nyalakan Kamera</button>
              <video id="camera-video" style="display:none;" autoplay playsinline></video>
              <canvas id="camera-canvas" style="display:none;"></canvas>
              <button type="button" id="btn-snap" class="btn btn-secondary" style="display:none;">Ambil Foto</button>
            </div>

            <p style="margin:1rem 0;">Atau pilih dari galeri:</p>
            <label for="image-upload">Unggah file foto</label>
            <input type="file" id="image-upload" accept="image/*">
            <img id="image-preview" src="" alt="" style="display:none;" />
          </div>

          <div class="form-group map-picker-section">
            <p class="form-group-title"><strong>Pilih Lokasi</strong> (klik pada peta atau isi manual)</p>
            <div id="add-map" class="map-container-small" tabindex="0" role="application" aria-label="Peta interaktif untuk memilih lokasi cerita"></div>
            <div class="coord-inputs">
              <div class="coord-field">
                <label for="lat-input">Latitude</label>
                <input type="number" id="lat-input" name="lat" step="any" placeholder="-6.200000">
              </div>
              <div class="coord-field">
                <label for="lon-input">Longitude</label>
                <input type="number" id="lon-input" name="lon" step="any" placeholder="106.816666">
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="description-input">Deskripsi Cerita</label>
            <textarea id="description-input" name="description" rows="4" required aria-required="true" placeholder="Tulis ceritamu di sini..."></textarea>
          </div>

          <button type="submit" id="submit-btn" class="btn btn-primary">Simpan dan Upload</button>
        </form>
      </div>
    `;
  }

  async afterRender() {
    this.#presenter = new AddPresenter({
      view: this,
      model: StoryAPI,
    });

    this.#form = document.getElementById('add-story-form');
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const btnStartCam = document.getElementById('btn-start-cam');
    const btnSnap = document.getElementById('btn-snap');
    const imgPreview = document.getElementById('image-preview');
    const fileUpload = document.getElementById('image-upload');
    const latInput = document.getElementById('lat-input');
    const lonInput = document.getElementById('lon-input');

    btnStartCam.addEventListener('click', async () => {
      if (!this.#cameraActive) {
        this.#stream = await CameraHelper.start(video);
        if (this.#stream) {
          this.#cameraActive = true;
          video.style.display = 'block';
          btnSnap.style.display = 'inline-block';
          btnStartCam.textContent = 'Matikan Kamera';
        }
      } else {
        CameraHelper.stop(this.#stream);
        this.#stream = null;
        this.#cameraActive = false;
        video.style.display = 'none';
        video.srcObject = null;
        btnSnap.style.display = 'none';
        btnStartCam.textContent = 'Nyalakan Kamera';
      }
    });

    btnSnap.addEventListener('click', async () => {
      if (this.#stream) {
        this.#photoBlob = await CameraHelper.capture(video, canvas);
        const imageUrl = URL.createObjectURL(this.#photoBlob);
        imgPreview.src = imageUrl;
        imgPreview.alt = 'Pratinjau foto dari kamera';
        imgPreview.style.display = 'block';
        fileUpload.value = '';
      }
    });

    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.#photoBlob = file;
        imgPreview.src = URL.createObjectURL(file);
        imgPreview.alt = 'Pratinjau foto yang diunggah';
        imgPreview.style.display = 'block';
      }
    });

    latInput.addEventListener('input', () => {
      const lat = parseFloat(latInput.value);
      const lng = parseFloat(lonInput.value);
      if (!isNaN(lat) && !isNaN(lng)) {
        this.#moveMarker(lat, lng);
      }
    });

    lonInput.addEventListener('input', () => {
      const lat = parseFloat(latInput.value);
      const lng = parseFloat(lonInput.value);
      if (!isNaN(lat) && !isNaN(lng)) {
        this.#moveMarker(lat, lng);
      }
    });

    setTimeout(() => {
      this.initialMap();

      this.#map.on('click', (e) => {
        this.#setPickerMarker(e.latlng.lat, e.latlng.lng);
      });
    }, 300);

    this.#form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const description = document.getElementById('description-input').value;

      if (!description.trim()) {
        showToast('Deskripsi cerita wajib diisi.', 'error');
        return;
      }

      if (!this.#photoBlob) {
        showToast('Pilih foto terlebih dahulu, bisa dari kamera atau unggah file.', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('description', description);
      formData.append('photo', this.#photoBlob, this.#photoBlob.name || 'foto-cerita.jpg');
      formData.append('lat', latInput.value);
      formData.append('lon', lonInput.value);

      await this.#presenter.postNewStory(formData);
    });
  }

  initialMap() {
    this.#map = MapHelper.initMap('add-map');
    this.#setPickerMarker(-6.2, 106.816666);
  }

  #moveMarker(lat, lng) {
    if (!this.#map) return;
    if (this.#pickerMarker) this.#map.removeLayer(this.#pickerMarker);
    this.#pickerMarker = MapHelper.addMarker(this.#map, lat, lng, 'Lokasi dipilih');
    this.#map.setView([lat, lng], 13);
  }

  #setPickerMarker(lat, lng) {
    if (this.#pickerMarker) {
      this.#map.removeLayer(this.#pickerMarker);
    }
    this.#pickerMarker = MapHelper.addMarker(this.#map, lat, lng, 'Lokasi dipilih');
    document.getElementById('lat-input').value = lat;
    document.getElementById('lon-input').value = lng;
  }

  storeSuccessfully(message) {
    showToast('Cerita berhasil dikirim!', 'success');
    this.#stopCamera();
    setTimeout(() => {
      window.location.hash = '/';
    }, 800);
  }

  storePending() {
    showToast('Anda offline — cerita disimpan sebagai draft dan akan dikirim saat online.', 'success');
    this.#stopCamera();
    setTimeout(() => {
      window.location.hash = '/';
    }, 1200);
  }

  storeFailed(message) {
    showToast('Gagal: ' + message, 'error');
  }

  showSubmitLoading() {
    const btn = document.getElementById('submit-btn');
    btn.textContent = 'Mengirim...';
    btn.disabled = true;
  }

  hideSubmitLoading() {
    const btn = document.getElementById('submit-btn');
    btn.textContent = 'Simpan dan Upload';
    btn.disabled = false;
  }

  #stopCamera() {
    if (this.#stream) {
      CameraHelper.stop(this.#stream);
      this.#stream = null;
      this.#cameraActive = false;
    }
  }

  onDestroy() {
    this.#stopCamera();
  }
}
