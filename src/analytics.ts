// Google Analytics event tracking helper.

type AnalyticsParam = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsParam>;

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js',
      eventNameOrId: string | Date,
      params?: AnalyticsParams,
    ) => void;
  }
}

/**
 * Log a custom event to Google Analytics
 */
export const trackEvent = (eventName: string, params?: AnalyticsParams) => {
  // Console log in development for easier verification
  if (import.meta.env.DEV) {
    console.log(`[Analytics Event] ${eventName}:`, params);
  }
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

/**
 * Track photo upload actions
 */
export const trackPhotoUpload = (fileName: string, fileSize: number, fileType: string) => {
  trackEvent('photo_upload', {
    file_name: fileName,
    file_size_kb: Math.round(fileSize / 1024),
    file_type: fileType,
  });
};

/**
 * Track preset filter applications
 */
export const trackFilterApply = (filterName: string) => {
  trackEvent('apply_preset', {
    preset_name: filterName,
  });
};

/**
 * Track manual adjustment adjustments
 */
export const trackManualAdjustment = (sliderName: string, value: string | number) => {
  trackEvent('manual_adjustment', {
    slider_name: sliderName,
    value: value,
  });
};

/**
 * Track crop usage
 */
export const trackCropApply = (ratioName: string) => {
  trackEvent('apply_crop', {
    aspect_ratio: ratioName,
  });
};

/**
 * Track text layer events
 */
export const trackTextAdd = (fontFamily: string, blendMode: string) => {
  trackEvent('add_text_overlay', {
    font_family: fontFamily,
    blend_mode: blendMode,
  });
};

/**
 * Track foreground mask painting
 */
export const trackMaskPaint = (brushSize: number) => {
  trackEvent('paint_mask', {
    brush_size: brushSize,
  });
};

/**
 * Track exports/downloads
 */
export const trackPhotoExport = (format: string, filterName: string, hasText: boolean) => {
  trackEvent('export_photo', {
    export_format: format,
    active_filter: filterName,
    has_text_overlays: hasText,
  });
};
