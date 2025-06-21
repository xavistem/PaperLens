import { useState, useEffect } from 'react';
import { ModeWindow } from '@/components/ModeWindow';

interface ModeSelectorProps {
  onModeSelect: (modeId: string) => void;
}

const modes = [
  {
    id: 'researcher',
    title: 'Researcher',
    subtitle: 'Assess structural integrity',
    description: 'Evaluate papers before citing or submitting',
    color: 'bg-blue-500',
    position: 'top-left'
  },
  {
    id: 'journalist',
    title: 'Journalist', 
    subtitle: 'Fact-check scientific claims',
    description: 'Verify stability before reporting',
    color: 'bg-red-500',
    position: 'top-right'
  },
  {
    id: 'general',
    title: 'General User',
    subtitle: 'Understand papers simply',
    description: 'Get plain language summaries with audio',
    color: 'bg-green-500',
    position: 'bottom-left'
  },
  {
    id: 'editor',
    title: 'Journal Editor',
    subtitle: 'Automated integrity checks',
    description: 'Initial screening for submissions',
    color: 'bg-purple-500',
    position: 'bottom-right'
  }
];

export const ModeSelector = ({ onModeSelect }: ModeSelectorProps) => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Simple appearance
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleModeSelect = (modeId: string) => {
    setSelectedMode(modeId);
    onModeSelect(modeId);
  };

  return (
    <div className="fixed inset-0 bg-white bg-dot-pattern">
      {/* Logo in top-left corner */}
      <div className="absolute top-8 left-8 w-32 h-32">
        <img 
          src="/logo.png" 
          alt="PaperLens Logo"
          className="w-full h-full"
        />
      </div>

      {/* Mode Grid */}
      <div className="flex items-center justify-center min-h-screen p-16">
        <div className="grid grid-cols-2 gap-6 max-w-3xl w-full">
          {modes.map((mode, index) => (
            <ModeWindow
              key={mode.id}
              mode={mode}
              index={index}
              isVisible={isVisible}
              onClick={() => handleModeSelect(mode.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
