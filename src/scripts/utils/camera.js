import showToast from './toast.js';

const CameraHelper = {
  async start(videoEl) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoEl.srcObject = stream;
      await videoEl.play();
      return stream;
    } catch (err) {
      showToast('Tidak bisa mengakses kamera. Pastikan izin sudah diberikan.', 'error');
      return null;
    }
  },

  stop(stream) {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  },

  capture(videoEl, canvasEl) {
    const ctx = canvasEl.getContext('2d');
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0);

    return new Promise((resolve) => {
      canvasEl.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
    });
  },
};

export default CameraHelper;
