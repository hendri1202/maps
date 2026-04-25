import { putOfflineDraft } from '../../data/idb-helper.js';

export default class AddPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async postNewStory(formData) {
    this.#view.showSubmitLoading();
    try {
      if (!navigator.onLine) {
        const draftData = {
          description: formData.get('description'),
          lat: formData.get('lat'),
          lon: formData.get('lon'),
          photoName: formData.get('photo')?.name || 'foto-offline.jpg',
        };

        const photoFile = formData.get('photo');
        if (photoFile && photoFile instanceof Blob) {
          const reader = new FileReader();
          const photoDataUrl = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(photoFile);
          });
          draftData.photoBlob = photoDataUrl;
        }

        await putOfflineDraft(draftData);
        this.#view.storePending();
        return;
      }

      const response = await this.#model.storeNewStory(formData);

      if (!response.ok) {
        this.#view.storeFailed(response.message);
        return;
      }

      this.#view.storeSuccessfully(response.message);
    } catch (error) {
      this.#view.storeFailed(error.message);
    } finally {
      this.#view.hideSubmitLoading();
    }
  }
}
