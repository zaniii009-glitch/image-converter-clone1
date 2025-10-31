// src/components/ImageConverterUI.js
import React, { useState, useRef, useEffect } from 'react';

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
	// --- Image crop modal state ---
	const [showCropModal, setShowCropModal] = useState(false);
	const [cropImageSrc, setCropImageSrc] = useState(null);
	const [rotation, setRotation] = useState(0); // 0 | 90 | 180 | 270
	const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
	// interactive crop box (display pixels) while modal open
	// cropBox: { x, y, size } in displayed pixels relative to the modal's preview container
	const [cropBox, setCropBox] = useState({ x: 0, y: 0, size: 0 });
	// displayed image rectangle relative to the preview container (left/top inside parent)
	const [imgDisplay, setImgDisplay] = useState({ left: 0, top: 0, width: 0, height: 0 });
	const dragState = useRef(null); // { mode: 'move' | 'resize', corner, startX, startY, startBox }
	const imgRef = useRef(null);
	const tempObjectUrlRef = useRef(null);
	// DOM ref to displayed image for click mapping
	const previewRef = useRef(null);
	const mouseMoveHandlerRef = useRef(null);
	const mouseUpHandlerRef = useRef(null);

	// Open crop modal for first selected file
	const openCropModalForSelected = () => {
		if (!selectedFiles || selectedFiles.length === 0) {
			alert('Please select an image first.');
			return;
		}
		const file = selectedFiles[0].file;
		const url = file.preview || URL.createObjectURL(file);
		tempObjectUrlRef.current = url;
		setCropImageSrc(url);
		setShowCropModal(true);
		setRotation(0);
		setImgNatural({ w: 0, h: 0 });
		// no fixed percent UI — crop box will be initialized on image load
	};

	const closeCropModal = () => {
		setShowCropModal(false);
		// revoke temporary object url if we created one
		if (tempObjectUrlRef.current) {
			try { URL.revokeObjectURL(tempObjectUrlRef.current); } catch (e) {}
			tempObjectUrlRef.current = null;
		}
		setCropImageSrc(null);
	};

	const onCropImageLoad = (e) => {
		const w = e.target.naturalWidth;
		const h = e.target.naturalHeight;
		setImgNatural({ w, h });
		// initialize displayed crop box centered inside preview
		requestAnimationFrame(() => {
			if (!previewRef.current) return;
			const imgRect = previewRef.current.getBoundingClientRect();
			const parentRect = previewRef.current.parentElement.getBoundingClientRect();
			// image position relative to the parent container
			const left = Math.round(imgRect.left - parentRect.left);
			const top = Math.round(imgRect.top - parentRect.top);
			const dispW = imgRect.width;
			const dispH = imgRect.height;
			setImgDisplay({ left, top, width: dispW, height: dispH });
			// initialize crop box centered over the displayed image area
			const side = Math.round(Math.min(dispW, dispH) * 0.9); // 90% of smaller side
			const x = left + Math.round((dispW - side) / 2);
			const y = top + Math.round((dispH - side) / 2);
			setCropBox({ x, y, size: side });
		});
	};

	const rotateLeft = () => setRotation((r) => (r + 270) % 360);
	const rotateRight = () => setRotation((r) => (r + 90) % 360);

	const cropCenterSquare = () => {
		// center cropBox to full preview square (max) relative to the displayed image area
		if (!previewRef.current) return;
		const d = imgDisplay.width && imgDisplay.height ? imgDisplay : (() => {
			const rect = previewRef.current.getBoundingClientRect();
			const parentRect = previewRef.current.parentElement.getBoundingClientRect();
			return { left: Math.round(rect.left - parentRect.left), top: Math.round(rect.top - parentRect.top), width: rect.width, height: rect.height };
		})();
		const side = Math.min(d.width, d.height);
		const x = d.left + Math.round((d.width - side) / 2);
		const y = d.top + Math.round((d.height - side) / 2);
		setCropBox({ x: Math.round(x), y: Math.round(y), size: Math.round(side) });
	};
 
 	// Drag / resize handlers for interactive crop box (display coords)
 	const startDrag = (mode, e, corner) => {
		if (!previewRef.current) return;
		e.preventDefault();
		const imgRect = previewRef.current.getBoundingClientRect();
		const parentRect = previewRef.current.parentElement.getBoundingClientRect();
		// rect relative to parent (same coordinate space as cropBox.x/cropBox.y)
		const rect = {
			left: Math.round(imgRect.left - parentRect.left),
			top: Math.round(imgRect.top - parentRect.top),
			width: Math.round(imgRect.width),
			height: Math.round(imgRect.height)
		};
		const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
		const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
		dragState.current = {
			mode,
			corner,
			startX: clientX,
			startY: clientY,
			startBox: { ...cropBox },
			rect
		};

 		const onMove = (ev) => {
 			if (!dragState.current) return;
 			const mx = (ev.touches ? ev.touches[0].clientX : ev.clientX);
 			const my = (ev.touches ? ev.touches[0].clientY : ev.clientY);
 			const dx = mx - dragState.current.startX;
 			const dy = my - dragState.current.startY;
 			const { startBox, rect } = dragState.current;
 
 			if (dragState.current.mode === 'move') {
 				// move box, clamp to preview bounds
 				let nx = Math.round(startBox.x + dx);
 				let ny = Math.round(startBox.y + dy);
 				const minX = rect.left;
 				const minY = rect.top;
 				const maxX = rect.left + rect.width - startBox.size;
 				const maxY = rect.top + rect.height - startBox.size;
 				nx = Math.max(minX, Math.min(nx, maxX));
 				ny = Math.max(minY, Math.min(ny, maxY));
 				setCropBox((b) => ({ ...b, x: nx, y: ny }));
 			} else if (dragState.current.mode === 'resize') {
				// resize while keeping a square.
				const corner = dragState.current.corner; // 'tl','tr','bl','br' or 'tm','bm','lm','rm'
				let newSize = startBox.size;
				let newX = startBox.x;
				let newY = startBox.y;
 
				// Edge handles (midpoints): top-middle ('tm'), bottom-middle ('bm'), left-middle ('lm'), right-middle ('rm')
				if (corner === 'tm' || corner === 'bm') {
					// vertical edge: use vertical movement
					const delta = (corner === 'bm') ? dy : -dy;
					newSize = Math.round(Math.max(20, startBox.size + delta));
					// keep a fixed opposite edge (bm fixes top, tm fixes bottom) by computing newY
					if (corner === 'tm') {
						const bottom = startBox.y + startBox.size;
						newY = Math.round(bottom - newSize);
						// keep horizontal center aligned to visually resize uniformly
						newX = Math.round(startBox.x + (startBox.size - newSize) / 2);
					} else {
						// 'bm' - top fixed
						newY = startBox.y;
						newX = Math.round(startBox.x + (startBox.size - newSize) / 2);
					}
				} else if (corner === 'lm' || corner === 'rm') {
					// horizontal edge: use horizontal movement
					const delta = (corner === 'rm') ? dx : -dx;
					newSize = Math.round(Math.max(20, startBox.size + delta));
					if (corner === 'lm') {
						const right = startBox.x + startBox.size;
						newX = Math.round(right - newSize);
						newY = Math.round(startBox.y + (startBox.size - newSize) / 2);
					} else {
						// 'rm' - left fixed
						newX = startBox.x;
						newY = Math.round(startBox.y + (startBox.size - newSize) / 2);
					}
				} else {
					// corner handles: use largest movement axis to preserve intuitive drag
					const delta = Math.max(dx * (corner.includes('r') ? 1 : -1), dy * (corner.includes('b') ? 1 : -1));
					newSize = Math.round(Math.max(20, startBox.size + delta));
					if (corner.includes('l')) newX = Math.round(startBox.x - (newSize - startBox.size));
					if (corner.includes('t')) newY = Math.round(startBox.y - (newSize - startBox.size));
				}
 
				// clamp to image rect area (rect.left/top are offsets)
				if (newX < rect.left) { const diff = rect.left - newX; newX = rect.left; newSize = Math.round(newSize - diff); }
				if (newY < rect.top) { const diff = rect.top - newY; newY = rect.top; newSize = Math.round(newSize - diff); }
				if (newX + newSize > rect.left + rect.width) newSize = Math.round(rect.left + rect.width - newX);
				if (newY + newSize > rect.top + rect.height) newSize = Math.round(rect.top + rect.height - newY);
				newSize = Math.max(20, newSize);
				// Adjust newX/newY if rounding changed size to keep within bounds
				if (newX + newSize > rect.left + rect.width) newX = rect.left + rect.width - newSize;
				if (newY + newSize > rect.top + rect.height) newY = rect.top + rect.height - newSize;
 
				setCropBox({ x: Math.round(newX), y: Math.round(newY), size: Math.round(newSize) });
 			}
 		};
 
 		const onUp = () => {
 			dragState.current = null;
 			window.removeEventListener('mousemove', mouseMoveHandlerRef.current);
 			window.removeEventListener('touchmove', mouseMoveHandlerRef.current);
 			window.removeEventListener('mouseup', mouseUpHandlerRef.current);
 			window.removeEventListener('touchend', mouseUpHandlerRef.current);
 		};
 
 		mouseMoveHandlerRef.current = onMove;
 		mouseUpHandlerRef.current = onUp;
 		window.addEventListener('mousemove', onMove);
 		window.addEventListener('touchmove', onMove, { passive: false });
 		window.addEventListener('mouseup', onUp);
 		window.addEventListener('touchend', onUp);
 	};
 
 	// Apply crop + rotation and trigger download (does not alter app state)
 	const applyCropAndDownload = async () => {
 		if (!cropImageSrc || imgNatural.w === 0 || !previewRef.current) return;
 		const img = new Image();
 		img.src = cropImageSrc;
 		await new Promise((res) => (img.onload = res));
 
 		// draw rotated image to temp canvas (for final orientation)
 		let tempW = img.naturalWidth;
 		let tempH = img.naturalHeight;
 		if (rotation === 90 || rotation === 270) {
 			tempW = img.naturalHeight;
 			tempH = img.naturalWidth;
 		}
 		const tempCanvas = document.createElement('canvas');
 		tempCanvas.width = tempW;
 		tempCanvas.height = tempH;
 		const tctx = tempCanvas.getContext('2d');
 
 		// apply rotation transform when drawing
 		if (rotation === 0) {
 			tctx.drawImage(img, 0, 0);
 		} else if (rotation === 90) {
 			tctx.translate(tempW, 0);
 			tctx.rotate(Math.PI / 2);
 			tctx.drawImage(img, 0, 0);
 		} else if (rotation === 180) {
 			tctx.translate(tempW, tempH);
 			tctx.rotate(Math.PI);
 			tctx.drawImage(img, 0, 0);
 		} else if (rotation === 270) {
 			tctx.translate(0, tempH);
 			tctx.rotate((3 * Math.PI) / 2);
 			tctx.drawImage(img, 0, 0);
 		}
 
 		// map displayed cropBox -> natural pixel coordinates (on original image)
 		const rect = previewRef.current.getBoundingClientRect();
 		const parentRect = previewRef.current.parentElement.getBoundingClientRect();
 		const dispW = rect.width;
 		const dispH = rect.height;
 		// scale factors between displayed and natural
 		const scaleX = imgNatural.w / dispW;
 		const scaleY = imgNatural.h / dispH;
 		// convert displayed crop box (subtract image-left/top) to original natural coords
 		const imageLeft = Math.round(rect.left - parentRect.left);
 		const imageTop = Math.round(rect.top - parentRect.top);
 		const sxNatural = Math.round((cropBox.x - imageLeft) * scaleX);
 		const syNatural = Math.round((cropBox.y - imageTop) * scaleY);
 		const swNatural = Math.round(cropBox.size * scaleX);
 		const shNatural = Math.round(cropBox.size * scaleY);
 
 		// Because we drew the image into tempCanvas possibly rotated,
 		// we must map the natural crop rectangle into the rotated temp canvas coords.
 		// rcx/rcy are the center in original natural coords:
 		const centerX = sxNatural + Math.round(swNatural / 2);
 		const centerY = syNatural + Math.round(shNatural / 2);
 		let rcx = centerX;
 		let rcy = centerY;
 		const ow = imgNatural.w;
 		const oh = imgNatural.h;
 		if (rotation === 0) {
 			rcx = centerX; rcy = centerY;
 		} else if (rotation === 90) {
 			rcx = oh - centerY; rcy = centerX;
 		} else if (rotation === 180) {
 			rcx = ow - centerX; rcy = oh - centerY;
 		} else if (rotation === 270) {
 			rcx = centerY; rcy = ow - centerX;
 		}
 		const sx = Math.max(0, Math.round(rcx - (swNatural / 2)));
 		const sy = Math.max(0, Math.round(rcy - (shNatural / 2)));
 		const sw = Math.min(swNatural, tempCanvas.width - sx);
 		const sh = Math.min(shNatural, tempCanvas.height - sy);
 
 		// final output canvas
 		const outCanvas = document.createElement('canvas');
 		outCanvas.width = sw;
 		outCanvas.height = sh;
 		const octx = outCanvas.getContext('2d');
 		octx.drawImage(tempCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
 
 		outCanvas.toBlob((blob) => {
 			if (!blob) {
 				alert('Failed to create image.');
 				return;
 			}
 			const a = document.createElement('a');
 			const fileName = (selectedFiles && selectedFiles[0] && selectedFiles[0].file && selectedFiles[0].file.name) ? selectedFiles[0].file.name.replace(/\.[^.]+$/, '') + '_crop.png' : 'image_crop.png';
 			const url = URL.createObjectURL(blob);
 			a.href = url;
 			a.download = fileName;
 			document.body.appendChild(a);
 			a.click();
 			a.remove();
 			URL.revokeObjectURL(url);
 			// close modal after download
 			closeCropModal();
 		}, 'image/png');
 	};
	// --- end crop modal logic ---

	// quick list of tools to show in header (kept in sync with Valuable Tools)
	const headerTools = [
		{ name: 'Image Resizer', link: '#', short: 'Resize' },
		{ name: 'Crop Image', link: '#', short: 'Crop' },
		{ name: 'Image Compressor', link: '#', short: 'Compress' },
		{ name: 'Color Picker', link: '/color-picker', short: 'Color Picker' },
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
						{/* logo + title */}
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
								<svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
								</svg>
							</div>
							<h1 className="text-2xl font-bold text-white">Image Converter</h1>
						</div>
						
						{/* header quick-tool buttons (md+) */}
						<div className="hidden md:flex items-center gap-3">
							{headerTools.slice(0, 5).map((t) => (
								<button
									key={t.name}
									onClick={() => {
										// Crop should open modal instead of navigating
										if (t.name === 'Crop Image') {
											openCropModalForSelected();
										} else {
											window.location.href = t.link;
										}
									}}
									className="text-indigo-200 hover:text-white transition-colors font-medium px-3 py-1 rounded"
									title={t.name}
								>
									{t.name}
								</button>
							))}
						</div>

						{/* corner controls: dark, signup, login */}
						<div className="flex items-center gap-4">
							<button
								onClick={() => setDarkMode(!darkMode)}
								className={`p-2 rounded-full ${darkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-yellow-300'}`}
								aria-label="Toggle dark mode"
							>
								{darkMode ? (
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
									</svg>
								) : (
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
										<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
									</svg>
								)}
							</button>
							<button className={`px-4 py-2 bg-indigo-800 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium`}>Sign Up</button>
							<button className={`text-indigo-200 hover:text-white px-4 py-2 transition-colors font-medium`}>Login</button>
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

				{/* Global Format card */}
				<section className="mb-6">
					<div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-md p-6 mb-6`}>
						<div className="flex flex-wrap items-center justify-center gap-3 mb-2">
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
				</section>

				{/* File List */}
				{selectedFiles.length > 0 && convertedFiles.length === 0 && (
					<section className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow mb-8`}>
						<div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7V3a1 1 0 011-1h8a1 1 0 011 1v4M7 7h10M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7M7 7l-2 2m0 0l2 2m-2-2h12" />
									</svg>
									<span className={`${darkMode ? 'text-gray-200' : 'text-gray-800'} font-medium`}>{selectedFiles.length} Image{selectedFiles.length > 1 ? 's' : ''} Selected</span>
								</div>
								<button className="text-red-500 hover:text-red-700" onClick={resetConverter} title="Remove All">
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>

						<div className="p-4 space-y-3">
							{selectedFiles.map((item, index) => (
								<div key={index} className={`flex items-center gap-3 py-2 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-100'} last:border-b-0`}>
									<svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7V3a1 1 0 011-1h8a1 1 0 011 1v4M7 7h10M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7M7 7l-2 2m0 0l2 2m-2-2h12" />
									</svg>
									<span className={`${darkMode ? 'text-gray-200' : 'text-gray-800'} truncate flex-1`}>{item.file.name}</span>

									{/* per-file format dropdown */}
									<div className="relative format-dropdown">
										<button
											onClick={(e) => {
												e.stopPropagation();
												setOpenFormatIndex(openFormatIndex === index ? null : index);
											}}
											className={`px-3 py-1 rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border border-gray-300 text-gray-800'}`}
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
															className={`w-full pl-10 pr-4 py-2 rounded border focus:outline-none placeholder-gray-500 text-sm ${darkMode ? 'bg-gray-800 text-white border-gray-700 focus:border-indigo-500' : 'bg-white text-gray-900 border-gray-300 focus:border-indigo-500'}`}
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
																className={`w-full text-left px-2 py-2 text-xs transition-colors ${selectedCategory === category ? 'bg-gray-700 text-white' : darkMode ? 'text-gray-300 hover:bg-gray-750 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-800'}`}
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
																	className={`px-2 py-1 rounded text-xs font-medium transition-colors ${item.format.toUpperCase() === fmt ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'}`}
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

									<button onClick={() => openEdit(index)} className="text-gray-500 hover:text-indigo-600 p-1 transition-colors" title="Edit">
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
										</svg>
									</button>

									<button onClick={() => removeFile(index)} className="text-gray-400 hover:text-red-500 p-1 transition-colors" title="Remove">
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							))}
						</div>
					</section>
				)}

				{/* Add More & Convert Buttons */}
				{selectedFiles.length > 0 && convertedFiles.length === 0 && (
					<section className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-md p-4 mb-6`}>
						<div className="flex flex-wrap items-center justify-between">
							<div className="relative file-dropdown">
								<button
									className="bg-gray-800 text-white px-6 py-3 rounded font-semibold flex items-center gap-2 hover:bg-gray-900"
									onClick={(e) => {
										e.stopPropagation();
										setShowFileDropdown((v) => !v);
									}}
									type="button"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
									</svg>
									Add More Files
									<svg className={`w-4 h-4 ml-2 transition-transform ${showFileDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
									</svg>
								</button>

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
					</section>
				)}

				{/* Initial Upload */}
				{selectedFiles.length === 0 && (
					<section className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-md p-8 mb-8`}>
						<div className="flex flex-col items-center justify-center py-8">
							<div className="relative inline-block file-dropdown">
								<div className="flex items-stretch shadow-lg rounded-lg overflow-hidden border border-indigo-700">
									<button className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-8 py-4 text-lg focus:outline-none" style={{ borderRight: '1px solid #fff' }} onClick={() => handleFileDropdown('computer')} type="button">
										<span>Select File(s)</span>
									</button>
									<button className="bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-4 flex items-center focus:outline-none" onClick={(e) => { e.stopPropagation(); setShowFileDropdown((prev) => !prev); }} type="button">
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
					</section>
				)}

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

				{/* Valuable Tools */}
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
								<div key={tool.name} className={`flex items-start gap-3 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg hover:${darkMode ? 'bg-gray-600' : 'bg-gray-100'} transition-all duration-300 cursor-pointer`} onClick={() => tool.link ? (window.location.href = tool.link) : null}>
									<span className="flex-shrink-0 w-7 h-7 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-sm">{index + 1}</span>
									<div>
										<span className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">{tool.name}</span>
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

				{/* Crop Modal */}
				{showCropModal && (
					<div className="fixed inset-0 z-70 flex items-center justify-center">
						<div className="absolute inset-0 bg-black opacity-50" onClick={closeCropModal} />
						<div className="relative bg-white rounded-lg shadow-xl w-11/12 max-w-3xl p-6 z-80">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold">Image Crop & Rotate</h3>
								<button onClick={closeCropModal} className="text-gray-600 hover:text-gray-800 text-2xl">&times;</button>
							</div>

							<div className="flex flex-col md:flex-row gap-4">
								{/* Preview */}
								<div className="flex-1 relative flex items-center justify-center bg-gray-100 rounded p-2">
									{cropImageSrc ? (
										<img
											ref={previewRef}
											src={cropImageSrc}
											alt="Crop preview"
											onLoad={onCropImageLoad}
											// interactive crop uses displayed coordinates; do not visually rotate preview
											style={{
												maxWidth: '100%',
												maxHeight: '60vh',
												cursor: 'crosshair',
												transform: 'none'
											}}
										/>
									) : (
										<div>No image</div>
									)}
									{/* overlay square preview (positioned based on cropCenter & cropPercent) */}
									{previewRef.current && (
										(() => {
											const box = cropBox;
											// translucent overlay outside the crop (cover entire parent area)
											return (
												<>
													{/* outside overlay */}
													<div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
														{/* top */}
														<div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: `${box.y}px`, background: 'rgba(0,0,0,0.45)' }} />
														{/* bottom */}
														<div style={{ position: 'absolute', left: 0, top: `${box.y + box.size}px`, width: '100%', height: `calc(100% - ${box.y + box.size}px)`, background: 'rgba(0,0,0,0.45)' }} />
														{/* left */}
														<div style={{ position: 'absolute', left: 0, top: `${box.y}px`, width: `${box.x}px`, height: `${box.size}px`, background: 'rgba(0,0,0,0.45)' }} />
														{/* right */}
														<div style={{ position: 'absolute', left: `${box.x + box.size}px`, top: `${box.y}px`, width: `calc(100% - ${box.x + box.size}px)`, height: `${box.size}px`, background: 'rgba(0,0,0,0.45)' }} />
													</div>

													{/* crop box (draggable) */}
													<div
														onMouseDown={(ev) => startDrag('move', ev)}
														onTouchStart={(ev) => startDrag('move', ev)}
														style={{
															position: 'absolute',
															left: `${box.x}px`,
															top: `${box.y}px`,
															width: `${box.size}px`,
															height: `${box.size}px`,
															border: '2px solid #3b82f6',
															boxSizing: 'border-box',
															cursor: 'move',
															background: 'transparent'
														}}
													/>

													{/* handles: corners + mid-edges (16px squares) */}
													{['tl','tm','tr','rm','br','bm','bl','lm'].map((c) => {
														// compute handle center in parent coords
														let cx = box.x;
														let cy = box.y;
														if (c === 'tl') { cx = box.x; cy = box.y; }
														if (c === 'tm') { cx = box.x + box.size / 2; cy = box.y; }
														if (c === 'tr') { cx = box.x + box.size; cy = box.y; }
														if (c === 'rm') { cx = box.x + box.size; cy = box.y + box.size / 2; }
														if (c === 'br') { cx = box.x + box.size; cy = box.y + box.size; }
														if (c === 'bm') { cx = box.x + box.size / 2; cy = box.y + box.size; }
														if (c === 'bl') { cx = box.x; cy = box.y + box.size; }
														if (c === 'lm') { cx = box.x; cy = box.y + box.size / 2; }
														const cursor = c === 'tm' || c === 'bm' ? 'ns-resize' : (c === 'lm' || c === 'rm' ? 'ew-resize' : ((c === 'tl' || c === 'br') ? 'nwse-resize' : 'nesw-resize'));
														return (
															<div
																key={c}
																onMouseDown={(ev) => startDrag('resize', ev, c)}
																onTouchStart={(ev) => startDrag('resize', ev, c)}
																style={{
																	position: 'absolute',
																	left: `${Math.round(cx - 8)}px`,
																	top: `${Math.round(cy - 8)}px`,
																	width: '16px',
																	height: '16px',
																	background: '#fff',
																	border: '2px solid #3b82f6',
																	borderRadius: '3px',
																	boxSizing: 'border-box',
																	cursor
																}}
															/>
														);
													})}
												</>
											);
										})()
									)}
								</div>
 
								{/* Controls */}
								<div className="w-full md:w-64 space-y-3">
									<div className="flex items-center gap-2">
										{/* Rotate Left: text then bold circular arrow (unicode) */}
										<button onClick={rotateLeft} className="flex items-center gap-2 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300" title="Rotate left">
											<span className="text-sm">Rotate Left</span>
											<span className="text-2xl font-extrabold leading-none select-none" aria-hidden>↺</span>
										</button>

										{/* Rotate Right: text then bold circular arrow (unicode) */}
										<button onClick={rotateRight} className="flex items-center gap-2 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300" title="Rotate right">
											<span className="text-sm">Rotate Right</span>
											<span className="text-2xl font-extrabold leading-none select-none" aria-hidden>↻</span>
										</button>
									</div>

									<div className="flex gap-2">
										<button onClick={cropCenterSquare} className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Center Square</button>
										<button onClick={cropCenterSquare} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">Full</button>
									</div>

									<div className="flex gap-2">
										<button onClick={applyCropAndDownload} className="flex-1 px-3 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">Crop & Download</button>
										<button onClick={closeCropModal} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
									</div>

									<div className="text-xs text-gray-500">
										<p>Tip: Drag the box or use the corner handles to resize, then Crop & Download.</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</main>
 		</>
 	);
 };