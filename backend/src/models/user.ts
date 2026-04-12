export interface Client {
  id: string; // UUID
  email: string;
  password_hash: string;
  full_name: string;
  contact_number?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface Admin {
  id: string; // UUID
  email: string;
  password_hash: string;
  full_name: string;
  contact_number?: string;
  municipality_id?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface SuperAdmin {
  id: string; // UUID
  email: string;
  password_hash: string;
  full_name: string;
  contact_number?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkforceOfficer {
  id: string; // UUID
  employee_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  contact_number?: string;
  department_id?: string;
  role?: string;
  work_location?: string;
  shift_schedule?: string;
  supervisor_id?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}
