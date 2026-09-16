import React, { useState } from 'react';

/**
 * DocumentPreviewModal
 * Displays PDF, DOCX, or DOC documents inside an interactive modal.
 * Uses native iframe for PDF and Microsoft Office Web Viewer / Google Docs Viewer for Word documents,
 * with options to open full-screen or download directly.
 */
const DocumentPreviewModal = ({ isOpen, onClose, fileUrl, fileName = 'Dokumen' }) => {
    if (!isOpen || !fileUrl) return null;

    const isPdf = fileUrl.toLowerCase().includes('.pdf') || fileName.toLowerCase().endsWith('.pdf');
    const isDocx = fileUrl.toLowerCase().includes('.docx') || fileName.toLowerCase().endsWith('.docx') ||
                  fileUrl.toLowerCase().includes('.doc') || fileName.toLowerCase().endsWith('.doc');

    // For Office files, use Microsoft Online Viewer or Google Docs Viewer
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

    const [useGoogleFallback, setUseGoogleFallback] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isPdf ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                            <i className={`fas ${isPdf ? 'fa-file-pdf' : 'fa-file-word'} text-lg`}></i>
                        </div>
                        <div className="truncate">
                            <h3 className="font-bold text-slate-800 dark:text-white text-base truncate">
                                {fileName}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {isPdf ? 'Format Dokumen PDF' : isDocx ? 'Format Dokumen Word (DOCX)' : 'Dokumen Berkas'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {isDocx && (
                            <button
                                type="button"
                                onClick={() => setUseGoogleFallback(!useGoogleFallback)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                                title="Ganti Server Viewer"
                            >
                                <i className="fas fa-arrows-rotate"></i>
                                {useGoogleFallback ? 'Viewer Office' : 'Viewer Google'}
                            </button>
                        )}
                        <a
                            href={fileUrl}
                            download={fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                        >
                            <i className="fas fa-download"></i>
                            Download
                        </a>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Content Viewer Body */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                    {isPdf ? (
                        <iframe
                            src={fileUrl}
                            title={fileName}
                            className="w-full h-full border-0"
                        />
                    ) : isDocx ? (
                        <div className="w-full h-full relative">
                            <iframe
                                src={useGoogleFallback ? googleViewerUrl : officeViewerUrl}
                                title={fileName}
                                className="w-full h-full border-0"
                            />
                            {/* In case iframe fails to load on local IP / offline environments */}
                            <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-2 rounded-xl text-xs shadow-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                <span>Preview online memerlukan URL publik.</span>
                                <a
                                    href={fileUrl}
                                    download={fileName}
                                    className="font-bold text-indigo-600 dark:text-indigo-400 underline ml-1"
                                >
                                    Unduh File Langsung
                                </a>
                            </div>
                        </div>
                    ) : (
                        <iframe
                            src={fileUrl}
                            title={fileName}
                            className="w-full h-full border-0"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentPreviewModal;
