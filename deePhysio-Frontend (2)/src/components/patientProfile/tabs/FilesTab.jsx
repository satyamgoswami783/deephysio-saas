import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaFileAlt, FaPlus, FaCloudUploadAlt, FaFilePdf, FaFileImage, 
  FaFileWord, FaFileArchive, FaTrashAlt, FaExternalLinkAlt, 
  FaDownload, FaSpinner, FaSearch
} from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { fetchApi } from '../../../config/api';

const FilesTab = () => {
  const { id } = useParams();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInputRef = useRef(null);

  const fetchFiles = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetchApi(`/files?patientId=${id}`);
      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          setFiles(data.data);
        }
      } else {
        setError('Failed to load patient files');
      }
    } catch (err) {
      console.error('Fetch Files Error:', err);
      setError('Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Simulate upload by creating a temporary object URL
      // In a real app, you'd upload to S3/Cloudinary and get a permanent URL
      const tempUrl = URL.createObjectURL(file);

      // 2. Save metadata to backend
      const res = await fetchApi('/files', {
        method: 'POST',
        body: JSON.stringify({
          patientId: id,
          fileName: file.name,
          fileUrl: tempUrl,
          fileType: file.type
        })
      });

      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          // 3. Refresh list
          await fetchFiles();
        }
      } else {
        alert('Failed to save file record');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      alert('Error simulating file upload');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const res = await fetchApi(`/files/${fileId}`, { method: 'DELETE' });
      if (res && res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        const data = await res?.json?.().catch(() => ({}));
        alert(data?.message || 'Failed to delete file');
      }
    } catch (err) {
      console.error('Delete File Error:', err);
      alert('Error deleting file');
    }
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return <FaFilePdf className="text-rose-500" />;
    if (type.includes('image')) return <FaFileImage className="text-blue-500" />;
    if (type.includes('word') || type.includes('officedocument')) return <FaFileWord className="text-indigo-600" />;
    if (type.includes('zip') || type.includes('rar')) return <FaFileArchive className="text-amber-500" />;
    return <FaFileAlt className="text-slate-400" />;
  };

  const filteredFiles = files.filter(f => 
    f.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && files.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-clinicPrimary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Syncing file records...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-72 group">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-clinicPrimary transition-colors" size={12} />
          <input 
            type="text" 
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary/40 transition-all font-medium"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <button 
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-clinicPrimary text-white rounded-xl text-[13px] font-bold shadow-lg shadow-clinicPrimary/20 hover:bg-clinicPrimary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
          >
            {isUploading ? (
              <FaSpinner className="animate-spin" size={14} />
            ) : (
              <FaCloudUploadAlt size={16} />
            )}
            <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
          </button>
        </div>
      </div>

      {/* Grid Layout for Files */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <div key={file.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-clinicPrimary/30 hover:shadow-md transition-all group flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">
                    {getFileIcon(file.fileType)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[14px] font-bold text-slate-800 truncate" title={file.fileName}>
                      {file.fileName}
                    </h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                      {new Date(file.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget({ id: file.id, fileName: file.fileName })}
                  className="shrink-0 w-8 h-8 rounded-lg border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-all flex items-center justify-center"
                  title={`Delete ${file.fileName}`}
                >
                  <FaTrashAlt size={12} />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-50">
                <a 
                  href={file.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold transition-colors"
                >
                  <FaExternalLinkAlt size={10} /> View
                </a>
                <a 
                  href={file.fileUrl} 
                  download={file.fileName}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold transition-colors"
                >
                  <FaDownload size={10} /> Download
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 border-dashed p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4 group-hover:scale-110 transition-transform">
              <FaFileAlt size={32} />
            </div>
            <h4 className="text-[16px] font-bold text-slate-700">No documents found</h4>
            <p className="text-[13px] text-slate-500 max-w-[300px] mx-auto mt-2 leading-relaxed">
              {searchQuery ? `No files matching "${searchQuery}"` : "You haven't uploaded any documents for this patient yet. Start by clicking the upload button."}
            </p>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-[16px] font-bold text-slate-800">Delete File</h3>
            </div>
            <div className="px-5 py-5">
              <p className="text-[14px] text-slate-700 font-medium">
                Do you want to delete this file?
              </p>
              <p className="text-[12px] text-slate-500 mt-2 truncate">
                {deleteTarget.fileName}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-white">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-bold hover:bg-slate-50 transition-all"
              >
                No
              </button>
              <button
                onClick={async () => {
                  const targetId = deleteTarget.id;
                  setDeleteTarget(null);
                  await handleDeleteFile(targetId);
                }}
                className="px-4 py-2 rounded-lg bg-rose-500 text-white text-[12px] font-bold hover:bg-rose-600 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesTab;
