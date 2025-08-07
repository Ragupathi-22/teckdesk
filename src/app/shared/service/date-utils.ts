// Utility functions for handling Firestore timestamps
export function convertFirestoreTimestamp(timestamp: any): Date {
  if (!timestamp) {
    return new Date();
  }
  
  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // If it's a Firestore timestamp
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a timestamp object with seconds
  if (timestamp && typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000);
  }
  
  // If it's a string or number
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  // Fallback
  return new Date();
}

export function formatDate(timestamp: any): string {
  const date = convertFirestoreTimestamp(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

export function isToday(timestamp: any): boolean {
  const date = convertFirestoreTimestamp(timestamp);
  const today = new Date();
  return date.toDateString() === today.toDateString();
} 