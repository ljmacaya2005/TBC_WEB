document.addEventListener('DOMContentLoaded', () => {
	const splash = document.getElementById('splash');
	const loader = document.getElementById('loader');
	const loginCard = document.getElementById('loginCard');
	const beans = document.querySelectorAll('.bean');

	// Clear inputs on load
	const uInput = document.getElementById('username');
	const pInput = document.getElementById('password');
	if (uInput) uInput.value = '';
	if (pInput) pInput.value = '';
	window.actualPassword = '';

	// --- STRICT SESSION LOCK: Clear session when visiting login page ---
	// This ensures that if a user clicks "Back" from dashboard to here, 
	// the session is destroyed. If they try to go "Forward", access is denied.
	sessionStorage.removeItem('isLoggedIn');
	sessionStorage.removeItem('username');

	// --- Random Video Rotation for Coffee Cup ---
	const coffeeCup = document.getElementById('coffeeCup');
	const totalVideos = 6; // Number of videos in the slideshow folder

	// Function to get a random video index excluding the current one
	const getRandomVideoIndex = (excludeIndex) => {
		const availableVideos = Array.from({ length: totalVideos }, (_, i) => i + 1)
			.filter(index => index !== excludeIndex);
		const randomIndex = Math.floor(Math.random() * availableVideos.length);
		return availableVideos[randomIndex];
	};

	// Select random first video during splash screen
	let currentVideoIndex = Math.floor(Math.random() * totalVideos) + 1; // Random from 1-6

	if (coffeeCup) {
		// Set initial random video source (but don't play yet)
		const source = coffeeCup.querySelector('source');
		source.src = `videos/slideshow/${currentVideoIndex}.mp4`;
		coffeeCup.load();

		const playRandomVideo = () => {
			// Get random video excluding the one that just ended
			currentVideoIndex = getRandomVideoIndex(currentVideoIndex);

			// Change video source
			const source = coffeeCup.querySelector('source');
			source.src = `videos/slideshow/${currentVideoIndex}.mp4`;

			// Reload and play the new video
			coffeeCup.load();
			coffeeCup.play();
		};

		// Listen for when the video ends and play a random one
		coffeeCup.addEventListener('ended', playRandomVideo);
	}

	// --- Splash Screen Logic ---

	// 1. Show the loader after a short delay to let the logo animate in first.
	setTimeout(() => {
		if (loader) {
			loader.classList.add('visible');
		}

		// --- CHECK FOR SESSION EXPIRATION ---
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('session_expired') === 'true') {
			// Clear session storage just in case
			sessionStorage.removeItem('isLoggedIn');

			// Show Swal after a slight delay to ensure it appears on top or after basic init
			setTimeout(() => {
				Swal.fire({
					title: 'Session Expired',
					text: 'Your session has timed out. Please log in again to continue.',
					icon: 'warning',
					confirmButtonText: 'Log In',
					confirmButtonColor: '#7066e0',
					allowOutsideClick: false,
					backdrop: `
						rgba(0,0,123,0.4)
						url("images/nyan-cat.gif")
						left top
						no-repeat
					` // Just kidding, standard backdrop
				}).then((result) => {
					// Clean URL
					window.history.replaceState({}, document.title, window.location.pathname);
				});
			}, 1000); // Wait for splash to start doing its thing
		}
	}, 800);

	// 2. Set a total time for the splash screen to be visible.
	const splashDuration = 2500; // 2.5 seconds

	setTimeout(() => {
		if (splash) {
			splash.classList.add('hidden');
		}

		// 3. Animate in the main content after the splash screen starts to fade out.
		// This delay should be slightly less than the splash screen's CSS transition duration.
		setTimeout(() => {
			// Animate login card
			if (loginCard) {
				loginCard.classList.add('show');
			}

			// Animate background beans
			beans.forEach(bean => {
				const delay = (parseFloat(bean.style.getPropertyValue('--delay')) || 0) * 1000;
				setTimeout(() => {
					bean.classList.add('arrived');
				}, delay);
			});

			// Start playing the video after splash screen completes
			if (coffeeCup) {
				coffeeCup.play();
			}

		}, 300); // Start content animation 300ms after splash fade begins

	}, splashDuration);

	// --- Password Masking and Toggle Logic ---
	const passwordInput = document.getElementById('password');
	const passwordToggle = document.getElementById('passwordToggle');
	const MAX_PASSWORD_LENGTH = 20;

	// Store the actual password value separately - GLOBAL for login handler
	window.actualPassword = '';
	let isPasswordVisible = false;

	if (passwordInput && passwordToggle) {
		// Handle keyboard input to properly capture typed characters
		passwordInput.addEventListener('keydown', (e) => {
			const cursorPos = passwordInput.selectionStart;
			const selectionStart = passwordInput.selectionStart;
			const selectionEnd = passwordInput.selectionEnd;
			const hasSelection = selectionStart !== selectionEnd;

			if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
				// Check if adding another character would exceed max length
				if (window.actualPassword.length >= MAX_PASSWORD_LENGTH && !hasSelection) {
					e.preventDefault();
					return;
				}
				// Regular character being typed
				e.preventDefault();
				if (hasSelection) {
					window.actualPassword = window.actualPassword.substring(0, selectionStart) + e.key + window.actualPassword.substring(selectionEnd);
				} else {
					window.actualPassword = window.actualPassword.substring(0, cursorPos) + e.key + window.actualPassword.substring(cursorPos);
				}
				// Enforce max length
				if (window.actualPassword.length > MAX_PASSWORD_LENGTH) {
					window.actualPassword = window.actualPassword.substring(0, MAX_PASSWORD_LENGTH);
				}
				updatePasswordDisplay(Math.min(selectionStart + 1, MAX_PASSWORD_LENGTH));
			} else if (e.key === 'Backspace') {
				e.preventDefault();
				if (hasSelection) {
					window.actualPassword = window.actualPassword.substring(0, selectionStart) + window.actualPassword.substring(selectionEnd);
					updatePasswordDisplay(selectionStart);
				} else if (cursorPos > 0) {
					window.actualPassword = window.actualPassword.substring(0, cursorPos - 1) + window.actualPassword.substring(cursorPos);
					updatePasswordDisplay(cursorPos - 1);
				}
			} else if (e.key === 'Delete') {
				e.preventDefault();
				if (hasSelection) {
					window.actualPassword = window.actualPassword.substring(0, selectionStart) + window.actualPassword.substring(selectionEnd);
					updatePasswordDisplay(selectionStart);
				} else {
					window.actualPassword = window.actualPassword.substring(0, cursorPos) + window.actualPassword.substring(cursorPos + 1);
					updatePasswordDisplay(cursorPos);
				}
			} else if (e.key === 'ArrowLeft') {
				// Let default behavior handle arrow keys
				return;
			} else if (e.key === 'ArrowRight') {
				// Let default behavior handle arrow keys
				return;
			}
		});

		// Handle paste event to add pasted text
		passwordInput.addEventListener('paste', (e) => {
			e.preventDefault();
			const pastedText = (e.clipboardData || window.clipboardData).getData('text');
			const cursorPos = passwordInput.selectionStart;
			const selectionStart = passwordInput.selectionStart;
			const selectionEnd = passwordInput.selectionEnd;

			if (selectionStart !== selectionEnd) {
				window.actualPassword = window.actualPassword.substring(0, selectionStart) + pastedText + window.actualPassword.substring(selectionEnd);
			} else {
				window.actualPassword = window.actualPassword.substring(0, cursorPos) + pastedText + window.actualPassword.substring(cursorPos);
			}

			// Enforce max length
			if (window.actualPassword.length > MAX_PASSWORD_LENGTH) {
				window.actualPassword = window.actualPassword.substring(0, MAX_PASSWORD_LENGTH);
			}

			const newPos = Math.min(selectionStart + pastedText.length, MAX_PASSWORD_LENGTH);
			updatePasswordDisplay(newPos);
		});

		// Function to update the password display and cursor position
		function updatePasswordDisplay(newCursorPos) {
			if (isPasswordVisible) {
				passwordInput.value = window.actualPassword;
			} else {
				passwordInput.value = '•'.repeat(window.actualPassword.length);
			}

			// Restore cursor position
			setTimeout(() => {
				passwordInput.setSelectionRange(newCursorPos, newCursorPos);
			}, 0);
		}

		// Toggle password visibility
		passwordToggle.addEventListener('click', (e) => {
			e.preventDefault();
			isPasswordVisible = !isPasswordVisible;

			const cursorPos = passwordInput.selectionStart;
			const eyeHidden = passwordToggle.querySelector('.eye-hidden');
			const eyeVisible = passwordToggle.querySelector('.eye-visible');

			if (isPasswordVisible) {
				// Show password
				passwordInput.value = window.actualPassword;
				passwordToggle.setAttribute('aria-label', 'Hide password');
				passwordToggle.classList.add('visible');
				// Toggle icons
				eyeHidden.style.display = 'none';
				eyeVisible.style.display = 'block';
			} else {
				// Hide password
				passwordInput.value = '•'.repeat(window.actualPassword.length);
				passwordToggle.setAttribute('aria-label', 'Show password');
				passwordToggle.classList.remove('visible');
				// Toggle icons
				eyeHidden.style.display = 'block';
				eyeVisible.style.display = 'none';
			}

			// Restore cursor position
			setTimeout(() => {
				passwordInput.setSelectionRange(cursorPos, cursorPos);
			}, 0);
		});

		// Prevent default form submission on toggle button click
		passwordToggle.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				passwordToggle.click();
			}
		});

		// Handle form submission - use the actual password
		const loginForm = document.getElementById('loginForm');
		if (loginForm) {
			loginForm.addEventListener('submit', (e) => {
				// Make sure the actual password is sent
			});
		}
	}

	// --- LOCKOUT UI CHECKER ---
	// Checks periodically if the lockout is active and disables inputs if so.
	function checkLockout() {
		const usernameField = document.getElementById('username');
		const passwordField = document.getElementById('password');
		const submitBtn = document.querySelector('button[type="submit"]');

		const lockoutEnd = parseInt(localStorage.getItem('login_lockout_end') || '0', 10);
		const now = Date.now();

		if (lockoutEnd > now) {
			// Lockout Active
			if (usernameField) usernameField.disabled = true;
			if (passwordField) passwordField.disabled = true;
			if (submitBtn) {
				submitBtn.disabled = true;
				// Optional: show countdown in button or just 'Locked'
				const remainingMs = lockoutEnd - now;
				const remainingSec = Math.ceil(remainingMs / 1000);
				const minutes = Math.floor(remainingSec / 60);
				const seconds = remainingSec % 60;
				submitBtn.innerText = `Locked (${minutes}m ${seconds}s)`;
			}

			// Schedule next check/update
			requestAnimationFrame(checkLockout);
		} else {
			// specific check to see if we just came out of lockout to restore UI once
			if (usernameField && usernameField.disabled) {
				usernameField.disabled = false;
				usernameField.placeholder = "username";
			}
			if (passwordField && passwordField.disabled) {
				passwordField.disabled = false;
				passwordField.placeholder = "••••••••";
			}
			if (submitBtn && submitBtn.disabled) {
				submitBtn.disabled = false;
				submitBtn.innerText = 'Sign in';
			}
		}
	}

	// Start the checker loops
	checkLockout();

	// Listen for external trigger
	window.addEventListener('lockoutStart', checkLockout);

});

// Function to show Terms of Service modal using SweetAlert2
function showTermsModal(event) {
	event.preventDefault();
	Swal.fire({
		title: 'Terms of Service',
		html: `<div style="text-align: left; max-height: 400px; overflow-y: auto;">
			<p><strong>1. System Usage:</strong> The Brew Cave Management System is a student-developed project for academic compliance. It is provided "as is" without warranty.</p>
			<p><strong>2. Liability:</strong> Team Elevate is not liable for data loss or operational downtime resulting from software errors.</p>
			<p><strong>3. Authorized Access:</strong> Only authorized personnel are permitted to access this system. Sharing of credentials is prohibited.</p>
		</div>`,
		icon: 'info',
		confirmButtonText: 'I Understand',
		confirmButtonColor: '#7066e0',
		scrollbarPadding: false
	});
}

// Function to show Privacy Policy modal using SweetAlert2
function showPrivacyModal(event) {
	event.preventDefault();
	Swal.fire({
		title: 'Privacy Policy',
		html: `<div style="text-align: left; max-height: 400px; overflow-y: auto;">
			<p><strong>1. Data Collection:</strong> We collect operational data such as sales logs, inventory levels, and user login history.</p>
			<p><strong>2. Usage:</strong> Data is used solely for business operations and academic analysis by Datamex College.</p>
			<p><strong>3. Security:</strong> Data is stored locally/securely and is not shared with third parties outside of academic requirements.</p>
		</div>`,
		icon: 'info',
		confirmButtonText: 'I Understand',
		confirmButtonColor: '#7066e0',
		scrollbarPadding: false
	});
}

// Function to Open Modal (legacy - kept for compatibility)
function openModal(modalId) {
	document.getElementById(modalId).style.display = "block";
}

// Function to Close Modal (legacy - kept for compatibility)
function closeModal(modalId) {
	document.getElementById(modalId).style.display = "none";
}

// Close Modal if user clicks outside the box (legacy)
window.onclick = function (event) {
	if (event.target.classList.contains('modal')) {
		event.target.style.display = "none";
	}
}

// Login Handler Function
function handleLogin(event) {
	event.preventDefault();

	const now = Date.now();

	// --- 1. RESET Logic (1 hour idle) ---
	const lastFailTime = parseInt(localStorage.getItem('login_last_fail_time') || '0', 10);
	const ONE_HOUR_MS = 60 * 60 * 1000;

	if (lastFailTime > 0 && (now - lastFailTime > ONE_HOUR_MS)) {
		// Reset counters if idle for more than 1 hour
		localStorage.removeItem('login_failed_attempts');
		localStorage.removeItem('login_penalty_level');
		localStorage.removeItem('login_lockout_end');
		localStorage.removeItem('login_last_fail_time');
	}

	// --- 2. CHECK LOCKOUT ---
	const lockoutEnd = parseInt(localStorage.getItem('login_lockout_end') || '0', 10);
	if (lockoutEnd > now) {
		const remainingMs = lockoutEnd - now;
		const remainingSec = Math.ceil(remainingMs / 1000);
		const minutes = Math.floor(remainingSec / 60);
		const seconds = remainingSec % 60;

		Swal.fire({
			title: 'Locked Out',
			text: `Too many failed attempts. Please try again in ${minutes}m ${seconds}s.`,
			icon: 'error',
			confirmButtonColor: '#d33'
		});
		return;
	} else if (lockoutEnd !== 0) {
		// Clean up expired lockout timestamp but keep penalty level (unless 1hr passed)
		localStorage.removeItem('login_lockout_end');
	}

	const username = document.getElementById('username').value.trim();
	// Get the actual password from the global variable (used for masking)
	// or fallback to the input value
	const password = (window.actualPassword || document.getElementById('password').value).trim();

	// Check for empty fields
	if (!username || !password) {
		Swal.fire({
			title: 'Input Required',
			text: 'Please enter both username and password.',
			icon: 'warning',
			confirmButtonColor: '#7066e0'
		});
		return;
	}

	// Credentials
	const validUsername = 'admin';
	const validPassword = '123';

	// Validate credentials
	if (username === validUsername && password === validPassword) {
		// --- SUCCESS: Clear all penalties ---
		localStorage.removeItem('login_failed_attempts');
		localStorage.removeItem('login_penalty_level');
		localStorage.removeItem('login_lockout_end');
		localStorage.removeItem('login_last_fail_time');

		// Store login state in sessionStorage (ends when tab/browser closes)
		sessionStorage.setItem('isLoggedIn', 'true');
		sessionStorage.setItem('username', username);

		// Show success alert and redirect
		Swal.fire({
			title: 'Login Successful!',
			text: 'Redirecting...',
			icon: 'success',
			showConfirmButton: false,
			timer: 1500,
			timerProgressBar: true,
			allowOutsideClick: false,
			didClose: () => {
				// Redirect to dashboard
				window.location.href = 'home.html';
			}
		});
	} else {
		// --- FAILURE: Handle Penalties ---
		let failedAttempts = parseInt(localStorage.getItem('login_failed_attempts') || '0', 10);
		failedAttempts++;
		localStorage.setItem('login_failed_attempts', failedAttempts);
		localStorage.setItem('login_last_fail_time', now);

		// Check for Lockout Trigger (every 3 attempts)
		if (failedAttempts >= 3) {
			// Get current penalty level (0 = 1st lock, 1 = 2nd lock...)
			let penaltyLevel = parseInt(localStorage.getItem('login_penalty_level') || '0', 10);

			// Formula: 1 min, 3 mins, 5 mins... (1 + level*2)
			const lockoutDurationMinutes = 1 + (penaltyLevel * 2);
			const lockoutDurationMs = lockoutDurationMinutes * 60 * 1000;

			// Set lockout end time
			localStorage.setItem('login_lockout_end', now + lockoutDurationMs);

			// Increase penalty level for next time
			localStorage.setItem('login_penalty_level', penaltyLevel + 1);

			// Reset failed attempts for the next batch? 
			// User said: "then I try again three times..." => Implies counting 1,2,3 again.
			localStorage.setItem('login_failed_attempts', '0');

			// Trigger visual update (dispatch event for the internal watcher)
			// OR just force a quick UI update if we can reach the elements
			const usernameField = document.getElementById('username');
			const passwordField = document.getElementById('password');
			const submitBtn = document.querySelector('button[type="submit"]');
			if (usernameField) usernameField.disabled = true;
			if (passwordField) passwordField.disabled = true;
			if (submitBtn) submitBtn.disabled = true;

			// Dispatch event to kickstart the rAF loop in checkLockout immediately if it was idling
			window.dispatchEvent(new Event('lockoutStart'));

			Swal.fire({
				title: 'System Locked',
				text: `Maximum attempts exceeded. You are locked out for ${lockoutDurationMinutes} minute(s).`,
				icon: 'error',
				confirmButtonColor: '#d33',
				allowOutsideClick: false
			});
		} else {
			// Show error alert using SweetAlert2
			Swal.fire({
				title: 'Login Failed',
				text: `Invalid username or password. You have ${3 - failedAttempts} attempt(s) remaining.`,
				icon: 'error',
				confirmButtonColor: '#7066e0',
				timer: 3000,
				timerProgressBar: true,
				didClose: () => {
					// Clear password field after error
					document.getElementById('password').value = '';
					window.actualPassword = '';
					document.getElementById('username').focus();
				}
			});
		}
	}
}