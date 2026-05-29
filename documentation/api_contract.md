# 🚀 SIFcreative API Contract & Integration Documentation

Dokumentasi ini berisi kontrak API lengkap untuk frontend developer yang akan mengintegrasikan frontend (React 19 + Vite 8) dengan backend (Laravel API + Sanctum). 

---

## 📌 Informasi Umum (General Information)

* **Base URL**: `http://localhost:8000/api` (Lokasi server development default)
* **Headers Standar**:
  ```http
  Accept: application/json
  Content-Type: application/json
  ```
* **Otentikasi (Authentication)**: 
  Menggunakan **Laravel Sanctum** token-based. Header `Authorization` wajib disertakan untuk semua *Authenticated Routes*.
  ```http
  Authorization: Bearer {token_akses_anda}
  ```
* **Format Response Sukses Umum**:
  Respons sukses akan mengembalikan objek JSON atau array JSON langsung. Endpoint mutasi data (POST/PUT/DELETE) biasanya mengembalikan properti `message` dan objek yang dimodifikasi.

---

## 🔐 Matriks Otorisasi Peran (Role-Based Access Control)

Sistem ini memiliki dua peran utama: **Admin** dan **Worker** (kreatif). Berikut hak akses masing-masing endpoint:

| Modul / Fitur | Endpoint / Aksi | Admin | Worker (Kreatif) |
| :--- | :--- | :---: | :---: |
| **Auth** | Login & Registrasi Publik (Worker) | ✅ | ✅ |
| | Logout & Dapatkan Profil (`/api/me`) | ✅ | ✅ |
| | Registrasi Worker Baru (`/api/register-worker`) | ✅ | ❌ |
| **Dashboard** | Statistik Ringkasan | ✅ (Global) | ✅ (Personal & Proyek Terkait) |
| **User Management** | List, Update, Soft-Delete Users | ✅ | ❌ |
| **Projects** | Buat, Update, Delete Proyek | ✅ | ❌ |
| | List & Detail Proyek | ✅ (Semua) | ✅ (Hanya Proyek Ditugaskan) |
| | Hubungkan / Assign Worker ke Proyek | ✅ | ❌ |
| **Tasks** | Buat, Delete Tugas | ✅ | ❌ |
| | List Tugas & Filter Global | ✅ (Semua) | ✅ (Hanya Tugas Ditugaskan) |
| | Detail Tugas | ✅ | ✅ (Hanya Tugas Ditugaskan) |
| | Update Tugas (Semua Field) | ✅ | ❌ |
| | Update Progress Tugas (Status, Percentage, Ref) | ✅ | ✅ (Hanya Tugas Ditugaskan) |
| **Attachments** | Upload File ke Tugas | ✅ | ✅ (Hanya Tugas Ditugaskan) |
| | Hapus File Tugas | ✅ | ✅ (Hanya File yang Diunggah Sendiri) |
| **Invoices** | Kalkulasi & Buat Draft Invoice | ✅ | ❌ |
| | List & Detail Invoice | ✅ (Semua) | ✅ (Hanya Invoice Milik Sendiri) |
| | Upload Invoice PDF & Ubah Status (Paid dll.) | ✅ | ❌ |
| | Hapus Invoice | ✅ | ❌ |
| **Feedbacks** | List Feedback | ✅ (Semua) | ✅ (Hanya Feedback Terkait Diri Sendiri) |
| | Kirim Feedback Baru | ✅ | ✅ (Hanya Dalam Proyek yang Sama) |
| | Tandai Feedback Selesai (Resolve) | ✅ | ✅ (Penerima Feedback) |
| **Audit Logs** | Lihat Log Aktivitas | ✅ | ❌ |

---

## 🛠️ Format Response Error Standar

Semua error response akan menggunakan status code HTTP yang sesuai dan format JSON standar.

### 1. 401 Unauthorized (Token kadaluarsa atau tidak valid)
```json
{
  "message": "Unauthenticated."
}
```

### 2. 403 Forbidden (Akses ditolak / Tidak memiliki peran yang sesuai)
```json
{
  "message": "Unauthorized action."
}
```

### 3. 404 Not Found (Resource tidak ditemukan)
```json
{
  "message": "Record not found."
}
```

### 4. 422 Validation Error (Payload input tidak valid)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "Format email tidak valid.",
      "Email sudah terdaftar."
    ],
    "password": [
      "Password minimal harus 8 karakter."
    ]
  }
}
```

---

## 📂 Kontrak API Per Modul

### 1. Modul Otentikasi (Authentication)

#### 🔹 Login User
Mengautentikasi pengguna dan mengembalikan token akses.
* **HTTP Method**: `POST`
* **Path**: `/login`
* **Auth Wajib**: Tidak
* **Body Request** (`application/json`):
  ```json
  {
    "email": "admin@sifcreative.com",
    "password": "password123"
  }
  ```
* **Response Sukses (200 OK)**:
  ```json
  {
    "access_token": "1|laravel_sanctum_token_string_here",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "role_id": 1,
      "name": "Super Admin",
      "email": "admin@sifcreative.com",
      "is_active": true,
      "created_at": "2026-05-30T00:00:00.000000Z",
      "updated_at": "2026-05-30T00:00:00.000000Z",
      "deleted_at": null,
      "role": {
        "id": 1,
        "name": "admin",
        "created_at": "2026-05-30T00:00:00.000000Z",
        "updated_at": "2026-05-30T00:00:00.000000Z"
      }
    }
  }
  ```
* **Response Error Khusus (403 Forbidden - Akun Nonaktif)**:
  ```json
  {
    "message": "Akun Anda telah dinonaktifkan. Silakan hubungi admin."
  }
  ```

#### 🔹 Registrasi Publik (Worker)
Pendaftaran akun baru dari halaman publik (default langsung mendapatkan role `worker`).
* **HTTP Method**: `POST`
* **Path**: `/register`
* **Auth Wajib**: Tidak
* **Body Request** (`application/json`):
  ```json
  {
    "name": "Rian Kreatif",
    "email": "rian@example.com",
    "password": "password123"
  }
  ```
* **Response Sukses (201 Created)**:
  ```json
  {
    "access_token": "2|laravel_sanctum_token_string_here",
    "token_type": "Bearer",
    "user": {
      "id": 4,
      "role_id": 2,
      "name": "Rian Kreatif",
      "email": "rian@example.com",
      "is_active": true,
      "created_at": "2026-05-30T01:00:00.000000Z",
      "updated_at": "2026-05-30T01:00:00.000000Z",
      "role": {
        "id": 2,
        "name": "worker"
      }
    }
  }
  ```

#### 🔹 Dapatkan Data Profil Mandiri (Get Profile)
* **HTTP Method**: `GET`
* **Path**: `/me`
* **Auth Wajib**: Ya
* **Response Sukses (200 OK)**:
  ```json
  {
    "id": 4,
    "role_id": 2,
    "name": "Rian Kreatif",
    "email": "rian@example.com",
    "is_active": true,
    "created_at": "2026-05-30T01:00:00.000000Z",
    "updated_at": "2026-05-30T01:00:00.000000Z",
    "deleted_at": null,
    "role": {
      "id": 2,
      "name": "worker",
      "created_at": "2026-05-30T00:00:00.000000Z",
      "updated_at": "2026-05-30T00:00:00.000000Z"
    }
  }
  ```

#### 🔹 Register Worker (Admin Only)
Admin mendaftarkan worker baru secara manual.
* **HTTP Method**: `POST`
* **Path**: `/register-worker`
* **Auth Wajib**: Ya (Admin Only)
* **Body Request** (`application/json`):
  ```json
  {
    "name": "Siti Designer",
    "email": "siti@example.com",
    "password": "securepassword123",
    "role_id": 2
  }
  ```
* **Response Sukses (201 Created)**:
  ```json
  {
    "message": "Worker berhasil didaftarkan.",
    "user": {
      "id": 5,
      "role_id": 2,
      "name": "Siti Designer",
      "email": "siti@example.com",
      "is_active": true,
      "created_at": "2026-05-30T01:10:00.000000Z",
      "updated_at": "2026-05-30T01:10:00.000000Z",
      "role": {
        "id": 2,
        "name": "worker"
      }
    }
  }
  ```

#### 🔹 Logout
Menghapus session token saat ini di server.
* **HTTP Method**: `POST`
* **Path**: `/logout`
* **Auth Wajib**: Ya
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "Berhasil logout."
  }
  ```

---

### 2. Modul Dashboard

#### 🔹 Dapatkan Statistik Dashboard (Dashboard Stats)
Data yang dikembalikan berbeda secara struktural berdasarkan role user yang login.
* **HTTP Method**: `GET`
* **Path**: `/dashboard`
* **Auth Wajib**: Ya
* **Query Parameters**:
  * `refresh` (optional): `true` (untuk memaksa bypass/update cache data dashboard)
* **Response Sukses (200 OK) - Peran: Admin**:
  ```json
  {
    "role": "admin",
    "projects": {
      "total": 12,
      "pending_approval": 2,
      "approved": 10
    },
    "workers": {
      "total": 15,
      "active": 14
    },
    "tasks": {
      "total": 45,
      "completed": 20,
      "in_progress": 15,
      "not_started": 10
    },
    "finances": {
      "total_pending_payout": 750000.00,
      "total_paid": 5000000.00
    },
    "category_distribution": [
      { "category": "carousel", "count": 12 },
      { "category": "video", "count": 8 },
      { "category": "mirror", "count": 5 },
      { "category": "tiktok", "count": 10 },
      { "category": "instagram", "count": 7 },
      { "category": "story", "count": 3 }
    ],
    "recent_activities": [
      {
        "id": 124,
        "user_name": "Rian Kreatif",
        "action": "task.updated",
        "entity_type": "Task",
        "entity_id": 15,
        "created_at": "2026-05-30T01:15:30.000Z"
      },
      {
        "id": 123,
        "user_name": "Super Admin",
        "action": "project.created",
        "entity_type": "Project",
        "entity_id": 4,
        "created_at": "2026-05-30T01:00:10.000Z"
      }
    ]
  }
  ```
* **Response Sukses (200 OK) - Peran: Worker**:
  ```json
  {
    "role": "worker",
    "projects": {
      "assigned_count": 3
    },
    "tasks": {
      "total": 10,
      "completed": 4,
      "in_progress": 4,
      "not_started": 2
    },
    "finances": {
      "unpaid_earnings": 200000.00,
      "paid_earnings": 1500000.00
    },
    "feedbacks": {
      "pending_count": 2
    },
    "category_distribution": [
      { "category": "carousel", "count": 3 },
      { "category": "video", "count": 2 },
      { "category": "mirror", "count": 1 },
      { "category": "tiktok", "count": 2 },
      { "category": "instagram", "count": 2 },
      { "category": "story", "count": 0 }
    ],
    "recent_activities": [
      {
        "id": 124,
        "user_name": "Rian Kreatif",
        "action": "task.updated",
        "entity_type": "Task",
        "entity_id": 15,
        "created_at": "2026-05-30T01:15:30.000Z"
      }
    ]
  }
  ```

---

### 3. Modul Proyek (Projects)

#### 🔹 Dapatkan List Proyek
* **HTTP Method**: `GET`
* **Path**: `/projects`
* **Auth Wajib**: Ya
* **Query Parameters (Hanya Admin)**:
  * `search` (optional): String pencarian (mencocokkan nama proyek atau nama client)
  * `status_checking` (optional): `pending`, `acc`, `not_acc`
* **Behavior**: Admin melihat seluruh proyek di sistem. Worker hanya melihat proyek di mana dirinya di-assign.
* **Response Sukses (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "name": "Kempen Ramadan 2026",
      "client_name": "Hijab Co",
      "status_checking": "acc",
      "start_date": "2026-03-01",
      "end_date": "2026-04-15",
      "created_at": "2026-03-01T08:00:00.000000Z",
      "updated_at": "2026-04-15T10:00:00.000000Z",
      "deleted_at": null,
      "workers_count": 3
    }
  ]
  ```

#### 🔹 Detail Proyek
Mengembalikan detail lengkap proyek beserta tugas-tugas di dalamnya dan daftar worker terasosiasi.
* **HTTP Method**: `GET`
* **Path**: `/projects/{id}`
* **Auth Wajib**: Ya
* **Response Sukses (200 OK)**:
  ```json
  {
    "id": 1,
    "name": "Kempen Ramadan 2026",
    "client_name": "Hijab Co",
    "status_checking": "acc",
    "start_date": "2026-03-01",
    "end_date": "2026-04-15",
    "created_at": "2026-03-01T08:00:00.000000Z",
    "updated_at": "2026-04-15T10:00:00.000000Z",
    "deleted_at": null,
    "workers": [
      {
        "id": 4,
        "name": "Rian Kreatif",
        "email": "rian@example.com",
        "role_id": 2,
        "is_active": true,
        "pivot": {
          "project_id": 1,
          "user_id": 4,
          "assigned_at": "2026-03-01 08:30:00"
        },
        "role": {
          "id": 2,
          "name": "worker"
        }
      }
    ],
    "tasks": [
      {
        "id": 15,
        "project_id": 1,
        "assigned_to": 4,
        "title": "Desain Feed Carousel Hijab Baru",
        "description": "Membuat 5 slide visual untuk IG Carousel",
        "status": "in_progress",
        "priority": "high",
        "deadline": "2026-03-10 17:00:00",
        "category": "carousel",
        "has_voiceover": false,
        "reference_link": "https://drive.google.com/...",
        "caption": "Draf caption konten...",
        "progress_percentage": 50,
        "created_at": "2026-03-02T09:00:00.000000Z",
        "updated_at": "2026-03-05T14:22:15.000000Z",
        "deleted_at": null,
        "assignee": {
          "id": 4,
          "name": "Rian Kreatif",
          "role": {
            "id": 2,
            "name": "worker"
          }
        },
        "attachments": [
          {
            "id": 8,
            "task_id": 15,
            "uploaded_by": 4,
            "file_path": "attachments/abc123filename.png",
            "file_name": "HijabCo_20260305_DraftV1.png",
            "file_type": "png",
            "file_size": 2048500,
            "mime_type": "image/png",
            "created_at": "2026-03-05T14:22:15.000000Z",
            "uploader": {
              "id": 4,
              "name": "Rian Kreatif"
            }
          }
        ]
      }
    ]
  }
  ```

#### 🔹 Buat Proyek (Admin Only)
* **HTTP Method**: `POST`
* **Path**: `/projects`
* **Auth Wajib**: Ya (Admin Only)
* **Body Request** (`application/json`):
  ```json
  {
    "name": "Branding Launch B2B",
    "client_name": "PT Maju Bersama",
    "start_date": "2026-06-01",
    "end_date": "2026-07-31"
  }
  ```
* **Response Sukses (201 Created)**:
  ```json
  {
    "message": "Proyek berhasil dibuat.",
    "project": {
      "id": 2,
      "name": "Branding Launch B2B",
      "client_name": "PT Maju Bersama",
      "start_date": "2026-06-01",
      "end_date": "2026-07-31",
      "status_checking": "pending",
      "updated_at": "2026-05-30T02:00:00.000000Z",
      "created_at": "2026-05-30T02:00:00.000000Z"
    }
  }
  ```

#### 🔹 Update Proyek (Admin Only)
* **HTTP Method**: `PUT`
* **Path**: `/projects/{id}`
* **Auth Wajib**: Ya (Admin Only)
* **Body Request** (`application/json`):
  ```json
  {
    "name": "Branding Launch B2B Updated",
    "client_name": "PT Maju Bersama",
    "start_date": "2026-06-01",
    "end_date": "2026-08-15",
    "status_checking": "acc"
  }
  ```
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "Proyek berhasil diperbarui.",
    "project": {
      "id": 2,
      "name": "Branding Launch B2B Updated",
      "client_name": "PT Maju Bersama",
      "status_checking": "acc",
      "start_date": "2026-06-01",
      "end_date": "2026-08-15",
      "created_at": "2026-05-30T02:00:00.000000Z",
      "updated_at": "2026-05-30T02:05:00.000000Z"
    }
  }
  ```

#### 🔹 Hapus Proyek (Admin Only)
Menghapus proyek secara halus (Soft Delete).
* **HTTP Method**: `DELETE`
* **Path**: `/projects/{id}`
* **Auth Wajib**: Ya (Admin Only)
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "Proyek berhasil dihapus."
  }
  ```

#### 🔹 Hubungkan / Assign Workers ke Proyek (Admin Only)
Menentukan daftar worker yang ditugaskan ke dalam suatu proyek. Aksi ini melakukan sinkronisasi penuh (sync).
* **HTTP Method**: `POST`
* **Path**: `/projects/{id}/assign`
* **Auth Wajib**: Ya (Admin Only)
* **Body Request** (`application/json`):
  ```json
  {
    "worker_ids": [4, 5]
  }
  ```
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "Worker berhasil ditugaskan ke proyek.",
    "workers": [
      {
        "id": 4,
        "name": "Rian Kreatif",
        "email": "rian@example.com",
        "role_id": 2,
        "is_active": true
      },
      {
        "id": 5,
        "name": "Siti Designer",
        "email": "siti@example.com",
        "role_id": 2,
        "is_active": true
      }
    ]
  }
  ```

---

### 4. Modul Tugas (Tasks)

#### 🔹 Dapatkan List Tugas
* **HTTP Method**: `GET`
* **Path**: `/tasks`
* **Auth Wajib**: Ya
* **Query Parameters (Hanya Admin)**:
  * `project_id` (optional): Filter berdasarkan ID proyek
  * `assigned_to` (optional): Filter berdasarkan ID worker
  * `status` (optional): `not_started`, `in_progress`, `completed`
  * `category` (optional): `carousel`, `video`, `mirror`, `tiktok`, `instagram`, `story`
* **Behavior**: Admin dapat memfilter seluruh tugas. Worker hanya menerima daftar tugas yang ditugaskan kepada dirinya sendiri.
* **Response Sukses (200 OK)**:
  ```json
  [
    {
      "id": 15,
      "project_id": 1,
      "assigned_to": 4,
      "title": "Desain Feed Carousel Hijab Baru",
      "description": "Membuat 5 slide visual untuk IG Carousel",
      "status": "in_progress",
      "priority": "high",
      "deadline": "2026-03-10 17:00:00",
      "category": "carousel",
      "has_voiceover": false,
      "reference_link": "https://drive.google.com/...",
      "caption": "Draf caption konten...",
      "progress_percentage": 50,
      "created_at": "2026-03-02T09:00:00.000000Z",
      "updated_at": "2026-03-05T14:22:15.000000Z",
      "project": {
        "id": 1,
        "name": "Kempen Ramadan 2026",
        "client_name": "Hijab Co"
      },
      "assignee": {
        "id": 4,
        "name": "Rian Kreatif",
        "role": {
          "id": 2,
          "name": "worker"
        }
      },
      "attachments": []
    }
  ]
  ```

#### 🔹 Dapatkan Detail Tugas
* **HTTP Method**: `GET`
* **Path**: `/tasks/{id}`
* **Auth Wajib**: Ya
* **Response Sukses (200 OK)**:
  Mengembalikan detail satu tugas (sama dengan struktur item list lengkap dengan detail project, assignee, dan array attachments).

#### 🔹 Buat Tugas Baru (Admin Only)
Membuat tugas baru dan meng-assign ke worker. Jika worker belum terdaftar di proyek terkait, sistem akan meng-assign worker tersebut ke proyek secara otomatis.
* **HTTP Method**: `POST`
* **Path**: `/tasks`
* **Auth Wajib**: Ya (Admin Only)
* **Body Request** (`application/json`):
  ```json
  {
    "project_id": 1,
    "assigned_to": 4,
    "title": "Video Reels Outfit Lebaran",
    "description": "Pengambilan video di studio dengan talent baju lebaran",
    "deadline": "2026-04-05 18:00:00",
    "category": "video",
    "priority": "medium",
    "has_voiceover": true,
    "reference_link": "https://tiktok.com/reference-video-url",
    "caption": "Outfit lebaran check! ✨ #reels #ramadan"
  }
  ```
* **Response Sukses (201 Created)**:
  ```json
  {
    "message": "Tugas berhasil dibuat.",
    "task": {
      "id": 16,
      "project_id": 1,
      "assigned_to": 4,
      "title": "Video Reels Outfit Lebaran",
      "description": "Pengambilan video di studio dengan talent baju lebaran",
      "deadline": "2026-04-05 18:00:00",
      "category": "video",
      "priority": "medium",
      "has_voiceover": true,
      "reference_link": "https://tiktok.com/reference-video-url",
      "caption": "Outfit lebaran check! ✨ #reels #ramadan",
      "progress_percentage": 0,
      "status": "not_started",
      "updated_at": "2026-05-30T02:10:00.000000Z",
      "created_at": "2026-05-30T02:10:00.000000Z",
      "project": {
        "id": 1,
        "name": "Kempen Ramadan 2026"
      },
      "assignee": {
        "id": 4,
        "name": "Rian Kreatif"
      }
    }
  }
  ```

#### 🔹 Update Tugas (Dua Jalur Logika)
* **HTTP Method**: `PUT`
* **Path**: `/tasks/{id}`
* **Auth Wajib**: Ya

##### 🛡️ Jalur 1: Aksi dari Admin (Dapat mengubah seluruh field)
Admin dapat mengedit seluruh detail, termasuk merubah assignee, memodifikasi target, mengganti deskripsi dll.
* **Body Request** (`application/json`):
  ```json
  {
    "title": "Video Reels Outfit Lebaran - Final",
    "description": "Deskripsi diperbarui untuk final cut",
    "assigned_to": 4,
    "deadline": "2026-04-07 18:00:00",
    "category": "video",
    "priority": "urgent",
    "has_voiceover": true,
    "reference_link": "https://tiktok.com/reference-video-url",
    "caption": "Outfit lebaran check! ✨ #reels #ramadan",
    "progress_percentage": 100,
    "status": "completed"
  }
  ```

##### 🎨 Jalur 2: Aksi dari Worker (Hanya memperbarui progress & referensi hasil)
Worker hanya diijinkan mengupdate status pengerjaan, progress %, link hasil pengerjaan, dan draf caption.
* **Body Request** (`application/json`):
  ```json
  {
    "status": "in_progress",
    "progress_percentage": 75,
    "reference_link": "https://drive.google.com/folder-hasil-reels",
    "caption": "Reels Lebaran Final Cut dengan voiceover"
  }
  ```
  *(Catatan: Jika `progress_percentage` diset ke `100`, status otomatis tersinkronisasi menjadi `completed` oleh backend, begitupun sebaliknya).*
* **Response Sukses (200 OK) - Berlaku untuk kedua jalur**:
  ```json
  {
    "message": "Tugas berhasil diperbarui.",
    "task": {
      "id": 16,
      ...
    }
  }
  ```

#### 🔹 Hapus Tugas (Admin Only)
Menghapus tugas secara halus (Soft Delete).
* **HTTP Method**: `DELETE`
* **Path**: `/tasks/{id}`
* **Auth Wajib**: Ya (Admin Only)
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "Tugas berhasil dihapus."
  }
  ```

---

### 5. Modul Lampiran Media (Attachments)

#### 🔹 Upload File Lampiran
Mengunggah media pengerjaan (bukti gambar/video/dokumen) ke suatu tugas.
* **HTTP Method**: `POST`
* **Path**: `/attachments`
* **Auth Wajib**: Ya
* **Content-Type**: `multipart/form-data`
* **Body Request (Form Data)**:
  * `task_id` (wajib, integer): ID Tugas terkait
  * `file` (wajib, file): File media. Maksimum ukuran: **50 MB**.
  * *Ekstensi file yang diperbolehkan*: `mp4`, `png`, `jpg`, `jpeg`, `pdf`, `docx`.
* **Response Sukses (201 Created)**:
  ```json
  {
    "message": "File berhasil diunggah.",
    "attachment": {
      "id": 9,
      "task_id": 16,
      "uploaded_by": 4,
      "file_path": "attachments/xyz789random.mp4",
      "file_name": "reels_ramadan_final.mp4",
      "file_type": "mp4",
      "file_size": 15482910,
      "mime_type": "video/mp4",
      "created_at": "2026-05-30T02:22:00.000000Z",
      "uploader": {
        "id": 4,
        "name": "Rian Kreatif"
      }
    }
  }
  ```

#### 🔹 Hapus File Lampiran
Menghapus media lampiran dari tugas dan menghapus fisiknya dari storage server.
* **HTTP Method**: `DELETE`
* **Path**: `/attachments/{id}`
* **Auth Wajib**: Ya
* **Behavior**: Admin dapat menghapus lampiran apa saja. Worker hanya dapat menghapus lampiran yang diunggah oleh dirinya sendiri.
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "File berhasil dihapus."
  }
  ```

---

### 6. Modul Keuangan & Tagihan (Invoices)

*Sistem menghitung biaya jasa worker secara flat: **Rp 50.000,-** per tugas yang berstatus `completed`.*

#### 🔹 Dapatkan List Invoice
* **HTTP Method**: `GET`
* **Path**: `/invoices`
* **Auth Wajib**: Ya
* **Query Parameters (Hanya Admin)**:
  * `status` (optional): `draft`, `uploaded`, `paid`
  * `project_id` (optional): ID proyek
  * `worker_id` (optional): ID worker
* **Behavior**: Admin melihat daftar invoice dari seluruh worker. Worker hanya melihat invoice miliknya sendiri.
* **Response Sukses (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "project_id": 1,
      "worker_id": 4,
      "total_amount": "250000.00",
      "status": "uploaded",
      "file_path": "invoices/invoice_ramadan_rian.pdf",
      "uploaded_by": 1,
      "uploaded_at": "2026-05-29 23:00:00",
      "created_at": "2026-05-29T22:30:00.000000Z",
      "updated_at": "2026-05-29T23:00:00.000000Z",
      "project": {
        "id": 1,
        "name": "Kempen Ramadan 2026"
      },
      "worker": {
        "id": 4,
        "name": "Rian Kreatif"
      },
      "admin": {
        "id": 1,
        "name": "Super Admin"
      }
    }
  ]
  ```

#### 🔹 Kalkulasi Nilai Draft Invoice (Admin Only)
Menghitung jumlah akumulasi tugas terselesaikan yang belum pernah ditagihkan, untuk melihat estimasi nilai invoice.
* **HTTP Method**: `POST`
* **Path**: `/invoices/calculate`
* **Auth Wajib**: Ya (Admin Only)
* **Body Request** (`application/json`):
  ```json
  {
    "worker_id": 4,
    "project_id": 1
  }
  ```
* **Response Sukses (200 OK)**:
  ```json
  {
    "total_completed_tasks": 7,
    "previously_invoiced_tasks": 2,
    "pending_tasks_count": 5,
    "amount": 250000.00
  }
  ```

#### 🔹 Buat Draft Invoice (Admin Only)
Membuat record invoice baru berstatus `draft` berdasarkan kalkulasi tugas yang terselesaikan.
* **HTTP Method**: `POST`
* **Path**: `/invoices`
* **Auth Wajib**: Ya (Admin Only)
* **Body Request** (`application/json`):
  ```json
  {
    "worker_id": 4,
    "project_id": 1
  }
  ```
* **Response Sukses (201 Created)**:
  ```json
  {
    "message": "Draf Invoice berhasil dibuat.",
    "invoice": {
      "id": 2,
      "project_id": 1,
      "worker_id": 4,
      "total_amount": 250000.00,
      "status": "draft",
      "file_path": null,
      "uploaded_by": null,
      "uploaded_at": null,
      "created_at": "2026-05-30T02:30:00.000000Z",
      "updated_at": "2026-05-30T02:30:00.000000Z",
      "project": {
        "id": 1,
        "name": "Kempen Ramadan 2026"
      },
      "worker": {
        "id": 4,
        "name": "Rian Kreatif"
      }
    }
  }
  ```

#### 🔹 Upload File PDF Invoice (Admin Only)
Mengunggah dokumen PDF Invoice resmi ke sistem. Status otomatis berubah dari `draft` ke `uploaded`.
* **HTTP Method**: `POST`
* **Path**: `/invoices/{id}/upload`
* **Auth Wajib**: Ya (Admin Only)
* **Content-Type**: `multipart/form-data`
* **Body Request (Form Data)**:
  * `file` (wajib, file): File harus bertipe **PDF**, ukuran maksimal **10 MB**.
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "PDF Invoice berhasil diunggah.",
    "invoice": {
      "id": 2,
      "project_id": 1,
      "worker_id": 4,
      "total_amount": "250000.00",
      "status": "uploaded",
      "file_path": "invoices/some_random_hash.pdf",
      "uploaded_by": 1,
      "uploaded_at": "2026-05-30 02:35:10",
      "project": { ... },
      "worker": { ... },
      "admin": {
        "id": 1,
        "name": "Super Admin"
      }
    }
  }
  ```

#### 🔹 Update Status Pembayaran Invoice (Admin Only)
Memperbarui status invoice (misalnya menandai sebagai lunas / `paid`).
* **HTTP Method**: `PUT`
* **Path**: `/invoices/{id}/status`
* **Auth Wajib**: Ya (Admin Only)
* **Body Request** (`application/json`):
  ```json
  {
    "status": "paid"
  }
  ```
  *(Status yang valid: `draft`, `uploaded`, `paid`)*
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "Status Invoice berhasil diperbarui.",
    "invoice": {
      "id": 2,
      "status": "paid",
      ...
    }
  }
  ```

#### 🔹 Hapus Invoice (Admin Only)
Menghapus record invoice beserta file fisiknya dari storage.
* **HTTP Method**: `DELETE`
* **Path**: `/invoices/{id}`
* **Auth Wajib**: Ya (Admin Only)
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "Invoice berhasil dihapus."
  }
  ```

---

### 7. Modul Umpan Balik (Feedbacks)

*Feedback ditujukan untuk komunikasi revisi/evaluasi antar anggota tim di dalam satu proyek pengerjaan.*

#### 🔹 Dapatkan List Feedback
* **HTTP Method**: `GET`
* **Path**: `/feedbacks`
* **Auth Wajib**: Ya
* **Query Parameters (Hanya Admin)**:
  * `project_id` (optional): Filter feedback proyek tertentu
  * `is_resolved` (optional): `1` (selesai) atau `0` (pending)
* **Behavior**: Admin dapat melihat semua feedback. Worker hanya melihat feedback di mana ia menjadi pengirim (`from_user_id`) ATAU penerima (`to_user_id`).
* **Response Sukses (200 OK)**:
  ```json
  [
    {
      "id": 5,
      "project_id": 1,
      "from_user_id": 1,
      "to_user_id": 4,
      "message": "Revisi slide 3, tolong ganti warna background kontras.",
      "is_resolved": false,
      "created_at": "2026-05-30T02:40:00.000000Z",
      "updated_at": "2026-05-30T02:40:00.000000Z",
      "project": {
        "id": 1,
        "name": "Kempen Ramadan 2026"
      },
      "from_user": {
        "id": 1,
        "name": "Super Admin",
        "role": { "id": 1, "name": "admin" }
      },
      "to_user": {
        "id": 4,
        "name": "Rian Kreatif",
        "role": { "id": 2, "name": "worker" }
      }
    }
  ]
  ```

#### 🔹 Kirim Feedback Baru
* **HTTP Method**: `POST`
* **Path**: `/feedbacks`
* **Auth Wajib**: Ya
* **Rule Validasi**: Pengirim (sender) dan penerima (receiver) harus terdaftar di dalam proyek yang sama (apabila salah satu atau keduanya adalah worker).
* **Body Request** (`application/json`):
  ```json
  {
    "project_id": 1,
    "to_user_id": 4,
    "message": "Revisi slide 3, tolong ganti warna background kontras."
  }
  ```
* **Response Sukses (201 Created)**:
  ```json
  {
    "message": "Feedback berhasil dikirim.",
    "feedback": {
      "id": 5,
      "project_id": 1,
      "from_user_id": 1,
      "to_user_id": 4,
      "message": "Revisi slide 3, tolong ganti warna background kontras.",
      "is_resolved": false,
      "created_at": "2026-05-30T02:40:00.000000Z",
      "updated_at": "2026-05-30T02:40:00.000000Z"
    }
  }
  ```

#### 🔹 Tandai Feedback Selesai (Resolve Feedback)
Tandai revisi/feedback sebagai selesai ditindaklanjuti.
* **HTTP Method**: `PUT`
* **Path**: `/feedbacks/{id}/resolve`
* **Auth Wajib**: Ya
* **Behavior**: Hanya Admin atau Penerima feedback (`to_user_id`) yang dapat menandainya sebagai selesai.
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "Feedback berhasil ditandai selesai.",
    "feedback": {
      "id": 5,
      "is_resolved": true,
      ...
    }
  }
  ```

---

### 8. Modul User & Worker Management (Admin Only)

#### 🔹 Dapatkan List Seluruh User
* **HTTP Method**: `GET`
* **Path**: `/users`
* **Auth Wajib**: Ya (Admin Only)
* **Query Parameters**:
  * `role` (optional): Filter nama role (`admin` atau `worker`)
  * `is_active` (optional): `true` (aktif) atau `false` (non-aktif)
* **Response Sukses (200 OK)**:
  ```json
  [
    {
      "id": 4,
      "role_id": 2,
      "name": "Rian Kreatif",
      "email": "rian@example.com",
      "is_active": true,
      "created_at": "2026-05-30T01:00:00.000000Z",
      "role": {
        "id": 2,
        "name": "worker"
      }
    }
  ]
  ```

#### 🔹 Update Informasi & Status User
* **HTTP Method**: `PUT`
* **Path**: `/users/{id}`
* **Auth Wajib**: Ya (Admin Only)
* **Body Request** (`application/json`):
  ```json
  {
    "name": "Rian Kreatif Edit",
    "email": "rian.new@example.com",
    "role_id": 2,
    "is_active": false
  }
  ```
  *(Catatan: Admin tidak diperbolehkan menonaktifkan akun miliknya sendiri atau mengubah role miliknya sendiri demi menghindari lockout).*
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "User berhasil diperbarui.",
    "user": {
      "id": 4,
      "role_id": 2,
      "name": "Rian Kreatif Edit",
      "email": "rian.new@example.com",
      "is_active": false,
      "role": {
        "id": 2,
        "name": "worker"
      }
    }
  }
  ```

#### 🔹 Soft-Delete User (Disable)
Melakukan soft delete untuk menonaktifkan user tanpa menghancurkan data relasi lama.
* **HTTP Method**: `DELETE`
* **Path**: `/users/{id}`
* **Auth Wajib**: Ya (Admin Only)
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "User berhasil dinonaktifkan (dihapus secara halus)."
  }
  ```

#### 🔹 List Seluruh Worker Aktif (Helper Endpoint)
Digunakan oleh Admin untuk memuat dropdown pilihan Worker ketika meng-assign tugas atau proyek.
* **HTTP Method**: `GET`
* **Path**: `/workers`
* **Auth Wajib**: Ya (Admin Only)
* **Response Sukses (200 OK)**:
  ```json
  [
    {
      "id": 4,
      "name": "Rian Kreatif",
      "email": "rian@example.com",
      "role_id": 2,
      "is_active": true
    }
  ]
  ```

---

### 9. Modul Audit Trail / Logs (Admin Only)

#### 🔹 Dapatkan Daftar Logs Aktivitas
Memantau tindakan penting seperti pembuatan proyek, unggahan invoice, perubahan status, dll.
* **HTTP Method**: `GET`
* **Path**: `/logs`
* **Auth Wajib**: Ya (Admin Only)
* **Query Parameters**:
  * `action` (optional): Filter jenis aksi (contoh: `task.updated`, `project.created`, `invoice.pdf_uploaded`)
  * `user_id` (optional): Filter ID pelaku aksi
  * `per_page` (optional): Jumlah baris per halaman (default: `20`)
* **Response Sukses (200 OK - Paginated)**:
  ```json
  {
    "current_page": 1,
    "data": [
      {
        "id": 89,
        "user_id": 4,
        "action": "task.updated",
        "entity_type": "App\\Models\\Task",
        "entity_id": 15,
        "old_values": {
          "status": "not_started",
          "progress_percentage": 0
        },
        "new_values": {
          "status": "in_progress",
          "progress_percentage": 50
        },
        "ip_address": "127.0.0.1",
        "user_agent": "Mozilla/5.0 ...",
        "created_at": "2026-05-30T01:15:30.000000Z",
        "user": {
          "id": 4,
          "name": "Rian Kreatif"
        }
      }
    ],
    "first_page_url": "http://localhost:8000/api/logs?page=1",
    "from": 1,
    "last_page": 5,
    "last_page_url": "http://localhost:8000/api/logs?page=5",
    "next_page_url": "http://localhost:8000/api/logs?page=2",
    "path": "http://localhost:8000/api/logs",
    "per_page": 20,
    "prev_page_url": null,
    "to": 20,
    "total": 100
  }
  ```

---

## 💡 Panduan Integrasi bagi Frontend Developer

### 1. Penanganan State & Toko Kredensial (Zustand)
Gunakan state management seperti **Zustand** untuk menyimpan state otentikasi (`access_token` dan detail `user`). Simpan token di `localStorage` atau cookie agar persist saat halaman direfresh.
```javascript
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  }
}));
```

### 2. Konfigurasi HTTP Client & Interceptor (Axios)
Setup instansi Axios terpusat untuk menyisipkan Bearer token secara otomatis di setiap request.
```javascript
import axios from 'axios';
import { useAuthStore } from './authStore';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Request Interceptor: Tempelkan Token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Tangani 401 & Hapus State
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 3. Mengunggah File Lampiran (Multipart Form Data)
Ketika mengunggah media pengerjaan pada tugas, gunakan `FormData` dan ubah header `Content-Type` menjadi `multipart/form-data`.
```javascript
const uploadAttachment = async (taskId, fileObject) => {
  const formData = new FormData();
  formData.append('task_id', taskId);
  formData.append('file', fileObject);

  const response = await apiClient.post('/attachments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
```
