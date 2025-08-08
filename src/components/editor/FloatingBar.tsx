import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Move,
  Undo,
  SquareDashed,
  Rotate3D
} from 'lucide-react';
import { RotationSkewPanel } from './RotationSkewPanel';
import { PositionScalePanel } from './PositionScalePanel';
import { ImageBorderPanel } from './ImageBorderPanel';
import { useMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMockupStore } from '@/contexts/MockupContext';

export const FloatingBar: React.FC = () => {
  const {
    uploadedImage,
    setUploadedImage,
    updateDevicePosition,
    set3DRotation,
    setImageBorder,
    setMargin,
    setFixedMargin
  } = useMockupStore();

  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [navPosition, setNavPosition] = useState({ x: 0, y: 0 });
  const isMobile = useMobile();
  const hasImageRef = useRef(false);

  // Only update hasImageRef when uploadedImage actually changes between null and non-null
  const hasImage = !!uploadedImage;
  if (hasImageRef.current !== hasImage) {
    hasImageRef.current = hasImage;
  }

  const handleReset = () => {
    setMargin({ top: 0, right: 0, bottom: 0, left: 0 });
    setFixedMargin(false);
    setUploadedImage(null);
    updateDevicePosition({ x: 0, y: 0, scale: 1, rotation: 0 });
    set3DRotation({ rotateX: 0, rotateY: 0, rotateZ: 0, skew: 0 });
    setImageBorder({ width: 8, color: '#FF6B6B', radius: 22, enabled: false });
    setActivePanel(null);
  };

  const togglePanel = (panelName: string) => {
    setActivePanel(prev => prev === panelName ? null : panelName);
  };

  // Separate the position calculation logic to only run when necessary
  React.useEffect(() => {
    if (!isMobile && hasImageRef.current) {
      const updatePosition = () => {
        const canvasElement = document.querySelector('[data-mockup-canvas]') as HTMLElement;
        if (canvasElement) {
          const rect = canvasElement.getBoundingClientRect();
          const navHeight = 60;
          const navWidth = 280;
          const padding = 20;

          let centerX = rect.left + rect.width / 2;
          let bottomY = rect.bottom - 80;

          const maxX = window.innerWidth - navWidth / 2 - padding;
          const minX = navWidth / 2 + padding;
          centerX = Math.max(minX, Math.min(maxX, centerX));

          const maxY = window.innerHeight - navHeight - padding;
          const minY = padding;
          bottomY = Math.max(minY, Math.min(maxY, bottomY));

          setNavPosition({
            x: centerX,
            y: bottomY
          });
        }
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [isMobile, hasImageRef.current]); // Remove uploadedImage dependency

  // Render panel components only once and keep them stable
  const panelComponents = React.useMemo(() => ({
    rotation: <RotationSkewPanel onClose={() => setActivePanel(null)} />,
    position: <PositionScalePanel onClose={() => setActivePanel(null)} />,
    border: <ImageBorderPanel onClose={() => setActivePanel(null)} />
  }), []); // Empty dependency array - components are stable

  const renderPanel = () => {
    if (!activePanel) return null;

    const PanelContent = panelComponents[activePanel as keyof typeof panelComponents];

    if (isMobile) {
      return (
        <Sheet open={!!activePanel} onOpenChange={() => setActivePanel(null)}>
          <SheetContent side="bottom" className="bg-sidebar border-t border-sidebar-border">
            {PanelContent}
          </SheetContent>
        </Sheet>
      );
    }

    return PanelContent;
  };

  const NavButtons = () => (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleReset}
            variant="outline"
            className={`text-white hover:text-primary hover:bg-primary/20 rounded-full`}
            disabled={!hasImage}
          >
            <Undo className="w-10 h-10" />
            Reset
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Reset Transformations</p></TooltipContent>
      </Tooltip>

      {!isMobile && <Separator orientation="vertical" className="h-6 bg-primary/40 mx-1" />}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => togglePanel('rotation')}
            variant={activePanel === 'rotation' ? 'default' : 'ghost'}
            className={`rounded-full 
              ${activePanel === 'rotation'
                ? 'bg-primary hover:bg-primary/80 text-black'
                : 'text-white hover:text-primary hover:bg-primary/20'
              }`}
            disabled={!hasImage}
          >
            <Rotate3D className="w-10 h-10" />
            {!isMobile && 'Rotate & Transform'}
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>3D Rotation</p></TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => togglePanel('position')}
            variant={activePanel === 'position' ? 'default' : 'ghost'}
            className={`rounded-full py-3
            ${activePanel === 'position'
                ? 'bg-primary hover:bg-primary/80 text-black'
                : 'text-white hover:text-primary hover:bg-primary/20'
              }`}
            disabled={!hasImage}
          >
            <Move className="w-10 h-10" />
            {!isMobile && 'Position & Scale'}
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Position & Scale</p></TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => togglePanel('border')}
            variant={activePanel === 'border' ? 'default' : 'ghost'}
            className={`rounded-full 
            ${activePanel === 'border'
                ? 'bg-primary hover:bg-primary/80 text-black'
                : 'text-white hover:text-primary hover:bg-primary/20'
              }`}
            disabled={!hasImage}
          >
            <SquareDashed className="w-10 h-10" />
            {!isMobile && 'Border'}
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Image Border</p></TooltipContent>
      </Tooltip>
    </>
  );

  if (isMobile) {
    return (
      <>
        {renderPanel()}
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-sidebar border-t border-sidebar-border flex items-center justify-between px-4">
          <NavButtons />
        </div>
      </>
    );
  }

  return (
    <>
      {renderPanel()}
      <div
        className="fixed z-30 -translate-x-1/2"
        style={{
          left: `${navPosition.x}px`,
          top: `${navPosition.y}px`
        }}
      >
        <div className="flex items-center gap-1 bg-sidebar/80 backdrop-blur-lg border-2 border-primary/60 rounded-full shadow-2xl p-1.5">
          <NavButtons />
        </div>
      </div>
    </>
  );
};