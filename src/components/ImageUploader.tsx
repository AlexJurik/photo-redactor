import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { trackPhotoUpload } from '../analytics';

interface ImageUploaderProps {
  onImageSelected: (image: HTMLImageElement) => void;
}

export default function ImageUploader({ onImageSelected }: ImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    
    // Check format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file format. Please upload JPG, PNG, or WebP.');
      return;
    }

    // Check size limit (e.g. 15MB)
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      setError('File is too large. Please select an image under 15MB.');
      return;
    }

    trackPhotoUpload(file.name, file.size, file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onImageSelected(img);
      };
      img.onerror = () => {
        setError('Failed to load image. The file might be corrupted.');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-6">
      <div
        className={`w-full min-h-[360px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 cursor-pointer glass-panel ${
          isDragActive
            ? 'border-violet-400 bg-violet-950/20 scale-[1.01] shadow-[0_0_30px_rgba(167,139,250,0.15)]'
            : 'border-neutral-800 hover:border-violet-500/50 hover:bg-neutral-900/40 hover:shadow-[0_0_20px_rgba(167,139,250,0.05)]'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleChange}
        />

        <div className="relative mb-6">
          <div className="absolute inset-0 bg-violet-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative p-6 bg-neutral-900/80 border border-neutral-800 rounded-full flex items-center justify-center text-violet-400">
            <Upload className="w-8 h-8 animate-bounce" />
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-2 text-white font-display">
          Upload your photo
        </h3>
        <p className="text-neutral-400 text-sm max-w-sm mb-6 leading-relaxed">
          Drag and drop your JPEG, PNG, or WebP image here, or click to browse from your device
        </p>

        <div className="flex items-center gap-6 text-xs text-neutral-500 bg-neutral-950/50 px-4 py-2 rounded-full border border-neutral-900">
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> High-res up to 15MB
          </span>
          <span className="w-1 h-1 bg-neutral-700 rounded-full"></span>
          <span>JPG, PNG, WebP</span>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-rose-400 bg-rose-950/30 border border-rose-500/20 px-4 py-3 rounded-xl text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
