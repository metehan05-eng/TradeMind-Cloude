-- Supabase Migration: Init TradeMind AI Tables

-- 1. business_finance
CREATE TABLE IF NOT EXISTS public.business_finance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    revenue NUMERIC(15, 2) NOT NULL DEFAULT 0,
    expenses NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax_debt NUMERIC(15, 2) NOT NULL DEFAULT 0,
    investment_budget NUMERIC(15, 2) NOT NULL DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. inventory_management
CREATE TABLE IF NOT EXISTS public.inventory_management (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    lead_time_days INTEGER NOT NULL DEFAULT 0,
    warehouse_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ecommerce_trends
CREATE TABLE IF NOT EXISTS public.ecommerce_trends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform VARCHAR(50) NOT NULL, -- e.g., 'Amazon', 'TikTok'
    product_name VARCHAR(255) NOT NULL,
    trend_score NUMERIC(5, 2),
    competitor_price NUMERIC(10, 2),
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. legal_docs
CREATE TABLE IF NOT EXISTS public.legal_docs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_type VARCHAR(100) NOT NULL, -- e.g., 'contract', 'customs_declaration'
    title VARCHAR(255) NOT NULL,
    content TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. market_intelligence
CREATE TABLE IF NOT EXISTS public.market_intelligence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_type VARCHAR(100) NOT NULL, -- e.g., 'stock', 'commodity', 'ship_location'
    asset_name VARCHAR(255) NOT NULL,
    current_value JSONB, -- Flexible structure for prices or coordinates
    description TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update modified timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating `updated_at`
CREATE TRIGGER update_business_finance_modtime BEFORE UPDATE ON public.business_finance FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_inventory_management_modtime BEFORE UPDATE ON public.inventory_management FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_ecommerce_trends_modtime BEFORE UPDATE ON public.ecommerce_trends FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_legal_docs_modtime BEFORE UPDATE ON public.legal_docs FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_market_intelligence_modtime BEFORE UPDATE ON public.market_intelligence FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Optional: Enable Row Level Security (RLS) on all tables (Assuming authenticated users will access)
ALTER TABLE public.business_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_intelligence ENABLE ROW LEVEL SECURITY;
