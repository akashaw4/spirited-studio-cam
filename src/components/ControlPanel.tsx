
import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Download, Camera } from "lucide-react";

interface ControlPanelProps {
  isFilterActive: boolean;
  onFilterToggle: () => void;
  onScreenshot: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isFilterActive,
  onFilterToggle,
  onScreenshot,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-md">
      <div className="flex items-center space-x-4">
        <Switch id="filter-toggle" checked={isFilterActive} onCheckedChange={onFilterToggle} />
        <Label htmlFor="filter-toggle" className="font-medium text-ghibli-night">
          Anime Ghibli Style {isFilterActive ? "On" : "Off"}
        </Label>
      </div>

      <Button 
        onClick={onScreenshot} 
        className="bg-ghibli-accent hover:bg-ghibli-accent/90 text-white"
      >
        <Camera className="w-4 h-4 mr-2" />
        Capture Anime Moment
      </Button>
    </div>
  );
};

export default ControlPanel;
