document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase to be ready
    const checkSupabase = setInterval(async () => {
        if (window.sb) {
            clearInterval(checkSupabase);
            await initProfile(window.sb);
        }
    }, 100);

    async function initProfile(supabase) {
        // Check current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            // Not logged in
            window.location.href = 'index.html';
            return;
        }

        const user = session.user;
        console.log("Supabase User:", user.email);

        // Basic Info from Auth
        const emailField = document.getElementById('profileEmail');
        const emailDisplay = document.getElementById('userEmailDisplay');
        if (emailField) emailField.value = user.email;
        if (emailDisplay) emailDisplay.textContent = user.email;

        // Fetch Detailed Profile from 'users' table
        try {
            let { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error("Error fetching profile:", fetchError);
            }

            if (userData) {
                // Populate Fields
                setValue('profileFirstName', userData.first_name || '');
                setValue('profileLastName', userData.last_name || '');
                setValue('profileBio', userData.bio || '');
                setValue('profilePhone', userData.phone || '');

                // Update Display
                const fullName = (userData.first_name || '') + ' ' + (userData.last_name || '');
                setText('userNameDisplay', fullName.trim() || 'User');

                // Role handling (if you have a role column)
                if (userData.role) {
                    setText('userRoleDisplay', userData.role);
                }

                // Avatar
                const avatarEl = document.getElementById('userAvatar');
                if (avatarEl) {
                    if (userData.avatar_url) {
                        avatarEl.src = userData.avatar_url;
                    } else {
                        // Generate initials from Name or Email
                        let nameForAvatar = (userData.first_name || '') + ' ' + (userData.last_name || '');
                        if (!nameForAvatar.trim()) {
                            nameForAvatar = user.email || 'User';
                        }
                        avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=A67B5B&color=fff&size=180`;
                    }
                }
            } else {
                console.log("No detailed profile found yet.");
                const displayName = user.email.split('@')[0];
                setText('userNameDisplay', displayName);

                // Update Avatar for new users (Fallback to email)
                const avatarEl = document.getElementById('userAvatar');
                if (avatarEl) {
                    avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=A67B5B&color=fff&size=180`;
                }
            }

        } catch (err) {
            console.error("Unexpected error:", err);
        }

        // --- Profile Form Update ---
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const firstName = document.getElementById('profileFirstName').value;
                const lastName = document.getElementById('profileLastName').value;
                const phone = document.getElementById('profilePhone').value;
                const bio = document.getElementById('profileBio').value;

                // Prepare Update Object
                const updates = {
                    id: user.id, // Primary key match
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    bio: bio,
                    updated_at: new Date()
                };

                try {
                    const { error } = await supabase
                        .from('users')
                        .upsert(updates);

                    if (error) throw error;

                    Swal.fire({
                        icon: 'success',
                        title: 'Profile Updated',
                        text: 'Your profile changes have been saved.',
                        timer: 1500,
                        showConfirmButton: false,
                        background: '#fff',
                        confirmButtonColor: '#A67B5B'
                    });

                    // Update UI immediately
                    const fullName = (firstName || '') + ' ' + (lastName || '');
                    setText('userNameDisplay', fullName.trim() || 'User');
                    setText('userPhoneDisplay', phone || '--');

                } catch (error) {
                    console.error("Update Error:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Update Failed',
                        text: error.message
                    });
                }
            });
        }

        // --- Avatar Upload Logic (Supabase Storage) ---
        const avatarUpload = document.getElementById('avatarUpload'); // Make sure this input exists in HTML
        if (avatarUpload) {
            avatarUpload.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    Swal.fire({
                        title: 'Uploading...',
                        text: 'Please wait',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading()
                    });

                    const fileExt = file.name.split('.').pop();
                    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    // 1. Upload to 'avatars' bucket
                    let { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    // 2. Get Public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);

                    // 3. Update User Profile with new URL
                    // We Include current form values to satisfy NOT NULL constraints if creating a new row
                    const { error: updateError } = await supabase
                        .from('users')
                        .upsert({
                            id: user.id,
                            avatar_url: publicUrl,
                            updated_at: new Date(),
                            first_name: document.getElementById('profileFirstName').value || 'New',
                            last_name: document.getElementById('profileLastName').value || 'User',
                            phone: document.getElementById('profilePhone').value || '',
                            bio: document.getElementById('profileBio').value || ''
                        });

                    if (updateError) throw updateError;

                    // Success
                    const avatarEl = document.getElementById('userAvatar');
                    if (avatarEl) avatarEl.src = publicUrl;

                    Swal.fire({
                        icon: 'success',
                        title: 'Uploaded!',
                        timer: 1500
                    });

                } catch (error) {
                    console.error("Upload failed:", error);
                    let msg = error.message;
                    if (error.details) msg += "\n" + error.details;
                    if (error.hint) msg += "\nHint: " + error.hint;

                    Swal.fire({
                        icon: 'error',
                        title: 'Upload Failed',
                        text: msg,
                        footer: 'Check console for full error object'
                    });
                }
            });
        }

        // --- Change Email ---
        const changeEmailBtn = document.getElementById('changeEmailBtn');
        if (changeEmailBtn) {
            changeEmailBtn.addEventListener('click', async () => {
                const { value: newEmail, isDismissed } = await Swal.fire({
                    title: '✉️ Change Email Address',
                    html: `
                        <div style="text-align: left; margin-bottom: 20px;">
                            <p style="color: #666; margin-bottom: 15px;">Enter your new email address. You'll need to verify it before the change takes effect.</p>
                            <input type="email" id="newEmail" class="swal2-input" placeholder="new.email@example.com" style="width: 100%; margin: 0;">
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Send Verification',
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#A67B5B',
                    cancelButtonColor: '#6c757d',
                    allowOutsideClick: true,
                    allowEscapeKey: true,
                    focusConfirm: false,
                    preConfirm: () => {
                        const email = document.getElementById('newEmail').value;
                        if (!email) {
                            Swal.showValidationMessage('Please enter an email address');
                            return false;
                        }
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                            Swal.showValidationMessage('Please enter a valid email address');
                            return false;
                        }
                        return email;
                    },
                    customClass: {
                        popup: 'animated-modal'
                    },
                    didClose: () => {
                        // Cleanup on close
                        document.body.classList.remove('swal2-shown', 'swal2-height-auto');
                    }
                });

                // Only proceed if not dismissed/cancelled
                if (newEmail && !isDismissed) {
                    Swal.fire({
                        title: 'Processing...',
                        html: 'Sending verification email',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading()
                    });

                    try {
                        const { error } = await supabase.auth.updateUser({ email: newEmail });

                        if (error) throw error;

                        await Swal.fire({
                            icon: 'success',
                            title: 'Verification Email Sent! 📧',
                            html: `
                                <p style="color: #666; margin-top: 10px;">
                                    We've sent a verification link to:<br>
                                    <strong style="color: #A67B5B;">${newEmail}</strong>
                                </p>
                                <p style="color: #999; font-size: 0.9em; margin-top: 15px;">
                                    Please check your inbox and click the verification link to complete the email change.
                                </p>
                            `,
                            confirmButtonColor: '#A67B5B',
                            confirmButtonText: 'Got it!'
                        });
                    } catch (error) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Update Failed',
                            text: error.message || 'Could not update email address',
                            confirmButtonColor: '#d33'
                        });
                    }
                }
            });
        }

        // --- Change Password ---
        const changePassBtn = document.getElementById('changePassBtn');
        if (changePassBtn) {
            changePassBtn.addEventListener('click', async () => {
                const { value: formValues, isDismissed } = await Swal.fire({
                    title: '🔒 Change Password',
                    html: `
                        <div style="text-align: left;">
                            <p style="color: #666; margin-bottom: 20px;">Create a strong password to keep your account secure.</p>
                            
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">New Password</label>
                                <input type="password" id="newPassword" class="swal2-input" placeholder="Enter new password" style="width: 100%; margin: 0;">
                            </div>
                            
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">Confirm Password</label>
                                <input type="password" id="confirmPassword" class="swal2-input" placeholder="Confirm new password" style="width: 100%; margin: 0;">
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-top: 15px;">
                                <p style="font-size: 0.85em; color: #666; margin: 0;">
                                    <strong>Password requirements:</strong><br>
                                    • At least 6 characters long<br>
                                    • Mix of letters and numbers recommended
                                </p>
                            </div>
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Update Password',
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#f39c12',
                    cancelButtonColor: '#6c757d',
                    allowOutsideClick: true,
                    allowEscapeKey: true,
                    focusConfirm: false,
                    preConfirm: () => {
                        const newPassword = document.getElementById('newPassword').value;
                        const confirmPassword = document.getElementById('confirmPassword').value;

                        if (!newPassword || !confirmPassword) {
                            Swal.showValidationMessage('Please fill in both password fields');
                            return false;
                        }

                        if (newPassword.length < 6) {
                            Swal.showValidationMessage('Password must be at least 6 characters');
                            return false;
                        }

                        if (newPassword !== confirmPassword) {
                            Swal.showValidationMessage('Passwords do not match');
                            return false;
                        }

                        return { password: newPassword };
                    },
                    customClass: {
                        popup: 'animated-modal'
                    },
                    didClose: () => {
                        // Cleanup on close
                        document.body.classList.remove('swal2-shown', 'swal2-height-auto');
                    }
                });

                // Only proceed if not dismissed/cancelled
                if (formValues && !isDismissed) {
                    Swal.fire({
                        title: 'Updating...',
                        html: 'Securing your new password',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading()
                    });

                    try {
                        const { error } = await supabase.auth.updateUser({
                            password: formValues.password
                        });

                        if (error) throw error;

                        await Swal.fire({
                            icon: 'success',
                            title: 'Password Updated! 🎉',
                            html: `
                                <p style="color: #666; margin-top: 10px;">
                                    Your password has been successfully changed.
                                </p>
                                <p style="color: #999; font-size: 0.9em; margin-top: 15px;">
                                    Make sure to remember your new password for future logins.
                                </p>
                            `,
                            confirmButtonColor: '#f39c12',
                            confirmButtonText: 'Awesome!',
                            timer: 3000,
                            timerProgressBar: true
                        });
                    } catch (error) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Update Failed',
                            text: error.message || 'Could not update password',
                            confirmButtonColor: '#d33'
                        });
                    }
                }
            });
        }

        // --- Sign Out ---
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', async () => {
                Swal.fire({
                    title: 'Sign Out?',
                    text: "You will be redirected to the login page.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#A67B5B',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, Sign Out'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        await supabase.auth.signOut();
                        window.location.href = 'index.html';
                    }
                });
            });
        }
    }

    function setValue(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }

    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }
});
