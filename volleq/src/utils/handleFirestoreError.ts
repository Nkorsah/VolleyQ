// utils/handleFirestoreError.ts
import { FirestoreError } from 'firebase/firestore';

export async function withFirestoreError<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof FirestoreError) {
      switch (err.code) {
        case 'permission-denied':
          throw new Error('You do not have permission to perform this action');
        case 'not-found':
          throw new Error('The requested resource was not found');
        case 'unavailable':
          throw new Error('Service is temporarily unavailable. Please try again.');
        default:
          throw new Error(`Database error: ${err.message}`);
      }
    }
    throw err;
  }
}