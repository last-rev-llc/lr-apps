# Card-Based Views Implementation ✅

## Summary
Implemented a modern card-based view system with 3 view modes (cards/list/expanded), filtering, sorting, and searching for all Trinity QA views.

## New Components Created

### 1. `<tq-view-toggle>` (tq-view-toggle.js)
- **Purpose**: Toggle between 3 view modes with localStorage persistence
- **Attributes**:
  - `view` - Current view mode (cards|list|expanded)
  - `default-view` - Default view (default: 'cards')
- **Events**:
  - `tq-view-change` - Fires when view changes, detail: `{ view: string }`
- **Usage**:
  ```html
  <tq-view-toggle id="my-view-toggle"></tq-view-toggle>
  ```

### 2. `<tq-filter-bar>` (tq-filter-bar.js)
- **Purpose**: Horizontal filter bar with dropdowns, search, and sort
- **Attributes**:
  - `filters` - JSON array of filter configs
  - `sort-options` - JSON array of sort options
  - `searchable` - Boolean to show/hide search input
- **Events**:
  - `tq-filter-change` - Fires on any filter/search/sort change, detail: `{ filters, sort, search }`
- **Usage**:
  ```html
  <tq-filter-bar 
    searchable
    filters='[{"key":"status","label":"Status","options":[{"value":"open","label":"Open"}]}]'
    sort-options='[{"key":"created_at_desc","label":"Newest First"}]'>
  </tq-filter-bar>
  ```

### 3. Card Components

All card components support 3 view modes via the `view` attribute and fire `tq-card-click` events.

#### `<tq-work-order-card>` (tq-work-order-card.js)
- Displays: title, location, status badge, priority badge, assigned user (avatar), due date, description
- 3 modes: card (grid), list (compact row), expanded (full detail)
- **Method**: `.setData(workOrderObject)` - Pass work order data
- **Event**: `tq-card-click` - detail: `{ workOrder }`

#### `<tq-inspection-card>` (tq-inspection-card.js)
- Displays: location, inspector (avatar), date, overall rating (tq-rating), status badge
- **Method**: `.setData(inspectionObject)`
- **Event**: `tq-card-click` - detail: `{ inspection }`

#### `<tq-survey-card>` (tq-survey-card.js)
- Displays: location, customer name, 3 ratings (cleanliness, service, satisfaction), comments, date
- **Method**: `.setData(surveyObject)`
- **Event**: `tq-card-click` - detail: `{ survey }`

#### `<tq-schedule-card>` (tq-schedule-card.js)
- Displays: date, shift times, location, assigned person (avatar)
- **Method**: `.setData(scheduleObject)`
- **Event**: `tq-card-click` - detail: `{ schedule }`

#### `<tq-location-card>` (tq-location-card.js)
- Displays: name, address, customer, account manager, service type badge, active status
- **Method**: `.setData(locationObject)`
- **Event**: `tq-card-click` - detail: `{ location }`

#### `<tq-user-card>` (tq-user-card.js)
- Displays: avatar, name, email, role badge, phone
- **Method**: `.setData(userObject)`
- **Event**: `tq-card-click` - detail: `{ user }`

## CSS Classes Added to main.css

```css
/* Cards view - grid layout */
.view-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

/* List view - compact rows */
.view-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Expanded view - full-width cards */
.view-expanded {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
```

## Implementation Pattern (work-orders.js Example)

### 1. View State Properties
```javascript
const WorkOrdersView = {
  _currentView: 'cards',          // Current view mode
  _allWorkOrders: [],             // All fetched data
  _filteredWorkOrders: [],        // Filtered/sorted data
  // ...
}
```

### 2. Render Method Structure
```javascript
async render() {
  // ... fetch data
  
  container.innerHTML = `
    <!-- Header with view toggle -->
    <div style="display: flex; justify-content: space-between;">
      <h1>Work Orders</h1>
      <tq-view-toggle id="work-orders-view-toggle"></tq-view-toggle>
    </div>
    
    <!-- Filter bar -->
    <tq-filter-bar 
      id="work-orders-filter"
      searchable
      filters='...'
      sort-options='...'>
    </tq-filter-bar>
    
    <!-- Content container -->
    <div id="work-orders-content"></div>
  `;
  
  this.attachEventListeners();
  this.renderContent();
}
```

### 3. Event Listeners
```javascript
attachEventListeners() {
  // View toggle
  const viewToggle = document.getElementById('work-orders-view-toggle');
  viewToggle.addEventListener('tq-view-change', (e) => {
    this._currentView = e.detail.view;
    this.renderContent();
  });
  
  // Filter bar
  const filterBar = document.getElementById('work-orders-filter');
  filterBar.addEventListener('tq-filter-change', (e) => {
    this.applyFilters(e.detail);
  });
}
```

### 4. Apply Filters
```javascript
applyFilters({ filters, sort, search }) {
  let filtered = [...this._allWorkOrders];
  
  // Apply filters
  if (filters.status) {
    filtered = filtered.filter(wo => wo.status === filters.status);
  }
  
  // Apply search
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(wo => 
      wo.title?.toLowerCase().includes(searchLower) ||
      wo.description?.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply sort
  if (sort) {
    // ... sort logic
  }
  
  this._filteredWorkOrders = filtered;
  this.renderContent();
}
```

### 5. Render Content
```javascript
renderContent() {
  const container = document.getElementById('work-orders-content');
  const workOrders = this._filteredWorkOrders;
  
  // Empty state
  if (workOrders.length === 0) {
    container.innerHTML = `<tq-empty ...></tq-empty>`;
    return;
  }
  
  // Determine container class
  let containerClass = 'view-cards';
  if (this._currentView === 'list') containerClass = 'view-list';
  if (this._currentView === 'expanded') containerClass = 'view-expanded';
  
  // Create container
  container.innerHTML = `<div class="${containerClass}" id="cards-container"></div>`;
  const cardsContainer = document.getElementById('cards-container');
  
  // Append cards
  workOrders.forEach(wo => {
    const card = document.createElement('tq-work-order-card');
    card.setAttribute('view', this._currentView);
    card.setData(wo);
    card.addEventListener('tq-card-click', (e) => {
      Router.navigate(`work-orders/${e.detail.workOrder.id}`);
    });
    cardsContainer.appendChild(card);
  });
}
```

## Updated Files

### Core Components
- ✅ `/js/components/tq-view-toggle.js` - NEW
- ✅ `/js/components/tq-filter-bar.js` - NEW
- ✅ `/js/components/tq-work-order-card.js` - NEW
- ✅ `/js/components/tq-inspection-card.js` - NEW
- ✅ `/js/components/tq-survey-card.js` - NEW
- ✅ `/js/components/tq-schedule-card.js` - NEW
- ✅ `/js/components/tq-location-card.js` - NEW
- ✅ `/js/components/tq-user-card.js` - NEW
- ✅ `/js/components/index.js` - Updated to register new components (22 total)

### Styles
- ✅ `/css/main.css` - Added `.view-cards`, `.view-list`, `.view-expanded` classes

### Views
- ✅ `/js/views/work-orders.js` - **FULLY IMPLEMENTED** with card-based views
- ⏳ `/js/views/inspections.js` - TODO: Apply same pattern
- ⏳ `/js/views/surveys.js` - TODO: Apply same pattern
- ⏳ `/js/views/schedule.js` - TODO: Apply same pattern
- ⏳ `/js/views/locations.js` - TODO: Apply same pattern
- ⏳ `/js/views/users.js` - TODO: Apply same pattern

## Next Steps

### To Complete (Apply Same Pattern to Remaining Views):

1. **inspections.js**
   - Add `_currentView`, `_allInspections`, `_filteredInspections` properties
   - Add tq-view-toggle and tq-filter-bar in render()
   - Implement attachEventListeners(), applyFilters(), renderContent()
   - Use tq-inspection-card

2. **surveys.js**
   - Same pattern with tq-survey-card

3. **schedule.js**
   - Same pattern with tq-schedule-card

4. **locations.js**
   - Same pattern with tq-location-card

5. **users.js**
   - Same pattern with tq-user-card

## Testing Checklist

- [ ] View toggle persists preference in localStorage
- [ ] Cards view displays grid of cards
- [ ] List view displays compact rows
- [ ] Expanded view displays full-width detail cards
- [ ] Filters update content in real-time
- [ ] Sort updates content correctly
- [ ] Search filters content across multiple fields
- [ ] Clear button resets all filters
- [ ] Card click navigates to detail view
- [ ] Empty state shows when no results
- [ ] Responsive on mobile (cards become 1 column)

## Benefits of This System

1. **User Experience**
   - 3 view modes for different use cases
   - Fast filtering/sorting without page reload
   - Search across multiple fields
   - Persistent view preference

2. **Developer Experience**
   - Reusable components for all list views
   - Consistent pattern across all views
   - Easy to add new filters/sorts
   - Shadow DOM encapsulation

3. **Performance**
   - Client-side filtering (no extra API calls)
   - Efficient re-rendering (only content area)
   - LocalStorage caching of preferences

4. **Maintainability**
   - Single source of truth for view components
   - Easy to update card designs globally
   - Standardized event handling

---

**Status**: Work Orders view fully implemented as proof of concept. Ready to apply pattern to remaining 5 views.
