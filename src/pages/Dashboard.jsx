import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ProjectSidebar from '../components/ProjectSidebar';
import TableList from '../components/TableList';
import ModalNotification from '../components/ModalNotification';
import {
  getCurrentUser,
  getProjects as getProjectsAPI,
  getInvoices as getInvoicesAPI,
  getFeedbacks as getFeedbacksAPI,
  getWorkers as getWorkersAPI,
  logout as logoutAPI,
  createInvoice as createInvoiceAPI,
  payInvoice as payInvoiceAPI,
  deleteInvoice as deleteInvoiceAPI,
  createFeedback as createFeedbackAPI,
  resolveFeedback as resolveFeedbackAPI,
  updateTaskField as updateTaskFieldAPI
} from '../services/apiService';

const Dashboard = () => {
  const currentUser = getCurrentUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [activeRevisionTask, setActiveRevisionTask] = useState(null);
  const [isSavingRevision, setIsSavingRevision] = useState(false);
  
  // Master States
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [workers, setWorkers] = useState([]);
  
  // Paginated Projects State
  const [paginatedProjectsData, setPaginatedProjectsData] = useState({
    data: [],
    currentPage: 1,
    lastPage: 1,
    total: 0
  });

  // Modal Notification state
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal'
  });

  const showNotification = (message, type = 'success', title = '', onConfirm = null, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal') => {
    setNotification({
      isOpen: true,
      type,
      title: title || (type === 'success' ? 'Berhasil' : type === 'error' ? 'Gagal' : type === 'confirm' ? 'Konfirmasi' : 'Perhatian'),
      message,
      onConfirm,
      confirmText,
      cancelText
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  // Helper untuk me-refresh seluruh data dari API
  const refreshAllData = async () => {
    try {
      const currentPage = paginatedProjectsData.currentPage || 1;
      const [allProj, invData, fbData, paginatedProj] = await Promise.all([
        getProjectsAPI(null, false),
        getInvoicesAPI(),
        getFeedbacksAPI(),
        getProjectsAPI(currentPage, true)
      ]);
      setProjects(allProj);
      setInvoices(invData);
      setFeedbacks(fbData);
      setPaginatedProjectsData(paginatedProj);
    } catch (err) {
      console.error('Error refreshing data from API:', err);
    }
  };

  // Memuat data dari backend API saat komponen dipasang
  useEffect(() => {
    const loadData = async () => {
      try {
        const promises = [
          getProjectsAPI(null, false),
          getInvoicesAPI(),
          getFeedbacksAPI(),
          getProjectsAPI(1, true)
        ];
        
        if (currentUser?.role === 'admin') {
          promises.push(getWorkersAPI());
        }
        
        const results = await Promise.all(promises);
        
        setProjects(results[0]);
        setInvoices(results[1]);
        setFeedbacks(results[2]);
        setPaginatedProjectsData(results[3]);
        
        if (currentUser?.role === 'admin') {
          setWorkers(results[4]);
        }
      } catch (err) {
        console.error('Error loading data from API:', err);
      }
    };
    loadData();
  }, []);

  const handlePageChange = async (page) => {
    try {
      const paginatedProj = await getProjectsAPI(page, true);
      setPaginatedProjectsData(paginatedProj);
    } catch (err) {
      showNotification('Gagal memuat halaman: ' + err.message, 'error');
    }
  };

  // Sync state helpers
  const updateProjectsState = async (newProjects) => {
    setProjects(newProjects);
    try {
      const paginatedProj = await getProjectsAPI(paginatedProjectsData.currentPage, true);
      setPaginatedProjectsData(paginatedProj);
    } catch (err) {
      console.error('Error updating paginated projects:', err);
    }
  };

  const updateInvoicesState = (newInvoices) => {
    setInvoices(newInvoices);
  };

  const updateFeedbacksState = (newFeedbacks) => {
    setFeedbacks(newFeedbacks);
  };

  const handleSaveRevisionDetail = async (taskId, projectId, text, originalText) => {
    if (text === originalText) {
      return; // Tidak ada perubahan, lewati
    }
    setIsSavingRevision(true);
    try {
      await updateTaskFieldAPI(taskId, projectId, 'revisionDetail', text);
      await refreshAllData();
      setActiveRevisionTask(prev => prev ? { ...prev, originalRevisionDetail: text } : null);
    } catch (err) {
      console.error('Gagal menyimpan detail revisi:', err);
      showNotification('Gagal menyimpan detail revisi: ' + err.message, 'error');
    } finally {
      setIsSavingRevision(false);
    }
  };

  const handleCloseRevisionSidebar = async () => {
    if (activeRevisionTask) {
      await handleSaveRevisionDetail(
        activeRevisionTask.id, 
        activeRevisionTask.projectId, 
        activeRevisionTask.revisionDetail, 
        activeRevisionTask.originalRevisionDetail
      );
    }
    setActiveRevisionTask(null);
  };

  const handleOpenRevision = (task) => {
    setIsModalOpen(false);
    setActiveRevisionTask({
      ...task,
      originalRevisionDetail: task.revisionDetail
    });
  };

  useEffect(() => {
    setActiveRevisionTask(null);
    setIsModalOpen(false);
  }, [activeMenu]);

  const handleAddProject = () => {
    setActiveRevisionTask(null);
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (project) => {
    setActiveRevisionTask(null);
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // --- Perhitungan Gaji & Invoice ---
  // Dapatkan tugas yang statusnya 'completed' dan belum di-invoice untuk user tertentu
  const getUninvoicedCompletedTasks = (userId) => {
    const uninvoiced = [];
    projects.forEach(project => {
      const completedTasks = project.tasks.filter(task => task.assignedTo === userId && task.status === 'completed');
      
      const projectInvoicesSum = invoices
        .filter(inv => inv.projectId === project.id && inv.workerId === userId)
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
        
      const previouslyInvoicedCount = Math.floor(projectInvoicesSum / 50000);
      const pendingTasks = completedTasks.slice(previouslyInvoicedCount);
      
      pendingTasks.forEach(task => {
        uninvoiced.push({
          ...task,
          projectName: project.name,
          clientName: project.clientName
        });
      });
    });
    return uninvoiced;
  };

  // Worker submit invoice via API
  const handleWorkerSubmitInvoice = async () => {
    try {
      const completedTasks = getUninvoicedCompletedTasks(currentUser.id);
      if (completedTasks.length === 0) {
        showNotification('Tidak ada tugas selesai yang perlu ditagih.', 'warning');
        return;
      }

      // Ambil semua unique project ID yang memiliki completed tasks
      const uniqueProjectIds = [...new Set(completedTasks.map(t => t.projectId))];
      
      // Loop dan buat invoice untuk masing-masing proyek
      for (const projId of uniqueProjectIds) {
        await createInvoiceAPI(projId, currentUser.id);
      }

      await refreshAllData();
      setActiveMenu('success');
    } catch (err) {
      showNotification('Gagal mengirim invoice: ' + err.message, 'error');
    }
  };

  // Admin pay invoice via API
  const handleAdminPayInvoice = async (invoiceId) => {
    try {
      await payInvoiceAPI(invoiceId);
      await refreshAllData();
      showNotification('Status invoice berhasil diubah menjadi PAID (Lunas)!', 'success');
    } catch (err) {
      showNotification('Gagal membayar invoice: ' + err.message, 'error');
    }
  };

  // Admin delete invoice via API
  const handleAdminDeleteInvoice = async (invoiceId) => {
    showNotification('Apakah Anda yakin ingin menghapus invoice ini?', 'confirm', 'Konfirmasi Hapus', async () => {
      try {
        await deleteInvoiceAPI(invoiceId);
        await refreshAllData();
        showNotification('Invoice berhasil dihapus.', 'success');
      } catch (err) {
        showNotification('Gagal menghapus invoice: ' + err.message, 'error');
      }
    });
  };

  // State dan Handler untuk Feedback
  const [feedbackForm, setFeedbackForm] = useState({
    projectId: '',
    toUserId: '',
    message: ''
  });

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackForm.projectId || !feedbackForm.toUserId || !feedbackForm.message) {
      showNotification('Mohon lengkapi semua bidang feedback.', 'warning');
      return;
    }
    try {
      await createFeedbackAPI(feedbackForm.projectId, feedbackForm.toUserId, feedbackForm.message);
      const freshFeedbacks = await getFeedbacksAPI();
      setFeedbacks(freshFeedbacks);
      setFeedbackForm({ projectId: '', toUserId: '', message: '' });
      showNotification('Feedback/Revisi berhasil dikirim!', 'success');
    } catch (err) {
      showNotification('Gagal mengirim feedback: ' + err.message, 'error');
    }
  };

  const handleResolveFeedback = async (id) => {
    try {
      await resolveFeedbackAPI(id);
      const freshFeedbacks = await getFeedbacksAPI();
      setFeedbacks(freshFeedbacks);
      showNotification('Feedback berhasil ditandai selesai!', 'success');
    } catch (err) {
      showNotification('Gagal menyelesaikan feedback: ' + err.message, 'error');
    }
  };

  // --- Render Views ---

  // 1. Dashboard View (Stats)
  const renderDashboardStats = () => {
    if (currentUser.role === 'admin') {
      const totalProjects = projects.length;
      const approvedProjects = projects.filter(p => p.statusChecking === 'acc').length;
      const pendingProjects = projects.filter(p => p.statusChecking === 'pending').length;
      const totalWorkersCount = workers.length;
      
      const unpaidFinances = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.totalAmount), 0);
      const paidFinances = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.totalAmount), 0);

      return (
        <div className="p-[30px] bg-white min-h-[calc(100vh-80px)]">
          <h2 className="text-2xl font-bold text-secondary mb-6">Overview Statistik (Admin)</h2>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <div className="bg-primary text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Total Proyek</div>
              <div className="text-3xl font-bold mt-2">{totalProjects}</div>
              <div className="text-xs opacity-75 mt-1">{approvedProjects} Disetujui | {pendingProjects} Pending</div>
            </div>

            <div className="bg-[#27ae60] text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Worker Aktif</div>
              <div className="text-3xl font-bold mt-2">{totalWorkersCount}</div>
              <div className="text-xs opacity-75 mt-1">Mengelola proyek kreatif</div>
            </div>

            <div className="bg-[#f39c12] text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Gaji Tertunda (Unpaid)</div>
              <div className="text-3xl font-bold mt-2">Rp {unpaidFinances.toLocaleString('id-ID')}</div>
              <div className="text-xs opacity-75 mt-1">Dari invoice terkumpul</div>
            </div>

            <div className="bg-[#8e44ad] text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Total Terbayar (Paid)</div>
              <div className="text-3xl font-bold mt-2">Rp {paidFinances.toLocaleString('id-ID')}</div>
              <div className="text-xs opacity-75 mt-1">Transaksi finansial sukses</div>
            </div>
          </div>

          {/* Recent Projects List */}
          <div className="bg-lightGray p-6 rounded-xl shadow-inner">
            <h3 className="text-lg font-bold text-secondary mb-4">Daftar Proyek & Status Kelayakan</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-primary text-white text-sm">
                    <th className="p-3 font-semibold">Nama Proyek</th>
                    <th className="p-3 font-semibold">Nama Client</th>
                    <th className="p-3 font-semibold">Durasi</th>
                    <th className="p-3 font-semibold">Status Kelayakan</th>
                    <th className="p-3 font-semibold">Jumlah Tugas</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => (
                    <tr key={p.id} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                      <td className="p-3 font-medium text-gray-800">{p.name}</td>
                      <td className="p-3 text-gray-600">{p.clientName}</td>
                      <td className="p-3 text-gray-500">{p.startDate} s/d {p.endDate}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.statusChecking === 'acc' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {p.statusChecking === 'acc' ? 'Disetujui (ACC)' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700 font-semibold">{p.tasks.length} Tugas</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    } else {
      // Worker stats
      const myProjects = projects.filter(p => p.workers.includes(currentUser.id));
      const myTasks = [];
      projects.forEach(p => {
        p.tasks.forEach(t => {
          if (t.assignedTo === currentUser.id) {
            myTasks.push(t);
          }
        });
      });

      const totalTasks = myTasks.length;
      const completedTasks = myTasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = myTasks.filter(t => t.status === 'in_progress' || t.status === 'resolved').length;
      const notStartedTasks = myTasks.filter(t => t.status === 'not_started').length;

      // Unpaid earnings = invoice pending + uninvoiced completed tasks
      const uninvoicedCompleted = getUninvoicedCompletedTasks(currentUser.id);
      const uninvoicedAmt = uninvoicedCompleted.length * 50000;
      const invoicePendingAmt = invoices.filter(i => i.workerId === currentUser.id && i.status !== 'paid').reduce((sum, i) => sum + Number(i.totalAmount), 0);
      const unpaidEarnings = uninvoicedAmt + invoicePendingAmt;
      const paidEarnings = invoices.filter(i => i.workerId === currentUser.id && i.status === 'paid').reduce((sum, i) => sum + Number(i.totalAmount), 0);

      return (
        <div className="p-[30px] bg-white min-h-[calc(100vh-80px)]">
          <h2 className="text-2xl font-bold text-secondary mb-6">Overview Statistik (Worker)</h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <div className="bg-primary text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Proyek Ditugaskan</div>
              <div className="text-3xl font-bold mt-2">{myProjects.length} Proyek</div>
              <div className="text-xs opacity-75 mt-1">Aktif di ruang kerja Anda</div>
            </div>

            <div className="bg-[#27ae60] text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Status Tugas</div>
              <div className="text-3xl font-bold mt-2">{completedTasks}/{totalTasks} Selesai</div>
              <div className="text-xs opacity-75 mt-1">{inProgressTasks} Progress | {notStartedTasks} Baru</div>
            </div>

            <div className="bg-[#f39c12] text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Gaji Belum Dibayar</div>
              <div className="text-3xl font-bold mt-2">Rp {unpaidEarnings.toLocaleString('id-ID')}</div>
              <div className="text-xs opacity-75 mt-1">Rp {uninvoicedAmt.toLocaleString('id-ID')} dapat diklaim invoice</div>
            </div>

            <div className="bg-[#8e44ad] text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Pendapatan Lunas (Paid)</div>
              <div className="text-3xl font-bold mt-2">Rp {paidEarnings.toLocaleString('id-ID')}</div>
              <div className="text-xs opacity-75 mt-1">Ditransfer ke rekening Anda</div>
            </div>
          </div>

          {/* Tasks Progress List */}
          <div className="bg-lightGray p-6 rounded-xl shadow-inner">
            <h3 className="text-lg font-bold text-secondary mb-4">Tugas Aktif Anda</h3>
            <div className="grid grid-cols-1 gap-4">
              {myTasks.length === 0 ? (
                <div className="text-center p-6 bg-white rounded-lg text-gray-500">
                  Tidak ada tugas yang ditugaskan kepada Anda saat ini.
                </div>
              ) : (
                myTasks.map(t => (
                  <div key={t.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center max-sm:flex-col max-sm:align-start max-sm:gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {t.category}
                        </span>
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          t.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-secondary mt-2">{t.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{t.description}</p>
                      <div className="text-xs text-gray-400 mt-2">Deadline: {t.deadline}</div>
                    </div>
                    <div className="text-right max-sm:text-left w-[200px] max-sm:w-full">
                      <div className="text-sm font-semibold text-secondary mb-1">Progress: {t.progressPercentage}%</div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-[width] duration-500" 
                          style={{ width: `${t.progressPercentage}%` }}
                        />
                      </div>
                      <div className="text-xs uppercase font-bold mt-2 text-gray-500">{t.status.replace('_', ' ')}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  // 2. Payment View
  const renderPaymentContent = () => {
    if (currentUser.role === 'admin') {
      // Admin payment view: view invoices list
      return (
        <div className="p-8 bg-white min-h-[calc(100vh-80px)]">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold text-secondary">Manajemen Invoice & Pembayaran</h1>
              <p className="text-gray-500 text-sm mt-1">Daftar tagihan yang dikirim oleh worker untuk dikonfirmasi</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse mt-4 bg-white shadow-sm rounded-lg overflow-hidden border">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm">
                  <th className="p-3 text-left border-b font-semibold">Worker</th>
                  <th className="p-3 text-left border-b font-semibold">Proyek</th>
                  <th className="p-3 text-left border-b font-semibold">Total Tagihan</th>
                  <th className="p-3 text-left border-b font-semibold">Tanggal Kirim</th>
                  <th className="p-3 text-left border-b font-semibold">Status</th>
                  <th className="p-3 text-center border-b font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-6 text-gray-500">Tidak ada data invoice.</td>
                  </tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv.id} className="border-b text-sm hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-800">{inv.workerName}</td>
                      <td className="p-3 text-gray-600">{inv.projectName}</td>
                      <td className="p-3 text-gray-800 font-bold">Rp {inv.totalAmount.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-gray-500">{inv.createdAt}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-center flex justify-center gap-2">
                        {inv.status !== 'paid' && (
                          <button 
                            className="bg-[#27ae60] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-600"
                            onClick={() => handleAdminPayInvoice(inv.id)}
                          >
                            BAYAR !!!
                          </button>
                        )}
                        <button 
                          className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-600"
                          onClick={() => handleAdminDeleteInvoice(inv.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else {
      // Worker payment view: list completed and uninvoiced tasks, and submit invoice
      const uninvoicedTasks = getUninvoicedCompletedTasks(currentUser.id);
      const subtotal = uninvoicedTasks.length * 50000;
      
      const myInvoices = invoices.filter(i => i.workerId === currentUser.id);

      return (
        <div className="p-8 bg-white min-h-[calc(100vh-80px)]">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold text-secondary">Klaim Pembayaran Gaji</h1>
              <p className="text-gray-500 text-sm mt-1">Klaim tugas berstatus "Completed" dengan tarif flat Rp 50.000,- per tugas</p>
            </div>
          </div>

          {activeMenu === 'success' ? (
            <div className="text-center px-5 py-[60px]">
              <div className="text-[2rem] font-bold text-[#10b981] mb-2.5">Terima kasih kerja kerasnya!</div>
              <p className="text-lg text-gray-500">Invoice berhasil diupload/dikirim.</p>
              <button 
                className="p-[12px_30px] text-base font-semibold border-none rounded-md cursor-pointer mt-[30px] transition-all bg-[#2563eb] text-white hover:opacity-90"
                onClick={() => setActiveMenu('payment')}
              >
                Kembali
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {/* Completed Tasks to Invoice */}
              <div className="bg-lightGray p-6 rounded-xl">
                <h3 className="text-lg font-bold text-secondary mb-4">Tugas Selesai Belum Ditagihkan</h3>
                {uninvoicedTasks.length === 0 ? (
                  <div className="text-center p-6 bg-white rounded-lg text-gray-500">
                    Tidak ada tugas selesai baru untuk ditagih saat ini.
                  </div>
                ) : (
                  <div>
                    <table className="w-full border-collapse bg-white rounded-lg overflow-hidden border">
                      <thead>
                        <tr className="bg-primary text-white text-sm">
                          <th className="p-3 text-left font-semibold">Nama Proyek</th>
                          <th className="p-3 text-left font-semibold">Judul Tugas</th>
                          <th className="p-3 text-left font-semibold">Kategori</th>
                          <th className="p-3 text-right font-semibold">Tarif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uninvoicedTasks.map(t => (
                          <tr key={t.id} className="border-b text-sm">
                            <td className="p-3 text-gray-800 font-medium">{t.projectName}</td>
                            <td className="p-3 text-gray-600">{t.title}</td>
                            <td className="p-3 text-gray-500 uppercase">{t.category}</td>
                            <td className="p-3 text-right text-gray-800 font-semibold">Rp 50.000</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-5 text-right p-[15px] bg-gray-50 rounded-md border">
                      <span className="text-base text-gray-500 mr-2.5">SUBTOTAL</span>
                      <span className="text-[1.25rem] font-bold text-secondary">
                        Rp {subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="text-center">
                      <button 
                        className="p-[12px_30px] text-base font-semibold border-none rounded-md cursor-pointer mt-[30px] transition-all bg-[#2563eb] text-white hover:opacity-90" 
                        onClick={handleWorkerSubmitInvoice}
                      >
                        BAYAR !!! (KIRIM INVOICE)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Invoices History */}
              <div className="bg-lightGray p-6 rounded-xl">
                <h3 className="text-lg font-bold text-secondary mb-4">Riwayat Pengajuan Invoice Anda</h3>
                <div className="overflow-x-auto bg-white rounded-lg border">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 text-left">
                        <th className="p-3 font-semibold">Invoice PDF</th>
                        <th className="p-3 font-semibold">Total Tagihan</th>
                        <th className="p-3 font-semibold">Tanggal Kirim</th>
                        <th className="p-3 font-semibold">Status Pembayaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myInvoices.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center p-6 text-gray-500">Belum ada pengajuan invoice.</td>
                        </tr>
                      ) : (
                        myInvoices.map(inv => (
                          <tr key={inv.id} className="border-b">
                            <td className="p-3">
                              {inv.filePath ? (
                                <a 
                                  href={`http://127.0.0.1:8000/storage/${inv.filePath}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary font-medium underline hover:text-blue-700"
                                >
                                  Unduh PDF
                                </a>
                              ) : (
                                <span className="text-gray-400 italic">Draft (Belum ada PDF)</span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-gray-800">Rp {inv.totalAmount.toLocaleString('id-ID')}</td>
                            <td className="p-3 text-gray-500">{inv.createdAt}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {inv.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  // 3. Feedback View
  const renderFeedbackContent = () => {
    // Ambil list feedback dinamis
    const myFeedbacks = currentUser.role === 'admin' 
      ? feedbacks 
      : feedbacks.filter(f => f.fromUserId === currentUser.id || f.toUserId === currentUser.id);

    // Ambil list proyek aktif untuk pilihan dropdown
    const selectProjectsList = currentUser.role === 'admin'
      ? projects
      : projects.filter(p => p.workers.includes(currentUser.id));

    // Ambil list worker untuk tujuan feedback (jika pengirim admin)
    const selectUsersList = currentUser.role === 'admin'
      ? workers
      : [{ id: 1, name: 'Super Admin' }]; // Ke Admin jika pengirim worker

    return (
      <div className="p-8 bg-white min-h-[calc(100vh-80px)]">
        <h2 className="text-2xl font-bold text-secondary mb-4">Umpan Balik & Revisi Proyek</h2>
        <p className="text-gray-500 text-sm mb-6">Gunakan form di bawah untuk mengirim pesan revisi, koreksi, atau koordinasi tugas dalam proyek.</p>

        <div className="grid grid-cols-3 gap-8 max-lg:grid-cols-1">
          {/* Kirim Feedback */}
          <div className="bg-lightGray p-6 rounded-xl border col-span-1 h-fit">
            <h3 className="text-base font-bold text-secondary mb-4">Kirim Umpan Balik Baru</h3>
            <form onSubmit={handleSendFeedback} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-secondary font-semibold">Pilih Proyek</label>
                <select 
                  className="p-2.5 rounded border border-primary bg-white text-sm outline-none focus:border-blue-500"
                  value={feedbackForm.projectId}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, projectId: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Proyek --</option>
                  {selectProjectsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-secondary font-semibold">Kirim Ke</label>
                <select 
                  className="p-2.5 rounded border border-primary bg-white text-sm outline-none focus:border-blue-500"
                  value={feedbackForm.toUserId}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, toUserId: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Penerima --</option>
                  {selectUsersList.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-secondary font-semibold">Pesan Revisi/Koreksi</label>
                <textarea 
                  rows="4"
                  className="p-2.5 rounded border border-primary bg-white text-sm outline-none resize-none focus:border-blue-500"
                  placeholder="Deskripsikan revisi visual, caption, atau teks..."
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                  required
                />
              </div>

              <button 
                type="submit"
                className="bg-primary text-white border-none p-3 rounded font-bold cursor-pointer hover:opacity-90 transition-opacity"
              >
                KIRIM PESAN
              </button>
            </form>
          </div>

          {/* List Feedback */}
          <div className="col-span-2 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-secondary border-b pb-2">Daftar Feedback & Status</h3>
            {myFeedbacks.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg text-gray-500 border border-dashed">
                Belum ada pesan umpan balik di dalam riwayat Anda.
              </div>
            ) : (
              myFeedbacks.map(f => (
                <div key={f.id} className={`p-5 rounded-lg border shadow-sm flex justify-between items-start gap-4 transition-colors ${
                  f.isResolved ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-blue-50/30 border-blue-100'
                }`}>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded">
                        {f.projectName}
                      </span>
                      <span className="text-xs text-gray-500">
                        Dari: <strong>{f.fromUserName}</strong> &rarr; Ke: <strong>{f.toUserName}</strong>
                      </span>
                      <span className="text-xs text-gray-400">
                        {f.createdAt}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mt-3 bg-white/70 p-3 rounded border border-gray-100 italic">
                      "{f.message}"
                    </p>
                  </div>
                  <div>
                    {f.isResolved ? (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase whitespace-nowrap">
                        ✔ Selesai
                      </span>
                    ) : (
                      // resolve diperbolehkan untuk Admin atau penerima feedback
                      (currentUser.role === 'admin' || f.toUserId === currentUser.id) ? (
                        <button 
                          className="bg-green-600 text-white border-none px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 transition-colors whitespace-nowrap"
                          onClick={() => handleResolveFeedback(f.id)}
                        >
                          Tandai Selesai
                        </button>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase whitespace-nowrap">
                          Pending
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDashboardMain = () => {
    if (currentUser.role === 'admin') {
      const totalProjects = projects.length;
      const approvedProjects = projects.filter(p => p.statusChecking === 'acc').length;
      const pendingProjects = projects.filter(p => p.statusChecking === 'pending').length;
      const totalWorkersCount = workers.length;
      
      const unpaidFinances = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.totalAmount), 0);
      const paidFinances = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.totalAmount), 0);

      return (
        <div className="flex flex-col gap-6 bg-white p-8">
          <h2 className="text-2xl font-bold text-secondary mb-2">Overview Statistik (Admin)</h2>
          
          <div className="grid grid-cols-4 gap-6 mb-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <div className="bg-primary text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Total Proyek</div>
              <div className="text-3xl font-bold mt-2">{totalProjects}</div>
              <div className="text-xs opacity-75 mt-1">{approvedProjects} Disetujui | {pendingProjects} Pending</div>
            </div>

            <div className="bg-[#27ae60] text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Worker Aktif</div>
              <div className="text-3xl font-bold mt-2">{totalWorkersCount}</div>
              <div className="text-xs opacity-75 mt-1">Mengelola proyek kreatif</div>
            </div>

            <div className="bg-[#f39c12] text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Gaji Tertunda (Unpaid)</div>
              <div className="text-3xl font-bold mt-2">Rp {unpaidFinances.toLocaleString('id-ID')}</div>
              <div className="text-xs opacity-75 mt-1">Dari invoice terkumpul</div>
            </div>

            <div className="bg-[#8e44ad] text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Total Terbayar (Paid)</div>
              <div className="text-3xl font-bold mt-2">Rp {paidFinances.toLocaleString('id-ID')}</div>
              <div className="text-xs opacity-75 mt-1">Transaksi finansial sukses</div>
            </div>
          </div>

          <TableList 
            projects={projects}
            paginatedProjects={paginatedProjectsData.data}
            currentPage={paginatedProjectsData.currentPage}
            totalPages={paginatedProjectsData.lastPage}
            onPageChange={handlePageChange}
            onAddProject={handleAddProject} 
            onEditProject={handleEditProject} 
            updateProjectsState={updateProjectsState}
            onOpenRevision={handleOpenRevision}
            showNotification={showNotification}
          />
        </div>
      );
    } else {
      // Worker stats
      const myProjects = projects.filter(p => p.workers.includes(currentUser.id));
      const myTasks = [];
      projects.forEach(p => {
        p.tasks.forEach(t => {
          if (t.assignedTo === currentUser.id) {
            myTasks.push(t);
          }
        });
      });

      const totalTasks = myTasks.length;
      const completedTasks = myTasks.filter(t => t.status === 'completed').length;
      
      const uninvoicedCompleted = getUninvoicedCompletedTasks(currentUser.id);
      const uninvoicedAmt = uninvoicedCompleted.length * 50000;
      const invoicePendingAmt = invoices.filter(i => i.workerId === currentUser.id && i.status !== 'paid').reduce((sum, i) => sum + Number(i.totalAmount), 0);
      const unpaidEarnings = uninvoicedAmt + invoicePendingAmt;
      const paidEarnings = invoices.filter(i => i.workerId === currentUser.id && i.status === 'paid').reduce((sum, i) => sum + Number(i.totalAmount), 0);

      return (
        <div className="flex flex-col gap-6 bg-white p-8">
          <h2 className="text-2xl font-bold text-secondary mb-2">Overview Statistik (Worker)</h2>

          <div className="grid grid-cols-4 gap-6 mb-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <div className="bg-primary text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Proyek Ditugaskan</div>
              <div className="text-3xl font-bold mt-2">{myProjects.length} Proyek</div>
              <div className="text-xs opacity-75 mt-1">Aktif di ruang kerja Anda</div>
            </div>

            <div className="bg-[#27ae60] text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Status Tugas</div>
              <div className="text-3xl font-bold mt-2">{completedTasks}/{totalTasks} Selesai</div>
              <div className="text-xs opacity-75 mt-1">Tugas aktif Anda</div>
            </div>

            <div className="bg-[#f39c12] text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Gaji Belum Dibayar</div>
              <div className="text-3xl font-bold mt-2">Rp {unpaidEarnings.toLocaleString('id-ID')}</div>
              <div className="text-xs opacity-75 mt-1">Rp {uninvoicedAmt.toLocaleString('id-ID')} dapat diklaim invoice</div>
            </div>

            <div className="bg-[#8e44ad] text-white p-6 rounded-xl shadow-md">
              <div className="text-sm font-semibold uppercase opacity-85">Pendapatan Lunas (Paid)</div>
              <div className="text-3xl font-bold mt-2">Rp {paidEarnings.toLocaleString('id-ID')}</div>
              <div className="text-xs opacity-75 mt-1">Ditransfer ke rekening Anda</div>
            </div>
          </div>

          <TableList 
            projects={projects}
            paginatedProjects={paginatedProjectsData.data}
            currentPage={paginatedProjectsData.currentPage}
            totalPages={paginatedProjectsData.lastPage}
            onPageChange={handlePageChange}
            onAddProject={handleAddProject} 
            onEditProject={handleEditProject} 
            updateProjectsState={updateProjectsState}
            onOpenRevision={handleOpenRevision}
            showNotification={showNotification}
          />
        </div>
      );
    }
  };

  const renderContent = () => {
    if (activeMenu === 'payment' || activeMenu === 'upload' || activeMenu === 'success') {
      return renderPaymentContent();
    }

    if (activeMenu === 'feedback') {
      return renderFeedbackContent();
    }

    return renderDashboardMain();
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar 
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />
      <div className={`flex-1 flex min-w-0 transition-[padding-left] duration-300 bg-white pt-[70px] max-[480px]:pt-[60px] ${isSidebarOpen ? 'pl-[250px]' : 'pl-0'}`}>
        <div className="flex-1 min-w-0 overflow-x-hidden">
          <Navbar toggleSidebar={toggleSidebar} />
          {renderContent()}
        </div>

        {/* REVISION SIDEBAR (KANAN) */}
        {activeRevisionTask && (
          <div className="w-[350px] min-w-[350px] max-md:w-full max-md:min-w-full max-md:fixed max-md:right-0 max-md:top-[70px] max-[480px]:top-[60px] max-md:h-[calc(100vh-70px)] max-[480px]:h-[calc(100vh-60px)] border-l border-gray-200 bg-gray-50 h-[calc(100vh-70px)] max-[480px]:h-[calc(100vh-60px)] sticky top-[70px] max-[480px]:top-[60px] p-6 overflow-y-auto flex flex-col justify-between z-[1000] shadow-lg animate-slide-in-right">
            <div>
              <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h3 className="font-bold text-lg text-secondary">
                  {currentUser.role === 'admin' ? '📝 Detail Revisi Admin' : '🔍 Review Revisi'}
                </h3>
                <button 
                  className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer text-xl"
                  onClick={handleCloseRevisionSidebar}
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <span className="text-[10px] uppercase font-bold bg-primary text-white px-2 py-0.5 rounded">
                  {activeRevisionTask.projectName}
                </span>
                <h4 className="font-bold text-base text-secondary mt-2">{activeRevisionTask.title}</h4>
                <p className="text-xs text-gray-500 mt-1">Ditugaskan ke: {activeRevisionTask.assigneeName}</p>
              </div>

              {currentUser.role === 'admin' ? (
                <div className="flex flex-col gap-2 mt-6">
                  <label className="text-xs font-bold text-secondary uppercase">Instruksi Revisi (Admin)</label>
                  <textarea
                    className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:border-primary text-gray-800 resize-y"
                    rows="8"
                    value={activeRevisionTask.revisionDetail}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveRevisionTask(prev => ({ ...prev, revisionDetail: val }));
                    }}
                    onBlur={(e) => {
                      handleSaveRevisionDetail(activeRevisionTask.id, activeRevisionTask.projectId, e.target.value, activeRevisionTask.originalRevisionDetail);
                    }}
                    placeholder="Masukkan instruksi revisi secara rinci untuk worker..."
                  />
                  <span className="text-[10px] text-gray-400 italic mt-1">Perubahan otomatis disimpan (Auto-save)</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-6">
                  <label className="text-xs font-bold text-secondary uppercase">Detail Revisi & Tanggapan Worker</label>
                  <textarea
                    className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:border-primary text-gray-800 resize-y"
                    rows="10"
                    value={activeRevisionTask.revisionDetail}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveRevisionTask(prev => ({ ...prev, revisionDetail: val }));
                    }}
                    onBlur={(e) => {
                      handleSaveRevisionDetail(activeRevisionTask.id, activeRevisionTask.projectId, e.target.value, activeRevisionTask.originalRevisionDetail);
                    }}
                    placeholder="Tanggapi atau edit detail revisi di sini..."
                  />
                  <span className="text-[10px] text-gray-400 italic mt-1">Perubahan otomatis disimpan (Auto-save)</span>
                </div>
              )}
            </div>

            <div className="mt-8 border-t pt-4">
              <button
                className="w-full bg-secondary text-white border-none py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                onClick={handleCloseRevisionSidebar}
                disabled={isSavingRevision}
              >
                {isSavingRevision ? 'Menyimpan...' : 'Selesai & Tutup'}
              </button>
            </div>
          </div>
        )}

        {/* PROJECT SIDEBAR (KANAN) */}
        {isModalOpen && (
          <ProjectSidebar
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            project={selectedProject}
            projects={projects}
            updateProjectsState={updateProjectsState}
            workers={workers}
            showNotification={showNotification}
          />
        )}
      </div>

      {/* CENTRAL CUSTOM NOTIFICATION MODAL */}
      <ModalNotification
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={closeNotification}
        onConfirm={notification.onConfirm}
        confirmText={notification.confirmText}
        cancelText={notification.cancelText}
      />
    </div>
  );
};

export default Dashboard;