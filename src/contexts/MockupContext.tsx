import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

interface DevicePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface Rotation3D {
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  skew: number;
}

interface ImageBorder {
  width: number;
  color: string;
  radius: number;
  shadow: string;
  enabled: boolean;
}

interface CustomBackground {
  name: string;
  image: string; // Base64 string
}

interface MockupState {
  uploadedImage: string | null;
  backgroundColor: string;
  backgroundType: 'solid' | 'gradient' | 'pattern';
  gradientColors: string[];
  gradientDirection: string;
  devicePosition: DevicePosition;
  rotation3D: Rotation3D;
  imageBorder: ImageBorder;
  aspectRatio: string;
  backgroundImage: string | null;
  fixedMargin: boolean;
  // marginSize: number; 
  margin: { top: number; right: number; bottom: number; left: number };
  customBackgrounds: CustomBackground[];
}

interface MockupStore extends MockupState {
  setUploadedImage: (image: string | null) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundType: (type: 'solid' | 'gradient' | 'pattern') => void;
  setGradientColors: (colors: string[]) => void;
  setGradientDirection: (direction: string) => void;
  updateDevicePosition: (position: Partial<DevicePosition>) => void;
  setUnsplashImage: (image: string | null) => void;
  set3DRotation: (rotation: Partial<Rotation3D>) => void;
  setImageBorder: (border: Partial<ImageBorder>) => void;
  setAspectRatio: (ratio: string) => void;
  setBackgroundImage: (image: string | null) => void;
  setFixedMargin: (enabled: boolean) => void;
  // setMarginSize: (size: number) => void;
  setMargin: (margin: Partial<{ top: number; right: number; bottom: number; left: number }>) => void;
  setCustomBackgrounds: (backgrounds: CustomBackground[]) => void;
  addCustomBackground: (background: CustomBackground) => void;
}

// Custom IndexedDB storage for Zustand
const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (typeof indexedDB === 'undefined') {
        console.warn('IndexedDB not available, skipping getItem');
        return null;
      }
      const value = await get(name);
      return value || null; // Return raw value (string) or null
    } catch (error) {
      console.error('IndexedDB getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (typeof indexedDB === 'undefined') {
        console.warn('IndexedDB not available, skipping setItem');
        return;
      }
      await set(name, value); // Store raw string value
    } catch (error) {
      console.error('IndexedDB setItem error:', error);
      throw error; // Let Zustand handle the error
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (typeof indexedDB === 'undefined') {
        console.warn('IndexedDB not available, skipping removeItem');
        return;
      }
      await del(name);
    } catch (error) {
      console.error('IndexedDB removeItem error:', error);
      throw error;
    }
  },
};

export const useMockupStore = create<MockupStore>()(
  persist(
    (set) => ({
      uploadedImage: null,
      backgroundColor: '#FF6B6B',
      backgroundType: 'pattern',
      backgroundImage: '/assets/deep_horizon.webp',
      gradientDirection: 'to-br',
      gradientColors: ['#667eea', '#764ba2'],
      devicePosition: { x: 0, y: 0, scale: 1, rotation: 0 },
      aspectRatio: '16:9',
      rotation3D: { rotateX: 0, rotateY: 0, rotateZ: 0, skew: 0 },
      imageBorder: {
        width: 8,
        color: '#FF6B6B',
        radius: 12,
        shadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
        enabled: true,
      },
      fixedMargin: false,
      // marginSize: 35,
      margin: { top: 35, right: 35, bottom: 35, left: 35 }, 
      customBackgrounds: [],

      setUploadedImage: (image) => set({ uploadedImage: image }),
      setBackgroundColor: (color) => set({ backgroundColor: color }),
      setBackgroundType: (type) => set({ backgroundType: type }),
      setGradientColors: (colors) => set({ gradientColors: colors }),
      setGradientDirection: (direction) => set({ gradientDirection: direction }),
      updateDevicePosition: (position) =>
        set((state) => ({
          devicePosition: { ...state.devicePosition, ...position },
        })),
      setUnsplashImage: (image) => set({ uploadedImage: image }),
      set3DRotation: (rotation) =>
        set((state) => ({
          rotation3D: { ...state.rotation3D, ...rotation },
        })),
      setImageBorder: (border) =>
        set((state) => ({
          imageBorder: { ...state.imageBorder, ...border },
        })),
      setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
      setBackgroundImage: (image) => set({ backgroundImage: image }),
      setFixedMargin: (enabled) => set({ fixedMargin: enabled }),
      // setMarginSize: (size) => set({ marginSize: size }),
      setMargin: (margin) =>
        set((state) => ({
          margin: { ...state.margin, ...margin },
        })),
      setCustomBackgrounds: (backgrounds) => set({ customBackgrounds: backgrounds }),
      addCustomBackground: (background) =>
        set((state) => ({
          customBackgrounds: [...state.customBackgrounds, background],
        })),
    }),
    {
      name: 'mockup-store',
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Zustand hydration error:', error);
        } else {
          console.log('Zustand store hydrated successfully');
        }
      },
    }
  )
);