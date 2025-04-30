/**
 * Environment detection and safe browser API access
 */

// Check if we're in a browser environment
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// Check if we're in a Node.js environment
export const isNode = typeof process !== 'undefined' &&
                      process.versions != null &&
                      process.versions.node != null;

/**
 * Safely access window properties
 * @param {Function} accessor - Function that accesses window properties
 * @param {*} defaultValue - Default value to return if window is undefined or accessor throws
 */
export const safeWindowAccess = (accessor, defaultValue) => {
  if (!isBrowser) return defaultValue;

  try {
    return accessor();
  } catch (e) {
    console.warn('Error accessing window property:', e);
    return defaultValue;
  }
};

// Device detection utilities
export const getDeviceMemory = () =>
  safeWindowAccess(() => navigator.deviceMemory, null);

export const getPlatform = () =>
  safeWindowAccess(() => navigator.platform, 'unknown');

export const getScreenHeight = () =>
  safeWindowAccess(() => window.screen.height, null);

export const getScreenWidth = () =>
  safeWindowAccess(() => window.screen.width, null);

export const getUserAgent = () =>
  safeWindowAccess(() => navigator.userAgent, '');

// OS detection
export const getOS = () => {
  if (!isBrowser) return 'unknown';

  const userAgent = getUserAgent();
  const platform = getPlatform();

  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

  if (macosPlatforms.indexOf(platform) !== -1) {
    return 'MacOS';
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    return 'iOS';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    return 'Windows';
  } else if (/Android/.test(userAgent)) {
    return 'Android';
  } else if (/Linux/.test(platform)) {
    return 'Linux';
  }

  return 'unknown';
};

// Platform type detection
export const getPlatformType = () => {
  if (!isBrowser) return 'unknown';

  const userAgent = getUserAgent();

  if (userAgent.match(/mobile/i)) {
    return 'Mobile';
  } else if (userAgent.match(/iPad|Android|Touch/i)) {
    return 'Tablet';
  } else {
    return 'Desktop';
  }
};

// Universal fetch implementation (works in both browser and Node)
export { default as fetch } from 'cross-fetch';