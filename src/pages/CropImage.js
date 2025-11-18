import React, { useState, useRef, useCallback, useEffect } from 'react';

const CropImage = ({ darkMode = false, setDarkMode = () => {} }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [aspectRatio, setAspectRatio] = useState('FreeForm');
  const [croppedImage, setCroppedImage] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, crop: null });

  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
  const secondaryText = darkMode ? 'text-gray-400' : 'text-gray-600';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (!result) return;
        setImageSrc(result);
        setCroppedImage(null);

        const img = new Image();
        img.onload = () => {
          const maxWidth = Math.min(img.width, 600);
          const maxHeight = Math.min(img.height, 600);
          setCrop({
            x: (img.width - maxWidth) / 2,
            y: (img.height - maxHeight) / 2,
            width: maxWidth,
            height: maxHeight,
          });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e) => {
    if (!containerRef.current || !imageSrc) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= crop.x && x <= crop.x + crop.width && y >= crop.y && y <= crop.y + crop.height) {
      setIsResizing(true);
      setActiveHandle('move');
      setResizeStart({ x, y, crop: { ...crop } });
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !activeHandle || !containerRef.current || !imageSrc) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const img = imageRef.current;
    if (!img) return;

    const { crop: startCrop } = resizeStart;
    let newCrop = { ...crop };
    const minSize = 30;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    if (activeHandle === 'move') {
      const dx = x - resizeStart.x;
      const dy = y - resizeStart.y;
      newCrop.x = clamp(startCrop.x + dx, 0, imgWidth - startCrop.width);
      newCrop.y = clamp(startCrop.y + dy, 0, imgHeight - startCrop.height);
    }

    newCrop.x = clamp(newCrop.x, 0, imgWidth - newCrop.width);
    newCrop.y = clamp(newCrop.y, 0, imgHeight - newCrop.height);
    newCrop.width = Math.max(minSize, newCrop.width);
    newCrop.height = Math.max(minSize, newCrop.height);

    setCrop(newCrop);
  }, [isResizing, activeHandle, resizeStart, crop, imageSrc]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      const moveHandler = (e) => handleMouseMove(e);
      const upHandler = () => handleMouseUp();
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
      return () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const updateCropSize = (newWidth, newHeight) => {
    if (!imageRef.current) return;
    let w = newWidth !== null ? newWidth : crop.width;
    let h = newHeight !== null ? newHeight : crop.height;

    const img = imageRef.current;
    w = Math.min(Math.max(10, w), img.naturalWidth - crop.x);
    h = Math.min(Math.max(10, h), img.naturalHeight - crop.y);

    setCrop((prev) => ({ ...prev, width: Math.round(w), height: Math.round(h) }));
  };

  const updateCropPosition = (newX, newY) => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const clampedX = Math.max(0, Math.min(newX, img.naturalWidth - crop.width));
    const clampedY = Math.max(0, Math.min(newY, img.naturalHeight - crop.height));
    setCrop((prev) => ({ ...prev, x: Math.round(clampedX), y: Math.round(clampedY) }));
  };

  const handleCrop = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    if (!ctx || !img) return;

    canvas.width = crop.width;
    canvas.height = crop.height;
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    setCroppedImage(canvas.toDataURL('image/png'));
  };

  const handleDownload = () => {
    if (!croppedImage) return;
    const link = document.createElement('a');
    link.download = 'cropped-image.png';
    link.href = croppedImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetCrop = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    let maxWidth = Math.min(naturalWidth, 600);
    let maxHeight = Math.min(naturalHeight, 600);

    setCrop({
      x: Math.max(0, Math.round((naturalWidth - maxWidth) / 2)),
      y: Math.max(0, Math.round((naturalHeight - maxHeight) / 2)),
      width: maxWidth,
      height: maxHeight,
    });
    setAspectRatio('FreeForm');
    setCroppedImage(null);
  };

  const imgSize = imageRef.current
    ? { width: imageRef.current.naturalWidth, height: imageRef.current.naturalHeight }
    : { width: 0, height: 0 };

  return (
    <div className={`min-h-screen flex flex-col ${bgColor} ${textColor}`}>
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-center mb-2">Image Crop</h1>
        <p className={`text-center mb-6 ${secondaryText}`}>
          Select and crop any area of your image with precision. Supports custom aspect ratios.
        </p>

        <div className="max-w-7xl mx-auto flex gap-8">
          <div className={`w-80 ${cardBg} rounded-xl shadow-lg p-6`}>
            <h2 className="text-xl font-bold mb-6">Crop Rectangle</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Width (px)</label>
                <input
                  type="number"
                  value={crop.width}
                  onChange={(e) => updateCropSize(e.target.value ? parseInt(e.target.value) : 10, null)}
                  className={`w-full px-3 py-2 rounded border ${inputBg}`}
                  min="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Height (px)</label>
                <input
                  type="number"
                  value={crop.height}
                  onChange={(e) => updateCropSize(null, e.target.value ? parseInt(e.target.value) : 10)}
                  className={`w-full px-3 py-2 rounded border ${inputBg}`}
                  min="10"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className={`w-full px-3 py-2 rounded border ${inputBg}`}
              >
                <option value="FreeForm">FreeForm</option>
                <option value="1:1">1:1</option>
                <option value="4:3">4:3</option>
                <option value="16:9">16:9</option>
              </select>
            </div>

            <h3 className="text-lg font-semibold mb-4">Crop Position</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Position X (px)</label>
                <input
                  type="number"
                  value={crop.x}
                  onChange={(e) => updateCropPosition(e.target.value ? parseInt(e.target.value) : 0, crop.y)}
                  className={`w-full px-3 py-2 rounded border ${inputBg}`}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Position Y (px)</label>
                <input
                  type="number"
                  value={crop.y}
                  onChange={(e) => updateCropPosition(crop.x, e.target.value ? parseInt(e.target.value) : 0)}
                  className={`w-full px-3 py-2 rounded border ${inputBg}`}
                  min="0"
                />
              </div>
            </div>

            <div className={`p-4 mb-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="text-sm">
                <strong>Original Image:</strong> {imgSize.width} × {imgSize.height} px
              </p>
            </div>

            <button
              onClick={resetCrop}
              className={`w-full py-2.5 rounded-lg mb-4 ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} transition-colors font-medium`}
            >
              Reset
            </button>

            <button
              onClick={handleCrop}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Crop & Download →
            </button>
          </div>

          <div className="flex-1">
            {!imageSrc ? (
              <div className={`${cardBg} rounded-xl shadow-lg p-12 text-center`}>
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <h3 className="text-2xl font-semibold mb-2">Upload an Image to Crop</h3>
                <p className={`${secondaryText} mb-6`}>Supports JPG, PNG, WEBP, and more</p>
                <label className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors text-lg">
                  Choose Image
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                </label>
              </div>
            ) : (
              <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
                <div
                  ref={containerRef}
                  className="relative inline-block border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden rounded-lg cursor-crosshair"
                  style={{ maxWidth: '100%', backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}
                  onMouseDown={handleMouseDown}
                >
                  <img ref={imageRef} src={imageSrc} alt="Original" style={{ display: 'block', maxWidth: '100%', userSelect: 'none' }} />

                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${crop.y}px`, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: `${crop.y + crop.height}px`, left: 0, width: '100%', height: `calc(100% - ${crop.y + crop.height}px)`, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: `${crop.y}px`, left: 0, width: `${crop.x}px`, height: `${crop.height}px`, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: `${crop.y}px`, right: 0, width: `calc(100% - ${crop.x + crop.width}px)`, height: `${crop.height}px`, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }} />

                  <div
                    className="absolute border-2 border-indigo-500 pointer-events-auto"
                    style={{
                      left: `${crop.x}px`,
                      top: `${crop.y}px`,
                      width: `${crop.width}px`,
                      height: `${crop.height}px`,
                      cursor: isResizing ? 'grabbing' : 'move',
                    }}
                  />
                </div>
              </div>
            )}

            {croppedImage && (
              <div className={`mt-6 ${cardBg} rounded-xl shadow-lg p-6`}>
                <h3 className="text-lg font-semibold mb-4">Cropped Result</h3>
                <div className="flex justify-center mb-4">
                  <img src={croppedImage} alt="Cropped" className="max-w-full h-auto rounded border border-gray-300 dark:border-gray-600" />
                </div>
                <button onClick={handleDownload} className="w-full bg-teal-600 text-white py-2.5 rounded-lg hover:bg-teal-700 transition-colors font-medium">
                  Download Cropped Image
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className={`${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'} border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} mt-12`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Crop Image</h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Crop and trim your images precisely with our easy-to-use online cropping tool.
              </p>
            </div>

            <div>
              <h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tools</h4>
              <ul className="space-y-1.5">
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Image Compressor</a></li>
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Crop Image</a></li>
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Resize Image</a></li>
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Color Picker</a></li>
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Collage Maker</a></li>
              </ul>
            </div>

            <div>
              <h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>More Tools</h4>
              <ul className="space-y-1.5">
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>PNG Converter</a></li>
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>JPG Converter</a></li>
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>WEBP Converter</a></li>
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>HEIC Converter</a></li>
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
              © {new Date().getFullYear()} Crop Image — All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CropImage;