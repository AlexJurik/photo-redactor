import type { Adjustments } from '../types';
import { Sun, Palette, Sliders, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface AdjustmentPanelProps {
  adjustments: Adjustments;
  onChangeAdjustment: (key: keyof Adjustments, value: any) => void;
  onResetAdjustments: () => void;
}

interface SliderConfig {
  key: keyof Adjustments;
  label: string;
  min: number;
  max: number;
  defaultValue: number;
  suffix?: string;
}

export default function AdjustmentPanel({
  adjustments,
  onChangeAdjustment,
  onResetAdjustments,
}: AdjustmentPanelProps) {
  const [activeTab, setActiveTab] = useState<'light' | 'color' | 'effects'>('light');

  const lightSliders: SliderConfig[] = [
    { key: 'brightness', label: 'Brightness', min: -100, max: 100, defaultValue: 0 },
    { key: 'contrast', label: 'Contrast', min: -100, max: 100, defaultValue: 0 },
    { key: 'highlights', label: 'Highlights', min: -100, max: 100, defaultValue: 0 },
    { key: 'shadows', label: 'Shadows', min: -100, max: 100, defaultValue: 0 },
  ];

  const colorSliders: SliderConfig[] = [
    { key: 'saturation', label: 'Saturation', min: -100, max: 100, defaultValue: 0 },
    { key: 'warmth', label: 'Warmth / Temp', min: -100, max: 100, defaultValue: 0 },
  ];

  const effectSliders: SliderConfig[] = [
    { key: 'sharpness', label: 'Sharpness', min: 0, max: 100, defaultValue: 0 },
    { key: 'vignette', label: 'Vignette', min: 0, max: 100, defaultValue: 0 },
    { key: 'grain', label: 'Film Grain', min: 0, max: 100, defaultValue: 0 },
    { key: 'fade', label: 'Matte Fade', min: 0, max: 100, defaultValue: 0 },
  ];

  const getActiveSliders = () => {
    switch (activeTab) {
      case 'light':
        return lightSliders;
      case 'color':
        return colorSliders;
      case 'effects':
        return effectSliders;
    }
  };

  const getTabIcon = (tab: typeof activeTab) => {
    switch (tab) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'color':
        return <Palette className="w-4 h-4" />;
      case 'effects':
        return <Sliders className="w-4 h-4" />;
    }
  };

  const hasChanges = Object.keys(adjustments).some((k) => {
    const key = k as keyof Adjustments;
    return adjustments[key] !== 0;
  });

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Category Tabs & Global Reset */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
        <div className="flex gap-1.5">
          {(['light', 'color', 'effects'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all capitalize ${
                activeTab === tab
                  ? 'bg-violet-600/20 text-violet-400 border border-violet-500/20'
                  : 'text-neutral-400 border border-transparent hover:text-white'
              }`}
            >
              {getTabIcon(tab)}
              {tab}
            </button>
          ))}
        </div>

        {hasChanges && (
          <button
            onClick={onResetAdjustments}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>
        )}
      </div>

      {/* Sliders Container */}
      <div className="flex flex-col gap-5 py-2">
        {getActiveSliders().map((slider) => {
          const value = adjustments[slider.key] as number;
          const isModified = value !== slider.defaultValue;

          return (
            <div key={slider.key} className="flex flex-col gap-1.5 group">
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-medium transition-colors ${
                    isModified ? 'text-violet-400 font-semibold' : 'text-neutral-300 group-hover:text-white'
                  }`}
                >
                  {slider.label}
                </span>
                
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono px-1.5 py-0.5 rounded ${
                      isModified
                        ? 'text-violet-400 bg-violet-950/30 border border-violet-500/10 font-bold'
                        : 'text-neutral-500 bg-neutral-950/50'
                    }`}
                  >
                    {value > 0 ? `+${value}` : value}
                    {slider.suffix || ''}
                  </span>
                  
                  {isModified && (
                    <button
                      onClick={() => onChangeAdjustment(slider.key, slider.defaultValue)}
                      className="text-neutral-500 hover:text-neutral-300 transition-colors"
                      title="Reset slider"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Custom Slider Input */}
              <div className="relative flex items-center">
                {/* Center tick indicator for negative/positive sliders */}
                {slider.min < 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-2 bg-neutral-700 pointer-events-none rounded"></div>
                )}
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  value={value}
                  onChange={(e) => onChangeAdjustment(slider.key, Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-neutral-800 focus:outline-none"
                  onDoubleClick={() => onChangeAdjustment(slider.key, slider.defaultValue)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {activeTab === 'effects' && (
        <div className="flex flex-col gap-2 mt-1 pt-4 border-t border-neutral-900 animate-in fade-in duration-300">
          <span className="text-xs font-semibold text-neutral-300 font-display uppercase tracking-wider">Aesthetic Borders</span>
          <div className="grid grid-cols-3 gap-2">
            {(['none', 'white-fit', 'polaroid'] as const).map((type) => {
              const isActive = adjustments.borderType === type;
              const labels = {
                none: 'No Border',
                'white-fit': 'White Fit',
                polaroid: 'Polaroid',
              };
              return (
                <button
                  key={type}
                  onClick={() => onChangeAdjustment('borderType', type)}
                  className={`px-3 py-2.5 text-[10px] font-bold rounded-xl border transition-all duration-200 ${
                    isActive
                      ? 'border-violet-500 bg-violet-950/20 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.15)] font-semibold'
                      : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:text-white'
                  }`}
                >
                  {labels[type]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-[10px] text-neutral-500 italic mt-1 bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-900">
        💡 Double-click any slider handle or its value to reset it.
      </div>
    </div>
  );
}
