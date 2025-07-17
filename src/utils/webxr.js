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

    const viewerPose = frame.getViewerPose(this.referenceSpace);

    if (viewerPose) {
      const { position, orientation } = viewerPose.transform;
      this.gazeTracker.recordGaze(
        [position.x, position.y, position.z],
        [-orientation.x, -orientation.y, -orientation.z, orientation.w]
      );
    }

    this.animationFrameHandle = this.xrSession.requestAnimationFrame(this.onXRFrame); // next frame 
  }
}


export const getHMDInfo = (inputSources) => { // Get info about users head mounted display  
    for (const source of inputSources) {
        if (source.profiles) {
            for (const profile of source.profiles) {
                
                if (profile.includes('oculus') || profile.includes('meta-quest')) {
                    const VRVendor = 'Meta';
                    if (profile.includes('meta-quest-touch-pro')) return { VRModel: 'Quest Pro', VRVendor };
                    if (profile.includes('meta-quest-touch-plus')) return { VRModel: 'Quest 3', VRVendor }; 
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