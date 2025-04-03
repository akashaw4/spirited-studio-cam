
import React, { useRef, useEffect, useState } from "react";

interface GhibliFilterProps {
  videoElement: HTMLVideoElement | null;
  isFilterActive: boolean;
}

const GhibliFilter: React.FC<GhibliFilterProps> = ({ videoElement, isFilterActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });

  useEffect(() => {
    if (videoElement) {
      console.log("Video dimensions:", videoElement.videoWidth, videoElement.videoHeight);
      // Set canvas dimensions to match the video
      setDimensions({
        width: videoElement.videoWidth || 640,
        height: videoElement.videoHeight || 480
      });
    }
  }, [videoElement]);

  useEffect(() => {
    if (!videoElement || !canvasRef.current) return;

    console.log("Setting up canvas rendering with video element");
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Apply Ghibli-style filters
    const applyGhibliEffect = (ctx: CanvasRenderingContext2D) => {
      // Save current canvas state
      ctx.save();
      
      // Apply a slight blur for painting effect
      ctx.filter = 'blur(0.5px)';
      
      // Draw the video frame
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Reset filters for further modifications
      ctx.filter = 'none';
      
      // Get image data to manipulate pixels
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Enhance colors to create Ghibli look
      for (let i = 0; i < data.length; i += 4) {
        // Soften the image by reducing contrast
        data[i] = Math.min(255, data[i] * 0.9 + 25);     // Red
        data[i + 1] = Math.min(255, data[i + 1] * 0.9 + 20); // Green
        data[i + 2] = Math.min(255, data[i + 2] * 0.85 + 30); // Blue
        
        // Shift colors slightly toward the Ghibli palette
        if (data[i] > data[i + 1] && data[i] > data[i + 2]) {
          // Warm up reddish areas (sunset tones)
          data[i] = Math.min(255, data[i] * 1.1);
        } else if (data[i + 2] > data[i] && data[i + 2] > data[i + 1]) {
          // Enhance blues for sky
          data[i + 2] = Math.min(255, data[i + 2] * 1.05);
        } else if (data[i + 1] > data[i] && data[i + 1] > data[i + 2]) {
          // Enhance greens for foliage
          data[i + 1] = Math.min(255, data[i + 1] * 1.05);
        }
      }
      
      // Put the modified pixel data back
      ctx.putImageData(imageData, 0, 0);
      
      // Apply a watercolor-like effect using composite operations
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(255, 250, 230, 0.15)'; // Warm overlay
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add a very subtle vignette effect
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 1.5
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
      
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Restore canvas state
      ctx.restore();
    };
    
    // Simple render function that just draws the video
    const renderOriginal = () => {
      if (!ctx || !videoElement) return;
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    };

    // Animation loop
    const render = () => {
      if (!videoElement.paused && !videoElement.ended) {
        if (isFilterActive) {
          applyGhibliEffect(ctx);
        } else {
          renderOriginal();
        }
        requestIdRef.current = requestAnimationFrame(render);
      } else {
        // If video is paused, try again after a short delay
        setTimeout(() => {
          requestIdRef.current = requestAnimationFrame(render);
        }, 100);
      }
    };

    // Start the rendering loop
    console.log("Starting render loop");
    requestIdRef.current = requestAnimationFrame(render);

    return () => {
      // Clean up
      console.log("Cleaning up render loop");
      cancelAnimationFrame(requestIdRef.current);
    };
  }, [videoElement, isFilterActive]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
    />
  );
};

export default GhibliFilter;
