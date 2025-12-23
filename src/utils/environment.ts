import crossFetch from 'cross-fetch';

interface NavigatorUAData {
    mobile: boolean;
    brands: Array<{ brand: string; version: string }>;
    getHighEntropyValues(_hints: string[]): Promise<{ platform: string; platformVersion: string; [key: string]: any }>; // TODO: Replace 'any' with specific type
}

interface ExtendedNavigator extends Navigator {
    deviceMemory?: number;
    connection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        saveData?: boolean;
    };
    userAgentData?: NavigatorUAData;
}

export const isBrowser: boolean = typeof window !== 'undefined' && typeof document !== 'undefined';
export const isNode: boolean = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

export const safeWindowAccess = <T>(accessor: () => T, defaultValue: T): T => {
    if (!isBrowser) return defaultValue;
    try {
        return accessor();
    } catch (e) {
        console.warn('Error accessing window property:', e);
        return defaultValue;
    }
};

export const getDeviceMemory = (): number | null => safeWindowAccess(() => (navigator as ExtendedNavigator).deviceMemory ?? null, null);
export const getScreenHeight = (): number | null => safeWindowAccess(() => window.screen.height, null);
export const getScreenWidth = (): number | null => safeWindowAccess(() => window.screen.width, null);
export const getUserAgent = (): string => safeWindowAccess(() => navigator.userAgent, '');
export const getHardwareConcurrency = (): number | null => safeWindowAccess(() => navigator.hardwareConcurrency, null);
export const getConnection = (): ExtendedNavigator['connection'] | null => safeWindowAccess(() => (navigator as ExtendedNavigator).connection ?? null, null);

interface SystemInfo { os: string; deviceType: string; browser: string; }

const _parseFromUserAgent = (userAgent: string): SystemInfo => {
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
    const findMatch = (map: { name: string; regex: RegExp }[], agent: string) => 
        map.find(entry => entry.regex.test(agent))?.name || 'unknown';

    const os = findMatch(osMap, userAgent);
    const browser = findMatch(browserMap, userAgent);
    let deviceType = 'Desktop';
    if (/Mobi|Android|iPhone/.test(userAgent)) deviceType = 'Mobile';
    else if (/iPad/.test(userAgent)) deviceType = 'Tablet';

    return { os, deviceType, browser };
};

const _parseFromUserAgentData = async (userAgentData: NavigatorUAData): Promise<SystemInfo> => {
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

export const getSystemInfo = async (): Promise<SystemInfo> => {
    if (!isBrowser) return { os: 'unknown', deviceType: 'unknown', browser: "unknown" };
    const nav = navigator as ExtendedNavigator;
    if (nav.userAgentData) return _parseFromUserAgentData(nav.userAgentData);
    return _parseFromUserAgent(navigator.userAgent);
};

export interface GPUInfo { vendor: string; renderer: string; }

// REFACTORED: Reduced complexity
export const getGPUInfo = (): GPUInfo | null => {
    if (!isBrowser) return null;
    try {
        const canvas = document.createElement('canvas');
        const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext;
        if (!gl) return null;

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return null;

        let vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        let renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (renderer?.toLowerCase().includes("adreno")) vendor = "Qualcomm";
        
        return { vendor, renderer };
    } catch (e) {
        console.warn("WebGL is not supported", e);
    }
    return null;
};

export const fetch = crossFetch;