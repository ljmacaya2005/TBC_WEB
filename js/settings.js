// Settings Logic - Professional Refresh
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // 1. Sidebar Navigation Logic (Tab Switching)
    const navItems = document.querySelectorAll('.settings-nav-item');
    const sections = document.querySelectorAll('.settings-card');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = `section-${item.dataset.section}`;
            const targetSection = document.getElementById(sectionId);

            if (targetSection) {
                // Update Sidebar Classes
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');

                // Switch Visible Section
                sections.forEach(s => s.classList.remove('active'));
                targetSection.classList.add('active');

                // Reset scroll position of content area
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // 2. Custom Switch Logic
    const premiumSwitches = document.querySelectorAll('.premium-switch');
    premiumSwitches.forEach(sw => {
        const checkbox = sw.querySelector('input[type="checkbox"]');

        sw.addEventListener('click', (e) => {
            // Toggle checkbox state if click wasn't directly on it (though it's hidden)
            checkbox.checked = !checkbox.checked;
            // Class toggle is handled in HTML inline for immediate feedback, 
            // but we ensure it matches here if needed.
            sw.classList.toggle('active', checkbox.checked);
        });
    });

    // 3. Save Settings Handler
    window.saveSettings = () => {
        Swal.fire({
            title: 'Applying Changes',
            text: 'Synchronizing system preferences...',
            icon: 'info',
            timer: 1500,
            showConfirmButton: false,
            timerProgressBar: true,
            didOpen: () => {
                Swal.showLoading();
            }
        }).then(() => {
            Swal.fire({
                title: 'Settings Saved',
                text: 'System configurations updated successfully.',
                icon: 'success',
                confirmButtonColor: '#A67B5B'
            });
            console.log('Settings state saved to local storage (mock)');
        });
    };

    // 4. Reset Settings Handler
    window.resetSettings = () => {
        Swal.fire({
            title: 'Reset to Default?',
            text: 'This will revert all preferences to system factory settings.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Reset',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                // Reset logic here
                const form = document.getElementById('settingsForm');
                form.reset();

                // Force sync custom switches
                premiumSwitches.forEach(sw => {
                    const cb = sw.querySelector('input[type="checkbox"]');
                    sw.classList.toggle('active', cb.checked);
                });

                Swal.fire({
                    title: 'System Reset',
                    text: 'All settings have been restored to default values.',
                    icon: 'success',
                    confirmButtonColor: '#A67B5B'
                });
            }
        });
    };

    console.log('Premium Settings UI initialized');
});
