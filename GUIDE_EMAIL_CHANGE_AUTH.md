# Professional Guide: Secure Email Change Authentication Process

## Overview
This document outlines the secure authentication flow for changing a user's email address within the **The Brew Cave** application, utilizing **Supabase Auth**. This process ensures the security and integrity of user accounts by verifying ownership of the new email address before the change is finalized.

## The Authentication Flow

### 1. User Initiation
- **Action**: The user navigates to the "Security & Privacy" tab in their profile.
- **Trigger**: The user clicks the "Change Email" button.
- **Interface**: A secure, high-fidelity modal appears, prompting the user to enter their **New Email Address** and **Confirm New Email Address**.
- **Validation**: The system performs immediate client-side validation for format and matching fields.

### 2. Secure Request Transmission
- **API Call**: Upon confirmation, the application sends a secure request to the Supabase Auth API using the `updateUser` method.
    ```javascript
    await supabase.auth.updateUser({ email: newEmail });
    ```
- **Security Context**: This request is authenticated using the user's active session token (JWT).

### 3. Verification & Confirmation (Double Opt-In)
- **Email Verification**: Supabase sends a secure, time-sensitive **Verification Link** to the **NEW** email address.
- **Old Email**: (Optional) A notification may be sent to the old email.

### 4. Finalizing the Change (Fresh Device Support)
- **User Action**: The user clicks the verification link in their email.
- **Handling**: The link directs to `auth-callback.html`.
- **Logic**:
    - The `auth-callback.html` page processes the `access_token` or `error` from the URL hash.
    - **Fresh Devices**: This page is exempt from strict session checks, allowing users to verify their email even on a device where they are not currently logged in.
    - **Success**: If verification succeeds, the user's session is established (or recovered), and they are redirected to their Profile page.
    - **Local State**: The system automatically updates local session flags to ensure a seamless experience.

## User Experience Improvements
- **No Login-Wall**: Users do not need to log in again just to verify their email, reducing friction.
- **Clear Feedback**: The callback page provides clear visual indicators of "Verifying...", "Success", or "Failed".
- **Auto-Redirect**: On success, the user is automatically taken to their updated profile.

## Troubleshooting
- **"I didn't receive the email"**: Check Spam/Junk folders.
- **"Link Expired"**: Verification links expire (usually 24h). Request the change again if needed.
- **"Redirect Loop"**: This has been resolved by ensuring the sign-out process clears all local browser session flags.
