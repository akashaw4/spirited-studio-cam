
import React, { useRef, useEffect, useState } from "react";
import { toast } from "sonner";

interface WebcamCaptureProps {
  onVideoReady: (videoElement: HTMLVideoElement) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onVideoReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function setupWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            setIsLoading(false);
            if (videoRef.current) {
              onVideoReady(videoRef.current);
            }
          };
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setIsLoading(false);
        setHasError(true);
        toast.error("Could not access webcam. Please check permissions.");
      }
    }

    setupWebcam();

    return () => {
      // Clean up the stream when component unmounts
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onVideoReady]);

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ghibli-accent"></div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
          <div className="text-white text-center p-4">
            <p className="text-xl font-semibold mb-2">Camera Access Denied</p>
            <p>Please check your browser permissions and try again.</p>
          </div>
        </div>
      )}
      
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className={`max-w-full h-auto ${isLoading ? 'invisible' : 'visible'}`}
      />
    </div>
  );
};

export default WebcamCapture;
