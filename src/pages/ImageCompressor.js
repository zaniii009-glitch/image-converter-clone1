// src/pages/ImageCompressor.jsx
import React, { useState, useRef } from 'react';

const ImageCompressor = ({ darkMode, setDarkMode }) => {
  const [originalImage, setOriginalImage] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [quality, setQuality] = useState(80);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalType, setOriginalType] = useState('image/jpeg');
  const [bestFormat, setBestFormat] = useState('image/webp');

  const fileInputRef = useRef(null);

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // فائل ٹائپ حاصل کریں
  const getFileTypeFromDataURL = (dataURL) => {
    return dataURL.split(';')[0].split(':')[1];
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setOriginalImage(event.target?.result);
          setOriginalSize(file.size);
          setOriginalType(file.type);
          setCompressedImage(null);
          setCompressedSize(0);
          compressImage(event.target?.result, quality);
        };
        img.src = event.target?.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // 100 بار کمپریس کر کے بہترین فارمیٹ تلاش کریں
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

    // WebP کوشش کریں
    const webpDataUrl = canvas.toDataURL('image/webp', qualityValue / 100);
    const webpSize = atob(webpDataUrl.split(',')[1]).length;

    // JPEG کوشش کریں (اگر اصل فارمیٹ PNG نہ ہو)
    let jpegDataUrl = null;
    let jpegSize = Infinity;
    if (originalType !== 'image/png') {
      jpegDataUrl = canvas.toDataURL('image/jpeg', qualityValue / 100);
      jpegSize = atob(jpegDataUrl.split(',')[1]).length;
    }

    // PNG صرف اگر اصل فارمیٹ PNG ہو
    let pngDataUrl = null;
    let pngSize = Infinity;
    if (originalType === 'image/png') {
      pngDataUrl = canvas.toDataURL('image/png');
      pngSize = atob(pngDataUrl.split(',')[1]).length;
    }

    // سب سے چھوٹا سائز تلاش کریں
    const sizes = [
      { format: 'image/webp', dataUrl: webpDataUrl, size: webpSize },
      { format: 'image/jpeg', dataUrl: jpegDataUrl, size: jpegSize },
      { format: 'image/png', dataUrl: pngDataUrl, size: pngSize }
    ];

    const best = sizes.reduce((prev, current) => 
      (prev.size < current.size) ? prev : current
    );

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

  React.useEffect(() => {
    if (originalImage) {
      compressImage(originalImage, quality);
    }
  }, [quality]);

  const handleDownload = () => {
    if (!compressedImage) return;
    const ext = bestFormat === 'image/png' ? 'png' : bestFormat === 'image/jpeg' ? 'jpg' : 'webp';
    const link = document.createElement('a');
    link.download = `compressed-image.${ext}`;
    link.href = compressedImage;
    link.click();
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

  // نتیجہ کا رنگ
  const sizeColor = compressionPercentage > 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <h1 className="text-3xl font-bold text-center mb-2">📦 Image Compressor</h1>
      <p className={`text-center mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Reduce file size intelligently. We choose the best format (WebP/JPEG/PNG) for smallest size.
      </p>

      <div className="max-w-7xl mx-auto flex gap-8">
        {/* بائیں جانب کنٹرولز */}
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

          {/* Quality Slider */}
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
                background: `linear-gradient(to right, #EF4444 0%, #F59E0B 30%, #10B981 70%, #10B981 100%)`
              }}
            />
            <div className="flex justify-between text-xs mt-1">
              <span>Low (10%)</span>
              <span>High (100%)</span>
            </div>
          </div>

          {/* Actions */}
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

        {/* دائیں جانب پری ویو */}
        <div className="flex-1">
          {!originalImage ? (
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center`}>
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-2xl font-semibold mb-2">Upload an Image to Compress</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Supports JPG, PNG, WEBP</p>
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
                  <h4 className="text-sm font-medium mb-2">
                    Compressed ({quality}%)
                  </h4>
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
  );
};

export default ImageCompressor;