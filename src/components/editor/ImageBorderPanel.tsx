import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Undo, RectangleHorizontal, Palette, CornerUpLeft, Wand2 } from 'lucide-react';
import { useMockupStore } from '@/contexts/MockupContext';
import { extractDominantColor } from '@/utils/colorExtractor';

interface ImageBorderPanelProps {
  onClose: () => void;
}

export const ImageBorderPanel: React.FC<ImageBorderPanelProps> = ({ onClose }) => {
  const {
    imageBorder,
    setImageBorder,
    uploadedImage,
  } = useMockupStore();

  // Parse RGBA to initialize isTransparent and opacity
  const parseRgba = (color: string): { r: number; g: number; b: number; a: number } => {
    const matches = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (matches) {
      return {
        r: parseInt(matches[1]),
        g: parseInt(matches[2]),
        b: parseInt(matches[3]),
        a: parseFloat(matches[4]),
      };
    }
    // Fallback to default color if parsing fails
    return { r: 156, g: 163, b: 137, a: 1 }; // #9CA389
  };

  const initialRgba = parseRgba(imageBorder.color);
  const [isDragging, setIsDragging] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 300, y: 100 });
  const windowRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [isTransparent, setIsTransparent] = useState(initialRgba.a < 1);
  const [isLoadingColor, setIsLoadingColor] = useState(false);
  const [opacity, setOpacity] = useState(Math.max(0.3, initialRgba.a));

  const handleWindowDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - windowPosition.x,
      y: e.clientY - windowPosition.y
    };
  };

  const handleWindowDrag = (e: MouseEvent) => {
    if (!isDragging) return;
    setWindowPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleWindowDragEnd = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleWindowDrag);
      window.addEventListener('mouseup', handleWindowDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleWindowDrag);
        window.removeEventListener('mouseup', handleWindowDragEnd);
      };
    }
  }, [isDragging]);

  const resetBorder = () => {
    setImageBorder({
      width: 8,
      color: 'rgba(156, 163, 137, 1)', // #9CA389
      radius: 22,
      enabled: false,
      shadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
    });
    setIsTransparent(false);
    setOpacity(1);
  };

  const handleMagicWandClick = async () => {
    if (!uploadedImage) return;
    setIsLoadingColor(true);
    try {
      const dominantColor = await extractDominantColor(uploadedImage);
      const matches = dominantColor.match(/^#[0-9A-Fa-f]{6}$/) ? dominantColor : '#9CA389';
      const { r, g, b } = hexToRgb(matches);
      setImageBorder({
        color: `rgba(${r}, ${g}, ${b}, ${isTransparent ? opacity : 1})`
      });
    } catch (error) {
      console.error('Error extracting dominant color:', error);
      setImageBorder({
        color: `rgba(156, 163, 137, ${isTransparent ? opacity : 1})` // #9CA389
      });
    } finally {
      setIsLoadingColor(false);
    }
  };

  const colorOptions = [
    'magic-wand',
    'rgba(255, 255, 255, 1)', // #FFFFFF
    'rgba(156, 163, 137, 1)', // #9CA389
    'rgba(0, 0, 0, 1)', // #000000
    'rgba(255, 107, 107, 1)', // #FF6B6B
    'rgba(254, 202, 87, 1)', // #FECA57
    'rgba(78, 205, 196, 1)', // #4ECDC4
    'rgba(69, 183, 209, 1)', // #45B7D1
  ];

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const convertToRgba = (r: number, g: number, b: number, opacity: number): string => {
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const handleColorSelect = (color: string) => {
    if (color === 'magic-wand') return;
    const { r, g, b } = parseRgba(color);
    setImageBorder({
      color: convertToRgba(r, g, b, isTransparent ? opacity : 1)
    });
  };

  const handleTransparencyToggle = (checked: boolean) => {
    setIsTransparent(checked);
    const newOpacity = checked ? 0.5 : 1;
    setOpacity(newOpacity);
    const { r, g, b } = parseRgba(imageBorder.color);
    setImageBorder({
      color: convertToRgba(r, g, b, newOpacity)
    });
  };

  const handleOpacityChange = (value: number[]) => {
    const newOpacity = Math.max(0.3, value[0]);
    setOpacity(newOpacity);
    if (isTransparent) {
      const { r, g, b } = parseRgba(imageBorder.color);
      setImageBorder({
        color: convertToRgba(r, g, b, newOpacity)
      });
    }
  };

  return (
    <div
      ref={windowRef}
      className="md:fixed z-40 select-none"
      style={{
        left: `${windowPosition.x}px`,
        top: `${windowPosition.y}px`
      }}
    >
      <Card className="bg-sidebar max-md:border-none border-sidebar-border rounded-2xl overflow-hidden min-w-80">
        <div
          className="flex items-center justify-between p-4 bg-sidebar md:cursor-move border-b border-sidebar-border"
          onMouseDown={handleWindowDragStart}
        >
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-primary/70" />
            <span className="text-white text-lg font-semibold">Image Border</span>
          </div>
          <Button onClick={resetBorder} variant="ghost" size="sm" className="text-white hover:text-primary hover:bg-primary/20 p-3 rounded-full">
            <Undo className="w-4 h-4" />
          </Button>
        </div>

        <CardContent className="p-6 bg-sidebar">
          <div className="space-y-6">
            {/* Enable Border Section */}
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Enable Border</span>
              <Switch
                checked={imageBorder.enabled}
                onCheckedChange={(checked) => setImageBorder({ enabled: checked })}
              />
            </div>

            {imageBorder.enabled && (
              <>
                {/* Transparent Border Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Transparent Border</span>
                    <Switch
                      checked={isTransparent}
                      onCheckedChange={handleTransparencyToggle}
                    />
                  </div>
                  {isTransparent && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">Opacity</span>
                        <span className="text-primary text-sm">{Math.round(opacity * 100)}%</span>
                      </div>
                      <Slider
                        value={[opacity]}
                        onValueChange={handleOpacityChange}
                        min={0.3}
                        max={1}
                        step={0.01}
                      />
                    </div>
                  )}
                </div>

                {/* Color Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <span className="text-white text-sm">Color</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      color === 'magic-wand' ? (
                        <button
                          key={color}
                          onClick={handleMagicWandClick}
                          disabled={isLoadingColor || !uploadedImage}
                          className={`w-full h-10 rounded-lg border-2 transition-all flex items-center justify-center ${
                            isLoadingColor || !uploadedImage
                              ? 'opacity-50 cursor-not-allowed'
                              : 'border-primary/30 hover:border-primary/70'
                          }`}
                        >
                          <Wand2 className="w-5 h-5 text-primary" />
                        </button>
                      ) : (
                        <button
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          className={`w-full h-10 rounded-lg border-2 transition-all ${
                            imageBorder.color === color || imageBorder.color === convertToRgba(parseRgba(color).r, parseRgba(color).g, parseRgba(color).b, opacity)
                              ? 'border-primary scale-110'
                              : 'border-primary/30 hover:border-primary/70'
                          }`}
                          style={{ backgroundColor: isTransparent ? convertToRgba(parseRgba(color).r, parseRgba(color).g, parseRgba(color).b, opacity) : color }}
                        />
                      )
                    ))}
                  </div>
                </div>

                {/* Width Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RectangleHorizontal className="w-4 h-4 text-primary" />
                      <span className="text-white text-sm">Width</span>
                    </div>
                    <span className="text-primary text-sm">{imageBorder.width}px</span>
                  </div>
                  <Slider
                    value={[imageBorder.width]}
                    onValueChange={(value) => setImageBorder({ width: value[0] })}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>

                {/* Radius (Corners) Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CornerUpLeft className="w-4 h-4 text-primary" />
                      <span className="text-white text-sm">Radius</span>
                    </div>
                    <span className="text-primary text-sm">{imageBorder.radius}px</span>
                  </div>
                  <Slider
                    value={[imageBorder.radius]}
                    onValueChange={(value) => setImageBorder({ radius: value[0] })}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};