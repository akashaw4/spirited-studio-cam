
import React, { useState, useRef } from "react";
import WebcamCapture from "@/components/WebcamCapture";
import GhibliFilter from "@/components/GhibliFilter";
import ControlPanel from "@/components/ControlPanel";
import ScreenshotDownload from "@/components/ScreenshotDownload";
import { toast } from "sonner";

const Index = () => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(true);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleVideoReady = (video: HTMLVideoElement) => {
    setVideoElement(video);
    toast.success("Camera ready! Ghibli transformation active.");
  };

  const handleFilterToggle = () => {
    setIsFilterActive(!isFilterActive);
    toast.info(isFilterActive ? "Original view" : "Ghibli filter applied");
  };

  const handleScreenshot = () => {
    if (!canvasRef.current) {
      // Create a temporary canvas to capture the current filtered frame
      const tempCanvas = document.createElement("canvas");
      const videoWidth = videoElement?.videoWidth || 640;
      const videoHeight = videoElement?.videoHeight || 480;
      
      tempCanvas.width = videoWidth;
      tempCanvas.height = videoHeight;
      
      const ctx = tempCanvas.getContext("2d");
      
      if (ctx && videoElement) {
        // Simply grab what's displayed in the GhibliFilter canvas
        const displayedCanvas = document.querySelector("canvas");
        if (displayedCanvas) {
          ctx.drawImage(displayedCanvas, 0, 0, videoWidth, videoHeight);
          const dataUrl = tempCanvas.toDataURL("image/png");
          setScreenshot(dataUrl);
          toast.success("Moment captured in Ghibli style!");
        } else {
          toast.error("Couldn't capture screenshot");
        }
      }
    } else {
      toast.error("Screenshot functionality not available");
    }
  };

  const closeScreenshot = () => {
    setScreenshot(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ghibli-sky to-ghibli-cloud p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-ghibli-night mb-2 animate-float">
            Studio Ghibli Camera
          </h1>
          <p className="text-ghibli-night/80 text-lg">
            Transform your world into the magical style of Studio Ghibli
          </p>
        </header>

        <div className="rounded-xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm p-6">
          <div className="mb-6">
            {videoElement ? (
              <GhibliFilter
                videoElement={videoElement}
                isFilterActive={isFilterActive}
              />
            ) : (
              <WebcamCapture onVideoReady={handleVideoReady} />
            )}
          </div>

          <ControlPanel
            isFilterActive={isFilterActive}
            onFilterToggle={handleFilterToggle}
            onScreenshot={handleScreenshot}
          />

          {screenshot && (
            <ScreenshotDownload
              imageUrl={screenshot}
              onClose={closeScreenshot}
            />
          )}
        </div>

        <footer className="mt-8 text-center text-sm text-ghibli-night/60">
          <p>
            Inspired by the magical worlds of Studio Ghibli
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
