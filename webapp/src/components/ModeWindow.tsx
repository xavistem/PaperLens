interface Mode {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  position: string;
}

interface ModeWindowProps {
  mode: Mode;
  index: number;
  isVisible: boolean;
  onClick: () => void;
}

export const ModeWindow = ({ mode, index, isVisible, onClick }: ModeWindowProps) => {
  return (
    <div 
      className={`bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden cursor-pointer transition-all duration-500 ease-out transform hover:scale-105 hover:shadow-3xl ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
      style={{
        transitionDelay: `${index * 100}ms`
      }}
      onClick={onClick}
    >
      {/* macOS Window Header */}
      <div className="flex items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      </div>

      {/* Window Content */}
      <div className="p-6">
        <div className={`w-12 h-12 ${mode.color} rounded-lg mb-4 flex items-center justify-center`}>
          <div className="w-6 h-6 bg-white rounded opacity-80"></div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {mode.title}
        </h3>
        
        <p className="text-base text-gray-600 mb-3">
          {mode.subtitle}
        </p>
        
        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          {mode.description}
        </p>

        <div className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
          <span className="text-sm font-medium">Launch Mode</span>
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
