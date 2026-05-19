import React, { useRef, useEffect, useState } from 'react';
import type { Adjustments, CropArea, CropAspectRatio, TextOverlay } from '../types';
import { processImage } from '../image-processor';
import { Move, GripHorizontal } from 'lucide-react';
import CreatorGuides from './CreatorGuides';

interface EditorCanvasProps {
  image: HTMLImageElement;
  adjustments: Adjustments;
  cropArea: CropArea;
  selectedCrop: CropAspectRatio;
  showCompareSplit: boolean;
  isCropModeActive: boolean;
  activeGuide: 'none' | 'profile-circle' | 'story-ui';
  onCropAreaChange: (area: CropArea) => void;
  textOverlays: TextOverlay[];
  onChangeTextOverlays: (overlays: TextOverlay[]) => void;
  foregroundImage: HTMLImageElement | null;
  maskCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  isBrushModeActive: boolean;
  brushSize: number;
  onMaskUpdated: () => void;
}

export default function EditorCanvas({
  image,
  adjustments,
  cropArea,
  selectedCrop,
  showCompareSplit,
  isCropModeActive,
  activeGuide,
  onCropAreaChange,
  textOverlays,
  onChangeTextOverlays,
  foregroundImage,
  maskCanvasRef,
  isBrushModeActive,
  brushSize,
  onMaskUpdated,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);

  // Screen display rectangle of the canvas
  const [canvasRect, setCanvasRect] = useState({ width: 0, height: 0, left: 0, top: 0 });
  const [dividerX, setDividerX] = useState(50); // percentage (0 - 100)
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);

  // Crop drag state
  const [isDraggingCropBox, setIsDraggingCropBox] = useState(false);

  // Text Overlay Direct Dragging States
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [hoveredTextId, setHoveredTextId] = useState<string | null>(null);
  const [activeDraggingTextId, setActiveDraggingTextId] = useState<string | null>(null);
  const [activeDragMode, setActiveDragMode] = useState<'move' | 'resize' | 'rotate' | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<'rotate' | 'corner' | null>(null);
  const dragStartTextRef = useRef<{ initialFontSize: number; initialDist: number } | null>(null);

  const getOverlayAtPoint = (cx: number, cy: number): TextOverlay | null => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return null;

    const dw = canvas.width;
    const dh = canvas.height;

    let tx = 0;
    let ty = 0;
    let tw = dw;
    let th = dh;

    if (adjustments.borderType === 'white-fit') {
      const margin = Math.round(Math.min(dw, dh) * 0.05);
      tx = margin;
      ty = margin;
      tw = dw - margin * 2;
      th = dh - margin * 2;
    } else if (adjustments.borderType === 'polaroid') {
      const borderSize = Math.round(Math.min(dw, dh) * 0.06);
      const bottomBorder = Math.round(Math.min(dw, dh) * 0.21);
      tx = borderSize;
      ty = borderSize;
      tw = dw - borderSize * 2;
      th = dh - borderSize - bottomBorder;
    }

    // Go backwards (drawn last is on top)
    for (let i = textOverlays.length - 1; i >= 0; i--) {
      const o = textOverlays[i];
      const ox = tx + (o.x / 100) * tw;
      const oy = ty + (o.y / 100) * th;
      const fontSizePx = Math.max(10, Math.round((o.fontSize / 100) * th));
      
      const charWidthFactor = o.fontFamily === 'Bebas Neue' || o.fontFamily === 'Anton' ? 0.45 : 0.6;
      const w = Math.max(60, o.text.length * fontSizePx * charWidthFactor);
      const h = Math.max(35, fontSizePx);

      // Rotated bounding check
      const rad = -(o.rotation * Math.PI) / 180;
      const dx = cx - ox;
      const dy = cy - oy;
      const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

      if (Math.abs(rx) < w / 2 && Math.abs(ry) < h / 2) {
        return o;
      }
    }

    return null;
  };

  const getHandleAtPoint = (o: TextOverlay, cx: number, cy: number): 'rotate' | 'corner' | null => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return null;
    
    const dw = canvas.width;
    const dh = canvas.height;

    let tx = 0;
    let ty = 0;
    let tw = dw;
    let th = dh;

    if (adjustments.borderType === 'white-fit') {
      const margin = Math.round(Math.min(dw, dh) * 0.05);
      tx = margin;
      ty = margin;
      tw = dw - margin * 2;
      th = dh - margin * 2;
    } else if (adjustments.borderType === 'polaroid') {
      const borderSize = Math.round(Math.min(dw, dh) * 0.06);
      const bottomBorder = Math.round(Math.min(dw, dh) * 0.21);
      tx = borderSize;
      ty = borderSize;
      tw = dw - borderSize * 2;
      th = dh - borderSize - bottomBorder;
    }

    const ox = tx + (o.x / 100) * tw;
    const oy = ty + (o.y / 100) * th;
    const fontSizePx = Math.max(10, Math.round((o.fontSize / 100) * th));
    
    const charWidthFactor = o.fontFamily === 'Bebas Neue' || o.fontFamily === 'Anton' ? 0.45 : 0.6;
    const w = Math.max(60, o.text.length * fontSizePx * charWidthFactor) + 12;
    const h = Math.max(35, fontSizePx) + 12;

    // Transform pointer to text local coordinate
    const rad = -(o.rotation * Math.PI) / 180;
    const dx = cx - ox;
    const dy = cy - oy;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);

    // Hit area radius (12 pixels around handle)
    const hitRadius = 12;

    // Check rotation handle (top center)
    if (Math.abs(lx - 0) < hitRadius && Math.abs(ly - (-h / 2 - 20)) < hitRadius) {
      return 'rotate';
    }

    // Check corners
    const corners = [
      { x: -w / 2, y: -h / 2 },
      { x: w / 2, y: -h / 2 },
      { x: -w / 2, y: h / 2 },
      { x: w / 2, y: h / 2 },
    ];

    for (const corner of corners) {
      if (Math.abs(lx - corner.x) < hitRadius && Math.abs(ly - corner.y) < hitRadius) {
        return 'corner';
      }
    }

    return null;
  };

  // Brush drawing state
  const [isDrawingMask, setIsDrawingMask] = useState(false);
  const [brushPos, setBrushPos] = useState<{ x: number; y: number } | null>(null);

  const drawMaskStroke = (clientX: number, clientY: number) => {
    const canvas = displayCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    // Track brush position relative to canvas
    setBrushPos({ x: clientX - rect.left, y: clientY - rect.top });

    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Scale brush size to canvas internal coordinates
    const scaleFactor = canvas.width / rect.width;
    const radius = brushSize * scaleFactor;

    maskCtx.save();
    maskCtx.fillStyle = '#ffffff';
    maskCtx.globalCompositeOperation = 'source-over';

    maskCtx.beginPath();
    maskCtx.arc(x, y, radius, 0, Math.PI * 2);
    maskCtx.fill();
    maskCtx.restore();

    onMaskUpdated();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const cy = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (isBrushModeActive) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {}
      setIsDrawingMask(true);
      drawMaskStroke(e.clientX, e.clientY);
      return;
    }

    // 1. Check if we clicked on any handle of the currently SELECTED overlay
    if (selectedTextId) {
      const activeText = textOverlays.find(o => o.id === selectedTextId);
      if (activeText) {
        const handle = getHandleAtPoint(activeText, cx, cy);
        if (handle) {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch (err) {}
          setActiveDraggingTextId(activeText.id);
          setActiveDragMode(handle === 'rotate' ? 'rotate' : 'resize');
          
          // Calculate initial values for resizing
          const dw = canvas.width;
          const dh = canvas.height;
          let tx = 0, ty = 0, tw = dw, th = dh;
          if (adjustments.borderType === 'white-fit') {
            const margin = Math.round(Math.min(dw, dh) * 0.05);
            tx = margin; ty = margin; tw = dw - margin * 2; th = dh - margin * 2;
          } else if (adjustments.borderType === 'polaroid') {
            const borderSize = Math.round(Math.min(dw, dh) * 0.06);
            const bottomBorder = Math.round(Math.min(dw, dh) * 0.21);
            tx = borderSize; ty = borderSize; tw = dw - borderSize * 2; th = dh - borderSize - bottomBorder;
          }
          const ox = tx + (activeText.x / 100) * tw;
          const oy = ty + (activeText.y / 100) * th;

          const dx = cx - ox;
          const dy = cy - oy;
          const initialDist = Math.sqrt(dx * dx + dy * dy);
          
          dragStartTextRef.current = {
            initialFontSize: activeText.fontSize,
            initialDist: Math.max(10, initialDist), // prevent division by zero
          };
          return;
        }
      }
    }

    // 2. Otherwise, check if we clicked on any text body to move it
    const overlay = getOverlayAtPoint(cx, cy);
    if (overlay) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {}
      setSelectedTextId(overlay.id);
      setActiveDraggingTextId(overlay.id);
      setActiveDragMode('move');
    } else {
      setSelectedTextId(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const cy = ((e.clientY - rect.top) / rect.height) * canvas.height;

    setBrushPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (isBrushModeActive) {
      if (isDrawingMask) {
        drawMaskStroke(e.clientX, e.clientY);
      }
      return;
    }

    const dw = canvas.width;
    const dh = canvas.height;

    let tx = 0;
    let ty = 0;
    let tw = dw;
    let th = dh;

    if (adjustments.borderType === 'white-fit') {
      const margin = Math.round(Math.min(dw, dh) * 0.05);
      tx = margin;
      ty = margin;
      tw = dw - margin * 2;
      th = dh - margin * 2;
    } else if (adjustments.borderType === 'polaroid') {
      const borderSize = Math.round(Math.min(dw, dh) * 0.06);
      const bottomBorder = Math.round(Math.min(dw, dh) * 0.21);
      tx = borderSize;
      ty = borderSize;
      tw = dw - borderSize * 2;
      th = dh - borderSize - bottomBorder;
    }

    // Handle dragging
    if (activeDraggingTextId && activeDragMode) {
      const activeText = textOverlays.find((o) => o.id === activeDraggingTextId);
      if (!activeText) return;

      const ox = tx + (activeText.x / 100) * tw;
      const oy = ty + (activeText.y / 100) * th;

      if (activeDragMode === 'move') {
        const newX = Math.max(-20, Math.min(120, ((cx - tx) / tw) * 100));
        const newY = Math.max(-20, Math.min(120, ((cy - ty) / th) * 100));

        onChangeTextOverlays(
          textOverlays.map((o) => (o.id === activeDraggingTextId ? { ...o, x: newX, y: newY } : o))
        );
      } else if (activeDragMode === 'resize' && dragStartTextRef.current) {
        const dx = cx - ox;
        const dy = cy - oy;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        const scale = currentDist / dragStartTextRef.current.initialDist;
        
        // Scale font size based on distance ratio
        const newFontSize = Math.max(10, Math.min(200, Math.round(dragStartTextRef.current.initialFontSize * scale)));
        onChangeTextOverlays(
          textOverlays.map((o) => (o.id === activeDraggingTextId ? { ...o, fontSize: newFontSize } : o))
        );
      } else if (activeDragMode === 'rotate') {
        const angleRad = Math.atan2(cy - oy, cx - ox);
        // Angle is relative to top center handle (-90 degrees, i.e. -Math.PI / 2)
        let newRotation = Math.round(((angleRad + Math.PI / 2) * 180) / Math.PI);
        
        // Normalize to [-180, 180]
        if (newRotation > 180) newRotation -= 360;
        if (newRotation < -180) newRotation += 360;

        onChangeTextOverlays(
          textOverlays.map((o) => (o.id === activeDraggingTextId ? { ...o, rotation: newRotation } : o))
        );
      }
    } else {
      // We are NOT dragging

      // A. Check if hovering over handles of the selected text
      if (selectedTextId) {
        const selectedText = textOverlays.find(o => o.id === selectedTextId);
        if (selectedText) {
          const handle = getHandleAtPoint(selectedText, cx, cy);
          if (handle) {
            setHoveredTextId(selectedTextId);
            setHoveredHandle(handle);
            return;
          }
        }
      }

      // B. Check if hovering over the body of any text layer
      const overlay = getOverlayAtPoint(cx, cy);
      if (overlay) {
        setHoveredTextId(overlay.id);
        setHoveredHandle(null);
      } else {
        setHoveredTextId(null);
        setHoveredHandle(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isBrushModeActive) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
      setIsDrawingMask(false);
      return;
    }

    if (activeDraggingTextId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
      setActiveDraggingTextId(null);
      setActiveDragMode(null);
      dragStartTextRef.current = null;
    }
  };

  const handlePointerLeave = () => {
    setBrushPos(null);
    setIsDrawingMask(false);
    setHoveredTextId(null);
    setHoveredHandle(null);
  };
  const [activeCropHandle, setActiveCropHandle] = useState<string | null>(null); // 'tl', 'tr', 'bl', 'br'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, boxX: 0, boxY: 0, boxW: 0, boxH: 0 });

  // Update canvas on-screen size details
  const updateCanvasRect = () => {
    const canvas = displayCanvasRef.current;
    if (canvas) {
      setCanvasRect({
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        left: canvas.offsetLeft,
        top: canvas.offsetTop,
      });
    }
  };

  // Run image processing & display rendering
  useEffect(() => {
    const displayCanvas = displayCanvasRef.current;
    const processedCanvas = processedCanvasRef.current;
    if (!displayCanvas || !processedCanvas || !image) return;

    // A. Preview image dimensions (max 1000px for ultra-fast rendering)
    const maxDims = { width: 1000, height: 1000 };

    if (isCropModeActive) {
      // In crop mode, we render the FULL image with adjustments,
      // and overlay the crop bounding box.
      const fullCropArea: CropArea = { x: 0, y: 0, width: 100, height: 100 };
      processImage(image, processedCanvas, adjustments, fullCropArea, maxDims);
    } else {
      // In editor mode, we render the CROPPED image with adjustments.
      processImage(
        image,
        processedCanvas,
        adjustments,
        cropArea,
        maxDims,
        textOverlays,
        foregroundImage,
        maskCanvasRef.current
      );
    }

    // Ensure maskCanvas dimensions align with processedCanvas
    const maskCanvas = maskCanvasRef.current;
    if (maskCanvas && (maskCanvas.width !== processedCanvas.width || maskCanvas.height !== processedCanvas.height)) {
      maskCanvas.width = processedCanvas.width;
      maskCanvas.height = processedCanvas.height;
    }

    // Update display canvas size to match processed canvas
    displayCanvas.width = processedCanvas.width;
    displayCanvas.height = processedCanvas.height;

    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;

    // Render logic based on mode
    if (isCropModeActive) {
      // Draw the adjusted full image
      ctx.drawImage(processedCanvas, 0, 0);
    } else if (showCompareSplit) {
      // Split Comparison Mode
      const dividerPixelX = (dividerX / 100) * displayCanvas.width;

      // 1. Draw original unadjusted cropped image first
      const originalCanvas = document.createElement('canvas');
      const originalAdjustments: Adjustments = {
        brightness: 0, contrast: 0, saturation: 0, warmth: 0,
        highlights: 0, shadows: 0, sharpness: 0, vignette: 0, grain: 0, fade: 0,
        borderType: 'none'
      };
      processImage(image, originalCanvas, originalAdjustments, cropArea, maxDims);

      ctx.drawImage(originalCanvas, 0, 0);

      // 2. Draw edited image on the right side of the divider with clipping
      ctx.save();
      ctx.beginPath();
      ctx.rect(dividerPixelX, 0, displayCanvas.width - dividerPixelX, displayCanvas.height);
      ctx.clip();
      ctx.drawImage(processedCanvas, 0, 0);
      ctx.restore();
    } else {
      // Normal Mode
      ctx.drawImage(processedCanvas, 0, 0);
    }

    // Render Selection Outline & Handles
    if (!isCropModeActive && !isBrushModeActive) {
      // 1. Draw a thin hover outline for any text that is hovered but NOT selected
      if (hoveredTextId && hoveredTextId !== selectedTextId) {
        const hoveredText = textOverlays.find(o => o.id === hoveredTextId);
        if (hoveredText) {
          let tx = 0, ty = 0, tw = displayCanvas.width, th = displayCanvas.height;
          if (adjustments.borderType === 'white-fit') {
            const margin = Math.round(Math.min(tw, th) * 0.05);
            tx = margin; ty = margin; tw = tw - margin * 2; th = th - margin * 2;
          } else if (adjustments.borderType === 'polaroid') {
            const borderSize = Math.round(Math.min(tw, th) * 0.06);
            const bottomBorder = Math.round(Math.min(tw, th) * 0.21);
            tx = borderSize; ty = borderSize; tw = tw - borderSize * 2; th = th - borderSize - bottomBorder;
          }
          const ox = tx + (hoveredText.x / 100) * tw;
          const oy = ty + (hoveredText.y / 100) * th;
          const fontSizePx = Math.max(10, Math.round((hoveredText.fontSize / 100) * th));
          const charWidthFactor = hoveredText.fontFamily === 'Bebas Neue' || hoveredText.fontFamily === 'Anton' ? 0.45 : 0.6;
          const w = Math.max(60, hoveredText.text.length * fontSizePx * charWidthFactor) + 12;
          const h = Math.max(35, fontSizePx) + 12;

          ctx.save();
          ctx.translate(ox, oy);
          ctx.rotate((hoveredText.rotation * Math.PI) / 180);
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)'; // Violet-400, semi-transparent
          ctx.lineWidth = Math.max(1.0, Math.round(fontSizePx * 0.01));
          ctx.strokeRect(-w / 2, -h / 2, w, h);
          ctx.restore();
        }
      }

      // 2. Draw the full active selection box & handles for the selected overlay
      if (selectedTextId) {
        const selectedText = textOverlays.find(o => o.id === selectedTextId);
        if (selectedText) {
          let tx = 0, ty = 0, tw = displayCanvas.width, th = displayCanvas.height;
          if (adjustments.borderType === 'white-fit') {
            const margin = Math.round(Math.min(tw, th) * 0.05);
            tx = margin; ty = margin; tw = tw - margin * 2; th = th - margin * 2;
          } else if (adjustments.borderType === 'polaroid') {
            const borderSize = Math.round(Math.min(tw, th) * 0.06);
            const bottomBorder = Math.round(Math.min(tw, th) * 0.21);
            tx = borderSize; ty = borderSize; tw = tw - borderSize * 2; th = th - borderSize - bottomBorder;
          }
          const ox = tx + (selectedText.x / 100) * tw;
          const oy = ty + (selectedText.y / 100) * th;
          const fontSizePx = Math.max(10, Math.round((selectedText.fontSize / 100) * th));
          const charWidthFactor = selectedText.fontFamily === 'Bebas Neue' || selectedText.fontFamily === 'Anton' ? 0.45 : 0.6;
          const w = Math.max(60, selectedText.text.length * fontSizePx * charWidthFactor) + 12;
          const h = Math.max(35, fontSizePx) + 12;

          ctx.save();
          ctx.translate(ox, oy);
          ctx.rotate((selectedText.rotation * Math.PI) / 180);

          // Draw dotted selection box
          ctx.strokeStyle = '#c084fc'; // Light purple/violet border
          ctx.lineWidth = Math.max(1.5, Math.round(fontSizePx * 0.015));
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(-w / 2, -h / 2, w, h);

          // Draw rotation stick
          ctx.beginPath();
          ctx.moveTo(0, -h / 2);
          ctx.lineTo(0, -h / 2 - 20);
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = Math.max(1.2, Math.round(fontSizePx * 0.012));
          ctx.setLineDash([]);
          ctx.stroke();

          // Draw rotation handle
          ctx.beginPath();
          ctx.arc(0, -h / 2 - 20, 6, 0, Math.PI * 2);
          ctx.fillStyle = hoveredHandle === 'rotate' || (activeDraggingTextId === selectedText.id && activeDragMode === 'rotate') ? '#a78bfa' : '#8b5cf6';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.fill();
          ctx.stroke();

          // Draw corner handles
          const drawCorner = (cx: number, cy: number) => {
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fillStyle = hoveredHandle === 'corner' && activeDraggingTextId === selectedText.id && activeDragMode === 'resize' ? '#a78bfa' : '#8b5cf6';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.fill();
            ctx.stroke();
          };
          drawCorner(-w / 2, -h / 2);
          drawCorner(w / 2, -h / 2);
          drawCorner(-w / 2, h / 2);
          drawCorner(w / 2, h / 2);

          ctx.restore();
        }
      }
    }

    // Ensure layout is updated
    updateCanvasRect();
  }, [image, adjustments, cropArea, isCropModeActive, showCompareSplit, dividerX, textOverlays, hoveredTextId, activeDraggingTextId, hoveredHandle, activeDragMode, selectedTextId]);

  // Handle window resizing
  useEffect(() => {
    window.addEventListener('resize', updateCanvasRect);
    // Double check rect size after mounting/loading
    const timer = setTimeout(updateCanvasRect, 200);
    return () => {
      window.removeEventListener('resize', updateCanvasRect);
      clearTimeout(timer);
    };
  }, [image, isCropModeActive]);

  // Divider slider drag handlers
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingDivider(true);
  };

  const handleDividerTouchStart = () => {
    setIsDraggingDivider(true);
  };

  // Crop box drag handlers
  const handleCropBoxMouseDown = (e: React.MouseEvent, handle: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isCropModeActive) return;

    if (handle) {
      setActiveCropHandle(handle);
    } else {
      setIsDraggingCropBox(true);
    }

    setDragStart({
      x: e.clientX,
      y: e.clientY,
      boxX: cropArea.x,
      boxY: cropArea.y,
      boxW: cropArea.width,
      boxH: cropArea.height,
    });
  };

  const handleCropBoxTouchStart = (e: React.TouchEvent, handle: string | null) => {
    e.stopPropagation();
    if (!isCropModeActive) return;

    const touch = e.touches[0];
    if (handle) {
      setActiveCropHandle(handle);
    } else {
      setIsDraggingCropBox(true);
    }

    setDragStart({
      x: touch.clientX,
      y: touch.clientY,
      boxX: cropArea.x,
      boxY: cropArea.y,
      boxW: cropArea.width,
      boxH: cropArea.height,
    });
  };

  // Global mouse move / mouse up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingDivider && containerRef.current) {
        const rect = displayCanvasRef.current?.getBoundingClientRect();
        if (rect) {
          const clientX = e.clientX;
          const relativeX = clientX - rect.left;
          const percentage = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
          setDividerX(percentage);
        }
      }

      if ((isDraggingCropBox || activeCropHandle) && canvasRect.width > 0) {
        const dx = ((e.clientX - dragStart.x) / canvasRect.width) * 100;
        const dy = ((e.clientY - dragStart.y) / canvasRect.height) * 100;

        if (isDraggingCropBox) {
          // Reposition box
          const newX = Math.max(0, Math.min(100 - dragStart.boxW, dragStart.boxX + dx));
          const newY = Math.max(0, Math.min(100 - dragStart.boxH, dragStart.boxY + dy));
          onCropAreaChange({
            ...cropArea,
            x: newX,
            y: newY,
          });
        } else if (activeCropHandle) {
          // Resize box
          let newW = dragStart.boxW;
          let newH = dragStart.boxH;
          let newX = dragStart.boxX;
          let newY = dragStart.boxY;

          // Aspect ratio lock check
          const ratio = selectedCrop.value;

          if (activeCropHandle === 'br') {
            newW = Math.max(10, Math.min(100 - dragStart.boxX, dragStart.boxW + dx));
            if (ratio) {
              // Maintain aspect ratio: width = height * (imageWidth / imageHeight) * ratio
              const imgRatio = image.naturalWidth / image.naturalHeight;
              newH = (newW / ratio) * imgRatio;
              // Check bounds
              if (newY + newH > 100) {
                newH = 100 - newY;
                newW = (newH * ratio) / imgRatio;
              }
            } else {
              newH = Math.max(10, Math.min(100 - dragStart.boxY, dragStart.boxH + dy));
            }
          } else if (activeCropHandle === 'tl') {
            // Drag top left
            const maxRight = dragStart.boxX + dragStart.boxW;
            const maxBottom = dragStart.boxY + dragStart.boxH;
            
            newX = Math.max(0, Math.min(maxRight - 10, dragStart.boxX + dx));
            newW = maxRight - newX;

            if (ratio) {
              const imgRatio = image.naturalWidth / image.naturalHeight;
              newH = (newW / ratio) * imgRatio;
              newY = maxBottom - newH;
              if (newY < 0) {
                newY = 0;
                newH = maxBottom;
                newW = (newH * ratio) / imgRatio;
                newX = maxRight - newW;
              }
            } else {
              newY = Math.max(0, Math.min(maxBottom - 10, dragStart.boxY + dy));
              newH = maxBottom - newY;
            }
          } else if (activeCropHandle === 'tr') {
            // Drag top right
            const maxBottom = dragStart.boxY + dragStart.boxH;
            newW = Math.max(10, Math.min(100 - dragStart.boxX, dragStart.boxW + dx));

            if (ratio) {
              const imgRatio = image.naturalWidth / image.naturalHeight;
              newH = (newW / ratio) * imgRatio;
              newY = maxBottom - newH;
              if (newY < 0) {
                newY = 0;
                newH = maxBottom;
                newW = (newH * ratio) / imgRatio;
              }
            } else {
              newY = Math.max(0, Math.min(maxBottom - 10, dragStart.boxY + dy));
              newH = maxBottom - newY;
            }
          } else if (activeCropHandle === 'bl') {
            // Drag bottom left
            const maxRight = dragStart.boxX + dragStart.boxW;
            newX = Math.max(0, Math.min(maxRight - 10, dragStart.boxX + dx));
            newW = maxRight - newX;

            if (ratio) {
              const imgRatio = image.naturalWidth / image.naturalHeight;
              newH = (newW / ratio) * imgRatio;
              if (dragStart.boxY + newH > 100) {
                newH = 100 - dragStart.boxY;
                newW = (newH * ratio) / imgRatio;
                newX = maxRight - newW;
              }
            } else {
              newH = Math.max(10, Math.min(100 - dragStart.boxY, dragStart.boxH + dy));
            }
          }

          onCropAreaChange({
            x: newX,
            y: newY,
            width: newW,
            height: newH,
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingDivider(false);
      setIsDraggingCropBox(false);
      setActiveCropHandle(null);
    };

    if (isDraggingDivider || isDraggingCropBox || activeCropHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDivider, isDraggingCropBox, activeCropHandle, dragStart, canvasRect, cropArea, selectedCrop, image]);

  // Touch move handlers for mobile support
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (isDraggingDivider && containerRef.current) {
        const rect = displayCanvasRef.current?.getBoundingClientRect();
        if (rect) {
          const clientX = touch.clientX;
          const relativeX = clientX - rect.left;
          const percentage = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
          setDividerX(percentage);
        }
      }

      if ((isDraggingCropBox || activeCropHandle) && canvasRect.width > 0) {
        const dx = ((touch.clientX - dragStart.x) / canvasRect.width) * 100;
        const dy = ((touch.clientY - dragStart.y) / canvasRect.height) * 100;

        if (isDraggingCropBox) {
          const newX = Math.max(0, Math.min(100 - dragStart.boxW, dragStart.boxX + dx));
          const newY = Math.max(0, Math.min(100 - dragStart.boxH, dragStart.boxY + dy));
          onCropAreaChange({
            ...cropArea,
            x: newX,
            y: newY,
          });
        } else if (activeCropHandle) {
          let newW = dragStart.boxW;
          let newH = dragStart.boxH;
          let newX = dragStart.boxX;
          let newY = dragStart.boxY;
          const ratio = selectedCrop.value;

          if (activeCropHandle === 'br') {
            newW = Math.max(10, Math.min(100 - dragStart.boxX, dragStart.boxW + dx));
            if (ratio) {
              const imgRatio = image.naturalWidth / image.naturalHeight;
              newH = (newW / ratio) * imgRatio;
              if (newY + newH > 100) {
                newH = 100 - newY;
                newW = (newH * ratio) / imgRatio;
              }
            } else {
              newH = Math.max(10, Math.min(100 - dragStart.boxY, dragStart.boxH + dy));
            }
          } else if (activeCropHandle === 'tl') {
            const maxRight = dragStart.boxX + dragStart.boxW;
            const maxBottom = dragStart.boxY + dragStart.boxH;
            newX = Math.max(0, Math.min(maxRight - 10, dragStart.boxX + dx));
            newW = maxRight - newX;

            if (ratio) {
              const imgRatio = image.naturalWidth / image.naturalHeight;
              newH = (newW / ratio) * imgRatio;
              newY = maxBottom - newH;
              if (newY < 0) {
                newY = 0;
                newH = maxBottom;
                newW = (newH * ratio) / imgRatio;
                newX = maxRight - newW;
              }
            } else {
              newY = Math.max(0, Math.min(maxBottom - 10, dragStart.boxY + dy));
              newH = maxBottom - newY;
            }
          } else if (activeCropHandle === 'tr') {
            const maxBottom = dragStart.boxY + dragStart.boxH;
            newW = Math.max(10, Math.min(100 - dragStart.boxX, dragStart.boxW + dx));

            if (ratio) {
              const imgRatio = image.naturalWidth / image.naturalHeight;
              newH = (newW / ratio) * imgRatio;
              newY = maxBottom - newH;
              if (newY < 0) {
                newY = 0;
                newH = maxBottom;
                newW = (newH * ratio) / imgRatio;
              }
            } else {
              newY = Math.max(0, Math.min(maxBottom - 10, dragStart.boxY + dy));
              newH = maxBottom - newY;
            }
          } else if (activeCropHandle === 'bl') {
            const maxRight = dragStart.boxX + dragStart.boxW;
            newX = Math.max(0, Math.min(maxRight - 10, dragStart.boxX + dx));
            newW = maxRight - newX;

            if (ratio) {
              const imgRatio = image.naturalWidth / image.naturalHeight;
              newH = (newW / ratio) * imgRatio;
              if (dragStart.boxY + newH > 100) {
                newH = 100 - dragStart.boxY;
                newW = (newH * ratio) / imgRatio;
                newX = maxRight - newW;
              }
            } else {
              newH = Math.max(10, Math.min(100 - dragStart.boxY, dragStart.boxH + dy));
            }
          }

          onCropAreaChange({
            x: newX,
            y: newY,
            width: newW,
            height: newH,
          });
        }
      }
    };

    const handleTouchEnd = () => {
      setIsDraggingDivider(false);
      setIsDraggingCropBox(false);
      setActiveCropHandle(null);
    };

    if (isDraggingDivider || isDraggingCropBox || activeCropHandle) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingDivider, isDraggingCropBox, activeCropHandle, dragStart, canvasRect, cropArea, selectedCrop, image]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full h-full max-h-[60vh] select-none p-1 bg-black/60 rounded-3xl border border-neutral-900/60 shadow-2xl overflow-hidden"
    >
      {/* Hidden processing canvas to compute effects at preview scale */}
      <canvas ref={processedCanvasRef} className="hidden" />

      {/* Main display canvas */}
      <canvas
        ref={displayCanvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`max-w-full max-h-full object-contain rounded-2xl shadow-lg transition-all duration-300 select-none touch-none ${
          isBrushModeActive ? 'ring-2 ring-violet-500/30' : ''
        }`}
        style={{
          cursor: isBrushModeActive
            ? 'none'
            : (activeDraggingTextId && activeDragMode === 'rotate')
            ? 'grabbing'
            : hoveredHandle === 'rotate'
            ? 'grab'
            : hoveredHandle === 'corner'
            ? 'nwse-resize'
            : hoveredTextId
            ? 'move'
            : 'default',
        }}
      />

      {/* Brush cursor indicator */}
      {isBrushModeActive && brushPos && canvasRect.width > 0 && (
        <div
          className="absolute pointer-events-none rounded-full border-2 border-violet-400 bg-violet-400/20 shadow-[0_0_12px_rgba(167,139,250,0.6)] -translate-x-1/2 -translate-y-1/2 z-30"
          style={{
            left: `${canvasRect.left + brushPos.x}px`,
            top: `${canvasRect.top + brushPos.y}px`,
            width: `${brushSize * 2}px`,
            height: `${brushSize * 2}px`,
          }}
        />
      )}

      {/* Creator Overlay Guides */}
      {!isCropModeActive && activeGuide !== 'none' && canvasRect.width > 0 && (
        <div
          className="absolute pointer-events-none overflow-hidden rounded-2xl"
          style={{
            left: `${canvasRect.left}px`,
            top: `${canvasRect.top}px`,
            width: `${canvasRect.width}px`,
            height: `${canvasRect.height}px`,
          }}
        >
          <CreatorGuides guideType={activeGuide} />
        </div>
      )}

      {/* Draggable Divider Split overlay */}
      {!isCropModeActive && showCompareSplit && canvasRect.width > 0 && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${canvasRect.left}px`,
            top: `${canvasRect.top}px`,
            width: `${canvasRect.width}px`,
            height: `${canvasRect.height}px`,
          }}
        >
          {/* Vertical divider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] cursor-ew-resize pointer-events-auto"
            style={{ left: `${dividerX}%` }}
            onMouseDown={handleDividerMouseDown}
            onTouchStart={handleDividerTouchStart}
          >
            {/* Draggable Handle button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-neutral-200 text-neutral-800 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 cursor-ew-resize transition-transform duration-100 backdrop-blur-md">
              <GripHorizontal className="w-5 h-5 select-none" />
            </div>
            
            {/* Labels */}
            <div className="absolute left-3 top-3 text-[10px] uppercase font-bold tracking-widest text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded border border-white/15 select-none pointer-events-none -translate-x-full">
              Original
            </div>
            <div className="absolute right-3 top-3 text-[10px] uppercase font-bold tracking-widest text-violet-300 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded border border-violet-500/25 select-none pointer-events-none translate-x-full">
              Edited
            </div>
          </div>
        </div>
      )}

      {/* Cropper grid overlay */}
      {isCropModeActive && canvasRect.width > 0 && (
        <div
          className="absolute"
          style={{
            left: `${canvasRect.left}px`,
            top: `${canvasRect.top}px`,
            width: `${canvasRect.width}px`,
            height: `${canvasRect.height}px`,
          }}
        >
          {/* Semi-transparent black overlays outside the crop box */}
          <div
            className="absolute bg-black/75 backdrop-blur-[1px] pointer-events-none transition-all duration-100"
            style={{ left: 0, top: 0, width: '100%', height: `${cropArea.y}%` }}
          />
          <div
            className="absolute bg-black/75 backdrop-blur-[1px] pointer-events-none transition-all duration-100"
            style={{ left: 0, bottom: 0, width: '100%', height: `${100 - (cropArea.y + cropArea.height)}%` }}
          />
          <div
            className="absolute bg-black/75 backdrop-blur-[1px] pointer-events-none transition-all duration-100"
            style={{ left: 0, top: `${cropArea.y}%`, width: `${cropArea.x}%`, height: `${cropArea.height}%` }}
          />
          <div
            className="absolute bg-black/75 backdrop-blur-[1px] pointer-events-none transition-all duration-100"
            style={{
              right: 0,
              top: `${cropArea.y}%`,
              width: `${100 - (cropArea.x + cropArea.width)}%`,
              height: `${cropArea.height}%`,
            }}
          />

          {/* Active Crop Box Rect */}
          <div
            className={`absolute border border-white/80 cursor-move transition-all duration-100 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
              isDraggingCropBox ? 'border-dashed border-violet-400 bg-violet-400/5' : ''
            }`}
            style={{
              left: `${cropArea.x}%`,
              top: `${cropArea.y}%`,
              width: `${cropArea.width}%`,
              height: `${cropArea.height}%`,
            }}
            onMouseDown={(e) => handleCropBoxMouseDown(e, null)}
            onTouchStart={(e) => handleCropBoxTouchStart(e, null)}
          >
            {/* Center move indicator (only when dragging/hovering) */}
            <div className="text-white/40 pointer-events-none group-hover:text-white/60 transition-colors">
              <Move className="w-5 h-5 drop-shadow" />
            </div>

            {/* Bounding box grid guides (3x3 grid lines) */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
              <div className="border-r border-b border-white/40"></div>
              <div className="border-r border-b border-white/40"></div>
              <div className="border-b border-white/40"></div>
              <div className="border-r border-b border-white/40"></div>
              <div className="border-r border-b border-white/40"></div>
              <div className="border-b border-white/40"></div>
              <div className="border-r border-white/40"></div>
              <div className="border-r border-white/40"></div>
              <div></div>
            </div>

            {/* Corner Drag Handles */}
            {/* TL */}
            <div
              className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-3 border-l-3 border-white cursor-nwse-resize drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              onMouseDown={(e) => handleCropBoxMouseDown(e, 'tl')}
              onTouchStart={(e) => handleCropBoxTouchStart(e, 'tl')}
            ></div>
            {/* TR */}
            <div
              className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-3 border-r-3 border-white cursor-nesw-resize drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              onMouseDown={(e) => handleCropBoxMouseDown(e, 'tr')}
              onTouchStart={(e) => handleCropBoxTouchStart(e, 'tr')}
            ></div>
            {/* BL */}
            <div
              className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-3 border-l-3 border-white cursor-nesw-resize drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              onMouseDown={(e) => handleCropBoxMouseDown(e, 'bl')}
              onTouchStart={(e) => handleCropBoxTouchStart(e, 'bl')}
            ></div>
            {/* BR */}
            <div
              className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-3 border-r-3 border-white cursor-nwse-resize drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              onMouseDown={(e) => handleCropBoxMouseDown(e, 'br')}
              onTouchStart={(e) => handleCropBoxTouchStart(e, 'br')}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
