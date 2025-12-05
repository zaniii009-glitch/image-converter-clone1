import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const CommonHeader = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation(); // 👈 Get current route

  const headerTools = [
    { name: 'Image Converter', link: '/', short: 'Converter' },
    { name: 'Image Resizer', link: '/image-resizer', short: 'Resize' },
    { name: 'Crop Image', link: '/crop-image', short: 'Crop' },
    { name: 'Xe Image Compressor', link: '/image-compressor', short: 'Compress' },
    { name: 'Color Picker', link: '/color-picker', short: 'Color Picker' },
    { name: 'Collage Maker', link: '/collage-maker', short: 'Collage' },
    { name: 'Rotate Image', link: '/rotate-image', short: 'Rotate' }
  ];

  // Helper: Check if current path matches a route (exact or partial)
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className={`${darkMode ? 'bg-indigo-900' : 'bg-indigo-700'} shadow-lg fixed top-0 left-0 right-0 z-50`}>
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Image Converter</h1>

          {/* Centered, smaller, consistent buttons */}
          <div className="hidden md:flex items-center justify-center flex-1 gap-2">
            {headerTools.map((t) => (
              <button
                key={t.name}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(t.link);
                }}
                className={`transition-colors font-medium text-sm px-2.5 py-1.5 rounded whitespace-nowrap ${
                  isActive(t.link)
                    ? 'text-white border-b-2 border-white' // ✅ White + underline
                    : 'text-indigo-200 hover:text-white'
                }`}
                title={t.name}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Right side: Dark mode, Login, Sign Up */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${
                darkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-yellow-300'
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            <button className={`px-4 py-2 bg-indigo-800 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium`}>
              Sign Up
            </button>
            <button className={`text-indigo-200 hover:text-white px-4 py-2 transition-colors font-medium`}>
              Login
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};