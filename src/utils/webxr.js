/**
 * For data that can only be retrieved from an active webxr session 
 */

export const getHMDInfo = (inputSources) => {
    for (const source of inputSources) {
        if (source.profiles) {
            for (const profile of source.profiles) {
                
                if (profile.includes('oculus') || profile.includes('meta-quest')) {
                    const VRVendor = 'Meta';
                    
                    if (profile.includes('quest-3')) return { VRModel: 'Quest 3', VRVendor }; 
                    if (profile.includes('quest-pro')) return { VRModel: 'Quest Pro', VRVendor };
                    if (profile.includes('oculus-touch-v3')) return { VRModel: 'Quest 2', VRVendor };

                    return { VRModel: 'Quest', VRVendor }; // fallback for future devices if none of the above 
                }

                if (profile.includes('htc-vive')) return { VRModel: 'Vive', VRVendor: 'HTC' };
                if (profile.includes('valve-index')) return { VRModel: 'Index', VRVendor: 'Valve' };
                if (profile.includes('microsoft-mixed-reality')) return { VRModel: 'Mixed Reality', VRVendor: 'Microsoft' };
            }
        }
    }
    return null; 
};