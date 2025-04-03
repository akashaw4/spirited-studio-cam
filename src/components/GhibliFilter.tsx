
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
      const checkDimensions = () => {
        if (videoElement.videoWidth && videoElement.videoHeight) {
          console.log("Setting video dimensions:", videoElement.videoWidth, videoElement.videoHeight);
          setDimensions({
            width: videoElement.videoWidth,
            height: videoElement.videoHeight
          });
        } else {
          // If dimensions are not available yet, check again in 100ms
          setTimeout(checkDimensions, 100);
        }
      };
      
      checkDimensions();
    }
  }, [videoElement]);

  useEffect(() => {
    if (!videoElement || !canvasRef.current) return;

    console.log("Setting up canvas rendering with video element");
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Apply Ghibli-style animation-like filters
    const applyGhibliEffect = (ctx: CanvasRenderingContext2D) => {
      // Save current canvas state
      ctx.save();
      
      // First draw the original image
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Get image data to manipulate pixels
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply Ghibli-style color palette and effects
      for (let i = 0; i < data.length; i += 4) {
        // Enhance pastel tones - a key characteristic of Ghibli animations
        data[i] = Math.min(255, data[i] * 0.9 + 25);     // Red
        data[i + 1] = Math.min(255, data[i + 1] * 0.9 + 20); // Green
        data[i + 2] = Math.min(255, data[i + 2] * 0.85 + 30); // Blue
        
        // Reduce color diversity (more cartoon-like)
        data[i] = Math.round(data[i] / 15) * 15;
        data[i + 1] = Math.round(data[i + 1] / 15) * 15;
        data[i + 2] = Math.round(data[i + 2] / 15) * 15;
        
        // Shift colors toward typical Ghibli palette
        if (data[i] > data[i + 1] && data[i] > data[i + 2]) {
          // Warm up reddish areas (sunset tones)
          data[i] = Math.min(255, data[i] * 1.15);
          data[i + 1] = Math.min(255, data[i + 1] * 0.9);
        } else if (data[i + 2] > data[i] && data[i + 2] > data[i + 1]) {
          // Enhance blues for skies - make them more pastel blue
          data[i] = Math.min(255, data[i] + 20);
          data[i + 1] = Math.min(255, data[i + 1] + 20);
          data[i + 2] = Math.min(255, data[i + 2] * 1.1);
        } else if (data[i + 1] > data[i] && data[i + 1] > data[i + 2]) {
          // Enhance greens for foliage - make them more vibrant
          data[i] = Math.max(0, data[i] * 0.9);
          data[i + 1] = Math.min(255, data[i + 1] * 1.1);
        }
      }
      
      // Put the modified pixel data back
      ctx.putImageData(imageData, 0, 0);
      
      // Apply line enhancement effect (slight edge detection)
      ctx.globalCompositeOperation = 'multiply';
      ctx.filter = 'contrast(1.1) saturate(1.2)';
      ctx.drawImage(canvas, 0, 0);
      
      // Apply soft watercolor-like effect
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(255, 250, 230, 0.2)'; // Warm overlay
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add very subtle noise texture to mimic animation cell
      ctx.globalCompositeOperation = 'overlay';
      const noiseCanvas = document.createElement('canvas');
      noiseCanvas.width = canvas.width;
      noiseCanvas.height = canvas.height;
      const noiseCtx = noiseCanvas.getContext('2d');
      
      if (noiseCtx) {
        const noiseData = noiseCtx.createImageData(canvas.width, canvas.height);
        const noiseDataArray = noiseData.data;
        
        for (let i = 0; i < noiseDataArray.length; i += 4) {
          const value = Math.floor(Math.random() * 20 - 10);
          noiseDataArray[i] = noiseDataArray[i + 1] = noiseDataArray[i + 2] = value;
          noiseDataArray[i + 3] = 5; // Very transparent
        }
        
        noiseCtx.putImageData(noiseData, 0, 0);
        ctx.drawImage(noiseCanvas, 0, 0);
      }
      
      // Add a subtle vignette effect - characteristic of animation frames
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 1.5
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
      
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
      if (videoElement.readyState >= 2 && !videoElement.paused && !videoElement.ended) {
        if (isFilterActive) {
          applyGhibliEffect(ctx);
        } else {
          renderOriginal();
        }
      } else {
        // If video is not ready or paused, try again
        console.log("Video not ready, paused or ended. Trying again...");
        if (videoElement.paused) {
          videoElement.play().catch(err => console.error("Error playing video:", err));
        }
      }
      requestIdRef.current = requestAnimationFrame(render);
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
      style={{ display: 'block' }}
    />
  );
};

export default GhibliFilter;
