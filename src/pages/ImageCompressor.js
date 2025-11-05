import React from 'react';

export const ImageCompressor = ({ darkMode, setDarkMode }) => {
  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <h1 className="text-3xl font-bold mb-4">Image Compressor</h1>
      <p className="mb-6">Reduce image file size by up to 80–90% without losing quality.</p>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <p className="text-gray-600 dark:text-gray-300">Image compression tool will go here.</p>
      </div>
    </div>
  );
};

export default ImageCompressor;