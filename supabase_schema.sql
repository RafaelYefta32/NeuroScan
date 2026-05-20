-- ==============================================================================
-- SCHEMA DATABASE NEUROSCAN UNTUK SUPABASE
-- ==============================================================================
-- Catatan:
-- 1. Skema ini mengasumsikan Anda menggunakan Supabase Auth (auth.users).
-- 2. Tabel user menggunakan nama 'users',
--    dan password serta email tidak disimpan di sini karena dikelola Supabase.
-- 3. Tabel Reports telah digabung ke tabel classification_results untuk efisiensi.
-- 4. Menggunakan snake_case untuk kompatibilitas optimal dengan PostgreSQL.
-- ==============================================================================

-- 1. Buat Tabel roles
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Masukkan role default (bisa disesuaikan)
INSERT INTO public.roles (name) VALUES ('admin'), ('user');


-- 2. Buat Tabel users (Perpanjangan dari auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id INT REFERENCES public.roles(id) ON DELETE SET NULL,
    fullname TEXT,
    institution TEXT,
    profession TEXT,
    profile_image TEXT,
    status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Aktifkan Row Level Security (RLS) untuk users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy dasar: Semua orang (yang login) bisa melihat profil
CREATE POLICY "Profil bisa dilihat oleh siapa saja" 
  ON public.users FOR SELECT USING (true);

-- Policy dasar: User hanya bisa mengupdate profilnya sendiri
CREATE POLICY "User bisa mengupdate profilnya sendiri" 
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policy dasar: User bisa memasukkan profilnya sendiri saat register
CREATE POLICY "User bisa memasukkan profilnya sendiri" 
  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Fungsi trigger untuk update kolom updated_at secara otomatis
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();


-- 3. Buat Tabel models
CREATE TABLE public.models (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    file_path TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Model bisa dilihat oleh siapa saja" ON public.models FOR SELECT USING (true);
-- (Catatan: Anda mungkin perlu menambahkan policy agar hanya Admin yang bisa INSERT/UPDATE/DELETE)


-- 4. Buat Tabel classification_results (Sudah termasuk kolom dari tabel Reports)
CREATE TABLE public.classification_results (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    model_id INT REFERENCES public.models(id) ON DELETE SET NULL,
    image_mri TEXT NOT NULL,
    predicted_class VARCHAR(50) NOT NULL,
    confidence_score REAL NOT NULL, -- REAL sama dengan FLOAT4
    explanation TEXT,
    report_file_path TEXT, -- Dari relasi tabel Reports sebelumnya
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.classification_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User hanya bisa melihat hasil klasifikasinya sendiri" 
  ON public.classification_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User bisa menyimpan hasil klasifikasinya sendiri" 
  ON public.classification_results FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 5. Buat Tabel activity_logs
CREATE TABLE public.activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    activity VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User hanya bisa melihat log aktivitasnya sendiri" 
  ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User bisa menyimpan log aktivitasnya sendiri" 
  ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
