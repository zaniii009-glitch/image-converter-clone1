import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CommonHeader } from '../components/CommonHeader';

const RotateImage = ({ darkMode = false, setDarkMode = () => {} }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (!result) return;
        setImageSrc(result);
        setRotation(0);
        setFlipX(false);
        setFlipY(false);
        setZoom(100);
        setImagePosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const rotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const rotateRight = () => setRotation((prev) => (prev + 90) % 360);
  const flipHorizontal = () => setFlipX((prev) => !prev);
  const flipVertical = () => setFlipY((prev) => !prev);
  const zoomIn = () => setZoom((prev) => Math.min(prev + 10, 300));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 10, 20));

  const handleMouseDown = (e) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !imageSrc) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setImagePosition((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, imageSrc, dragStart.x, dragStart.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleReset = () => {
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setZoom(100);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleChangeImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleDownload = () => {
    if (!imageSrc) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxWidth = 1200;
      const scale = Math.min(1, maxWidth / img.width);
      const width = img.width * scale;
      const height = img.height * scale;

      canvas.width = width;
      canvas.height = height;

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.drawImage(img, -width / 2, -height / 2, width, height);
      ctx.restore();

      const link = document.createElement('a');
      link.download = 'transformed-image.png';
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = imageSrc;
  };

  return (
    <>
      <CommonHeader darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} pt-24`}>
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-2">Rotate & Transform Image</h1>
            <p className={`text-center mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Rotate, flip, and zoom your images with precision. Download in high quality.
            </p>

            {/* Controls */}
            <div className={`mb-6 p-4 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                  onClick={rotateLeft}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  ↺ Rotate Left
                </button>
                <button
                  onClick={rotateRight}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Rotate Right ↻
                </button>
                <button
                  onClick={flipHorizontal}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    flipX
                      ? 'bg-green-600 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  🔄 Flip H
                </button>
                <button
                  onClick={flipVertical}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    flipY
                      ? 'bg-green-600 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  🔄 Flip V
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  🔄 Reset
                </button>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={zoomOut}
                  disabled={zoom <= 20}
                  className={`p-2 rounded-full ${
                    zoom <= 20
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  −
                </button>
                <span className="text-lg font-medium w-20 text-center">{zoom}%</span>
                <button
                  onClick={zoomIn}
                  disabled={zoom >= 300}
                  className={`p-2 rounded-full ${
                    zoom >= 300
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  +
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              {imageSrc ? (
                <div>
                  <div
                    ref={containerRef}
                    className="relative w-full h-96 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-move"
                    onMouseDown={handleMouseDown}
                  >
                    <img
                      src={imageSrc}
                      alt="Transformed"
                      className="max-w-none"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) translate(-50%, -50%) rotate(${rotation}deg) scale(${zoom / 100}) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
                        cursor: isDragging ? 'grabbing' : 'move',
                        transition: isDragging ? 'none' : 'transform 0.2s ease',
                      }}
                    />
                  </div>

                  <div className="mt-6 flex justify-center gap-4">
                    <button
                      onClick={handleDownload}
                      className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download Image
                    </button>
                    <button
                      onClick={handleChangeImage}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      Change Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">Upload an Image to Transform</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Supports JPG, PNG, WEBP</p>
                  <button
                    onClick={handleChangeImage}
                    className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors"
                  >
                    Choose Image
                  </button>
                </div>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
          </div>
        </div>

        {/* FOOTER */}
        <footer className={`${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'} border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} mt-12`}>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Rotate Image
                </h3>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Rotate, flip, and transform your images effortlessly with our free online image rotation tool.
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
                © {new Date().getFullYear()} Rotate Image — All rights reserved
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default RotateImage;