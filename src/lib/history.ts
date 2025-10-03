
const HISTORY_KEY = 'streamlined-watch-history';
const MAX_HISTORY_SIZE = 200; // Keep the last 200 watched videos

/**
 * Gets the watch history from localStorage.
 * @returns {string[]} An array of video IDs.
 */
export function getHistory(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const historyJson = localStorage.getItem(HISTORY_KEY);
  return historyJson ? JSON.parse(historyJson) : [];
}

/**
 * Adds a video ID to the watch history in localStorage.
 * @param {string} videoId The ID of the video to add.
 */
export function addToHistory(videoId: string) {
  if (typeof window === 'undefined') {
    return;
  }
  let history = getHistory();
  
  // Remove the videoId if it already exists to move it to the front
  const existingIndex = history.indexOf(videoId);
  if (existingIndex > -1) {
    history.splice(existingIndex, 1);
  }

  // Add the new videoId to the beginning of the array (most recent)
  history.unshift(videoId);

  // Trim the history to the maximum size
  if (history.length > MAX_HISTORY_SIZE) {
    history = history.slice(0, MAX_HISTORY_SIZE);
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * Clears the entire watch history from localStorage.
 */
export function clearHistory() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(HISTORY_KEY);
}
