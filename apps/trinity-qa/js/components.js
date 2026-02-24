/**
 * Reusable UI Components
 */

const Components = {
  // Show notification
  notify(message, type = 'info') {
    const container = document.getElementById('notifications-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <strong>${type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</strong>
      ${message}
    `;
    container.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  },

  // Show modal
  showModal(title, content, actions = []) {
    const container = document.getElementById('modal-container');
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="btn-icon close-modal">✕</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-footer">
          ${actions.map(action => `
            <button class="btn ${action.className || 'btn-secondary'}" data-action="${action.action}">
              ${action.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    container.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });

    // Close button
    modal.querySelector('.close-modal').addEventListener('click', () => {
      this.closeModal();
    });

    // Action buttons
    modal.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = actions.find(a => a.action === btn.dataset.action);
        if (action && action.handler) {
          action.handler();
        }
      });
    });

    return modal;
  },

  closeModal() {
    const container = document.getElementById('modal-container');
    container.innerHTML = '';
  },

  // Format date
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Format datetime
  formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  },

  // Format time
  formatTime(timeString) {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  },

  // Render rating stars
  renderStars(rating) {
    if (!rating) return '<span class="text-gray-400">Not rated</span>';
    let stars = '<div class="rating">';
    for (let i = 1; i <= 5; i++) {
      stars += `<span class="star ${i <= rating ? 'filled' : ''}">★</span>`;
    }
    stars += '</div>';
    return stars;
  },

  // Render priority badge
  renderPriority(priority) {
    return `<span class="badge priority-${priority}">${priority}</span>`;
  },

  // Render status badge
  renderStatus(status) {
    const displayStatus = status.replace('_', ' ');
    return `<span class="badge status-${status}">${displayStatus}</span>`;
  },

  // Create form from fields
  createForm(fields) {
    return fields.map(field => {
      if (field.type === 'select') {
        return `
          <div class="form-group">
            <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
            <select id="${field.id}" name="${field.name}" ${field.required ? 'required' : ''}>
              ${field.options.map(opt => `
                <option value="${opt.value}" ${opt.selected ? 'selected' : ''}>${opt.label}</option>
              `).join('')}
            </select>
          </div>
        `;
      } else if (field.type === 'textarea') {
        return `
          <div class="form-group">
            <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
            <textarea id="${field.id}" name="${field.name}" ${field.required ? 'required' : ''} 
                      placeholder="${field.placeholder || ''}">${field.value || ''}</textarea>
          </div>
        `;
      } else if (field.type === 'file') {
        return `
          <div class="form-group">
            <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
            <input type="file" id="${field.id}" name="${field.name}" 
                   accept="${field.accept || 'image/*'}" ${field.required ? 'required' : ''}>
            <div id="${field.id}-preview" class="photo-preview hidden"></div>
          </div>
        `;
      } else {
        return `
          <div class="form-group">
            <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
            <input type="${field.type || 'text'}" id="${field.id}" name="${field.name}" 
                   ${field.required ? 'required' : ''} 
                   value="${field.value || ''}"
                   placeholder="${field.placeholder || ''}">
          </div>
        `;
      }
    }).join('');
  },

  // Show loading state
  showLoading(container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
        <p>Loading...</p>
      </div>
    `;
  },

  // Show empty state
  showEmpty(container, icon, title, message, action = null) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <h3 class="empty-state-title">${title}</h3>
        <p>${message}</p>
        ${action ? `<button class="btn btn-primary" style="margin-top: 1rem;" onclick="${action.handler}">${action.label}</button>` : ''}
      </div>
    `;
  },

  // Upload photo to Supabase storage
  async uploadPhoto(file, path) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('trinity-qa')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('trinity-qa')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  },

  // Get form data as object
  getFormData(formId) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
      // Convert empty strings to null (prevents DB type errors for dates, uuids, etc.)
      data[key] = value === '' ? null : value;
    }
    return data;
  }
};

window.Components = Components;
