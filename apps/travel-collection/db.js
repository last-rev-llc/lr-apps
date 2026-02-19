/**
 * Travel Collection — Database (Supabase backend)
 *
 * Same TravelDB API as before, but backed by Supabase tables instead of
 * SyncDB/JSON files. Tables: travel_properties, travel_contacts, travel_dmcs, travel_reports.
 */

class TravelDB {
  constructor(sb) { this._sb = sb; }

  static async init() {
    // Use shared supabase client from meta tags (via supabase-client.js)
    const sb = window.supabase;
    if (!sb) throw new Error('Supabase client not initialized — ensure supabase-client.js is loaded and meta tags are present');
    return new TravelDB(sb);
  }

  // ── Properties ──────────────────────────────────────────────
  async getProperties(filters = {}) {
    let f = {};
    if (filters.category) f.category = `eq.${filters.category}`;
    if (filters.region) f.region = `eq.${filters.region}`;
    if (filters.type) f.type = `eq.${filters.type}`;
    if (filters.search) f.or = `(name.ilike.*${filters.search}*,location.ilike.*${filters.search}*,description.ilike.*${filters.search}*)`;

    const sort = filters.sort || 'name';
    const validSorts = ['name', 'region', 'category', 'type'];
    const orderCol = validSorts.includes(sort) ? sort : 'name';

    return this._sb.select('travel_properties', { filters: f, order: `${orderCol}.asc` });
  }

  async getProperty(id) {
    const rows = await this._sb.select('travel_properties', { filters: { id: `eq.${id}` }, limit: 1 });
    return rows[0] || null;
  }

  async upsertProperty(p) {
    p.updatedAt = p.updatedAt || new Date().toISOString();
    p.createdAt = p.createdAt || new Date().toISOString();
    return this._sb.upsert('travel_properties', p);
  }

  async deleteProperty(id) {
    return this._sb.delete('travel_properties', { id: `eq.${id}` });
  }

  async getPropertiesByRegion(region) {
    return this._sb.select('travel_properties', { filters: { region: `eq.${region}` } });
  }

  async getPropertiesByType(type) {
    return this._sb.select('travel_properties', { filters: { type: `eq.${type}` } });
  }

  async getPropertiesByCategory(category) {
    return this._sb.select('travel_properties', { filters: { category: `eq.${category}` } });
  }

  async searchProperties(query) {
    return this._sb.select('travel_properties', {
      filters: { or: `(name.ilike.*${query}*,location.ilike.*${query}*,description.ilike.*${query}*)` }
    });
  }

  async getResearchedProperties() {
    return this._sb.select('travel_properties', { filters: { researched: 'eq.true' } });
  }

  async getPendingProperties() {
    return this._sb.select('travel_properties', { filters: { researched: 'eq.false' } });
  }

  // ── Contacts ────────────────────────────────────────────────
  async getContacts(filters = {}) {
    let f = {};
    if (filters.search) f.or = `(firstName.ilike.*${filters.search}*,lastName.ilike.*${filters.search}*,company.ilike.*${filters.search}*,email.ilike.*${filters.search}*)`;
    if (filters.tag) f.tags = `cs.["${filters.tag}"]`;
    return this._sb.select('travel_contacts', { filters: f, order: 'lastName.asc,firstName.asc' });
  }

  async getContact(id) {
    const rows = await this._sb.select('travel_contacts', { filters: { id: `eq.${id}` }, limit: 1 });
    return rows[0] || null;
  }

  async upsertContact(c) {
    c.updatedAt = c.updatedAt || new Date().toISOString();
    c.createdAt = c.createdAt || new Date().toISOString();
    return this._sb.upsert('travel_contacts', c);
  }

  async deleteContact(id) {
    return this._sb.delete('travel_contacts', { id: `eq.${id}` });
  }

  async searchContacts(query) {
    return this._sb.select('travel_contacts', {
      filters: { or: `(firstName.ilike.*${query}*,lastName.ilike.*${query}*,company.ilike.*${query}*,email.ilike.*${query}*)` }
    });
  }

  // ── DMCs ────────────────────────────────────────────────────
  async getDMCs(filters = {}) {
    let f = {};
    if (filters.search) f.or = `(name.ilike.*${filters.search}*,destination.ilike.*${filters.search}*)`;
    if (filters.destination) f.destination = `eq.${filters.destination}`;
    if (filters.specialty) f.specialties = `cs.["${filters.specialty}"]`;

    const sort = filters.sort || 'rating';
    let order = 'rating.desc.nullslast';
    if (sort === 'name') order = 'name.asc';
    else if (sort === 'destination') order = 'destination.asc';

    return this._sb.select('travel_dmcs', { filters: f, order });
  }

  async getDMC(id) {
    const rows = await this._sb.select('travel_dmcs', { filters: { id: `eq.${id}` }, limit: 1 });
    return rows[0] || null;
  }

  async upsertDMC(d) {
    return this._sb.upsert('travel_dmcs', d);
  }

  async deleteDMC(id) {
    return this._sb.delete('travel_dmcs', { id: `eq.${id}` });
  }

  async getDMCsByDestination(dest) {
    return this._sb.select('travel_dmcs', { filters: { destination: `eq.${dest}` } });
  }

  async getDMCsBySpecialty(s) {
    return this._sb.select('travel_dmcs', { filters: { specialties: `cs.["${s}"]` } });
  }

  async searchDMCs(query) {
    return this._sb.select('travel_dmcs', {
      filters: { or: `(name.ilike.*${query}*,destination.ilike.*${query}*,description.ilike.*${query}*)` }
    });
  }

  // ── Reports ─────────────────────────────────────────────────
  async getReports(filters = {}) {
    let f = {};
    if (filters.search) f.or = `(title.ilike.*${filters.search}*,notes.ilike.*${filters.search}*)`;
    return this._sb.select('travel_reports', { filters: f, order: 'createdAt.desc' });
  }

  async getReport(id) {
    const rows = await this._sb.select('travel_reports', { filters: { id: `eq.${id}` }, limit: 1 });
    return rows[0] || null;
  }

  async upsertReport(r) {
    r.createdAt = r.createdAt || new Date().toISOString();
    return this._sb.upsert('travel_reports', r);
  }

  async deleteReport(id) {
    return this._sb.delete('travel_reports', { id: `eq.${id}` });
  }

  async getReportsByContact(contactId) {
    return this._sb.select('travel_reports', { filters: { contactId: `eq.${contactId}` } });
  }

  // ── Utilities ───────────────────────────────────────────────
  async getStats() {
    const [p, c, d, r] = await Promise.all([
      this._sb.select('travel_properties', { select: 'id' }),
      this._sb.select('travel_contacts', { select: 'id' }),
      this._sb.select('travel_dmcs', { select: 'id' }),
      this._sb.select('travel_reports', { select: 'id' })
    ]);
    return { properties: p.length, contacts: c.length, dmcs: d.length, reports: r.length };
  }
}

window.TravelDB = TravelDB;
