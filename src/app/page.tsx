'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, Pause, ChevronRight, Music, Wifi, Battery } from 'lucide-react';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

import { useIPod } from '@/hooks/useIPod';
import { ClickWheel } from '@/components/ClickWheel';

export default function IPod() {
  const { 
    currentMenu, selectedIndex, activeView, currentSongId, currentSong, isPlaying,
    scroll, select, back, playPause, nextSong, prevSong
  } = useIPod();

  const [isClient, setIsClient] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setIsClient(true); }, []);

  // Use the image from YouTube API if available, otherwise fallback
  const thumbnailUrl = currentSong?.imageUrl 
    ? currentSong.imageUrl
    : (currentSongId ? `https://img.youtube.com/vi/${currentSongId}/hqdefault.jpg` : null);

  return (
    <main className="relative w-[370px] h-[620px] bg-aluminum rounded-[36px] p-6 flex flex-col mx-auto my-auto select-none border border-[#b0b0b0]">
      
      <div className="h-[300px] screen-bezel flex relative">
        <div className="screen-glass" style={{borderRadius: "36px 36px 10px 10px"}}></div>

        <div className="w-full h-full bg-white rounded-[6px] overflow-hidden flex flex-col relative lcd-display" style={{borderRadius: "36px 36px 10px 10px"}}>
          
          <div className="h-5 w-full bg-gradient-to-b from-[#e0e0e0] to-[#c0c0c0] border-b border-[#a0a0a0] flex items-center justify-between px-2 z-10 shrink-0 shadow-sm">
             <span className="text-[10px] font-bold text-black drop-shadow-sm flex items-center gap-1" style={{marginLeft: "22px"}}>
               <Wifi size={12} strokeWidth={3} />
               <span style={{paddingLeft: 1}}>iPod Classic</span>
             </span>
             <div className="flex items-center gap-2" style={{margin: "5px 20px"}}>
               {isPlaying ? <Play size={8} fill="black" /> : <Pause size={8} fill="black" />}
               <Battery size={12} strokeWidth={3} className="text-black" />
             </div>
          </div>

          <div className="flex-1 flex overflow-hidden relative">
            {activeView === 'MENU' && (
              <div className="flex w-full h-full">
                <div className="w-[50%] h-full bg-white flex flex-col border-r border-gray-300">
                   <div className="px-2 py-1 font-bold text-xs border-b border-gray-300 truncate text-black shadow-sm bg-[#f8f8f8]" style={{textAlign: "center", padding: "10px"}}>
                      {currentMenu.label}
                   </div>
                   <ul className="flex-1 overflow-hidden" style={{padding: "5px"}}>
                     {currentMenu.children?.map((item, idx) => (
                       <li key={idx} className={`px-2 py-[3px] text-[11px] flex justify-between items-center cursor-pointer font-medium ${selectedIndex === idx ? 'bg-gradient-to-b from-[#4a90e2] to-[#0056b3] text-white' : 'text-black bg-white even:bg-gray-50'}`} style={{fontSize: 14}}>
                         <span className="truncate w-full drop-shadow-sm">{item.label}</span>
                         {item.type === 'menu' && <ChevronRight size={10} className="opacity-80" />}
                       </li>
                     ))}
                   </ul>
                </div>
                <div className="w-[50%] h-full bg-gray-100 relative overflow-hidden flex items-center justify-center">
                     <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-400 opacity-50"></div>
                     <Music size={64} className="text-gray-300 drop-shadow-lg relative z-10" />
                </div>
              </div>
            )}

            {activeView === 'PLAYER' && (
               <div className="w-full h-full bg-white flex flex-col items-center justify-center pt-2 relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-white z-0"></div>
                  <div className="z-10 flex flex-col items-center w-full px-6 mt-1">
                    <div className="w-32 h-32 bg-black shadow-[0_4px_10px_rgba(0,0,0,0.3)] mb-3 border border-white flex items-center justify-center rounded-sm overflow-hidden relative">
                      {thumbnailUrl ? (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img src={thumbnailUrl} alt="Art" className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                            <Music size={40} className="text-gray-400" />
                         </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                    </div>
                    <h2 className="font-bold text-xs text-black truncate w-full text-center mb-0.5">
                      {currentSong?.label || 'Loading...'}
                    </h2>
                    <p className="text-[10px] text-gray-500 mb-3 font-medium">YouTube Music</p>
                    <div className="w-full h-[6px] bg-gray-200 rounded-full shadow-inner border border-gray-300 overflow-hidden relative">
                      <div className={`absolute top-0 left-0 h-full bg-gradient-to-b from-[#6badf6] to-[#3a8ceb] w-1/3 border-r border-[#2a6cb5] ${isPlaying ? 'animate-pulse' : ''}`}></div>
                      <div className="absolute top-0 left-0 w-full h-[3px] bg-white opacity-30"></div>
                    </div>
                  </div>
               </div>
            )}
            
            {activeView === 'COVER_FLOW' && (
               <div className="w-full h-full bg-[#111] flex items-center justify-center overflow-hidden relative">
                   {/* Cover Flow Content Here */}
               </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        <ClickWheel 
           onScroll={scroll} 
           onSelect={select} 
           onMenu={back} 
           onPlayPause={playPause} 
           onNext={nextSong} 
           onPrev={prevSong} 
        />
      </div>

      <div style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
        {currentSongId && isClient && (
          <ReactPlayer 
            src={`https://www.youtube.com/watch?v=${currentSongId}`}
            playing={isPlaying}
            controls={false}
            width="100%"
            height="100%"
            onEnded={nextSong} // Auto-play next song when current ends
            config={{
              youtube: {
                color: 'white',
                origin: typeof window !== 'undefined' ? window.location.origin : undefined,
              }
            }}
          />
        )}
      </div>

    </main>
  );
}