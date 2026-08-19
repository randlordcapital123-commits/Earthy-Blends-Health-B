const PHONE_NUMBER = "27824876140"; // Local formatted for WhatsApp API (South Africa +27)
const DEFAULT_PASSWORD = "admin"; // Default password

// Embedded Client Database Engine (IndexedDB wrapper with LocalStorage fallback)
class SalonDatabase {
  constructor() {
    this.dbName = "EarthyBlendsDB";
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("services")) {
          db.createObjectStore("services", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(true);
      };

      request.onerror = () => {
        console.warn("IndexedDB failed, falling back to LocalStorage.");
        resolve(false);
      };
    });
  }

  async getServices() {
    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db.transaction(["services"], "readonly");
        const store = transaction.objectStore("services");
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result.length ? req.result : null);
        req.onerror = () => resolve(null);
      });
    }
    return JSON.parse(localStorage.getItem("eb_services"));
  }

  async saveServices(services) {
    if (this.db) {
      const transaction = this.db.transaction(["services"], "readwrite");
      const store = transaction.objectStore("services");
      store.clear();
      services.forEach((s) => store.put(s));
    }
    localStorage.setItem("eb_services", JSON.stringify(services));
  }

  async getSetting(key) {
    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db.transaction(["settings"], "readonly");
        const store = transaction.objectStore("settings");
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.value : null);
        req.onerror = () => resolve(null);
      });
    }
    return localStorage.getItem("eb_" + key);
  }

  async setSetting(key, value) {
    if (this.db) {
      const transaction = this.db.transaction(["settings"], "readwrite");
      const store = transaction.objectStore("settings");
      store.put({ key, value });
    }
    localStorage.setItem("eb_" + key, value);
  }
}

const db = new SalonDatabase();

// Default initial database catalog
const defaultServices = [
  {
    id: 1,
    title: "Deep Tissue Massage",
    price: 450,
    desc: "Targeting deep muscle layers to alleviate stress and physical tension.",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    title: "Hydrating Facial",
    price: 380,
    desc: "Restores moisture balance and leaves your skin glowing with vitality.",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80"
  }
];

const defaultHeroImage = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80";

let services = [];
let currentTreatmentImgResized = "";
let currentHeroImgResized = "";
let isAuthenticated = false;

document.addEventListener("DOMContentLoaded", async () => {
  await db.init();
  
  // Initialize Database Data
  const storedServices = await db.getServices();
  if (!storedServices) {
    services = defaultServices;
    await db.saveServices(services);
  } else {
    services = storedServices;
  }

  renderServices();
  loadLogo();
  loadHeroImage();
  setupDragAndDrop();
  setupMobileNav();
});

// Canvas Image Resizer Utility
function resizeImage(file, maxWidth, maxHeight, quality = 0.85) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert resized image to compressed Base64 Data URL
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Authentication Flow
function triggerAdminAccess() {
  if (isAuthenticated) {
    openAdminModal();
  } else {
    openLoginModal();
  }
}

function openLoginModal() {
  document.getElementById("loginError").innerText = "";
  document.getElementById("adminPass").value = "";
  document.getElementById("loginModal").style.display = "block";
}

function closeLoginModal() {
  document.getElementById("loginModal").style.display = "none";
}

async function handleLogin(e) {
  e.preventDefault();
  const inputPass = document.getElementById("adminPass").value;
  const storedPass = (await db.getSetting("admin_pass")) || DEFAULT_PASSWORD;

  if (inputPass === storedPass) {
    isAuthenticated = true;
    closeLoginModal();
    openAdminModal();
  } else {
    document.getElementById("loginError").innerText = "Invalid password. Access denied.";
  }
}

async function updateAdminPassword() {
  const newPass = document.getElementById("newAdminPassword").value;
  if (newPass.trim().length < 4) {
    alert("Password must be at least 4 characters long.");
    return;
  }
  await db.setSetting("admin_pass", newPass);
  alert("Password updated successfully!");
  document.getElementById("newAdminPassword").value = "";
}

function logoutAdmin() {
  isAuthenticated = false;
  closeAdminModal();
  alert("Admin panel locked.");
}

// Mobile Navigation Toggle
function setupMobileNav() {
  const toggleBtn = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  toggleBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

function closeMenu() {
  const navLinks = document.getElementById("navLinks");
  if (navLinks.classList.contains("active")) {
    navLinks.classList.remove("active");
  }
}

// Render Services Catalog
function renderServices() {
  const grid = document.getElementById("servicesGrid");
  const adminList = document.getElementById("adminServicesList");

  grid.innerHTML = "";
  adminList.innerHTML = "";

  services.forEach((service) => {
    const waText = encodeURIComponent(`Hello Earthy Blends, I would like to book/buy the service: ${service.title} (R${service.price}).`);
    const waLink = `https://wa.me/${PHONE_NUMBER}?text=${waText}`;

    grid.innerHTML += `
      <div class="card">
        <img src="${service.image}" class="card-img" alt="${service.title}">
        <div class="card-body">
          <h3 class="card-title">${service.title}</h3>
          <div class="card-price">R ${service.price}</div>
          <p class="card-desc">${service.desc}</p>
          <a href="${waLink}" target="_blank" class="wa-btn">Book via WhatsApp</a>
        </div>
      </div>
    `;

    adminList.innerHTML += `
      <div class="admin-item">
        <div class="admin-info">
          <img src="${service.image}" alt="${service.title}">
          <span><strong>${service.title}</strong> - R${service.price}</span>
        </div>
        <button class="delete-btn" onclick="deleteService(${service.id})">Delete</button>
      </div>
    `;
  });
}

// Drag & Drop Setup
function setupDragAndDrop() {
  // Service Image Drop
  const dropArea = document.getElementById("dropArea");
  const fileInput = document.getElementById("serviceImageInput");
  setupDropZone(dropArea, fileInput, async (file) => {
    currentTreatmentImgResized = await resizeImage(file, 600, 400, 0.85);
    const imgPreview = document.getElementById("imagePreview");
    imgPreview.src = currentTreatmentImgResized;
    imgPreview.style.display = "block";
  });

  // Hero Cover Image Drop
  const heroDropArea = document.getElementById("heroDropArea");
  const heroFileInput = document.getElementById("heroImageInput");
  setupDropZone(heroDropArea, heroFileInput, async (file) => {
    currentHeroImgResized = await resizeImage(file, 1200, 800, 0.85);
    const heroPreview = document.getElementById("heroPreview");
    heroPreview.src = currentHeroImgResized;
    heroPreview.style.display = "block";
  });
}

function setupDropZone(dropArea, fileInput, callback) {
  dropArea.addEventListener("click", () => fileInput.click());

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  dropArea.addEventListener("drop", (e) => {
    if (e.dataTransfer.files.length > 0) {
      callback(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      callback(e.target.files[0]);
    }
  });
}

// Save Resized Hero Image
async function saveHeroImage() {
  if (currentHeroImgResized) {
    await db.setSetting("hero_image", currentHeroImgResized);
    loadHeroImage();
    alert("Hero background image updated!");
  } else {
    alert("Please select or drop an image first.");
  }
}

async function loadHeroImage() {
  const heroImg = (await db.getSetting("hero_image")) || defaultHeroImage;
  const heroHeader = document.getElementById("home");
  heroHeader.style.backgroundImage = `linear-gradient(rgba(44, 62, 53, 0.65), rgba(28, 36, 33, 0.75)), url('${heroImg}')`;
}

// Add New Treatment (With Auto-Resizing)
async function handleAddService(e) {
  e.preventDefault();
  const title = document.getElementById("serviceTitle").value;
  const price = document.getElementById("servicePrice").value;
  const desc = document.getElementById("serviceDesc").value;

  const newService = {
    id: Date.now(),
    title,
    price,
    desc,
    image: currentTreatmentImgResized || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
  };

  services.push(newService);
  await db.saveServices(services);
  renderServices();

  // Reset Form
  e.target.reset();
  document.getElementById("imagePreview").style.display = "none";
  currentTreatmentImgResized = "";
  alert("Treatment added successfully!");
}

// Delete Service from Database
async function deleteService(id) {
  services = services.filter((s) => s.id !== id);
  await db.saveServices(services);
  renderServices();
}

// Logo Management with Auto-Resizing
async function uploadLogo() {
  const logoInput = document.getElementById("logoInput");
  if (logoInput.files.length > 0) {
    const resizedLogo = await resizeImage(logoInput.files[0], 200, 200, 0.9);
    await db.setSetting("logo", resizedLogo);
    loadLogo();
    alert("Logo updated successfully!");
  }
}

async function loadLogo() {
  const savedLogo = await db.getSetting("logo");
  if (savedLogo) {
    document.getElementById("siteLogo").src = savedLogo;
  }
}

// Modal Controllers
function openAdminModal() {
  document.getElementById("adminModal").style.display = "block";
}

function closeAdminModal() {
  document.getElementById("adminModal").style.display = "none";
}