(() => {
  'use strict'

  // --- Icon SVGs ---
  const ICONS = {
    light: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    dark: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    auto: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>'
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
    updateBrandIcon();
  }

  const updateBrandIcon = () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const brandIcon = document.getElementById('brandIcon');
    if (brandIcon) {
      const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      brandIcon.src = isDark ? 'assets/logo-white.png' : 'assets/logo-black.png';
    }
  };

  const showActiveTheme = (theme) => {
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const quickThemeBtn = document.getElementById('quick-theme-btn');
    const activeThemeItem = document.querySelector(`.theme-switcher .dropdown-item[data-theme-value="${theme}"]`) || document.querySelector(`.theme-menu .dropdown-item[data-theme-value="${theme}"]`);

    // Update active state in dropdown
    document.querySelectorAll('[data-theme-value]').forEach(element => {
      element.classList.remove('active')
    })
    activeThemeItem?.classList.add('active');

    // Update toggle button icon
    if (themeToggleButton) {
      themeToggleButton.innerHTML = ICONS[theme] || ICONS.auto;
    }
    if (quickThemeBtn) {
      quickThemeBtn.innerHTML = ICONS[theme] || ICONS.auto;
    }
  }

  // Initial load
  const initialTheme = getPreferredTheme();
  setTheme(initialTheme); // This will call updateBrandIcon
  updateBrandIcon(); // Initial call for logo

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const storedTheme = getStoredTheme()
    if (storedTheme === 'auto') {
      setTheme(getPreferredTheme()); // This will call updateBrandIcon
    }
  })

  window.addEventListener('DOMContentLoaded', () => {
    const themeSwitcher = document.querySelector('.theme-switcher'); // For login page
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const fabThemeMenu = document.getElementById('fab-theme-menu'); // For FAB menu

    const quickThemeBtn = document.getElementById('quick-theme-btn');

    showActiveTheme(getStoredTheme() || 'auto');

    // Handle dropdown clicks
    document.querySelectorAll('[data-theme-value]').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const theme = toggle.getAttribute('data-theme-value');
        setStoredTheme(theme);
        setTheme(theme);
        showActiveTheme(theme);

        // Close the relevant menu
        if (themeSwitcher) {
          themeSwitcher.classList.remove('show');
        }
        if (fabThemeMenu) {
          fabThemeMenu.classList.remove('show');
        }
      })
    })

    // Toggle menu visibility
    themeToggleButton?.addEventListener('click', () => {
      themeSwitcher?.classList.toggle('show');
    });

    // Handle Quick Theme Button (Dropdown)
    quickThemeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      fabThemeMenu?.classList.toggle('show');
    });

    // Close menu if clicking outside
    document.addEventListener('click', (event) => {
      // Close login page theme menu
      if (!themeSwitcher?.contains(event.target)) {
        themeSwitcher?.classList.remove('show');
      }
      // Close FAB theme menu
      if (fabThemeMenu && !fabThemeMenu.contains(event.target) && quickThemeBtn && !quickThemeBtn.contains(event.target)) {
        fabThemeMenu?.classList.remove('show');
      }
    });
  })
})()
