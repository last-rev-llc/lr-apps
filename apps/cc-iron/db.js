/* cc-iron — Supabase data layer */

class CCIronDB {
  constructor(sb) { this._sb = sb; }

  static async init() {
    if (!window.supabase) throw new Error('Supabase client not initialized');
    return new CCIronDB(window.supabase);
  }

  // EXERCISES
  async getExercises({ category, equipment, search, muscle_group } = {}) {
    const filters = {};
    if (category && category !== 'all') filters.category = `eq.${category}`;
    if (equipment && equipment !== 'all') filters.equipment = `eq.${equipment}`;
    if (muscle_group && muscle_group !== 'all') filters.muscle_group = `eq.${muscle_group}`;
    if (search) filters.or = `(name.ilike.*${search}*,description.ilike.*${search}*,muscle_group.ilike.*${search}*)`;
    
    return this._sb.select('exercises', {
      filters,
      order: 'name.asc'
    });
  }

  async getExercise(id) {
    const rows = await this._sb.select('exercises', { filters: { id: `eq.${id}` }, limit: 1 });
    return rows[0] || null;
  }

  async getExerciseAlternatives(exerciseId) {
    const exercise = await this.getExercise(exerciseId);
    if (!exercise || !exercise.alternatives?.length) return [];
    
    const alternativeIds = exercise.alternatives.map(id => `id.eq.${id}`).join(',');
    return this._sb.select('exercises', {
      filters: { or: `(${alternativeIds})` }
    });
  }

  // WORKOUT TEMPLATES
  async getWorkoutTemplates({ type } = {}) {
    const filters = {};
    if (type && type !== 'all') filters.type = `eq.${type}`;
    
    return this._sb.select('workout_templates', {
      filters,
      order: 'difficulty.asc,name.asc'
    });
  }

  async getWorkoutTemplate(id) {
    const rows = await this._sb.select('workout_templates', { filters: { id: `eq.${id}` }, limit: 1 });
    return rows[0] || null;
  }

  // WORKOUT LOGS
  async getWorkoutLogs({ user_id = 'anonymous', limit = 10 } = {}) {
    return this._sb.select('workout_logs', {
      filters: { user_id: `eq.${user_id}` },
      order: 'started_at.desc',
      limit
    });
  }

  async createWorkoutLog(templateId, userId = 'anonymous') {
    const id = `workout-${Date.now()}`;
    const log = {
      id,
      user_id: userId,
      template_id: templateId,
      started_at: new Date().toISOString()
    };
    await this._sb.upsert('workout_logs', log);
    return log;
  }

  async completeWorkoutLog(workoutLogId, notes = '') {
    return this._sb.update('workout_logs', {
      completed_at: new Date().toISOString(),
      notes,
      updated_at: new Date().toISOString()
    }, { id: `eq.${workoutLogId}` });
  }

  // EXERCISE LOGS
  async getExerciseLogs(workoutLogId) {
    return this._sb.select('exercise_logs', {
      filters: { workout_log_id: `eq.${workoutLogId}` },
      order: 'created_at.asc'
    });
  }

  async upsertExerciseLog(workoutLogId, exerciseId, sets, notes = '') {
    const id = `exercise-log-${workoutLogId}-${exerciseId}`;
    const log = {
      id,
      workout_log_id: workoutLogId,
      exercise_id: exerciseId,
      sets,
      notes,
      updated_at: new Date().toISOString()
    };
    return this._sb.upsert('exercise_logs', log);
  }

  // PERSONAL RECORDS
  async getPersonalRecords({ user_id = 'anonymous', exercise_id, type = '1rm' } = {}) {
    const filters = { user_id: `eq.${user_id}` };
    if (exercise_id) filters.exercise_id = `eq.${exercise_id}`;
    if (type !== 'all') filters.type = `eq.${type}`;

    return this._sb.select('personal_records', {
      filters,
      order: 'date.desc'
    });
  }

  async upsertPersonalRecord(userId = 'anonymous', exerciseId, weight, reps, type = '1rm') {
    const id = `pr-${exerciseId}-${userId}-${type}-${Date.now()}`;
    const pr = {
      id,
      user_id: userId,
      exercise_id: exerciseId,
      weight,
      reps,
      type,
      date: new Date().toISOString()
    };
    return this._sb.upsert('personal_records', pr);
  }

  // ANALYTICS & STATS
  async getWorkoutStreak(userId = 'anonymous') {
    const logs = await this._sb.select('workout_logs', {
      filters: { 
        user_id: `eq.${userId}`,
        completed_at: 'not.is.null'
      },
      order: 'completed_at.desc'
    });

    if (!logs.length) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < logs.length; i++) {
      const logDate = new Date(logs[i].completed_at);
      logDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - streak);
      
      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  async getTotalVolume(userId = 'anonymous', days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const logs = await this._sb.select('workout_logs', {
      filters: { 
        user_id: `eq.${userId}`,
        completed_at: `gte.${since.toISOString()}`,
        'completed_at': 'not.is.null'
      }
    });

    let totalVolume = 0;
    for (const log of logs) {
      const exerciseLogs = await this.getExerciseLogs(log.id);
      for (const exerciseLog of exerciseLogs) {
        if (exerciseLog.sets && Array.isArray(exerciseLog.sets)) {
          for (const set of exerciseLog.sets) {
            if (set.weight && set.reps) {
              totalVolume += set.weight * set.reps;
            }
          }
        }
      }
    }

    return totalVolume;
  }
}

window.CCIronDB = CCIronDB;