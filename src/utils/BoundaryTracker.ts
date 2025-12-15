/*
 * LIMITATIONS / TODO 
 * ----------------------------------------
 * 1. Missing 'reset' Event Handling:
 *    The code does not listen for `referenceSpace.addEventListener('reset',...)`. 
 *    If a user opens the OS menu and switches from Stationary to Room Scale during the session,
 *    the `referenceSpace` object may become invalid or jump origins. The tracker will fail 
 *    to detect this runtime switch without the event listener.
 *
 * 2. Missing Threshold Heuristic:
 *    To definitively identify the mode, you must implement a logic gate:
 *    IF (Area < 1.6m²) THEN "Stationary" ELSE "Room Scale". 
 *    Webxr API does not provide explicit Stationary vs Room Scale mode info only capabilities. 

 */
import { isBrowser } from './environment';

// Local interface to define the shape of the C3D instance this class interacts with
interface C3DInstance {
    customEvent: {
        send: (name: string, position: number[], properties?: any) => void;
    };
    xrSessionManager?: {
        referenceSpace: XRReferenceSpace;
    };
}

class BoundaryTracker {
    private c3d: C3DInstance;
    private intervalId: ReturnType<typeof setInterval> | null;
    private xrSession: XRSession | null;
    private currentBoundsGeometry: DOMPointReadOnly[] | null;

    constructor(c3dInstance: C3DInstance) {
        this.c3d = c3dInstance;
        this.intervalId = null;
        this.xrSession = null;
        this.currentBoundsGeometry = null;
    }

    start(xrSession: XRSession): void {
        if (!isBrowser || this.intervalId) {
            return;
        }

        this.xrSession = xrSession;
        // Check initial bounds
        this._checkBounds();

        // Poll for changes periodically
        this.intervalId = setInterval(() => {
            this._checkBounds();
        }, 1000); 
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.xrSession = null;
    }

    private _checkBounds(): void {
        if (!this.xrSession || !this.c3d.xrSessionManager || !this.c3d.xrSessionManager.referenceSpace) {
            return;
        }

        const refSpace = this.c3d.xrSessionManager.referenceSpace;
        
        // Bounds geometry is available on the reference space if the system supports it (e.g. bounded-floor)
        // Note: 'boundsGeometry' is part of the WebXR Bounded Reference Spaces spec
        if ('boundsGeometry' in refSpace && (refSpace as any).boundsGeometry) {
            const bounds = (refSpace as any).boundsGeometry as DOMPointReadOnly[];
            
            if (this._hasBoundsChanged(bounds)) {
                this.currentBoundsGeometry = bounds;
                this._reportBounds(bounds);
            }
        }
    }

    private _hasBoundsChanged(newBounds: DOMPointReadOnly[]): boolean {
        if (!this.currentBoundsGeometry) return true;
        if (this.currentBoundsGeometry.length !== newBounds.length) return true;

        for (let i = 0; i < newBounds.length; i++) {
            if (this.currentBoundsGeometry[i].x !== newBounds[i].x ||
                this.currentBoundsGeometry[i].z !== newBounds[i].z) {
                return true;
            }
        }
        return false;
    }

    private _reportBounds(bounds: DOMPointReadOnly[]): void {
        // Format bounds into a flat array or specific structure expected by the dashboard/backend
        const points = bounds.map(p => ({ x: p.x, z: p.z }));
        
        this.c3d.customEvent.send('c3d.boundary.update', [0, 0, 0], {
            bounds: points,
            pointCount: points.length
        });
    }
}

export default BoundaryTracker;