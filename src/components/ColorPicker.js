import React, { useState, useRef, useEffect } from 'react';

export const ColorPicker = () => {
  const [selectedColor, setSelectedColor] = useState({ hex: '#2596be', r: 37, g: 150, b: 190 });
  const [imageSrc, setImageSrc] = useState(null);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [palette, setPalette] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [activeTab, setActiveTab] = useState('image');
  const [hueValue, setHueValue] = useState(195);
  const hueRef = useRef(hueValue);             // keep latest hue for event handlers
  const rafRef = useRef(null);                 // requestAnimationFrame handle
  const draggingRef = useRef(false);          // whether user is dragging the square
  const moveHandlerRef = useRef(null);
  const upHandlerRef = useRef(null);
  const indicatorRef = useRef(null);         // direct ref to the small circle indicator
  const [satValue, setSatValue] = useState(67);
  const [lightValue, setLightValue] = useState(45);
  const satRef = useRef(satValue);
  const lightRef = useRef(lightValue);
  const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false);
  const colorSquareRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  // Check if EyeDropper API is supported
  useEffect(() => {
    if ('EyeDropper' in window) {
      setIsEyeDropperSupported(true);
    }
  }, []);

  // keep hueRef in sync
  useEffect(() => {
    hueRef.current = hueValue;
  }, [hueValue]);
  useEffect(() => { satRef.current = satValue; }, [satValue]);
  useEffect(() => { lightRef.current = lightValue; }, [lightValue]);

  const generatePalette = (img) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const maxSize = 100;
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const colorMap = {};
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = Math.floor(pixels[i] / 30) * 30;
      const g = Math.floor(pixels[i + 1] / 30) * 30;
      const b = Math.floor(pixels[i + 2] / 30) * 30;
      const key = `${r},${g},${b}`;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }
    
    const sortedColors = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([color]) => {
        const [r, g, b] = color.split(',').map(Number);
        return `rgb(${r}, ${g}, ${b})`;
      });
    
    setPalette(sortedColors);
  };

  const processImage = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const imageData = {
          src: e.target.result,
          name: file.name,
          img: img
        };
        
        setImages(prevImages => {
          const newImages = [...prevImages, imageData];
          setCurrentImageIndex(newImages.length - 1);
          return newImages;
        });
        
        imageRef.current = img;
        setImageSrc(e.target.result);
        
        setTimeout(() => {
          const canvas = canvasRef.current;
          
          if (!canvas) {
            console.error('Canvas not found');
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          const maxWidth = 600;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.style.width = `${img.width * scale}px`;
          canvas.style.height = `${img.height * scale}px`;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
          }
          
          generatePalette(img);
        }, 50);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        processImage(file);
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        processImage(file);
      });
    }
  };

  const switchImage = (index) => {
    if (index < 0 || index >= images.length) return;
    
    const imageData = images[index];
    setCurrentImageIndex(index);
    setImageSrc(imageData.src);
    imageRef.current = imageData.img;
    
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const img = imageData.img;
      canvas.width = img.width;
      canvas.height = img.height;
      
      const maxWidth = 600;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.style.width = `${img.width * scale}px`;
      canvas.style.height = `${img.height * scale}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
      
      generatePalette(img);
    }, 50);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    
    if (newImages.length === 0) {
      setImageSrc(null);
      setPalette([]);
      setCurrentImageIndex(0);
    } else if (index === currentImageIndex) {
      const newIndex = Math.min(index, newImages.length - 1);
      setTimeout(() => switchImage(newIndex), 100);
    } else if (index < currentImageIndex) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext('2d');
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    
    updateSelectedColor(pixel[0], pixel[1], pixel[2]);
  };

  const updateSelectedColor = (r, g, b, fromPicker = false) => {
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    
    setSelectedColor({ hex, r, g, b });
    
    if (!fromPicker) {
      // Convert RGB to HSV for color picker
      const rNorm = r / 255;
      const gNorm = g / 255;
      const bNorm = b / 255;
      
      const max = Math.max(rNorm, gNorm, bNorm);
      const min = Math.min(rNorm, gNorm, bNorm);
      const delta = max - min;
      
      let h = 0;
      if (delta !== 0) {
        if (max === rNorm) {
          h = 60 * (((gNorm - bNorm) / delta) % 6);
        } else if (max === gNorm) {
          h = 60 * (((bNorm - rNorm) / delta) + 2);
        } else {
          h = 60 * (((rNorm - gNorm) / delta) + 4);
        }
      }
      if (h < 0) h += 360;
      
      const s = max === 0 ? 0 : (delta / max) * 100;
      const v = max * 100;
      
      setHueValue(Math.round(h));
      setSatValue(Math.round(s));
      setLightValue(Math.round(v));
    }
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToRgb = (h, s, l) => {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };

  // Convert HSV (Hue 0-360, Saturation 0-100, Value 0-100) to RGB 0-255
  const hsvToRgb = (h, s, v) => {
    s /= 100;
    v /= 100;
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };
  
  const rgbToCmyk = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const k = 1 - Math.max(r, g, b);
    const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
    const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
    const y = k === 1 ? 0 : (1 - b - k) / (1 - k);

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  };

  const rgbToXyz = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    r *= 100;
    g *= 100;
    b *= 100;

    return {
      x: Math.round(r * 0.4124 + g * 0.3576 + b * 0.1805),
      y: Math.round(r * 0.2126 + g * 0.7152 + b * 0.0722),
      z: Math.round(r * 0.0193 + g * 0.1192 + b * 0.9505)
    };
  };

  const xyzToLab = (x, y, z) => {
    x /= 95.047;
    y /= 100.000;
    z /= 108.883;

    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

    return {
      l: Math.round((116 * y) - 16),
      a: Math.round(500 * (x - y)),
      b: Math.round(200 * (y - z))
    };
  };

  const getColorVariations = () => {
    const shades = [];
    const tints = [];
    
    for (let i = 0; i <= 100; i += 10) {
      const shadeFactor = 1 - (i / 100);
      const shadeR = Math.round(selectedColor.r * shadeFactor);
      const shadeG = Math.round(selectedColor.g * shadeFactor);
      const shadeB = Math.round(selectedColor.b * shadeFactor);
      shades.push({ r: shadeR, g: shadeG, b: shadeB, percent: i });

      const tintFactor = i / 100;
      const tintR = Math.round(selectedColor.r + (255 - selectedColor.r) * tintFactor);
      const tintG = Math.round(selectedColor.g + (255 - selectedColor.g) * tintFactor);
      const tintB = Math.round(selectedColor.b + (255 - selectedColor.b) * tintFactor);
      tints.push({ r: tintR, g: tintG, b: tintB, percent: i });
    }
    
    return { shades, tints };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleHueChange = (e) => {
    const newHue = parseInt(e.target.value);
    setHueValue(newHue);
    const rgb = hslToRgb(newHue, satValue, lightValue);
    updateSelectedColor(rgb.r, rgb.g, rgb.b);
  };

  const handleColorPointer = (clientX, clientY) => {
    const el = colorSquareRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    const x = Math.max(0, Math.min(rawX, rect.width));
    const y = Math.max(0, Math.min(rawY, rect.height));

    // More stable values (rounded)
    const saturation = Math.round(((x / rect.width) * 100) * 100) / 100;
    const value = Math.round(((1 - (y / rect.height)) * 100) * 100) / 100;

    // immediate visual feedback via DOM (avoid waiting for React re-render)
    const indicator = indicatorRef.current;
    if (indicator) {
      indicator.style.left = `${saturation}%`;
      indicator.style.top = `${100 - value}%`;
      const rgbImmediate = hsvToRgb(hueRef.current, saturation, value);
      indicator.style.backgroundColor = `rgb(${rgbImmediate.r}, ${rgbImmediate.g}, ${rgbImmediate.b})`;
      indicator.style.border = value > 60 ? '2px solid rgba(0,0,0,0.6)' : '2px solid rgba(255,255,255,0.9)';
    }

    // update refs (fast local copy)
    satRef.current = saturation;
    lightRef.current = value;

    // Throttle React state updates / color computation via RAF
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setSatValue(satRef.current);
      setLightValue(lightRef.current);
      const rgb = hsvToRgb(hueRef.current, satRef.current, lightRef.current);
      updateSelectedColor(rgb.r, rgb.g, rgb.b, true);
      rafRef.current = null;
    });
  };
 
  const onPointerDown = (e) => {
    e.preventDefault();
    const el = colorSquareRef.current;
    if (!el) return;

    // mark dragging
    draggingRef.current = true;

    // Try pointer capture on the element (best-effort)
    if (el.setPointerCapture) {
      try { el.setPointerCapture(e.pointerId); } catch {}
    }

    // initial update
    handleColorPointer(e.clientX, e.clientY);

    // handlers attached to the element (pointer capture ensures events continue)
    moveHandlerRef.current = (ev) => {
      if (!draggingRef.current) return;
      handleColorPointer(ev.clientX, ev.clientY);
    };

    upHandlerRef.current = (ev) => {
      draggingRef.current = false;
      // try to release capture (use the up event pointerId if available)
      try { if (el.releasePointerCapture) el.releasePointerCapture(ev.pointerId ?? e.pointerId); } catch {}
      // cancel pending RAF if any
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // remove listeners from element
      try {
        el.removeEventListener('pointermove', moveHandlerRef.current);
        el.removeEventListener('pointerup', upHandlerRef.current);
        el.removeEventListener('pointercancel', upHandlerRef.current);
      } catch {}
      moveHandlerRef.current = null;
      upHandlerRef.current = null;
    };

    el.addEventListener('pointermove', moveHandlerRef.current);
    el.addEventListener('pointerup', upHandlerRef.current);
    el.addEventListener('pointercancel', upHandlerRef.current);
  };
 
  // cleanup on unmount: remove any attached listeners and cancel RAF
  useEffect(() => {
    return () => {
      const el = colorSquareRef.current;
      if (el) {
        try {
          if (moveHandlerRef.current) el.removeEventListener('pointermove', moveHandlerRef.current);
          if (upHandlerRef.current) {
            el.removeEventListener('pointerup', upHandlerRef.current);
            el.removeEventListener('pointercancel', upHandlerRef.current);
          }
        } catch {}
      } else {
        try {
          if (moveHandlerRef.current) document.removeEventListener('pointermove', moveHandlerRef.current);
          if (upHandlerRef.current) {
            document.removeEventListener('pointerup', upHandlerRef.current);
            document.removeEventListener('pointercancel', upHandlerRef.current);
          }
        } catch {}
      }
      moveHandlerRef.current = null;
      upHandlerRef.current = null;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      draggingRef.current = false;
    };
  }, []);

  // Redraw canvas when switching back to image tab
  useEffect(() => {
    if (activeTab === 'image' && imageSrc && imageRef.current) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const img = imageRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        
        const maxWidth = 600;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.style.width = `${img.width * scale}px`;
        canvas.style.height = `${img.height * scale}px`;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      }, 100);
    }
  }, [activeTab, imageSrc]);

  const handlePaletteClick = (color) => {
    const rgb = color.match(/\d+/g).map(Number);
    updateSelectedColor(rgb[0], rgb[1], rgb[2]);
  };

  const handlePickFromScreen = async () => {
    if (!isEyeDropperSupported) {
      alert('Sorry! Your browser does not support the EyeDropper API. Please use Chrome, Edge, or Opera browser (version 95+).');
      return;
    }

    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      
      if (result && result.sRGBHex) {
        const hex = result.sRGBHex;
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        updateSelectedColor(r, g, b);
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        console.error('EyeDropper error:', error);
      }
    }
  };

  const cmyk = rgbToCmyk(selectedColor.r, selectedColor.g, selectedColor.b);
  const xyz = rgbToXyz(selectedColor.r, selectedColor.g, selectedColor.b);
  const lab = xyzToLab(xyz.x, xyz.y, xyz.z);
  const hsl = rgbToHsl(selectedColor.r, selectedColor.g, selectedColor.b);
  const variations = getColorVariations();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-8">
          {activeTab === 'image' ? (
            <>
              <h1 className="text-5xl font-bold text-center mb-3">Image Color Picker</h1>
              <p className="text-center text-gray-400 text-lg">
                Upload your image and click anywhere to extract colors instantly. Supports multiple images.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl font-bold text-center mb-3">Color Picker & Generator</h1>
              <p className="text-center text-gray-400 text-lg">
                Pick colors interactively, generate variations, and get all color codes in multiple formats.
              </p>
            </>
          )}
        </header>

        {/* Tabs */}
<div className="flex justify-center gap-8 mb-8 border-b border-gray-700">
  <button
    onClick={() => setActiveTab('image')}
    className={`pb-3 px-4 font-medium transition-all ${
      activeTab === 'image'
        ? 'text-white border-b-2 border-cyan-500'
        : 'text-gray-400 hover:text-gray-300'
    }`}
  >
    Pick color from image
  </button>
  <button
    onClick={() => setActiveTab('picker')}
    className={`pb-3 px-4 font-medium transition-all ${
      activeTab === 'picker'
        ? 'text-white border-b-2 border-cyan-500'
        : 'text-gray-400 hover:text-gray-300'
    }`}
  >
    Color Picker
  </button>
</div>

        {/* Tab Content */}
        {activeTab === 'image' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Image</h3>
                {images.length > 0 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm"
                  >
                    + Add More Images
                  </button>
                )}
              </div>
              
              {images.length === 0 ? (
                <div
                  className={`border-4 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all ${
                    isDragging ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-700 bg-gray-800'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragCounter(prev => prev + 1); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragCounter(prev => { const n = prev - 1; if (n === 0) setIsDragging(false); return n; }); }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="w-24 h-24 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xl font-bold mb-2 text-gray-200">
                    {isDragging ? 'Drop your image here!' : 'Drag & drop image(s)'}
                  </p>
                  <p className="text-gray-400">or click to browse (multiple files supported)</p>
                </div>
              ) : (
                <div>
                  {/* Image Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {images.map((img, index) => (
                        <div key={index} className="relative flex-shrink-0">
                          <div
                            onClick={() => switchImage(index)}
                            className={`w-20 h-20 rounded-lg cursor-pointer overflow-hidden border-2 transition-all ${
                              index === currentImageIndex
                                ? 'border-cyan-500 scale-105'
                                : 'border-gray-700 hover:border-gray-500'
                            }`}
                          >
                            <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Main Canvas */}
                  <div className="relative">
                    {imageSrc && (
                      <canvas
                        ref={canvasRef}
                        onClick={handleCanvasClick}
                        className="w-full cursor-crosshair rounded-xl border-2 border-gray-700"
                      />
                    )}
                    {images.length === 1 && (
                      <button
                        onClick={() => removeImage(0)}
                        className="absolute top-4 right-4 p-3 bg-red-500 rounded-full hover:bg-red-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Image Info */}
                  {images.length > 0 && (
                    <div className="mt-3 text-sm text-gray-400">
                      {images[currentImageIndex]?.name} ({currentImageIndex + 1} of {images.length})
                    </div>
                  )}
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                multiple
                className="hidden" 
              />
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-lg">Selected Color</h3>
              <div className="bg-gray-800 rounded-xl p-4">
                <div
                  className="w-full h-40 rounded-lg mb-4"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                <div className="space-y-2">
                  {[
                    { label: 'HEX', value: selectedColor.hex },
                    { label: 'RGB', value: `${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b}` },
                    { label: 'HSL', value: `${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%` },
                    { label: 'CMYK', value: `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}` }
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between bg-gray-900 rounded p-2">
                      <span className="text-sm text-gray-400">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{item.value}</span>
                        <button onClick={() => copyToClipboard(item.value)} className="p-1 hover:bg-gray-700 rounded">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {palette.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Palette</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {palette.map((color, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => handlePaletteClick(color)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'picker' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Color Conversion Section */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Color Conversion</h3>
                
                {/* Color Square */}
                <div 
                  ref={colorSquareRef}
                  className="relative w-full aspect-square bg-white rounded-lg mb-4 cursor-crosshair select-none"
                  style={{
                    background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${hueValue}, 100%, 50%))`,
                    touchAction: 'none' // prevent browser gestures from interrupting pointer events
                  }}
                  onPointerDown={onPointerDown}
                 >
                   <div
                     ref={indicatorRef}
                     className="absolute w-6 h-6 rounded-full pointer-events-none transition-all"
                     style={{
                       left: `${satValue}%`,
                       top: `${100 - lightValue}%`,
                       transform: 'translate(-50%, -50%)',
                       backgroundColor: selectedColor.hex,
                       border: lightValue > 60 ? '2px solid rgba(0,0,0,0.6)' : '2px solid rgba(255,255,255,0.9)',
                       boxShadow: '0 2px 8px rgba(0,0,0,0.35), 0 0 0 2px rgba(0,0,0,0.05)'
                     }}
                   />
                  </div>

                {/* Hue Slider */}
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={hueValue}
                    onChange={handleHueChange}
                    className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                    }}
                  />
                </div>

                {/* HEX Input */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-gray-400">HEX</span>
                  <input
                    type="text"
                    value={selectedColor.hex}
                    onChange={(e) => {
                      const hex = e.target.value;
                      if (/^#[0-9A-F]{6}$/i.test(hex)) {
                        const r = parseInt(hex.substr(1, 2), 16);
                        const g = parseInt(hex.substr(3, 2), 16);
                        const b = parseInt(hex.substr(5, 2), 16);
                        updateSelectedColor(r, g, b);
                      }
                    }}
                    className="flex-1 bg-gray-900 px-3 py-2 rounded font-mono text-white"
                  />
                </div>

                <button 
                  onClick={handlePickFromScreen}
                  className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isEyeDropperSupported 
                      ? 'bg-white text-gray-900 hover:bg-gray-100 cursor-pointer' 
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!isEyeDropperSupported}
                  title={!isEyeDropperSupported ? 'Not supported in your browser' : 'Click to pick color from screen'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  Pick from screen
                  {!isEyeDropperSupported && <span className="text-xs">(Not supported)</span>}
                </button>
              </div>

              {/* Color Codes Display */}
              <div className="space-y-4">
                <div 
                  className="rounded-xl p-8 text-center transition-colors duration-300" 
                  style={{ backgroundColor: selectedColor.hex }}
                >
                  <h2 className="text-5xl font-bold mb-2" style={{ 
                    color: lightValue > 50 ? '#000000' : '#ffffff' 
                  }}>
                    {selectedColor.hex}
                  </h2>
                  <p className="text-lg" style={{ 
                    color: lightValue > 50 ? '#000000' : '#ffffff',
                    opacity: 0.8
                  }}>
                    ≈ {lightValue > 70 ? 'Light' : lightValue > 30 ? 'Medium' : 'Dark'} Tone
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'HEX', value: selectedColor.hex },
                    { label: 'HSL', value: `${Math.round(hsl.h)}, ${Math.round(hsl.s)}, ${Math.round(hsl.l)}` },
                    { label: 'RGB', value: `${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b}` },
                    { label: 'XYZ', value: `${xyz.x}, ${xyz.y}, ${xyz.z}` },
                    { label: 'CMYK', value: `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}` },
                    { label: 'LUV', value: `58, -29, -37` },
                    { label: 'LAB', value: `${lab.l}, ${lab.a}, ${lab.b}` },
                    { label: 'HWB', value: `${Math.round(hsl.h)}, 15, 25` }
                  ].map(item => (
                    <div key={item.label} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">{item.label}</span>
                        <button onClick={() => copyToClipboard(item.value)} className="p-1 hover:bg-gray-700 rounded">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <p className="font-mono text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Variations Section */}
            <div className="bg-gray-800 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded" style={{ backgroundColor: selectedColor.hex }}></div>
                <h2 className="text-2xl font-bold">Variations</h2>
              </div>

              <p className="text-gray-400 mb-6">
                The purpose of this section is to accurately produce tints (pure white added) and shades
                (pure black added) of your selected color in 10% increments.
              </p>

              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <p className="text-sm">
                  <strong>Pro Tip:</strong> Use shades for hover states and shadows, tints for highlights and backgrounds.
                </p>
              </div>

              {/* Shades */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Shades</h3>
                <p className="text-gray-400 mb-4">Darker variations created by adding black to your base color.</p>
                
                <div className="flex gap-2 mb-2">
                  {variations.shades.map(shade => (
                    <div key={shade.percent} className="flex-1 text-center">
                      <div className="bg-white text-gray-900 rounded px-2 py-1 text-xs font-medium mb-2">
                        {shade.percent}%
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex rounded-lg overflow-hidden h-16">
                  {variations.shades.map((shade, i) => (
                    <div
                      key={i}
                      className="flex-1 cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: `rgb(${shade.r}, ${shade.g}, ${shade.b})` }}
                      onClick={() => updateSelectedColor(shade.r, shade.g, shade.b)}
                      title={`#${shade.r.toString(16).padStart(2,'0')}${shade.g.toString(16).padStart(2,'0')}${shade.b.toString(16).padStart(2,'0')}`}
                    />
                  ))}
                </div>
              </div>

              {/* Tints */}
              <div>
                <h3 className="text-xl font-bold mb-4">Tints</h3>
                <p className="text-gray-400 mb-4">Lighter variations created by adding white to your base color.</p>
                
                <div className="flex gap-2 mb-2">
                  {variations.tints.map(tint => (
                    <div key={tint.percent} className="flex-1 text-center">
                      <div className="bg-white text-gray-900 rounded px-2 py-1 text-xs font-medium mb-2">
                        {tint.percent}%
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex rounded-lg overflow-hidden h-16">
                  {variations.tints.map((tint, i) => (
                    <div
                      key={i}
                      className="flex-1 cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: `rgb(${tint.r}, ${tint.g}, ${tint.b})` }}
                      onClick={() => updateSelectedColor(tint.r, tint.g, tint.b)}
                      title={`#${tint.r.toString(16).padStart(2,'0')}${tint.g.toString(16).padStart(2,'0')}${tint.b.toString(16).padStart(2,'0')}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};