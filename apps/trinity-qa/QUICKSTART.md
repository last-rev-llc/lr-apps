# Trinity QA App - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Setup Database (2 minutes)

1. **Open Supabase SQL Editor:**
   https://supabase.com/dashboard/project/fzmhqcgzvgtvkswpwruc/editor

2. **Run the schema:**
   - Copy contents of `schema.sql`
   - Paste into SQL Editor
   - Click RUN
   - Wait for "Success" message

### Step 2: Create Test User (2 minutes)

1. **Create auth user:**
   - Go to https://supabase.com/dashboard/project/fzmhqcgzvgtvkswpwruc/auth/users
   - Click "Add User"
   - Email: `admin@trinity.test`
   - Password: `Trinity2024!`
   - Click "Create"

2. **Add profile record:**
   - Go back to SQL Editor
   - Run this query (replace USER_ID with the UUID from auth users page):
   
   ```sql
   -- Get the user ID first:
   SELECT id, email FROM auth.users WHERE email = 'admin@trinity.test';
   
   -- Then insert profile (replace YOUR_USER_ID):
   INSERT INTO profiles (id, email, full_name, role) 
   VALUES ('YOUR_USER_ID', 'admin@trinity.test', 'Trinity Admin', 'admin');
   ```

### Step 3: Access the App (1 minute)

1. **Open the app:**
   https://trinity-qa.adam-harris.alphaclaw.app

2. **Log in:**
   - Email: `admin@trinity.test`
   - Password: `Trinity2024!`

3. **Explore:**
   - Dashboard shows overview
   - Create a work order
   - View all sections

## 🎯 What You Can Do

### As Admin:
- ✅ Create and manage users
- ✅ Add locations
- ✅ Create work orders
- ✅ View inspections
- ✅ See surveys
- ✅ Manage schedules

## 📚 Next Steps

1. **Add more users** with different roles:
   - Account Manager
   - Supervisor
   - Janitor
   - Customer

2. **Add real locations:**
   - Go to Locations page
   - Click "+ Add Location"
   - Fill in details

3. **Create test work order:**
   - Go to Work Orders
   - Click "+ Create Work Order"
   - Fill in details

4. **Review full setup:**
   - See `SETUP-CHECKLIST.md` for complete walkthrough
   - See `README.md` for detailed documentation

## ❓ Troubleshooting

**Can't log in?**
- Check that profile record was created in `profiles` table
- Verify email/password are correct
- Check browser console for errors

**Tables don't exist?**
- Re-run `schema.sql` in Supabase SQL Editor
- Check for error messages

**Nothing shows up?**
- RLS policies may be blocking access
- Verify user has correct role in profiles table
- Check Supabase logs

## 🆘 Need Help?

1. Check `README.md` for detailed info
2. Review `SETUP-CHECKLIST.md` for step-by-step
3. Look at browser console for errors
4. Check Supabase logs in dashboard

## 🎉 You're Ready!

Once logged in, you have a fully functional QA management system for Trinity Building Services.

**Features:**
- 📊 Dashboard with metrics
- ✓ QA Inspections
- 🔧 Work Order Management
- ⭐ Customer Surveys
- 📅 Staff Scheduling
- 📍 Location Management
- 👥 User Management (admin only)

---

**Built for:** Trinity Building Services  
**Project Value:** $10,000  
**Status:** Production Ready
