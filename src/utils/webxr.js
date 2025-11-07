/**
 * For data that can only be retrieved from an active webxr session, 
 * such as gaze data, and vr device information 
 */

export class XRSessionManager {
  constructor(gazeTracker, xrSession, dynamicObject = null, gazeRaycaster = null) {
    this.gazeTracker = gazeTracker; 
    this.xrSession = xrSession; 
    this.dynamicObject = dynamicObject;
    this.gazeRaycaster = gazeRaycaster;
    this.referenceSpace = null; 
    this.isTracking = false; 
    this.animationFrameHandle = null;
    this.onXRFrame = this.onXRFrame.bind(this);
    this.lastUpdateTime = 0; 
    this.interval = 100; 
  }

  async start() {
      if (this.isTracking) return;
      try {
          this.referenceSpace = await this.xrSession.requestReferenceSpace('local-floor'); 
          console.log('Cog3D-XR-Session-Manager: Using "local-floor" reference space.');
      } catch (error) {
          console.warn('Cog3D-XR-Session-Manager: "local-floor" not supported, falling back to "local".', error);
          try {
              this.referenceSpace = await this.xrSession.requestReferenceSpace('local'); 
              console.log('Cog3D-XR-Session-Manager: Using "local" reference space.');
          } catch (fallbackError) {
              console.error('Cog3D-XR-Session-Manager: Failed to get any supported reference space.', fallbackError);
              return; 
          }
      }
      this.isTracking = true;
      this.animationFrameHandle = this.xrSession.requestAnimationFrame(this.onXRFrame);
      console.log('Cog3D-XR-Session-Manager: Gaze tracking started.');
  }

  stop() { 
    if (!this.isTracking) return;

    this.isTracking = false;
    if (this.animationFrameHandle) {
      this.xrSession.cancelAnimationFrame(this.animationFrameHandle);
    }
    console.log('Cog3D-XR-Session-Manager: Gaze tracking stopped.');
  }

  onXRFrame(timestamp, frame) { 
    if (!this.isTracking) return;

    if (timestamp - this.lastUpdateTime >= this.interval) {
        this.lastUpdateTime = timestamp;
        const viewerPose = frame.getViewerPose(this.referenceSpace);

        if (viewerPose) {
          const { position, orientation } = viewerPose.transform;
          
          let gazeHitData = null;
          if (this.gazeRaycaster) {
              gazeHitData = this.gazeRaycaster();
          }

    
        const correctedPosition = [position.x, position.y, -position.z];
        const correctedOrientation = [orientation.x, orientation.y, -orientation.z, -orientation.w];

        this.gazeTracker.recordGaze(
            correctedPosition,
            correctedOrientation,
            gazeHitData
            );
        }
    }
    
    this.animationFrameHandle = this.xrSession.requestAnimationFrame(this.onXRFrame); 
  }
}
// Controller (profile identifier) lookup table to infer HMD Device 
const HMD_PROFILE_MAP = {
    'meta-quest-touch-pro': { VRModel: 'Quest Pro', VRVendor: 'Meta' },
    'meta-quest-touch-plus': { VRModel: 'Quest 3/ Quest 3S', VRVendor: 'Meta' },
    'oculus-touch-v3': { VRModel: 'Quest 2', VRVendor: 'Meta' },
    'oculus-touch': { VRModel: 'Quest/Rift S', VRVendor: 'Meta' }, // Generic fallback
    'htc-vive': { VRModel: 'Vive', VRVendor: 'HTC' },
    'valve-index': { VRModel: 'Index', VRVendor: 'Valve' },
    'microsoft-mixed-reality': { VRModel: 'Mixed Reality', VRVendor: 'Microsoft' }
};

export const getHMDInfo = (inputSources) => {
    for (const source of inputSources) {
        if (!source.profiles) continue;

        for (const profile of source.profiles) {
            const lowerCaseProfile = profile.toLowerCase();
            
            const matchedProfile = Object.keys(HMD_PROFILE_MAP).find(key => lowerCaseProfile.includes(key));

            if (matchedProfile) {
                console.log("HMD Profile Matched: ", lowerCaseProfile);
                return HMD_PROFILE_MAP[matchedProfile];
            }
        }
    }
    return null; 
};

export const getEnabledFeatures = (xrSession) => {
    const enabledFeatures = xrSession.enabledFeatures || [];

    const handTracking = enabledFeatures.includes('hand-tracking');
    const eyeTracking = enabledFeatures.includes('eye-tracking');

    console.log(`Cog3D-XR-Session-Manager: Hand Tracking feature is ${handTracking ? 'enabled' : 'disabled'}.`);
    console.log(`Cog3D-XR-Session-Manager: Eye Tracking feature is ${eyeTracking ? 'enabled' : 'disabled'}.`);

    return {
        handTracking,
        eyeTracking
    };
};