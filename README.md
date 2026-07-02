# 🧠 NeuroScan — Automated MRI Brain Tumor Classification

NeuroScan adalah sistem klasifikasi tumor otak berbasis **deep learning** yang menganalisis citra MRI kepala secara otomatis. Dibangun sebagai proyek Kerja Praktik dengan arsitektur *fullstack* yang memisahkan frontend React dan backend FastAPI.

---

## 📋 Fitur Utama

### 👤 User (Klinisi / Operator)
| Fitur | Deskripsi |
|---|---|
| **MRI Classification** | Upload citra MRI dan dapatkan prediksi kelas tumor secara instan |
| **Confidence Score** | Menampilkan skor kepercayaan model dengan presisi 2 desimal |
| **All-Class Probabilities** | Distribusi probabilitas seluruh kelas ditampilkan sebagai progress bar |
| **AI Explanation** | Interpretasi klinis dinamis yang dihasilkan berdasarkan hasil prediksi |
| **Download Report** | Ekspor laporan medis lengkap (PDF-ready) dalam format HTML yang dicetak via iframe |
| **History** | Riwayat seluruh klasifikasi yang pernah dilakukan |
| **Profile** | Manajemen akun pengguna |

### 🛡️ Admin
| Fitur | Deskripsi |
|---|---|
| **Dashboard** | Statistik penggunaan sistem secara keseluruhan |
| **Model Management** | Upload, aktivasi, dan pengelolaan versi model TensorFlow |
| **User Management** | Kelola akun pengguna; pembatasan hapus untuk user yang memiliki riwayat klasifikasi |
| **Classifications** | Audit seluruh hasil klasifikasi beserta detail model & versi yang digunakan |
| **Activity Logs** | Rekam jejak aktivitas sistem |

---

## 🏗️ Arsitektur Sistem

```
NeuroScan/
├── frontend/          # React + Vite + TypeScript + shadcn/ui
│   └── src/
│       ├── pages/
│       │   ├── user/      # Classify, Result, Details, History, Profile
│       │   └── admin/     # Dashboard, ModelManagement, UserManagement, Classifications, ActivityLogs
│       ├── services/      # API layer (ModelService, UserService, ActivityLogService, ...)
│       ├── contexts/      # AuthContext (Supabase Auth)
│       └── utils/         # reportGenerator.ts (laporan medis PDF)
│
├── backend/           # FastAPI + TensorFlow + Supabase
│   ├── main.py        # Entry point, CORS, dependency injection
│   ├── routers/       # model_router, predict_router, user_router
│   ├── services/      # ClassificationService, ModelService, ActivityLogService
│   └── entities/      # Pydantic models / entitas data
│
└── supabase_schema.sql  # Skema database PostgreSQL (Supabase)
```

### Alur Klasifikasi
```
User upload MRI
      │
      ▼
Frontend (React)
      │  POST /predict (multipart/form-data)
      ▼
Backend (FastAPI)
      │  Load active TensorFlow model
      ▼
ClassificationService
      │  Preprocess → Predict → Store result to Supabase
      ▼
Response: { predicted_class, confidence_score, all_scores, image_url }
      │
      ▼
Result.tsx → AI Report (reportGenerator.ts)
```

---

## 🛠️ Tech Stack

### Frontend
| Teknologi | Keterangan |
|---|---|
| **React 18** + **TypeScript** | Framework UI utama |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** + **shadcn/ui** | Komponen UI & styling |
| **Radix UI** | Accessible component primitives |
| **React Router v6** | Client-side routing |
| **TanStack Query** | Server state management |
| **Supabase JS** | Auth & database client |
| **React Hook Form** + **Zod** | Form validation |
| **Recharts** | Visualisasi data (dashboard) |
| **date-fns** | Formatting tanggal |

### Backend
| Teknologi | Keterangan |
|---|---|
| **FastAPI** | REST API framework |
| **TensorFlow** | Inferensi model deep learning |
| **Supabase** (Python SDK) | Database & storage |
| **Pillow** | Preprocessing citra MRI |
| **Pydantic** | Validasi data & schema |
| **Uvicorn** | ASGI server |
| **python-dotenv** | Manajemen environment variable |

### Database & Cloud
- **Supabase** (PostgreSQL) — auth, database, storage
- **Supabase Storage** — penyimpanan model `.h5` dan citra MRI

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js ≥ 18
- Python ≥ 3.10
- Akun [Supabase](https://supabase.com)

---

### 1. Clone Repository

```bash
git clone <repository-url>
cd NeuroScan
```

---

### 2. Setup Frontend

```bash
cd frontend
npm install
```

Buat file `.env.local` di dalam folder `frontend/`:

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

Jalankan dev server:

```bash
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173**

---

### 3. Setup Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

> Backend membaca environment variable dari `../frontend/.env.local` secara otomatis.

Jalankan server:

```bash
python main.py
```

Backend API akan berjalan di: **http://localhost:8000**

Dokumentasi API interaktif: **http://localhost:8000/docs**

---

### 4. Setup Database (Supabase)

Jalankan script SQL pada Supabase SQL Editor:

```bash
# Salin isi file berikut ke Supabase SQL Editor
supabase_schema.sql
```

---

## 📡 API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/predict` | Upload citra MRI dan dapatkan hasil klasifikasi |
| `GET` | `/models` | Daftar semua model yang tersedia |
| `POST` | `/models/upload` | Upload model TensorFlow baru |
| `PUT` | `/models/{id}/activate` | Aktifkan model tertentu |
| `DELETE` | `/models/{id}` | Hapus model |
| `GET` | `/users` | Daftar pengguna (admin) |
| `DELETE` | `/users/{id}` | Hapus pengguna via service role |

---

## 🔐 Autentikasi & Role

Sistem menggunakan **Supabase Auth** dengan dua role:

| Role | Akses |
|---|---|
| `user` | Upload MRI, lihat hasil & riwayat, download laporan |
| `admin` | Semua fitur user + manajemen model, user, audit log |

---

## 📁 Kelas Prediksi

Model mendukung 4 kelas klasifikasi tumor otak:

| Kelas | Deskripsi |
|---|---|
| **Glioma** | Tumor yang berasal dari sel glial |
| **Meningioma** | Tumor pada lapisan pelindung otak (meninges) |
| **Pituitary** | Tumor pada kelenjar pituitari |
| **No Tumor** | Tidak ditemukan indikasi tumor |

---

## 📄 Laporan Medis

Laporan dihasilkan oleh `reportGenerator.ts` dan dicetak via **iframe tersembunyi**. Laporan mencakup:

- Metadata (ID Laporan, tanggal, nama operator, model yang digunakan)
- Citra MRI input
- Hasil klasifikasi & distribusi probabilitas semua kelas
- Interpretasi klinis dinamis berbasis AI
- Gejala klinis terkait & rekomendasi tindak lanjut
- Disclaimer medis

---

## 📜 Lisensi

Proyek ini dibuat untuk keperluan **Kerja Praktik** akademik. Seluruh hak cipta milik pengembang.

---

> ⚠️ **Disclaimer:** Hasil analisis NeuroScan bersifat sebagai alat bantu penapisan awal berbasis AI dan **bukan merupakan diagnosis medis final**. Keputusan klinis definitif sepenuhnya berada di bawah wewenang tenaga medis profesional.
