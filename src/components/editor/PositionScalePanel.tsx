import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { GripVertical, Undo, Move, Maximize2 } from 'lucide-react';
import { useMockupStore } from '@/contexts/MockupContext';

interface PositionScalePanelProps {
  onClose: () => void;
}

export const PositionScalePanel: React.FC<PositionScalePanelProps> = ({ onClose }) => {
  const {
    devicePosition,
    updateDevicePosition,
    fixedMargin,
    setFixedMargin,
    margin,
    setMargin,
  } = useMockupStore();

  const [isDragging, setIsDragging] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 200, y: 100 });
  const [scale, setScale] = useState(() => devicePosition.scale);
  const [activeTab, setActiveTab] = useState('position');
  const [marginPreset, setMarginPreset] = useState('medium');

  const windowRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  const handleWindowDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - windowPosition.x,
      y: e.clientY - windowPosition.y,
    };
  };

  const handleWindowDrag = (e: MouseEvent) => {
    if (!isDragging) return;
    setWindowPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
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

  const handleBallClick = (e: React.MouseEvent, ballIndex: number) => {
    e.preventDefault();
    if (!gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const ballElement = e.currentTarget as HTMLElement;
    const ballRect = ballElement.getBoundingClientRect();

    const ballCenterX = ballRect.left + ballRect.width / 2 - rect.left;
    const ballCenterY = ballRect.top + ballRect.height / 2 - rect.top;

    const ballRadius = 25;
    const gridWidth = rect.width;
    const gridHeight = rect.height;

    const deviceX = ((ballCenterX - ballRadius) / (gridWidth - ballRadius * 2)) * 400 - 200;
    const deviceY = ((ballCenterY - ballRadius) / (gridHeight - ballRadius * 2)) * 400 - 200;

    updateDevicePosition({ x: deviceX, y: deviceY });
  };

  const resetPosition = () => {
    setScale(1);
    updateDevicePosition({ x: 0, y: 0, scale: 1 });
    setFixedMargin(false);
    setMargin({ top: 35, right: 35, bottom: 35, left: 35 });
    setMarginPreset('medium');
  };

  const handleMarginPresetChange = (preset: string) => {
    if (!preset) return;
    setMarginPreset(preset);
    let marginValue;
    switch (preset) {
      case 'small':
        marginValue = 20;
        break;
      case 'medium':
        marginValue = 35;
        break;
      case 'large':
        marginValue = 50;
        break;
      default:
        marginValue = 35;
    }
    setMargin({ top: marginValue, right: marginValue, bottom: marginValue, left: marginValue });
  };

  const positionBalls = [
    { style: { left: '25px', top: '25px' } },
    { style: { right: '25px', top: '25px' } },
    { style: { left: '25px', bottom: '25px' } },
    { style: { right: '25px', bottom: '25px' } },
    { style: { left: '50%', top: '25px', transform: 'translateX(-50%)' } },
    { style: { left: '50%', bottom: '25px', transform: 'translateX(-50%)' } },
    { style: { left: '25px', top: '50%', transform: 'translateY(-50%)' } },
    { style: { right: '25px', top: '50%', transform: 'translateY(-50%)' } },
    { style: { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' } },
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
        <div className="flex items-center justify-between p-4 bg-sidebar md:cursor-move border-b border-sidebar-border">
          <div className="flex items-center gap-3" onMouseDown={handleWindowDragStart}>
            <GripVertical className="w-4 h-4 text-primary/70" />
            <span className="text-white text-lg font-semibold">Position / Scale</span>
          </div>
          <Button
            onClick={resetPosition}
            variant="ghost"
            size="sm"
            className="text-white hover:text-primary hover:bg-primary/20 p-3 rounded-full"
          >
            <Undo className="w-4 h-4" />
          </Button>
        </div>

        <CardContent className="px-6 pt-4 pb-6 bg-sidebar">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-sidebar/80 rounded-full ring-2 ring-secondary">
              <TabsTrigger value="position" className="flex items-center gap-2 text-white hover:bg-primary/20 hover:text-primary rounded-r-xl rounded-l-3xl data-[state=active]:bg-primary data-[state=active]:text-black">
                <Move className="w-4 h-4" />
                Position
              </TabsTrigger>
              <TabsTrigger value="margins" className="flex items-center gap-2 text-white hover:bg-primary/20 hover:text-primary rounded-l-xl rounded-r-3xl data-[state=active]:bg-primary data-[state=active]:text-black">
                <Maximize2 className="w-4 h-4" />
                Margins
              </TabsTrigger>
            </TabsList>

            <TabsContent value="position" className="mt-4">
              <div
                ref={gridRef}
                className="relative w-full h-60 bg-primary/10 rounded-xl border border-primary/30 mb-6 overflow-hidden"
              >
                {positionBalls.map((ball, index) => (
                  <div
                    key={index}
                    className="absolute size-12 rounded-full cursor-pointer transition-all duration-200 bg-primary/40 hover:bg-primary/60 hover:scale-105 focus-visible:bg-primary focus-visible:scale-110 focus-visible:shadow-lg focus-visible:shadow-primary/50 focus-visible:ring-2 focus-visible:ring-white outline-none"
                    style={ball.style}
                    onClick={(e) => handleBallClick(e, index)}
                  />
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">Scale</span>
                  <span className="text-primary text-sm">{scale.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[scale]}
                  onValueChange={(value) => {
                    setScale(value[0]);
                    updateDevicePosition({ scale: value[0] });
                  }}
                  min={0.1}
                  max={3}
                  step={0.1}
                />
              </div>
            </TabsContent>

            <TabsContent value="margins" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">Fixed Margin</span>
                  <Switch
                    checked={fixedMargin}
                    onCheckedChange={(checked) => setFixedMargin(checked)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                {fixedMargin && (
                  <div className="space-y-4">
                    <ToggleGroup
                      type="single"
                      value={marginPreset}
                      onValueChange={handleMarginPresetChange}
                      className="flex gap-1 bg-sidebar/80 rounded-full ring-2 ring-secondary p-1"
                    >
                      <ToggleGroupItem
                        value="small"
                        className={`flex-1 text-sm rounded-full hover:bg-primary/20 hover:text-primary data-[state=on]:bg-primary data-[state=on]:text-black cursor-pointer`}
                      >
                        Small
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="medium"
                        className={`flex-1 text-sm rounded-full hover:bg-primary/20 hover:text-primary data-[state=on]:bg-primary data-[state=on]:text-black cursor-pointer`}
                      >
                        Medium
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="large"
                        className={`flex-1 text-sm rounded-full hover:bg-primary/20 hover:text-primary data-[state=on]:bg-primary data-[state=on]:text-black cursor-pointer`}
                      >
                        Large
                      </ToggleGroupItem>
                    </ToggleGroup>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">Top Margin</span>
                        <span className="text-primary text-sm">{Math.round(margin.top)}</span>
                      </div>
                      <Slider
                        value={[margin.top]}
                        onValueChange={(value) => {
                          setMargin({ ...margin, top: value[0] });
                          setMarginPreset('');
                        }}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">Right Margin</span>
                        <span className="text-primary text-sm">{Math.round(margin.right)}</span>
                      </div>
                      <Slider
                        value={[margin.right]}
                        onValueChange={(value) => {
                          setMargin({ ...margin, right: value[0] });
                          setMarginPreset('');
                        }}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">Bottom Margin</span>
                        <span className="text-primary text-sm">{Math.round(margin.bottom)}</span>
                      </div>
                      <Slider
                        value={[margin.bottom]}
                        onValueChange={(value) => {
                          setMargin({ ...margin, bottom: value[0] });
                          setMarginPreset('');
                        }}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">Left Margin</span>
                        <span className="text-primary text-sm">{Math.round(margin.left)}</span>
                      </div>
                      <Slider
                        value={[margin.left]}
                        onValueChange={(value) => {
                          setMargin({ ...margin, left: value[0] });
                          setMarginPreset('');
                        }}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};