// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useImageConverter } from './components/ImageConverterLogic';
import { ImageConverterUI } from './components/ImageConverterUI';
import { ColorPicker } from './components/ColorPicker';

function App() {
  const logic = useImageConverter();

  return (
    <Router>
      <div
        className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${
          logic.darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}
        onClick={(e) => {
          if (!e.target.closest('.format-dropdown')) logic.setShowFormatMenu(false);
          if (!e.target.closest('.file-dropdown')) logic.setShowFileDropdown(false);
        }}
      >
        <Routes>
          {/* اصل Image Converter */}
          <Route path="/" element={<ImageConverterUI {...logic} />} />

          {/* Color Picker صفحہ */}
          <Route
            path="/color-picker"
            element={
              <ColorPicker
                darkMode={logic.darkMode}
                setDarkMode={logic.setDarkMode}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;