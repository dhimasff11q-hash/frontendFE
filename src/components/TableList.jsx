import React, { useState, useEffect } from 'react';
import { getCurrentUser, getUsers } from '../services/mockDb';

const TableList = ({ projects, onAddProject, onEditProject, updateProjectsState, onOpenRevision }) => {
  const currentUser = getCurrentUser();
  const allUsers = getUsers();
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [editingTasks, setEditingTasks] = useState({});

  const getProgressStyle = (task) => {
    if (task.status === 'not_started') {
      return {
        bgClass: 'bg-gray-500 text-white font-bold',
        text: 'Not Started'
      };
    }
    if (task.status === 'in_progress') {
      return {
        bgClass: 'bg-[#f1c40f] text-gray-900 font-bold',
        text: 'On Progress'
      };
    }
    if (task.status === 'completed' || task.statusChecking === 'ACC') {
      return {
        bgClass: 'bg-[#27ae60] text-white font-bold',
        text: 'Resolved'
      };
    }
    if (task.status === 'resolved') {
      if (task.statusChecking === 'Revisi') {
        return {
          bgClass: 'bg-[#e74c3c] text-white font-bold',
          text: 'Resolved'
        };
      }
      return {
        bgClass: 'bg-[#f1c40f] text-gray-900 font-bold',
        text: 'Resolved'
      };
    }
    return {
      bgClass: 'bg-gray-500 text-white font-bold',
      text: 'Not Started'
    };
  };

  // Dapatkan detail proyek terpilih
  const selectedProj = projects.find(p => p.id === parseInt(selectedProjectId));

  // Fungsi hapus proyek dari bagian kontrol luar tabel
  const handleDeleteProject = (projId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus proyek ini? Tindakan ini akan menghapus proyek dan semua tugas di dalamnya.')) {
      const updated = projects.filter(p => p.id !== projId);
      updateProjectsState(updated);
      setSelectedProjectId('');
      alert('Proyek berhasil dihapus!');
    }
  };

  // Cek apakah tanggal deadline terlewati (overdue) dan tugas belum selesai
  const isOverdue = (deadlineStr, taskStatus) => {
    if (!deadlineStr || taskStatus === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(0, 0, 0, 0);
    return deadline < today;
  };

  // Ambil list tugas secara dinamis berdasarkan data proyek
  const getTasksList = () => {
    const tasksList = [];
    projects.forEach(project => {
      project.tasks.forEach(task => {
        // Filter jika worker (hanya tugas miliknya)
        if (currentUser.role === 'worker' && task.assignedTo !== currentUser.id) {
          return;
        }

        const assignee = allUsers.find(u => u.id === task.assignedTo);
        tasksList.push({
          ...task,
          projectName: project.name,
          clientName: project.clientName,
          statusChecking: task.statusChecking || '',
          revisionDetail: task.revisionDetail || '',
          assigneeName: assignee ? assignee.name : 'Belum Ditugaskan',
          projectObj: project
        });
      });
    });
    return tasksList;
  };

  const tasks = getTasksList();

  // Inisialisasi local editing state
  useEffect(() => {
    const initialEditing = {};
    tasks.forEach(task => {
      initialEditing[task.id] = {
        progressPercentage: task.progressPercentage || 0,
        priority: task.priority || 'MEDIUM',
        deadline: task.deadline || '',
        statusChecking: task.statusChecking || '',
        revisionDetail: task.revisionDetail || '',
        status: task.status || 'not_started'
      };
    });
    setEditingTasks(initialEditing);

    // Reset selected project if it has been deleted
    if (selectedProjectId) {
      const exists = projects.some(p => p.id === parseInt(selectedProjectId));
      if (!exists) {
        setSelectedProjectId('');
      }
    }
  }, [projects, selectedProjectId]);

  const handleInputChange = (taskId, field, value) => {
    setEditingTasks(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value
      }
    }));
  };

  // Simpan otomatis ke master state (Auto-save)
  const handleAutoSave = (taskId, projectId, field, value) => {
    let updates = { [field]: value };

    if (field === 'status') {
      if (value === 'not_started') {
        updates.progressPercentage = 0;
        updates.statusChecking = '';
      } else if (value === 'in_progress') {
        updates.progressPercentage = 50;
        updates.statusChecking = '';
      } else if (value === 'resolved') {
        updates.progressPercentage = 100;
        updates.statusChecking = ''; // Clear previous statusChecking so it goes back to yellow (pending check)
      }
    }

    if (field === 'statusChecking') {
      if (value === 'ACC') {
        updates.status = 'completed';
        updates.progressPercentage = 100;
      } else if (value === 'Revisi') {
        updates.status = 'resolved'; // keep as resolved so we show red resolved
        updates.progressPercentage = 50; // set back to 50 for revision
      }
    }

    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        const updatedTasks = project.tasks.map(task => {
          if (task.id === taskId) {
            return { ...task, ...updates };
          }
          return task;
        });
        return { ...project, tasks: updatedTasks };
      }
      return project;
    });

    updateProjectsState(updatedProjects);
  };

  // Menentukan class warna border-l dan background baris tugas
  const getRowStyleClass = (task) => {
    const overdue = isOverdue(task.deadline, task.status);
    const priorityUpper = (task.priority || 'MEDIUM').toUpperCase();

    let borderCol = 'border-l-[#3498db]'; // default medium blue
    if (priorityUpper === 'LOW') borderCol = 'border-l-[#27ae60]'; // green
    if (priorityUpper === 'MEDIUM') borderCol = 'border-l-[#3498db]'; // blue
    if (priorityUpper === 'HIGH') borderCol = 'border-l-[#f39c12]'; // orange
    if (priorityUpper === 'URGENT') borderCol = 'border-l-[#e74c3c]'; // red

    if (overdue) {
      return `border-l-[6px] border-l-[#e74c3c] bg-red-950/20`;
    }

    return `border-l-4 ${borderCol} hover:bg-white/5`;
  };

  return (
    <div className="bg-lightGray rounded-[15px] p-[30px] min-h-[calc(100vh-40px)]">
      {/* HEADER CONTROL AREA (DI LUAR TABEL) */}
      <div className="flex justify-between items-center mb-[30px] flex-wrap gap-[15px]">
        <h1 className="text-[32px] text-secondary m-0 font-bold">
          {currentUser.role === 'admin' ? 'Dashboard Admin' : 'Dashboard Worker'}
        </h1>
        
        {currentUser.role === 'admin' && (
          <div className="flex items-center gap-3 flex-wrap bg-white p-3 rounded-lg border shadow-sm">
            <button 
              className="bg-primary text-white border-none p-[10px_20px] rounded-lg text-sm font-bold cursor-pointer transition-all duration-300 hover:opacity-90" 
              onClick={onAddProject}
            >
              + Add Project
            </button>

            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            
            <select
              className="p-2.5 rounded-[5px] border border-gray-300 bg-white text-sm outline-none text-gray-700 font-semibold"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">-- Pilih Proyek --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <button
              className="bg-[#f39c12] text-white border-none p-[10px_20px] rounded-lg text-sm font-bold cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedProjectId}
              onClick={() => onEditProject(selectedProj)}
            >
              Edit Proyek
            </button>

            <button
              className="bg-[#e74c3c] text-white border-none p-[10px_20px] rounded-lg text-sm font-bold cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedProjectId}
              onClick={() => handleDeleteProject(selectedProj.id)}
            >
              Hapus Proyek
            </button>
          </div>
        )}
      </div>

      {/* TABLE AREA */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-bgBlue rounded-[10px] overflow-hidden">
          <thead>
            <tr>
              <th className="bg-primary text-white p-[15px] text-left font-semibold border-b-2 border-lightGray whitespace-nowrap">Nama Brand</th>
              <th className="bg-primary text-white p-[15px] text-left font-semibold border-b-2 border-lightGray whitespace-nowrap">Judul Project</th>
              <th className="bg-primary text-white p-[15px] text-left font-semibold border-b-2 border-lightGray whitespace-nowrap">Nama Worker</th>
              <th className="bg-primary text-white p-[15px] text-left font-semibold border-b-2 border-lightGray whitespace-nowrap">Prioritas</th>
              <th className="bg-primary text-white p-[15px] text-left font-semibold border-b-2 border-lightGray whitespace-nowrap">Tanggal Deadline</th>
              <th className="bg-primary text-white p-[15px] text-left font-semibold border-b-2 border-lightGray whitespace-nowrap">Progress</th>
              <th className="bg-primary text-white p-[15px] text-left font-semibold border-b-2 border-lightGray whitespace-nowrap">Referensi Link</th>
              <th className="bg-primary text-white p-[15px] text-left font-semibold border-b-2 border-lightGray whitespace-nowrap">Status</th>
              <th className="bg-primary text-white p-[15px] text-left font-semibold border-b-2 border-lightGray whitespace-nowrap">Detail Revisi</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-6 text-center text-white/85 italic bg-bgBlue/50">
                  Tidak ada tugas yang terdaftar saat ini.
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const editState = editingTasks[task.id] || { 
                  progressPercentage: 0, 
                  priority: 'MEDIUM', 
                  deadline: '', 
                  statusChecking: 'Revisi', 
                  revisionDetail: '' 
                };

                const overdue = isOverdue(task.deadline, task.status);

                return (
                  <tr key={task.id} className={`border-b border-lightGray transition-colors duration-300 ${getRowStyleClass(task)}`}>
                    {/* 1. Nama Brand */}
                    <td className="p-[15px]">
                      <button
                        type="button"
                        onClick={() => onEditProject(task.projectObj)}
                        className="text-white font-bold hover:underline cursor-pointer text-left bg-transparent border-none p-0 outline-none"
                      >
                        {task.clientName}
                      </button>
                    </td>

                    {/* 2. Judul Project */}
                    <td className="p-[15px] text-white">
                      <button
                        type="button"
                        onClick={() => onEditProject(task.projectObj)}
                        className="text-white font-semibold hover:underline cursor-pointer text-left bg-transparent border-none p-0 outline-none block mb-0.5"
                      >
                        {task.title}
                      </button>
                      <div className="text-[10px] text-white/70 uppercase">Cat: {task.category}</div>
                    </td>
                    
                    {/* 3. Nama Worker */}
                    <td className="p-[15px] text-white font-medium">{task.assigneeName}</td>

                    {/* 4. Prioritas */}
                    <td className="p-[15px] text-white">
                      {currentUser.role === 'admin' ? (
                        <select
                          className="p-1.5 rounded bg-white text-gray-800 text-xs font-semibold border-none outline-none focus:ring-2 focus:ring-blue-400"
                          value={editState.priority.toUpperCase()}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleInputChange(task.id, 'priority', val);
                            handleAutoSave(task.id, task.projectId, 'priority', val);
                          }}
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="URGENT">URGENT</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          task.priority === 'URGENT' ? 'bg-red-500 text-white' :
                          task.priority === 'HIGH' ? 'bg-orange-500 text-white' :
                          task.priority === 'MEDIUM' ? 'bg-blue-500 text-white' :
                          'bg-green-500 text-white'
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>
                      )}
                    </td>

                    {/* 5. Tanggal Deadline */}
                    <td className="p-[15px] text-white">
                      {currentUser.role === 'admin' ? (
                        <input
                          type="date"
                          value={editState.deadline}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleInputChange(task.id, 'deadline', val);
                            handleAutoSave(task.id, task.projectId, 'deadline', val);
                          }}
                          className="p-1.5 rounded bg-white text-gray-800 text-xs outline-none border-none font-semibold"
                        />
                      ) : (
                        <span className={`font-semibold ${overdue ? 'text-red-300 flex items-center gap-1 font-bold animate-pulse' : ''}`}>
                          {overdue && '⚠ '}
                          {task.deadline}
                        </span>
                      )}
                    </td>

                    {/* 6. Progress (Dropdown / Badge) */}
                    <td className="p-[15px] text-white min-w-[150px]">
                      {currentUser.role === 'worker' ? (
                        task.status === 'completed' ? (
                          <span className="px-3 py-1.5 rounded text-xs font-bold bg-[#27ae60] text-white flex items-center justify-center gap-1 w-fit shadow-sm">
                            ✔ Resolved
                          </span>
                        ) : (
                          <select
                            className={`p-2 rounded text-xs font-bold outline-none border-none cursor-pointer transition-all duration-300 shadow-sm w-fit ${getProgressStyle(task).bgClass}`}
                            value={editState.status || task.status}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleInputChange(task.id, 'status', val);
                              handleAutoSave(task.id, task.projectId, 'status', val);
                            }}
                          >
                            <option value="not_started" className="bg-white text-gray-800 font-semibold">Not Started</option>
                            <option value="in_progress" className="bg-white text-gray-800 font-semibold">On Progress</option>
                            <option value="resolved" className="bg-white text-gray-800 font-semibold">Resolved</option>
                          </select>
                        )
                      ) : (
                        <span className={`px-3 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 w-fit shadow-sm ${getProgressStyle(task).bgClass}`}>
                          {getProgressStyle(task).text === 'Resolved' && (task.status === 'completed' || task.statusChecking === 'ACC') && '✔ '}
                          {getProgressStyle(task).text === 'Resolved' && task.statusChecking === 'Revisi' && '✘ '}
                          {getProgressStyle(task).text}
                        </span>
                      )}
                    </td>

                    {/* 7. Referensi Link (Menampilkan saja) */}
                    <td className="p-[15px] text-white">
                      {task.projectObj.referenceLink ? (
                        <a 
                          href={task.projectObj.referenceLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="underline text-blue-100 hover:text-white font-semibold text-xs"
                        >
                          Buka Link
                        </a>
                      ) : (
                        <span className="text-white/60 text-xs italic">Tidak ada link</span>
                      )}
                    </td>

                    {/* 8. Status */}
                    <td className="p-[15px] text-white">
                      {currentUser.role === 'admin' ? (
                        <select
                          className="p-1.5 rounded bg-white text-gray-800 text-xs font-semibold border-none outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          value={editState.statusChecking || ''}
                          disabled={task.status !== 'resolved' && task.status !== 'completed'}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleInputChange(task.id, 'statusChecking', val);
                            handleAutoSave(task.id, task.projectId, 'statusChecking', val);
                          }}
                        >
                          <option value="" disabled>-- Check Status --</option>
                          <option value="ACC">ACC</option>
                          <option value="Revisi">Revisi</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                          task.statusChecking === 'ACC' ? 'bg-green-100 text-green-700' :
                          task.statusChecking === 'Revisi' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {task.statusChecking || 'Pending Check'}
                        </span>
                      )}
                    </td>

                    {/* 9. Detail Revisi */}
                    <td className="p-[15px] text-white min-w-[180px]">
                      {(task.statusChecking === 'Revisi' || task.revisionDetail) ? (
                        currentUser.role === 'admin' ? (
                          <button
                            type="button"
                            onClick={() => onOpenRevision(task)}
                            className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                              task.revisionDetail ? 'bg-[#f39c12] text-white hover:bg-orange-600' : 'bg-[#3498db] text-white hover:bg-blue-600'
                            }`}
                          >
                            {task.revisionDetail ? '📝 Edit/Detail Revisi' : '➕ Add Revisi'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenRevision(task)}
                            className="bg-[#e74c3c] text-white px-3 py-1.5 rounded text-xs font-bold cursor-pointer hover:bg-red-600 transition-colors flex items-center gap-1"
                          >
                            🔍 Review Revisi
                          </button>
                        )
                      ) : (
                        task.statusChecking === 'ACC' || task.status === 'completed' ? (
                          <span className="text-xs text-white/70 italic bg-green-900/40 px-2.5 py-1 rounded border border-green-500/20">✔ Tugas Ter-ACC</span>
                        ) : (
                          <span className="text-xs text-white/40 italic">-</span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableList;