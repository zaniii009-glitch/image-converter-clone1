// src/pages/ImageResizer.js
import React, { useState, useRef, useEffect } from 'react';
import { CommonHeader } from '../components/CommonHeader';

const ImageResizer = ({ darkMode, setDarkMode }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [resizedImage, setResizedImage] = useState(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [aspectRatio, setAspectRatio] = useState('FreeForm');
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });

  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const inputBg = darkMode
    ? 'bg-gray-700 border-gray-600 text-white'
    : 'bg-white border-gray-300 text-gray-900';
  const secondaryText = darkMode ? 'text-gray-400' : 'text-gray-600';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (!result) return;
        setImageSrc(result);
        setResizedImage(null);

        const img = new Image();
        img.onload = () => {
          setOriginalSize({ width: img.width, height: img.height });
          setWidth(img.width);
          setHeight(img.height);
          setAspectRatio('FreeForm');
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const updateDimensions = (newWidth, newHeight) => {
    let w = newWidth;
    let h = newHeight;

    if (aspectRatio !== 'FreeForm') {
      const ratios = { '1:1': 1, '4:3': 4 / 3, '16:9': 16 / 9 };
      const ratio = ratios[aspectRatio];
      if (ratio) {
        if (w !== null && !isNaN(w)) {
          h = Math.round(w / ratio);
        } else if (h !== null && !isNaN(h)) {
          w = Math.round(h * ratio);
        }
      }
    }

    if (w !== null && !isNaN(w)) setWidth(w);
    if (h !== null && !isNaN(h)) setHeight(h);
  };

  const handleWidthChange = (e) => {
    const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
    updateDimensions(val, null);
  };

  const handleHeightChange = (e) => {
    const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
    updateDimensions(null, val);
  };

  const resizeImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx || !img) return;

    const safeW = Math.max(1, width || 1);
    const safeH = Math.max(1, height || 1);

    canvas.width = safeW;
    canvas.height = safeH;
    ctx.drawImage(img, 0, 0, safeW, safeH);
    setResizedImage(canvas.toDataURL('image/png'));
  };

  const handleDownload = () => {
    if (!resizedImage) return;
    const link = document.createElement('a');
    link.download = 'resized-image.png';
    link.href = resizedImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      const timer = setTimeout(resizeImage, 300);
      return () => clearTimeout(timer);
    }
  }, [width, height, imageSrc]);

  return (
    <>
      <CommonHeader darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className={`min-h-screen flex flex-col pt-24 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex-1 p-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Image Resizer</h1>
            <p className={`text-lg ${secondaryText}`}>
              Upload your image and adjust size to any dimension. Supports multiple formats.
            </p>
          </div>

          <div className="max-w-7xl mx-auto flex gap-8">
            <div className={`w-80 ${cardBg} rounded-xl shadow-lg p-6`}>
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
                    className={`w-full px-2 py-1.5 text-sm rounded border ${inputBg}`}
                    placeholder="Width"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={handleHeightChange}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${inputBg}`}
                    placeholder="Height"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium mb-1">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className={`w-full px-2 py-1.5 text-sm rounded border ${inputBg}`}
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
                      ? darkMode
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : darkMode
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                        style={{
                          display: 'block',
                          maxWidth: '100%',
                          maxHeight: '400px',
                          objectFit: 'contain',
                        }}
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

        <footer className={`${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'} border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} mt-12`}>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Image Resizer
                </h3>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Resize your images to any dimension instantly with our free online resizer tool.
                </p>
              </div>

              <div>
                <h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tools</h4>
                <ul className="space-y-1.5">
                  <li><a href="/image-compressor" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Image Compressor</a></li>
                  <li><a href="/crop-image" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Crop Image</a></li>
                  <li><a href="/image-resizer" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Resize Image</a></li>
                  <li><a href="/color-picker" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Color Picker</a></li>
                  <li><a href="/collage-maker" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Collage Maker</a></li>
                </ul>
              </div>

              <div>
                <h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>More Tools</h4>
                <ul className="space-y-1.5">
                  <li><a href="/convert/png" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>PNG Converter</a></li>
                  <li><a href="/convert/jpg" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>JPG Converter</a></li>
                  <li><a href="/convert/webp" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>WEBP Converter</a></li>
                  <li><a href="/convert/heic" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>HEIC Converter</a></li>
                </ul>
              </div>

              <div>
                <h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Resources</h4>
                <ul className="space-y-1.5">
                  <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>FAQ</a></li>
                  <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Privacy Policy</a></li>
                  <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Terms & Conditions</a></li>
                </ul>
              </div>
            </div>

            <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <p className={`text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                © {new Date().getFullYear()} Image Resizer — All rights reserved
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ImageResizer;