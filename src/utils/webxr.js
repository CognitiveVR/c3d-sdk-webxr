/**
 * For data that can only be retrieved from an active webxr session, 
 * such as gaze data, and vr device information 
 */

export class XRSessionManager {
  constructor(gazeTracker, xrSession) {
    this.gazeTracker = gazeTracker; // this sdks gazetracker module, data is sent here  
    this.xrSession = xrSession; // A live xr session to be provided by the browser 
    this.referenceSpace = null; // local floor to measure the position against 
    this.isTracking = false; 
    this.animationFrameHandle = null;
    this.onXRFrame = this.onXRFrame.bind(this);
    this.lastUpdateTime = 0; // Timestamp of the last gaze record
    this.interval = 1000; // 0.1s interval between gaze records
  }

  async start() {
      if (this.isTracking) return;
      try {
          this.referenceSpace = await this.xrSession.requestReferenceSpace('local-floor'); // local floor works in threejs but not playcanvas 
          console.log('Cog3D-XR-Session-Manager: Using "local-floor" reference space.');
      } catch (error) {
          console.warn('Cog3D-XR-Session-Manager: "local-floor" not supported, falling back to "local".', error);
          try {
              this.referenceSpace = await this.xrSession.requestReferenceSpace('local'); // local is more common 
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

  stop() { // Stop the gaze tracking loop.
    if (!this.isTracking) return;

    this.isTracking = false;
    if (this.animationFrameHandle) {
      this.xrSession.cancelAnimationFrame(this.animationFrameHandle);
    }
    console.log('Cog3D-XR-Session-Manager: Gaze tracking stopped.');
  }

  onXRFrame(timestamp, frame) { // runs every frame, gets pos + orientation and records to gazeTracker module 
    if (!this.isTracking) return;

    // Record gaze after interval ~ 0.1 seconds 
    if (timestamp - this.lastUpdateTime >= this.interval) {
        this.lastUpdateTime = timestamp;
        const viewerPose = frame.getViewerPose(this.referenceSpace);

        if (viewerPose) {
          const { position, orientation } = viewerPose.transform;
          this.gazeTracker.recordGaze(
            [position.x, position.y, position.z],
            [-orientation.x, -orientation.y, -orientation.z, orientation.w]
          );
        }
    }
    
    this.animationFrameHandle = this.xrSession.requestAnimationFrame(this.onXRFrame); // next frame 
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
            
            // Find a matching profile in our map
            const matchedProfile = Object.keys(HMD_PROFILE_MAP).find(key => lowerCaseProfile.includes(key));

            if (matchedProfile) {
                console.log("HMD Profile Matched: ", lowerCaseProfile);
                return HMD_PROFILE_MAP[matchedProfile];
            }
        }
    }
    return null; // No profile found
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
