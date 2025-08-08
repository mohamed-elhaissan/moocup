
import React from 'react';
import { Canvas } from './Canvas';
import { Backgrounds } from './Backgrounds';
import { Navbar } from './Navbar';
import { FloatingBar } from './FloatingBar';

export const Editor: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Canvas />
        <Backgrounds />
      </div>

      <FloatingBar />
    </div>
  );
};
