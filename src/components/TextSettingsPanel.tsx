import { Plus, Trash2, Brush, Upload, X, Layers } from 'lucide-react';
import type { TextOverlay } from '../types';
import { trackTextAdd } from '../analytics';

interface TextSettingsPanelProps {
  textOverlays: TextOverlay[];
  onChangeTextOverlays: (overlays: TextOverlay[]) => void;
  foregroundImage: HTMLImageElement | null;
  onChangeForegroundImage: (img: HTMLImageElement | null) => void;
  isBrushModeActive: boolean;
  onChangeBrushModeActive: (active: boolean) => void;
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  onClearMask: () => void;
  hasMask: boolean;
}

const FONTS = [
  { value: 'Anton', label: 'Anton (Impact Block)' },
  { value: 'Bebas Neue', label: 'Bebas Neue (Bold Tall)' },
  { value: 'Montserrat', label: 'Montserrat (Geometric)' },
  { value: 'Playfair Display', label: 'Playfair Display (Serif)' },
  { value: 'Outfit', label: 'Outfit (Modern)' },
  { value: 'Cinzel', label: 'Cinzel (Roman Serif)' },
];

const PRESET_COLORS = [
  { name: 'White', color: '#ffffff' },
  { name: 'Black', color: '#000000' },
  { name: 'Neon Yellow', color: '#eab308' },
  { name: 'Neon Pink', color: '#ec4899' },
  { name: 'Sunset Gradient', color: 'gradient-sunset', gradient: ['#ec4899', '#f97316'] as [string, string] },
  { name: 'Ocean Gradient', color: 'gradient-ocean', gradient: ['#06b6d4', '#3b82f6'] as [string, string] },
  { name: 'Royal Gradient', color: 'gradient-royal', gradient: ['#a855f7', '#6366f1'] as [string, string] },
];

export default function TextSettingsPanel({
  textOverlays,
  onChangeTextOverlays,
  foregroundImage,
  onChangeForegroundImage,
  isBrushModeActive,
  onChangeBrushModeActive,
  brushSize,
  onChangeBrushSize,
  onClearMask,
  hasMask,
}: TextSettingsPanelProps) {
  // Add new text overlay
  const handleAddText = () => {
    const newOverlay: TextOverlay = {
      id: `text_${Date.now()}`,
      text: 'VIBES',
      fontFamily: 'Bebas Neue',
      fontSize: 50,
      color: '#ffffff',
      opacity: 100,
      x: 50,
      y: 40,
      rotation: 0,
      blendMode: 'behind',
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 10,
    };
    onChangeTextOverlays([...textOverlays, newOverlay]);
    trackTextAdd(newOverlay.fontFamily, newOverlay.blendMode);
  };

  // Modify text overlay fields
  const handleUpdateText = (id: string, updates: Partial<TextOverlay>) => {
    onChangeTextOverlays(
      textOverlays.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  };

  // Remove text overlay
  const handleRemoveText = (id: string) => {
    onChangeTextOverlays(textOverlays.filter((o) => o.id !== id));
  };

  // File upload for transparent PNG cutout
  const handleCutoutUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      onChangeForegroundImage(img);
    };
    img.src = URL.createObjectURL(file);
  };

  const hasBehindText = textOverlays.some((o) => o.blendMode === 'behind');

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-neutral-400 font-display">
          Typography Layers
        </h3>
        <button
          onClick={handleAddText}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-all shadow-md shadow-violet-600/20 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Text
        </button>
      </div>

      {/* Empty State */}
      {textOverlays.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-2xl border border-dashed border-neutral-800 bg-[#07080b]/40">
          <Layers className="w-8 h-8 text-neutral-600 mb-3" />
          <p className="text-xs text-neutral-400 font-medium">No typography layers yet</p>
          <p className="text-[10px] text-neutral-500 mt-1 max-w-[200px]">
            Add bold text overlays to create visual depth and premium magazine cover styles.
          </p>
        </div>
      )}

      {/* Text Layers List */}
      {textOverlays.map((overlay, idx) => (
        <div
          key={overlay.id}
          className="flex flex-col gap-4 p-4 rounded-2xl bg-neutral-900/40 border border-neutral-900 relative"
        >
          {/* Badge & Trash Action */}
          <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-950/40 px-2 py-0.5 rounded-lg border border-violet-500/10">
              Layer #{idx + 1}
            </span>
            <button
              onClick={() => handleRemoveText(overlay.id)}
              className="text-neutral-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-neutral-900"
              title="Delete text layer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Text Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Text Content
            </label>
            <input
              type="text"
              value={overlay.text}
              onChange={(e) => handleUpdateText(overlay.id, { text: e.target.value })}
              className="w-full bg-[#07080b] border border-neutral-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3 py-2 text-sm text-white font-medium"
              placeholder="e.g. SUMMER"
            />
          </div>

          {/* Font Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Font Family
            </label>
            <select
              value={overlay.fontFamily}
              onChange={(e) => handleUpdateText(overlay.id, { fontFamily: e.target.value })}
              className="w-full bg-[#07080b] border border-neutral-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3 py-2 text-xs text-white font-semibold cursor-pointer"
            >
              {FONTS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Drag Instruction Tip */}
          <div className="text-[10px] text-violet-400 bg-violet-950/25 border border-violet-500/10 rounded-xl p-2.5 text-center font-medium">
            💡 Drag the text directly on the photo to position it.
          </div>

          {/* Sizing, Opacity, Rotation */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-neutral-500 font-bold uppercase">Size</span>
              <input
                type="range"
                min="10"
                max="200"
                value={overlay.fontSize}
                onChange={(e) => handleUpdateText(overlay.id, { fontSize: Number(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-neutral-500 font-bold uppercase">Opacity</span>
              <input
                type="range"
                min="0"
                max="100"
                value={overlay.opacity}
                onChange={(e) => handleUpdateText(overlay.id, { opacity: Number(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-neutral-500 font-bold uppercase">Rotation</span>
              <input
                type="range"
                min="-180"
                max="180"
                value={overlay.rotation}
                onChange={(e) => handleUpdateText(overlay.id, { rotation: Number(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>
          </div>

          {/* Color Chips */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-neutral-500 font-bold uppercase">Style & Color</span>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((preset) => {
                const isActive =
                  preset.gradient
                    ? overlay.gradientColors?.[0] === preset.gradient[0] &&
                      overlay.gradientColors?.[1] === preset.gradient[1]
                    : overlay.color === preset.color && !overlay.gradientColors;

                return (
                  <button
                    key={preset.name}
                    onClick={() => {
                      if (preset.gradient) {
                        handleUpdateText(overlay.id, {
                          color: '#ffffff',
                          gradientColors: preset.gradient,
                        });
                      } else {
                        handleUpdateText(overlay.id, {
                          color: preset.color,
                          gradientColors: undefined,
                        });
                      }
                    }}
                    className={`h-6 px-2.5 rounded-lg text-[9px] font-bold border transition-all ${
                      isActive
                        ? 'border-violet-400 ring-2 ring-violet-500/25 scale-105 text-white'
                        : 'border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                    style={{
                      background: preset.gradient
                        ? `linear-gradient(135deg, ${preset.gradient[0]}, ${preset.gradient[1]})`
                        : preset.color,
                      color: preset.color === '#ffffff' ? '#000000' : '#ffffff',
                    }}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Depth Mode (3D Text Effect) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-neutral-500 font-bold uppercase">Z-Depth Blend</span>
            <div className="grid grid-cols-2 gap-2 border border-neutral-900 bg-[#07080b] p-0.5 rounded-xl">
              <button
                onClick={() => handleUpdateText(overlay.id, { blendMode: 'above' })}
                className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                  overlay.blendMode === 'above'
                    ? 'bg-neutral-800 text-white shadow'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                In Front of Subject
              </button>
              <button
                onClick={() => handleUpdateText(overlay.id, { blendMode: 'behind' })}
                className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                  overlay.blendMode === 'behind'
                    ? 'bg-violet-600 text-white shadow shadow-violet-500/20'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Behind Subject (3D)
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* 2. Foreground Segmentation Section (Visible if any text is set to 'behind') */}
      {hasBehindText && (
        <div className="flex flex-col gap-4 border border-violet-500/10 bg-violet-950/5 p-4 rounded-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2 border-b border-violet-500/10 pb-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <h4 className="text-xs font-bold text-neutral-200">3D Depth Subject Options</h4>
          </div>

          {/* Method A: Upload Cutout PNG */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-neutral-400">Method A: Upload Cutout PNG</span>
            <p className="text-[10px] text-neutral-500 leading-normal">
              For professional results: hold down the subject on iOS/Android to copy it as a transparent PNG, and upload it here.
            </p>
            
            {foregroundImage ? (
              <div className="flex items-center justify-between bg-[#07080b] border border-neutral-800 px-3 py-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden">
                    <img
                      src={foregroundImage.src}
                      alt="Cutout Thumbnail"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-300 truncate max-w-[120px]">
                    cutout_subject.png
                  </span>
                </div>
                <button
                  onClick={() => onChangeForegroundImage(null)}
                  className="text-neutral-500 hover:text-red-400 p-1"
                  title="Remove cutout"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-4 px-4 rounded-xl border border-dashed border-neutral-800 bg-[#07080b]/50 hover:bg-[#07080b] cursor-pointer transition-colors group">
                <Upload className="w-5 h-5 text-neutral-500 group-hover:text-violet-400 mb-1.5" />
                <span className="text-[11px] font-semibold text-neutral-400 group-hover:text-white">
                  Upload Transparent Subject PNG
                </span>
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleCutoutUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="h-px bg-neutral-900 my-1"></div>

          {/* Method B: Painting Brush Mask */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-neutral-400">Method B: Manual Subject Brush</span>
            <p className="text-[10px] text-neutral-500 leading-normal">
              No cutout? Toggle the brush and paint directly over the subject on the canvas to bring it in front.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => onChangeBrushModeActive(!isBrushModeActive)}
                className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
                  isBrushModeActive
                    ? 'bg-violet-600 text-white shadow shadow-violet-500/20'
                    : 'bg-[#07080b] text-neutral-300 border border-neutral-800 hover:text-white hover:border-neutral-700'
                }`}
              >
                <Brush className="w-4 h-4" />
                {isBrushModeActive ? 'Disable Brush Tool' : 'Enable Brush Tool'}
              </button>

              {isBrushModeActive && (
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#07080b] border border-neutral-800 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center justify-between text-[10px] font-semibold">
                    <span className="text-neutral-400">Brush Size</span>
                    <span className="text-violet-400">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => onChangeBrushSize(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                </div>
              )}

              {hasMask && (
                <button
                  onClick={onClearMask}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-xl text-xs font-semibold text-red-400 bg-red-950/20 border border-red-500/10 hover:bg-red-950/30 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear Brushed Mask
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
