import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

export default function BarcodeScanner({ onScan, onClose }) {
    const videoRef = useRef(null);
    const controlsRef = useRef(null);
    const scannedRef = useRef(false);
    const callbacksRef = useRef({ onScan, onClose });

    const [error, setError] = useState("");
    const [starting, setStarting] = useState(true);

    // Keep callbacks updated without restarting the camera.
    useEffect(() => {
        callbacksRef.current = { onScan, onClose };
    }, [onScan, onClose]);

    useEffect(() => {
        let active = true;
        let reader = null;

        const stopScanner = () => {
            try {
                controlsRef.current?.stop();
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }

            controlsRef.current = null;

            const video = videoRef.current;

            if (video?.srcObject) {
                video.srcObject.getTracks().forEach((track) => {
                    track.stop();
                });

                video.srcObject = null;
            }
        };

        const hints = new Map();

        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.ITF,
            BarcodeFormat.CODABAR,
        ]);

        reader = new BrowserMultiFormatReader(hints, {
            delayBetweenScanAttempts: 150,
            delayBetweenScanSuccess: 500,
        });

        const startScanner = async () => {
            try {
                setError("");
                setStarting(true);

                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error(
                        "Camera is unavailable. Please use HTTPS or localhost."
                    );
                }

                const constraints = {
                    audio: false,
                    video: {
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                };

                const controls = await reader.decodeFromConstraints(
                    constraints,
                    videoRef.current,
                    (result) => {
                        if (!active || !result || scannedRef.current) {
                            return;
                        }

                        const barcode = result.getText()?.trim();

                        if (!barcode) return;

                        scannedRef.current = true;

                        stopScanner();

                        try {
                            callbacksRef.current.onScan(barcode);
                        } finally {
                            callbacksRef.current.onClose();
                        }
                    }
                );

                if (!active) {
                    controls.stop();
                    return;
                }

                controlsRef.current = controls;
                setStarting(false);

            } catch (err) {
                console.error("Barcode scanner error:", err);

                if (!active) return;

                setStarting(false);

                if (err?.name === "NotAllowedError") {
                    setError(
                        "Camera permission denied. Please allow camera access in your browser settings."
                    );
                } else if (err?.name === "NotFoundError") {
                    setError(
                        "No camera found. Connect a camera and try again."
                    );
                } else if (err?.name === "NotReadableError") {
                    setError(
                        "Camera is currently being used by another application."
                    );
                } else {
                    setError(
                        err?.message ||
                        "Unable to start the camera. Please try again."
                    );
                }
            }
        };

        startScanner();

        return () => {
            active = false;
            stopScanner();
        };
    }, []);

    const handleClose = () => {
        try {
            controlsRef.current?.stop();
        } catch (err) {
            console.error("Error closing scanner:", err);
        }

        controlsRef.current = null;

        callbacksRef.current.onClose();
    };

    return (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">
                    Scan Product Barcode
                </h3>

                <span className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                    Camera Scanner
                </span>
            </div>

            {/* Camera */}
            <div className="relative overflow-hidden rounded-xl bg-slate-950">

                <video
                    ref={videoRef}
                    className="block max-h-80 min-h-48 w-full object-contain"
                    autoPlay
                    muted
                    playsInline
                />

                {!error && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="relative h-24 w-[85%] max-w-sm">

                            <div className="absolute inset-0 rounded-lg border-2 border-orange-400" />

                            <div className="absolute left-0 right-0 top-1/2 border-t-2 border-orange-400" />

                        </div>
                    </div>
                )}

                {starting && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70">
                        <p className="text-sm font-medium text-white">
                            Starting camera...
                        </p>
                    </div>
                )}

            </div>

            {/* Instructions */}
            {!error && (
                <p className="text-sm text-slate-600">
                    Position the barcode inside the scanning area. Keep
                    the barcode steady and ensure proper lighting.
                </p>
            )}

            {/* Error */}
            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">

                    <p className="font-semibold">
                        Scanner Error
                    </p>

                    <p className="mt-1 break-words">
                        {error}
                    </p>

                    <p className="mt-2">
                        Check camera permissions and ensure no other
                        application is using the camera.
                    </p>

                </div>
            )}

            {/* Cancel */}
            <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
                Cancel
            </button>

        </div>
    );
}