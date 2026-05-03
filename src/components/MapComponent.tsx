'use client';

import { motion } from 'framer-motion';
import { MapPin, Navigation, Info } from 'lucide-react';

export default function MapComponent() {
  const buildings = [
    { id: 'quad', name: 'Main Quad', x: 200, y: 150, color: '#facc15' },
    { id: 'library', name: 'Green Library', x: 350, y: 250, color: '#60a5fa' },
    { id: 'union', name: 'Tresidder Union', x: 150, y: 350, color: '#f87171' },
    { id: 'church', name: 'Memorial Church', x: 200, y: 50, color: '#c084fc' },
  ];

  return (
    <div className="relative w-full h-full min-h-[400px] bg-slate-900/50 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-xl">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20 backdrop-blur-md">
        <Navigation className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-medium text-white/80">Interactive Campus Map</span>
      </div>

      <svg
        viewBox="0 0 500 500"
        className="w-full h-full opacity-40 select-none"
        style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
      >
        {/* Simplified Campus Grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Pathways */}
        <path
          d="M 200,150 L 350,250 M 200,150 L 150,350 M 200,150 L 200,50"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.2"
          strokeDasharray="4 4"
        />

        {/* Buildings */}
        {buildings.map((b) => (
          <motion.g
            key={b.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            className="cursor-pointer"
          >
            <circle cx={b.x} cy={b.y} r="8" fill={b.color} />
            <circle cx={b.x} cy={b.y} r="15" fill={b.color} fillOpacity="0.15" />
            <text
              x={b.x}
              y={b.y + 25}
              textAnchor="middle"
              className="text-[10px] fill-white/60 font-medium tracking-tight"
            >
              {b.name}
            </text>
          </motion.g>
        ))}
      </svg>

      {/* Legend / Overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button className="p-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 backdrop-blur-md transition-colors">
          <Info className="w-5 h-5 text-white/70" />
        </button>
      </div>
    </div>
  );
}
