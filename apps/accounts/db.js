const ACCOUNTS_DB_CONFIG = {
  name: 'accounts',
  tables: {
    clients: {
      columns: `id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT, health TEXT,
        industry TEXT, urls TEXT, contacts TEXT, repos TEXT, meetings TEXT,
        standup TEXT, notes TEXT, links TEXT, github TEXT, jira TEXT,
        netlify TEXT, contracts TEXT, highlights TEXT, challenges TEXT,
        upcomingFocus TEXT, upcomingMeetings TEXT,
        contentfulSpaces TEXT,
        createdAt TEXT, updatedAt TEXT`,
      jsonFields: ['urls', 'contacts', 'repos', 'meetings', 'standup', 'notes',
        'links', 'github', 'jira', 'netlify', 'contracts', 'highlights',
        'challenges', 'upcomingFocus', 'upcomingMeetings', 'contentfulSpaces'],
      file: 'clients.json'
    }
  }
};
