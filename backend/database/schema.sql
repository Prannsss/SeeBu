-- schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Geographic Data
CREATE TABLE municipalities (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'cebu-city'
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE barangays (
    id VARCHAR(100) PRIMARY KEY, -- e.g., 'cebu-city-adlaon'
    municipality_id VARCHAR(50) REFERENCES municipalities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Roles (Separated as requested)
CREATE TABLE superadmins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Active', -- Active, Pending
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),
    municipality_id VARCHAR(50) REFERENCES municipalities(id),
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Workforce Management
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    municipality_id VARCHAR(50) REFERENCES municipalities(id) ON DELETE CASCADE,
    department_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workforce_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),
    department_id UUID REFERENCES departments(id),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workforce_officers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'WF-XXXX'
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    role VARCHAR(100), -- specific position
    work_location VARCHAR(255),
    shift_schedule VARCHAR(100),
    supervisor_id UUID, -- References workforce_admins(id) conceptually
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Authentication / Verification Codes
CREATE TABLE verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL, -- Associate by email or reference polymorphic if needed
    code VARCHAR(10) NOT NULL,
    type VARCHAR(20) DEFAULT 'email_verify', -- email_verify, password_reset, etc.
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- We use email rather than FK since users might be split across multiple tables.
    CONSTRAINT verification_tokens_email_type_idx UNIQUE (email, type) 
);

-- 4. Core Application Logic (Reports & Tasks)
CREATE TABLE reports (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'RPT-XXXX'
    reporter_id UUID REFERENCES clients(id) ON DELETE SET NULL, -- Null if anonymous
    issue_type VARCHAR(50) NOT NULL, -- infrastructure, sanitation, etc.
    other_type_specification VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    municipality_id VARCHAR(50) REFERENCES municipalities(id),
    barangay_id VARCHAR(100) REFERENCES barangays(id),
    location TEXT NOT NULL,
    landmark VARCHAR(255),
    urgency VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High
    status VARCHAR(50) DEFAULT 'In Review', -- In Review, Approved, Rejected, Delegated, In Progress, Action Taken, Resolved, Completed
    rejection_reason TEXT,
    completed_by UUID REFERENCES workforce_officers(id) ON DELETE SET NULL,
    reporter_name VARCHAR(100), -- Used if anonymous
    reporter_email VARCHAR(255),
    reporter_phone VARCHAR(20),
    is_anonymous BOOLEAN DEFAULT FALSE,
    delegated_to UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE report_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id VARCHAR(50) REFERENCES reports(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    is_completion_photo BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE report_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id VARCHAR(50) REFERENCES reports(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_by UUID, -- ID of admin or officer who updated
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'TSK-XXXX'
    title VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'Assigned', -- Assigned, Accepted, Delegated, In Progress, Completed
    assigned_to UUID REFERENCES workforce_officers(id) ON DELETE CASCADE,
    delegated_to UUID REFERENCES workforce_officers(id) ON DELETE SET NULL,
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    related_report_id VARCHAR(50) REFERENCES reports(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE task_proof_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id VARCHAR(50) REFERENCES tasks(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id VARCHAR(50) REFERENCES tasks(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed Data for Cebu City

INSERT INTO municipalities (id, name) VALUES ('cebu-city', 'Cebu City');

INSERT INTO barangays (id, municipality_id, name) VALUES
('cebu-city-adlaon', 'cebu-city', 'Adlaon'),
('cebu-city-agsungot', 'cebu-city', 'Agsungot'),
('cebu-city-apas', 'cebu-city', 'Apas'),
('cebu-city-babag', 'cebu-city', 'Babag'),
('cebu-city-bacayan', 'cebu-city', 'Bacayan'),
('cebu-city-banilad', 'cebu-city', 'Banilad'),
('cebu-city-basak-pardo', 'cebu-city', 'Basak Pardo'),
('cebu-city-basak-san-nicolas', 'cebu-city', 'Basak San Nicolas'),
('cebu-city-binaliw', 'cebu-city', 'Binaliw'),
('cebu-city-bonbon', 'cebu-city', 'Bonbon'),
('cebu-city-budlaan', 'cebu-city', 'Budlaan'),
('cebu-city-buhisan', 'cebu-city', 'Buhisan'),
('cebu-city-bulacao', 'cebu-city', 'Bulacao'),
('cebu-city-buot-taup-pardo', 'cebu-city', 'Buot-Taup Pardo'),
('cebu-city-busay', 'cebu-city', 'Busay'),
('cebu-city-calamba', 'cebu-city', 'Calamba'),
('cebu-city-cambinocot', 'cebu-city', 'Cambinocot'),
('cebu-city-capitol-site', 'cebu-city', 'Capitol Site'),
('cebu-city-carreta', 'cebu-city', 'Carreta'),
('cebu-city-central', 'cebu-city', 'Central'),
('cebu-city-cogon-pardo', 'cebu-city', 'Cogon Pardo'),
('cebu-city-cogon-ramos', 'cebu-city', 'Cogon Ramos'),
('cebu-city-day-as', 'cebu-city', 'Day-as'),
('cebu-city-duljo-fatima', 'cebu-city', 'Duljo Fatima'),
('cebu-city-ermita', 'cebu-city', 'Ermita'),
('cebu-city-guba', 'cebu-city', 'Guba'),
('cebu-city-guadalupe', 'cebu-city', 'Guadalupe'),
('cebu-city-hipodromo', 'cebu-city', 'Hipodromo'),
('cebu-city-inayawan', 'cebu-city', 'Inayawan'),
('cebu-city-kalubihan', 'cebu-city', 'Kalubihan'),
('cebu-city-kalunasan', 'cebu-city', 'Kalunasan'),
('cebu-city-kamagayan', 'cebu-city', 'Kamagayan'),
('cebu-city-kamputhaw', 'cebu-city', 'Kamputhaw'),
('cebu-city-kasambagan', 'cebu-city', 'Kasambagan'),
('cebu-city-kinasang-an-pardo', 'cebu-city', 'Kinasang-an Pardo'),
('cebu-city-labangon', 'cebu-city', 'Labangon'),
('cebu-city-lahug', 'cebu-city', 'Lahug'),
('cebu-city-lorega-san-miguel', 'cebu-city', 'Lorega San Miguel'),
('cebu-city-lusaran', 'cebu-city', 'Lusaran'),
('cebu-city-luz', 'cebu-city', 'Luz'),
('cebu-city-mabini', 'cebu-city', 'Mabini'),
('cebu-city-mabolo', 'cebu-city', 'Mabolo'),
('cebu-city-malubog', 'cebu-city', 'Malubog'),
('cebu-city-mambaling', 'cebu-city', 'Mambaling'),
('cebu-city-pahina-central', 'cebu-city', 'Pahina Central'),
('cebu-city-pahina-san-nicolas', 'cebu-city', 'Pahina San Nicolas'),
('cebu-city-pamutan', 'cebu-city', 'Pamutan'),
('cebu-city-pardo', 'cebu-city', 'Pardo'),
('cebu-city-pari-an', 'cebu-city', 'Pari-an'),
('cebu-city-paril', 'cebu-city', 'Paril'),
('cebu-city-pasil', 'cebu-city', 'Pasil'),
('cebu-city-pit-os', 'cebu-city', 'Pit-os'),
('cebu-city-poblacion-pardo', 'cebu-city', 'Poblacion Pardo'),
('cebu-city-pulangbato', 'cebu-city', 'Pulangbato'),
('cebu-city-pung-ol-sibugay', 'cebu-city', 'Pung-ol Sibugay'),
('cebu-city-punta-princesa', 'cebu-city', 'Punta Princesa'),
('cebu-city-quiot-pardo', 'cebu-city', 'Quiot Pardo'),
('cebu-city-sambag-i', 'cebu-city', 'Sambag I'),
('cebu-city-sambag-ii', 'cebu-city', 'Sambag II'),
('cebu-city-san-antonio', 'cebu-city', 'San Antonio'),
('cebu-city-san-jose', 'cebu-city', 'San Jose'),
('cebu-city-san-nicolas-central', 'cebu-city', 'San Nicolas Central'),
('cebu-city-san-nicolas-proper', 'cebu-city', 'San Nicolas Proper'),
('cebu-city-san-roque', 'cebu-city', 'San Roque'),
('cebu-city-santa-cruz', 'cebu-city', 'Santa Cruz'),
('cebu-city-sapangdaku', 'cebu-city', 'Sapangdaku'),
('cebu-city-sawang-calero', 'cebu-city', 'Sawang Calero'),
('cebu-city-sinsin', 'cebu-city', 'Sinsin'),
('cebu-city-sirao', 'cebu-city', 'Sirao'),
('cebu-city-suba-pasil', 'cebu-city', 'Suba Pasil'),
('cebu-city-sudlon-i', 'cebu-city', 'Sudlon I'),
('cebu-city-sudlon-ii', 'cebu-city', 'Sudlon II'),
('cebu-city-t-padilla', 'cebu-city', 'T. Padilla'),
('cebu-city-tabunan', 'cebu-city', 'Tabunan'),
('cebu-city-tagbao', 'cebu-city', 'Tagbao'),
('cebu-city-talamban', 'cebu-city', 'Talamban'),
('cebu-city-taptap', 'cebu-city', 'Taptap'),
('cebu-city-tejero', 'cebu-city', 'Tejero'),
('cebu-city-tinago', 'cebu-city', 'Tinago'),
('cebu-city-tisa', 'cebu-city', 'Tisa'),
('cebu-city-to-ong-pardo', 'cebu-city', 'To-ong Pardo'),
('cebu-city-zapatera', 'cebu-city', 'Zapatera');

-- 6. Default Seed Users --defpass--Testing@123

-- Client
INSERT INTO clients (email, password_hash, full_name, status) 
VALUES ('client@seebu.com', '$2a$10$3XwO2dIXp5bwcWr0Br9oyOVmF5yg7BeHFttp0vA.IKJEOYlnfVB6C', 'Default Client', 'Active'); --defpass--Testing@123

-- SuperAdmin
INSERT INTO superadmins (email, password_hash, full_name, status) 
VALUES ('spadmin@seebu.com', '$2a$10$3XwO2dIXp5bwcWr0Br9oyOVmF5yg7BeHFttp0vA.IKJEOYlnfVB6C', 'Default SuperAdmin', 'Active'); --defpass--Testing@123

-- Admin (Assigned to Cebu City)
INSERT INTO admins (email, password_hash, full_name, municipality_id, status) 
VALUES ('admin@seebu.com', '$2a$10$3XwO2dIXp5bwcWr0Br9oyOVmF5yg7BeHFttp0vA.IKJEOYlnfVB6C', 'Default Admin', 'cebu-city', 'Active'); --defpass--Testing@123

-- Insert a default department to associate workforce accounts to
INSERT INTO departments (id, name, municipality_id, department_email)
VALUES ('11111111-1111-1111-1111-111111111111', 'General Maintenance', 'cebu-city', 'maintenance@cebu-city.gov.ph')
ON CONFLICT DO NOTHING;

-- Workforce Admin
INSERT INTO workforce_admins (email, password_hash, full_name, department_id, status) 
VALUES ('wfadmin@ssebu.com', '$2a$10$3XwO2dIXp5bwcWr0Br9oyOVmF5yg7BeHFttp0vA.IKJEOYlnfVB6C', 'Default Workforce Admin', '11111111-1111-1111-1111-111111111111', 'Active'); --defpass--Testing@123

-- Workforce Officer
INSERT INTO workforce_officers (employee_id, email, password_hash, full_name, department_id, status) 
VALUES ('WF-0001', 'workforce@seebu.com', '$2a$10$3XwO2dIXp5bwcWr0Br9oyOVmF5yg7BeHFttp0vA.IKJEOYlnfVB6C', 'Default Workforce Officer', '11111111-1111-1111-1111-111111111111', 'Active'); --defpass--Testing@123
