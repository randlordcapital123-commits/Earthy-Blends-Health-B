// System Constants
const PASS_KEY = "admin123";
const STORAGE_AUTH_KEY = "system_admin_authenticated";
const STORAGE_HERO_KEY = "system_hero_image_url";
const STORAGE_GALLERY_KEY = "system_gallery_images";

// Initial Image State
const defaultImages = [
  { id: "1", name: "Landscape Example", url: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=800" },
  { id: "2", name: "Portrait Example", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800" },
  { id: "3", name: "Square Example", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800" }
];

// DOM Element References
const elements = {
  openAdminBtn: document.getElementById('open-admin-btn'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  authModal: document.getElementById('auth-modal'),
  authForm: document.getElementById('auth-form'),
  adminPass: document.getElementById('admin-pass'),
  authError: document.getElementById('auth-error'),
  adminSection: document.getElementById('admin-section'),
  logoutBtn: document.getElementById('logout-btn'),
  publicHeroImg: document.getElementById('public-hero-img'),
  fileInput: document.getElementById('file-input'),
  galleryContainer: document.getElementById('gallery-container')
};

/* --------------------------------------------------------------------------
   STATE INITIALIZATION & BOOTSTRAP
   -------------------------------------------------------------------------- */
function initSystem() {
  // 1. Hydrate Hero Image
  const savedHeroUrl = localStorage.getItem(STORAGE_HERO_KEY);
  if (savedHeroUrl) {
    elements.publicHeroImg.src = savedHeroUrl;
  }

  // 2. Hydrate Gallery State
  if (!localStorage.getItem(STORAGE_GALLERY_KEY)) {
    localStorage.setItem(STORAGE_GALLERY_KEY, JSON.stringify(defaultImages));
  }

  // 3. Evaluate Authentication Status
  checkAuthStatus();
  renderGallery();
}

/* --------------------------------------------------------------------------
   AUTHENTICATION PIPELINE
   -------------------------------------------------------------------------- */
function checkAuthStatus() {
  const isAuthenticated = localStorage.getItem(STORAGE_AUTH_KEY) === "true";
  if (isAuthenticated) {
    elements.adminSection.classList.remove('hidden');
    elements.openAdminBtn.textContent = "Admin Console Active";
    elements.openAdminBtn.onclick = () => {
      elements.adminSection.scrollIntoView({ behavior: 'smooth' });
    };
  } else {
    elements.adminSection.classList.add('hidden');
    elements.openAdminBtn.textContent = "Admin Login";
    elements.openAdminBtn.onclick = openAuthModal;
  }
}

function openAuthModal() {
  elements.authModal.classList.remove('hidden');
  elements.adminPass.value = '';
  elements.authError.textContent = '';
  elements.adminPass.focus();
}

function closeAuthModal() {
  elements.authModal.classList.add('hidden');
}

elements.authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (elements.adminPass.value === PASS_KEY) {
    localStorage.setItem(STORAGE_AUTH_KEY, "true");
    closeAuthModal();
    checkAuthStatus();
    elements.adminSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    elements.authError.textContent = "Invalid access password.";
  }
});

elements.closeModalBtn.addEventListener('click', closeAuthModal);

elements.logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_AUTH_KEY);
  checkAuthStatus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* --------------------------------------------------------------------------
   FILE UPLOAD ENGINE & IMAGE CONVERSION (Base64)
   -------------------------------------------------------------------------- */
elements.fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const base64Data = event.target.result;
    addImageToRepository(file.name, base64Data);
  };
  reader.readAsDataURL(file);
});

function addImageToRepository(name, url) {
  const currentGallery = JSON.parse(localStorage.getItem(STORAGE_GALLERY_KEY)) || [];
  const newImage = {
    id: Date.now().toString(),
    name: name,
    url: url
  };
  currentGallery.unshift(newImage);
  localStorage.setItem(STORAGE_GALLERY_KEY, JSON.stringify(currentGallery));
  renderGallery();
}

/* --------------------------------------------------------------------------
   GALLERY RENDERING & UNCROPPED DISPLAY ENGINE
   -------------------------------------------------------------------------- */
function renderGallery() {
  const galleryData = JSON.parse(localStorage.getItem(STORAGE_GALLERY_KEY)) || [];
  elements.galleryContainer.innerHTML = '';

  if (galleryData.length === 0) {
    elements.galleryContainer.innerHTML = '<p style="color: var(--text-muted)">No images in repository.</p>';
    return;
  }

  galleryData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'gallery-card';

    // Renders full image with object-fit: contain
    card.innerHTML = `
      <div class="image-container">
        <img src="${item.url}" alt="${item.name}">
      </div>
      <div class="card-body">
        <div class="card-title">${item.name}</div>
        <div class="card-actions">
          <button class="btn btn-primary btn-small" onclick="setHeroImage('${item.url}')">Set as Hero</button>
          <button class="btn btn-danger btn-small" onclick="deleteImage('${item.id}')">Delete</button>
        </div>
      </div>
    `;
    elements.galleryContainer.appendChild(card);
  });
}

window.setHeroImage = function(url) {
  elements.publicHeroImg.src = url;
  localStorage.setItem(STORAGE_HERO_KEY, url);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteImage = function(id) {
  let galleryData = JSON.parse(localStorage.getItem(STORAGE_GALLERY_KEY)) || [];
  galleryData = galleryData.filter(img => img.id !== id);
  localStorage.setItem(STORAGE_GALLERY_KEY, JSON.stringify(galleryData));
  renderGallery();
};

// Start System
initSystem();