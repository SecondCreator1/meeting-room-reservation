// Global variables
let currentUser = null;
const API_BASE = {
  user: 'http://user-service:5000',
  room: 'http://room-service:5001',
  reservation: 'http://reservation-service:5002'
};

// DOM Elements
const loginLink = document.getElementById('login-link');
const logoutLink = document.getElementById('logout-link');
const roomsLink = document.getElementById('rooms-link');
const bookingsLink = document.getElementById('bookings-link');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  setupEventListeners();
});

function checkAuthStatus() {
  const token = localStorage.getItem('token');
  if (token) {
    fetchCurrentUser(token);
  } else {
    updateUIForUnauthenticated();
  }
}

async function fetchCurrentUser(token) {
  try {
    const response = await fetch(`${API_BASE.user}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      currentUser = await response.json();
      updateUIForAuthenticated();
    } else {
      localStorage.removeItem('token');
      updateUIForUnauthenticated();
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    localStorage.removeItem('token');
    updateUIForUnauthenticated();
  }
}

function updateUIForAuthenticated() {
  loginLink.style.display = 'none';
  logoutLink.style.display = 'block';
  roomsLink.style.display = 'block';
  bookingsLink.style.display = 'block';
}

function updateUIForUnauthenticated() {
  loginLink.style.display = 'block';
  logoutLink.style.display = 'none';
  roomsLink.style.display = 'none';
  bookingsLink.style.display = 'none';
  currentUser = null;
}

function setupEventListeners() {
  logoutLink.addEventListener('click', handleLogout);
  
  // Handle Google login callback if we're on the login page
  if (window.location.pathname.includes('auth/login.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleGoogleCallback(code);
    }
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  updateUIForUnauthenticated();
  window.location.href = '/';
}

async function handleGoogleCallback(code) {
  try {
    const response = await fetch(`${API_BASE.user}/auth/google/callback?code=${code}`);
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      window.location.href = '/';
    } else {
      showError('Failed to authenticate with Google');
    }
  } catch (error) {
    console.error('Error during Google callback:', error);
    showError('An error occurred during authentication');
  }
}

function showError(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'alert alert-error';
  errorElement.textContent = message;
  document.getElementById('main-content').prepend(errorElement);
  
  setTimeout(() => {
    errorElement.remove();
  }, 5000);
}

// Expose to global scope for other pages to use
window.app = {
  API_BASE,
  currentUser: () => currentUser,
  getToken: () => localStorage.getItem('token'),
  showError,
  checkAuthStatus
};