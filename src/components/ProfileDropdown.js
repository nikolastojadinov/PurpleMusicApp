import React, { useState, useRef, useEffect } from 'react';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePiNetworkLogin = () => {
    console.log('Pi Network Login clicked');
    // TODO: Implement Pi Network authentication
    setIsOpen(false);
  };

  const handleGoPremium = () => {
    console.log('Go Premium clicked');
    // TODO: Implement premium upgrade
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <span className="text-white text-sm">👤</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-50 overflow-hidden">
          {/* Arrow pointer */}
          <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 rotate-45"></div>
          
          <div className="py-2">
            {/* Pi Network Login Button */}
            <button
              onClick={handlePiNetworkLogin}
              className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-3 group"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <span className="text-black font-bold text-sm">π</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Login with Pi Network</div>
                <div className="text-xs text-gray-400">Connect your Pi account</div>
              </div>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-700 my-1"></div>

            {/* Go Premium Button */}
            <button
              onClick={handleGoPremium}
              className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-3 group"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <span className="text-white font-bold text-sm">⭐</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Go Premium</div>
                <div className="text-xs text-gray-400">Upgrade your experience</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}