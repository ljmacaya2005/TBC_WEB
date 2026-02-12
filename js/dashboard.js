(() => {
  'use strict'

  // --- Icon SVGs ---
  const ICONS = {
    light: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/></svg>',
    dark: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/></svg>',
    auto: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 0 8 1v14zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16z"/></svg>'
  };

  const getStoredTheme = () => localStorage.getItem('theme')
  const setStoredTheme = theme => localStorage.setItem('theme', theme)

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme()
    if (storedTheme) return storedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const setTheme = theme => {
    const themeToSet = theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    document.documentElement.setAttribute('data-theme', themeToSet);
    updateBrandIcon(themeToSet);
  }

  const updateBrandIcon = (theme) => {
    const brandIcon = document.getElementById('brandIcon');
    if (brandIcon) {
      if (theme === 'dark') {
        brandIcon.src = 'assets/logo-white.png';
      } else {
        brandIcon.src = 'assets/logo-black.png';
      }
    }
  }

  const showActiveTheme = (theme) => {
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const activeThemeItem = document.querySelector(`.dropdown-item[data-theme-value="${theme}"]`);

    // Update active state in dropdown
    document.querySelectorAll('[data-theme-value]').forEach(element => {
      element.classList.remove('active')
    })
    activeThemeItem?.classList.add('active');

    // Update toggle button icon
    if (themeToggleButton) {
      themeToggleButton.innerHTML = ICONS[theme] || ICONS.auto;
    }
  }

  // Initial load
  const initialTheme = getPreferredTheme();
  setTheme(initialTheme);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const storedTheme = getStoredTheme()
    if (storedTheme === 'auto') {
      setTheme(getPreferredTheme())
    }
  })

  window.addEventListener('DOMContentLoaded', () => {
    const themeSwitcher = document.querySelector('.theme-switcher');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const themeMenu = document.getElementById('theme-menu');

    showActiveTheme(getStoredTheme() || 'auto');

    // Handle dropdown clicks
    document.querySelectorAll('[data-theme-value]').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const theme = toggle.getAttribute('data-theme-value');
        setStoredTheme(theme);
        setTheme(theme);
        showActiveTheme(theme);
        themeSwitcher.classList.remove('show'); // Close menu
      })
    })

    // Toggle menu visibility
    themeToggleButton?.addEventListener('click', () => {
      themeSwitcher.classList.toggle('show');
    });

    // Close menu if clicking outside
    document.addEventListener('click', (event) => {
      if (!themeSwitcher?.contains(event.target)) {
        themeSwitcher?.classList.remove('show');
      }
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');

    mobileMenuToggle?.addEventListener('click', () => {
      sidebar?.classList.toggle('active');
    });

    // Close sidebar when clicking on nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove active class from all nav links
        navLinks.forEach(navLink => {
          navLink.classList.remove('active');
        });
        // Add active class to the clicked nav link
        link.classList.add('active');
        // Close sidebar on mobile
        sidebar?.classList.remove('active');
      });
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (event) => {
      const isClickInsideSidebar = sidebar?.contains(event.target);
      const isClickOnToggle = mobileMenuToggle?.contains(event.target);

      if (!isClickInsideSidebar && !isClickOnToggle) {
        sidebar?.classList.remove('active');
      }
    });

    // Common Sign Out Handler
    const handleSignOut = (e) => {
      e.preventDefault();
      Swal.fire({
        title: 'Sign Out',
        text: 'Are you sure you want to sign out?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc3741',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Yes, Sign Out',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          // Clear login state and theme from localStorage
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('username');
          localStorage.removeItem('theme');

          // Show success message and redirect
          Swal.fire({
            title: 'Signed Out',
            text: 'Redirecting to login page...',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            confirmButtonColor: '#7066e0',
            allowOutsideClick: false,
            didClose: () => {
              // Redirect to login page
              window.location.href = 'index.html';
            }
          });
        }
      });
    };

    // Attach to sidebar sign out
    const signOutButton = document.getElementById('signoutBtn');
    signOutButton?.addEventListener('click', handleSignOut);

    // Attach to FAB sign out
    const fabSignOut = document.getElementById('fabSignOut');
    fabSignOut?.addEventListener('click', handleSignOut);

    // Reload Handler
    const fabRefresh = document.getElementById('fabRefresh');
    fabRefresh?.addEventListener('click', (e) => {
      e.preventDefault();
      Swal.fire({
        title: 'Reload Page?',
        text: "Any unsaved changes will be lost.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4E342E',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Yes, Reload'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    });
  })
})()
