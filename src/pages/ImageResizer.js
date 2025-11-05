// src/pages/ImageResizer.jsx
import React, { useState, useRef, useEffect } from 'react';

const ImageResizer = ({ darkMode, setDarkMode }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [resizedImage, setResizedImage] = useState(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [aspectRatio, setAspectRatio] = useState('FreeForm');
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });

  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result || null);
        setResizedImage(null);
        const img = new Image();
        img.onload = () => {
          const w = img.width;
          const h = img.height;
          setOriginalSize({ width: w, height: h });
          setWidth(w);
          setHeight(h);
          setAspectRatio('FreeForm'); // ہمیشہ اپ لوڈ پر FreeForm
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const updateDimensions = (newWidth, newHeight) => {
    let updatedWidth = newWidth;
    let updatedHeight = newHeight;

    if (aspectRatio !== 'FreeForm') {
      const ratios = {
        '1:1': 1,
        '4:3': 4 / 3,
        '16:9': 16 / 9
      };
      const ratio = ratios[aspectRatio];
      if (ratio) {
        if (updatedWidth !== null && !isNaN(updatedWidth)) {
          updatedHeight = Math.round(updatedWidth / ratio);
        } else if (updatedHeight !== null && !isNaN(updatedHeight)) {
          updatedWidth = Math.round(updatedHeight * ratio);
        }
      }
    }

    if (updatedWidth !== null && !isNaN(updatedWidth)) {
      setWidth(updatedWidth);
    }
    if (updatedHeight !== null && !isNaN(updatedHeight)) {
      setHeight(updatedHeight);
    }
  };

  const handleWidthChange = (e) => {
    const val = e.target.value === '' ? null : parseInt(e.target.value);
    updateDimensions(val, null);
  };

  const handleHeightChange = (e) => {
    const val = e.target.value === '' ? null : parseInt(e.target.value);
    updateDimensions(null, val);
  };

  const resizeImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx || !img) return;

    const safeWidth = Math.max(1, isNaN(width) ? 1 : parseInt(width) || 1);
    const safeHeight = Math.max(1, isNaN(height) ? 1 : parseInt(height) || 1);

    canvas.width = safeWidth;
    canvas.height = safeHeight;

    ctx.drawImage(img, 0, 0, safeWidth, safeHeight);

    setResizedImage(canvas.toDataURL('image/png'));
  };

  const handleDownload = () => {
    if (!resizedImage) return;
    const link = document.createElement('a');
    link.download = 'resized-image.png';
    link.href = resizedImage;
    link.click();
  };

  // 🔁 Reset Function
  const handleReset = () => {
    if (imageSrc) {
      setWidth(originalSize.width);
      setHeight(originalSize.height);
      setAspectRatio('FreeForm');
      setResizedImage(null);
    }
  };

  useEffect(() => {
    if (imageSrc) {
      resizeImage();
    }
  }, [width, height, imageSrc]);

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Title with description */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Image Resizer</h1>
        <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Upload your image and adjust size to any dimension. Supports multiple formats.
        </p>
      </div>

      <div className="max-w-7xl mx-auto flex gap-8">
        {/* بائیں جانب کنٹرولز */}
        <div className={`w-80 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <div className={`p-3 mb-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className="text-xs">
              <strong>Original:</strong> {originalSize.width} × {originalSize.height}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1">Width (px)</label>
              <input
                type="number"
                value={width}
                onChange={handleWidthChange}
                className={`w-full px-2 py-1.5 text-sm rounded border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Width"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Height (px)</label>
              <input
                type="number"
                value={height}
                onChange={handleHeightChange}
                className={`w-full px-2 py-1.5 text-sm rounded border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Height"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium mb-1">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className={`w-full px-2 py-1.5 text-sm rounded border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="FreeForm">FreeForm</option>
              <option value="1:1">1:1</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={resizeImage}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Resize
            </button>
            <button
              onClick={handleReset}
              disabled={!imageSrc}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                imageSrc
                  ? (darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300')
                  : (darkMode
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed')
              }`}
            >
              Reset
            </button>
          </div>

          {resizedImage && (
            <button
              onClick={handleDownload}
              className="w-full mt-3 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
            >
              📥 Download Resized Image
            </button>
          )}
        </div>

        {/* دائیں جانب تصویر */}
        <div className="flex-1">
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6`}>
            {!imageSrc ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">Upload an image to resize</p>
                <label className="inline-block bg-indigo-600 text-white px-4 py-2 mt-3 rounded cursor-pointer hover:bg-indigo-700 text-sm">
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                </label>
              </div>
            ) : (
              <div>
                <div className="relative inline-block border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Original"
                    style={{ display: 'block', maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                  />
                </div>

                {resizedImage && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2">✅ Resized Preview ({width} × {height})</h3>
                    <div className="flex justify-center">
                      <img
                        src={resizedImage}
                        alt="Resized"
                        className="max-w-full h-auto rounded border border-gray-300 dark:border-gray-600"
                        style={{ maxHeight: '200px', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageResizer;