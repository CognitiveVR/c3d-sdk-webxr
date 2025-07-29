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


const _parseFromUserAgent = (userAgent) => {
    const osMap = [
        { name: 'Windows', regex: /Windows/ },
        { name: 'macOS', regex: /Macintosh|MacIntel|MacPPC|Mac68K/ },
        { name: 'Android', regex: /Android/ },
        { name: 'iOS', regex: /iPhone|iPad|iPod/ },
        { name: 'Linux', regex: /Linux/ },
    ];

    const browserMap = [
        { name: 'Firefox', regex: /Firefox/i },
        { name: 'Opera', regex: /OPR|Opera/i },
        { name: 'Edge', regex: /Edg/i },
        { name: 'Chrome', regex: /Chrome/i },
        { name: 'Safari', regex: /Safari/i },
    ];

    const findMatch = (map, agent) => map.find(entry => entry.regex.test(agent))?.name || 'unknown';

    const os = findMatch(osMap, userAgent);
    const browser = findMatch(browserMap, userAgent);
    
    let deviceType = 'Desktop';
    if (/Mobi|Android|iPhone/.test(userAgent)) {
        deviceType = 'Mobile';
    } else if (/iPad/.test(userAgent)) {
        deviceType = 'Tablet';
    }

    return { os, deviceType, browser };
};

const _parseFromUserAgentData = async (userAgentData) => {
    const platformData = await userAgentData.getHighEntropyValues(['platform']);
    const os = platformData.platform || 'unknown';
    const deviceType = userAgentData.mobile ? 'Mobile' : 'Desktop';
    
    const browserMap = [
        { name: 'Opera', brand: 'Opera' },
        { name: 'Edge', brand: 'Microsoft Edge' },
        { name: 'Chrome', brand: 'Google Chrome' },
    ];
    
    const brandInfo = userAgentData.brands?.find(b => browserMap.some(bm => bm.brand === b.brand));
    const browser = browserMap.find(bm => bm.brand === brandInfo?.brand)?.name || 'unknown';

    return { os, deviceType, browser };
};

export const getSystemInfo = async () => {
  if (!isBrowser) {
    return { os: 'unknown', deviceType: 'unknown', browser: "unknown" };
  }

  if (navigator.userAgentData) {
    return _parseFromUserAgentData(navigator.userAgentData);
  }
  
  return _parseFromUserAgent(navigator.userAgent);
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