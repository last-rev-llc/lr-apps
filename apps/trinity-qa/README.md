# Trinity Building Services - QA Portal

A professional Quality Assurance web application for Trinity Building Services, a janitorial company serving the San Francisco Bay Area since 1987.

## 🎯 Overview

This standalone QA portal provides comprehensive management tools for:
- **QA Walk Inspections** - Mobile-friendly checklists with photo capture
- **Work Order Management** - Full lifecycle tracking with photo verification
- **Customer Surveys** - Structured feedback and ratings
- **Scheduling** - Staff assignment and calendar management
- **Location Management** - Customer site tracking
- **Role-Based Access Control** - 5 user roles with appropriate permissions

## 👥 User Roles

1. **Admins** - Full system access, user management, configuration
2. **Account Managers** - Customer relationships, reporting, survey oversight
3. **Supervisors** - QA walks, work orders, team management, scheduling
4. **Janitors** - Task assignments, work order completion, schedule viewing
5. **Customers** - External portal for requests, work orders, and surveys

## 🚀 Deployment

**Live URL:** https://trinity-qa.adam-harris.alphaclaw.app

## 🗄️ Database Setup

### Prerequisites
- Supabase project: `fzmhqcgzvgtvkswpwruc`
- Environment variables configured in `~/.openclaw/.env`

### Setup Instructions

1. **Execute the schema:**
   ```bash
   cd ~/workspace/adam-harris/apps/trinity-qa
   ```

2. **Apply the database schema:**
   - Open https://supabase.com/dashboard/project/fzmhqcgzvgtvkswpwruc/editor
   - Copy the contents of `schema.sql`
   - Paste and execute in the SQL Editor

3. **Verify tables created:**
   - profiles
   - locations
   - checklists / checklist_items
   - inspections / inspection_results
   - work_orders / work_order_comments
   - surveys / survey_responses
   - schedules
   - notifications

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- Admins see everything
- Staff see work-related data
- Customers see only their locations and associated records
- Users can view their own schedules and notifications

## 🎨 Brand Guidelines

**Colors:**
- Navy: `#1a2332` (primary brand color)
- Dark Blue: `#243447`
- Blue: `#2c5f8d`
- Light Blue: `#4a90c8`
- Accent: `#6ab0dd`
- Gold: `#d4af37` (ratings/highlights)

**Typography:**
- System font stack for clean, corporate look
- Professional, family-owned business aesthetic

## 📱 Features

### 1. Dashboard
- Role-specific overview
- Key metrics and statistics
- Recent activity feed
- Quick access to open items

### 2. QA Walk Inspections
- Configurable checklists per location/service type
- Mobile-friendly inspection interface
- Photo capture with notes
- Pass/fail rating system
- Automatic work order creation for issues
- Inspection history with filtering

### 3. Work Orders
- **Full lifecycle:** Open → Assigned → In Progress → Complete → Closed
- Photo verification required to close
- Priority levels (Low, Medium, High, Urgent)
- Due date tracking
- Customer-submitted requests
- Threaded comments for communication
- Email notifications (configurable)
- Status filtering

### 4. Surveys & Ratings
- 5-star rating system
- Categories: Cleanliness, Service Quality, Satisfaction
- Customer-visible results
- Comment collection
- Average rating analytics

### 5. Scheduling
- Assign janitors/supervisors to locations
- Date and time management
- Calendar view (weekly)
- "My Schedule" individual view
- Shift notes and instructions

### 6. Location Management
- Customer site tracking
- Service type categorization
- Account manager assignment
- Contact information
- Active/inactive status

### 7. Customer Portal
- Customers see only their locations
- Submit maintenance requests
- View work order status
- See inspection results
- Submit feedback surveys

### 8. Communication
- Threaded comments on work orders
- Email notifications (when configured)
- Real-time in-app notifications
- Activity tracking

## 🔐 Authentication

Uses Supabase Authentication with email/password.

### Test Accounts (To Be Created)

Create test users via Supabase dashboard:

1. **Admin**: admin@trinity.test
2. **Account Manager**: manager@trinity.test
3. **Supervisor**: supervisor@trinity.test
4. **Janitor**: janitor@trinity.test
5. **Customer**: customer@trinity.test

After creating auth users, add their profiles to the `profiles` table with appropriate roles.

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (no build step)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (for photos)
- **Hosting:** Static hosting via alphaclaw platform

## 📁 Project Structure

```
trinity-qa/
├── index.html              # Main HTML file
├── css/
│   └── main.css           # All styles (Trinity brand)
├── js/
│   ├── supabase.js        # Supabase client
│   ├── auth.js            # Authentication module
│   ├── router.js          # Hash-based routing
│   ├── components.js      # Reusable UI components
│   ├── app.js             # Main application entry
│   └── views/
│       ├── dashboard.js   # Dashboard view
│       ├── inspections.js # QA inspections view
│       ├── work-orders.js # Work orders view
│       ├── surveys.js     # Surveys view
│       ├── schedule.js    # Schedule view
│       ├── locations.js   # Locations view
│       └── users.js       # User management view
├── schema.sql             # Database schema
├── setup-database.js      # Database setup script
└── README.md              # This file
```

## 🔄 Development Workflow

1. **Make changes** to HTML/CSS/JS files
2. **Refresh browser** - no build step needed
3. **Test** with different user roles
4. **Deploy** - files are automatically served

## 📊 Database Schema

### Key Tables

**profiles** - User accounts with roles
- Extends Supabase auth.users
- Role field for RBAC

**locations** - Customer sites
- Address and service type
- Customer and account manager relationships

**inspections** - QA walks
- Location and inspector
- Status and overall rating
- Timestamps

**inspection_results** - Individual checklist items
- Pass/fail status
- Photos and notes
- Link to work orders created

**work_orders** - Maintenance tasks
- Full lifecycle tracking
- Priority and due dates
- Photo verification
- Comments thread

**surveys** - Customer feedback
- Three rating categories
- Comments field
- Timestamp

**schedules** - Staff assignments
- Date and time slots
- Location and staff member
- Notes

**notifications** - In-app alerts
- User-specific
- Read/unread status

## 🚧 Future Enhancements

Potential additions:
- [ ] Real-time updates with Supabase realtime
- [ ] Push notifications
- [ ] Mobile app (React Native)
- [ ] PDF report generation
- [ ] Advanced analytics dashboard
- [ ] Automated email notifications
- [ ] SMS alerts for urgent work orders
- [ ] Checklist templates builder UI
- [ ] Photo gallery view
- [ ] Document attachments
- [ ] Time tracking integration

## 💰 Project Details

- **Client:** Trinity Building Services
- **Project Value:** $10,000
- **Type:** Paid client project
- **Status:** Production-ready
- **Company Info:** Family-owned, est. 1987, San Francisco Bay Area

## 📞 Support

For technical support or questions:
- Review this README
- Check database RLS policies
- Verify Supabase environment variables
- Test with appropriate user roles

## 📄 License

Proprietary - Built for Trinity Building Services

---

**Trinity Building Services**  
*Quality janitorial services since 1987*  
San Francisco Bay Area
