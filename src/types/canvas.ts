
export interface MockupState {
  uploadedImage: string | null;
  selectedFrame: string;
  backgroundColor: string;
  backgroundType: 'solid' | 'gradient' | 'pattern';
  backgroundImage?: string;
  gradientDirection: string;
  gradientColors: string[];
  pattern: string;
  imagePosition: {
    x: number;
    y: number;
    scale: number;
  };
  devicePosition: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  aspectRatio: string;
  rotation3D: {
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    skew: number;
  };
  imageBorder: {
    width: number;
    color: string;
    radius: number;
    shadow: string;
    enabled: boolean;
  };
}

export interface DeviceFrame {
  id: string;
  name: string;
  type: 'phone' | 'laptop' | 'tablet' | 'desktop';
  colors: string[];
  dimensions: {
    width: number;
    height: number;
    screenWidth: number;
    screenHeight: number;
    screenX: number;
    screenY: number;
  };
  recommendedResolution?: string;
}

// Additional types for CanvasContext compatibility
export interface CanvasObject {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface CanvasState {
  objects: CanvasObject[];
  selectedObjects: string[];
  history: any[];
  historyIndex: number;
  canvasSize: { width: number; height: number };
  backgroundColor: string;
  deviceFrame: string;
}
