import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

type QRCodeScannerModalProps = {
  open: boolean;
  onClose: () => void;
  onDetected: (value: string) => void;
};

type BarcodeDetectorResult = {
  rawValue?: string;
};

type BarcodeDetectorLike = {
  detect: (input: HTMLVideoElement) => Promise<BarcodeDetectorResult[]>;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

export function QRCodeScannerModal({ open, onClose, onDetected }: QRCodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scanningRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const stopStream = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        streamRef.current = null;
      }
      scanningRef.current = false;
    };

    const startScanner = async () => {
      setErrorMessage(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMessage("Camera not supported on this device/browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;

        if (!Detector) {
          setErrorMessage("QR scanner is not supported in this browser. Use Chrome on mobile.");
          return;
        }

        const detector = new Detector({ formats: ["qr_code"] });

        const scanFrame = async () => {
          if (!videoRef.current || scanningRef.current) {
            rafRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          try {
            scanningRef.current = true;
            const results = await detector.detect(videoRef.current);
            const value = results?.[0]?.rawValue?.trim();

            if (value) {
              stopStream();
              onDetected(value);
              return;
            }
          } catch {
            // keep scanning
          } finally {
            scanningRef.current = false;
          }

          rafRef.current = requestAnimationFrame(scanFrame);
        };

        rafRef.current = requestAnimationFrame(scanFrame);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to access camera";
        setErrorMessage(message);
      }
    };

    startScanner();

    return () => {
      stopStream();
    };
  }, [open, onDetected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl overflow-hidden border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 text-[#4D4D4D]">
            <Camera className="w-5 h-5 text-[#628F97]" />
            <h3>Scan QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-[#717182]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="rounded-lg overflow-hidden border border-gray-200 bg-black">
            <video ref={videoRef} className="w-full aspect-square object-cover" playsInline muted />
          </div>
          <p className="text-xs text-[#717182] mt-3">Point camera at the job QR code.</p>
          {errorMessage && <p className="text-sm text-red-600 mt-2">{errorMessage}</p>}
        </div>
      </div>
    </div>
  );
}
