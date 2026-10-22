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

    useEffect(() => {
        callbacksRef.current = { onScan, onClose };
    }, [onScan, onClose]);

    useEffect(() => {
        let active = true;

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

        const reader = new BrowserMultiFormatReader(hints, {
            delayBetweenScanAttempts: 150,
            delayBetweenScanSuccess: 500,
        });

        async function startScanner() {
            try {
                setError("");
                setStarting(true);

                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error(
                        "Camera is unavailable. Open this page using HTTPS or localhost."
                    );
                }

                const constraints = {
                    audio: false,
                    video: {
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        focusMode: "continuous",
                    },
                };

                const controls = await reader.decodeFromConstraints(
                    constraints,
                    videoRef.current,
                    (result, scanError, controls) => {
                        if (!active || !result || scannedRef.current) {
                            return;
                        }

                        const barcode = result.getText();

                        if (!barcode) return;

                        scannedRef.current = true;

                        controls.stop();
                        callbacksRef.current.onScan(barcode);
                        callbacksRef.current.onClose();
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

                if (active) {
                    setStarting(false);
                    setError(
                        err?.message ||
                        "Unable to start the camera. Check camera permissions."
                    );
                }
            }
        }

        startScanner();

        return () => {
            active = false;
            controlsRef.current?.stop();
            controlsRef.current = null;
        };
    }, []);

    const handleClose = () => {
        controlsRef.current?.stop();
        callbacksRef.current.onClose();
    };

    return (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">
                    Scan Product Barcode
                </h3>

                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                    Camera Scanner
                </span>
            </div>

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
            </div>

            {starting && !error && (
                <p className="text-sm text-slate-500">
                    Starting camera...
                </p>
            )}

            {!error && (
                <p className="text-sm text-slate-600">
                    Position the barcode inside the scanning area. Keep the barcode
                    steady and make sure it is well lit.
                </p>
            )}

            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <p className="font-semibold">Scanner Error</p>
                    <p className="mt-1 break-words">{error}</p>
                    <p className="mt-2">
                        Check camera permission and ensure no other application is
                        using the camera.
                    </p>
                </div>
            )}

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
