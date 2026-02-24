# Trinity QA App - Setup Checklist

## ✅ Phase 1: Database Setup (REQUIRED)

### 1.1 Execute Database Schema
- [ ] Go to https://supabase.com/dashboard/project/fzmhqcgzvgtvkswpwruc/editor
- [ ] Open `schema.sql` file in this directory
- [ ] Copy entire contents
- [ ] Paste into Supabase SQL Editor
- [ ] Click "RUN" to execute
- [ ] Verify no errors

### 1.2 Verify Tables Created
Navigate to https://supabase.com/dashboard/project/fzmhqcgzvgtvkswpwruc/editor

Tables should exist:
- [ ] profiles
- [ ] locations
- [ ] checklists
- [ ] checklist_items
- [ ] inspections
- [ ] inspection_results
- [ ] work_orders
- [ ] work_order_comments
- [ ] surveys
- [ ] survey_responses
- [ ] schedules
- [ ] notifications

### 1.3 Verify RLS Policies
Check Table Editor → (select any table) → Policies tab
- [ ] Each table should have multiple RLS policies
- [ ] Policies should reference different roles

## ✅ Phase 2: Create Test Users

### 2.1 Create Auth Users in Supabase
Go to https://supabase.com/dashboard/project/fzmhqcgzvgtvkswpwruc/auth/users

Create these test users (click "Add User" → Email/Password):

1. **Admin User**
   - Email: `admin@trinity.test`
   - Password: `Trinity2024!`
   - [ ] Created

2. **Account Manager**
   - Email: `manager@trinity.test`
   - Password: `Trinity2024!`
   - [ ] Created

3. **Supervisor**
   - Email: `supervisor@trinity.test`
   - Password: `Trinity2024!`
   - [ ] Created

4. **Janitor**
   - Email: `janitor@trinity.test`
   - Password: `Trinity2024!`
   - [ ] Created

5. **Customer**
   - Email: `customer@trinity.test`
   - Password: `Trinity2024!`
   - [ ] Created

### 2.2 Add Profile Records

After creating auth users, you need to add their profiles to the `profiles` table.

**Important:** Get the UUID for each user from the Auth Users page, then run this SQL:

```sql
-- Get user IDs first by running:
SELECT id, email FROM auth.users;

-- Then insert profiles (replace UUIDs with actual IDs from above):
INSERT INTO profiles (id, email, full_name, role) VALUES
  ('USER_ID_1', 'admin@trinity.test', 'Admin User', 'admin'),
  ('USER_ID_2', 'manager@trinity.test', 'Account Manager', 'account_manager'),
  ('USER_ID_3', 'supervisor@trinity.test', 'John Supervisor', 'supervisor'),
  ('USER_ID_4', 'janitor@trinity.test', 'Mike Janitor', 'janitor'),
  ('USER_ID_5', 'customer@trinity.test', 'ABC Corporation', 'customer');
```

- [ ] Profile records created for all test users

## ✅ Phase 3: Add Test Data

### 3.1 Create Sample Location

```sql
-- First, get the customer user ID:
SELECT id FROM profiles WHERE role = 'customer' LIMIT 1;

-- Then create a location (replace CUSTOMER_ID):
INSERT INTO locations (name, address, city, state, zip, customer_id, service_type, is_active)
VALUES 
  ('Downtown Office Building', '123 Market Street', 'San Francisco', 'CA', '94103', 'CUSTOMER_ID', 'office', true);
```

- [ ] Sample location created

### 3.2 Create Sample Work Order

```sql
-- Get location ID:
SELECT id FROM locations LIMIT 1;

-- Get admin user ID (for created_by):
SELECT id FROM profiles WHERE role = 'admin' LIMIT 1;

-- Create work order (replace IDs):
INSERT INTO work_orders (location_id, title, description, priority, status, created_by)
VALUES 
  ('LOCATION_ID', 'Restroom deep cleaning needed', 'Third floor restrooms need thorough cleaning and restocking', 'medium', 'open', 'ADMIN_ID');
```

- [ ] Sample work order created

## ✅ Phase 4: Test Application

### 4.1 Access the App
- [ ] Visit https://trinity-qa.adam-harris.alphaclaw.app
- [ ] Login page loads correctly
- [ ] Trinity branding visible (navy/blue colors)

### 4.2 Test Each Role

**Admin User** (`admin@trinity.test` / `Trinity2024!`)
- [ ] Can log in successfully
- [ ] Dashboard shows stats
- [ ] Can see all navigation items
- [ ] Can access Users page
- [ ] Can create work orders
- [ ] Can manage locations

**Account Manager** (`manager@trinity.test` / `Trinity2024!`)
- [ ] Can log in
- [ ] Can see work orders
- [ ] Can see surveys
- [ ] Can manage locations
- [ ] Cannot see Users page

**Supervisor** (`supervisor@trinity.test` / `Trinity2024!`)
- [ ] Can log in
- [ ] Can create inspections
- [ ] Can manage work orders
- [ ] Can create schedules
- [ ] Cannot see Users page

**Janitor** (`janitor@trinity.test` / `Trinity2024!`)
- [ ] Can log in
- [ ] Can see assigned work orders
- [ ] Can view schedule
- [ ] Can update work order status
- [ ] Cannot create locations

**Customer** (`customer@trinity.test` / `Trinity2024!`)
- [ ] Can log in
- [ ] Sees only their locations
- [ ] Can create work orders
- [ ] Can submit surveys
- [ ] Cannot see staff management features

### 4.3 Test Key Features

**Work Orders**
- [ ] Create new work order
- [ ] View work order details
- [ ] Add comment to work order
- [ ] Update work order status
- [ ] Filter work orders by status

**Inspections**
- [ ] Create new inspection (as supervisor)
- [ ] View inspection list
- [ ] See inspection details

**Surveys**
- [ ] Submit survey (as customer)
- [ ] View survey results
- [ ] See average ratings

**Schedule**
- [ ] Create schedule entry (as supervisor)
- [ ] View calendar
- [ ] See upcoming shifts

**Locations**
- [ ] Create location (as admin)
- [ ] View location list
- [ ] Edit location

## ✅ Phase 5: Production Readiness

### 5.1 Security
- [ ] All RLS policies active
- [ ] Service role key stored securely (env vars only)
- [ ] Anon key visible in frontend (expected)
- [ ] No console errors related to auth

### 5.2 Storage Setup
- [ ] Create Supabase storage bucket named `trinity-qa`
- [ ] Set bucket to private
- [ ] Configure RLS for storage (users can upload/view their own files)

```sql
-- Storage policies (run in SQL Editor):
INSERT INTO storage.buckets (id, name, public)
VALUES ('trinity-qa', 'trinity-qa', false);

-- Policy: Users can upload files
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'trinity-qa');

-- Policy: Users can view files they have access to
CREATE POLICY "Users can view accessible files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'trinity-qa');
```

- [ ] Storage bucket created
- [ ] Storage policies configured

### 5.3 Final Checks
- [ ] App loads without errors
- [ ] All views render correctly
- [ ] Mobile responsive (test on phone)
- [ ] Photos can be uploaded
- [ ] Comments work
- [ ] Notifications appear
- [ ] Logout works

## 🎉 Launch

Once all checkboxes are marked:
- [ ] App is ready for production use
- [ ] Share URL with client: https://trinity-qa.adam-harris.alphaclaw.app
- [ ] Provide client with admin credentials
- [ ] Walk through features with client

## 📝 Notes

**Environment Variables (Already Configured):**
- TRINITY_SUPABASE_ANON_KEY ✓
- TRINITY_SUPABASE_SERVICE_ROLE_KEY ✓
- TRINITY_SUPABASE_PROJECT_ID ✓

**Known Limitations:**
- Email notifications require additional SMTP setup
- Photo uploads require storage bucket configuration
- Real users need to be created via Supabase Auth UI

**Next Steps After Launch:**
1. Create real user accounts for Trinity staff
2. Import real location data
3. Configure email notifications (optional)
4. Set up backup schedule
5. Monitor usage and performance

---

**Project Status:** Ready for Phase 1 (Database Setup)  
**Last Updated:** February 23, 2026
