import { useState } from 'react';
import { LogoSplash } from '@/components/LogoSplash';
import { ModeSelector } from '@/components/ModeSelector';

const Index = () => {
  const [showModes, setShowModes] = useState(false);

  const handleLogoClick = () => {
    setShowModes(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <LogoSplash isActive={!showModes} onLogoClick={handleLogoClick} />
      <ModeSelector isVisible={showModes} />
    </div>
  );
};

export default Index;
