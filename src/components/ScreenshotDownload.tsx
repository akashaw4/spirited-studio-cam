
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface ScreenshotDownloadProps {
  imageUrl: string;
  onClose: () => void;
}

const ScreenshotDownload: React.FC<ScreenshotDownloadProps> = ({ imageUrl, onClose }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ghibli-moment-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-ghibli-night">Your Ghibli Moment</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="overflow-auto p-4 flex-grow">
          <img 
            src={imageUrl} 
            alt="Captured screenshot" 
            className="max-w-full h-auto rounded-md shadow-sm mx-auto"
          />
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <Button onClick={handleDownload} className="bg-ghibli-forest hover:bg-ghibli-forest/90">
            <Download className="w-4 h-4 mr-2" />
            Download Image
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScreenshotDownload;
