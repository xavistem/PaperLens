import { useState } from 'react';

interface LogoSplashProps {
  onComplete: () => void;
}

export const LogoSplash = ({ onComplete }: LogoSplashProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      // Simple transition - just wait a bit and complete
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  if (isAnimating) {
    return null; // Just disappear
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Logo */}
      <div 
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={handleClick}
      >
        <img 
          src="/logo.png" 
          alt="PaperLens Logo"
          className="w-80 h-80 hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Click instruction */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-lg font-light animate-pulse">
        Click to continue
      </div>
    </div>
  );
};

