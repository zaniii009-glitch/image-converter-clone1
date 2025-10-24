// src/App.js
import React from 'react';
import { useImageConverter } from './components/ImageConverterLogic';
import { ImageConverterUI } from './components/ImageConverterUI';

function App() {
  const logic = useImageConverter();
  return (
    <div
      className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${
        logic.darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}
      onClick={(e) => {
        if (!e.target.closest('.format-dropdown')) logic.setShowFormatMenu(false);
        if (!e.target.closest('.file-dropdown')) logic.setShowFileDropdown(false);
      }}
    >
      <ImageConverterUI {...logic} />
    </div>
  );
}

export default App;