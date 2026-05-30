import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalNotification from '../components/ModalNotification';
import { 
  getCurrentUser, 
  getProjects as getProjectsAPI, 
  getInvoices as getInvoicesAPI, 
  createInvoice as createInvoiceAPI 
} from '../services/apiService';

const Payment = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [view, setView] = useState('payment');
  
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Modal Notification state
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });

  const showNotification = (message, type = 'success', title = '', onConfirm = null) => {
    setNotification({
      isOpen: true,
      type,
      title: title || (type === 'success' ? 'Berhasil' : type === 'error' ? 'Gagal' : 'Konfirmasi'),
      message,
      onConfirm
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        const [projData, invData] = await Promise.all([
          getProjectsAPI(),
          getInvoicesAPI()
        ]);
        setProjects(projData);
        setInvoices(invData);
      } catch (err) {
        console.error(err);
      }
    };
    loadPaymentData();
  }, []);

  // Ambil tugas yang statusnya 'completed' dan belum di-invoice untuk user saat ini
  const getUninvoicedCompletedTasks = () => {
    const uninvoiced = [];
    projects.forEach(project => {
      const completedTasks = project.tasks.filter(task => task.assignedTo === currentUser?.id && task.status === 'completed');
      
      const projectInvoicesSum = invoices
        .filter(inv => inv.projectId === project.id && inv.workerId === currentUser?.id)
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

  const tasksToInvoice = getUninvoicedCompletedTasks();
  const subtotal = tasksToInvoice.length * 50000;

  const handlePay = () => {
    if (tasksToInvoice.length === 0) {
      showNotification('Tidak ada tugas selesai yang perlu diklaim pembayaran.', 'warning');
      return;
    }
    setView('upload');
  };

  const handleUpload = async () => {
    try {
      if (tasksToInvoice.length > 0) {
        const uniqueProjectIds = [...new Set(tasksToInvoice.map(t => t.projectId))];
        for (const projId of uniqueProjectIds) {
          await createInvoiceAPI(projId, currentUser.id);
        }
        
        const [freshProjects, freshInvoices] = await Promise.all([
          getProjectsAPI(),
          getInvoicesAPI()
        ]);
        setProjects(freshProjects);
        setInvoices(freshInvoices);
        setView('success');
      }
    } catch (err) {
      showNotification('Gagal mengupload invoice: ' + err.message, 'error');
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'payment':
        return (
          <div className="w-full max-w-[800px] bg-[rgba(0,0,0,0.05)] p-5 rounded-lg">
            <div className="flex justify-between">
              <div>
                <h1 className="text-[2rem] font-bold mb-2.5">SIF Creative.</h1>
                <p className="text-[0.9rem] opacity-80 mb-5">Jalan ikan tombro no 44c kota Malang</p>
              </div>
              <div className="text-right">
                <div className="mb-2.5">
                  <small>PAY DATE</small>
                  <br />
                  <span className="opacity-70">{new Date().toISOString().split('T')[0]}</span>
                </div>
                <div>
                  <small>PAY TYPE</small>
                  <br />
                  <span className="opacity-70">BANK TRANSFER</span>
                </div>
              </div>
            </div>

            <table className="w-full border-collapse mb-5 mt-5">
              <thead>
                <tr className="bg-black/10">
                  <th className="text-left border-b-2 border-[rgba(255,255,255,0.3)] p-2.5">PENGERJAAN</th>
                  <th className="text-left border-b-2 border-[rgba(255,255,255,0.3)] p-2.5">TOTAL PENGERJAAN</th>
                  <th className="text-left border-b-2 border-[rgba(255,255,255,0.3)] p-2.5">TOTAL RATE</th>
                  <th className="text-left border-b-2 border-[rgba(255,255,255,0.3)] p-2.5">TOTAL GAJI</th>
                </tr>
              </thead>
              <tbody>
                {tasksToInvoice.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center italic text-white/70">
                      Tidak ada tugas selesai baru untuk ditagih.
                    </td>
                  </tr>
                ) : (
                  tasksToInvoice.map((task, i) => (
                    <tr key={task.id} className="border-b border-white/10">
                      <td className="p-2.5">{task.title} ({task.projectName})</td>
                      <td className="p-2.5">1</td>
                      <td className="p-2.5">50.000</td>
                      <td className="p-2.5">Rp 50.000</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="mt-5 text-right text-[1.2rem] font-bold">SUBTOTAL &nbsp;&nbsp;&nbsp;&nbsp; RP {subtotal.toLocaleString('id-ID')}</div>

            <div className="text-center">
              <button 
                className="p-[15px_30px] text-[1.1rem] font-bold border-none rounded-[5px] cursor-pointer mt-[30px] transition-[background-color] duration-300 bg-darkPaymentBlue text-white hover:bg-opacity-90 disabled:opacity-50" 
                onClick={handlePay}
                disabled={tasksToInvoice.length === 0}
              >
                BAYAR !!!
              </button>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="text-center">
            <button 
              className="p-[15px_30px] text-[1.1rem] font-bold border-none rounded-[5px] cursor-pointer mt-[30px] transition-[background-color] duration-300 bg-darkPaymentBlue text-white w-[300px] hover:bg-opacity-90" 
              onClick={handleUpload}
            >
              UPLOAD INVOICE
            </button>
            <br />
            <button
              className="p-[15px_30px] text-[1.1rem] font-bold border-none rounded-[5px] cursor-pointer mt-5 transition-[background-color] duration-300 bg-darkPaymentBlue text-white underline w-[300px] hover:bg-opacity-90"
              onClick={() => showNotification('Worker sudah dibayar', 'success')}
            >
              WORKER SUDAH DIBAYAR
            </button>
          </div>
        );

      case 'success':
        return (
          <div className="w-full max-w-[800px] bg-[rgba(0,0,0,0.05)] p-5 rounded-lg text-center">
            <div className="text-[2rem] font-bold mt-5 text-[#4ade80]">Terima kasih kerja kerasnya!</div>
            <p className="mt-5">Invoice berhasil diupload.</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-[10px_20px] bg-white text-paymentBlue font-bold rounded-lg border-none mt-5 cursor-pointer hover:bg-gray-100"
            >
              Kembali ke Dashboard
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-paymentBlue text-white font-sans flex flex-col min-h-screen pt-[70px]">
      <div className="p-[20px_10px] mt-[70px] border-b border-[rgba(255,255,255,0.2)] flex justify-between items-center">
        <div>
          <strong className="text-[1.2rem]">SIF Creative.</strong>
          <div className="text-[0.8rem]">client project</div>
        </div>
        <div className="flex items-center gap-[15px]">
          <div className="flex flex-col gap-[5px] cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span>List</span>
            <span className="border-b-2 border-white">Payment</span>
            <span>Feedback</span>
          </div>
          <div className="flex gap-[10px]">
            <div className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.3)] flex items-center justify-center">
              ?
            </div>
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-[0.7rem] text-center leading-normal">
              {currentUser?.name ? currentUser.name.slice(0, 3).toUpperCase() : 'SIF'}
              <br />
              Creative.
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-2.5 flex flex-col items-center">{renderContent()}</div>

      {/* CENTRAL CUSTOM NOTIFICATION MODAL */}
      <ModalNotification
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={closeNotification}
        onConfirm={notification.onConfirm}
      />
    </div>
  );
};

export default Payment;