/* CC Iron — Weight Training App */

class CCIron extends HTMLElement {
  constructor() {
    super();
    this.db = null;
    this.exercises = [];
    this.templates = [];
    this.currentWorkout = null;
    this.workoutTimer = null;
    this.currentView = 'home';
    this.exerciseFilters = {
      category: 'all',
      equipment: 'all',
      search: ''
    };
    this.viewMode = 'cards'; // cards, list, expanded
  }

  async connectedCallback() {
    await this.loadData();
    this.render();
    this.setupEventListeners();
  }

  async loadData() {
    try {
      this.db = await CCIronDB.init();
      this.exercises = await this.db.getExercises();
      this.templates = await this.db.getWorkoutTemplates();
    } catch (error) {
      console.error('Failed to load data:', error);
      this.exercises = [];
      this.templates = [];
    }
  }

  setupEventListeners() {
    this.addEventListener('cc-view-change', e => {
      this.viewMode = e.detail.view;
      this.renderExerciseLibrary();
    });

    this.addEventListener('pill-change', e => {
      const pill = e.target;
      if (pill.getAttribute('label') === 'Category') {
        this.exerciseFilters.category = e.detail.value;
      } else if (pill.getAttribute('label') === 'Equipment') {
        this.exerciseFilters.equipment = e.detail.value;
      }
      this.filterExercises();
    });

    this.addEventListener('field-change', e => {
      if (e.detail.name === 'exercise-search') {
        this.exerciseFilters.search = e.detail.value;
        this.filterExercises();
      }
    });
  }

  async filterExercises() {
    try {
      this.exercises = await this.db.getExercises(this.exerciseFilters);
      this.renderExerciseLibrary();
    } catch (error) {
      console.error('Failed to filter exercises:', error);
    }
  }

  render() {
    this.innerHTML = `
      <div class="cc-iron-app">
        <cc-tabs active="home">
          <cc-tab name="home" label="Home" icon="home">
            ${this.renderHome()}
          </cc-tab>
          <cc-tab name="exercises" label="Exercises" icon="dumbbell">
            ${this.renderExercises()}
          </cc-tab>
          <cc-tab name="workout" label="Workout" icon="play">
            ${this.renderWorkout()}
          </cc-tab>
          <cc-tab name="programs" label="Programs" icon="list">
            ${this.renderPrograms()}
          </cc-tab>
          <cc-tab name="progress" label="Progress" icon="trending-up">
            ${this.renderProgress()}
          </cc-tab>
        </cc-tabs>
      </div>
    `;
  }

  renderHome() {
    return `
      <div class="dashboard-container">
        <cc-fade-in>
          <div class="page-header">
            <h1>💪 Welcome to CC Iron</h1>
            <p class="subtitle">Your personal weight training companion</p>
          </div>
        </cc-fade-in>

        <cc-stagger animation="fade-up" delay="100">
          <div class="grid grid-2">
            <div class="card">
              <div class="card-top">
                <div class="card-icon">🎯</div>
                <div class="card-title">Today's Workout</div>
              </div>
              <div class="card-desc">
                ${this.currentWorkout ? 
                  `Continue your ${this.currentWorkout.name} workout` : 
                  'No active workout - start a new one!'
                }
              </div>
              <div class="card-actions">
                <button class="btn btn-primary" onclick="this.closest('cc-iron').showTab('workout')">
                  ${this.currentWorkout ? 'Continue' : 'Start Workout'}
                </button>
              </div>
            </div>

            <div class="card">
              <div class="card-top">
                <div class="card-icon">🔥</div>
                <div class="card-title">Streak</div>
              </div>
              <div class="card-desc">
                <cc-stat-counter value="0" label="days" id="streak-counter"></cc-stat-counter>
              </div>
            </div>

            <div class="card">
              <div class="card-top">
                <div class="card-icon">💪</div>
                <div class="card-title">Total Volume</div>
              </div>
              <div class="card-desc">
                <cc-stat-counter value="0" suffix="lbs" id="volume-counter"></cc-stat-counter>
              </div>
            </div>

            <div class="card">
              <div class="card-top">
                <div class="card-icon">📊</div>
                <div class="card-title">Personal Records</div>
              </div>
              <div class="card-desc">
                <cc-stat-counter value="0" label="PRs" id="pr-counter"></cc-stat-counter>
              </div>
            </div>
          </div>
        </cc-stagger>

        <cc-fade-in delay="400">
          <div class="panel mt-4">
            <div class="panel-header">
              <h2>Recent Activity</h2>
            </div>
            <div id="recent-activity">
              <cc-empty-state message="No recent workouts - time to get started!" icon="💪"></cc-empty-state>
            </div>
          </div>
        </cc-fade-in>
      </div>
    `;
  }

  renderExercises() {
    const categories = [...new Set(this.exercises.map(e => e.category))];
    const equipment = [...new Set(this.exercises.map(e => e.equipment))];

    return `
      <div class="exercises-container">
        <cc-fade-in>
          <div class="page-header">
            <h1>Exercise Library</h1>
            <div class="header-right">
              <cc-view-toggle app="cc-iron"></cc-view-toggle>
            </div>
          </div>
        </cc-fade-in>

        <div class="filters mb-4">
          <cc-search placeholder="Search exercises..." name="exercise-search"></cc-search>
          <cc-pill-dropdown 
            label="Category" 
            items='[
              {"value":"all","label":"All Categories"},
              {"value":"chest","label":"Chest"},
              {"value":"back","label":"Back"},
              {"value":"shoulders","label":"Shoulders"},
              {"value":"legs","label":"Legs"},
              {"value":"arms","label":"Arms"},
              {"value":"core","label":"Core"}
            ]'
            value="all">
          </cc-pill-dropdown>
          <cc-pill-dropdown 
            label="Equipment" 
            items='[
              {"value":"all","label":"All Equipment"},
              {"value":"barbell","label":"Barbell"},
              {"value":"dumbbell","label":"Dumbbell"},
              {"value":"cable","label":"Cable"},
              {"value":"machine","label":"Machine"},
              {"value":"bodyweight","label":"Bodyweight"},
              {"value":"kettlebell","label":"Kettlebell"},
              {"value":"bands","label":"Resistance Bands"}
            ]'
            value="all">
          </cc-pill-dropdown>
        </div>

        <div id="exercise-library">
          ${this.renderExerciseLibrary()}
        </div>
      </div>
    `;
  }

  renderExerciseLibrary() {
    if (!this.exercises.length) {
      return '<cc-empty-state message="No exercises found" icon="🔍"></cc-empty-state>';
    }

    const viewClass = `view-${this.viewMode}`;
    
    if (this.viewMode === 'cards') {
      return `
        <cc-stagger animation="fade-up" delay="50">
          <div class="grid grid-cards ${viewClass}">
            ${this.exercises.map(exercise => `
              <div class="card" data-exercise-id="${exercise.id}">
                <div class="card-top">
                  <div class="card-icon">${this.getExerciseIcon(exercise.category)}</div>
                  <div class="card-title">${this._esc(exercise.name)}</div>
                </div>
                <div class="card-desc">${this._esc(exercise.description || '')}</div>
                <div class="card-meta">
                  <span class="badge badge-${exercise.difficulty}">${exercise.difficulty}</span>
                  <span class="tag">${exercise.equipment}</span>
                  <span class="tag">${exercise.muscle_group}</span>
                </div>
                <div class="card-actions">
                  <button class="btn btn-sm" onclick="this.closest('cc-iron').showExerciseDetail('${exercise.id}')">
                    View Details
                  </button>
                  ${exercise.alternatives && exercise.alternatives.length > 0 ? `
                    <button class="btn btn-sm btn-secondary" onclick="this.closest('cc-iron').showAlternatives('${exercise.id}')">
                      Alternatives
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </cc-stagger>
      `;
    } else if (this.viewMode === 'list') {
      return `
        <div class="${viewClass}">
          ${this.exercises.map(exercise => `
            <div class="list-row" data-exercise-id="${exercise.id}">
              <div class="entity-icon">${this.getExerciseIcon(exercise.category)}</div>
              <div class="entity-body">
                <div class="entity-row">
                  <strong>${this._esc(exercise.name)}</strong>
                  <div class="entity-meta">
                    <span class="badge badge-${exercise.difficulty}">${exercise.difficulty}</span>
                    <span class="tag">${exercise.equipment}</span>
                  </div>
                </div>
                <div class="entity-meta">${this._esc(exercise.description || '')}</div>
              </div>
              <div class="entity-actions">
                <button class="btn btn-sm" onclick="this.closest('cc-iron').showExerciseDetail('${exercise.id}')">
                  Details
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else { // expanded
      return `
        <div class="${viewClass}">
          ${this.exercises.map(exercise => `
            <div class="expanded-card panel mb-4" data-exercise-id="${exercise.id}">
              <div class="panel-header">
                <h3>${this.getExerciseIcon(exercise.category)} ${this._esc(exercise.name)}</h3>
                <div>
                  <span class="badge badge-${exercise.difficulty}">${exercise.difficulty}</span>
                  <span class="tag">${exercise.equipment}</span>
                  <span class="tag">${exercise.muscle_group}</span>
                </div>
              </div>
              <div class="p-4">
                <p><strong>Description:</strong> ${this._esc(exercise.description || '')}</p>
                ${exercise.instructions ? `<p><strong>Instructions:</strong> ${this._esc(exercise.instructions)}</p>` : ''}
                ${exercise.alternatives && exercise.alternatives.length > 0 ? `
                  <div class="mt-3">
                    <strong>Alternatives:</strong>
                    <button class="btn btn-sm btn-secondary ml-2" onclick="this.closest('cc-iron').showAlternatives('${exercise.id}')">
                      View ${exercise.alternatives.length} alternatives
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  renderWorkout() {
    return `
      <div class="workout-container">
        <cc-fade-in>
          <div class="page-header">
            <h1>Workout Mode</h1>
          </div>
        </cc-fade-in>

        <div id="workout-content">
          ${this.currentWorkout ? this.renderActiveWorkout() : this.renderWorkoutStart()}
        </div>
      </div>
    `;
  }

  renderWorkoutStart() {
    return `
      <div class="workout-start">
        <cc-empty-state message="No active workout" icon="💪" animation="sparkle"></cc-empty-state>
        <div class="text-center mt-4">
          <button class="btn btn-primary" onclick="this.closest('cc-iron').showTab('programs')">
            Choose a Program
          </button>
          <button class="btn btn-secondary ml-2" onclick="this.closest('cc-iron').startQuickWorkout()">
            Quick Workout
          </button>
        </div>
      </div>
    `;
  }

  renderActiveWorkout() {
    // This would render the active workout interface
    return `
      <div class="active-workout">
        <div class="workout-header">
          <h2>${this._esc(this.currentWorkout.name)}</h2>
          <div class="workout-timer" id="workout-timer">00:00</div>
        </div>
        <!-- Active workout interface would go here -->
        <div class="text-center">
          <button class="btn btn-danger" onclick="this.closest('cc-iron').endWorkout()">
            End Workout
          </button>
        </div>
      </div>
    `;
  }

  renderPrograms() {
    return `
      <div class="programs-container">
        <cc-fade-in>
          <div class="page-header">
            <h1>Workout Programs</h1>
          </div>
        </cc-fade-in>

        <cc-stagger animation="fade-up" delay="80">
          <div class="grid grid-cards">
            ${this.templates.map(template => `
              <div class="card" data-template-id="${template.id}">
                <div class="card-top">
                  <div class="card-icon">${this.getProgramIcon(template.type)}</div>
                  <div class="card-title">${this._esc(template.name)}</div>
                </div>
                <div class="card-desc">${this._esc(template.description || '')}</div>
                <div class="card-meta">
                  <span class="badge badge-${template.difficulty}">${template.difficulty}</span>
                  <span class="tag">${template.days_per_week} days/week</span>
                  <span class="tag">${template.type.replace('_', ' ')}</span>
                </div>
                <div class="card-actions">
                  <button class="btn btn-primary" onclick="this.closest('cc-iron').startProgram('${template.id}')">
                    Start Program
                  </button>
                  <button class="btn btn-secondary" onclick="this.closest('cc-iron').showProgramDetail('${template.id}')">
                    View Details
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </cc-stagger>
      </div>
    `;
  }

  renderProgress() {
    return `
      <div class="progress-container">
        <cc-fade-in>
          <div class="page-header">
            <h1>Progress & Stats</h1>
          </div>
        </cc-fade-in>

        <cc-stagger animation="fade-up" delay="100">
          <div class="grid grid-2 mb-4">
            <div class="card">
              <div class="card-top">
                <div class="card-icon">🔥</div>
                <div class="card-title">Current Streak</div>
              </div>
              <div class="card-desc">
                <cc-stat-counter value="0" label="days" id="progress-streak"></cc-stat-counter>
              </div>
            </div>

            <div class="card">
              <div class="card-top">
                <div class="card-icon">📈</div>
                <div class="card-title">Total Volume (30d)</div>
              </div>
              <div class="card-desc">
                <cc-stat-counter value="0" suffix="lbs" id="progress-volume"></cc-stat-counter>
              </div>
            </div>
          </div>
        </cc-stagger>

        <div class="panel">
          <div class="panel-header">
            <h2>Personal Records</h2>
          </div>
          <div id="personal-records">
            <cc-empty-state message="No personal records yet - start lifting!" icon="🏆"></cc-empty-state>
          </div>
        </div>

        <div class="panel mt-4">
          <div class="panel-header">
            <h2>Volume Trends</h2>
          </div>
          <div id="volume-chart">
            <cc-empty-state message="Charts coming soon!" icon="📊"></cc-empty-state>
          </div>
        </div>
      </div>
    `;
  }

  getExerciseIcon(category) {
    const icons = {
      chest: '💪',
      back: '🏋️',
      shoulders: '🤸',
      legs: '🦵',
      arms: '💪',
      core: '🔥'
    };
    return icons[category] || '💪';
  }

  getProgramIcon(type) {
    const icons = {
      push_pull_legs: '🔄',
      upper_lower: '⚖️',
      full_body: '🏋️',
      custom: '⚙️'
    };
    return icons[type] || '🏋️';
  }

  showTab(tabName) {
    const tabs = this.querySelector('cc-tabs');
    if (tabs) {
      tabs.setAttribute('active', tabName);
    }
  }

  async showExerciseDetail(exerciseId) {
    const exercise = this.exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const modal = document.createElement('cc-modal');
    modal.setAttribute('title', exercise.name);
    modal.setAttribute('size', 'md');
    modal.innerHTML = `
      <div class="exercise-detail">
        <div class="exercise-meta mb-3">
          <span class="badge badge-${exercise.difficulty}">${exercise.difficulty}</span>
          <span class="tag">${exercise.equipment}</span>
          <span class="tag">${exercise.muscle_group}</span>
        </div>
        
        ${exercise.description ? `<p><strong>Description:</strong><br>${this._esc(exercise.description)}</p>` : ''}
        ${exercise.instructions ? `<p><strong>Instructions:</strong><br>${this._esc(exercise.instructions)}</p>` : ''}
        
        ${exercise.alternatives && exercise.alternatives.length > 0 ? `
          <div class="mt-3">
            <h4>Alternatives</h4>
            <p>${exercise.alternatives.length} alternative exercises available</p>
            <button class="btn btn-secondary btn-sm" onclick="this.closest('cc-iron').showAlternatives('${exercise.id}')">
              View Alternatives
            </button>
          </div>
        ` : ''}
      </div>
      
      <div slot="footer">
        <button class="btn btn-secondary" onclick="this.closest('cc-modal').close()">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.open();
    
    modal.addEventListener('modal-close', () => {
      document.body.removeChild(modal);
    }, { once: true });
  }

  async showAlternatives(exerciseId) {
    try {
      const alternatives = await this.db.getExerciseAlternatives(exerciseId);
      const exercise = this.exercises.find(e => e.id === exerciseId);
      
      const modal = document.createElement('cc-modal');
      modal.setAttribute('title', `Alternatives to ${exercise.name}`);
      modal.setAttribute('size', 'lg');
      modal.innerHTML = `
        <div class="alternatives-grid">
          ${alternatives.length ? alternatives.map(alt => `
            <div class="card">
              <div class="card-top">
                <div class="card-icon">${this.getExerciseIcon(alt.category)}</div>
                <div class="card-title">${this._esc(alt.name)}</div>
              </div>
              <div class="card-desc">${this._esc(alt.description || '')}</div>
              <div class="card-meta">
                <span class="badge badge-${alt.difficulty}">${alt.difficulty}</span>
                <span class="tag">${alt.equipment}</span>
              </div>
              <div class="card-actions">
                <button class="btn btn-sm" onclick="this.closest('cc-iron').showExerciseDetail('${alt.id}')">
                  View Details
                </button>
              </div>
            </div>
          `).join('') : '<cc-empty-state message="No alternatives found" icon="🔍"></cc-empty-state>'}
        </div>
        
        <div slot="footer">
          <button class="btn btn-secondary" onclick="this.closest('cc-modal').close()">Close</button>
        </div>
      `;
      
      document.body.appendChild(modal);
      modal.open();
      
      modal.addEventListener('modal-close', () => {
        document.body.removeChild(modal);
      }, { once: true });
    } catch (error) {
      console.error('Failed to load alternatives:', error);
      window.showToast?.('Failed to load alternatives', 3000);
    }
  }

  startProgram(templateId) {
    // This would start a workout program
    window.showToast?.('Program starting feature coming soon!', 3000);
  }

  showProgramDetail(templateId) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return;

    const modal = document.createElement('cc-modal');
    modal.setAttribute('title', template.name);
    modal.setAttribute('size', 'lg');
    modal.innerHTML = `
      <div class="program-detail">
        <div class="program-meta mb-3">
          <span class="badge badge-${template.difficulty}">${template.difficulty}</span>
          <span class="tag">${template.days_per_week} days/week</span>
          <span class="tag">${template.type.replace('_', ' ')}</span>
        </div>
        
        <p>${this._esc(template.description || '')}</p>
        
        <h4>Program Structure</h4>
        ${Array.isArray(template.exercises) ? template.exercises.map(day => `
          <div class="program-day panel mb-3">
            <div class="panel-header">
              <h5>${day.day}</h5>
            </div>
            <div class="exercise-list">
              ${day.exercises.map(ex => `
                <div class="exercise-row">
                  <span class="exercise-name">${ex.exercise_id.replace('-', ' ')}</span>
                  <span class="exercise-sets">${ex.sets} sets × ${ex.reps} reps</span>
                  <span class="exercise-rest">${ex.rest}s rest</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('') : '<p>Program structure details coming soon!</p>'}
      </div>
      
      <div slot="footer">
        <button class="btn btn-primary" onclick="this.closest('cc-iron').startProgram('${template.id}')">
          Start This Program
        </button>
        <button class="btn btn-secondary" onclick="this.closest('cc-modal').close()">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.open();
    
    modal.addEventListener('modal-close', () => {
      document.body.removeChild(modal);
    }, { once: true });
  }

  startQuickWorkout() {
    window.showToast?.('Quick workout feature coming soon!', 3000);
  }

  endWorkout() {
    if (this.currentWorkout) {
      this.currentWorkout = null;
      if (this.workoutTimer) {
        clearInterval(this.workoutTimer);
        this.workoutTimer = null;
      }
      this.renderWorkout();
      window.showToast?.('Workout ended', 2000);
    }
  }

  _esc(str) {
    if (typeof str !== 'string') return '';
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }
}

customElements.define('cc-iron', CCIron);