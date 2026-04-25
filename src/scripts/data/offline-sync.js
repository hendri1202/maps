import { getAllOfflineDrafts, deleteOfflineDraft } from './idb-helper.js';
import { storeNewStory } from './story-api.js';
import showToast from '../utils/toast.js';

let syncing = false;

async function syncOfflineDrafts() {
  if (syncing || !navigator.onLine) return;
  syncing = true;

  try {
    const drafts = await getAllOfflineDrafts();
    if (drafts.length === 0) return;

    let successCount = 0;

    for (const draft of drafts) {
      try {
        const formData = new FormData();
        formData.append('description', draft.description);
        formData.append('lat', draft.lat);
        formData.append('lon', draft.lon);

        if (draft.photoBlob) {
          const blob = await fetch(draft.photoBlob).then((r) => r.blob());
          formData.append('photo', blob, draft.photoName || 'foto-offline.jpg');
        }

        const response = await storeNewStory(formData);
        if (response.ok) {
          await deleteOfflineDraft(draft.draftId);
          successCount++;
        }
      } catch {
        break;
      }
    }

    if (successCount > 0) {
      showToast(`${successCount} cerita offline berhasil dikirim!`, 'success');
    }
  } finally {
    syncing = false;
  }
}

function initOnlineListener() {
  window.addEventListener('online', () => {
    updateOfflineBanner(false);
    syncOfflineDrafts();
  });

  window.addEventListener('offline', () => {
    updateOfflineBanner(true);
  });

  if (!navigator.onLine) {
    updateOfflineBanner(true);
  }
}

function updateOfflineBanner(isOffline) {
  let banner = document.getElementById('offline-banner');

  if (isOffline) {
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'offline-banner';
      banner.className = 'offline-banner';
      banner.setAttribute('role', 'alert');
      banner.textContent = 'Anda sedang offline — beberapa fitur mungkin terbatas';
      document.body.prepend(banner);
    }
    banner.classList.add('show');
  } else if (banner) {
    banner.classList.remove('show');
  }
}

export { syncOfflineDrafts, initOnlineListener };
