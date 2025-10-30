// src/components/ImageConverterUI.js
import React from 'react';

export const ImageConverterUI = ({
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
	filteredFormats,
	formatCategories,
	// Handlers
	setDarkMode,
	setShowFormatMenu,
	setSearchQuery,
	setSelectedCategory,
	setShowFileDropdown,
	setOpenFormatIndex,
	applyGlobalFormat,
	updateFileFormat,
	resetConverter,
	openEdit,
	removeFile,
	handleFileDropdown,
	handleConvert,
	handleDownload,
	closeEdit,
	saveEdit,
	setIsToolsOpen,
	handleFileChange,
	setEditData,
}) => {
	// quick list of tools to show in header (kept in sync with Valuable Tools)
	const headerTools = [
		{ name: 'Image Resizer', link: '#', short: 'Resize' },
		{ name: 'Crop Image', link: '#', short: 'Crop' },
		{ name: 'Image Compressor', link: '#', short: 'Compress' },
		{ name: 'Color Picker', link: '/color-picker', short: 'Color Picker' }, // changed to "Color Picker"
		{ name: 'Image Enlarger', link: '#', short: 'Enlarge' },
		{ name: 'Collage Maker', link: '#', short: 'Collage' }
	];

	return (
		<>
			{/* ...existing styles ... */}
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
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
        html { scroll-behavior: smooth; }
        button:focus, input:focus {
          outline: none;
          box-shadow: 0 0 0 3px ${darkMode ? 'rgba(129, 140, 248, 0.4)' : 'rgba(79, 70, 229, 0.3)'};
        }
      `}</style>

			{/* Header */}
			<header className={`${darkMode ? 'bg-indigo-900' : 'bg-indigo-700'} shadow-lg sticky top-0 z-50`}>
				<div className="container mx-auto px-6 py-5">
					<div className="flex items-center justify-between">
						{/* Left: logo + title */}
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
								<svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
								</svg>
							</div>
							<h1 className="text-2xl font-bold text-white">Image Converter</h1>
						</div>

						{/* Center: tools only */}
						<div className="flex-1 flex items-center justify-center">
							<div className="hidden md:flex items-center gap-4">
								<div className="hidden lg:flex items-center gap-2">
									{headerTools.map((t) => (
										<a key={t.name} href={t.link} className="px-3 py-2 text-sm rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors" title={t.name}>
											{t.short}
										</a>
									))}
								</div>
							</div>
						</div>

						{/* Right: dark mode, sign up, login (corner) */}
						<div className="flex items-center gap-3">
							<button
								onClick={() => setDarkMode(!darkMode)}
								className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-colors ${darkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-yellow-300'}`}
								aria-label="Toggle dark mode"
								title="Toggle theme"
							>
								{darkMode ? (
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414z" clipRule="evenodd"/></svg>
								) : (
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
								)}
							</button>

							<a className="px-5 py-2.5 bg-indigo-800 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-lg" href="#signup">Sign Up</a>
							<a className="text-indigo-200 hover:text-white px-4 py-2 transition-colors font-medium" href="#login">Login</a>
						</div>
					</div>
				</div>
			</header>

			{/* Main content */}
			<main className="container mx-auto px-4 py-12 max-w-4xl">
				{/* Hero card */}
				<section className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-md p-8 mb-6`}>
					<div className="text-center">
						<h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Image Converter</h2>
						<p className={`text-xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
							CloudConvert converts your image files online. Amongst many others, we support PNG, JPG, GIF, WEBP and HEIC.
							You can use the options to control image resolution, quality and file size.
						</p>
					</div>
				</section>

				{/* Combined Format + Upload/Convert card */}
				<section className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-md p-6 mb-8`}>
					{/* --- Top: Global format selector (same markup as before) --- */}
					<div className="mb-4">
						<div className="flex flex-wrap items-center justify-center gap-3">
							<span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>convert</span>
							<div className={`px-4 py-2 ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'} rounded-lg font-medium min-w-[160px] text-center truncate`}>
								{selectedFiles.length === 1 ? selectedFiles[0].file.name : selectedFiles.length > 1 ? 'Multiple Images' : '...'}
							</div>
							<span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>to</span>
							<div className="relative format-dropdown">
								<button
									onClick={() => setShowFormatMenu(!showFormatMenu)}
									className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
								>
									{globalFormat.toUpperCase()}
									<svg className={`w-4 h-4 transition-transform ${showFormatMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
									</svg>
								</button>

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
													className={`w-full pl-10 pr-4 py-2 rounded border focus:outline-none placeholder-gray-500 ${darkMode ? 'bg-gray-800 text-white border-gray-700 focus:border-indigo-500' : 'bg-white text-gray-900 border-gray-300 focus:border-indigo-500'}`}
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
														className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedCategory === category ? 'bg-gray-700 text-white' : darkMode ? 'text-gray-300 hover:bg-gray-750 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-800'}`}
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
															className={`px-3 py-2 rounded text-sm font-medium transition-colors ${globalFormat.toUpperCase() === format ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'}`}
														>
															{format}
														</button>
													))}
												</div>
												{filteredFormats.length === 0 && <p className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No formats found</p>}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* --- Bottom: unified upload / add & convert UI (same markup as before) --- */}
					<div>
						{selectedFiles.length === 0 ? (
							/* Select file UI shown when no files are selected */
							<div className="flex flex-col items-center justify-center py-8">
								<div className="relative inline-block file-dropdown">
									<div className="flex items-stretch shadow-lg rounded-lg overflow-hidden border border-indigo-700">
										<button
											className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-8 py-4 text-lg focus:outline-none"
											style={{ borderRight: '1px solid #fff' }}
											onClick={() => handleFileDropdown('computer')}
											type="button"
										>
											<span>Select File(s)</span>
										</button>
										<button
											className="bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-4 flex items-center focus:outline-none"
											onClick={(e) => { e.stopPropagation(); setShowFileDropdown((prev) => !prev); }}
											type="button"
										>
											<svg className={`w-5 h-5 transition-transform ${showFileDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
											</svg>
										</button>
									</div>

									{showFileDropdown && (
										<div className={`absolute left-0 mt-2 w-56 rounded shadow-lg z-50 text-left ${darkMode ? 'bg-gray-800 border border-gray-700 text-gray-200' : 'bg-white border border-gray-200 text-gray-800'}`}>
											<button className={`w-full flex items-center px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => handleFileDropdown('computer')}>
												<span className="mr-2">📁</span> From my Computer
											</button>
											<button className={`w-full flex items-center px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => handleFileDropdown('folder')}>
												<span className="mr-2">📂</span> From Folder
											</button>
											<button className={`w-full flex items-center px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => handleFileDropdown('url')}>
												<span className="mr-2">🔗</span> By URL
											</button>
											<button className={`w-full flex items-center px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => handleFileDropdown('gdrive')}>
												<span className="mr-2">🟦</span> From Google Drive
											</button>
											<button className={`w-full flex items-center px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => handleFileDropdown('dropbox')}>
												<span className="mr-2">🟦</span> From Dropbox
											</button>
											<button className={`w-full flex items-center px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => handleFileDropdown('onedrive')}>
												<span className="mr-2">🟥</span> From OneDrive
											</button>
										</div>
									)}
								</div>
							</div>
						) : convertedFiles.length === 0 ? (
							/* Add more & convert UI shown when files selected and not yet converted */
							<div className="flex flex-wrap items-center justify-between">
								<div className="relative file-dropdown">
									<button
										className="bg-gray-800 text-white px-6 py-3 rounded font-semibold flex items-center gap-2 hover:bg-gray-900"
										onClick={(e) => { e.stopPropagation(); setShowFileDropdown((v) => !v); }}
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
										<div className={`absolute left-0 mt-2 w-56 rounded shadow-lg z-50 text-left ${darkMode ? 'bg-gray-800 border border-gray-700 text-gray-200' : 'bg-white border border-gray-200 text-gray-800'}`}>
											<button className={`w-full flex items-center px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => handleFileDropdown('computer')}><span className="mr-2">📁</span> From my Computer</button>
											<button className={`w-full flex items-center px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => handleFileDropdown('folder')}><span className="mr-2">📂</span> From Folder</button>
											<button className={`w-full flex items-center px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => handleFileDropdown('url')}><span className="mr-2">🔗</span> By URL</button>
											<button className={`w-full flex items-center px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => handleFileDropdown('gdrive')}><span className="mr-2">🟦</span> From Google Drive</button>
											<button className={`w-full flex items-center px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => handleFileDropdown('dropbox')}><span className="mr-2">🟦</span> From Dropbox</button>
											<button className={`w-full flex items-center px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => handleFileDropdown('onedrive')}><span className="mr-2">🟥</span> From OneDrive</button>
										</div>
									)}
								</div>
								<button
									onClick={handleConvert}
									disabled={isConverting}
									className={`px-8 py-3.5 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center gap-3 shadow-md ${isConverting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg text-white'}`}
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
						) : null}
					</div>
				</section>

				{/* Download Section */}
				{convertedFiles.length > 0 && (
					<section className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-md p-6 mb-6 animate-fadeIn`}>
						<div className="flex items-center justify-center gap-2 text-teal-600 font-semibold text-lg mb-4">
							<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
							</svg>
							Conversion complete!
						</div>

						<div className="space-y-4 mb-4">
							{convertedFiles.map((file, index) => (
								<div key={index} className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
									<div className="flex items-center gap-3">
										<svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7V3a1 1 0 011-1h8a1 1 0 011 1v4M7 7h10M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7M7 7l-2 2m0 0l2 2m-2-2h12" />
										</svg>
										<div>
											<div className={`${darkMode ? 'text-gray-200' : 'text-gray-800'} font-medium`}>{file.name}</div>
											<div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Original: {file.originalName} • Format: {file.format.toUpperCase()}</div>
											{file.appliedOptions && (
												<div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Applied: W{file.appliedOptions.width || 'Auto'} x H{file.appliedOptions.height || 'Auto'}, Fit: {file.appliedOptions.fit}, Strip: {file.appliedOptions.strip ? 'Yes' : 'No'}</div>
											)}
										</div>
									</div>

									<button onClick={() => handleDownload(file)} className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors">Download</button>
								</div>
							))}
						</div>

						<div className="flex justify-center gap-4">
							<button onClick={resetConverter} className={`px-8 py-3 rounded-lg transition-all duration-300 ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Convert Another Set</button>
						</div>
					</section>
				)}

				{/* How to Convert */}
				<section className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-8 mb-8`}>
					<h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}><span className="text-2xl">❓</span> How to Convert Images?</h2>
					<div className="space-y-4">
						<div className={`flex items-start gap-4 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
							<span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">1</span>
							<p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Click the <span className="font-semibold text-indigo-600">"Select File(s)"</span> button to upload multiple image files.</p>
						</div>
						<div className={`flex items-start gap-4 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
							<span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">2</span>
							<p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Use the <span className="font-semibold text-indigo-600">top dropdown</span> to convert all images to the same format, or use the <span className="font-semibold text-indigo-600">dropdown next to each file</span> to choose a different format for each.</p>
						</div>
						<div className={`flex items-start gap-4 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
							<span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">3</span>
							<p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Click the <span className="font-semibold text-indigo-600">"Convert All Images"</span> button to start converting.</p>
						</div>
					</div>
				</section>

				{/* Valuable Tools (restored original interactive design) */}
				<section className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-8 mb-8`}>
					<button className="w-full flex items-center justify-between text-left group" onClick={() => setIsToolsOpen(!isToolsOpen)}>
						<h2 className={`text-2xl font-bold flex items-center gap-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}><span className="text-2xl">🛠️</span> Valuable Image Tools</h2>
						<svg className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-transform duration-300 ${isToolsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
					</button>

					<div className="transition-all duration-500 ease-in-out overflow-hidden" style={{ maxHeight: isToolsOpen ? '1000px' : '0', opacity: isToolsOpen ? 1 : 0 }}>
						<p className={`mt-4 mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Here is a list of image tools to further edit your images.</p>
						<div className="space-y-3">
							{[
								{ name: 'Image Resizer', desc: 'Quick and easy way to resize an image to any size' },
								{ name: 'Crop Image', desc: 'Use this tool to crop unwanted areas from your image' },
								{ name: 'Image Compressor', desc: 'Reduce image files size by up to 80 to 90% using this tool' },
								{ name: 'Color Picker', desc: 'Pick any color from a visual palette', link: '/color-picker' },
								{ name: 'Image Enlarger', desc: 'A fast way to make your images bigger' },
								{ name: 'Collage Maker', desc: 'Create a beautiful photo collage from your photos' }
							].map((tool, index) => (
								<div
									key={tool.name}
									className={`flex items-start gap-3 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg hover:${darkMode ? 'bg-gray-600' : 'bg-gray-100'} transition-all duration-300 cursor-pointer`}
									onClick={() => {
										if (tool.link) {
											window.location.href = tool.link;
										}
									}}
								>
									<span className="flex-shrink-0 w-7 h-7 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-sm">
										{index + 1}
									</span>
									<div>
										<span className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
											{tool.name}
										</span>
										<span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}> - {tool.desc}</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* IMAGE CONVERTERS */}
				<section className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-8 mb-8`}>
					<div className="flex items-center gap-3 mb-6">
						<svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
						<h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>IMAGE CONVERTERS</h2>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3">
						<div className="space-y-3">{['3FR Converter', 'ARW Converter', 'AVIF Converter', 'BMP Converter', 'CR2 Converter', 'CR3 Converter', 'CRW Converter', 'DCR Converter', 'DNG Converter', 'EPS Converter', 'ERF Converter', 'GIF Converter', 'HEIC Converter', 'HEIF Converter'].map((c) => (<a key={c} href="#" className={`block ${darkMode ? 'text-indigo-400 hover:text-teal-400' : 'text-indigo-600 hover:text-teal-600'} hover:underline transition-colors duration-200`}>{c}</a>))}</div>
						<div className="space-y-3">{['ICNS Converter', 'ICO Converter', 'JFIF Converter', 'JPEG Converter', 'JPG Converter', 'MOS Converter', 'MRW Converter', 'NEF Converter', 'ODD Converter', 'ODG Converter', 'ORF Converter', 'PEF Converter', 'PNG Converter', 'PPM Converter'].map((c) => (<a key={c} href="#" className={`block ${darkMode ? 'text-indigo-400 hover:text-teal-400' : 'text-indigo-600 hover:text-teal-600'} hover:underline transition-colors duration-200`}>{c}</a>))}</div>
						<div className="space-y-3">{['PS Converter', 'PSD Converter', 'PUB Converter', 'RAF Converter', 'RAW Converter', 'RW2 Converter', 'TIF Converter', 'TIFF Converter', 'WEBP Converter', 'X3F Converter', 'XCF Converter', 'XPS Converter'].map((c) => (<a key={c} href="#" className={`block ${darkMode ? 'text-indigo-400 hover:text-teal-400' : 'text-indigo-600 hover:text-teal-600'} hover:underline transition-colors duration-200`}>{c}</a>))}</div>
					</div>
				</section>

				{/* Features */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{[
						{ icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>, title: 'Fast Conversion', desc: 'Convert images in seconds with optimized processing' },
						{ icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>, title: 'Secure', desc: 'Your images are processed locally in your browser' },
						{ icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>, title: 'High Quality', desc: 'Maintain image quality during format conversion' }
					].map((feature) => (
						<div key={feature.title} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-300`}>
							<div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
								<svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">{feature.icon}</svg>
							</div>
							<h3 className={`font-bold text-xl mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{feature.title}</h3>
							<p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{feature.desc}</p>
						</div>
					))}
				</div>

				{/* Footer */}
				<footer className={`${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'} mt-16 py-8 border-t`}>
					<div className="container mx-auto px-4 text-center">
						<div className="flex items-center justify-center gap-2 mb-2">
							<div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
								<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
							</div>
							<span className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Image Converter</span>
						</div>
						<p>© {new Date().getFullYear()} All rights reserved.</p>
					</div>
				</footer>

				{/* Hidden File Input */}
				<input id="fileInput" type="file" accept="image/*" onChange={handleFileChange} className="hidden" multiple />

				{/* Edit Modal */}
				{editIndex !== null && editData && (
					<div className="fixed inset-0 z-60 flex items-center justify-center">
						<div className="absolute inset-0 bg-black opacity-50" onClick={closeEdit}></div>
						<div className="relative bg-white rounded-lg shadow-xl w-11/12 max-w-2xl p-6 z-70">
							<div className="flex items-start justify-between">
								<h3 className="text-xl font-semibold">Edit Image Options</h3>
								<button onClick={closeEdit} className="text-gray-600 hover:text-gray-800 text-2xl">&times;</button>
							</div>
							<div className="mt-4 flex flex-col md:flex-row gap-4">
								<div className="flex-shrink-0 w-48 h-48 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
									<img src={editData.url} alt={editData.name} className="max-w-full max-h-full" />
								</div>
								<div className="flex-1">
									<p className="font-medium text-gray-800">{editData.name}</p>
									<p className="text-sm text-gray-500 mt-2">Original Dimensions: <span className="font-semibold text-gray-700">{editData.width} × {editData.height}</span></p>
									<div className="mt-4 space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
												<input type="number" min="1" value={editData.options.width || ''} onChange={(e) => setEditData(prev => ({ ...prev, options: { ...prev.options, width: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Leave blank for auto" />
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
												<input type="number" min="1" value={editData.options.height || ''} onChange={(e) => setEditData(prev => ({ ...prev, options: { ...prev.options, height: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Leave blank for auto" />
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">Fit</label>
											<select value={editData.options.fit} onChange={(e) => setEditData(prev => ({ ...prev, options: { ...prev.options, fit: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
												<option value="max">Max</option>
												<option value="crop">Crop</option>
												<option value="scale">Scale</option>
											</select>
											<p className="mt-1 text-xs text-gray-500">Max: Resizes to fit within dimensions without increasing size. Crop: Resizes to fill dimensions and crops excess. Scale: Enforces exact dimensions by scaling.</p>
										</div>
										<div className="flex items-center">
											<label className="inline-flex items-center">
												<input type="radio" checked={!editData.options.strip} onChange={() => setEditData(prev => ({ ...prev, options: { ...prev.options, strip: false } }))} className="form-radio h-4 w-4 text-indigo-600" />
												<span className="ml-2 text-sm text-gray-700">Keep Metadata</span>
											</label>
											<label className="inline-flex items-center ml-6">
												<input type="radio" checked={editData.options.strip} onChange={() => setEditData(prev => ({ ...prev, options: { ...prev.options, strip: true } }))} className="form-radio h-4 w-4 text-indigo-600" />
												<span className="ml-2 text-sm text-gray-700">Strip Metadata</span>
											</label>
										</div>
									</div>
								</div>
							</div>
							<div className="mt-6 flex justify-end gap-3">
								<button onClick={closeEdit} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
								<button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Okay</button>
							</div>
						</div>
					</div>
				)}
			</main>
		</>
	);
};