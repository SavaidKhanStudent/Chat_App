export const getFriendlyFirebaseError = (error) => {
  if (!error || !error.code) {
    return 'An unexpected error occurred. Please try again.';
  }

  switch (error.code) {
    // Authentication Errors
    case 'auth/invalid-email':
      return 'The email address is not valid. Please check the format.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No user found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already in use by another account.';
    case 'auth/popup-closed-by-user':
      return 'The sign-in window was closed. Please try again.';
    case 'auth/cancelled-popup-request':
        return 'The sign-in process was cancelled. Please try again.';

    // Firestore Errors
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    case 'unavailable':
      return 'The service is currently unavailable. Please check your internet connection.';
    case 'deadline-exceeded':
      return 'The operation took too long. Please check your internet connection and try again.';
    case 'resource-exhausted':
        return 'We are experiencing high demand right now. Please try again in a moment.';

    default:
      console.error('Unhandled Firebase Error:', error);
      return 'An unexpected error occurred. Please try again.';
  }
};
