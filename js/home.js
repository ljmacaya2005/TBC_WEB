(() => {
  'use strict'

  // Session check is handled by session-handler.js

  function toggleFullScreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  }
  // Expose to global scope for inline onclick attribute in HTML
  window.toggleFullScreen = toggleFullScreen;

  window.addEventListener('DOMContentLoaded', () => {
    // FAB Toggle Logic
    const fabTrigger = document.getElementById('quick-action-trigger');
    const fabItems = document.querySelector('.fab-items');

    fabTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      fabItems?.classList.toggle('show');
      fabTrigger.classList.toggle('active');
    });

    // Close theme menus when clicking outside
    document.addEventListener('click', (event) => {
      const quickThemeBtn = document.getElementById('quickThemeBtn');
      const themeMenu = document.getElementById('themeMenu');

      if (quickThemeBtn && themeMenu) {
        if (!quickThemeBtn.contains(event.target) && !themeMenu.contains(event.target)) {
          themeMenu.classList.remove('show');
        }
      }

      const indexMenu = document.querySelector('.theme-switcher .dropdown-menu');
      const indexWrapper = document.querySelector('.theme-switcher');
      if (indexWrapper && !indexWrapper.contains(event.target)) {
        indexMenu?.classList.remove('show');
      }

      if (fabTrigger && !fabTrigger.contains(event.target) && fabItems && !fabItems.contains(event.target)) {
        fabItems.classList.remove('show');
        fabTrigger.classList.remove('active');
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

    // Profile Dropdown Toggle
    const profileBtn = document.getElementById('profileBtn');
    const profileMenu = document.getElementById('profileMenu');

    profileBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu?.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      profileMenu?.classList.remove('show');
    });

    // Modal Handlers
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    const viewActionsBtn = document.getElementById('viewActionsBtn');
    const profileModal = document.getElementById('profileModalOverlay');
    const actionsModal = document.getElementById('actionsModalOverlay');

    viewProfileBtn?.addEventListener('click', () => {
      window.location.href = 'profile.html';
    });

    viewActionsBtn?.addEventListener('click', () => {
      actionsModal?.classList.add('show');
      profileMenu?.classList.remove('show');
    });

    window.closeAllModals = () => {
      profileModal?.classList.remove('show');
      actionsModal?.classList.remove('show');
    };

    // Close modals when clicking overlay
    [profileModal, actionsModal].forEach(modal => {
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeAllModals();
      });
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
      }).then(async (result) => {
        if (result.isConfirmed) {
          // 1. Clear Supabase Session (Critical to prevent auto-login loop)
          if (window.sb) {
            await window.sb.auth.signOut();
          }

          // 2. Clear login state from localStorage
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('username');
          localStorage.removeItem('role');
          localStorage.removeItem('theme');

          // 3. Show success message and redirect
          Swal.fire({
            title: 'Signed Out',
            text: 'Redirecting to login page...',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            confirmButtonColor: '#A67B5B',
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

    // Set logged in username across UI
    const username = localStorage.getItem('username');
    if (username) {
      document.querySelectorAll('.user-name').forEach(el => el.textContent = username);
      document.querySelectorAll('.user-name-display').forEach(el => el.textContent = username);
    }

    // Carousel Drag-to-Scroll Logic
    const slider = document.getElementById('priorityCarousel');
    const wrapper = document.querySelector('.priority-list-wrapper');
    let isDown = false;
    let startX;
    let scrollLeft;

    if (slider && wrapper) {
      wrapper.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.style.scrollBehavior = 'auto'; // Disable smooth scroll during drag
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });

      window.addEventListener('mouseup', () => {
        isDown = false;
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed multiplier
        slider.scrollLeft = scrollLeft - walk;
      });

      // Cleanup smooth scroll on drag end
      wrapper.addEventListener('mouseleave', () => {
        isDown = false;
      });
    }

    // --- Logic migrated from home.html to centralize code ---

    // Order Action Handlers (for Priority Sneak Peak on home page)
    // Exposed to window to be accessible by inline onclick attributes
    window.handleCompleteOrder = () => {
      Swal.fire({
        title: 'Complete Order?',
        text: 'Are you sure you want to mark this order as done?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#27ae60',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Yes, Mark as Done',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: 'Completed!',
            text: 'The order has been marked as done.',
            icon: 'success',
            confirmButtonColor: '#A67B5B'
          });
        }
      });
    };

    window.handleCancelOrder = () => {
      Swal.fire({
        title: 'Cancel Order?',
        text: 'Are you sure you want to cancel this order? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3741',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Yes, Cancel it',
        cancelButtonText: 'No, Keep it'
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: 'Cancelled!',
            text: 'The order has been removed.',
            icon: 'error',
            confirmButtonColor: '#A67B5B'
          });
        }
      });
    };

    // Real-time Clock Widget Logic
    const updateClock = () => {
      const currentTimeEl = document.getElementById('currentTime');
      const currentDateEl = document.getElementById('currentDate');

      if (currentTimeEl && currentDateEl) {
        const now = new Date();
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

        currentTimeEl.textContent = now.toLocaleTimeString('en-US', timeOptions);
        currentDateEl.textContent = now.toLocaleDateString('en-US', dateOptions);
      }
    };

    // Update clock every second if elements exist
    if (document.getElementById('currentTime') && document.getElementById('currentDate')) {
      setInterval(updateClock, 1000);
      updateClock(); // Initial call
    }

  })
})()
