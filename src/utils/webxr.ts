/**
 * For data that can only be retrieved from an active webxr session, 
 * such as gaze data, and vr device information 
 */

// Dependencies interfaces
interface GazeTracker {
    recordGaze: (_position: number[], orientation: number[], gazeHitData: any) => void; // TODO: Replace 'any' with specific type
}

interface DynamicObject {
    // Define properties if needed, currently unused in logic
}

type GazeRaycaster = () => any; // Returns gaze hit data. TODO: Replace 'any' with specific type

interface SessionStartResult {
    referenceSpace: XRReferenceSpace | null;
    boundedReferenceSpace: XRReferenceSpace | null;
    type: string | null;
}

export class XRSessionManager {
  private gazeTracker: GazeTracker;
  private xrSession: XRSession;
  private dynamicObject: DynamicObject | null;
  private gazeRaycaster: GazeRaycaster | null;
  
  public referenceSpace: XRReferenceSpace | null;  // For gaze tracking (local-floor)
  public boundedReferenceSpace: XRReferenceSpace | null; // For boundary tracking (bounded-floor)
  public referenceSpaceType: string | null;
  
  private isTracking: boolean;
  private animationFrameHandle: number | null;
  private lastUpdateTime: number;
  private interval: number;

  constructor(gazeTracker: GazeTracker, xrSession: XRSession, dynamicObject: DynamicObject | null = null, gazeRaycaster: GazeRaycaster | null = null) {
    this.gazeTracker = gazeTracker; 
    this.xrSession = xrSession; 
    this.dynamicObject = dynamicObject;
    this.gazeRaycaster = gazeRaycaster;
    this.referenceSpace = null;  // For gaze tracking (local-floor)
    this.boundedReferenceSpace = null; // For boundary tracking (bounded-floor)
    this.referenceSpaceType = null;
    this.isTracking = false; 
    this.animationFrameHandle = null;
    this.onXRFrame = this.onXRFrame.bind(this);
    this.lastUpdateTime = 0; 
    this.interval = 100; 
  }

  async start(): Promise<SessionStartResult | null> {
      if (this.isTracking) return { 
          referenceSpace: this.referenceSpace, 
          boundedReferenceSpace: this.boundedReferenceSpace,
          type: this.referenceSpaceType 
      };
      
      // 1. ALWAYS get local-floor for gaze tracking
      try {
          this.referenceSpace = await this.xrSession.requestReferenceSpace('local-floor');
          console.log('Cog3D-XR-Session-Manager: Using "local-floor" for gaze tracking.');
      } catch (error) {
          console.warn('Cog3D-XR-Session-Manager: "local-floor" not supported, falling back to "local".', error);
          try {
              this.referenceSpace = await this.xrSession.requestReferenceSpace('local');
              console.log('Cog3D-XR-Session-Manager: Using "local" for gaze tracking.');
          } catch (finalError) {
              console.error('Cog3D-XR-Session-Manager: Failed to get reference space for gaze.', finalError);
              return null;
          }
      }
      
      // 2. Try to get bounded-floor for boundary tracking (optional)
      try {
          // @ts-ignore: 'bounded-floor' might not be in standard definitions depending on tsconfig lib
          this.boundedReferenceSpace = await this.xrSession.requestReferenceSpace('bounded-floor');
          this.referenceSpaceType = 'bounded-floor';
          console.log('Cog3D-XR-Session-Manager: "bounded-floor" available for boundary tracking.');
      } catch (error) {
          console.warn('Cog3D-XR-Session-Manager: "bounded-floor" not available. Boundary tracking disabled.', error);
          this.boundedReferenceSpace = null;
          this.referenceSpaceType = 'local-floor';
      }
      
      this.isTracking = true;
      this.animationFrameHandle = this.xrSession.requestAnimationFrame(this.onXRFrame);
      console.log('Cog3D-XR-Session-Manager: Gaze tracking started.');
      
      return {
          referenceSpace: this.referenceSpace,  // local-floor for gaze
          boundedReferenceSpace: this.boundedReferenceSpace,  // bounded-floor for boundaries
          type: this.referenceSpaceType
      };
  }
  
  onXRFrame(timestamp: number, frame: XRFrame): void { 
    if (!this.isTracking) return;

    if (timestamp - this.lastUpdateTime >= this.interval) {
        this.lastUpdateTime = timestamp;
        // @ts-ignore: referenceSpace check handled by logic flow, but strictly nullable in TS
        if(!this.referenceSpace) return; 

        const viewerPose = frame.getViewerPose(this.referenceSpace); // Uses local-floor

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
  
  stop(): void { 
    if (!this.isTracking) return;

    this.isTracking = false;
    if (this.animationFrameHandle) {
      this.xrSession.cancelAnimationFrame(this.animationFrameHandle);
    }
    console.log('Cog3D-XR-Session-Manager: Gaze tracking stopped.');
  }
}

// Controller (profile identifier) lookup table to infer HMD Device, note that headset can be different from controller brand 
const HMD_PROFILE_MAP: { [key: string]: { VRModel: string; VRVendor: string } } = {
    'meta-quest-touch-pro': { VRModel: 'Quest Pro', VRVendor: 'Meta' },
    'meta-quest-touch-plus': { VRModel: 'Quest 3/ Quest 3S', VRVendor: 'Meta' },
    'oculus-touch-v3': { VRModel: 'Quest 2', VRVendor: 'Meta' },
    'oculus-touch': { VRModel: 'Quest/Rift S', VRVendor: 'Meta' }, // Generic fallback
    'htc-vive': { VRModel: 'Vive', VRVendor: 'HTC' },
    'valve-index': { VRModel: 'Index', VRVendor: 'Valve' },
    'microsoft-mixed-reality': { VRModel: 'Mixed Reality', VRVendor: 'Microsoft' }
};

export const getHMDInfo = (inputSources: XRInputSourceArray | XRInputSource[]): { VRModel: string; VRVendor: string } | null => {
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

export const getEnabledFeatures = (xrSession: XRSession): { handTracking: boolean; eyeTracking: boolean } => {
    const sessionAny = xrSession as any; // TODO: Replace 'any' with correct type once standard libraries update
    const enabledFeatures = (sessionAny.enabledFeatures as string[]) || [];

    const handTracking = enabledFeatures.includes('hand-tracking');
    const eyeTracking = enabledFeatures.includes('eye-tracking');

    console.log(`Cog3D-XR-Session-Manager: Hand Tracking feature is ${handTracking ? 'enabled' : 'disabled'}.`);
    console.log(`Cog3D-XR-Session-Manager: Eye Tracking feature is ${eyeTracking ? 'enabled' : 'disabled'}.`);

    return {
        handTracking,
        eyeTracking
    };
};