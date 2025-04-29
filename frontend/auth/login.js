document.addEventListener('DOMContentLoaded', () => {
    const googleLoginBtn = document.getElementById('google-login-btn');
    const loginMessage = document.getElementById('login-message');
    
    // Check if we have a token already
    if (localStorage.getItem('token')) {
      window.location.href = '../index.html';
      return;
    }
    
    googleLoginBtn.addEventListener('click', () => {
      window.location.href = `${window.app.API_BASE.user}/auth/google/login`;
    });
    
    // Handle Google callback if code is in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      loginMessage.textContent = 'Authenticating...';
      loginMessage.className = 'alert';
      
      fetch(`${window.app.API_BASE.user}/auth/google/callback?code=${code}`)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Authentication failed');
        })
        .then(data => {
          localStorage.setItem('token', data.access_token);
          window.location.href = '../index.html';
        })
        .catch(error => {
          console.error('Login error:', error);
          loginMessage.textContent = 'Login failed. Please try again.';
          loginMessage.className = 'alert alert-error';
        });
    }
  });