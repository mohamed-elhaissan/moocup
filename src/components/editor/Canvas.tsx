import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { extractDominantColor } from '@/utils/colorExtractor';
import { ImageIcon, Clipboard } from 'lucide-react';
import { useMockupStore } from '@/contexts/MockupContext';
import { Button } from '@/components/ui/button';

// Responsive configuration
const getResponsiveConfig = () => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const basePadding = isMobile ? 40 : isTablet ? 100 : 200;
  const scaleMultiplier = isMobile ? 0.95 : isTablet ? 0.85 : 0.8;
  const maxWidth = isMobile ? 1000 : isTablet ? 1100 : 1200;
  const maxHeight = isMobile ? 700 : isTablet ? 750 : 800;
  const availableWidth = viewportWidth - basePadding;
  const availableHeight = viewportHeight - basePadding;
  const maxContainerWidth = Math.min(availableWidth * scaleMultiplier, maxWidth);
  const maxContainerHeight = Math.min(availableHeight * scaleMultiplier, maxHeight);
  return {
    isMobile,
    isTablet,
    basePadding,
    scaleMultiplier,
    maxContainerWidth,
    maxContainerHeight,
    dropZoneWidth: isMobile ? '95%' : isTablet ? '70%' : '60%',
    dropZoneHeight: isMobile ? '60%' : '50%',
  };
};

// Smart image optimization utility - only compress if needed
const optimizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size < 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const MAX_WIDTH = 2400;
      const MAX_HEIGHT = 1800;
      let { width, height } = img;
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      let optimizedDataUrl;
      try {
        optimizedDataUrl = canvas.toDataURL('image/png');
        if (optimizedDataUrl.length > 5 * 1024 * 1024) {
          optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        }
      } catch (e) {
        optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      }
      resolve(optimizedDataUrl);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Fetch demo image as a File object
const fetchDemoImage = async (): Promise<File> => {
  try {
    const response = await fetch('/assets/demo.webp');
    if (!response.ok) throw new Error('Failed to fetch demo image');
    const blob = await response.blob();
    return new File([blob], 'demo.webp', { type: 'image/webp' });
  } catch (error) {
    throw new Error('Error fetching demo image: ' + error);
  }
};

export const Canvas: React.FC = () => {
  const {
    uploadedImage,
    backgroundType,
    backgroundImage,
    backgroundColor,
    gradientDirection,
    gradientColors,
    devicePosition,
    rotation3D,
    imageBorder,
    margin,
    fixedMargin,
    setUploadedImage,
    setImageBorder,
  } = useMockupStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [responsiveConfig, setResponsiveConfig] = useState(getResponsiveConfig());
  const [showPasteHint, setShowPasteHint] = useState(false);

  // Update responsive config on window resize
  useEffect(() => {
    const handleResize = () => {
      setResponsiveConfig(getResponsiveConfig());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clipboard paste functionality
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            if (uploadedImage) {
              setShowPasteHint(true);
              toast('Image in clipboard detected! Clear current image to paste new one.', {
                duration: 3000,
                action: {
                  label: 'Clear & Paste',
                  onClick: () => {
                    setUploadedImage(null);
                    localStorage.removeItem('demoImage');
                    setTimeout(() => handleImageUpload(file), 100);
                  },
                },
              });
              setTimeout(() => setShowPasteHint(false), 3000);
            } else {
              await handleImageUpload(file);
              localStorage.removeItem('demoImage');
              toast('Image pasted successfully!');
            }
          }
          break;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [uploadedImage, setUploadedImage]);

  // Load demo image from local storage on mount
  // useEffect(() => {
  //   const savedDemoImage = localStorage.getItem('demoImage');
  //   if (savedDemoImage === '/assets/demo.webp') {
  //     handleDemoImage();
  //   }
  // }, [setUploadedImage]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith('image/'));
    if (imageFile) {
      localStorage.removeItem('demoImage');
      handleImageUpload(imageFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const handleImageUpload = async (file: File) => {
    let loadingToast: string | number | undefined;
    if (file.size > 1024 * 1024) {
      loadingToast = toast('Processing image...', { duration: Infinity });
    }
    try {
      const optimizedDataUrl = await optimizeImage(file);
      setUploadedImage(optimizedDataUrl);
      requestAnimationFrame(async () => {
        try {
          const dominantColor = await extractDominantColor(optimizedDataUrl);
          const validHex = /^#[0-9A-Fa-f]{6}$/.test(dominantColor) ? dominantColor : '#9CA389';
          const { r, g, b } = hexToRgb(validHex);
          const borderWidth = responsiveConfig.isMobile ? 4 : 8;
          const initialOpacity = 0.5;
          setImageBorder({
            enabled: true,
            width: borderWidth,
            color: `rgba(${r}, ${g}, ${b}, ${initialOpacity})`,
            shadow: `rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px`,
          });
          if (loadingToast) {
            toast.dismiss(loadingToast);
          }
          toast('Image uploaded with transparent border!');
        } catch (error) {
          const borderWidth = responsiveConfig.isMobile ? 4 : 8;
          const initialOpacity = 0.5;
          setImageBorder({
            enabled: true,
            width: borderWidth,
            color: `rgba(156, 163, 137, ${initialOpacity})`,
            shadow: `rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px`,
          });
          if (loadingToast) {
            toast.dismiss(loadingToast);
          }
          toast('Image uploaded with default transparent border!');
        }
      });
    } catch (error) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        try {
          const dominantColor = await extractDominantColor(result);
          const validHex = /^#[0-9A-Fa-f]{6}$/.test(dominantColor) ? dominantColor : '#9CA389';
          const { r, g, b } = hexToRgb(validHex);
          const borderWidth = responsiveConfig.isMobile ? 4 : 8;
          const initialOpacity = 0.5;
          setImageBorder({
            enabled: true,
            width: borderWidth,
            color: `rgba(${r}, ${g}, ${b}, ${initialOpacity})`,
            shadow: `rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px`,
          });
          toast('Image uploaded with transparent border!');
        } catch (error) {
          const borderWidth = responsiveConfig.isMobile ? 4 : 8;
          const initialOpacity = 0.5;
          setImageBorder({
            enabled: true,
            width: borderWidth,
            color: `rgba(156, 163, 137, ${initialOpacity})`,
            shadow: `rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px`,
          });
          toast('Image uploaded with default transparent border!');
        }
      };
      reader.readAsDataURL(file);
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      console.error('Image optimization failed, using fallback:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      localStorage.removeItem('demoImage');
      handleImageUpload(file);
    }
  };

  const handleDemoImage = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    try {
      e?.stopPropagation();
      const demoFile = await fetchDemoImage();
      await handleImageUpload(demoFile);
      localStorage.setItem('demoImage', '/assets/demo.webp');
      toast('Demo image applied successfully!');
    } catch (error) {
      toast.error('Failed to load demo image.');
      console.error(error);
    }
  };

  // Calculate image dimensions with responsive scaling
  useEffect(() => {
    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
        const { maxContainerWidth, maxContainerHeight } = responsiveConfig;
        const originalWidth = img.width;
        const originalHeight = img.height;
        const scaleX = maxContainerWidth / originalWidth;
        const scaleY = maxContainerHeight / originalHeight;
        const optimalScale = Math.min(scaleX, scaleY, 1);
        const scaledWidth = originalWidth * optimalScale;
        const scaledHeight = originalHeight * optimalScale;
        setImageDimensions({
          width: Math.round(scaledWidth),
          height: Math.round(scaledHeight),
        });
      };
      img.src = uploadedImage;
    } else {
      setImageDimensions(null);
    }
  }, [uploadedImage, responsiveConfig]);

  // Calculate canvas style based on fixed margin setting
  const getCanvasStyle = () => {
    if (!fixedMargin || !imageDimensions || !uploadedImage) {
      // Default behavior - canvas takes full flex-1 space
      return {
        width: '100%',
        height: '100%',
      };
    }

    // Fixed margin behavior - shrink canvas to image + margin
    const totalWidth = imageDimensions.width + margin.left + margin.right;
    const totalHeight = imageDimensions.height + margin.top + margin.bottom;

    return {
      width: `${totalWidth}px`,
      height: `${totalHeight}px`,
    };
  };

  const getBackgroundStyle = () => {
    const baseStyle: React.CSSProperties = {};
    
    if (backgroundType === 'pattern' && backgroundImage) {
      baseStyle.backgroundImage = `url(${backgroundImage})`;
      baseStyle.backgroundSize = 'cover';
      baseStyle.backgroundPosition = 'center';
      baseStyle.backgroundRepeat = 'no-repeat';
    } else if (backgroundType === 'gradient') {
      const direction = gradientDirection.replace('to-', '');
      const degreeMap: { [key: string]: string } = {
        r: '90deg',
        br: '135deg',
        b: '180deg',
        bl: '225deg',
        l: '270deg',
        tl: '315deg',
        t: '0deg',
        tr: '45deg',
      };
      const angle = degreeMap[direction] || '135deg';
      baseStyle.background = `linear-gradient(${angle}, ${gradientColors.join(', ')})`;
    } else {
      baseStyle.backgroundColor = backgroundColor;
    }

    if (fixedMargin && imageDimensions && uploadedImage) {
      // When fixed margin is enabled, background takes full canvas size
      baseStyle.width = '100%';
      baseStyle.height = '100%';
    } else {
      // Default behavior - background fills the entire flex space
      baseStyle.width = '100%';
      baseStyle.height = '100%';
    }

    return baseStyle;
  };

  const getImageContainerStyle = () => {
    if (!fixedMargin || !imageDimensions || !uploadedImage) {
      // Default behavior - center the image
      return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      };
    }

    // Fixed margin behavior - position image with exact margins
    return {
      position: 'absolute' as const,
      top: `${margin.top}px`,
      right: `${margin.right}px`,
      bottom: `${margin.bottom}px`,
      left: `${margin.left}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  };

  const getImageStyle = () => {
    const dimensions = imageDimensions || { width: 400, height: 300 };
    const baseStyles = {
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      transform: `
        translate(${devicePosition.x}px, ${devicePosition.y}px) 
        scale(${devicePosition.scale}) 
        rotate(${devicePosition.rotation}deg)
        rotateX(${rotation3D.rotateX}deg)
        rotateY(${rotation3D.rotateY}deg)
        rotateZ(${rotation3D.rotateZ}deg)
        skew(${rotation3D.skew}deg)
      `,
      transformOrigin: 'center center',
      transformStyle: 'preserve-3d' as const,
    };

    if (imageBorder.enabled) {
      return {
        ...baseStyles,
        border: `${imageBorder.width}px solid ${imageBorder.color}`,
        borderRadius: `${imageBorder.radius}px`,
        boxShadow: imageBorder.shadow,
      };
    }
    return baseStyles;
  };

  const getDropZoneClasses = () => {
    const baseClasses = 'relative transition-all duration-300 cursor-pointer border-2 border-dashed rounded-xl bg-gray-900/50 mx-auto top-[15%] md:top-[25%]';
    const hoverClasses = 'hover:bg-gray-900/70';
    const dragOverClasses = isDragOver ? 'scale-105 border-primary' : 'border-gray-400';
    return `${baseClasses} ${hoverClasses} ${dragOverClasses}`;
  };

  const getDropZoneOverlayText = () => {
    const primaryText = uploadedImage ? 'Drop to replace image' : 'Drop image here';
    const iconSize = responsiveConfig.isMobile ? 32 : 48;
    const textSize = responsiveConfig.isMobile ? 'text-base' : 'text-xl';
    return { primaryText, iconSize, textSize };
  };

  return (
    <div 
      className="flex-1 flex items-center justify-center relative transition-all duration-300"
      style={fixedMargin && imageDimensions && uploadedImage ? { backgroundColor: 'black' } : {}}
    >
      <div
        className="transition-all duration-300 relative overflow-hidden"
        style={getCanvasStyle()}
        data-mockup-canvas
        onDrop={uploadedImage ? handleDrop : undefined}
        onDragOver={uploadedImage ? handleDragOver : undefined}
      >
        <div
          className="transition-all duration-300 relative"
          style={getBackgroundStyle()}
        >
          {uploadedImage ? (
            <div style={getImageContainerStyle()}>
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Uploaded mockup"
                  className="relative size-full transition-all duration-300 will-transform select-none"
                  style={getImageStyle()}
                  crossOrigin="anonymous"
                  onDragOver={(e) => e.stopPropagation()}
                />
                {isDragOver && (
                  <div className="absolute inset-0 bg-primary/30 rounded-xl flex items-center justify-center z-10">
                    <div
                      className={`text-primary font-semibold bg-white/90 px-6 py-3 rounded-lg ${getDropZoneOverlayText().textSize}`}
                    >
                      {getDropZoneOverlayText().primaryText}
                    </div>
                  </div>
                )}
                {showPasteHint && (
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl flex items-center justify-center z-20 animate-pulse">
                    <div className="text-blue-600 font-semibold bg-white/95 px-6 py-3 rounded-lg text-center shadow-lg">
                      <Clipboard className="inline-block mr-2 h-5 w-5" />
                      Image ready to paste!
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className={getDropZoneClasses()}
              style={{
                width: responsiveConfig.dropZoneWidth,
                height: responsiveConfig.dropZoneHeight,
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center ">
                <ImageIcon size={getDropZoneOverlayText().iconSize} className="text-gray-100 mb-4" />
                <div className="text-center text-white px-4">
                  <p className={`font-semibold mb-1 ${responsiveConfig.isMobile ? 'text-base' : 'text-lg'}`}>
                    Drop image here or click to upload
                  </p>
                  <p className={`text-white/70 mb-2 ${responsiveConfig.isMobile ? 'text-xs' : 'text-sm'}`}>
                    Supports JPG, PNG
                  </p>
                  <div className="flex items-center justify-center gap-2 text-white font-semibold">
                    <Clipboard className="h-4 w-4" strokeWidth={2.5} />
                    <span className={`${responsiveConfig.isMobile ? 'text-xs' : 'text-sm'} text-white/70`}>
                      Or paste image (Ctrl+V)
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-6 z-50 rounded-full bg-gray-900/50 hover:bg-gray-900 border-2 border-primary"
                  onClick={handleDemoImage}
                >
                  Use Demo Image
                </Button>
              </div>
              {isDragOver && (
                <div className="absolute inset-0 bg-primary/20 rounded-xl flex items-center justify-center">
                  <div
                    className={`text-primary font-semibold bg-white/90 px-6 py-3 rounded-lg ${getDropZoneOverlayText().textSize}`}
                  >
                    Drop image here
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>
    </div>
  );
};