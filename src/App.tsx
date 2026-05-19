import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Crop,
  SlidersHorizontal,
  Download,
  RotateCcw,
  Layers,
  Upload,
  Split,
  Check,
  RefreshCw,
  Type,
} from 'lucide-react';
import { DEFAULT_ADJUSTMENTS } from './types';
import type { Adjustments, CropArea, CropAspectRatio, Preset, TextOverlay } from './types';
import { PRESETS } from './presets';
import { CROP_RATIOS } from './components/CropSelector';
import ImageUploader from './components/ImageUploader';
import PresetGallery from './components/PresetGallery';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropSelector from './components/CropSelector';
import EditorCanvas from './components/EditorCanvas';
import TextSettingsPanel from './components/TextSettingsPanel';
import { processImage } from './image-processor';

export default function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>('photo.jpg');

  // Adjustments & Cropping State
  const [manualAdjustments, setManualAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [presetStrength, setPresetStrength] = useState<number>(100);
  const [activeGuide, setActiveGuide] = useState<'none' | 'profile-circle' | 'story-ui'>('none');
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const [selectedCrop, setSelectedCrop] = useState<CropAspectRatio>(CROP_RATIOS[0]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('original');

  // UI Interactive States
  const [showCompareSplit, setShowCompareSplit] = useState(false);
  const [isCropModeActive, setIsCropModeActive] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [activeMobileTab, setActiveMobileTab] = useState<'presets' | 'adjustments' | 'crop' | 'text'>('presets');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'edits' | 'text'>('edits');
  const [exportSuccess, setExportSuccess] = useState(false);

  // 3D Text & Typography States
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [foregroundImage, setForegroundImage] = useState<HTMLImageElement | null>(null);
  const [isBrushModeActive, setIsBrushModeActive] = useState<boolean>(false);
  const [brushSize, setBrushSize] = useState<number>(30);
  const [hasMask, setHasMask] = useState<boolean>(false);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  if (!maskCanvasRef.current && typeof document !== 'undefined') {
    maskCanvasRef.current = document.createElement('canvas');
  }

  // Load Google Fonts dynamically for thumbnail layout titles
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Cinzel:wght@700&family=Montserrat:wght@700;800&family=Outfit:wght@700;800&family=Playfair+Display:ital,wght@1,700&display=swap';
    document.head.appendChild(link);
    return () => {
      try {
        document.head.removeChild(link);
      } catch (err) {}
    };
  }, []);

  // Compute combined adjustments to pass down to EditorCanvas and export rendering
  const getCombinedAdjustments = (): Adjustments => {
    const combined = { ...manualAdjustments };
    if (selectedPresetId !== 'original') {
      const preset = PRESETS.find((p) => p.id === selectedPresetId);
      if (preset) {
        const scale = presetStrength / 100;
        Object.entries(preset.adjustments).forEach(([k, val]) => {
          const key = k as keyof Adjustments;
          if (key !== 'borderType' && typeof val === 'number') {
            const baseVal = (manualAdjustments[key] as number) || 0;
            (combined as any)[key] = Math.max(-100, Math.min(100, baseVal + val * scale));
          }
        });
      }
    }
    return combined;
  };

  const adjustments = getCombinedAdjustments();

  // Load new image
  const handleImageSelected = (loadedImage: HTMLImageElement) => {
    setImage(loadedImage);
    setManualAdjustments(DEFAULT_ADJUSTMENTS);
    setPresetStrength(100);
    setActiveGuide('none');
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
    setSelectedCrop(CROP_RATIOS[0]);
    setSelectedPresetId('original');
    setShowCompareSplit(false);
    setIsCropModeActive(false);
    setExportSuccess(false);

    // Clear typography / mask layers
    setTextOverlays([]);
    setForegroundImage(null);
    setIsBrushModeActive(false);
    setHasMask(false);
    if (maskCanvasRef.current) {
      const maskCtx = maskCanvasRef.current.getContext('2d');
      maskCtx?.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    }

    // Get simple filename
    setFileName(`instatone_${Date.now()}`);
  };

  // Preset Selection
  const handleSelectPreset = (preset: Preset) => {
    setSelectedPresetId(preset.id);
    setPresetStrength(100); // Reset preset strength on change
    setManualAdjustments(DEFAULT_ADJUSTMENTS); // Reset manual tweaks so they can start fresh
  };

  // Change individual slider
  const handleChangeAdjustment = (key: keyof Adjustments, value: any) => {
    if (key === 'borderType') {
      setManualAdjustments((prev) => ({ ...prev, borderType: value }));
      return;
    }

    let presetVal = 0;
    if (selectedPresetId !== 'original') {
      const preset = PRESETS.find((p) => p.id === selectedPresetId);
      if (preset && preset.adjustments[key] !== undefined) {
        presetVal = preset.adjustments[key]!;
      }
    }

    const scale = presetStrength / 100;
    const manualVal = value - presetVal * scale;

    setManualAdjustments((prev) => ({
      ...prev,
      [key]: manualVal,
    }));
  };

  // Reset Adjustments
  const handleReset = () => {
    setManualAdjustments(DEFAULT_ADJUSTMENTS);
    setPresetStrength(100);
    setActiveGuide('none');
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
    setSelectedCrop(CROP_RATIOS[0]);
    setSelectedPresetId('original');
    setShowCompareSplit(false);
    setIsCropModeActive(false);

    // Clear typography / mask layers
    setTextOverlays([]);
    setForegroundImage(null);
    setIsBrushModeActive(false);
    setHasMask(false);
    if (maskCanvasRef.current) {
      const maskCtx = maskCanvasRef.current.getContext('2d');
      maskCtx?.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    }
  };

  const handleMaskUpdated = () => {
    setHasMask(true);
    setManualAdjustments((prev) => ({ ...prev }));
  };

  // Crop Ratio change (Calculates starting centered frame)
  const handleSelectCrop = (crop: CropAspectRatio) => {
    setSelectedCrop(crop);
    if (crop.value === null) {
      setCropArea({ x: 0, y: 0, width: 100, height: 100 });
    } else if (image) {
      const imgRatio = image.naturalWidth / image.naturalHeight;
      const targetRatio = crop.value;

      let cropW = 100;
      let cropH = 100;

      if (targetRatio > imgRatio) {
        // Target is wider than image, fit width and compress height
        cropW = 100;
        cropH = (imgRatio / targetRatio) * 100;
      } else {
        // Target is taller than image, fit height and compress width
        cropH = 100;
        cropW = (targetRatio / imgRatio) * 100;
      }

      const cropX = (100 - cropW) / 2;
      const cropY = (100 - cropH) / 2;

      setCropArea({
        x: cropX,
        y: cropY,
        width: cropW,
        height: cropH,
      });
    }
  };

  // High-Resolution Export Execution
  const handleExport = () => {
    if (!image) return;
    setExporting(true);
    setExportSuccess(false);

    // Delay slightly to show processing loader
    setTimeout(() => {
      try {
        const exportCanvas = document.createElement('canvas');
        processImage(
          image,
          exportCanvas,
          adjustments,
          cropArea,
          undefined,
          textOverlays,
          foregroundImage,
          maskCanvasRef.current
        );

        const link = document.createElement('a');
        const fileExt = exportFormat === 'jpeg' ? 'jpg' : 'png';
        link.download = `${fileName}_edit.${fileExt}`;

        if (exportFormat === 'jpeg') {
          link.href = exportCanvas.toDataURL('image/jpeg', 0.95);
        } else {
          link.href = exportCanvas.toDataURL('image/png');
        }

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 4000);
      } catch (err) {
        console.error('Export failed:', err);
      } finally {
        setExporting(false);
      }
    }, 800);
  };

  return (
    <div className="flex flex-col h-screen bg-[#07080b] text-neutral-100 antialiased overflow-hidden">
      {/* 1. Header */}
      <header className="sticky top-0 flex items-center justify-between px-6 py-4 bg-[#0c0d13]/90 backdrop-blur border-b border-neutral-900 z-50 shadow-md shadow-black/25">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white font-display flex items-center gap-1.5 leading-none">
              InstaTone <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full font-sans font-medium">Studio</span>
            </h1>
            <p className="text-[10px] text-neutral-500 font-sans mt-0.5">High-quality visual creator</p>
          </div>
        </div>

        {image && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleImageSelected(null as any)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New Photo</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all"
              title="Reset all adjustments"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* 2. Main Content Grid */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {image ? (
          <>
            {/* Left/Center Preview Pane */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[#07080b] overflow-y-auto">
              
              {/* Toolbar above canvas */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 mb-4 bg-[#0c0d13]/80 backdrop-blur border border-neutral-900 px-3.5 py-2 rounded-2xl max-w-full shadow-lg">
                <button
                  onClick={() => setIsCropModeActive(!isCropModeActive)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isCropModeActive
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Crop className="w-3.5 h-3.5" />
                  {isCropModeActive ? 'Apply Crop' : 'Adjust Crop'}
                </button>

                {!isCropModeActive && (
                  <button
                    onClick={() => setShowCompareSplit(!showCompareSplit)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      showCompareSplit
                        ? 'bg-violet-600/25 text-violet-400 border border-violet-500/25'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <Split className="w-3.5 h-3.5" />
                    Compare
                  </button>
                )}

                {!isCropModeActive && (
                  <div className="h-4 w-px bg-neutral-800"></div>
                )}

                {!isCropModeActive && (
                  <div className="flex items-center border border-neutral-800 bg-[#07080b]/80 p-0.5 rounded-xl">
                    <button
                      onClick={() => setActiveGuide('none')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                        activeGuide === 'none'
                          ? 'bg-neutral-800 text-white shadow'
                          : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      No Guide
                    </button>
                    <button
                      onClick={() => setActiveGuide('profile-circle')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                        activeGuide === 'profile-circle'
                          ? 'bg-violet-600 text-white shadow shadow-violet-500/20'
                          : 'text-neutral-500 hover:text-white'
                      }`}
                      title="Circular Profile Picture boundaries"
                    >
                      Avatar Circle
                    </button>
                    <button
                      onClick={() => setActiveGuide('story-ui')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                        activeGuide === 'story-ui'
                          ? 'bg-violet-600 text-white shadow shadow-violet-500/20'
                          : 'text-neutral-500 hover:text-white'
                      }`}
                      title="Instagram Story Text Safe Zones"
                    >
                      Story Safe Area
                    </button>
                  </div>
                )}
              </div>

              {/* Canvas Preview Area */}
              <div className="w-full flex items-center justify-center flex-1 max-h-[55vh] lg:max-h-[70vh]">
                <EditorCanvas
                  image={image}
                  adjustments={adjustments}
                  cropArea={cropArea}
                  selectedCrop={selectedCrop}
                  showCompareSplit={showCompareSplit}
                  isCropModeActive={isCropModeActive}
                  activeGuide={activeGuide}
                  onCropAreaChange={setCropArea}
                  textOverlays={textOverlays}
                  onChangeTextOverlays={setTextOverlays}
                  foregroundImage={foregroundImage}
                  maskCanvasRef={maskCanvasRef}
                  isBrushModeActive={isBrushModeActive}
                  brushSize={brushSize}
                  onMaskUpdated={handleMaskUpdated}
                />
              </div>

              {/* Instructions inside preview */}
              <div className="mt-4 text-center">
                {isCropModeActive ? (
                  <p className="text-xs text-violet-300 font-medium animate-pulse">
                    Drag the crop box edges to resize. Drag center to reposition. Click 'Apply Crop' when done.
                  </p>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                    <p className="text-[11px] text-neutral-500">
                      Real-time GPU-accelerated editing sandbox
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Control Sidebar (Desktop) */}
            <aside className="hidden lg:flex flex-col w-96 bg-[#0c0d13] border-l border-neutral-900 h-full overflow-hidden">
              {/* Desktop Sidebar Tab Switcher */}
              <div className="flex border-b border-neutral-900 p-2 gap-1 bg-[#090a0f] shrink-0">
                <button
                  onClick={() => {
                    setActiveSidebarTab('edits');
                    setIsBrushModeActive(false); // Turn off brush when switching tabs
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    activeSidebarTab === 'edits'
                      ? 'bg-neutral-900 text-white border border-neutral-800'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters & Crop
                </button>
                <button
                  onClick={() => setActiveSidebarTab('text')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    activeSidebarTab === 'text'
                      ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Text & Titles
                </button>
              </div>

              {/* Scrollable Adjustments & Presets panel */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin">
                {activeSidebarTab === 'edits' ? (
                  <>
                    {/* 1. Presets section */}
                    <PresetGallery
                      selectedPresetId={selectedPresetId}
                      onSelectPreset={handleSelectPreset}
                      presetStrength={presetStrength}
                      onChangePresetStrength={setPresetStrength}
                    />

                    <hr className="border-neutral-900" />

                    {/* 2. Crop Ratios */}
                    <CropSelector
                      selectedCropId={selectedCrop.id}
                      onSelectCrop={(crop) => {
                        handleSelectCrop(crop);
                        if (crop.id !== 'original') {
                          setIsCropModeActive(true); // Automatically enter crop mode to adjust crop frame
                        } else {
                          setIsCropModeActive(false);
                        }
                      }}
                    />

                    <hr className="border-neutral-900" />

                    {/* 3. Manual adjustments */}
                    <AdjustmentPanel
                      adjustments={adjustments}
                      onChangeAdjustment={handleChangeAdjustment}
                      onResetAdjustments={() => setManualAdjustments(DEFAULT_ADJUSTMENTS)}
                    />
                  </>
                ) : (
                  <TextSettingsPanel
                    textOverlays={textOverlays}
                    onChangeTextOverlays={setTextOverlays}
                    foregroundImage={foregroundImage}
                    onChangeForegroundImage={setForegroundImage}
                    isBrushModeActive={isBrushModeActive}
                    onChangeBrushModeActive={setIsBrushModeActive}
                    brushSize={brushSize}
                    onChangeBrushSize={setBrushSize}
                    onClearMask={() => {
                      const mask = maskCanvasRef.current;
                      if (mask) {
                        const ctx = mask.getContext('2d');
                        ctx?.clearRect(0, 0, mask.width, mask.height);
                      }
                      setHasMask(false);
                      setManualAdjustments((prev) => ({ ...prev }));
                    }}
                    hasMask={hasMask}
                  />
                )}
              </div>

              {/* Sticky Export CTA Box at bottom of the panel */}
              <div className="border-t border-neutral-900 bg-[#0c0d13]/95 backdrop-blur p-6 sticky bottom-0 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
                {/* 4. Export Box */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase font-display">Export Settings</span>
                    <div className="flex border border-neutral-800 bg-[#07080b] p-0.5 rounded-lg">
                      <button
                        onClick={() => setExportFormat('jpeg')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          exportFormat === 'jpeg' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        JPEG
                      </button>
                      <button
                        onClick={() => setExportFormat('png')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          exportFormat === 'png' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        PNG
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white py-3 px-4 rounded-2xl font-semibold shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
                  >
                    {exporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing HQ Render...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export Photo
                      </>
                    )}
                  </button>

                  {exportSuccess && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-xl text-center font-medium animate-in fade-in zoom-in duration-200">
                      <Check className="w-4 h-4" />
                      Visual successfully saved to downloads folder!
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Mobile Bottom Navigation & Controls */}
            <div className="lg:hidden w-full bg-[#0c0d13] border-t border-neutral-900 flex flex-col z-20">
              
              {/* Dynamic Toolbar depending on mobile tab */}
              <div className="p-4 max-h-[35vh] overflow-y-auto border-b border-neutral-900">
                {activeMobileTab === 'presets' && (
                  <PresetGallery
                    selectedPresetId={selectedPresetId}
                    onSelectPreset={handleSelectPreset}
                    presetStrength={presetStrength}
                    onChangePresetStrength={setPresetStrength}
                  />
                )}

                {activeMobileTab === 'crop' && (
                  <div className="flex flex-col gap-4">
                    <CropSelector
                      selectedCropId={selectedCrop.id}
                      onSelectCrop={(crop) => {
                        handleSelectCrop(crop);
                        if (crop.id !== 'original') {
                          setIsCropModeActive(true);
                        } else {
                          setIsCropModeActive(false);
                        }
                      }}
                    />
                    <button
                      onClick={() => setIsCropModeActive(!isCropModeActive)}
                      className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
                        isCropModeActive
                          ? 'bg-violet-600 text-white shadow-lg'
                          : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                      }`}
                    >
                      <Crop className="w-4 h-4" />
                      {isCropModeActive ? 'Confirm/Apply Crop' : 'Adjust Crop Area'}
                    </button>
                  </div>
                )}

                {activeMobileTab === 'adjustments' && (
                  <AdjustmentPanel
                    adjustments={adjustments}
                    onChangeAdjustment={handleChangeAdjustment}
                    onResetAdjustments={() => setManualAdjustments(DEFAULT_ADJUSTMENTS)}
                  />
                )}

                {activeMobileTab === 'text' && (
                  <TextSettingsPanel
                    textOverlays={textOverlays}
                    onChangeTextOverlays={setTextOverlays}
                    foregroundImage={foregroundImage}
                    onChangeForegroundImage={setForegroundImage}
                    isBrushModeActive={isBrushModeActive}
                    onChangeBrushModeActive={setIsBrushModeActive}
                    brushSize={brushSize}
                    onChangeBrushSize={setBrushSize}
                    onClearMask={() => {
                      const mask = maskCanvasRef.current;
                      if (mask) {
                        const ctx = mask.getContext('2d');
                        ctx?.clearRect(0, 0, mask.width, mask.height);
                      }
                      setHasMask(false);
                      setManualAdjustments((prev) => ({ ...prev }));
                    }}
                    hasMask={hasMask}
                  />
                )}
              </div>

              {/* Mobile Actions Tab bar */}
              <div className="grid grid-cols-5 items-center bg-[#090a0f] py-2 border-t border-neutral-950">
                <button
                  onClick={() => {
                    setActiveMobileTab('presets');
                    setIsCropModeActive(false);
                    setIsBrushModeActive(false);
                  }}
                  className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold ${
                    activeMobileTab === 'presets' ? 'text-violet-400' : 'text-neutral-500'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                  Presets
                </button>

                <button
                  onClick={() => {
                    setActiveMobileTab('adjustments');
                    setIsCropModeActive(false);
                    setIsBrushModeActive(false);
                  }}
                  className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold ${
                    activeMobileTab === 'adjustments' ? 'text-violet-400' : 'text-neutral-500'
                  }`}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  Sliders
                </button>

                <button
                  onClick={() => {
                    setActiveMobileTab('crop');
                    setIsBrushModeActive(false);
                  }}
                  className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold ${
                    activeMobileTab === 'crop' ? 'text-violet-400' : 'text-neutral-500'
                  }`}
                >
                  <Crop className="w-5 h-5" />
                  Crop
                </button>

                <button
                  onClick={() => {
                    setActiveMobileTab('text');
                    setIsCropModeActive(false);
                  }}
                  className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold ${
                    activeMobileTab === 'text' ? 'text-violet-400' : 'text-neutral-500'
                  }`}
                >
                  <Type className="w-5 h-5" />
                  Text
                </button>

                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex flex-col items-center gap-1 py-1 text-[10px] font-bold text-violet-400 active:scale-95 disabled:opacity-50"
                >
                  {exporting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  Export
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Landing Page: Drag & Drop upload container */
          <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
            <div className="text-center mb-8 max-w-md animate-in fade-in duration-300">
              <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3 font-display bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
                Create Professional Social Media Visuals
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Unlock Lightroom-quality presets and premium filters instantly. No accounts, no paywalls, completely secure local processing.
              </p>
            </div>

            <ImageUploader onImageSelected={handleImageSelected} />

            {/* Quick Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mt-12 px-4 w-full">
              <div className="p-5 rounded-2xl bg-neutral-900/30 border border-neutral-900 text-left flex items-start gap-4">
                <div className="p-2 bg-violet-600/10 text-violet-400 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-display">
                    Insta Filters
                  </h4>
                  <p className="text-neutral-500 text-[11px] leading-relaxed">
                    10 original aesthetics inspired by modern photographers and creators.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/30 border border-neutral-900 text-left flex items-start gap-4">
                <div className="p-2 bg-fuchsia-600/10 text-fuchsia-400 rounded-lg">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-display">
                    Manual Sliders
                  </h4>
                  <p className="text-neutral-500 text-[11px] leading-relaxed">
                    Tune exposure, temperature, highlights, matte fade, and authentic film grain.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/30 border border-neutral-900 text-left flex items-start gap-4">
                <div className="p-2 bg-emerald-600/10 text-emerald-400 rounded-lg">
                  <Crop className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-display">
                    Crop & Aspect Ratios
                  </h4>
                  <p className="text-neutral-500 text-[11px] leading-relaxed">
                    Instant 1:1, 4:5, and 9:16 frames tailored perfectly for post layouts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
