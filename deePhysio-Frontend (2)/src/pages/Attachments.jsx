import React, { useState, useEffect, useRef } from 'react';
import { FaPaperclip, FaPlus, FaSearch, FaFilePdf, FaFileImage, FaFileWord, FaDownload, FaTrash, FaCheck, FaCloudUploadAlt, FaCamera } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { fetchApi } from '../config/api';
import { useToast } from '../context/ToastContext';
import { CameraService } from '../mobile/camera/CameraService';

const Attachments = () => {
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newFile, setNewFile] = useState({ name: '', patient: '', type: 'PDF', fileObject: null, dataUrl: null });
  const [patients, setPatients] = useState([]);
  const fileInputRef = useRef(null);

  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [attachmentsResRaw, patientsResRaw] = await Promise.all([
        fetchApi('/attachments'),
        fetchApi('/patients')
      ]);

      if (!attachmentsResRaw || !patientsResRaw) return;

      const attachmentsRes = await attachmentsResRaw.json();
      const patientsRes = await patientsResRaw.json();

      if (attachmentsRes.success) {
        setFiles(attachmentsRes.data.map(f => ({
          id: f.id,
          name: f.name,
          patient: `${f.patient.firstName || f.patient.first_name} ${f.patient.lastName || f.patient.last_name}`,
          date: new Date(f.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          size: f.size,
          type: f.type
        })));
      }

      if (patientsRes.success) {
        const fetchedPatients = patientsRes.data.map(p => ({
          id: p.id,
          name: `${p.firstName || p.first_name} ${p.lastName || p.last_name}`
        }));
        setPatients(fetchedPatients);
        if (fetchedPatients.length > 0) {
           setNewFile(prev => ({ ...prev, patient: fetchedPatients[0].name }));
        }
      }
    } catch (error) {
      console.error('Error fetching attachments data:', error);
      showToast('Failed to synchronize clinical archive.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetchApi(`/attachments/${id}`, { method: 'DELETE' });
      if (response.success) {
        setFiles(files.filter(f => f.id !== id));
        showToast('Attachment removed from archive.', 'success');
      }
    } catch (error) {
      showToast('Failed to delete attachment.', 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      let type = 'PDF';
      if (file.type.includes('image')) type = 'Image';
      if (file.type.includes('word')) type = 'DOCX';
      
      setNewFile({
        ...newFile,
        name: file.name,
        type: type,
        fileObject: file
      });
      setIsUploadModalOpen(true);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const photo = await CameraService.takePhoto({ quality: 85 });
      if (photo && (photo.dataUrl || photo.path)) {
        const defaultName = `Scan_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.jpg`;
        setNewFile({
          name: defaultName,
          patient: patients[0]?.name || '',
          type: 'Image',
          fileObject: null,
          dataUrl: photo.dataUrl || photo.path
        });
        setIsUploadModalOpen(true);
      }
    } catch (err) {
      console.warn('Camera capture cancelled or failed:', err);
      showToast('Camera capture cancelled or unavailable.', 'info');
    }
  };

  const handleUpload = async () => {
    if (!newFile.name) return;
    
    try {
      const sizeStr = newFile.fileObject 
        ? (newFile.fileObject.size / (1024 * 1024)).toFixed(1) + ' MB'
        : newFile.dataUrl 
          ? (Math.round((newFile.dataUrl.length * 0.75) / 1024) / 1024).toFixed(1) + ' MB'
          : (Math.random() * (5 - 0.5) + 0.5).toFixed(1) + ' MB';

      const selectedPatient = patients.find(p => p.name === newFile.patient);
      
      const payload = {
        name: newFile.name,
        patientId: selectedPatient?.id,
        size: sizeStr,
        type: newFile.type
      };

      const response = await fetchApi('/attachments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.success) {
        const uploaded = {
           id: response.data.id,
           name: response.data.name,
           patient: newFile.patient,
           type: response.data.type,
           date: new Date(response.data.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
           size: response.data.size,
           dataUrl: newFile.dataUrl
        };
        setFiles([uploaded, ...files]);
        showToast('Document synchronized successfully.', 'success');
      }
    } catch (error) {
       showToast('Failed to upload document metadata.', 'error');
    } finally {
       setIsUploadModalOpen(false);
       setNewFile({ name: '', patient: patients[0]?.name || '', type: 'PDF', fileObject: null, dataUrl: null });
    }
  };

  const handleDownload = (file) => {
    if (file.dataUrl) {
      const link = document.createElement('a');
      link.href = file.dataUrl;
      link.setAttribute('download', file.name || 'attachment.jpg');
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
      showToast(`Downloaded: ${file.name}`, 'success');
      return;
    }

    if (file.fileUrl || file.file_url) {
      const link = document.createElement('a');
      link.href = file.fileUrl || file.file_url;
      link.setAttribute('download', file.name || 'document');
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
      return;
    }

    // Backend Prisma attachment table stores record metadata (no binary file blob URL)
    showToast(`Archive record: "${file.name}" (${file.size || 'Metadata'}).`, 'info');
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.patient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF': return <FaFilePdf className="text-red-500" />;
      case 'Image': return <FaFileImage className="text-blue-500" />;
      case 'DOCX': return <FaFileWord className="text-azure-600" />;
      default: return <FaPaperclip className="text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-pulse">
        <div className="w-16 h-16 border-4 border-clinicPrimary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Clinical Archive...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">Documents & Attachments</h1>
          <p className="text-base font-bold text-gray-400 mt-1 uppercase tracking-widest">Manage clinical reports, scans, and signed forms.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCapturePhoto}
            className="btn-secondary flex items-center gap-2 text-base uppercase tracking-widest shadow-md"
            title="Scan document or take photo"
          >
            <FaCamera size={14}/> Take Photo
          </button>
          <button 
            onClick={() => fileInputRef.current.click()}
            className="btn-primary flex items-center gap-2 text-base uppercase tracking-widest shadow-lg"
          >
            <FaCloudUploadAlt size={14}/> Upload File
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 card-clinic px-0 py-0 overflow-hidden border-none shadow-xl bg-white">
           <div className="p-4 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
              <div className="relative flex-1">
                 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={12}/>
                 <input 
                    type="text" 
                    placeholder="Search by filename or patient..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-lg text-base font-semibold outline-none focus:border-clinicPrimary shadow-sm" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-gray-50 text-base font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                       <th className="px-6 py-4">Filename</th>
                       <th className="px-6 py-4">Linked Patient</th>
                       <th className="px-6 py-4">Upload Date</th>
                       <th className="px-6 py-4">Size</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {filteredFiles.map(file => (
                       <tr key={file.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                 <div className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">
                                    {getFileIcon(file.type)}
                                 </div>
                                 <p className="text-base font-black text-gray-900 leading-none">{file.name}</p>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-base font-bold text-gray-400 uppercase tracking-tight">{file.patient}</td>
                          <td className="px-6 py-4 text-base font-bold text-gray-400">{file.date}</td>
                          <td className="px-6 py-4 text-sm font-black text-gray-500 uppercase tracking-widest">{file.size}</td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleDownload(file)}
                                  className="p-2 text-clinicPrimary hover:bg-clinicPrimary/10 rounded-lg transition-all"
                                >
                                  <FaDownload size={14}/>
                                </button>
                                <button 
                                  onClick={() => handleDelete(file.id)}
                                  className="p-2 text-gray-200 hover:text-red-500 rounded-lg transition-all"
                                >
                                  <FaTrash size={12}/>
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))}
                    {filteredFiles.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-gray-400 font-bold uppercase tracking-widest">No documents found</td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="space-y-6">
           <div className="card-clinic p-6 bg-clinicLight border-none shadow-xl">
              <h4 className="text-base font-black text-clinicPrimary uppercase tracking-widest mb-4">Storage Usage</h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <p className="text-xl font-black text-gray-900 leading-none">
                      {(files.reduce((acc, f) => acc + parseFloat(f.size), 0)).toFixed(1)} MB
                    </p>
                    <p className="text-sm font-bold text-gray-400 uppercase">of 10 GB Buffer</p>
                 </div>
                 <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-clinicPrimary h-full" style={{ width: '4.2%' }}></div>
                 </div>
              </div>
           </div>

           <div className="card-clinic border-2 border-dashed border-gray-100 flex flex-col items-center justify-center py-8 text-center group hover:border-clinicPrimary/30 transition-all cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <FaCloudUploadAlt className="text-clinicPrimary" size={24}/>
              </div>
              <h4 className="text-base font-black text-gray-900 uppercase tracking-widest mb-1">Quick Upload</h4>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest px-4 leading-relaxed">CLICK TO SELECT CLINICAL DATA FROM YOUR DEVICE</p>
           </div>
        </div>
      </div>

      <Modal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        title="Finalize Synchronization"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={handleUpload} leftIcon={<FaCheck />}>Add to Patient Profile</Button>
          </div>
        }
      >
        <div className="space-y-6 p-2">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-clinicPrimary overflow-hidden">
              {newFile.dataUrl ? (
                <img src={newFile.dataUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                getFileIcon(newFile.type)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-black text-gray-900 leading-none mb-1 truncate">{newFile.name}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {newFile.dataUrl ? 'Captured Image Ready' : 'Ready for secure upload'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Assign to Subject</label>
              <select 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-base font-bold text-gray-700 outline-none cursor-pointer"
                value={newFile.patient}
                onChange={(e) => setNewFile({ ...newFile, patient: e.target.value })}
              >
                {patients.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Document Class</label>
              <select 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-base font-bold text-gray-700 outline-none cursor-pointer"
                value={newFile.type}
                onChange={(e) => setNewFile({ ...newFile, type: e.target.value })}
              >
                <option value="PDF">Clinical Report (PDF)</option>
                <option value="Image">Diagnostic Scan (IMG)</option>
                <option value="DOCX">GP Correspondence (DOC)</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Attachments;
