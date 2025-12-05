import React, { useState, useRef, useEffect } from 'react';
import { CommonHeader } from '../components/CommonHeader';

const CollageMaker = ({ darkMode = false, setDarkMode = () => {} }) => {
  const [images, setImages] = useState([]);
  const [collageImage, setCollageImage] = useState(null);
  const [layout, setLayout] = useState('3x3');
  const [spacing, setSpacing] = useState(30);
  const [bgColor, setBgColor] = useState('#FFFFFF');

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      alert('Please select image files only.');
      return;
    }

    const newImages = [];
    let loadedCount = 0;

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          newImages.push({
            id: Date.now() + Math.random(),
            src: event.target?.result,
            file,
            width: img.width,
            height: img.height,
          });
          loadedCount++;
          if (loadedCount === imageFiles.length) {
            setImages((prev) => [...prev, ...newImages].slice(0, 9));
          }
        };
        img.src = event.target?.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const createCollage = async () => {
    if (images.length === 0) {
      setCollageImage(null);
      return;
    }

    try {
      const [rows, cols] = layout.split('x').map(Number);
      const totalCells = rows * cols;
      const cellSize = 200;
      const padding = spacing;
      const canvasWidth = cols * cellSize + (cols - 1) * padding;
      const canvasHeight = rows * cellSize + (rows - 1) * padding;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      for (let i = 0; i < Math.min(images.length, totalCells); i++) {
        const img = new Image();
        img.src = images[i].src;
        await new Promise((resolve) => {
          img.onload = () => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * (cellSize + padding);
            const y = row * (cellSize + padding);
            ctx.drawImage(img, x, y, cellSize, cellSize);
            resolve();
          };
          img.onerror = resolve;
        });
      }

      setCollageImage(canvas.toDataURL('image/png'));
    } catch (error) {
      console.error('Error creating collage:', error);
      setCollageImage(null);
    }
  };

  const handleDownload = () => {
    if (!collageImage) return;
    const link = document.createElement('a');
    link.download = 'collage.png';
    link.href = collageImage;
    link.click();
  };

  const handleReset = () => {
    setImages([]);
    setCollageImage(null);
    setLayout('3x3');
    setSpacing(30);
    setBgColor('#FFFFFF');
  };

  const presetColors = [
    '#FFFFFF', '#000000', '#F5F5F5', '#4F46E5', '#10B981', '#F59E0B',
    '#EF4444', '#EC4899',
  ];

  useEffect(() => {
    if (images.length > 0) {
      createCollage();
    } else {
      setCollageImage(null);
    }
  }, [images, layout, spacing, bgColor]);

  return (
    <>
      <CommonHeader darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} pt-24`}>
        <div className="flex-1 p-6">
          <h1 className="text-3xl font-bold text-center mb-2">Collage Maker</h1>
          <p className={`text-center mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Create a beautiful photo collage from your favorite images.
          </p>

          <div className="max-w-7xl mx-auto flex gap-8">
            <div className={`w-80 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <label className="w-full bg-green-500 text-white py-2.5 rounded-lg hover:bg-green-600 transition-colors cursor-pointer text-center mb-4 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
              </label>

              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Layout</h3>
                <div className="grid grid-cols-5 gap-2">
                  {['1x1', '1x2', '2x1', '2x2', '3x2', '2x3', '3x3'].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLayout(l)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        layout === l
                          ? 'bg-indigo-500 text-white'
                          : darkMode
                          ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Spacing</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={spacing}
                    onChange={(e) => setSpacing(parseInt(e.target.value))}
                    className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  />
                  <span className="text-sm">{spacing}px</span>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Background Color</h3>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => {
                      const color = prompt('Enter color (hex or name):', bgColor);
                      if (color) setBgColor(color);
                    }}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                  >
                    🖌️ Pick Color
                  </button>
                  <div className="ml-2 flex items-center gap-2">
                    <div
                      className="w-6 h-6 border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: bgColor }}
                    ></div>
                    <span className="text-xs">{bgColor}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBgColor(color)}
                      className={`w-8 h-8 rounded-md border ${
                        bgColor === color
                          ? 'border-2 border-indigo-500'
                          : 'border border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={createCollage}
                  disabled={images.length === 0}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                    images.length > 0
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  🚀 Create Collage
                </button>
                <button
                  onClick={handleReset}
                  disabled={images.length === 0}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                    images.length > 0
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

              <button
                onClick={handleDownload}
                disabled={!collageImage}
                className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                  collageImage
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                📥 Download Collage
              </button>
            </div>

            <div className={`flex-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              {images.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto mb-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">No images added yet</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Upload images to create your collage</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Selected Photos ({images.length})</h3>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {images.map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.src}
                          alt="Preview"
                          className="w-full h-20 object-cover rounded border border-gray-300 dark:border-gray-600"
                        />
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {collageImage && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold mb-2">✅ Collage Preview</h3>
                      <div className="flex justify-center">
                        <img
                          src={collageImage}
                          alt="Collage"
                          className="max-w-full h-auto rounded border border-gray-300 dark:border-gray-600"
                          style={{ maxHeight: '400px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className={`${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'} border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} mt-12`}>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Collage Maker
                </h3>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Create stunning photo collages with custom layouts and backgrounds using our free online tool.
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
                © {new Date().getFullYear()} Collage Maker — All rights reserved
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default CollageMaker;