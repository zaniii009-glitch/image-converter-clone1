import React, { useState } from 'react';

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [globalFormat, setGlobalFormat] = useState('jpg'); // Default global format
  const [isConverting, setIsConverting] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Image');
  const [showFileDropdown, setShowFileDropdown] = useState(false);
  const [openFormatIndex, setOpenFormatIndex] = useState(null); // which per-file format menu is open
  const [editIndex, setEditIndex] = useState(null); // index of file being edited
  const [editData, setEditData] = useState(null);   // { name, format, size, width, height, url, options: { width, height, fit, strip } }
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

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      const filesWithFormat = imageFiles.map(file => ({
        file,
        format: globalFormat, // Initially use global format
        options: { // Add default options for editing
          width: null,
          height: null,
          fit: 'max',
          strip: false
        }
      }));
      setSelectedFiles(prev => [...prev, ...filesWithFormat]);
      setConvertedFiles([]);
    } else {
      alert('Please select valid image files');
    }
  };

  // Update format for a specific file
  const updateFileFormat = (index, newFormat) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles[index].format = newFormat;
    setSelectedFiles(updatedFiles);
    setOpenFormatIndex(null); // close per-file menu after select
  };

  // Apply global format to all files
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
      const { file, format, options } = selectedFiles[i]; // Destructure options
      try {
        const img = new Image();
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

        // Apply resizing based on options
        if (options.width || options.height) {
          let targetWidth = options.width ? parseInt(options.width) : canvasWidth;
          let targetHeight = options.height ? parseInt(options.height) : canvasHeight;

          if (options.fit === 'max') {
            // Resize to fit within dimensions without increasing size
            const ratio = Math.min(targetWidth / canvasWidth, targetHeight / canvasHeight, 1);
            canvasWidth = Math.round(canvasWidth * ratio);
            canvasHeight = Math.round(canvasHeight * ratio);
          } else if (options.fit === 'crop') {
            // Resize to fill dimensions, crop excess
            const ratio = Math.max(targetWidth / canvasWidth, targetHeight / canvasHeight);
            canvasWidth = Math.round(canvasWidth * ratio);
            canvasHeight = Math.round(canvasHeight * ratio);
          } else if (options.fit === 'scale') {
            // Enforce exact dimensions by scaling
            canvasWidth = targetWidth;
            canvasHeight = targetHeight;
          }
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Calculate position to draw the image (for crop and scale)
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
              // Include applied options in converted file info
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

  // Remove a single file from selection
  const removeFile = (index) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    // adjust/close open per-file menu
    if (openFormatIndex === index) {
      setOpenFormatIndex(null);
    } else if (openFormatIndex !== null && openFormatIndex > index) {
      setOpenFormatIndex(openFormatIndex - 1);
    }
    // clear converted results when selection changes
    if (convertedFiles.length) setConvertedFiles([]);
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
    } else {
      alert('This option is not implemented yet.');
    }
  };

  // Open edit modal for a specific file and gather preview + metadata
  const openEdit = (index) => {
    const item = selectedFiles[index];
    if (!item) return;
    const file = item.file;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setEditData({
        name: file.name,
        format: item.format,
        size: file.size,
        width: img.width,
        height: img.height,
        url,
        options: { ...item.options } // Pass current options to modal
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

  // Save edited options back to the file
  const saveEdit = () => {
    if (editIndex !== null && editData) {
      const updatedFiles = [...selectedFiles];
      updatedFiles[editIndex].options = { ...editData.options }; // Save the modified options
      setSelectedFiles(updatedFiles);
      closeEdit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden" onClick={(e) => {
      if (!e.target.closest('.format-dropdown')) {
        setShowFormatMenu(false);
      }
      if (!e.target.closest('.file-dropdown')) {
        setShowFileDropdown(false);
      }
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .animate-spin-slow { animation: spin 3s linear infinite; }
      `}</style>
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-2xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Image Converter</h1>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button className="text-gray-300 hover:text-white transition-colors">Tools</button>
              <button className="text-gray-300 hover:text-white transition-colors">API</button>
              <button className="text-gray-300 hover:text-white transition-colors">Pricing</button>
              <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">Sign Up</button>
              <button className="px-4 py-2 text-gray-300 hover:text-white transition-colors">Login</button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Image Converter</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            CloudConvert converts your image files online. Amongst many others, we support PNG, JPG, GIF, WEBP and HEIC.
            You can use the options to control image resolution, quality and file size.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          {/* ✅ Upar wala original global dropdown — ab "Per File" ki jagah yeh hai */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <span className="text-gray-700 font-medium text-lg">convert</span>
            <select
              className="px-6 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none bg-white text-lg"
              value={selectedFiles.length > 0 ? 'images' : ''}
              disabled
            >
              <option value="">...</option>
              {selectedFiles.length > 0 && <option value="images">Multiple Images</option>}
            </select>
            <span className="text-gray-700 font-medium text-lg">to</span>
            {/* ✅ Original Full-Featured Global Dropdown */}
            <div className="relative format-dropdown">
              <button
                onClick={() => setShowFormatMenu(!showFormatMenu)}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none bg-white text-lg font-medium flex items-center gap-2 hover:border-red-400 transition-colors"
              >
                {globalFormat.toUpperCase()}
                <svg className={`w-4 h-4 transition-transform ${showFormatMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              {/* Format Menu Dropdown */}
              {showFormatMenu && (
                <div className="absolute top-full mt-2 w-96 bg-gray-900 rounded-lg shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-700">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                      <input
                        type="text"
                        placeholder="Search Format"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-red-500 focus:outline-none placeholder-gray-500"
                      />
                    </div>
                  </div>
                  <div className="flex max-h-96">
                    <div className="w-40 bg-gray-800 border-r border-gray-700 overflow-y-auto">
                      {Object.keys(formatCategories).map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(category);
                            setSearchQuery('');
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            selectedCategory === category
                              ? 'bg-gray-700 text-white'
                              : 'text-gray-400 hover:bg-gray-750 hover:text-white'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
                      <div className="grid grid-cols-3 gap-2">
                        {filteredFormats.map((format) => (
                          <button
                            key={format}
                            onClick={() => {
                              applyGlobalFormat(format.toLowerCase());
                              setShowFormatMenu(false);
                              setSearchQuery('');
                            }}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                              globalFormat.toUpperCase() === format
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            {format}
                          </button>
                        ))}
                      </div>
                      {filteredFormats.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No formats found</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Upload Section */}
          <div className="mb-8">
            {/* File List Bar (show when files are selected) */}
            {selectedFiles.length > 0 && convertedFiles.length === 0 && (
              <div className="bg-white border rounded shadow mb-8">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7V3a1 1 0 011-1h8a1 1 0 011 1v4M7 7h10M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7M7 7l-2 2m0 0l2 2m-2-2h12" />
                      </svg>
                      <span className="text-gray-800 font-medium">{selectedFiles.length} Image{selectedFiles.length > 1 ? 's' : ''} Selected</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        className="ml-4 text-red-600 hover:text-red-800"
                        onClick={resetConverter}
                        title="Remove All"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                {/* ✅ Har file ke samne chhota dropdown */}
                <div className="max-h-60 overflow-y-auto p-4 space-y-3">
                  {selectedFiles.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7V3a1 1 0 011-1h8a1 1 0 011 1v4M7 7h10M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7M7 7l-2 2m0 0l2 2m-2-2h12" />
                      </svg>
                      <span className="text-gray-800 truncate flex-1">{item.file.name}</span>
                      {/* Per-file full format menu (toggle button + full menu like global) */}
                      <div className="relative format-dropdown">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setOpenFormatIndex(openFormatIndex === index ? null : index);
                          }}
                          className="px-3 py-1 border border-gray-300 rounded text-sm bg-white"
                        >
                          {item.format ? item.format.toUpperCase() : '...'}
                        </button>
                        {openFormatIndex === index && (
                          <div className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-lg shadow-2xl z-50 overflow-hidden">
                            <div className="p-3 border-b border-gray-700">
                              <div className="relative">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                                <input
                                  type="text"
                                  placeholder="Search Format"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-red-500 focus:outline-none placeholder-gray-500 text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex max-h-56">
                              <div className="w-28 bg-gray-800 border-r border-gray-700 overflow-y-auto">
                                {Object.keys(formatCategories).map((category) => (
                                  <button
                                    key={category}
                                    onClick={() => {
                                      setSelectedCategory(category);
                                      setSearchQuery('');
                                    }}
                                    className={`w-full text-left px-2 py-2 text-xs transition-colors ${
                                      selectedCategory === category ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-750 hover:text-white'
                                    }`}
                                  >
                                    {category}
                                  </button>
                                ))}
                              </div>
                              <div className="flex-1 p-3 overflow-y-auto bg-gray-900">
                                <div className="grid grid-cols-3 gap-2">
                                  {filteredFormats.map((fmt) => (
                                    <button
                                      key={fmt}
                                      onClick={() => updateFileFormat(index, fmt.toLowerCase())}
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        item.format.toUpperCase() === fmt ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                      }`}
                                    >
                                      {fmt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Edit single file button */}
                      <button
                        onClick={() => openEdit(index)}
                        className="ml-3 text-blue-600 hover:text-blue-800 p-1"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5h6M4 21l7-7 3 3 7-7-3-3L8 17l-4 4z" />
                        </svg>
                      </button>
                      {/* Remove single file button */}
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-3 text-red-600 hover:text-red-800 p-1"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Add more files & Convert button row */}
            {selectedFiles.length > 0 && convertedFiles.length === 0 && (
              <div className="flex flex-wrap items-center justify-between mb-8">
                <div className="relative file-dropdown">
                  <button
                    className="bg-gray-800 text-white px-6 py-3 rounded font-semibold flex items-center gap-2 hover:bg-gray-900"
                    onClick={e => {
                      e.stopPropagation();
                      setShowFileDropdown(v => !v);
                    }}
                    type="button"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add More Files
                    <svg className={`w-4 h-4 ml-2 transition-transform ${showFileDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {showFileDropdown && (
                    <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded shadow-lg z-50 text-left">
                      <button
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFileDropdown('computer')}
                      >
                        <span className="mr-2">📁</span> From my Computer
                      </button>
                      <button
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFileDropdown('folder')}
                      >
                        <span className="mr-2">📂</span> From Folder
                      </button>
                      <button
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFileDropdown('url')}
                      >
                        <span className="mr-2">🔗</span> By URL
                      </button>
                      <button
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFileDropdown('gdrive')}
                      >
                        <span className="mr-2">🟦</span> From Google Drive
                      </button>
                      <button
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFileDropdown('dropbox')}
                      >
                        <span className="mr-2">🟦</span> From Dropbox
                      </button>
                      <button
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFileDropdown('onedrive')}
                      >
                        <span className="mr-2">⬛</span> From OneDrive
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="bg-red-400 hover:bg-red-500 text-white px-10 py-3 rounded font-semibold flex items-center gap-2 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Convert All
                </button>
              </div>
            )}
            {/* Upload Area — CENTERED, WITHOUT ICON */}
            {selectedFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative inline-block file-dropdown">
                  <div className="flex items-stretch shadow-lg rounded-lg overflow-hidden border border-red-700">
                    <button
                      className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white font-semibold px-8 py-4 text-lg focus:outline-none"
                      style={{ borderRight: '1px solid #fff' }}
                      onClick={() => {
                        const input = document.getElementById('fileInput');
                        if (input) {
                          input.value = '';
                          input.removeAttribute('webkitdirectory');
                          input.removeAttribute('directory');
                          input.setAttribute('multiple', '');
                          input.accept = 'image/*';
                          input.click();
                        }
                      }}
                      type="button"
                    >
                      <span>Select File(s)</span>
                    </button>
                    <button
                      className="bg-red-700 hover:bg-red-800 text-white px-5 py-4 flex items-center focus:outline-none"
                      onClick={e => {
                        e.stopPropagation();
                        setShowFileDropdown((v) => !v);
                      }}
                      type="button"
                      tabIndex={0}
                    >
                      <svg className={`w-5 h-5 transition-transform ${showFileDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                  </div>
                  {showFileDropdown && (
                    <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded shadow-lg z-50 text-left">
                      <button
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFileDropdown('computer')}
                      >
                        <span className="mr-2">📁</span> From my Computer
                      </button>
                      <button
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFileDropdown('folder')}
                      >
                        <span className="mr-2">📂</span> From Folder
                      </button>
                      <button
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFileDropdown('url')}
                      >
                        <span className="mr-2">🔗</span> By URL
                      </button>
                      <button
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFileDropdown('gdrive')}
                      >
                        <span className="mr-2">🟦</span> From Google Drive
                      </button>
                      <button
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFileDropdown('dropbox')}
                      >
                        <span className="mr-2">🟦</span> From Dropbox
                      </button>
                      <button
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFileDropdown('onedrive')}
                      >
                        <span className="mr-2">⬛</span> From OneDrive
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-4">or drop files here</p>
              </div>
            )}
          </div>
          {/* Convert Button */}
          {selectedFiles.length > 0 && convertedFiles.length === 0 && (
            <div className="flex justify-center mb-8 animate-fadeIn">
              <button
                onClick={handleConvert}
                disabled={isConverting}
                className={`px-12 py-4 rounded-lg text-white font-semibold text-lg transition-all duration-300 flex items-center gap-3 ${
                  isConverting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 hover:shadow-lg'
                }`}
              >
                {isConverting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Converting...
                  </>
                ) : (
                  'Convert All Images'
                )}
              </button>
            </div>
          )}
          {/* Download Section */}
          {convertedFiles.length > 0 && (
            <div className="mt-8 animate-fadeIn">
              <div className="flex items-center justify-center gap-2 text-green-600 font-semibold text-lg mb-6">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Conversion complete!
              </div>
              <div className="space-y-4 mb-6">
                {convertedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7V3a1 1 0 011-1h8a1 1 0 011 1v4M7 7h10M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7M7 7l-2 2m0 0l2 2m-2-2h12" />
                      </svg>
                      <div>
                        <div className="text-gray-800 font-medium">{file.name}</div>
                        <div className="text-xs text-gray-500">Original: {file.originalName} • Format: {file.format.toUpperCase()}</div>
                        {/* Show applied options if they exist */}
                        {file.appliedOptions && (
                          <div className="text-xs text-gray-500">
                            Applied: W{file.appliedOptions.width || 'Auto'} x H{file.appliedOptions.height || 'Auto'}, Fit: {file.appliedOptions.fit}, Strip: {file.appliedOptions.strip ? 'Yes' : 'No'}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(file)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={resetConverter}
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300"
                >
                  Convert Another Set
                </button>
              </div>
            </div>
          )}
        </div>
        {/* How to Convert Section */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-2xl">❓</span>
            How to Convert Images?
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
              <p className="text-gray-700">Click the <span className="font-semibold text-red-600">"Select File(s)"</span> button to upload multiple image files.</p>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
              <p className="text-gray-700">
                Use the <span className="font-semibold text-red-600">top dropdown</span> to convert all images to the same format,
                or use the <span className="font-semibold text-red-600">dropdown next to each file</span> to choose a different format for each.
              </p>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
              <p className="text-gray-700">Click the <span className="font-semibold text-red-600">"Convert All Images"</span> button to start converting.</p>
            </div>
          </div>
        </div>
        {/* Valuable Image Tools Section */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <button
            className="w-full flex items-center justify-between text-left group"
            onClick={() => setIsToolsOpen(!isToolsOpen)}
          >
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-2xl">🛠️</span>
              Valuable Image Tools
            </h2>
            <svg
              className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${isToolsOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <div
            className="transition-all duration-500 ease-in-out overflow-hidden"
            style={{
              maxHeight: isToolsOpen ? '1000px' : '0',
              opacity: isToolsOpen ? 1 : 0
            }}
          >
            <p className="text-gray-600 mt-4 mb-6">Here is a list of image tools to further edit your images.</p>
            <div className="space-y-3">
              {[
                { name: 'Image Resizer', desc: 'Quick and easy way to resize an image to any size' },
                { name: 'Crop Image', desc: 'Use this tool to crop unwanted areas from your image' },
                { name: 'Image Compressor', desc: 'Reduce image files size by up to 80 to 90% using this tool' },
                { name: 'Color Picker', desc: 'Quickly pick a color from the color wheel or from your image online' },
                { name: 'Image Enlarger', desc: 'A fast way to make your images bigger' },
                { name: 'Collage Maker', desc: 'Create a beautiful photo collage from your photos' }
              ].map((tool, index) => (
                <div
                  key={tool.name}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300"
                >
                  <span className="flex-shrink-0 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <a href="#" className="font-semibold text-red-600 hover:text-red-700 hover:underline">
                      {tool.name}
                    </a>
                    <span className="text-gray-600"> - {tool.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Image Converters Section */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <h2 className="text-2xl font-bold text-gray-800">IMAGE CONVERTERS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3">
            <div className="space-y-3">
              {['3FR Converter', 'ARW Converter', 'AVIF Converter', 'BMP Converter', 'CR2 Converter', 'CR3 Converter', 'CRW Converter', 'DCR Converter', 'DNG Converter', 'EPS Converter', 'ERF Converter', 'GIF Converter', 'HEIC Converter', 'HEIF Converter'].map((converter) => (
                <a
                  key={converter}
                  href="#"
                  className="block text-red-600 hover:text-red-700 hover:underline transition-colors"
                >
                  {converter}
                </a>
              ))}
            </div>
            <div className="space-y-3">
              {['ICNS Converter', 'ICO Converter', 'JFIF Converter', 'JPEG Converter', 'JPG Converter', 'MOS Converter', 'MRW Converter', 'NEF Converter', 'ODD Converter', 'ODG Converter', 'ORF Converter', 'PEF Converter', 'PNG Converter', 'PPM Converter'].map((converter) => (
                <a
                  key={converter}
                  href="#"
                  className="block text-red-600 hover:text-red-700 hover:underline transition-colors"
                >
                  {converter}
                </a>
              ))}
            </div>
            <div className="space-y-3">
              {['PS Converter', 'PSD Converter', 'PUB Converter', 'RAF Converter', 'RAW Converter', 'RW2 Converter', 'TIF Converter', 'TIFF Converter', 'WEBP Converter', 'X3F Converter', 'XCF Converter', 'XPS Converter'].map((converter) => (
                <a
                  key={converter}
                  href="#"
                  className="block text-red-600 hover:text-red-700 hover:underline transition-colors"
                >
                  {converter}
                </a>
              ))}
            </div>
          </div>
        </div>
        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              ),
              title: 'Fast Conversion',
              desc: 'Convert images in seconds with optimized processing'
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              ),
              title: 'Secure',
              desc: 'Your images are processed locally in your browser'
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              ),
              title: 'High Quality',
              desc: 'Maintain image quality during format conversion'
            }
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {feature.icon}
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-800">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
      {/* Footer */}
      <footer className="bg-white mt-16 py-8 border-t-2 border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <span className="font-bold text-gray-700">Image Converter</span>
          </div>
          <p className="text-gray-600">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
      {/* Hidden File Input */}
      <input
        id="fileInput"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        multiple
      />
      {/* Edit Modal */}
      {editIndex !== null && editData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={closeEdit}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-11/12 max-w-2xl p-6 z-70">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-semibold">Edit Image Options</h3>
              <button onClick={closeEdit} className="text-gray-600 hover:text-gray-800">&times;</button>
            </div>
            <div className="mt-4 flex flex-col md:flex-row gap-4">
              <div className="flex-shrink-0 w-48 h-48 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                <img src={editData.url} alt={editData.name} className="max-w-full max-h-full" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{editData.name}</p>
                <p className="text-sm text-gray-500 mt-2">Original Dimensions: <span className="font-semibold text-gray-700">{editData.width} × {editData.height}</span></p>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        min="1"
                        value={editData.options.width || ''}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          options: { ...prev.options, width: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        placeholder="Leave blank for auto"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        min="1"
                        value={editData.options.height || ''}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          options: { ...prev.options, height: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        placeholder="Leave blank for auto"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fit</label>
                    <select
                      value={editData.options.fit}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        options: { ...prev.options, fit: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="max">Max</option>
                      <option value="crop">Crop</option>
                      <option value="scale">Scale</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Max: Resizes to fit within dimensions without increasing size.
                      Crop: Resizes to fill dimensions and crops excess.
                      Scale: Enforces exact dimensions by scaling.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={!editData.options.strip}
                        onChange={() => setEditData(prev => ({
                          ...prev,
                          options: { ...prev.options, strip: false }
                        }))}
                        className="form-radio h-4 w-4 text-red-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="inline-flex items-center ml-6">
                      <input
                        type="radio"
                        checked={editData.options.strip}
                        onChange={() => setEditData(prev => ({
                          ...prev,
                          options: { ...prev.options, strip: true }
                        }))}
                        className="form-radio h-4 w-4 text-red-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                    <span className="ml-4 text-sm text-gray-500">Remove any metadata such as EXIF data.</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeEdit} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;