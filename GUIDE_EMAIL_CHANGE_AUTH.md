# Professional Guide: Secure Email Change Authentication Process

## Overview
This document outlines the secure authentication flow for changing a user's email address within the **The Brew Cave** application, utilizing **Supabase Auth**. This process ensures the security and integrity of user accounts by verifying ownership of the new email address before the change is finalized.

## The Authentication Flow

### 1. User Initiation
- **Action**: The user navigates to the "Security & Privacy" tab in their profile.
- **Trigger**: The user clicks the "Change Email" button.
- **Interface**: A secure, high-fidelity modal appears, prompting the user to enter their **New Email Address** and **Confirm New Email Address**.
- **Validation**: The system performs immediate client-side validation:
    - Checks if fields are empty.
    - Validates email format (regex).
    - Ensures both email fields match data entry.

### 2. Secure Request Transmission
- **API Call**: Upon confirmation, the application sends a secure request to the Supabase Auth API using the `updateUser` method.
    ```javascript
    await supabase.auth.updateUser({ email: newEmail });
    ```
- **Security Context**: This request is authenticated using the user's active session token (JWT), ensuring only the logged-in user can request changes to their account.

### 3. Verification & Confirmation (The "Double Opt-In")
- **System Action**: Supabase receives the request. Instead of immediately changing the email, it initiates a **verification process**.
- **Old Email Notification**: (Optional/Configurable) The system may send a notification to the *old* email address alerting them of the requested change.
- **New Email Verification**: Supabase sends a secure, time-sensitive **Verification Link** to the **NEW** email address.
    - **Subject**: "Confirm Your Email Change"
    - **Content**: Contains a unique, one-time-use secure token.

### 4. Finalizing the Change
- **User Action**: The user must log into their **NEW** email account and click the verification link.
- **Authentication**: Clicking the link opens the application. Supabase verifies the token.
- **Completion**: 
    - If the token is valid, Supabase updates the user's `email` field in the `auth.users` table.
    - The `email_confirmed_at` timestamp is updated.
    - The user is effectively logged in with the new email address.
    - Future logins **MUST** use the new email address.

## Technical Implementation Details

### Client-Side Code (`js/profile.js`)
The implementation uses `SweetAlert2` for a professional, interrupted workflow that prevents accidental submissions.

**Key Logic:**
1.  **Input capture**: Securely captures user input via modal.
2.  **Pre-flight check**: Validates inputs locally to reduce API load.
3.  **Async Execution**: Calls `supabase.auth.updateUser` asynchronously.
4.  **Feedback**: Provides immediate visual feedback (success/error states) to the user.

### Security Best Practices Implemented
- **Session Validation**: The action is blocked if no valid session exists.
- **Input Sanitization**: Inputs are treated as strings and validated against strict email patterns.
- **Confirmation Step**: Requiring the email twice prevents typos (e.g., locking a user out due to `user@gmil.com`).
- **Visual Feedback**: Loading states prevent double-submission.

## Troubleshooting
- **"I didn't receive the email"**: Check the Spam/Junk folder of the **NEW** email address.
- **"Link Expired"**: Verification links have an expiration time (usually 24 hours). If expired, the user must request the change again.
- **"Old Email Still Works"**: The email change is **NOT** final until the link in the new email is clicked. Until then, the old email remains the valid login credential.
