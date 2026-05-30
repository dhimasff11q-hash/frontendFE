import axios from 'axios';

// URL dasar API Laravel Anda. Sesuaikan port jika berbeda (default artisan: 8000)
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Membuat instance Axios untuk efisiensi header autentikasi
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor Axios untuk menyematkan Token Sanctum secara otomatis ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sif_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor Axios untuk menangani response error (seperti 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sif_token');
      localStorage.removeItem('sif_current_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* ==========================================================================
   1. AUTHENTICATION & USER MANAGEMENT
   ========================================================================== */

/**
 * Melakukan login ke backend.
 * @param {string} email 
 * @param {string} password 
 */
export const login = async (email, password) => {
  try {
    const response = await api.post('/login', { email, password });
    const { access_token, user } = response.data;
    
    // Simpan token ke LocalStorage untuk interceptor Axios
    localStorage.setItem('sif_token', access_token);
    
    // Simpan info user ke LocalStorage agar dibaca oleh routing & navbar
    localStorage.setItem('sif_current_user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Email atau password salah!');
  }
};

/**
 * Melakukan pendaftaran worker baru (publik).
 */
export const register = async (name, email, password) => {
  try {
    const response = await api.post('/register', { name, email, password });
    const { access_token, user } = response.data;
    
    localStorage.setItem('sif_token', access_token);
    localStorage.setItem('sif_current_user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Pendaftaran gagal!');
  }
};

/**
 * Log out dari aplikasi.
 */
export const logout = async () => {
  try {
    await api.post('/logout');
  } catch (error) {
    console.error('Logout error on backend:', error);
  } finally {
    // Selalu hapus data lokal meskipun backend gagal/offline
    localStorage.removeItem('sif_token');
    localStorage.removeItem('sif_current_user');
  }
};

/**
 * Mendapatkan daftar worker aktif (Admin Only).
 */
export const getWorkers = async () => {
  try {
    const response = await api.get('/workers');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil daftar worker');
  }
};

/**
 * Mendapatkan informasi user aktif dari local storage.
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('sif_current_user');
  if (!userStr) return null;
  const user = JSON.parse(userStr);
  if (user && user.role && typeof user.role === 'object') {
    return {
      ...user,
      role: user.role.name
    };
  }
  return user;
};

/* ==========================================================================
   2. PROJECT MANAGEMENT
   ========================================================================== */

/**
 * Mengambil daftar proyek (Admin melihat semua, Worker melihat yang ditugaskan).
 */
export const getProjects = async (page = null, paginate = false) => {
  try {
    const params = {};
    if (paginate) {
      params.paginate = 'true';
      if (page) {
        params.page = page;
      }
    }
    const response = await api.get('/projects', { params });
    
    // Jika backend mengirim respon paginasi Laravel, data utama berada di response.data.data
    const dataArray = paginate ? response.data.data : response.data;
    
    // Mapping format properti database Laravel (snake_case) ke format Frontend (camelCase)
    const mappedProjects = dataArray.map(p => ({
      id: p.id,
      name: p.name,
      clientName: p.client_name,
      startDate: p.start_date ? p.start_date.split(/[ T]/)[0] : '',
      endDate: p.end_date ? p.end_date.split(/[ T]/)[0] : '',
      statusChecking: p.status_checking,
      referenceLink: p.reference_link,
      workers: p.workers ? p.workers.map(w => w.id) : [],
      tasks: p.tasks ? p.tasks.map(t => ({
        id: t.id,
        projectId: t.project_id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority ? t.priority.toUpperCase() : 'MEDIUM', // Format UPPERCASE di FE
        deadline: t.deadline ? t.deadline.split(/[ T]/)[0] : '',
        category: t.category,
        hasVoiceover: t.has_voiceover,
        progressPercentage: t.progress_percentage,
        statusChecking: t.status_checking || '',
        revisionDetail: t.revision_detail || '',
        assignedTo: t.assigned_to,
        assigneeName: t.assignee ? t.assignee.name : 'Belum Ditugaskan',
        attachments: t.attachments ? t.attachments.map(att => ({
          id: att.id,
          name: att.file_name,
          size: att.file_size > 1024 * 1024 
            ? (att.file_size / (1024 * 1024)).toFixed(1) + ' MB' 
            : (att.file_size / 1024).toFixed(0) + ' KB',
          fileUrl: att.file_url,
          uploadedBy: att.uploader ? att.uploader.name : 'System',
          uploadedAt: att.created_at ? att.created_at.split('T')[0] : ''
        })) : []
      })) : []
    }));

    if (paginate) {
      return {
        data: mappedProjects,
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        total: response.data.total
      };
    }
    return mappedProjects;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil proyek');
  }
};

/**
 * Membuat Proyek Baru beserta Tugas Pertamanya (Admin Only).
 */
export const createProject = async (projectData, taskData) => {
  try {
    // 1. Simpan proyek ke backend
    const projectRes = await api.post('/projects', {
      name: projectData.clientName,
      client_name: projectData.clientName,
      start_date: projectData.startDate,
      end_date: projectData.endDate,
      reference_link: projectData.referenceLink
    });
    const newProject = projectRes.data.project;
    
    // 2. Tugaskan Worker ke Proyek jika dipilih
    if (taskData.assignedTo) {
      await api.post(`/projects/${newProject.id}/assign`, {
        worker_ids: [parseInt(taskData.assignedTo)]
      });
    }

    // 3. Buat Tugas pertama untuk worker tersebut
    await api.post('/tasks', {
      project_id: newProject.id,
      assigned_to: parseInt(taskData.assignedTo),
      title: projectData.clientName,
      description: taskData.description,
      deadline: projectData.endDate,
      category: taskData.category,
      priority: taskData.priority.toLowerCase(), // Laravel menerima format lowercase
      has_voiceover: taskData.hasVoiceover || false,
      reference_link: projectData.referenceLink
    });

    return newProject;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal membuat proyek!');
  }
};

/**
 * Mengupdate Proyek (Admin Only).
 */
export const updateProject = async (projectId, projectData, taskData) => {
  try {
    // 1. Update data dasar proyek
    await api.put(`/projects/${projectId}`, {
      name: projectData.clientName,
      client_name: projectData.clientName,
      start_date: projectData.startDate,
      end_date: projectData.endDate,
      status_checking: projectData.statusChecking.toLowerCase(), // 'pending', 'acc', 'not_acc'
      reference_link: projectData.referenceLink
    });

    // 2. Update penugasan worker (sync)
    if (taskData.assignedTo) {
      await api.post(`/projects/${projectId}/assign`, {
        worker_ids: [parseInt(taskData.assignedTo)]
      });
    }

    // 3. Update data tugas terkait
    if (taskData.id) {
      await api.put(`/tasks/${taskData.id}`, {
        title: projectData.clientName,
        description: taskData.description,
        assigned_to: parseInt(taskData.assignedTo),
        deadline: projectData.endDate,
        category: taskData.category,
        priority: taskData.priority.toLowerCase(),
        status: taskData.status,
        progress_percentage: taskData.progressPercentage
      });
    }

    return true;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal memperbarui proyek!');
  }
};

/**
 * Menghapus Proyek (Admin Only).
 */
export const deleteProject = async (projectId) => {
  try {
    await api.delete(`/projects/${projectId}`);
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal menghapus proyek');
  }
};

/* ==========================================================================
   3. TASK MANAGEMENT & REVISIONS
   ========================================================================== */

/**
 * Mengupdate progres tugas (Worker) atau status kelayakan & revisi (Admin).
 */
export const updateTaskField = async (taskId, projectId, field, value) => {
  try {
    const updatePayload = {};

    if (field === 'status') {
      updatePayload.status = value;
      if (value === 'not_started') updatePayload.progress_percentage = 0;
      else if (value === 'in_progress') updatePayload.progress_percentage = 50;
      else if (value === 'resolved') {
        updatePayload.status = 'in_progress'; // BE tidak punya status 'resolved', melainkan dikonversi ke progress
        updatePayload.progress_percentage = 100;
      }
    } else if (field === 'statusChecking') {
      updatePayload.status_checking = value; // 'ACC' atau 'Revisi'
      if (value === 'ACC') {
        updatePayload.status = 'completed';
        updatePayload.progress_percentage = 100;
      } else if (value === 'Revisi') {
        updatePayload.status = 'in_progress';
        updatePayload.progress_percentage = 50; // set back progress ke 50% untuk revisi
      }
    } else if (field === 'priority') {
      updatePayload.priority = value.toLowerCase();
    } else if (field === 'deadline') {
      updatePayload.deadline = value;
    } else if (field === 'revisionDetail') {
      updatePayload.revision_detail = value;
    }

    const response = await api.put(`/tasks/${taskId}`, updatePayload);
    return response.data.task;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal memperbarui tugas!');
  }
};

/* ==========================================================================
   4. INVOICES & PAYMENTS
   ========================================================================== */

/**
 * Mengambil semua invoice.
 */
export const getInvoices = async () => {
  try {
    const response = await api.get('/invoices');
    return response.data.map(inv => ({
      id: inv.id,
      projectId: inv.project_id,
      projectName: inv.project ? inv.project.name : 'Unknown',
      workerId: inv.worker_id,
      workerName: inv.worker ? inv.worker.name : 'Unknown',
      totalAmount: parseFloat(inv.total_amount),
      status: inv.status, // 'draft', 'uploaded', 'paid'
      filePath: inv.file_path,
      uploadedBy: inv.uploaded_by,
      uploadedAt: inv.uploaded_at ? inv.uploaded_at.split(/[ T]/)[0] : '',
      createdAt: inv.created_at ? inv.created_at.split(/[ T]/)[0] : new Date().toISOString().split('T')[0]
    }));
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil daftar invoice');
  }
};

/**
 * Membuat Invoice baru oleh Worker.
 */
export const createInvoice = async (projectId, workerId) => {
  try {
    const response = await api.post('/invoices', {
      project_id: projectId,
      worker_id: workerId
    });
    return response.data.invoice;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal mengajukan invoice!');
  }
};

/**
 * Mengubah status invoice menjadi PAID (Admin Only).
 */
export const payInvoice = async (invoiceId) => {
  try {
    const response = await api.put(`/invoices/${invoiceId}/status`, {
      status: 'paid'
    });
    return response.data.invoice;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal menyetujui pembayaran invoice');
  }
};

/**
 * Menghapus Invoice (Admin Only).
 */
export const deleteInvoice = async (invoiceId) => {
  try {
    await api.delete(`/invoices/${invoiceId}`);
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal menghapus invoice');
  }
};

/* ==========================================================================
   5. FEEDBACKS
   ========================================================================== */

/**
 * Mengambil semua pesan feedback.
 */
export const getFeedbacks = async () => {
  try {
    const response = await api.get('/feedbacks');
    return response.data.map(f => ({
      id: f.id,
      projectId: f.project_id,
      projectName: f.project ? f.project.name : 'Unknown',
      fromUserId: f.from_user_id,
      fromUserName: f.from_user ? f.from_user.name : 'Unknown',
      toUserId: f.to_user_id,
      toUserName: f.to_user ? f.to_user.name : 'Unknown',
      message: f.message,
      isResolved: f.is_resolved,
      createdAt: f.created_at ? f.created_at.split('T')[0] : ''
    }));
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil feedback');
  }
};

/**
 * Mengirim feedback baru.
 */
export const createFeedback = async (projectId, toUserId, message) => {
  try {
    const response = await api.post('/feedbacks', {
      project_id: projectId,
      to_user_id: toUserId,
      message: message
    });
    return response.data.feedback;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal mengirim umpan balik!');
  }
};

/**
 * Menyelesaikan status feedback (is_resolved = true).
 */
export const resolveFeedback = async (feedbackId) => {
  try {
    const response = await api.put(`/feedbacks/${feedbackId}/resolve`);
    return response.data.feedback;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal menandai feedback selesai');
  }
};

/**
 * Mengunggah lampiran file ke sebuah tugas.
 */
export const uploadAttachment = async (taskId, file) => {
  try {
    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('file', file);

    const response = await api.post('/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.attachment;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal mengunggah berkas');
  }
};

/**
 * Menghapus lampiran file dari tugas.
 */
export const deleteAttachment = async (attachmentId) => {
  try {
    await api.delete(`/attachments/${attachmentId}`);
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal menghapus berkas');
  }
};
