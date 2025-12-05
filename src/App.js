// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useImageConverter } from './components/ImageConverterLogic';
import { ImageConverterUI } from './components/ImageConverterUI';

const ImageResizer = React.lazy(() => import('./pages/ImageResizer'));
const RotateImage = React.lazy(() => import('./pages/RotateImage'));
const CropImage = React.lazy(() => import('./pages/CropImage'));
const ImageCompressor = React.lazy(() => import('./pages/ImageCompressor'));
const CollageMaker = React.lazy(() => import('./pages/CollageMaker'));
const ColorPicker = React.lazy(() => import('./pages/ColorPicker'));

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
        <React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<ImageConverterUI {...logic} />} />
            <Route
              path="/rotate-image"
              element={<RotateImage darkMode={logic.darkMode} setDarkMode={logic.setDarkMode} />}
            />
            <Route
              path="/image-resizer"
              element={<ImageResizer darkMode={logic.darkMode} setDarkMode={logic.setDarkMode} />}
            />
            <Route
              path="/crop-image"
              element={<CropImage darkMode={logic.darkMode} setDarkMode={logic.setDarkMode} />}
            />
            <Route
              path="/image-compressor"
              element={<ImageCompressor darkMode={logic.darkMode} setDarkMode={logic.setDarkMode} />}
            />
            <Route
              path="/collage-maker"
              element={<CollageMaker darkMode={logic.darkMode} setDarkMode={logic.setDarkMode} />}
            />
            <Route
              path="/color-picker"
              element={<ColorPicker darkMode={logic.darkMode} setDarkMode={logic.setDarkMode} />}
            />
          </Routes>
        </React.Suspense>
      </div>
    </Router>
  );
}

export default App;