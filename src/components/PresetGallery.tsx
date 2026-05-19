import { PRESETS } from '../presets';
import type { Preset } from '../types';
import { Check } from 'lucide-react';

interface PresetGalleryProps {
  selectedPresetId: string;
  onSelectPreset: (preset: Preset) => void;
  presetStrength: number;
  onChangePresetStrength: (strength: number) => void;
}

export default function PresetGallery({
  selectedPresetId,
  onSelectPreset,
  presetStrength,
  onChangePresetStrength,
}: PresetGalleryProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-neutral-400 font-display">
          Preset Styles
        </h3>
        <span className="text-xs text-neutral-500 bg-neutral-900/60 px-2 py-0.5 rounded border border-neutral-800">
          {PRESETS.length - 1} Filters
        </span>
      </div>

      {selectedPresetId !== 'original' && (
        <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-violet-950/10 border border-violet-500/10 mb-1 animate-in fade-in duration-300">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-violet-400">Filter Intensity</span>
            <span className="font-mono font-bold text-violet-400">{presetStrength}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="150"
            value={presetStrength}
            onChange={(e) => onChangePresetStrength(Number(e.target.value))}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-neutral-800 focus:outline-none accent-violet-500"
          />
        </div>
      )}

      {/* Horizontal scroll on mobile, flex wrap on desktop */}
      <div className="flex lg:grid lg:grid-cols-2 gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-none snap-x snap-mandatory">
        {PRESETS.map((preset) => {
          const isSelected = preset.id === selectedPresetId;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`flex-shrink-0 w-36 lg:w-auto snap-start text-left p-3 rounded-2xl border transition-all duration-200 group relative overflow-hidden ${
                isSelected
                  ? 'border-violet-500 bg-violet-950/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                  : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900/80'
              }`}
            >
              {/* Gradient Preview Card */}
              <div
                className={`w-full h-16 rounded-xl bg-gradient-to-tr ${preset.gradient} mb-2 relative flex items-center justify-center overflow-hidden border border-white/5 shadow-inner`}
              >
                {/* Micro-animation hover glow */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                    <div className="p-1.5 bg-violet-600 rounded-full text-white shadow-lg">
                      <Check className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="px-0.5">
                <p className="text-xs font-semibold text-white truncate group-hover:text-violet-400 transition-colors">
                  {preset.name}
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5 truncate leading-relaxed">
                  {preset.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
