// Simple client-side admin password check
const ADMIN_PASSWORD = "admin123"; // Change this to your preferred password

const loginForm = document.getElementById("login-form");
const passwordInput = document.getElementById("admin-password");
const loginError = document.getElementById("login-error");
const loginOverlay = document.getElementById("login-overlay");
const adminDashboard = document.getElementById("admin-dashboard");
const logoutBtn = document.getElementById("logout-btn");

// Check login status on page load
if (sessionStorage.getItem("adminLoggedIn") === "true") {
  showDashboard();
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  if (passwordInput.value === ADMIN_PASSWORD) {
    sessionStorage.setItem("adminLoggedIn", "true");
    showDashboard();
  } else {
    loginError.textContent = "Incorrect password. Please try again.";
  }
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("adminLoggedIn");
  location.reload();
});

function showDashboard() {
  loginOverlay.classList.add("hidden");
  adminDashboard.classList.remove("hidden");
}