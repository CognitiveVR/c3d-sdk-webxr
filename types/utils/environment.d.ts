/**
 * Environment detection and safe browser API access
 */
export const isBrowser: boolean;
export const isNode: boolean;
export function safeWindowAccess(accessor: Function, defaultValue: any): any;
export function getDeviceMemory(): any;
export function getScreenHeight(): any;
export function getScreenWidth(): any;
export function getUserAgent(): any;
export function getHardwareConcurrency(): any;
export function getConnection(): any;
export function getSystemInfo(): Promise<{
    os: any;
    deviceType: string;
    browser: any;
}>;
export function getGPUInfo(): {
    vendor: any;
    renderer: any;
} | null;
export { default as fetch } from "cross-fetch";
