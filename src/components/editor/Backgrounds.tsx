import React from 'react';
import { useMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ChevronUp, Image as ImageIcon, Clipboard } from 'lucide-react';
import { useMockupStore } from '@/contexts/MockupContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DialogDescription } from '@radix-ui/react-dialog';

interface CustomBackground {
  name: string;
  image: string; // Base64 string
}

export const Backgrounds: React.FC = () => {
  const {
    backgroundImage,
    setBackgroundType,
    setGradientColors,
    setGradientDirection,
    setBackgroundImage,
    customBackgrounds,
    addCustomBackground,
  } = useMockupStore();

  const isMobile = useMobile();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const gradientPresets = [
    {
      name: 'Deep Horizon',
      colors: ['#141e30', '#243b55'],
      direction: 'to-tl',
      image: '/assets/deep_horizon.webp'
    },
    
    {
      name: 'Ocean Glow',
      colors: ['#56ccf2', '#2f80ed'],
      direction: 'to-r',
      image: '/assets/ocean_glow.webp'
    },
     {
      name: 'Ocean Breeze',
      colors: ['#ff9a9e', '#fecfef'],
      direction: 'to-r',
      image: '/assets/ocean_breeze.png'
    },
    {
      name: 'Purple Haze',
      colors: ['#c471ed', '#f64f59'],
      direction: 'to-r',
      image: '/assets/purple_haze.png'
    },
     {
      name: 'Summer Vibes',
      colors: ['#56ab2f', '#a8e6cf'],
      direction: 'to-tr',
      image: '/assets/summer_vibes.png'
    },
     {
      name: 'Rainbow Dreams',
      colors: ['#ff6b6b', '#4ecdc4'],
      direction: 'to-br',
      image: '/assets/rainbow_dreams.png'
    },
     {
      name: 'Neon Heat',
      colors: ['#ff0844', '#ffb199'],
      direction: 'to-br',
      image: '/assets/neon_heat.webp'
    },
     {
      name: 'Purple Magic',
      colors: ['#667eea', '#764ba2'],
      direction: 'to-br',
      image: '/assets/purple_magic.png'
    },
    {
      name: 'Sunset Glow',
      colors: ['#ff9a56', '#ff6b9d'],
      direction: 'to-r',
      image: '/assets/sunset_glow.png'
    },
     {
      name: 'Warm Embrace',
      colors: ['#ff9472', '#f2d388'],
      direction: 'to-tr',
      image: '/assets/warm_embrace.png'
    },
    {
      name: 'Cosmic Night',
      colors: ['#667eea', '#764ba2'],
      direction: 'to-br',
      image: '/assets/cosmic_night.webp'
    },
    {
      name: 'Mint Breeze',
      colors: ['#a8edea', '#fed6e3'],
      direction: 'to-tr',
      image: '/assets/mint_breeze.webp'
    },
     {
      name: 'Neon Midnight',
      colors: ['#c471ed', '#f64f59'],
      direction: 'to-r',
      image: '/assets/neon_midnight.webp'
    },
     {
      name: 'Monochrome',
      colors: ['#2c3e50', '#34495e'],
      direction: 'to-br',
      image: '/assets/monochrome.png'
    },
     {
      name: 'Arctic Pulse',
      colors: ['#cce3df', '#3a6c7a', '#0e1a1f'],
      direction: 'to-r',
      image: '/assets/arctic_pulse.webp'
    },
    {
      name: 'Molten Dusk',
      colors: ['#f0e7da', '#f857a6', '#2c2c2c'],
      direction: 'to-l',
      image: '/assets/molten_dusk.webp'
    },
    {
      name: 'Twilight Ember',
      colors: ['#ffb88c', '#ea5753', '#111d2f'],
      direction: 'to-br',
      image: '/assets/twilight_ember.webp'
    }
  ];

  const handleGradientSelect = (gradient: typeof gradientPresets[0] | CustomBackground) => {
    setBackgroundType('pattern');
    if ('colors' in gradient && 'direction' in gradient) {
      setGradientColors(gradient.colors);
      setGradientDirection(gradient.direction);
    } else {
      setGradientColors(['#ffffff', '#ffffff']);
      setGradientDirection('to-r');
    }
    setBackgroundImage(gradient.image);
    if (isMobile) setIsOpen(false);
  };

  const handleImageUpload = (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Invalid file format! Please use JPG, PNG.');
      setIsDragOver(false);
      setIsDialogOpen(false);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large! Maximum size is 10MB.');
      setIsDragOver(false);
      setIsDialogOpen(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target?.result as string;
      if (base64Image) {
        const newBackground: CustomBackground = {
          name: `Custom ${customBackgrounds.length + 1}`,
          image: base64Image
        };
        addCustomBackground(newBackground);
        handleGradientSelect(newBackground);
        toast('Background added successfully!');
        setTimeout(() => setIsDialogOpen(false), 300); // Delay for toast visibility
        setIsDragOver(false);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read the file. Please try again.');
      setIsDragOver(false);
      setIsDialogOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    } else {
      toast.error('No valid file dropped.');
      setIsDialogOpen(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    } else {
      toast.error('No file selected.');
      setIsDialogOpen(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = e.clipboardData.files[0];
    if (file) {
      handleImageUpload(file);
    } else {
      toast.error('No valid image pasted.');
      setIsDialogOpen(false);
    }
  };

  const getDropZoneClasses = () => {
    const baseClasses = "relative transition-all duration-300 cursor-pointer border-2 border-dashed rounded-xl bg-primary/20";
    const hoverClasses = "hover:bg-primary/10";
    const dragOverClasses = isDragOver ? "scale-105 border-primary" : "border-gray-400";
    return `${baseClasses} ${hoverClasses} ${dragOverClasses}`;
  };

  const GradientGrid = () => (
    <div className="space-y-6">
      <div className="bg-background/80">
        <div className="pb-4">
          <h3 className="text-sidebar-foreground text-md font-medium">Background Gradients</h3>
        </div>
        <div className="pt-0">
          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button
                  className="h-16 rounded transition-all duration-75 relative overflow-hidden cursor-pointer border-2 border-dashed border-gray-400 hover:bg-primary/10"
                >
                  <span className="text-sm text-white font-medium drop-shadow-lg relative z-10 px-3 py-2 rounded">
                    Custom Background
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg" onPaste={handlePaste}>
                <DialogHeader>
                  <DialogTitle>Upload Custom Background</DialogTitle>
                  <DialogDescription>
                    custom background to personalise your creation.
                  </DialogDescription>
                </DialogHeader>
                <div
                  className={getDropZoneClasses()}
                  style={{
                    width: '100%',
                    height: '300px'
                  }}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <ImageIcon
                      size={isMobile ? 40 : 48}
                      className="text-gray-100 mb-4"
                    />
                    <div className="text-center text-white px-4">
                      <p className={`font-semibold mb-1 ${isMobile ? 'text-base' : 'text-lg'}`}>
                        Drop image here or click to upload
                      </p>
                      <p className={`text-white mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        Supports JPG, PNG
                        </p>
                     
                    </div>
                  </div>
                  {isDragOver && (
                    <div className="absolute inset-0 bg-primary/20 rounded-xl flex items-center justify-center">
                      <div className={`text-primary font-semibold bg-white/90 px-6 py-3 rounded-lg ${isMobile ? 'text-sm' : 'text-base'}`}>
                        Drop image here
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileInput}
                  className="hidden"
                  ref={fileInputRef}
                />
              </DialogContent>
            </Dialog>
            {[...customBackgrounds, ...gradientPresets].map((gradient, index) => (
              <button
                key={gradient.name + index}
                onClick={() => handleGradientSelect(gradient)}
                className={`h-16 rounded transition-all duration-200 relative overflow-hidden cursor-pointer 
                  ${backgroundImage === gradient.image
                  ? 'ring-2 ring-primary scale-105'
                  : 'hover:scale-102'
                  }`}
                style={{
                  backgroundImage: `url(${gradient.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <span className="text-sm text-white font-medium drop-shadow-lg relative z-10 bg-black/50 px-3 py-2 rounded">
                  {gradient.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          className="fixed bottom-24 right-4 z-50 rounded-full bg-sidebar border-primary"
          onClick={() => setIsOpen(true)}
        >
          <ChevronUp className="w-6 h-6" />
          Background Gradients
        </Button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="h-[80vh] bg-sidebar border-t border-sidebar-border [&>button:first-of-type]:hidden">
            <div className="flex items-center justify-center">
              <div className="h-2 w-16 bg-gradient-to-br from-gray-100 to-gray-400 inset-shadow-lg rounded-full"></div>
            </div>
            <div className="p-6 overflow-y-auto h-full">
              <GradientGrid />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div className="w-80 bg-background/80 p-6 overflow-y-auto">
      <GradientGrid />
    </div>
  );
};  