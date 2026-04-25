const toastEl = document.getElementById('toast');
let _timer = null;

function showToast(message, type = 'success') {
  if (!toastEl) return;
  clearTimeout(_timer);

  toastEl.textContent = message;
  toastEl.className = `toast toast-${type} toast-show`;

  _timer = setTimeout(() => {
    toastEl.classList.remove('toast-show');
  }, 3500);
}

export default showToast;
