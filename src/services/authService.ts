import {
    createUserWithEmailAndPassword,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    signInWithCredential,
    signInWithEmailAndPassword,
    signInWithPopup,
    User
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from '../config/firebaseConfig';

// For Google Sign-In on native
let GoogleSignin: any = null;
if (Platform.OS !== 'web') {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  } catch (e) {
    console.log('Google Sign-In not available');
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<User> {
  if (Platform.OS === 'web') {
    // Web: Use popup
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } else {
    // Native: Use Google Sign-In library
    if (!GoogleSignin) {
      throw new Error('Google Sign-In is not configured for this platform');
    }
    
    try {
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: '910150341676-l9j7cbvsqcko5ouqocqmkt4un88el48h.apps.googleusercontent.com',
        iosClientId: '910150341676-c4ncqe2n8hv5o4nc6budoeaufdehu61t.apps.googleusercontent.com',
        offlineAccess: true,
      });
      
      // Check Play Services (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      
      // Sign in with Google
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult?.data?.idToken || signInResult?.idToken;
      
      if (!idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }
      
      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);
      
      // Sign in with the credential
      const userCredential = await signInWithCredential(auth, googleCredential);
      return userCredential.user;
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  // Sign out from Google if on native
  if (Platform.OS !== 'web' && GoogleSignin) {
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      // Ignore if not signed in with Google
    }
  }
  
  await firebaseSignOut(auth);
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Get auth error message
 */
export function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An error occurred. Please try again.';
  }
}

/**
 * Send email verification to current user
 */
export async function sendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    try {
      console.log('Sending verification email to:', user.email);
      await import('firebase/auth').then(({ sendEmailVerification }) => 
        sendEmailVerification(user)
      );
      console.log('Verification email sent successfully');
    } catch (error: any) {
      console.error('Failed to send verification email:', error.code, error.message);
      throw error;
    }
  } else {
    console.warn('No current user to send verification email to');
  }
}

/**
 * Reload current user data (to check verification status)
 */
export async function reloadUser(): Promise<User | null> {
  const user = auth.currentUser;
  if (user) {
    await user.reload();
    return auth.currentUser;
  }
  return null;
}

/**
 * Update user's display name
 */
export async function updateDisplayName(displayName: string): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    await import('firebase/auth').then(({ updateProfile }) => 
      updateProfile(user, { displayName })
    );
  }
}
