
-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;
DROP TABLE IF EXISTS work_order_comments CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS inspection_results CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS checklists CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'account_manager', 'supervisor', 'janitor', 'customer')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'CA',
  zip TEXT NOT NULL,
  customer_id UUID REFERENCES profiles(id),
  account_manager_id UUID REFERENCES profiles(id),
  service_type TEXT, -- office, retail, healthcare, etc.
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklists table (templates)
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  is_template BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist items
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  category TEXT, -- restrooms, floors, common_areas, etc.
  requires_photo BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspections (QA walks)
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  checklist_id UUID REFERENCES checklists(id),
  inspector_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  notes TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspection results (individual checklist item results)
CREATE TABLE inspection_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES checklist_items(id),
  passed BOOLEAN,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  photo_url TEXT,
  created_issue BOOLEAN DEFAULT false, -- Did this create a work order?
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work orders
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'closed')),
  created_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  inspection_id UUID REFERENCES inspections(id), -- If created from inspection
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_photo_url TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work order comments (threaded communication)
CREATE TABLE work_order_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Surveys
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  customer_id UUID REFERENCES profiles(id),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  service_quality_rating INTEGER CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  comments TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey responses (for more detailed questions)
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL, -- janitor or supervisor
  shift_date DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT, -- work_order_assigned, inspection_completed, etc.
  reference_id UUID, -- ID of related record
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Locations: customers see their own, staff see all
CREATE POLICY "Customers can view their locations" ON locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'customer' AND customer_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager', 'supervisor', 'janitor'))
);
CREATE POLICY "Staff can manage locations" ON locations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager'))
);

-- Checklists: staff can view/edit, customers cannot
CREATE POLICY "Staff can view checklists" ON checklists FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager', 'supervisor', 'janitor'))
);
CREATE POLICY "Supervisors and admins can manage checklists" ON checklists FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
);

-- Checklist items: same as checklists
CREATE POLICY "Staff can view checklist items" ON checklist_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager', 'supervisor', 'janitor'))
);
CREATE POLICY "Supervisors and admins can manage items" ON checklist_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
);

-- Inspections: staff can view all, customers can view their location's inspections
CREATE POLICY "Staff can view all inspections" ON inspections FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager', 'supervisor', 'janitor'))
);
CREATE POLICY "Customers can view their inspections" ON inspections FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM locations l
    JOIN profiles p ON p.id = auth.uid()
    WHERE l.id = inspections.location_id AND l.customer_id = auth.uid() AND p.role = 'customer'
  )
);
CREATE POLICY "Supervisors can create inspections" ON inspections FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
);
CREATE POLICY "Inspectors can update their inspections" ON inspections FOR UPDATE USING (
  inspector_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Inspection results: same visibility as inspections
CREATE POLICY "Staff can view inspection results" ON inspection_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager', 'supervisor', 'janitor'))
);
CREATE POLICY "Customers can view their inspection results" ON inspection_results FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM inspections i
    JOIN locations l ON l.id = i.location_id
    WHERE i.id = inspection_results.inspection_id AND l.customer_id = auth.uid()
  )
);
CREATE POLICY "Supervisors can manage inspection results" ON inspection_results FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
);

-- Work orders: all roles can view relevant ones, staff can manage
CREATE POLICY "Staff can view all work orders" ON work_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager', 'supervisor', 'janitor'))
);
CREATE POLICY "Customers can view their work orders" ON work_orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM locations l
    WHERE l.id = work_orders.location_id AND l.customer_id = auth.uid()
  )
);
CREATE POLICY "Customers can create work orders" ON work_orders FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM locations l
    WHERE l.id = work_orders.location_id AND l.customer_id = auth.uid()
  )
);
CREATE POLICY "Staff can create work orders" ON work_orders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager', 'supervisor'))
);
CREATE POLICY "Staff can update work orders" ON work_orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager', 'supervisor'))
  OR assigned_to = auth.uid()
);

-- Work order comments: can view and comment on accessible work orders
CREATE POLICY "Users can view comments on accessible work orders" ON work_order_comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM work_orders wo
    JOIN locations l ON l.id = wo.location_id
    WHERE wo.id = work_order_comments.work_order_id
    AND (
      l.customer_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager', 'supervisor', 'janitor'))
    )
  )
);
CREATE POLICY "Users can create comments on accessible work orders" ON work_order_comments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM work_orders wo
    JOIN locations l ON l.id = wo.location_id
    WHERE wo.id = work_order_comments.work_order_id
    AND (
      l.customer_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager', 'supervisor', 'janitor'))
    )
  )
);

-- Surveys: customers and staff can view, customers can create
CREATE POLICY "Users can view surveys for their locations" ON surveys FOR SELECT USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM locations l
    WHERE l.id = surveys.location_id AND l.customer_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager', 'supervisor'))
);
CREATE POLICY "Customers can create surveys" ON surveys FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM locations l
    WHERE l.id = surveys.location_id AND l.customer_id = auth.uid()
  )
);

-- Survey responses: same as surveys
CREATE POLICY "Users can view survey responses" ON survey_responses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM surveys s
    JOIN locations l ON l.id = s.location_id
    WHERE s.id = survey_responses.survey_id
    AND (
      l.customer_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager', 'supervisor'))
    )
  )
);
CREATE POLICY "Users can create survey responses" ON survey_responses FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM surveys s
    JOIN locations l ON l.id = s.location_id
    WHERE s.id = survey_responses.survey_id AND l.customer_id = auth.uid()
  )
);

-- Schedules: users can view their own, staff can view all
CREATE POLICY "Users can view their schedules" ON schedules FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'account_manager', 'supervisor'))
);
CREATE POLICY "Supervisors can manage schedules" ON schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
);

-- Notifications: users can view their own
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_locations_customer ON locations(customer_id);
CREATE INDEX idx_inspections_location ON inspections(location_id);
CREATE INDEX idx_inspections_inspector ON inspections(inspector_id);
CREATE INDEX idx_work_orders_location ON work_orders(location_id);
CREATE INDEX idx_work_orders_assigned ON work_orders(assigned_to);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_schedules_user ON schedules(user_id);
CREATE INDEX idx_schedules_date ON schedules(shift_date);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
  