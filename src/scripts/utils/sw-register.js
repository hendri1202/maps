let swRegistration = null;

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker tidak didukung di browser ini.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    swRegistration = registration;
    return registration;
  } catch (error) {
    console.error('Gagal mendaftarkan Service Worker:', error);
    return null;
  }
}

function getRegistration() {
  return swRegistration;
}

export { registerServiceWorker, getRegistration };
