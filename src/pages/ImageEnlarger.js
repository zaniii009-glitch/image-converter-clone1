import React from 'react';

export const ImageEnlarger = ({ darkMode, setDarkMode }) => {
  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <h1 className="text-3xl font-bold mb-4">Image Enlarger</h1>
      <p className="mb-6">Enlarge your images while preserving clarity and detail.</p>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <p className="text-gray-600 dark:text-gray-300">AI-powered image enlarger will go here.</p>
      </div>
    </div>
  );
};

export default ImageEnlarger;