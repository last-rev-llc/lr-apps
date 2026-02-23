# 🛒 Shopping List App

A modern, responsive shopping list organizer built with shared cc-* components from the design system.

## ✨ Features

### 🏪 Store Organization
- **Target** 🎯 - Shopping items for Target
- **Trader Joe's** 🌿 - Natural/organic items
- **Costco** 📦 - Bulk/warehouse items
- Real-time filtering by selected store
- Per-store item counts and statistics

### 👁️ View Modes
- **Cards View** (default) - Grid layout with cc-card components
- **List View** - Compact single-column layout
- **Expanded View** - Full-width detailed view
- Smooth transitions via `cc-view-toggle`
- Responsive grid that adapts to screen size

### ⚡ Interactions
- ✅ Add items with name and quantity
- ✅ Mark items as "in cart" with checkbox
- ✅ Delete individual items
- ✅ Clear all checked items at once
- ✅ Real-time item count
- ✅ Toast notifications for all actions
- ✅ Enter key support for quick adding
- ✅ Mobile-optimized touch interactions

### 🎨 Design
- Glass morphism effects with backdrop blur
- Neon orange accents (#f59e0b)
- Parallax hover effects
- Dark theme optimized
- Fully responsive (mobile, tablet, desktop)
- Accessible with ARIA labels
- Smooth animations and transitions

### 💾 Data Persistence
- Supabase integration for real-time sync
- Automatic timestamping (created_at, updated_at)
- Quantity tracking per item
- In-cart status for each item
- Cross-device synchronization

## 🏗️ Architecture

### Shared Components Used
```
├── cc-app-nav          # Top navigation
├── cc-auth             # Authentication state
├── cc-toast            # Toast notifications
├── cc-view-toggle      # View mode switcher
├── cc-card             # Item cards (grid view)
└── cc-field            # Form input wrapper
```

### Shared Resources
- **Theme**: https://shared.adam-harris.alphaclaw.app/theme.css
- **Components**: https://shared.adam-harris.alphaclaw.app/components/index.js
- **Supabase Client**: https://shared.adam-harris.alphaclaw.app/supabase-client.js

### File Structure
```
cc-shopping-list/
├── index.html                      # Entry point with shared components
├── db.js                           # Supabase data layer
├── modules/
│   └── cc-shopping-list.js         # Main Web Component
├── SETUP.md                        # Database setup guide
├── REBUILD_SUMMARY.md              # Technical rebuild details
├── README.md                       # This file
│
├── Landing Pages
├── landing.html                    # App intro
├── admin.html                      # Admin interface
├── docs.html                       # Documentation
│
├── Content Pages
├── ideas.html                      # Feature ideas
├── prompts.html                    # Quick prompts
├── logs.html                       # Activity log
├── ads.html                        # Marketing
└── apps.html                       # App launcher
```

## 🚀 Quick Start

### 1. Create Supabase Table
See `SETUP.md` for complete SQL schema and setup instructions.

```sql
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  in_cart BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Load the App
The app is served at: `https://cc-shopping-list.adam-harris.alphaclaw.app`

### 3. Start Adding Items
1. Select a store (Target, Trader Joe's, or Costco)
2. Enter item name and quantity
3. Click "Add" or press Enter
4. Check items off as you shop
5. Switch view modes to see items differently

## 📊 Database Schema

### shopping_lists Table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, auto-generated |
| store | TEXT | Target, Trader Joe's, or Costco |
| item_name | TEXT | What to buy |
| quantity | INTEGER | How many (default: 1) |
| in_cart | BOOLEAN | Checked status (default: false) |
| created_at | TIMESTAMP | When added |
| updated_at | TIMESTAMP | Last modified |

### Indexes
- `idx_shopping_lists_store` - For filtering by store
- `idx_shopping_lists_created_at` - For sorting by date

## 🎯 Component Integration

### cc-view-toggle
Manages switching between view modes (cards, list, expanded):
```html
<cc-view-toggle app="cc-shopping-list" default="cards"></cc-view-toggle>
```
Emits `change` event with detail.mode.

### cc-card
Renders items in card view with title and content slots:
```html
<cc-card title="Item Name">
  <div slot="content">Qty and delete button</div>
</cc-card>
```

### cc-field
Form input wrapper with consistent styling:
```html
<cc-field id="item-name" placeholder="Item name..."></cc-field>
```

### cc-toast
Non-intrusive notifications:
```javascript
window.showToast('Item added! ✓', 2000);
```

## 🎨 Design System

### Color Palette
- **Primary Accent**: `#f59e0b` (orange)
- **Text Primary**: `#ffffff`
- **Text Secondary**: `rgba(255, 255, 255, 0.6)`
- **Background**: `#0f0f0f`
- **Card Background**: `rgba(255, 255, 255, 0.03)`
- **Border Color**: `rgba(255, 255, 255, 0.1)`

### Effects
- **Glass Morphism**: `backdrop-filter: blur(10px)`
- **Glow**: `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3)`
- **Neon Highlight**: `box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3)`
- **Parallax**: `transform: translateY(-2px)` on hover

## 📱 Responsive Design

### Breakpoints
- **Desktop**: 1200px+ (multi-column grid)
- **Tablet**: 768px - 1200px (single column)
- **Mobile**: < 768px (full-width, optimized touch)

### Mobile Optimizations
- Touch-friendly button sizes (44px minimum)
- Stacked form inputs on small screens
- Horizontal scrollable store tabs
- Single-column item list
- Bottom margin for viewport height

## 🔧 Configuration

### Change Default Store
Edit `modules/cc-shopping-list.js`:
```javascript
this.currentStore = this.stores[0]; // Change to [1] or [2]
```

### Add More Stores
1. Update `stores` array in component
2. Add emoji to `getStoreEmoji()`
3. Update Supabase table constraint

### Customize Colors
Override CSS variables in `index.html` or `theme.css`:
```css
--accent-color: #f59e0b;
--text-primary: #ffffff;
--bg-primary: #0f0f0f;
```

## 🧪 Testing Checklist

- [ ] Supabase table created and accessible
- [ ] Can add items to Target
- [ ] Can add items to Trader Joe's
- [ ] Can add items to Costco
- [ ] Store tabs switch correctly
- [ ] Item counts update in real-time
- [ ] View toggle switches between modes
- [ ] Cards view renders cc-cards properly
- [ ] List view shows compact rows
- [ ] Expanded view shows full details
- [ ] Checkbox marks items in cart
- [ ] Delete button removes items
- [ ] Clear button removes all checked items
- [ ] Toast notifications appear on action
- [ ] Mobile layout is responsive
- [ ] Touch interactions work well
- [ ] Empty state displays correctly
- [ ] Data persists on page reload

## 📚 Learn More

### Related Documentation
- `SETUP.md` - Database setup and configuration
- `REBUILD_SUMMARY.md` - Technical rebuild details and architecture
- [Shared Components](https://shared.adam-harris.alphaclaw.app/components/index.js)
- [Theme System](https://shared.adam-harris.alphaclaw.app/theme.css)
- [Supabase Documentation](https://supabase.com/docs)

### Component Resources
- [cc-view-toggle](https://github.com/alphaclaw/shared-components/blob/main/cc-view-toggle.js)
- [cc-card](https://github.com/alphaclaw/shared-components/blob/main/cc-card.js)
- [cc-field](https://github.com/alphaclaw/shared-components/blob/main/cc-field.js)
- [cc-toast](https://github.com/alphaclaw/shared-components/blob/main/cc-toast.js)

## 🚀 Deployment

### Current Status
✅ **Ready for Production**

No build steps required. All files are static and can be served directly.

### Deployment Steps
1. Verify Supabase table is created
2. Deploy via build-orchestrator
3. App will be live at: `https://cc-shopping-list.adam-harris.alphaclaw.app`
4. Test all features in production

## 📝 Version History

### Current Version (2026-02-22)
- ✅ Rebuilt with shared cc-* components
- ✅ Glass morphism design system
- ✅ Multiple view modes (cards/list/expanded)
- ✅ Supabase integration
- ✅ Responsive mobile design
- ✅ Accessibility improvements
- ✅ Production-ready

## 🤝 Support

For issues or feature requests, create an issue in the project repository or contact the development team.

---

**Built with** 💛 **using shared cc-components and Supabase**
