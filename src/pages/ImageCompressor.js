import React, { useState, useRef, useEffect } from 'react';

const ImageCompressor = ({ darkMode = false, setDarkMode = () => {} }) => {
  const [originalImage, setOriginalImage] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [quality, setQuality] = useState(80);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalType, setOriginalType] = useState('image/jpeg');
  const [bestFormat, setBestFormat] = useState('image/webp');

  const fileInputRef = useRef(null);

  // Format bytes for display
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Convert Data URL to Blob and get size
  const dataURLToBlob = (dataURL) => {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (!result) return;
        setOriginalImage(result);
        setOriginalSize(file.size);
        setOriginalType(file.type);
        setCompressedImage(null);
        setCompressedSize(0);
        compressImage(result, quality);
      };
      reader.readAsDataURL(file);
    }
  };

  const findBestCompression = async (imageSrc, qualityValue) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageSrc;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const candidates = [];

    // Always try WebP
    const webpDataUrl = canvas.toDataURL('image/webp', qualityValue / 100);
    const webpBlob = dataURLToBlob(webpDataUrl);
    candidates.push({ format: 'image/webp', dataUrl: webpDataUrl, size: webpBlob.size });

    // Try JPEG if not original PNG
    if (originalType !== 'image/png') {
      const jpegDataUrl = canvas.toDataURL('image/jpeg', qualityValue / 100);
      const jpegBlob = dataURLToBlob(jpegDataUrl);
      candidates.push({ format: 'image/jpeg', dataUrl: jpegDataUrl, size: jpegBlob.size });
    }

    // Try PNG only if original is PNG (to preserve transparency)
    if (originalType === 'image/png') {
      const pngDataUrl = canvas.toDataURL('image/png');
      const pngBlob = dataURLToBlob(pngDataUrl);
      candidates.push({ format: 'image/png', dataUrl: pngDataUrl, size: pngBlob.size });
    }

    // Find smallest
    const best = candidates.reduce((prev, current) => (prev.size < current.size ? prev : current));
    setBestFormat(best.format);
    return best;
  };

  const compressImage = async (imageSrc, qualityValue) => {
    if (!imageSrc) return;

    setIsCompressing(true);
    try {
      const best = await findBestCompression(imageSrc, qualityValue);
      setCompressedImage(best.dataUrl);
      setCompressedSize(best.size);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Failed to compress image. Please try again.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleQualityChange = (e) => {
    const newQuality = parseInt(e.target.value);
    setQuality(newQuality);
    if (originalImage) {
      compressImage(originalImage, newQuality);
    }
  };

  // Re-compress when quality changes
  useEffect(() => {
    if (originalImage) {
      const timer = setTimeout(() => compressImage(originalImage, quality), 300);
      return () => clearTimeout(timer);
    }
  }, [quality, originalImage]);

  const handleDownload = () => {
    if (!compressedImage) return;
    const ext = bestFormat === 'image/png' ? 'png' : bestFormat === 'image/jpeg' ? 'jpg' : 'webp';
    const link = document.createElement('a');
    link.download = `compressed-image.${ext}`;
    link.href = compressedImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setCompressedImage(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setQuality(80);
    setOriginalType('image/jpeg');
    setBestFormat('image/webp');
  };

  const compressionPercentage = originalSize
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0;

  const sizeColor = compressionPercentage > 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-center mb-2">Image Compressor</h1>
        <p className={`text-center mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Reduce file size intelligently. We choose the best format (WebP/JPEG/PNG) for smallest size.
        </p>

        <div className="max-w-7xl mx-auto flex gap-8">
          {/* Controls Panel */}
          <div className={`w-80 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <div className={`p-3 mb-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="text-xs">
                <strong>Original:</strong> {formatBytes(originalSize)}
              </p>
              <p className="text-xs mt-1">
                <strong>Compressed:</strong> {formatBytes(compressedSize)}
              </p>
              {compressedSize > 0 && (
                <p className={`text-xs mt-1 font-medium ${sizeColor}`}>
                  {compressionPercentage > 0
                    ? `✅ ${compressionPercentage}% smaller`
                    : `❌ ${Math.abs(compressionPercentage)}% larger`}
                </p>
              )}
              {bestFormat && (
                <p className="text-xs mt-1 text-blue-500">
                  Format: {bestFormat === 'image/webp' ? 'WebP' : bestFormat === 'image/jpeg' ? 'JPEG' : 'PNG'}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Quality: {quality}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={handleQualityChange}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
                style={{
                  background: `linear-gradient(to right, #EF4444 0%, #F59E0B 30%, #10B981 70%, #10B981 100%)`,
                }}
              />
              <div className="flex justify-between text-xs mt-1">
                <span>Low (10%)</span>
                <span>High (100%)</span>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <label className="flex-1 bg-green-500 text-white py-2.5 rounded-lg hover:bg-green-600 transition-colors cursor-pointer text-center">
                + Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
              </label>
              <button
                onClick={handleReset}
                disabled={!originalImage}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  originalImage
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
              disabled={!compressedImage || isCompressing}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                compressedImage && !isCompressing
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isCompressing ? 'Optimizing...' : '📥 Download Smallest'}
            </button>
          </div>

          {/* Preview Area */}
          <div className="flex-1">
            {!originalImage ? (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-12 text-center`}>
                  <h3 className="text-2xl font-semibold mb-2">Upload an Image to Compress</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>Supports JPG, PNG, WEBP</p>
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
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className="text-lg font-semibold mb-4">Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Original</h4>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <img
                        src={originalImage}
                        alt="Original"
                        className="w-full h-auto max-h-80 object-contain"
                      />
                    </div>
                    <p className="text-xs mt-2 text-center">{formatBytes(originalSize)}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Compressed ({quality}%)</h4>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <img
                        src={compressedImage || originalImage}
                        alt="Compressed"
                        className="w-full h-auto max-h-80 object-contain"
                      />
                    </div>
                    <p className="text-xs mt-2 text-center">
                      {compressedImage ? formatBytes(compressedSize) : 'Processing...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className={`${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'} border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} mt-12`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Column 1: Brand */}
            <div>
              <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Image Compressor
              </h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Compress and reduce image file sizes without losing quality using our smart compression tool.
              </p>
            </div>

            {/* Column 2: Tools */}
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

            {/* Column 3: More Tools */}
            <div>
              <h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>More Tools</h4>
              <ul className="space-y-1.5">
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>PNG Converter</a></li>
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>JPG Converter</a></li>
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>WEBP Converter</a></li>
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>HEIC Converter</a></li>
              </ul>
            </div>

            {/* Column 4: Resources */}
            <div>
              <h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Resources</h4>
              <ul className="space-y-1.5">
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>FAQ</a></li>
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Privacy Policy</a></li>
                <li><a href="#" className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Terms & Conditions</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <p className={`text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              © {new Date().getFullYear()} Image Compressor — All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ImageCompressor;