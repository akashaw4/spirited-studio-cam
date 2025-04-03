
import React, { useRef, useEffect, useState } from "react";

interface GhibliFilterProps {
  videoElement: HTMLVideoElement | null;
  isFilterActive: boolean;
}

const GhibliFilter: React.FC<GhibliFilterProps> = ({ videoElement, isFilterActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });
  // Reference image for line detection
  const referenceImage = useRef<HTMLImageElement | null>(null);
  
  // Load reference image once
  useEffect(() => {
    const img = new Image();
    img.src = "public/lovable-uploads/89a353b8-540a-40ab-9300-9fdf3d1e888c.png";
    img.onload = () => {
      referenceImage.current = img;
    };
  }, []);

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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) return;

    // Apply Ghibli-style hand-drawn animation-like filters
    const applyGhibliEffect = (ctx: CanvasRenderingContext2D) => {
      // Save current canvas state
      ctx.save();
      
      // First draw the original image
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Get image data to manipulate pixels
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Step 1: Apply color quantization for anime-like flat colors
      for (let i = 0; i < data.length; i += 4) {
        // More aggressive color quantization (fewer colors)
        data[i] = Math.round(data[i] / 20) * 20;       // Red
        data[i + 1] = Math.round(data[i + 1] / 20) * 20; // Green
        data[i + 2] = Math.round(data[i + 2] / 20) * 20; // Blue
        
        // Enhance pastel tones - signature of Ghibli
        data[i] = Math.min(255, data[i] * 0.9 + 25);     // Red
        data[i + 1] = Math.min(255, data[i + 1] * 0.9 + 20); // Green
        data[i + 2] = Math.min(255, data[i + 2] * 0.85 + 30); // Blue
        
        // Shift colors toward typical Ghibli palette
        if (data[i] > data[i + 1] && data[i] > data[i + 2]) {
          // Warm up reddish/brown areas (like character skin tones)
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
      
      // Step 2: Apply edge detection for line art
      ctx.globalCompositeOperation = 'source-over';
      // First pass - detect edges
      const edgeCanvas = document.createElement('canvas');
      edgeCanvas.width = canvas.width;
      edgeCanvas.height = canvas.height;
      const edgeCtx = edgeCanvas.getContext('2d', { willReadFrequently: true });
      
      if (edgeCtx) {
        // Draw the current state
        edgeCtx.drawImage(canvas, 0, 0);
        
        // Apply a subtle blur to help edge detection
        edgeCtx.filter = 'blur(1px)';
        edgeCtx.drawImage(edgeCanvas, 0, 0);
        edgeCtx.filter = 'none';
        
        // Get the image data for edge detection
        const edgeData = edgeCtx.getImageData(0, 0, canvas.width, canvas.height);
        const edgePixels = edgeData.data;
        
        // Sobel operator for edge detection
        const sobelData = new Uint8ClampedArray(edgePixels.length);
        const width = canvas.width;
        
        // Simple edge detection
        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            
            // Calculate differences between neighboring pixels
            const topLeft = getIntensity(edgePixels, (y-1) * width + (x-1), width);
            const top = getIntensity(edgePixels, (y-1) * width + x, width);
            const topRight = getIntensity(edgePixels, (y-1) * width + (x+1), width);
            const left = getIntensity(edgePixels, y * width + (x-1), width);
            const right = getIntensity(edgePixels, y * width + (x+1), width);
            const bottomLeft = getIntensity(edgePixels, (y+1) * width + (x-1), width);
            const bottom = getIntensity(edgePixels, (y+1) * width + x, width);
            const bottomRight = getIntensity(edgePixels, (y+1) * width + (x+1), width);
            
            // Sobel approximation
            const horizEdge = topLeft + 2*left + bottomLeft - topRight - 2*right - bottomRight;
            const vertEdge = topLeft + 2*top + topRight - bottomLeft - 2*bottom - bottomRight;
            
            const edgeMagnitude = Math.sqrt(horizEdge*horizEdge + vertEdge*vertEdge);
            
            // Threshold for line detection
            const isEdge = edgeMagnitude > 50 ? 255 : 0;
            
            // Set edge pixels
            sobelData[idx] = sobelData[idx+1] = sobelData[idx+2] = isEdge ? 0 : 255; // Black lines
            sobelData[idx+3] = isEdge ? 255 : 0; // Transparent non-edges
          }
        }
        
        // Create new image data with edge lines
        const sobelImageData = new ImageData(sobelData, canvas.width, canvas.height);
        edgeCtx.putImageData(sobelImageData, 0, 0);
        
        // Apply the edge detection over the original with transparency
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(edgeCanvas, 0, 0);
      }
      
      // Step 3: Apply a watercolor-like texture
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(255, 245, 230, 0.3)'; // Warm watercolor overlay
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Step 4: Add hand-drawn noise texture to mimic animation cell
      ctx.globalCompositeOperation = 'overlay';
      const noiseCanvas = document.createElement('canvas');
      noiseCanvas.width = canvas.width;
      noiseCanvas.height = canvas.height;
      const noiseCtx = noiseCanvas.getContext('2d');
      
      if (noiseCtx) {
        const noiseData = noiseCtx.createImageData(canvas.width, canvas.height);
        const noiseDataArray = noiseData.data;
        
        for (let i = 0; i < noiseDataArray.length; i += 4) {
          const value = Math.floor(Math.random() * 25 - 12);
          noiseDataArray[i] = noiseDataArray[i + 1] = noiseDataArray[i + 2] = value;
          noiseDataArray[i + 3] = 10; // Very subtle
        }
        
        noiseCtx.putImageData(noiseData, 0, 0);
        ctx.drawImage(noiseCanvas, 0, 0);
      }
      
      // Step 5: Add a subtle vignette effect - characteristic of animation frames
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 1.7
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.25)');
      
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Step 6: Apply a slight saturation boost for vibrant anime colors
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Restore canvas state
      ctx.restore();
    };
    
    // Helper function to get pixel intensity (grayscale value)
    function getIntensity(pixels: Uint8ClampedArray, offset: number, width: number): number {
      offset = Math.max(0, Math.min(pixels.length/4 - 1, offset)) * 4;
      return (pixels[offset] + pixels[offset+1] + pixels[offset+2]) / 3;
    }
    
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
