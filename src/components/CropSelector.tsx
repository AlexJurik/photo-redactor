import type { CropAspectRatio } from '../types';
import { Crop, Square, Smartphone, Maximize2 } from 'lucide-react';

interface CropSelectorProps {
  selectedCropId: string;
  onSelectCrop: (crop: CropAspectRatio) => void;
}

export const CROP_RATIOS: CropAspectRatio[] = [
  { id: 'original', name: 'Original', value: null, iconName: 'original' },
  { id: '1:1', name: '1:1 Square', value: 1, iconName: 'square' },
  { id: '4:5', name: '4:5 Portrait', value: 0.8, iconName: 'portrait' },
  { id: '9:16', name: '9:16 Story', value: 9 / 16, iconName: 'story' },
];

export default function CropSelector({
  selectedCropId,
  onSelectCrop,
}: CropSelectorProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'square':
        return <Square className="w-4 h-4" />;
      case 'portrait':
        // A rectangle 4:5 vertical
        return (
          <div className="w-3.5 h-4.5 border-2 border-current rounded-sm flex items-center justify-center">
            <span className="text-[7px] font-bold leading-none scale-75 opacity-70">4:5</span>
          </div>
        );
      case 'story':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Maximize2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-neutral-400 font-display">
          Crop Aspect Ratio
        </h3>
        <span className="text-neutral-500 text-xs flex items-center gap-1">
          <Crop className="w-3 h-3" /> Resize Canvas
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {CROP_RATIOS.map((crop) => {
          const isSelected = crop.id === selectedCropId;
          return (
            <button
              key={crop.id}
              onClick={() => onSelectCrop(crop)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? 'border-violet-500 bg-violet-950/20 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.1)] font-semibold'
                  : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="mb-2 flex items-center justify-center h-5">
                {getIcon(crop.iconName)}
              </div>
              <span className="text-[10px] text-center whitespace-nowrap">
                {crop.name.split(' ')[0] === 'Original' ? 'Original' : crop.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
