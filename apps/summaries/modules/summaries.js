// Summaries module - data formatting and organization
// Handles grouping, filtering, and presentation

const Summaries = (() => {
  // Format date to readable string
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatOptions = { month: 'short', day: 'numeric' };
    const dateOnly = date.toDateString().slice(0, 10);
    const todayStr = today.toDateString().slice(0, 10);
    const yesterdayStr = yesterday.toDateString().slice(0, 10);

    if (dateOnly === todayStr) {
      return 'Today';
    } else if (dateOnly === yesterdayStr) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', formatOptions);
    }
  }

  // Group summaries by day
  function groupByDay(summaries) {
    const grouped = {};

    summaries.forEach(item => {
      const dayKey = new Date(item.created_at).toDateString().slice(0, 10);
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(item);
    });

    // Sort by date descending
    const sorted = Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({
        date,
        label: formatDate(date),
        summaries: grouped[date]
      }));

    return sorted;
  }

  // Get display title based on source
  function getTitle(item) {
    switch (item.source) {
      case 'zoom':
        return item.meeting_topic;
      case 'slack':
        return item.short_summary;
      case 'jira':
        return item.ticket_key;
      default:
        return 'Summary';
    }
  }

  // Get source metadata
  function getSourceMetadata(item) {
    switch (item.source) {
      case 'zoom':
        return {
          icon: '📹',
          label: 'Zoom Meeting',
          details: ''
        };
      case 'slack':
        return {
          icon: '💬',
          label: 'Slack Thread',
          details: `Channel: ${item.channel_id || 'unknown'}`
        };
      case 'jira':
        return {
          icon: '🎯',
          label: 'Jira Ticket',
          details: item.ticket_key
        };
      default:
        return {
          icon: '📄',
          label: 'Summary',
          details: ''
        };
    }
  }

  // Get short summary text
  function getShortSummary(item) {
    switch (item.source) {
      case 'zoom':
        return item.short_summary || 'No summary available';
      case 'slack':
        return item.short_summary || 'No summary available';
      case 'jira':
        return item.short_summary || 'No summary available';
      default:
        return 'No summary available';
    }
  }

  // Get long summary text
  function getLongSummary(item) {
    switch (item.source) {
      case 'zoom':
        return item.long_summary || 'No detailed summary available';
      case 'slack':
        return item.long_summary || 'No detailed summary available';
      case 'jira':
        return item.long_summary || 'No detailed summary available';
      default:
        return 'No detailed summary available';
    }
  }

  // Get action items / details
  function getDetails(item) {
    switch (item.source) {
      case 'zoom':
        return {
          label1: 'Action Items',
          items1: item.action_items || [],
          label2: 'Key Decisions',
          items2: item.key_decisions || []
        };
      case 'slack':
        return {
          label1: 'Tone',
          items1: item.tone ? [item.tone] : [],
          label2: 'Participants',
          items2: item.participants || []
        };
      case 'jira':
        return {
          label1: 'Priority',
          items1: item.priority ? [item.priority] : [],
          label2: 'Status',
          items2: item.status ? [item.status] : []
        };
      default:
        return {
          label1: 'Details',
          items1: [],
          label2: 'Info',
          items2: []
        };
    }
  }

  // Get display pills
  function getPills(item) {
    const pills = [];

    switch (item.source) {
      case 'zoom':
        pills.push({
          text: '📹 Zoom',
          className: 'source'
        });
        break;
      case 'slack':
        pills.push({
          text: '💬 Slack',
          className: 'source'
        });
        if (item.tone) {
          pills.push({
            text: item.tone,
            className: `tone-${item.tone}`
          });
        }
        break;
      case 'jira':
        pills.push({
          text: '🎯 Jira',
          className: 'source'
        });
        if (item.priority) {
          pills.push({
            text: item.priority,
            className: `priority-${item.priority}`
          });
        }
        if (item.status) {
          pills.push({
            text: item.status.replace('_', ' '),
            className: `status-${item.status}`
          });
        }
        break;
    }

    return pills;
  }

  return {
    groupByDay,
    formatDate,
    getTitle,
    getSourceMetadata,
    getShortSummary,
    getLongSummary,
    getDetails,
    getPills
  };
})();

window.Summaries = Summaries;
