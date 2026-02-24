/**
 * Trinity QA Component Library
 * 
 * Custom web components for the Trinity Building Services QA application
 * All components use Shadow DOM and CSS custom properties for theming
 */

// Import all components
import './tq-badge.js';
import './tq-button.js';
import './tq-input.js';
import './tq-card.js';
import './tq-modal.js';
import './tq-toast.js';
import './tq-rating.js';
import './tq-table.js';
import './tq-avatar.js';
import './tq-empty.js';
import './tq-stat.js';
import './tq-form.js';
import './tq-header.js';
import './tq-footer.js';
import './tq-page-header.js';
import './tq-edit-mode.js';

// View components
import './tq-view-toggle.js';
import './tq-filter-bar.js';

// Card components
import './tq-work-order-card.js';
import './tq-inspection-card.js';
import './tq-survey-card.js';
import './tq-schedule-card.js';
import './tq-location-card.js';
import './tq-user-card.js';

// Log successful loading
console.log('✓ TQ Components loaded: 22 components');

// Export component classes for programmatic use
export { TQBadge } from './tq-badge.js';
export { TQButton } from './tq-button.js';
export { TQInput } from './tq-input.js';
export { TQCard } from './tq-card.js';
export { TQModal } from './tq-modal.js';
export { TQToast } from './tq-toast.js';
export { TQRating } from './tq-rating.js';
export { TQTable } from './tq-table.js';
export { TQAvatar } from './tq-avatar.js';
export { TQEmpty } from './tq-empty.js';
export { TQStat } from './tq-stat.js';
export { TQForm } from './tq-form.js';
export { TQHeader } from './tq-header.js';
export { TQFooter } from './tq-footer.js';
export { TQPageHeader } from './tq-page-header.js';
export { TQViewToggle } from './tq-view-toggle.js';
export { TQFilterBar } from './tq-filter-bar.js';
export { TQWorkOrderCard } from './tq-work-order-card.js';
export { TQInspectionCard } from './tq-inspection-card.js';
export { TQSurveyCard } from './tq-survey-card.js';
export { TQScheduleCard } from './tq-schedule-card.js';
export { TQLocationCard } from './tq-location-card.js';
export { TQUserCard } from './tq-user-card.js';

// Make key utilities available globally for non-module scripts
import { TQToast } from './tq-toast.js';
window.TQToast = TQToast;
