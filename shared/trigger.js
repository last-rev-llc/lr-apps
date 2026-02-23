/**
 * trigger.js — Send tasks to the AI agent from any app
 * 
 * Uses Supabase trigger_queue table. A cron job polls for pending items,
 * processes them, and delivers results to Slack.
 * 
 * Usage:
 *   <script src="https://shared.adam-harris.alphaclaw.app/supabase-client.js"></script>
 *   <script src="https://shared.adam-harris.alphaclaw.app/trigger.js"></script>
 *   
 *   trigger('Build me a dashboard for tracking sales');
 *   trigger('Research competitors', { context: 'travel-collection' });
 */

async function trigger(message, opts = {}) {
  if (!message || typeof message !== 'string') {
    throw new Error('Message is required');
  }

  const fullMessage = opts.context
    ? `[From ${opts.context}] ${message}`
    : `[From ${location.hostname}] ${message}`;

  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized — add supabase-client.js before trigger.js');
    }

    await window.supabase.upsert('trigger_queue', {
      id: crypto.randomUUID(),
      message: fullMessage,
      source: opts.context || location.hostname,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    if (opts.onSent) opts.onSent();

    // Show toast if available
    if (!opts.silent) {
      const toast = document.querySelector('cc-toast');
      if (toast && toast.show) {
        toast.show('⚡ Task queued for Claudia', 'success');
      } else if (window.showToast) {
        window.showToast('⚡ Task queued for Claudia');
      }
    }

    return true;
  } catch (e) {
    console.error('trigger() failed:', e);
    if (opts.onError) opts.onError(e.message);
    return false;
  }
}

window.trigger = trigger;
