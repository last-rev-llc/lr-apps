# Summaries App

A web application for viewing and managing cached summaries from multiple sources (Zoom meetings, Slack threads, and Jira tickets).

## Features

- **Multi-source Summary Display** — View summaries from Zoom, Slack, and Jira in one place
- **4 Tab Views** — All, Zoom Transcripts, Slack Threads, and Jira Updates
- **Advanced Filtering** — Date range, search, and source-specific filters
- **Day Grouping** — Summaries automatically grouped by date (Today, Yesterday, etc.)
- **Expandable Cards** — Click to see full summaries, action items, and decisions
- **Responsive Design** — Works on desktop and tablet

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+), Web Components
- **Database:** Supabase (PostgreSQL)
- **Styling:** Shared theme.css, no custom CSS
- **Components:** Shared UI components (cc-app-nav, cc-tabs, cc-search, etc.)

## Project Structure

```
summaries/
├── index.html              # Main app shell
├── seed.json              # Sample data for initial load
├── migrations.sql         # Supabase table definitions
├── modules/
│   ├── db.js              # Supabase queries
│   ├── summaries.js       # Data formatting & organization
│   ├── ui.js              # Card rendering & DOM management
│   ├── filters.js         # Filter logic & event handling
│   └── init.js            # Table creation & seeding
├── .gitignore
└── README.md
```

## Supabase Tables

### summaries_zoom
Caches Zoom meeting summaries with action items and decisions.

### summaries_slack
Caches Slack thread summaries with tone analysis and participants.

### summaries_jira
Caches Jira ticket summaries with priority and status.

## Getting Started

1. **Deploy to production:**
   ```
   The app is served at: https://summaries.adam-harris.alphaclaw.app/
   ```

2. **Tables are created automatically:**
   - On first load, the app checks for tables and creates them if needed
   - Sample data is seeded if no existing data is found

3. **Add custom summaries:**
   - Use the Supabase dashboard to insert rows directly
   - Or implement API endpoints to add summaries programmatically

## Filtering

Each tab supports multiple filters:

### All Tab
- Search by title/content
- Date range (from/to)

### Zoom Tab
- Search by meeting topic or summary
- Filter by participant names
- Date range

### Slack Tab
- Search by summary content
- Filter by channel
- Date range

### Jira Tab
- Search by ticket key or summary
- Filter by priority (Highest, High, Medium, Low, Lowest)
- Filter by status (To Do, In Progress, In Review, Done)
- Date range

## Development Notes

- Uses shared Supabase client (`/shared/supabase-client.js`)
- RLS policies enable public read, authenticated write
- All components from shared registry (no custom HTML components)
- DRY compliance: no duplicate code or styles
- Seed data in JSON format for easy testing

## Future Enhancements

- Real-time updates via Supabase subscriptions
- Cron jobs to auto-populate from Zoom/Slack/Jira APIs
- User preferences and saved filters
- Export summaries to PDF/Markdown
- Advanced analytics and insights
