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
			// Clear local storage just in case
			localStorage.removeItem('isLoggedIn');

			// Show Swal after a slight delay to ensure it appears on top or after basic init
			setTimeout(() => {
				Swal.fire({
					title: 'Session Expired',
					text: 'Your session has timed out. Please log in again to continue.',
					icon: 'warning',
					confirmButtonText: 'Log In',
					confirmButtonColor: '#A67B5B',
					allowOutsideClick: false,
					// specific backdrop removed to use system default
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

	// --- Password Toggle Logic (Standard) ---

	// Remove complex global password storage
	window.actualPassword = '';

	if (passwordInput && passwordToggle) {
		// Toggle password visibility by changing input type
		passwordToggle.addEventListener('click', (e) => {
			e.preventDefault();

			const isPassword = passwordInput.getAttribute('type') === 'password';
			const newType = isPassword ? 'text' : 'password';
			passwordInput.setAttribute('type', newType);

			const eyeHidden = passwordToggle.querySelector('.eye-hidden');
			const eyeVisible = passwordToggle.querySelector('.eye-visible');

			if (!isPassword) {
				// Switching back to password (Hide)
				passwordToggle.setAttribute('aria-label', 'Show password');
				passwordToggle.classList.remove('visible');
				eyeHidden.style.display = 'block';
				eyeVisible.style.display = 'none';
			} else {
				// Switching to text (Show)
				passwordToggle.setAttribute('aria-label', 'Hide password');
				passwordToggle.classList.add('visible');
				eyeHidden.style.display = 'none';
				eyeVisible.style.display = 'block';
			}
		});

		// Prevent default form submission on toggle button click
		passwordToggle.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				passwordToggle.click();
			}
		});
	}

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
async function handleLogin(event) {
	event.preventDefault();

	const email = document.getElementById('username').value.trim();

	// Get the actual password from the global variable (used for masking)
	// or fallback to the input value
	const password = (window.actualPassword || document.getElementById('password').value).trim();

	// Check for empty fields
	if (!email || !password) {
		Swal.fire({
			title: 'Input Required',
			text: 'Please enter both email and password.',
			icon: 'warning',
			confirmButtonColor: '#7066e0'
		});
		return;
	}

	try {
		// Show loading
		Swal.fire({
			title: 'Signing in...',
			text: 'Verifying credentials',
			allowOutsideClick: false,
			didOpen: () => {
				Swal.showLoading();
			}
		});

		if (!window.sb) {
			throw new Error("Supabase client not ready. Please refresh.");
		}

		// Authenticate with Supabase
		const { data, error } = await window.sb.auth.signInWithPassword({
			email: email,
			password: password
		});

		if (error) throw error;

		const user = data.user;
		// Basic username from email
		const displayUsername = user.email ? user.email.split('@')[0] : 'User';

		// Store Basic Session Flag (for session-handler.js fallback)
		localStorage.setItem('isLoggedIn', 'true');
		localStorage.setItem('username', displayUsername);

		// Fetch User Role from Public Table
		try {
			const { data: userData } = await window.sb
				.from('users')
				.select('role')
				.eq('id', user.id)
				.single();

			if (userData && userData.role) {
				localStorage.setItem('role', userData.role);
			} else {
				localStorage.setItem('role', 'Staff'); // Default
			}
		} catch (ignored) {
			console.warn("Could not fetch user role, defaulting to Staff");
			localStorage.setItem('role', 'Staff');
		}

		// Success Redirect
		Swal.fire({
			title: 'Login Successful!',
			text: `Welcome back, ${displayUsername}!`,
			icon: 'success',
			showConfirmButton: false,
			timer: 1500,
			timerProgressBar: true,
			allowOutsideClick: false,
			didClose: () => {
				window.location.href = 'home.html';
			}
		});

	} catch (error) {
		console.error("Login Error:", error);
		let msg = error.message;
		if (msg && (msg.includes('Invalid login credentials') || msg.includes('Email not confirmed'))) {
			msg = 'Invalid email or password';
		}
		Swal.fire({
			title: 'Login Failed',
			text: msg ? msg : 'An error occurred during login',
			icon: 'error',
			confirmButtonColor: '#d33'
		});
	}
}
