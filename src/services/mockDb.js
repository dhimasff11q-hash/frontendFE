// Default Mock Data
const DEFAULT_USERS = [
  { id: 1, name: 'Super Admin', email: 'admin@sifcreative.com', password: '123', role: 'admin', isActive: true },
  { id: 4, name: 'Rian Kreatif', email: 'rian@example.com', password: '123', role: 'worker', isActive: true },
  { id: 5, name: 'Siti Designer', email: 'siti@example.com', password: '123', role: 'worker', isActive: true },
];

const DEFAULT_PROJECTS = [
  {
    id: 1,
    name: 'Kempen Ramadan 2026',
    clientName: 'Hijab Co',
    statusChecking: 'acc',
    startDate: '2026-03-01',
    endDate: '2026-04-15',
    workers: [4],
    referenceLink: 'https://drive.google.com/drive/folders/ramadan2026',
    tasks: [
      {
        id: 15,
        projectId: 1,
        title: 'Desain Feed Carousel Hijab Baru',
        description: 'Membuat 5 slide visual untuk IG Carousel',
        status: 'in_progress', // not_started, in_progress, completed
        priority: 'HIGH', // LOW, MEDIUM, HIGH, URGENT
        deadline: '2026-03-10',
        category: 'carousel',
        hasVoiceover: false,
        progressPercentage: 50,
        assignedTo: 4, // Rian Kreatif
        statusChecking: 'Revisi', // ACC, Revisi
        revisionDetail: 'Tolong ganti warna background slide 3 agar lebih kontras dengan teks.'
      }
    ]
  }
];

const DEFAULT_INVOICES = [
  {
    id: 1,
    projectId: 1,
    workerId: 4,
    totalAmount: 250000,
    status: 'uploaded', // draft, uploaded, paid
    filePath: 'invoice_ramadan_rian.pdf',
    uploadedBy: 1,
    uploadedAt: '2026-05-29',
    projectName: 'Kempen Ramadan 2026',
    workerName: 'Rian Kreatif',
  }
];

const DEFAULT_FEEDBACKS = [
  {
    id: 5,
    projectId: 1,
    fromUserId: 1,
    toUserId: 4,
    message: 'Revisi slide 3, tolong ganti warna background kontras.',
    isResolved: false,
    createdAt: '2026-05-30',
    projectName: 'Kempen Ramadan 2026',
    fromUserName: 'Super Admin',
    toUserName: 'Rian Kreatif'
  }
];

// DB Helper Functions
export const initializeDb = () => {
  if (!localStorage.getItem('sif_users')) {
    localStorage.setItem('sif_users', JSON.stringify(DEFAULT_USERS));
  }
  
  // Force reset/migration to new schema
  const existingProjects = localStorage.getItem('sif_projects');
  if (!existingProjects) {
    localStorage.setItem('sif_projects', JSON.stringify(DEFAULT_PROJECTS));
  } else {
    try {
      let parsed = JSON.parse(existingProjects);
      let migrated = false;
      
      parsed = parsed.map(p => {
        let updated = { ...p };
        if (updated.referenceLink === undefined) {
          updated.referenceLink = '';
          migrated = true;
        }
        if (updated.attachments === undefined) {
          updated.attachments = [];
          migrated = true;
        }
        if (updated.tasks) {
          updated.tasks = updated.tasks.map(t => {
            let taskUpdated = { ...t };
            if (taskUpdated.statusChecking === undefined) {
              taskUpdated.statusChecking = '';
              migrated = true;
            }
            if (taskUpdated.revisionDetail === undefined) {
              taskUpdated.revisionDetail = '';
              migrated = true;
            }
            return taskUpdated;
          });
        }
        return updated;
      });

      if (migrated) {
        localStorage.setItem('sif_projects', JSON.stringify(parsed));
      }
    } catch (e) {
      localStorage.setItem('sif_projects', JSON.stringify(DEFAULT_PROJECTS));
    }
  }

  if (!localStorage.getItem('sif_invoices')) {
    localStorage.setItem('sif_invoices', JSON.stringify(DEFAULT_INVOICES));
  }
  if (!localStorage.getItem('sif_feedbacks')) {
    localStorage.setItem('sif_feedbacks', JSON.stringify(DEFAULT_FEEDBACKS));
  }
};

export const getUsers = () => {
  initializeDb();
  return JSON.parse(localStorage.getItem('sif_users'));
};

export const getWorkers = () => {
  return getUsers().filter(user => user.role === 'worker' && user.isActive);
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('sif_current_user');
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem('sif_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('sif_current_user');
  }
};

export const getProjects = () => {
  initializeDb();
  return JSON.parse(localStorage.getItem('sif_projects'));
};

export const saveProjects = (projects) => {
  localStorage.setItem('sif_projects', JSON.stringify(projects));
};

export const getInvoices = () => {
  initializeDb();
  return JSON.parse(localStorage.getItem('sif_invoices'));
};

export const saveInvoices = (invoices) => {
  localStorage.setItem('sif_invoices', JSON.stringify(invoices));
};

export const getFeedbacks = () => {
  initializeDb();
  return JSON.parse(localStorage.getItem('sif_feedbacks'));
};

export const saveFeedbacks = (feedbacks) => {
  localStorage.setItem('sif_feedbacks', JSON.stringify(feedbacks));
};

export const logout = () => {
  localStorage.removeItem('sif_current_user');
};
