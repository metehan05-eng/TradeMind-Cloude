-- Supabase Migration: Super Admin & Kurumsal Müşteri Yönetimi

-- 1. corporate_applications (Şirket Başvuruları Veritabanı)
-- Hedef: Gelen tüm şirket başvuruları Super Admin (Yönetim) paneline düşecek, şirketler "onaylanmadan" sisteme giremeyecek.
CREATE TABLE IF NOT EXISTS public.corporate_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    tax_number VARCHAR(50) NOT NULL UNIQUE, -- Vergi Kimlik No / VKN
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    annual_revenue_bracket VARCHAR(100), -- Örn: "$500k - $2M"
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID -- Super Admin User ID
);

-- 2. admin_users (Super Admin Paneli Kullanıcıları)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'super_admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger: When application is approved, can automatically send webhook to create main tenant in ERP.
