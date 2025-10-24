// src/components/ImageConverterLogic.js
import { useState, useEffect } from 'react';

export const useImageConverter = () => {
  // ========== Dark Mode State ==========
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // ========== State ==========
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [globalFormat, setGlobalFormat] = useState('jpg');
  const [isConverting, setIsConverting] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Image');
  const [showFileDropdown, setShowFileDropdown] = useState(false);
  const [openFormatIndex, setOpenFormatIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState(null);
  const [urlInput, setUrlInput] = useState('');

  const formatCategories = {
    'Archive': ['AZW', 'AZW3', 'AZW4', 'CBR', 'CBZ'],
    'Audio': ['MP3', 'WAV', 'AAC', 'FLAC', 'OGG'],
    'Cad': ['DWG', 'DXF', 'DWF'],
    'Document': ['PDF', 'DOC', 'DOCX', 'TXT', 'RTF'],
    'Ebook': ['EPUB', 'MOBI', 'AZW', 'FB2'],
    'Font': ['TTF', 'OTF', 'WOFF', 'WOFF2'],
    'Image': ['JPG', 'PNG', 'GIF', 'WEBP', 'BMP', 'SVG', 'ICO', 'TIFF'],
    'Other': ['ZIP', 'RAR', '7Z'],
    'Presentation': ['PPT', 'PPTX', 'ODP'],
    'Spreadsheet': ['XLS', 'XLSX', 'CSV', 'ODS'],
    'Vector': ['SVG', 'EPS', 'AI'],
    'Video': ['MP4', 'AVI', 'MKV', 'MOV', 'WMV']
  };

  const filteredFormats = searchQuery
    ? Object.values(formatCategories).flat().filter(format =>
        format.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : formatCategories[selectedCategory] || [];

  // ========== Helper Functions ==========

  const urlToFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) throw new Error('URL is not an image');
      const file = new File([blob], filename, { type: blob.type });
      return file;
    } catch (err) {
      console.error('Failed to fetch image from URL:', err);
      throw err;
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter(file => {
      const mime = file.type;
      const ext = file.name.split('.').pop().toLowerCase();
      const validImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff'];
      return mime.startsWith('image/') || validImageTypes.includes(ext);
    });
    if (imageFiles.length > 0) {
      const filesWithFormat = imageFiles.map(file => ({
        file,
        format: globalFormat,
        options: {
          width: null,
          height: null,
          fit: 'max',
          strip: false
        }
      }));
      setSelectedFiles(prev => [...prev, ...filesWithFormat]);
      setConvertedFiles([]);
    } else {
      alert('No valid image files found. Please select images only.');
    }
  };

  const updateFileFormat = (index, newFormat) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles[index].format = newFormat;
    setSelectedFiles(updatedFiles);
    setOpenFormatIndex(null);
  };

  const applyGlobalFormat = (newFormat) => {
    setGlobalFormat(newFormat);
    const updatedFiles = selectedFiles.map(item => ({ ...item, format: newFormat }));
    setSelectedFiles(updatedFiles);
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one image first');
      return;
    }
    setIsConverting(true);
    const newConvertedFiles = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const { file, format, options } = selectedFiles[i];
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = URL.createObjectURL(file);
        await new Promise(resolve => {
          img.onload = () => resolve();
          img.onerror = () => {
            alert(`Error loading image: ${file.name}`);
            setIsConverting(false);
            return;
          };
        });

        let canvasWidth = img.width;
        let canvasHeight = img.height;

        if (options.width || options.height) {
          let targetWidth = options.width ? parseInt(options.width) : canvasWidth;
          let targetHeight = options.height ? parseInt(options.height) : canvasHeight;
          if (options.fit === 'max') {
            const ratio = Math.min(targetWidth / canvasWidth, targetHeight / canvasHeight, 1);
            canvasWidth = Math.round(canvasWidth * ratio);
            canvasHeight = Math.round(canvasHeight * ratio);
          } else if (options.fit === 'crop') {
            const ratio = Math.max(targetWidth / canvasWidth, targetHeight / canvasHeight);
            canvasWidth = Math.round(canvasWidth * ratio);
            canvasHeight = Math.round(canvasHeight * ratio);
          } else if (options.fit === 'scale') {
            canvasWidth = targetWidth;
            canvasHeight = targetHeight;
          }
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        let dx = 0, dy = 0, dw = canvasWidth, dh = canvasHeight;

        if (options.fit === 'crop' || options.fit === 'scale') {
          const ratio = Math.max(canvasWidth / img.width, canvasHeight / img.height);
          sw = canvasWidth / ratio;
          sh = canvasHeight / ratio;
          sx = (img.width - sw) / 2;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

        let mimeType;
        switch(format.toLowerCase()) {
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          default:
            mimeType = 'image/jpeg';
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const newFileName = file.name.replace(/\.[^/.]+$/, `.${format}`);
            newConvertedFiles.push({
              name: newFileName,
              url: URL.createObjectURL(blob),
              blob: blob,
              originalName: file.name,
              format: format,
              appliedOptions: options
            });
          }
          if (newConvertedFiles.length === selectedFiles.length) {
            setConvertedFiles(newConvertedFiles);
            setIsConverting(false);
          }
        }, mimeType, 0.9);
      } catch (error) {
        console.error('Conversion error for file:', file.name, error);
        alert(`An error occurred during conversion of ${file.name}`);
        setIsConverting(false);
        return;
      }
    }
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetConverter = () => {
    setSelectedFiles([]);
    setConvertedFiles([]);
    setIsConverting(false);
    setOpenFormatIndex(null);
  };

  const removeFile = (index) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    if (openFormatIndex === index) setOpenFormatIndex(null);
    else if (openFormatIndex !== null && openFormatIndex > index) setOpenFormatIndex(openFormatIndex - 1);
    if (convertedFiles.length) setConvertedFiles([]);
  };

  const handleAddByUrl = async () => {
    const url = urlInput.trim();
    if (!url) {
      alert('Please enter a valid image URL');
      return;
    }
    try {
      const filename = url.split('/').pop().split('?')[0] || 'image.jpg';
      const file = await urlToFile(url, filename);
      const filesWithFormat = [{
        file,
        format: globalFormat,
        options: {
          width: null,
          height: null,
          fit: 'max',
          strip: false
        }
      }];
      setSelectedFiles(prev => [...prev, ...filesWithFormat]);
      setConvertedFiles([]);
      setUrlInput('');
      setShowFileDropdown(false);
    } catch (err) {
      alert('Failed to load image from URL. Please check the link and ensure it points to a direct image.');
    }
  };

  const handleFileDropdown = (option) => {
    setShowFileDropdown(false);
    if (option === 'computer') {
      const input = document.getElementById('fileInput');
      if (input) {
        input.value = '';
        input.removeAttribute('webkitdirectory');
        input.removeAttribute('directory');
        input.setAttribute('multiple', '');
        input.accept = 'image/*';
        input.click();
      }
    } else if (option === 'folder') {
      const input = document.getElementById('fileInput');
      if (input) {
        input.value = '';
        input.setAttribute('webkitdirectory', '');
        input.setAttribute('directory', '');
        input.setAttribute('multiple', '');
        input.removeAttribute('accept');
        input.click();
      }
    } else if (option === 'url') {
      const userUrl = prompt('Enter image URL (must end with .jpg, .png, etc.):');
      if (userUrl) {
        setUrlInput(userUrl);
        setTimeout(() => handleAddByUrl(), 0);
      }
    } else {
      alert('This option is not implemented yet.');
    }
  };

  const openEdit = (index) => {
    const item = selectedFiles[index];
    if (!item) return;
    const file = item.file;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      setEditData({
        name: file.name,
        format: item.format,
        size: file.size,
        width: img.width,
        height: img.height,
        url,
        options: { ...item.options }
      });
      setEditIndex(index);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert('Unable to load image preview');
    };
  };

  const closeEdit = () => {
    if (editData && editData.url) {
      URL.revokeObjectURL(editData.url);
    }
    setEditData(null);
    setEditIndex(null);
  };

  const saveEdit = () => {
    if (editIndex !== null && editData) {
      const updatedFiles = [...selectedFiles];
      updatedFiles[editIndex].options = { ...editData.options };
      setSelectedFiles(updatedFiles);
      closeEdit();
    }
  };

  return {
    // State
    darkMode,
    selectedFiles,
    convertedFiles,
    globalFormat,
    isConverting,
    isToolsOpen,
    showFormatMenu,
    searchQuery,
    selectedCategory,
    showFileDropdown,
    openFormatIndex,
    editIndex,
    editData,
    urlInput,
    filteredFormats,
    formatCategories,
    
    // Setters
    setDarkMode,
    setSelectedFiles,
    setConvertedFiles,
    setGlobalFormat,
    setIsConverting,
    setIsToolsOpen,
    setShowFormatMenu,
    setSearchQuery,
    setSelectedCategory,
    setShowFileDropdown,
    setOpenFormatIndex,
    setEditIndex,
    setEditData,
    setUrlInput,

    // Handlers
    handleFileChange,
    updateFileFormat,
    applyGlobalFormat,
    handleConvert,
    handleDownload,
    resetConverter,
    removeFile,
    handleAddByUrl,
    handleFileDropdown,
    openEdit,
    closeEdit,
    saveEdit,
    setIsToolsOpen,
    handleFileChange,
    setEditData,
  };
};