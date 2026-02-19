/* cc-ai-scripts — Supabase data layer */

class AiScriptsDB {
  constructor(sb) { this._sb = sb; }

  static async init() {
    if (!window.supabase) throw new Error('Supabase client not initialized');
    return new AiScriptsDB(window.supabase);
  }

  /* Clients */
  async loadClients() {
    return this._sb.select('aiscripts_clients', { order: 'name.asc' });
  }
  async saveClient(c) {
    c.updated_at = new Date().toISOString();
    if (!c.created_at) c.created_at = new Date().toISOString();
    return this._sb.upsert('aiscripts_clients', c);
  }
  async deleteClient(id) {
    return this._sb.delete('aiscripts_clients', { id: `eq.${id}` });
  }

  /* Question Sets */
  async loadQuestionSets(clientId) {
    return this._sb.select('aiscripts_question_sets', {
      filters: { client_id: `eq.${clientId}` }, order: 'created_at.desc'
    });
  }
  async saveQuestionSet(qs) {
    qs.updated_at = new Date().toISOString();
    if (!qs.created_at) qs.created_at = new Date().toISOString();
    return this._sb.upsert('aiscripts_question_sets', qs);
  }
  async deleteQuestionSet(id) {
    return this._sb.delete('aiscripts_question_sets', { id: `eq.${id}` });
  }

  /* Questions */
  async loadQuestions(questionSetId) {
    return this._sb.select('aiscripts_questions', {
      filters: { question_set_id: `eq.${questionSetId}` }, order: 'created_at.asc'
    });
  }
  async saveQuestion(q) {
    q.updated_at = new Date().toISOString();
    if (!q.created_at) q.created_at = new Date().toISOString();
    return this._sb.upsert('aiscripts_questions', q);
  }
  async saveQuestions(questions) {
    const now = new Date().toISOString();
    questions.forEach(q => { q.updated_at = now; if (!q.created_at) q.created_at = now; });
    return this._sb.upsert('aiscripts_questions', questions);
  }
  async deleteQuestions(questionSetId) {
    return this._sb.delete('aiscripts_questions', { question_set_id: `eq.${questionSetId}` });
  }

  /* Files */
  async loadFiles(clientId, type) {
    const filters = { client_id: `eq.${clientId}` };
    if (type && type !== 'all') filters.type = `eq.${type}`;
    return this._sb.select('aiscripts_files', { filters, order: 'uploaded_at.desc' });
  }
  async saveFile(f) {
    if (!f.uploaded_at) f.uploaded_at = new Date().toISOString();
    return this._sb.upsert('aiscripts_files', f);
  }
  async deleteFile(id) {
    return this._sb.delete('aiscripts_files', { id: `eq.${id}` });
  }
  async getFile(id) {
    const rows = await this._sb.select('aiscripts_files', { filters: { id: `eq.${id}` }, limit: 1 });
    return rows[0] || null;
  }

  /* Chatflows */
  async loadChatflows(clientId) {
    return this._sb.select('aiscripts_chatflows', {
      filters: { client_id: `eq.${clientId}` }, order: 'created_at.desc'
    });
  }
  async saveChatflow(cf) {
    if (!cf.created_at) cf.created_at = new Date().toISOString();
    return this._sb.upsert('aiscripts_chatflows', cf);
  }
  async deleteChatflow(id) {
    return this._sb.delete('aiscripts_chatflows', { id: `eq.${id}` });
  }

  /* URL Checks */
  async saveUrlChecks(checks) {
    return this._sb.upsert('aiscripts_url_checks', checks);
  }
  async loadUrlChecks(clientId) {
    return this._sb.select('aiscripts_url_checks', {
      filters: { client_id: `eq.${clientId}` }, order: 'checked_at.desc'
    });
  }

  /* Eval Runs */
  async loadEvalRuns(questionSetId) {
    return this._sb.select('aiscripts_eval_runs', {
      filters: { question_set_id: `eq.${questionSetId}` }, order: 'created_at.desc'
    });
  }
  async saveEvalRun(run) {
    return this._sb.upsert('aiscripts_eval_runs', run);
  }
  async deleteEvalRun(id) {
    // Results cascade-delete via FK
    return this._sb.delete('aiscripts_eval_runs', { id: `eq.${id}` });
  }

  /* Eval Run Results */
  async loadRunResults(runId) {
    return this._sb.select('aiscripts_eval_run_results', {
      filters: { run_id: `eq.${runId}` }, order: 'created_at.asc'
    });
  }
  async saveRunResult(r) {
    return this._sb.upsert('aiscripts_eval_run_results', r);
  }
  async saveRunResults(results) {
    return this._sb.upsert('aiscripts_eval_run_results', results);
  }
}

window.AiScriptsDB = AiScriptsDB;
