import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { GripVertical, Undo, FlipHorizontal, FlipVertical, RotateCw, Move3D, ArrowUp } from 'lucide-react';
import { useMockupStore } from '@/contexts/MockupContext';


interface RotationSkewPanelProps {
  onClose: () => void;
}

export const RotationSkewPanel: React.FC<RotationSkewPanelProps> = ({ onClose }) => {
  // 2. Select only the state and actions this component needs from the store.
  // This is more performant than pulling the entire state.
  const rotation3D = useMockupStore((state) => state.rotation3D);
  const set3DRotation = useMockupStore((state) => state.set3DRotation);

  // Local component state remains the same
  const [isDragging, setIsDragging] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 100, y: 100 });
  const windowRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Window dragging logic remains unchanged
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

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleWindowDrag);
      window.addEventListener('mouseup', handleWindowDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleWindowDrag);
        window.removeEventListener('mouseup', handleWindowDragEnd);
      };
    }
  }, [isDragging]);

  // 3. Update action calls to use the new Zustand actions directly.
  const handleRotationChange = (type: 'rotateX' | 'rotateY' | 'rotateZ' | 'skew', value: number[]) => {
    // OLD: dispatch({ type: 'SET_3D_ROTATION', payload: { [type]: value[0] } });
    set3DRotation({ [type]: value[0] });
  };

  const resetRotation = () => {
    // OLD: dispatch({ type: 'SET_3D_ROTATION', payload: { rotateX: 0, rotateY: 0, rotateZ: 0, skew: 0 } });
    set3DRotation({ rotateX: 0, rotateY: 0, rotateZ: 0, skew: 0 });
  };

  const presets = [
    { rotateX: 20, rotateY: 0, rotateZ: 0, skew: 0 },
    { rotateX: 30, rotateY: -15, rotateZ: 25, skew: 0 },
    { rotateX: 0, rotateY: 0, rotateZ: 15, skew: 0 },
    { rotateX: -20, rotateY: 0, rotateZ: 0, skew: 0 },
    { rotateX: 0, rotateY: -20, rotateZ: 0, skew: 0 },
    { rotateX: 0, rotateY: 0, rotateZ: -15, skew: 0 },
  ];

  return (
    <div
      ref={windowRef}
      className="md:fixed z-40 select-none"
      style={{
        left: `${windowPosition.x}px`,
        top: `${windowPosition.y}px`,
      }}
    >
      <Card className="bg-sidebar max-md:border-none border-sidebar-border rounded-2xl overflow-hidden min-w-80">
        <div
          className="flex items-center justify-between p-4 bg-sidebar md:cursor-move border-b border-sidebar-border"
          onMouseDown={handleWindowDragStart}
        >
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-primary/70" />
            <div className="flex items-center gap-4">
              <span className="text-white text-lg font-semibold">Rotation & Skew</span>
            </div>
          </div>
          <Button onClick={resetRotation} variant="ghost" size="sm" className="text-white hover:text-primary hover:bg-primary/20 p-3 rounded-full">
            <Undo className="w-4 h-4" />
          </Button>
        </div>

        <CardContent className="p-6 bg-sidebar">
          <div className="space-y-6">
            <div className="space-y-4">
              {/* 4. Update state access to use the selected state directly (no more 'state.' prefix) */}
              <div className="flex items-center gap-4">
                <div className="[&>svg]:text-gray-400 text-sm w-6"><FlipVertical className='size-6' /></div>
                <div className="flex-1">
                  <Slider
                    value={[rotation3D.rotateX]}
                    onValueChange={(value) => handleRotationChange('rotateX', value)}
                    min={-45}
                    max={45}
                    step={1}
                  />
                </div>
                <span className="text-white text-sm w-8 text-right">{rotation3D.rotateX}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="[&>svg]:text-gray-400 text-sm w-6"><FlipHorizontal className='size-6' /></div>
                <div className="flex-1">
                  <Slider
                    value={[rotation3D.rotateY]}
                    onValueChange={(value) => handleRotationChange('rotateY', value)}
                    min={-45}
                    max={45}
                    step={1}
                  />
                </div>
                <span className="text-white text-sm w-8 text-right">{rotation3D.rotateY}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="[&>svg]:text-gray-400 text-sm w-6"><RotateCw className='size-6' /></div>
                <div className="flex-1">
                  <Slider
                    value={[rotation3D.rotateZ]}
                    onValueChange={(value) => handleRotationChange('rotateZ', value)}
                    min={-180}
                    max={180}
                    step={1}
                  />
                </div>
                <span className="text-white text-sm w-8 text-right">{rotation3D.rotateZ}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="[&>svg]:text-gray-400 text-sm w-6"><Move3D className='size-6' /></div>
                <div className="flex-1">
                  <Slider
                    value={[rotation3D.skew]}
                    onValueChange={(value) => handleRotationChange('skew', value)}
                    min={0}
                    max={45}
                    step={1}
                  />
                </div>
                <span className="text-white text-sm w-8 text-right">{rotation3D.skew}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {presets.map((preset, index) => (
                <Button
                  key={index}
                  // 5. Update the onClick to call the Zustand action.
                  // OLD: onClick={() => dispatch({ type: 'SET_3D_ROTATION', payload: preset })}
                  onClick={() => set3DRotation(preset)}
                  variant="ghost"
                  className="h-16 bg-primary/10 hover:bg-primary/20 border border-primary/30 flex flex-col items-center justify-center rounded-lg perspective-near"
                >
                  <div
                    className="relative w-10 h-8 bg-primary rounded-sm mb-1 flex items-center justify-center [&>svg]:stroke-gray-600"
                    style={{
                      transform: `rotateX(${preset.rotateX}deg) rotateY(${preset.rotateY}deg) rotateZ(${preset.rotateZ}deg)`
                    }}
                  >
                    <ArrowUp />
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};