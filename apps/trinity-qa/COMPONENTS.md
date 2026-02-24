# Trinity QA Component Library

Production-quality Web Components library for the Trinity Building Services QA application.

## Overview

- **14 Custom Components** + 1 index file
- **Shadow DOM** for encapsulation
- **CSS Custom Properties** for theming
- **Zero dependencies**
- **Fully responsive**
- **Production ready**

## Installation

Import all components:

```javascript
import '/js/components/index.js';
```

Or import individually:

```javascript
import { TQButton, TQModal } from '/js/components/index.js';
```

## Components

### 1. tq-badge
Status/priority/role badges with semantic coloring.

```html
<tq-badge type="status" value="completed"></tq-badge>
<tq-badge type="priority" value="high"></tq-badge>
<tq-badge type="role" value="admin"></tq-badge>
```

**Attributes:**
- `type`: status|priority|role
- `value`: Badge text
- `variant`: Color override (success|warning|danger|info|primary|neutral)

---

### 2. tq-button
Styled button with variants, sizes, and loading states.

```html
<tq-button variant="primary" size="md">Click Me</tq-button>
<tq-button loading>Processing...</tq-button>
<tq-button disabled>Disabled</tq-button>
```

**Attributes:**
- `variant`: primary|secondary|success|danger|ghost
- `size`: sm|md|lg
- `loading`: Show loading spinner
- `disabled`: Disable button
- `block`: Full width
- `icon`: Icon character/emoji

---

### 3. tq-input
Form input with validation and multiple types.

```html
<tq-input 
  type="text" 
  label="Full Name" 
  name="name" 
  placeholder="Enter name"
  required
></tq-input>

<tq-input 
  type="select" 
  label="Building" 
  name="building"
  options='[{"value":"1","label":"Building 1"}]'
></tq-input>
```

**Attributes:**
- `type`: text|email|password|date|datetime-local|number|select|textarea|file|checkbox
- `label`: Field label
- `name`: Field name
- `placeholder`: Placeholder text
- `required`: Mark as required
- `value`: Initial/current value
- `error`: Error message
- `help`: Help text
- `options`: JSON array for select (format: `[{value, label}]` or `["option1", "option2"]`)
- `disabled`: Disable input

**Properties:**
- `.value`: Get/set value
- `.name`: Get field name

**Events:**
- `tq-change`: Fired on value change (detail: `{value, name}`)

**Supported Types:**
- Text inputs: text, email, password, number
- Date/time: date, datetime-local
- Select dropdown (requires `options` attribute)
- Textarea (multi-line text)
- File upload
- Checkbox

---

### 4. tq-card
Content card with optional header, footer, and collapse.

```html
<tq-card card-title="Card Title" subtitle="Subtitle">
  <p>Card content goes here</p>
  
  <div slot="header-actions">
    <tq-button size="sm">Edit</tq-button>
  </div>
  
  <div slot="footer">
    <tq-button block>Action</tq-button>
  </div>
</tq-card>
```

**Attributes:**
- `card-title`: Title text
- `subtitle`: Subtitle text
- `collapsible`: Enable collapse toggle

**Slots:**
- default: Main content
- `header-actions`: Buttons/actions in header
- `footer`: Footer content

---

### 5. tq-modal
Modal dialog with overlay and keyboard support.

```html
<tq-modal id="myModal" modal-title="Dialog Title" size="md">
  <p>Modal content</p>
  
  <div slot="footer">
    <tq-button onclick="myModal.close()">Close</tq-button>
  </div>
</tq-modal>

<tq-button onclick="myModal.show()">Open Modal</tq-button>
```

**Attributes:**
- `modal-title`: Modal title
- `open`: Show/hide modal
- `size`: sm|md|lg|xl

**Methods:**
- `.show()`: Open modal
- `.close()`: Close modal

**Events:**
- `tq-close`: Fired when modal closes

**Features:**
- ESC key to close
- Click overlay to close
- Body scroll lock when open

---

### 6. tq-toast
Auto-dismissing toast notifications.

```javascript
TQToast.show('Success!', 'success', 3000);
TQToast.show('Warning!', 'warning');
TQToast.show('Error!', 'danger');
TQToast.show('Info', 'info');
```

**Static Method:**
- `TQToast.show(message, type, duration)`
  - `message`: Toast text
  - `type`: success|warning|danger|info
  - `duration`: Milliseconds (default 3000)

**Features:**
- Auto-dismiss after duration
- Stackable notifications
- Slide-in animation

---

### 7. tq-rating
Star rating component with editable mode.

```html
<tq-rating value="4.5"></tq-rating>
<tq-rating value="3" editable id="userRating"></tq-rating>
<tq-rating value="5" size="lg"></tq-rating>
```

**Attributes:**
- `value`: Rating (1-5)
- `editable`: Allow editing
- `size`: sm|md|lg

**Events:**
- `tq-change`: Fired when rating changes (detail: `{value}`)

---

### 8. tq-table
Data table with sorting and row click events.

```html
<tq-table 
  id="myTable"
  columns='[{"key":"name","label":"Name"},{"key":"email","label":"Email"}]'
  sortable
  empty-message="No data found"
></tq-table>

<script>
  myTable.setData([
    { name: 'John', email: 'john@example.com' },
    { name: 'Jane', email: 'jane@example.com' }
  ]);
</script>
```

**Attributes:**
- `columns`: JSON array of column definitions
  - Format: `[{key, label}]` or `["col1", "col2"]`
- `sortable`: Enable column sorting
- `empty-message`: Message when no data

**Methods:**
- `.setData(array)`: Set table data

**Events:**
- `tq-row-click`: Fired when row clicked (detail: `{row, index}`)

---

### 9. tq-avatar
User avatar with initials fallback.

```html
<tq-avatar name="John Smith" role="Manager"></tq-avatar>
<tq-avatar name="Jane Doe" size="lg"></tq-avatar>
<tq-avatar name="Bob" src="/path/to/image.jpg"></tq-avatar>
```

**Attributes:**
- `name`: User name (generates initials)
- `role`: User role (displayed below name)
- `size`: sm|md|lg|xl
- `src`: Avatar image URL

**Features:**
- Auto-generated initials from name
- Color derived from name (consistent)
- Image fallback support

---

### 10. tq-empty
Empty state placeholder.

```html
<tq-empty 
  icon="📋" 
  title="No inspections" 
  message="Get started by creating your first inspection."
>
  <tq-button variant="primary">Create Inspection</tq-button>
</tq-empty>
```

**Attributes:**
- `icon`: Icon/emoji
- `title`: Title text
- `message`: Description text

**Slots:**
- default: Action button or content

---

### 11. tq-stat
Dashboard statistic card with trend indicators.

```html
<tq-stat 
  label="Total Users" 
  value="1,247" 
  icon="👥"
  change="+12.5%"
  change-type="up"
></tq-stat>
```

**Attributes:**
- `label`: Stat label
- `value`: Stat value
- `icon`: Icon/emoji
- `change`: Change value (e.g., "+12%")
- `change-type`: up|down|neutral

---

### 12. tq-form
Form wrapper with validation and data collection.

```html
<tq-form id="myForm">
  <tq-input type="text" name="username" label="Username" required></tq-input>
  <tq-input type="email" name="email" label="Email" required></tq-input>
  <tq-button type="submit">Submit</tq-button>
</tq-form>

<script>
  myForm.addEventListener('tq-submit', (e) => {
    console.log('Form data:', e.detail.data);
    // { username: 'john', email: 'john@example.com' }
  });
</script>
```

**Methods:**
- `.getFormData()`: Returns object with all tq-input values (empty → null)
- `.validate()`: Validates required fields, returns boolean
- `.reset()`: Clears all inputs

**Events:**
- `tq-submit`: Fired on submit with validation (detail: `{data}`)

**Features:**
- Auto-collects data from child tq-input elements
- Empty values converted to null
- Built-in validation for required fields

---

### 13. tq-header
Main application header with navigation.

```html
<tq-header 
  app-title="Trinity QA" 
  user-name="John Smith" 
  user-role="Manager"
></tq-header>

<script>
  const header = document.querySelector('tq-header');
  
  header.setNavItems([
    { label: 'Dashboard', route: 'dashboard', icon: '📊' },
    { label: 'Inspections', route: 'inspections', icon: '📋' }
  ]);
  
  header.setActiveRoute('dashboard');
  
  header.addEventListener('tq-navigate', (e) => {
    console.log('Navigate to:', e.detail.route);
  });
  
  header.addEventListener('tq-logout', () => {
    console.log('User logged out');
  });
</script>
```

**Attributes:**
- `app-title`: Application title
- `user-name`: Current user name
- `user-role`: Current user role

**Methods:**
- `.setNavItems(items)`: Set navigation items
  - Format: `[{label, route, icon?}]`
- `.setActiveRoute(route)`: Highlight active route

**Events:**
- `tq-navigate`: Fired on nav click (detail: `{route}`)
- `tq-logout`: Fired on logout click

**Features:**
- Responsive hamburger menu on mobile
- Uses tq-avatar for user display
- Sticky positioning

---

### 14. tq-footer
Application footer.

```html
<tq-footer company-name="Trinity Building Services" year="2024"></tq-footer>
```

**Attributes:**
- `company-name`: Company name
- `year`: Copyright year (defaults to current year)

**Features:**
- Displays copyright
- "Powered by Last Rev" branding
- Responsive layout

---

## Theming

All components use CSS custom properties from `/css/main.css`:

### Brand Colors
```css
--trinity-navy: #1a2332
--trinity-dark-blue: #243447
--trinity-blue: #2c5f8d
--trinity-light-blue: #4a90c8
--trinity-accent: #6ab0dd
--trinity-gold: #d4af37
```

### Semantic Colors
```css
--success: #10b981
--warning: #f59e0b
--danger: #ef4444
--info: #3b82f6
```

### Grays
```css
--gray-50 through --gray-900
```

### Spacing
```css
--spacing-xs: 0.25rem
--spacing-sm: 0.5rem
--spacing-md: 1rem
--spacing-lg: 1.5rem
--spacing-xl: 2rem
```

### Border Radius
```css
--radius-sm: 0.25rem
--radius-md: 0.5rem
--radius-lg: 0.75rem
--radius-xl: 1rem
```

## Demo

View live demo at: `/component-demo.html`

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

All modern browsers with Custom Elements v1 and Shadow DOM support.

## File Structure

```
/js/components/
├── index.js          # Main export file
├── tq-badge.js       # Badge component
├── tq-button.js      # Button component
├── tq-input.js       # Input component
├── tq-card.js        # Card component
├── tq-modal.js       # Modal component
├── tq-toast.js       # Toast component
├── tq-rating.js      # Rating component
├── tq-table.js       # Table component
├── tq-avatar.js      # Avatar component
├── tq-empty.js       # Empty state component
├── tq-stat.js        # Stat card component
├── tq-form.js        # Form wrapper component
├── tq-header.js      # Header component
└── tq-footer.js      # Footer component
```

## Usage Examples

### Complete Form Example

```html
<tq-form id="inspectionForm">
  <tq-input 
    type="select" 
    label="Building" 
    name="building_id"
    options='[{"value":"1","label":"Building A"},{"value":"2","label":"Building B"}]'
    required
  ></tq-input>
  
  <tq-input 
    type="datetime-local" 
    label="Inspection Date" 
    name="inspection_date"
    required
  ></tq-input>
  
  <tq-input 
    type="textarea" 
    label="Notes" 
    name="notes"
    placeholder="Additional observations..."
  ></tq-input>
  
  <tq-rating 
    value="0" 
    editable
    id="overallRating"
  ></tq-rating>
  
  <div style="display: flex; gap: 1rem; margin-top: 1rem;">
    <tq-button type="submit" variant="primary">Submit Inspection</tq-button>
    <tq-button type="button" variant="secondary" onclick="inspectionForm.reset()">Reset</tq-button>
  </div>
</tq-form>

<script type="module">
  import { TQToast } from '/js/components/index.js';
  
  const form = document.getElementById('inspectionForm');
  const rating = document.getElementById('overallRating');
  
  form.addEventListener('tq-submit', async (e) => {
    const data = {
      ...e.detail.data,
      rating: rating.value
    };
    
    try {
      // Submit to your backend
      await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      TQToast.show('Inspection submitted successfully!', 'success');
      form.reset();
    } catch (error) {
      TQToast.show('Failed to submit inspection', 'danger');
    }
  });
</script>
```

### Dashboard Example

```html
<!-- Stats Overview -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
  <tq-stat label="Inspections" value="247" icon="📋" change="+12%" change-type="up"></tq-stat>
  <tq-stat label="Failed" value="8" icon="⚠️" change="-15%" change-type="down"></tq-stat>
  <tq-stat label="Avg Score" value="94.2" icon="⭐" change="+2.1%" change-type="up"></tq-stat>
  <tq-stat label="Sites" value="18" icon="🏢"></tq-stat>
</div>

<!-- Recent Inspections Table -->
<tq-card card-title="Recent Inspections" style="margin-top: 2rem;">
  <tq-table 
    id="recentTable"
    columns='[
      {"key":"inspector","label":"Inspector"},
      {"key":"site","label":"Site"},
      {"key":"date","label":"Date"},
      {"key":"score","label":"Score"}
    ]'
    sortable
  ></tq-table>
</tq-card>

<script>
  recentTable.setData([
    { inspector: 'John Smith', site: 'Building A', date: '2024-02-23', score: 95 },
    { inspector: 'Jane Doe', site: 'Building B', date: '2024-02-22', score: 88 }
  ]);
</script>
```

## Notes

- All components are self-contained with Shadow DOM
- No global CSS pollution
- Components communicate via custom events
- Form components follow standard HTML form semantics
- All components are accessible and keyboard-navigable
- Production-quality code with proper error handling

---

**Built for Trinity Building Services QA Portal**  
**Developed by Last Rev - February 2024**
