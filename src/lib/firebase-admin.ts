import './dns-patch';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'studio-9817976701-89717',
  });
}

export const adminAuth = admin.auth();

/**
 * Verify the Firebase ID Token in the Authorization header.
 * Returns the decoded UID on success, or throws an error.
 */
export async function verifySession(request: Request): Promise<string> {
  const authHeader = request.headers.get('authorization');
  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isDev) {
      console.warn('[verifySession] Missing Authorization header, falling back to dev-guest-uid for testing.');
      return 'dev-guest-uid';
    }
    throw new Error('Unauthorized: Missing or invalid Authorization header');
  }

  const token = authHeader.split('Bearer ')[1];

  if (token === 'undefined' || token === 'null' || !token) {
    if (isDev) {
      console.warn('[verifySession] Token is undefined/null, falling back to dev-guest-uid for testing.');
      return 'dev-guest-uid';
    }
    throw new Error('Unauthorized: Invalid authentication token');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    if (isDev) {
      console.warn('[verifySession] Token verification failed, falling back to dev-guest-uid for testing.');
      return 'dev-guest-uid';
    }
    throw new Error('Unauthorized: Invalid authentication token');
  }
}
