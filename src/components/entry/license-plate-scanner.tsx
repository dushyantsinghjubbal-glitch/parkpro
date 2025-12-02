'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { recognizeLicensePlate } from '@/ai/flows/recognize-license-plate';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, RefreshCw, Loader2, AlertTriangle, ScanSearch } from 'lucide-react';

type LicensePlateScannerProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onScanSuccess: (plate: string) => void;
};

export function LicensePlateScanner({ isOpen, onOpenChange, onScanSuccess }: LicensePlateScannerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const getCameraPermission = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this feature.',
      });
      onOpenChange(false);
    }
  }, [toast, onOpenChange, stream]);

  useEffect(() => {
    if (isOpen) {
      getCameraPermission();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsProcessing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setIsProcessing(false);
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    const imageDataUri = canvas.toDataURL('image/jpeg');

    try {
      const result = await recognizeLicensePlate({ imageDataUri });
      if (result.licensePlate) {
        onScanSuccess(result.licensePlate);
      } else {
        toast({
          variant: 'destructive',
          title: 'Scan Failed',
          description: 'Could not recognize a license plate. Please try again.',
        });
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'The license plate recognition failed. Please check your connection and try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[90vw] rounded-md">
        <DialogHeader>
          <DialogTitle>Scan License Plate</DialogTitle>
          <DialogDescription>
            Position the license plate within the frame and capture. Make sure the image is clear and well-lit.
          </DialogDescription>
        </DialogHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
            <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-1/2 w-3/4 rounded-lg border-4 border-dashed border-primary/50" />
            </div>
            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                    <p className="mt-4 text-lg">Camera access is required.</p>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
          <Button variant="outline" onClick={getCameraPermission} disabled={isProcessing}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Camera
          </Button>
          <Button onClick={handleCapture} disabled={!hasCameraPermission || isProcessing} className="w-full sm:w-auto">
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ScanSearch className="mr-2 h-4 w-4" />
            )}
            {isProcessing ? 'Recognizing...' : 'Capture & Recognize'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
