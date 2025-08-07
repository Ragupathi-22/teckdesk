// src/app/core/errors/auth-error.mapper.ts

export function getAuthErrorMessage(error: unknown): string {
  const code = extractFirebaseCode(error);

  switch (code) {
    // ----- Auth (email/password) -----
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in.';
    case 'auth/invalid-email':
      return 'The email address is invalid.';
    case 'auth/user-not-found':
      return 'No user found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger one.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not allowed. Contact support.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/popup-closed-by-user':
      return 'The sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by the browser.';
    case 'auth/credential-already-in-use':
      return 'This credential is already associated with another user.';
    case 'auth/requires-recent-login':
      return 'Please log in again to perform this action.';
    case 'auth/invalid-credential':
      return 'The credential provided is invalid.';
    case 'auth/missing-email':
      return 'Please enter your email address.';

    // ----- Firestore / generic permission -----
    case 'permission-denied':
    case 'failed-precondition':
      return 'You do not have permission to perform this action.';

    default:
      return 'Something went wrong. Please try again.';
  }
}

/** Narrow helper so you can still pass any error type safely */
function extractFirebaseCode(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    return String((err as any).code);
  }
  return undefined;
}
