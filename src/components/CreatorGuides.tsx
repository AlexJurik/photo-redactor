import { Send } from 'lucide-react';

interface CreatorGuidesProps {
  guideType: 'none' | 'profile-circle' | 'story-ui';
}

export default function CreatorGuides({ guideType }: CreatorGuidesProps) {
  if (guideType === 'none') return null;

  if (guideType === 'profile-circle') {
    return (
      <div className="absolute inset-0 w-full h-full pointer-events-none z-30">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <mask id="avatar-circle-mask">
              {/* White area retains visible image */}
              <rect width="100" height="100" fill="white" />
              {/* Black circle cuts out transparent hole */}
              <circle cx="50" cy="50" r="48" fill="black" />
            </mask>
          </defs>
          
          {/* Dark overlay with mask */}
          <rect
            width="100"
            height="100"
            fill="#090a0f"
            fillOpacity="0.75"
            mask="url(#avatar-circle-mask)"
          />
          
          {/* Guide outline */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="0.6"
            strokeDasharray="1.5 1"
            className="opacity-80"
          />
        </svg>

        {/* Floating badge helper */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-violet-600/90 text-white text-[10px] uppercase font-bold tracking-widest rounded-full shadow-lg backdrop-blur-sm border border-violet-400/20">
          Avatar Safe Zone
        </div>
      </div>
    );
  }

  if (guideType === 'story-ui') {
    return (
      <div className="absolute inset-0 w-full h-full pointer-events-none z-30 flex flex-col justify-between p-4 font-sans select-none bg-black/10">
        {/* Mock Top Status & Profile Bar */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Instagram Story Progress Lines */}
          <div className="w-full flex gap-1 h-0.5 px-0.5">
            <div className="flex-1 bg-white rounded-full"></div>
            <div className="flex-1 bg-white/40 rounded-full"></div>
          </div>
          
          {/* Simulated User Info Row */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-violet-600 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-neutral-900 border border-black/40 flex items-center justify-center text-[10px] font-bold">
                  IG
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold tracking-wide drop-shadow-md">your_profile</span>
                <span className="text-[8px] text-white/80 drop-shadow-md leading-none">Sponsored</span>
              </div>
            </div>
            
            {/* Options button (Dots) */}
            <div className="flex gap-0.5 text-white/90 px-1 font-bold text-sm drop-shadow-md">
              <span>•</span><span>•</span><span>•</span>
            </div>
          </div>
        </div>

        {/* Mock Bottom Message / Reply Container */}
        <div className="w-full flex items-center gap-3">
          {/* Rounded input box */}
          <div className="flex-1 bg-[#090a0f]/40 backdrop-blur border border-white/10 rounded-full py-2.5 px-4 text-[11px] text-white/70 flex items-center shadow-lg">
            Send message...
          </div>
          
          {/* Send/Share circle button */}
          <div className="flex items-center justify-center w-9 h-9 bg-[#090a0f]/40 backdrop-blur border border-white/10 rounded-full text-white/90 shadow-lg">
            <Send className="w-4 h-4 -rotate-12 translate-x-px -translate-y-px" />
          </div>
        </div>

        {/* Centered Safe Area grid guide border */}
        <div className="absolute inset-x-6 top-16 bottom-18 border border-dashed border-red-500/25 rounded-xl flex items-center justify-center">
          <span className="text-[9px] font-mono text-red-400 bg-[#090a0f]/80 px-2 py-0.5 rounded border border-red-500/20 shadow">
            Story Text Safe Area
          </span>
        </div>
      </div>
    );
  }

  return null;
}
