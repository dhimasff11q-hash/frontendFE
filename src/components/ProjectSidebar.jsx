import React, { useState, useEffect, useRef } from 'react';
import { 
  getCurrentUser, 
  createProject as createProjectAPI, 
  updateProject as updateProjectAPI, 
  deleteProject as deleteProjectAPI, 
  getProjects as getProjectsAPI,
  uploadAttachment as uploadAttachmentAPI,
  deleteAttachment as deleteAttachmentAPI
} from '../services/apiService';

const ProjectSidebar = ({ 
  isOpen, 
  onClose, 
  project, 
  projects, 
  updateProjectsState, 
  workers,
  showNotification 
}) => {
  const currentUser = getCurrentUser();
  const isReadOnly = currentUser.role !== 'admin';
  const fileInputRef = useRef(null);

  const [projectData, setProjectData] = useState({
    name: '',
    clientName: '',
    startDate: '',
    endDate: '',
    statusChecking: 'pending',
    referenceLink: '',
  });

  const [taskData, setTaskData] = useState({
    id: null,
    title: '',
    category: 'carousel',
    description: '',
    status: 'not_started',
    priority: 'MEDIUM',
    progressPercentage: 0,
    revisionDetail: '',
    assignedTo: '',
  });

  const [attachments, setAttachments] = useState([]);

  // Load project details when sidebar opens
  useEffect(() => {
    if (isOpen) {
      if (project) {
        setProjectData({
          name: project.name || '',
          clientName: project.clientName || '',
          startDate: project.startDate || '',
          endDate: project.endDate || '',
          statusChecking: project.statusChecking || 'pending',
          referenceLink: project.referenceLink || '',
        });

        // Exact single task logic
        if (project.tasks && project.tasks.length > 0) {
          const mainTask = project.tasks[0];
          setTaskData({
            id: mainTask.id,
            title: mainTask.title || '',
            category: mainTask.category || 'carousel',
            description: mainTask.description || '',
            status: mainTask.status || 'not_started',
            priority: mainTask.priority || 'MEDIUM',
            progressPercentage: mainTask.progressPercentage || 0,
            revisionDetail: mainTask.revisionDetail || '',
            assignedTo: mainTask.assignedTo || '',
          });
          setAttachments(mainTask.attachments || []);
        } else {
          setTaskData({
            id: Date.now() + Math.random(),
            title: project.name || '',
            category: 'carousel',
            description: '',
            status: 'not_started',
            priority: 'MEDIUM',
            progressPercentage: 0,
            revisionDetail: '',
            assignedTo: '',
          });
          setAttachments([]);
        }
      } else {
        // Reset state for new project
        const today = new Date().toISOString().split('T')[0];
        setProjectData({
          name: '',
          clientName: '',
          startDate: today,
          endDate: '',
          statusChecking: 'pending',
          referenceLink: '',
        });
        setTaskData({
          id: Date.now() + Math.random(),
          title: '',
          category: 'carousel',
          description: '',
          status: 'not_started',
          priority: 'MEDIUM',
          progressPercentage: 0,
          revisionDetail: '',
          assignedTo: '',
        });
        setAttachments([]);
      }
    }
  }, [isOpen, project]);

  const handleProjectChange = (e) => {
    if (isReadOnly) return;
    const { name, value } = e.target;
    setProjectData(prev => ({ ...prev, [name]: value }));
  };

  const handleTaskChange = (e) => {
    if (isReadOnly) return;
    const { name, value } = e.target;
    setTaskData(prev => ({ ...prev, [name]: value }));
  };

  // Real Attachment upload using backend API & Laravel Storage
  const handleAttachmentUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!project || !taskData.id) {
      showNotification('Silakan simpan proyek terlebih dahulu sebelum menambahkan berkas lampiran.', 'warning');
      return;
    }

    const taskId = taskData.id;

    try {
      // Loop and upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadAttachmentAPI(taskId, file);
      }
      
      // Fetch fresh projects
      const freshProjects = await getProjectsAPI(null, false);
      updateProjectsState(freshProjects);
      
      const updatedProj = freshProjects.find(p => p.id === project.id);
      if (updatedProj && updatedProj.tasks && updatedProj.tasks.length > 0) {
        setAttachments(updatedProj.tasks[0].attachments || []);
      }
      showNotification('Berkas lampiran berhasil diunggah!', 'success');
    } catch (err) {
      showNotification('Gagal mengunggah berkas: ' + err.message, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    showNotification('Apakah Anda yakin ingin menghapus lampiran ini?', 'confirm', 'Konfirmasi Hapus Lampiran', async () => {
      try {
        await deleteAttachmentAPI(attachmentId);
        
        // Fetch fresh projects
        const freshProjects = await getProjectsAPI(null, false);
        updateProjectsState(freshProjects);
        
        const updatedProj = freshProjects.find(p => p.id === project.id);
        if (updatedProj && updatedProj.tasks && updatedProj.tasks.length > 0) {
          setAttachments(updatedProj.tasks[0].attachments || []);
        }
        showNotification('Berkas lampiran berhasil dihapus.', 'success');
      } catch (err) {
        showNotification('Gagal menghapus berkas: ' + err.message, 'error');
      }
    });
  };

  const handleDelete = async () => {
    if (isReadOnly) return;
    if (!project) return;
    
    showNotification(
      `Apakah Anda yakin ingin menghapus proyek "${projectData.clientName || 'ini'}" beserta semua tugas di dalamnya?`,
      'confirm',
      'Konfirmasi Hapus Proyek',
      async () => {
        try {
          await deleteProjectAPI(project.id);
          const freshProjects = await getProjectsAPI(null, false);
          updateProjectsState(freshProjects);
          showNotification('Proyek berhasil dihapus!', 'success');
          onClose();
        } catch (err) {
          showNotification('Gagal menghapus proyek: ' + err.message, 'error');
        }
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!projectData.clientName) {
      showNotification('Mohon isi nama brand!', 'warning');
      return;
    }

    try {
      if (project) {
        await updateProjectAPI(project.id, projectData, taskData);
        showNotification('Proyek berhasil diperbarui!', 'success');
      } else {
        await createProjectAPI(projectData, taskData);
        showNotification('Proyek berhasil dibuat!', 'success');
      }

      const freshProjects = await getProjectsAPI(null, false);
      updateProjectsState(freshProjects);
      onClose();
    } catch (err) {
      showNotification('Gagal menyimpan proyek: ' + err.message, 'error');
    }
  };

  if (!isOpen) return null;

  const showStatusBadge = project && (project.statusChecking === 'acc' || project.statusChecking === 'revisi');

  return (
    <div className="w-[360px] min-w-[360px] max-md:w-full max-md:min-w-full max-md:fixed max-md:right-0 max-md:top-[70px] max-[480px]:top-[60px] max-md:h-[calc(100vh-70px)] max-[480px]:h-[calc(100vh-60px)] border-l border-gray-200 bg-white h-[calc(100vh-70px)] max-[480px]:h-[calc(100vh-60px)] sticky top-[70px] max-[480px]:top-[60px] overflow-y-auto flex flex-col justify-between z-[1000] shadow-lg animate-slide-in-right text-gray-800">
      <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
        <div className="p-6 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 relative">
            <div>
              <h2 className="text-xl font-bold text-secondary uppercase tracking-wide">
                {isReadOnly ? 'Detail Proyek' : project ? 'Edit Proyek' : 'Tambah Proyek'}
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Status Badge */}
              {showStatusBadge && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  project.statusChecking === 'acc'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {project.statusChecking === 'acc' ? 'ACC' : 'Revisi'}
                </span>
              )}

              <button 
                type="button"
                className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer text-2xl font-bold"
                onClick={onClose}
              >
                ×
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex flex-col gap-5">
            {/* Nama Brand */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Brand</label>
              <input
                type="text"
                name="clientName"
                value={projectData.clientName}
                onChange={handleProjectChange}
                placeholder="Masukkan nama brand..."
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-primary focus:bg-white text-gray-800 disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
                disabled={isReadOnly}
                required
              />
            </div>

            {/* Worker Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add Worker</label>
              <select
                name="assignedTo"
                value={taskData.assignedTo || ''}
                onChange={handleTaskChange}
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-primary focus:bg-white text-gray-800 disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
                disabled={isReadOnly}
                required
              >
                <option value="">-- Pilih Worker --</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</label>
              <select
                name="category"
                value={taskData.category}
                onChange={handleTaskChange}
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-primary focus:bg-white text-gray-800 disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
                disabled={isReadOnly}
                required
              >
                <option value="carousel">Carousel</option>
                <option value="video">Video</option>
              </select>
            </div>

            {/* Priority Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prioritas</label>
              <select
                name="priority"
                value={taskData.priority || 'MEDIUM'}
                onChange={handleTaskChange}
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-primary focus:bg-white text-gray-800 disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
                disabled={isReadOnly}
                required
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            {/* Deadline */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deadline</label>
              <input
                type="date"
                name="endDate"
                value={projectData.endDate}
                onChange={handleProjectChange}
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-primary focus:bg-white text-gray-800 disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
                disabled={isReadOnly}
                required
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deskripsi Proyek</label>
              <textarea
                name="description"
                rows="4"
                value={taskData.description}
                onChange={handleTaskChange}
                placeholder="Detail pengerjaan proyek..."
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-primary focus:bg-white text-gray-800 disabled:opacity-75 disabled:cursor-not-allowed font-medium resize-none transition-all"
                disabled={isReadOnly}
              />
            </div>

            {/* Referensi Link */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Referensi Link</label>
              <input
                type="text"
                name="referenceLink"
                value={projectData.referenceLink}
                onChange={handleProjectChange}
                placeholder="e.g. https://drive.google.com/drive/folders/..."
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-primary focus:bg-white text-gray-800 disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
                disabled={isReadOnly}
              />
            </div>

            {/* Attachments Section */}
            <div className="flex flex-col gap-3 mt-4 border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attachments</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="bg-primary text-white border-none px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm"
                >
                  📎 Add File
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAttachmentUpload}
                  className="hidden"
                  multiple
                />
              </div>

              {/* Attachment List */}
              <div className="flex flex-col gap-2">
                {attachments.length === 0 ? (
                  <div className="text-center p-4 bg-gray-50 rounded-lg text-xs text-gray-400 italic">
                    Belum ada lampiran berkas.
                  </div>
                ) : (
                  attachments.map(att => (
                    <div key={att.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs gap-3">
                      <div className="flex-1 overflow-hidden">
                        <div className="font-semibold text-gray-700 truncate" title={att.name}>{att.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {att.size} • Oleh: {att.uploadedBy} • {att.uploadedAt}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="bg-transparent border-none text-blue-500 hover:text-blue-700 cursor-pointer text-xs font-bold"
                          onClick={() => window.open(att.fileUrl, '_blank')}
                        >
                          Unduh
                        </button>
                        {(currentUser.role === 'admin' || att.uploadedBy === currentUser.name) && (
                          <button
                            type="button"
                            className="bg-transparent border-none text-red-500 hover:text-red-700 cursor-pointer text-xs font-bold"
                            onClick={() => handleDeleteAttachment(att.id)}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2 flex-wrap">
          {!isReadOnly && (
            <>
              {project && (
                <button 
                  type="button" 
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600 text-white border-none py-3 px-4 rounded-lg text-sm font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1"
                >
                  🗑 Hapus Proyek
                </button>
              )}
              <button 
                type="submit" 
                className="flex-1 bg-primary text-white border-none py-3 rounded-lg text-sm font-bold cursor-pointer hover:opacity-95 shadow transition-opacity"
              >
                {project ? 'UPDATE PROJECT' : 'SAVE PROJECT'}
              </button>
            </>
          )}
          <button 
            type="button"
            className="flex-1 bg-white border border-gray-200 py-3 rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-100 text-gray-700 transition-colors"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectSidebar;
