import React, { useState } from 'react';
import { LogoSplash } from './components/LogoSplash';
import { ModeSelector } from './components/ModeSelector';
import ResearcherMode from './components/modes/ResearcherMode';
import JournalistMode from './components/modes/JournalistMode';
import './App.css';

type AppState = 'splash' | 'home' | 'researcher' | 'journalist' | 'general' | 'editor';

function App() {
  const [currentView, setCurrentView] = useState<AppState>('splash');

  const handleSplashComplete = () => {
    setCurrentView('home');
  };

  const handleModeSelect = (modeId: string) => {
    setCurrentView(modeId as AppState);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  // Show splash screen first
  if (currentView === 'splash') {
    return <LogoSplash onComplete={handleSplashComplete} />;
  }

  // Show mode-specific pages
  switch (currentView) {
    case 'researcher':
      return <ResearcherMode onBack={handleBackToHome} />;
    
    case 'journalist':
      return <JournalistMode onBack={handleBackToHome} />;
    
    case 'general':
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">General User Mode</h1>
            <p className="text-gray-600 mb-6">Simple paper integrity checking for everyone</p>
            <p className="text-sm text-gray-500">Coming soon...</p>
            <button 
              onClick={handleBackToHome}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    
    case 'editor':
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Journal Editor Mode</h1>
            <p className="text-gray-600 mb-6">Advanced editorial review and batch analysis tools</p>
            <p className="text-sm text-gray-500">Coming soon...</p>
            <button 
              onClick={handleBackToHome}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    
    default:
      // Show home page with mode selector
      return <ModeSelector onModeSelect={handleModeSelect} />;
  }
}

export default App;
