import React, { useState, useRef, useEffect } from 'react';

const ImageCropRotate = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const headerTools = [
    { name: 'Image Converter', link: '/', short: 'Convert' },
    { name: 'Image Resizer', link: '#', short: 'Resize' },
    { name: 'Crop Image', link: '#', short: 'Crop' },
    { name: 'Image Compressor', link: '#', short: 'Compress' },
    { name: 'Color Picker', link: '/color-picker', short: 'Color Picker' },
  ];

  useEffect(() => {
    if (selectedImage && imageRef.current) {
      const img = imageRef.current;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setCrop({
        x: 0,
        y: 0,
        width: img.clientWidth,
        height: img.clientHeight
      });
    }
  }, [selectedImage]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRotate = (degree) => {
    setRotation((prev) => (prev + degree) % 360);
  };

  const handleMouseDown = (e, resizeHandle) => {
    e.preventDefault();
    if (resizeHandle) {
      setIsResizing(resizeHandle);
    } else {
      setIsDragging(true);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current || !imageRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const img = imageRef.current.getBoundingClientRect();

    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setCrop(prev => ({
        ...prev,
        x: Math.max(0, Math.min(img.width - prev.width, prev.x + dx)),
        y: Math.max(0, Math.min(img.height - prev.height, prev.y + dy))
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isResizing) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      setCrop(prev => {
        let newCrop = { ...prev };
        
        if (isResizing.includes('e')) {
          newCrop.width = Math.min(img.width - prev.x, Math.max(50, prev.width + dx));
        }
        if (isResizing.includes('s')) {
          newCrop.height = Math.min(img.height - prev.y, Math.max(50, prev.height + dy));
        }
        if (isResizing.includes('w')) {
          const newWidth = Math.max(50, prev.width - dx);
          const newX = Math.max(0, prev.x + (prev.width - newWidth));
          newCrop.width = newWidth;
          newCrop.x = newX;
        }
        if (isResizing.includes('n')) {
          const newHeight = Math.max(50, prev.height - dy);
          const newY = Math.max(0, prev.y + (prev.height - newHeight));
          newCrop.height = newHeight;
          newCrop.y = newY;
        }
        
        return newCrop;
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart]);

  const handleApplyCrop = () => {
    if (!imageRef.current || !canvasRef.current) return;

    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.save();
    ctx.translate(cropWidth / 2, cropHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      -cropWidth / 2,
      -cropHeight / 2,
      cropWidth,
      cropHeight
    );
    ctx.restore();

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cropped-${selectedImage.name}`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setRotation(0);
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .crop-box {
          position: absolute;
          border: 2px dashed #4f46e5;
          background: rgba(79, 70, 229, 0.1);
          cursor: move;
        }
        .resize-handle {
          position: absolute;
          width: 12px;
          height: 12px;
          background: #4f46e5;
          border: 2px solid white;
          border-radius: 50%;
        }
        .resize-handle.nw { top: -6px; left: -6px; cursor: nw-resize; }
        .resize-handle.ne { top: -6px; right: -6px; cursor: ne-resize; }
        .resize-handle.sw { bottom: -6px; left: -6px; cursor: sw-resize; }
        .resize-handle.se { bottom: -6px; right: -6px; cursor: se-resize; }
        .resize-handle.n { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
        .resize-handle.s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
        .resize-handle.w { left: -6px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
        .resize-handle.e { right: -6px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
      `}</style>

      {/* Header */}
      <header className={`${darkMode ? 'bg-indigo-900' : 'bg-indigo-700'} shadow-lg sticky top-0 z-50`}>
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Image Crop & Rotate</h1>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="hidden md:flex items-center gap-2">
                {headerTools.map((t) => (
                  <a key={t.name} href={t.link} className="px-3 py-2 text-sm rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors" title={t.name}>
                    {t.short}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-colors ${darkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-yellow-300'}`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <a className="px-5 py-2.5 bg-indigo-800 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-lg" href="#signup">Sign Up</a>
              <a className="text-indigo-200 hover:text-white px-4 py-2 transition-colors font-medium" href="#login">Login</a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <section className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-8 mb-6`}>
          <h2 className={`text-3xl font-bold mb-4 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Crop & Rotate Your Images
          </h2>
          <p className={`text-center mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Upload an image, adjust the crop area, rotate as needed, and download your edited image.
          </p>

          {!selectedImage ? (
            <div className="flex flex-col items-center justify-center py-12">
              <label className="cursor-pointer">
                <div className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-lg shadow-lg transition-all">
                  📁 Select Image
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => handleRotate(-90)}
                  className={`px-4 py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  ↺ Rotate Left
                </button>
                <button
                  onClick={() => handleRotate(90)}
                  className={`px-4 py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  ↻ Rotate Right
                </button>
                <button
                  onClick={handleApplyCrop}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  ✓ Apply & Download
                </button>
                <button
                  onClick={handleReset}
                  className={`px-4 py-2 rounded-lg font-medium ${darkMode ? 'bg-red-700 text-white hover:bg-red-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
                >
                  ✕ Reset
                </button>
              </div>

              {/* Image Editor */}
              <div 
                ref={containerRef}
                className="relative inline-block mx-auto"
                style={{ maxWidth: '100%' }}
              >
                <img
                  ref={imageRef}
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full h-auto"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease'
                  }}
                />
                {imagePreview && (
                  <div
                    className="crop-box"
                    style={{
                      left: `${crop.x}px`,
                      top: `${crop.y}px`,
                      width: `${crop.width}px`,
                      height: `${crop.height}px`
                    }}
                    onMouseDown={(e) => handleMouseDown(e, null)}
                  >
                    <div className="resize-handle nw" onMouseDown={(e) => handleMouseDown(e, 'nw')}></div>
                    <div className="resize-handle ne" onMouseDown={(e) => handleMouseDown(e, 'ne')}></div>
                    <div className="resize-handle sw" onMouseDown={(e) => handleMouseDown(e, 'sw')}></div>
                    <div className="resize-handle se" onMouseDown={(e) => handleMouseDown(e, 'se')}></div>
                    <div className="resize-handle n" onMouseDown={(e) => handleMouseDown(e, 'n')}></div>
                    <div className="resize-handle s" onMouseDown={(e) => handleMouseDown(e, 's')}></div>
                    <div className="resize-handle w" onMouseDown={(e) => handleMouseDown(e, 'w')}></div>
                    <div className="resize-handle e" onMouseDown={(e) => handleMouseDown(e, 'e')}></div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <p>🖱️ Drag the crop box to reposition • Drag handles to resize</p>
                <p>Rotation: {rotation}°</p>
              </div>
            </div>
          )}
        </section>

        {/* Instructions */}
        <section className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-8`}>
          <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            How to Use
          </h3>
          <div className="space-y-4">
            <div className={`flex items-start gap-4 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">1</span>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Click "Select Image" to upload your image file</p>
            </div>
            <div className={`flex items-start gap-4 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">2</span>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Drag the blue crop box to select the area you want to keep</p>
            </div>
            <div className={`flex items-start gap-4 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">3</span>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Use rotate buttons to adjust the angle of your image</p>
            </div>
            <div className={`flex items-start gap-4 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">4</span>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Click "Apply & Download" to save your cropped and rotated image</p>
            </div>
          </div>
        </section>
      </main>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ImageCropRotate;