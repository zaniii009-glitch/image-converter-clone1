// src/pages/CropImage.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';

const CropImage = ({ darkMode, setDarkMode }) => {
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result || null);
        setCroppedImage(null);
        const img = new Image();
        img.onload = () => {
          const maxWidth = Math.min(img.width, 600);
          const maxHeight = Math.min(img.height, 600);
          setCrop({
            x: (img.width - maxWidth) / 2,
            y: (img.height - maxHeight) / 2,
            width: maxWidth,
            height: maxHeight
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e) => {
    if (!containerRef.current || !imageSrc) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (
      x >= crop.x &&
      x <= crop.x + crop.width &&
      y >= crop.y &&
      y <= crop.y + crop.height
    ) {
      setIsResizing(true);
      setActiveHandle('move');
      setResizeStart({
        x,
        y,
        crop: { ...crop }
      });
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

    switch (activeHandle) {
      case 'move':
        const dx = x - resizeStart.x;
        const dy = y - resizeStart.y;
        newCrop.x = Math.max(0, Math.min(startCrop.x + dx, imgWidth - startCrop.width));
        newCrop.y = Math.max(0, Math.min(startCrop.y + dy, imgHeight - startCrop.height));
        break;

      case 'top':
        const topDiff = y - resizeStart.y;
        newCrop.y = Math.max(0, Math.min(startCrop.y + topDiff, imgHeight - minSize));
        newCrop.height = startCrop.height - topDiff;
        if (newCrop.height < minSize) {
          newCrop.height = minSize;
          newCrop.y = startCrop.y + startCrop.height - minSize;
        }
        break;

      case 'bottom':
        const bottomDiff = y - resizeStart.y;
        newCrop.height = Math.max(minSize, Math.min(startCrop.height + bottomDiff, imgHeight - startCrop.y));
        break;

      case 'left':
        const leftDiff = x - resizeStart.x;
        newCrop.x = Math.max(0, Math.min(startCrop.x + leftDiff, imgWidth - minSize));
        newCrop.width = startCrop.width - leftDiff;
        if (newCrop.width < minSize) {
          newCrop.width = minSize;
          newCrop.x = startCrop.x + startCrop.width - minSize;
        }
        break;

      case 'right':
        const rightDiff = x - resizeStart.x;
        newCrop.width = Math.max(minSize, Math.min(startCrop.width + rightDiff, imgWidth - startCrop.x));
        break;

      case 'top-left':
        const tlTopDiff = y - resizeStart.y;
        const tlLeftDiff = x - resizeStart.x;
        newCrop.y = Math.max(0, Math.min(startCrop.y + tlTopDiff, imgHeight - minSize));
        newCrop.height = startCrop.height - tlTopDiff;
        if (newCrop.height < minSize) {
          newCrop.height = minSize;
          newCrop.y = startCrop.y + startCrop.height - minSize;
        }
        newCrop.x = Math.max(0, Math.min(startCrop.x + tlLeftDiff, imgWidth - minSize));
        newCrop.width = startCrop.width - tlLeftDiff;
        if (newCrop.width < minSize) {
          newCrop.width = minSize;
          newCrop.x = startCrop.x + startCrop.width - minSize;
        }
        break;

      case 'top-right':
        const trTopDiff = y - resizeStart.y;
        const trRightDiff = x - resizeStart.x;
        newCrop.y = Math.max(0, Math.min(startCrop.y + trTopDiff, imgHeight - minSize));
        newCrop.height = startCrop.height - trTopDiff;
        if (newCrop.height < minSize) {
          newCrop.height = minSize;
          newCrop.y = startCrop.y + startCrop.height - minSize;
        }
        newCrop.width = Math.max(minSize, Math.min(startCrop.width + trRightDiff, imgWidth - newCrop.x));
        break;

      case 'bottom-left':
        const blBottomDiff = y - resizeStart.y;
        const blLeftDiff = x - resizeStart.x;
        newCrop.height = Math.max(minSize, Math.min(startCrop.height + blBottomDiff, imgHeight - startCrop.y));
        newCrop.x = Math.max(0, Math.min(startCrop.x + blLeftDiff, imgWidth - minSize));
        newCrop.width = startCrop.width - blLeftDiff;
        if (newCrop.width < minSize) {
          newCrop.width = minSize;
          newCrop.x = startCrop.x + startCrop.width - minSize;
        }
        break;

      case 'bottom-right':
        const brBottomDiff = y - resizeStart.y;
        const brRightDiff = x - resizeStart.x;
        newCrop.height = Math.max(minSize, Math.min(startCrop.height + brBottomDiff, imgHeight - startCrop.y));
        newCrop.width = Math.max(minSize, Math.min(startCrop.width + brRightDiff, imgWidth - startCrop.x));
        break;

      default:
        break;
    }

    newCrop.x = Math.max(0, newCrop.x);
    newCrop.y = Math.max(0, newCrop.y);
    newCrop.width = Math.min(newCrop.width, imgWidth - newCrop.x);
    newCrop.height = Math.min(newCrop.height, imgHeight - newCrop.y);

    setCrop(newCrop);
  }, [isResizing, activeHandle, resizeStart, crop, imageSrc]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const updateCropSize = (newWidth, newHeight) => {
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
        if (updatedWidth) {
          updatedHeight = updatedWidth / ratio;
        } else if (updatedHeight) {
          updatedWidth = updatedHeight * ratio;
        }
      }
    }

    const img = imageRef.current;
    if (img) {
      updatedWidth = Math.min(updatedWidth, img.width - crop.x);
      updatedHeight = Math.min(updatedHeight, img.height - crop.y);
    }

    setCrop((prev) => ({
      ...prev,
      width: Math.max(10, Math.round(updatedWidth)),
      height: Math.max(10, Math.round(updatedHeight))
    }));
  };

  const updateCropPosition = (newX, newY) => {
    const img = imageRef.current;
    if (!img) return;

    const clampedX = Math.max(0, Math.min(newX, img.width - crop.width));
    const clampedY = Math.max(0, Math.min(newY, img.height - crop.height));

    setCrop((prev) => ({
      ...prev,
      x: Math.round(clampedX),
      y: Math.round(clampedY)
    }));
  };

  const handleCrop = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx || !img) return;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );

    setCroppedImage(canvas.toDataURL('image/png'));
  };

  const handleDownload = () => {
    if (!croppedImage) return;
    const link = document.createElement('a');
    link.download = 'cropped-image.png';
    link.href = croppedImage;
    link.click();
  };

  const getImageSize = () => {
    if (imageRef.current) {
      return {
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      };
    }
    return { width: 0, height: 0 };
  };

  const imgSize = getImageSize();

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* 🎯 ہیڈر — بغیر کنٹینر کے */}
      <h1 className="text-3xl font-bold text-center mb-2">✂️ Image Crop</h1>
      <p className={`text-center mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Select and crop any area of your image with precision. Supports custom aspect ratios.
      </p>

      <div className="max-w-7xl mx-auto flex gap-8">
        {/* بائیں جانب کنٹرولز */}
        <div className={`w-80 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h2 className="text-xl font-bold mb-6">Crop Rectangle</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Width (px)</label>
              <input
                type="number"
                value={crop.width}
                onChange={(e) => updateCropSize(parseInt(e.target.value), null)}
                className={`w-full px-3 py-2 rounded border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                min="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Height (px)</label>
              <input
                type="number"
                value={crop.height}
                onChange={(e) => updateCropSize(null, parseInt(e.target.value))}
                className={`w-full px-3 py-2 rounded border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                min="10"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className={`w-full px-3 py-2 rounded border ${
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

          <h3 className="text-lg font-semibold mb-4">Crop Position</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Position X (px)</label>
              <input
                type="number"
                value={crop.x}
                onChange={(e) => updateCropPosition(parseInt(e.target.value), crop.y)}
                className={`w-full px-3 py-2 rounded border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Position Y (px)</label>
              <input
                type="number"
                value={crop.y}
                onChange={(e) => updateCropPosition(crop.x, parseInt(e.target.value))}
                className={`w-full px-3 py-2 rounded border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
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
            onClick={() => {
              if (imageRef.current) {
                const img = imageRef.current;
                const naturalWidth = img.naturalWidth;
                const naturalHeight = img.naturalHeight;
                
                let maxWidth = Math.min(naturalWidth, 600);
                let maxHeight = Math.min(naturalHeight, 600);
                
                if (naturalWidth > naturalHeight) {
                  maxHeight = Math.round((naturalHeight / naturalWidth) * maxWidth);
                } else {
                  maxWidth = Math.round((naturalWidth / naturalHeight) * maxHeight);
                }

                const x = Math.round((naturalWidth - maxWidth) / 2);
                const y = Math.round((naturalHeight - maxHeight) / 2);

                setCrop({
                  x,
                  y,
                  width: maxWidth,
                  height: maxHeight
                });
                setAspectRatio('FreeForm');
                setCroppedImage(null);
              }
            }}
            className={`w-full py-2.5 rounded-lg mb-4 ${
              darkMode
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            } transition-colors font-medium`}
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

        {/* دائیں جانب تصویر */}
        <div className="flex-1">
          {!imageSrc ? (
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center`}>
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <h3 className="text-2xl font-semibold mb-2">Upload an Image to Crop</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Supports JPG, PNG, WEBP, and more</p>
              <label className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors text-lg">
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
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6`}>
              <div
                ref={containerRef}
                className="relative inline-block border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden rounded-lg cursor-crosshair"
                style={{ maxWidth: '100%', backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}
                onMouseDown={handleMouseDown}
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Original"
                  style={{ display: 'block', maxWidth: '100%', userSelect: 'none' }}
                />

                {imageSrc && (
                  <>
                    {/* Outside overlays */}
                    <div className="absolute" style={{ 
                      left: 0, 
                      top: 0, 
                      width: '100%',
                      height: `${crop.y}px`,
                      background: 'rgba(0,0,0,0.5)',
                      pointerEvents: 'none'
                    }} />
                    <div className="absolute" style={{ 
                      left: 0, 
                      top: `${crop.y + crop.height}px`,
                      width: '100%',
                      height: `calc(100% - ${crop.y + crop.height}px)`,
                      background: 'rgba(0,0,0,0.5)',
                      pointerEvents: 'none'
                    }} />
                    <div className="absolute" style={{ 
                      left: 0,
                      top: `${crop.y}px`,
                      width: `${crop.x}px`,
                      height: `${crop.height}px`,
                      background: 'rgba(0,0,0,0.5)',
                      pointerEvents: 'none'
                    }} />
                    <div className="absolute" style={{ 
                      left: `${crop.x + crop.width}px`,
                      top: `${crop.y}px`,
                      width: `calc(100% - ${crop.x + crop.width}px)`,
                      height: `${crop.height}px`,
                      background: 'rgba(0,0,0,0.5)',
                      pointerEvents: 'none'
                    }} />

                    {/* کروپ باکس */}
                    <div
                      className="absolute border-2 border-indigo-500 pointer-events-auto"
                      style={{
                        left: `${crop.x}px`,
                        top: `${crop.y}px`,
                        width: `${crop.width}px`,
                        height: `${crop.height}px`,
                        cursor: isResizing ? 'grabbing' : 'move'
                      }}
                    >
                      {/* ہینڈلز */}
                      <div
                        className="absolute left-0 right-0 top-[-4px] h-2 bg-indigo-500 opacity-70 cursor-ns-resize rounded-t"
                        style={{ pointerEvents: 'auto' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsResizing(true);
                          setActiveHandle('top');
                          setResizeStart({
                            x: e.clientX - containerRef.current.getBoundingClientRect().left,
                            y: e.clientY - containerRef.current.getBoundingClientRect().top,
                            crop: { ...crop }
                          });
                        }}
                      />
                      <div
                        className="absolute left-0 right-0 bottom-[-4px] h-2 bg-indigo-500 opacity-70 cursor-ns-resize rounded-b"
                        style={{ pointerEvents: 'auto' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsResizing(true);
                          setActiveHandle('bottom');
                          setResizeStart({
                            x: e.clientX - containerRef.current.getBoundingClientRect().left,
                            y: e.clientY - containerRef.current.getBoundingClientRect().top,
                            crop: { ...crop }
                          });
                        }}
                      />
                      <div
                        className="absolute top-0 bottom-0 left-[-4px] w-2 bg-indigo-500 opacity-70 cursor-ew-resize rounded-l"
                        style={{ pointerEvents: 'auto' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsResizing(true);
                          setActiveHandle('left');
                          setResizeStart({
                            x: e.clientX - containerRef.current.getBoundingClientRect().left,
                            y: e.clientY - containerRef.current.getBoundingClientRect().top,
                            crop: { ...crop }
                          });
                        }}
                      />
                      <div
                        className="absolute top-0 bottom-0 right-[-4px] w-2 bg-indigo-500 opacity-70 cursor-ew-resize rounded-r"
                        style={{ pointerEvents: 'auto' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsResizing(true);
                          setActiveHandle('right');
                          setResizeStart({
                            x: e.clientX - containerRef.current.getBoundingClientRect().left,
                            y: e.clientY - containerRef.current.getBoundingClientRect().top,
                            crop: { ...crop }
                          });
                        }}
                      />

                      {/* کونے */}
                      <div
                        className="absolute top-[-6px] left-[-6px] w-4 h-4 bg-indigo-500 rounded-full cursor-nwse-resize"
                        style={{ pointerEvents: 'auto' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsResizing(true);
                          setActiveHandle('top-left');
                          setResizeStart({
                            x: e.clientX - containerRef.current.getBoundingClientRect().left,
                            y: e.clientY - containerRef.current.getBoundingClientRect().top,
                            crop: { ...crop }
                          });
                        }}
                      />
                      <div
                        className="absolute top-[-6px] right-[-6px] w-4 h-4 bg-indigo-500 rounded-full cursor-nesw-resize"
                        style={{ pointerEvents: 'auto' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsResizing(true);
                          setActiveHandle('top-right');
                          setResizeStart({
                            x: e.clientX - containerRef.current.getBoundingClientRect().left,
                            y: e.clientY - containerRef.current.getBoundingClientRect().top,
                            crop: { ...crop }
                          });
                        }}
                      />
                      <div
                        className="absolute bottom-[-6px] left-[-6px] w-4 h-4 bg-indigo-500 rounded-full cursor-nesw-resize"
                        style={{ pointerEvents: 'auto' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsResizing(true);
                          setActiveHandle('bottom-left');
                          setResizeStart({
                            x: e.clientX - containerRef.current.getBoundingClientRect().left,
                            y: e.clientY - containerRef.current.getBoundingClientRect().top,
                            crop: { ...crop }
                          });
                        }}
                      />
                      <div
                        className="absolute bottom-[-6px] right-[-6px] w-4 h-4 bg-indigo-500 rounded-full cursor-nwse-resize"
                        style={{ pointerEvents: 'auto' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsResizing(true);
                          setActiveHandle('bottom-right');
                          setResizeStart({
                            x: e.clientX - containerRef.current.getBoundingClientRect().left,
                            y: e.clientY - containerRef.current.getBoundingClientRect().top,
                            crop: { ...crop }
                          });
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {croppedImage && (
            <div className={`mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6`}>
              <h3 className="text-lg font-semibold mb-4">Cropped Result</h3>
              <div className="flex justify-center mb-4">
                <img
                  src={croppedImage}
                  alt="Cropped"
                  className="max-w-full h-auto rounded border border-gray-300 dark:border-gray-600"
                />
              </div>
              <button
                onClick={handleDownload}
                className="w-full bg-teal-600 text-white py-2.5 rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Download Cropped Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropImage;