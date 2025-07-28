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

export const getScreenHeight = () =>
  safeWindowAccess(() => window.screen.height, null);

export const getScreenWidth = () =>
  safeWindowAccess(() => window.screen.width, null);

export const getUserAgent = () =>
  safeWindowAccess(() => navigator.userAgent, '');

export const getHardwareConcurrency = () => // CPU threads that I have access to 
    safeWindowAccess(() => navigator.hardwareConcurrency, null);

export const getConnection = () =>
    safeWindowAccess(() => navigator.connection, null);


export const getSystemInfo = async () => {
  const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined'; // if not in a browser 
  if (!isBrowser) {
    return { os: 'unknown', deviceType: 'unknown', browser: "unknown" };
  }

  if (navigator.userAgentData) { // if userAgentData supported 
    const platformData = await navigator.userAgentData.getHighEntropyValues(['platform']);
    const os = platformData.platform || 'unknown';
    const deviceType = navigator.userAgentData.mobile ? 'Mobile' : 'Desktop';

    let browser = 'unknown';
    if (navigator.userAgentData.brands){
        if (navigator.userAgentData.brands.some(b => b.brand === 'Opera')) {
        browser = 'Opera';
      } else if (navigator.userAgentData.brands.some(b => b.brand === 'Microsoft Edge')) {
        browser = 'Edge';
      } else if (navigator.userAgentData.brands.some(b => b.brand === 'Google Chrome')) {
        browser = 'Chrome';
      }
    } 

    return { os, deviceType, browser };
  }
  
  const userAgent = navigator.userAgent;   // Fallback as UserAgentData not support on Firefox, Safari (and older browsers)
  let os = 'unknown';
  let deviceType = 'unknown';
  let browser = 'unknown'

  // OS Detection
  if (/Windows/.test(userAgent)) os = 'Windows';
  else if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) os = 'macOS';
  else if (/Android/.test(userAgent)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(userAgent)) os = 'iOS';
  else if (/Linux/.test(userAgent)) os = 'Linux';

  // Device Type Detection
  if (/Mobi|Android|iPhone/.test(userAgent)) {
    deviceType = 'Mobile';
  } else if (/iPad/.test(userAgent)) {
    deviceType = 'Tablet';     // iPads on recent iOS versions may be reported as a Mac
  }

  // Browser Detection 
  if (/Firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/OPR|Opera/i.test(userAgent)) {
    browser = 'Opera';
  } else if (/Edg/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/Chrome/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(userAgent)) {
    browser = 'Safari';
  }
  return { os, deviceType, browser};
};

export const getGPUInfo = () => {
    if (!isBrowser) {
    return null;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        let vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        let renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (renderer.toLowerCase().includes("adreno")) {
          vendor = "Qualcomm";
        }
        return { vendor, renderer };
      }
    }
  } catch (e) {
    console.warn("WebGL is not supported", e);
  }
  return null;
};

// Universal fetch implementation (works in both browser and Node)
export { default as fetch } from 'cross-fetch';