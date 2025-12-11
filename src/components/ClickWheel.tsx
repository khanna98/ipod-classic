'use client';

import React, { useRef, useState } from 'react';
import { Play, FastForward, Rewind } from 'lucide-react';
import { useClickSound } from '@/hooks/useClickSound';

interface Props {
  onScroll: (direction: 1 | -1) => void;
  onSelect: () => void;
  onMenu: () => void;
  onPlayPause: () => void;
  onNext: () => void; // New Prop
  onPrev: () => void; // New Prop
}

export const ClickWheel: React.FC<Props> = ({ onScroll, onSelect, onMenu, onPlayPause, onNext, onPrev }) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const playClick = useClickSound();
  const prevAngle = useRef<number | null>(null);

  // Helper to wrap actions with sound
  const handleMenu = (e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); playClick(); onMenu(); };
  const handlePlay = (e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); playClick(); onPlayPause(); };
  const handleNext = (e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); playClick(); onNext(); };
  const handlePrev = (e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); playClick(); onPrev(); };
  const handleSelect = (e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); playClick(); onSelect(); };

  // --- THE MATH LOGIC ---
  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!active || !wheelRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radians = Math.atan2(clientY - centerY, clientX - centerX);
    const degrees = radians * (180 / Math.PI);

    if (prevAngle.current !== null) {
      let delta = degrees - prevAngle.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      if (Math.abs(delta) > 15) {
        const direction = delta > 0 ? 1 : -1;
        onScroll(direction); 
        playClick();         
        prevAngle.current = degrees; 
      }
    } else {
      prevAngle.current = degrees;
    }
  };

  const startDrag = () => { setActive(true); prevAngle.current = null; };
  const endDrag = () => { setActive(false); prevAngle.current = null; };

  return (
    <div className="relative w-[260px] h-[260px] mx-auto mt-8 flex items-center justify-center select-none touch-none">
      
      {/* The White Wheel Surface */}
      <div 
        ref={wheelRef}
        className="absolute inset-0 w-full h-full rounded-full bg-[#f2f2f2] shadow-xl border border-gray-300 active:brightness-95 cursor-pointer z-0"
        onMouseDown={startDrag} onMouseMove={handleMove} onMouseUp={endDrag} onMouseLeave={endDrag}
        onTouchStart={startDrag} onTouchMove={handleMove} onTouchEnd={endDrag}
        onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const x = e.clientX - rect.left;
            
            // Precise Quadrant Mapping
            // Top (Menu)
            if (y < rect.height * 0.25) handleMenu(e);
            // Bottom (Play)
            else if (y > rect.height * 0.75) handlePlay(e);
            // Left (Prev)
            else if (x < rect.width * 0.25) handlePrev(e);
            // Right (Next)
            else if (x > rect.width * 0.75) handleNext(e);
        }}
      />

      {/* Center Button */}
      <button 
        onClick={handleSelect}
        className="relative w-[100px] h-[100px] rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shadow-inner active:bg-gray-400 z-20 border border-gray-300"
      />

      {/* --- ICON OVERLAYS --- */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 font-bold text-gray-400 text-sm pointer-events-none z-10">MENU</div>
      <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 text-gray-400 pointer-events-none">
        <Play size={20} fill="currentColor" className="ml-1" />
      </div>
      <div className="absolute left-[15%] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <Rewind size={20} fill="currentColor" />
      </div>
      <div className="absolute right-[15%] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <FastForward size={20} fill="currentColor" />
      </div>
    </div>
  );
};