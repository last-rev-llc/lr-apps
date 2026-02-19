class GenAlpha extends HTMLElement {
  static EVOLUTION_PATTERNS = [
    { id: 'shortening', name: 'Shortening', emoji: '✂️', desc: 'Long words get chopped down to 1-2 syllables', examples: ['"suspicious" → "sus"', '"delusional" → "delulu"', '"legitimate" → "legit"', '"emotional" → "emo"'] },
    { id: 'verbifying', name: 'Verbifying', emoji: '🔄', desc: 'Nouns become verbs through usage', examples: ['"rizz" → "rizzing someone up"', '"ratio" → "ratioed"', '"ghost" → "ghosting"', '"stan" → "stanning"'] },
    { id: 'ironic-reuse', name: 'Ironic Reuse', emoji: '🎭', desc: 'Old words get completely new meanings', examples: ['"slay" (violent) → "slay" (kill it)', '"sick" (ill) → "sick" (awesome)', '"fire" (danger) → "fire" (great)', '"ate" (eating) → "ate" (nailed it)'] },
    { id: 'tiktok-sound', name: 'TikTok Sound Origins', emoji: '🎵', desc: 'Phrases from viral sounds become everyday slang', examples: ['"skibidi" from a viral video', '"oh no" from a TikTok sound', '"it\'s corn" from an interview remix', '"demure" from a viral TikTok'] },
    { id: 'gaming-crossover', name: 'Gaming Crossover', emoji: '🎮', desc: 'Gaming terms enter mainstream vocabulary', examples: ['"NPC" = boring person', '"sigma" = lone wolf', '"ratio" = getting owned', '"nerf" = make weaker'] },
    { id: 'mashups', name: 'Mashups', emoji: '🧬', desc: 'Combining existing terms into new compounds', examples: ['"looksmaxxing" = looks + maxxing', '"mewing" = jawline exercise trend', '"fanum tax" = taking someone\'s food', '"brain rot" = too much internet'] },
    { id: 'letter-reduction', name: 'Letter/Emoji Reduction', emoji: '🔤', desc: 'Whole concepts compressed to single letters or emojis', examples: ['"win" → "W"', '"loss" → "L"', '"skull" emoji = "I\'m dead"', '"cap" 🧢 = lying'] },
    { id: 'suffix-core', name: '-core/-maxxing/-pilled', emoji: '🏷️', desc: 'Productive suffixes that create infinite new terms', examples: ['"cottagecore" = rural aesthetic', '"looksmaxxing" = optimizing appearance', '"based-pilled" = deeply based', '"goblincore" = messy aesthetic'] }
  ];

  static PRESEEDED_PREDICTIONS = [
    { term: 'accounty', definition: 'Shortened form of "accountability" — used when calling someone out or holding them responsible', pattern: 'shortening', example: '"Nah you said you\'d show up, that\'s your accounty fr"', likelihood: 7, evolved_from: 'accountability', gen_x: 'Taking responsibility' },
    { term: 'sleepmaxxing', definition: 'Obsessively optimizing your sleep schedule, environment, and habits for maximum rest', pattern: 'suffix-core', example: '"Can\'t come out tonight, I\'m sleepmaxxing — 9pm bedtime no cap"', likelihood: 9, evolved_from: 'looksmaxxing pattern', gen_x: 'Getting your beauty sleep' },
    { term: 'lorecore', definition: 'Aesthetic centered around having deep, complex personal backstory and mystery', pattern: 'suffix-core', example: '"She never talks about her past, very lorecore"', likelihood: 7, evolved_from: 'cottagecore pattern', gen_x: 'Being mysterious' },
    { term: 'yoinking', definition: 'Quickly taking or claiming something before anyone else can', pattern: 'verbifying', example: '"I\'m yoinking that last slice before fanum tax hits"', likelihood: 8, evolved_from: 'yoink (gaming/Twitch)', gen_x: 'Dibs / called it' },
    { term: 'clipped', definition: 'Getting caught doing something embarrassing, like someone recorded it', pattern: 'gaming-crossover', example: '"Bro tripped in front of everyone, absolutely clipped 💀"', likelihood: 8, evolved_from: 'clip (streaming term)', gen_x: 'Busted / caught on camera' },
    { term: 'ludi', definition: 'Short for "ludicrous" — something so extreme it\'s beyond comprehension', pattern: 'shortening', example: '"The math homework is ludi, I can\'t even start"', likelihood: 5, evolved_from: 'ludicrous', gen_x: 'Outrageous' },
    { term: 'spawn point', definition: 'The place you always end up, your default hangout or home', pattern: 'gaming-crossover', example: '"Meet at my spawn point after school"', likelihood: 7, evolved_from: 'spawn (gaming)', gen_x: 'Crib / pad' },
    { term: 'buffed', definition: 'When someone glows up or gets an upgrade in any way', pattern: 'gaming-crossover', example: '"She came back from summer break absolutely buffed"', likelihood: 8, evolved_from: 'buff (gaming — make stronger)', gen_x: 'Glow up' },
    { term: 'plotmaxxing', definition: 'Strategically engineering dramatic situations in your life for entertainment', pattern: 'suffix-core', example: '"She texted both of them at the same time — full plotmaxxing"', likelihood: 6, evolved_from: 'plot + maxxing', gen_x: 'Stirring the pot' },
    { term: 'canon', definition: 'When something becomes officially true or accepted as fact in your friend group', pattern: 'gaming-crossover', example: '"They held hands at lunch — it\'s canon now"', likelihood: 9, evolved_from: 'canon (fandom/gaming)', gen_x: 'Official / going steady' },
    { term: 'defo', definition: 'Ultra-short form of "definitely" — even shorter than "def"', pattern: 'shortening', example: '"You coming to the party?" "Defo"', likelihood: 7, evolved_from: 'definitely', gen_x: 'Totally / for sure' },
    { term: 'griefing', definition: 'Deliberately annoying or sabotaging someone in real life, not just games', pattern: 'gaming-crossover', example: '"He hid my backpack again, always griefing me"', likelihood: 8, evolved_from: 'griefing (Minecraft/gaming)', gen_x: 'Messing with someone' },
    { term: 'aurapilled', definition: 'Someone who is deeply aware of and obsessed with vibes and energy', pattern: 'suffix-core', example: '"She won\'t enter a room without checking the energy — fully aurapilled"', likelihood: 6, evolved_from: 'aura + pilled', gen_x: 'New Age-y / spiritual' },
    { term: 'lobby', definition: 'Your current social situation or the group of people around you', pattern: 'gaming-crossover', example: '"This lobby is dead, let\'s go somewhere else"', likelihood: 8, evolved_from: 'game lobby', gen_x: 'Scene / crew' },
    { term: 'softlocked', definition: 'Stuck in a situation with no good options but technically not impossible to escape', pattern: 'gaming-crossover', example: '"Teacher asked me a question I didn\'t know — completely softlocked"', likelihood: 7, evolved_from: 'soft lock (gaming)', gen_x: 'Between a rock and a hard place' },
    { term: 'anxietycore', definition: 'Aesthetic or lifestyle centered around being perpetually stressed and overwhelmed', pattern: 'suffix-core', example: '"Three tests tomorrow and practice — I\'m so anxietycore rn"', likelihood: 6, evolved_from: '-core suffix', gen_x: 'Stressed out / neurotic' },
    { term: 'procrastimaxxing', definition: 'Elevating procrastination to an art form, being incredibly productive at everything except what you should be doing', pattern: 'suffix-core', example: '"I cleaned my whole room instead of studying — procrastimaxxing hard"', likelihood: 7, evolved_from: 'procrastination + maxxing', gen_x: 'Slacking off' },
    { term: 'D', definition: 'Single letter for "defeat" or "disappointment" — evolution beyond W and L', pattern: 'letter-reduction', example: '"Asked her out and she said no. Massive D." "...phrasing?"', likelihood: 4, evolved_from: 'W/L pattern', gen_x: 'Bummer' },
    { term: 'perma', definition: 'Short for permanent — when something is a lasting state or decision', pattern: 'shortening', example: '"That haircut is perma bad, no recovery"', likelihood: 7, evolved_from: 'permanent / permaban (gaming)', gen_x: 'Forever / for good' },
    { term: 'aggro', definition: 'Being unnecessarily hostile or confrontational (already gaming, going mainstream)', pattern: 'gaming-crossover', example: '"Why is the substitute teacher so aggro today??"', likelihood: 9, evolved_from: 'aggro (MMO gaming)', gen_x: 'Hostile / in your face' }
  ];

  static TRENDSETTER_PATTERNS = [
    { id: 'abbreviation', name: 'Abbreviation', emoji: '✂️', desc: 'Multi-syllable words get ruthlessly shortened', lineage: ['Boomers: "television" → "TV"', 'Gen X: "whatever" → "whatevs"', 'Millennials: "suspicious" → "sus"', 'Gen Alpha: "accountability" → "accounty"'], nextWave: 'Expect 4+ syllable words to lose 60% of their letters' },
    { id: 'semantic-drift', name: 'Semantic Drift', emoji: '🌊', desc: 'Words shift meaning entirely across generations', lineage: ['1950s: "cool" = temperature', '1970s: "cool" = good/hip', '2000s: "sick" = awesome', '2020s: "slay" = nailed it'], nextWave: 'Negative words becoming ultimate compliments accelerates' },
    { id: 'phonetic-respelling', name: 'Phonetic Respelling', emoji: '🔊', desc: 'Words respelled to match how they sound spoken fast', lineage: ['90s: "phat" (pretty hot and tempting)', '2000s: "boi" for "boy"', '2010s: "thicc" for "thick"', '2020s: "skibidi" (onomatopoeia)'], nextWave: 'Double letters and -ii endings replace standard spelling' },
    { id: 'suffix-grafting', name: 'Suffix Grafting', emoji: '🧬', desc: 'Productive suffixes attach to any noun/verb to create infinite terms', lineage: ['2000s: "-gate" (Watergate → any scandal)', '2010s: "-core" (cottagecore, goblincore)', '2020s: "-maxxing" (looksmaxxing, sleepmaxxing)', '2020s: "-pilled" (based-pilled, aurapilled)'], nextWave: 'New suffixes like -rotted, -coded, -era emerging' },
    { id: 'platform-leak', name: 'Platform Leak', emoji: '📱', desc: 'UI/UX terms from apps become real-life vocabulary', lineage: ['2000s: "unfriend" from Facebook', '2010s: "swipe right" from Tinder', '2020s: "ratio" from Twitter', '2020s: "FYP" from TikTok'], nextWave: 'AI terms (hallucinate, prompt, fine-tune) entering slang' },
    { id: 'compression', name: 'Emotional Compression', emoji: '💥', desc: 'Complex emotions reduced to single symbols or sounds', lineage: ['2000s: LOL, OMG, BRB', '2010s: 😂 replaced "haha"', '2020s: 💀 = "I\'m dead laughing"', '2020s: W/L = entire judgment'], nextWave: 'Single Unicode characters may replace whole sentences' }
  ];

  static TRENDSETTER_PREDICTIONS = [
    { term: 'promptbrain', pattern: 'platform-leak', confidence: 8, definition: 'Someone who thinks in AI prompts — always optimizing how they phrase things to get what they want', example: '"She asked the teacher for extra credit like a promptbrain — perfect wording, instant yes"', evolution: '"prompt" (AI) → verb/identity → describes strategic communicators', genXsaid: 'Smooth talker / Silver tongue', emerged: 'AI culture + social engineering' },
    { term: 'unrender', pattern: 'platform-leak', confidence: 7, definition: 'To mentally erase something you saw — choosing to forget or ignore it', example: '"I saw his search history and I need to unrender that immediately 💀"', evolution: '"render" (3D/gaming) → "unrender" = reverse the mental image', genXsaid: 'Unsee / brain bleach', emerged: 'Gaming/3D culture' },
    { term: 'rotted', pattern: 'suffix-grafting', confidence: 9, definition: 'Suffix meaning deeply affected by something — "brain-rotted" shortened, now attaches to anything', example: '"She\'s so Disney-rotted she cried at the theme park entrance"', evolution: '"brain rot" → "-rotted" as productive suffix', genXsaid: 'Obsessed / gone off the deep end', emerged: 'Brain rot meme culture' },
    { term: 'glazeproof', pattern: 'suffix-grafting', confidence: 6, definition: 'Immune to compliments and flattery — can\'t be buttered up', example: '"Don\'t even try, coach is completely glazeproof"', evolution: '"glaze" (excessive praise) + "-proof" (immune)', genXsaid: 'Can\'t be sweet-talked', emerged: 'Glaze/glazing slang' },
    { term: 'yapping', pattern: 'semantic-drift', confidence: 9, definition: 'Talking way too much about nothing — evolved from meaning "small dog barking" to "verbal diarrhea"', example: '"Bro wrote a 6-paragraph text about his lunch, absolute yapping"', evolution: '"yap" (bark) → "yapping" (talking nonsense) → universal dismissal', genXsaid: 'Running your mouth / motor mouth', emerged: 'Already emerging 2024' },
    { term: 'cooked', pattern: 'semantic-drift', confidence: 9, definition: 'Beyond saving — completely done, ruined, or destroyed. Opposite of "cooking" (doing well)', example: '"I didn\'t study for any of my finals. I\'m absolutely cooked."', evolution: '"cooking" (doing great) → "cooked" (past tense = already happened = too late)', genXsaid: 'Toast / done for', emerged: 'Gaming/streaming culture' },
    { term: 'speedran', pattern: 'platform-leak', confidence: 8, definition: 'Did something incredibly fast — from gaming speedruns applied to real life', example: '"She speedran that breakup — together Monday, single Tuesday"', evolution: '"speedrun" (gaming) → past tense verb for any rapid completion', genXsaid: 'Blew through it / knocked it out', emerged: 'Gaming/Twitch culture' },
    { term: 'phantom', pattern: 'phonetic-respelling', confidence: 5, definition: 'A more dramatic evolution of "ghosting" — disappearing so completely people question if you existed', example: '"He didn\'t just ghost, he went full phantom — deleted all socials"', evolution: '"ghost" → "phantom" (escalation of disappearance concept)', genXsaid: 'Vanished / pulled a Houdini', emerged: 'Ghosting culture evolution' },
    { term: 'lore-dump', pattern: 'platform-leak', confidence: 7, definition: 'When someone gives you their entire backstory unprompted — from gaming/anime narrative exposition', example: '"I asked how her weekend was and got a 20-minute lore dump about her ex"', evolution: '"lore" (game/anime story) → "lore dump" = excessive personal backstory', genXsaid: 'TMI / life story', emerged: 'Fandom/gaming culture' },
    { term: 'AI-coded', pattern: 'suffix-grafting', confidence: 7, definition: 'When someone acts robotic, gives perfect but soulless responses, or seems artificially pleasant', example: '"Her apology was so AI-coded — grammatically perfect but zero emotion"', evolution: '"-coded" suffix (villain-coded, etc.) + AI awareness', genXsaid: 'Fake / plastic / Stepford', emerged: 'AI ubiquity culture' },
    { term: 'deload', pattern: 'abbreviation', confidence: 6, definition: 'Taking a mental health break — from gym culture "deload week" applied to life', example: '"Can\'t hang this weekend, I\'m on a deload — zero screen time"', evolution: '"deload" (fitness) → mental/social recovery period', genXsaid: 'Taking a breather / mental health day', emerged: 'Fitness/wellness crossover' },
    { term: 'patch notes', pattern: 'platform-leak', confidence: 8, definition: 'Updates about changes in your life — from game update logs', example: '"Patch notes: new job, new haircut, deleted Twitter. Major update."', evolution: '"patch notes" (software/gaming) → personal life changelog', genXsaid: 'What\'s new / the latest', emerged: 'Gaming culture' },
    { term: 'nerfed', pattern: 'platform-leak', confidence: 8, definition: 'When something that was great gets worse — from gaming balance changes', example: '"They nerfed the school lunch menu — no more pizza Fridays"', evolution: '"nerf" (make weaker in games) → anything that got downgraded', genXsaid: 'Watered down / ruined', emerged: 'Gaming → mainstream' },
    { term: 'vaultedd', pattern: 'phonetic-respelling', confidence: 5, definition: 'Something so embarrassing it needs to be locked away forever — double-d for emphasis', example: '"That video of me at prom needs to be vaultedd immediately"', evolution: '"vault" (lock away) + phonetic doubling for emphasis', genXsaid: 'Bury it / take it to the grave', emerged: 'Fortnite vault mechanic + emphasis spelling' },
    { term: 'side-quest', pattern: 'platform-leak', confidence: 9, definition: 'An unplanned detour or adventure — from RPG gaming applied to daily life', example: '"Went to get groceries and ended up on a 3-hour side quest at the thrift store"', evolution: '"side quest" (gaming) → spontaneous real-life adventure', genXsaid: 'Detour / got sidetracked', emerged: 'RPG/gaming culture, already emerging' },
    { term: 'OP', pattern: 'compression', confidence: 8, definition: 'Overpowered — someone or something that\'s unfairly good at what they do', example: '"The new math teacher is OP — makes calculus actually make sense"', evolution: '"overpowered" (gaming balance) → compliment for exceptional ability', genXsaid: 'Killer / unstoppable', emerged: 'Gaming/anime culture' }
  ];

  static GEN_X_MAP = {
    'skibidi': 'Gnarly / Radical',
    'rizz': 'Game / Mack Daddy',
    'bussin': 'Da Bomb / Phat',
    'no-cap': 'Word / Keeping It Real',
    'sus': 'Sketchy',
    'slay': 'Fly / All That',
    'bet': 'Word / Aight',
    'mid': 'Wack / Whatever',
    'brainrot': 'Couch Potato / Vegging Out',
    'fanum-tax': 'Bogart',
    'ohio': 'Twilight Zone',
    'sigma': 'Lone Wolf',
    'gyatt': 'Schwing',
    'mewing': 'Keeping It Real',
    'aura': 'Vibe',
    'ratio': 'Diss / Burn',
    'cap': 'NOT! / Psych!',
    'delulu': "Trippin'",
    'w': 'Booyah',
    'l': 'Bummer',
    'npc': 'Scrub / Poser',
    'goat': 'All That and a Bag of Chips',
    'fire': 'Da Bomb / Dope',
    'drip': 'Fly / Fresh',
    'hits-different': 'Phat / Tight',
    'vibe-check': "What's the 411",
    'ate': 'Killed It / Nailed It',
    'ick': 'Gag Me with a Spoon',
    'stan': 'Groupie / Super Fan',
    'ghosting': 'Bounce / Dip',
    'yeet': 'Chuck / Hurl',
    'flex': "Frontin' / Showing Off",
    'simp': 'Whipped',
    'based': 'Radical / Keeping It Real',
    'lowkey': 'On the DL',
    'highkey': 'Totally / Hella',
    'sending-me': 'Cracking Up',
    'understood-the-assignment': 'Nailed It',
    'main-character': 'All That',
    'touch-grass': 'Take a Chill Pill',
    'rent-free': 'Living In Your Head',
    'caught-in-4k': 'Busted',
    'periodt': 'Word / Fo Shizzle'
  };

  constructor() {
    super();
    this.slang = [];
    this.filtered = [];
    this.activeTab = 'dictionary';
    this.searchTerm = '';
    this.activeCategory = 'all';
    this.quizState = null;
  }

  _esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }

  connectedCallback() {
    this.loadData();
  }

  async loadData() {
    try {
      // Try to init database first
      this.db = await GenAlphaDB.init();
      const rows = await this.db.getAll();
      
      if (rows && rows.length > 0) {
        // Use database data if available
        this.slang = rows.map(r => ({
          ...r,
          vibeScore: r.vibe_score ?? r.vibeScore ?? 0,
          createdAt: r.created_at ?? r.createdAt,
          updatedAt: r.updated_at ?? r.updatedAt
        }));
      } else {
        // Fallback to slang.json if database is empty
        console.log('Database empty, loading from slang.json...');
        const response = await fetch('data/slang.json');
        if (!response.ok) throw new Error('Failed to load slang.json');
        this.slang = await response.json();
      }
      
      this.filtered = [...this.slang];
      this.render();
    } catch (e) {
      console.error('GenAlpha load error:', e);
      // Final fallback: try to load from slang.json directly
      try {
        console.log('Attempting fallback to slang.json...');
        const response = await fetch('data/slang.json');
        if (!response.ok) throw new Error('Failed to load slang.json');
        this.slang = await response.json();
        this.filtered = [...this.slang];
        this.render();
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError);
        this.innerHTML = `<cc-empty-state message="Failed to load slang data" icon="😵"></cc-empty-state>`;
      }
    }
  }

  get categories() {
    return ['all', ...new Set(this.slang.map(s => s.category))];
  }

  filterSlang() {
    let r = [...this.slang];
    if (this.activeCategory !== 'all') r = r.filter(s => s.category === this.activeCategory);
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      r = r.filter(s =>
        s.term.toLowerCase().includes(q) ||
        s.definition.toLowerCase().includes(q) ||
        (s.aliases || []).some(a => a.toLowerCase().includes(q))
      );
    }
    this.filtered = r;
  }

  vibeBar(score) {
    const colors = ['#ef4444','#f97316','#eab308','#84cc16','#22c55e','#06b6d4','#8b5cf6','#ec4899','#f43f5e','#10b981'];
    const c = colors[score - 1] || '#8b5cf6';
    return `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
      <span style="font-size:11px;color:var(--muted);">Vibe</span>
      <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
        <div style="width:${score * 10}%;height:100%;background:${c};border-radius:3px;"></div>
      </div>
      <span style="font-size:12px;font-weight:700;color:${c};">${score}/10</span>
    </div>`;
  }

  categoryColor(cat) {
    const m = { compliment: '#22c55e', insult: '#ef4444', reaction: '#eab308', lifestyle: '#8b5cf6', 'internet culture': '#06b6d4' };
    return m[cat] || '#6b7280';
  }

  categoryEmoji(cat) {
    const m = { compliment: '💚', insult: '💀', reaction: '⚡', lifestyle: '✨', 'internet culture': '🌐' };
    return m[cat] || '📝';
  }

  render() {
    this.innerHTML = `
      <style>
        .ga-wrap{max-width:1100px;margin:20px auto;padding:0 16px;}
        .ga-header{text-align:center;margin-bottom:28px;}
        .ga-header h1{font-family:var(--serif);font-size:2.2rem;margin:0;}
        .ga-header p{color:var(--muted);margin:4px 0 0;}
        .ga-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;}
        .ga-term{font-size:1.3rem;font-weight:800;margin:0 0 4px;}
        .ga-def{color:var(--text);font-size:14px;line-height:1.5;margin:8px 0;}
        .ga-example{font-style:italic;color:var(--muted);font-size:13px;background:rgba(255,255,255,.04);padding:8px 12px;border-radius:8px;margin:8px 0;}
        .ga-origin{font-size:11px;color:var(--muted);margin-top:8px;}
        .ga-aliases{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;}
        .ga-alias{font-size:11px;padding:2px 8px;background:rgba(255,255,255,.06);border-radius:6px;color:var(--muted);}
        .ga-cat-badge{display:inline-block;font-size:11px;padding:3px 10px;border-radius:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
        .ga-translator{max-width:700px;margin:0 auto;}
        .ga-textarea{width:100%;min-height:120px;padding:16px;border-radius:12px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);font-size:15px;font-family:inherit;resize:vertical;outline:none;box-sizing:border-box;}
        .ga-textarea:focus{border-color:var(--accent);}
        .ga-dir-toggle{display:flex;gap:0;margin-bottom:20px;border-radius:10px;overflow:hidden;border:1px solid var(--border);}
        .ga-dir-btn{flex:1;padding:10px;text-align:center;background:var(--card-bg);cursor:pointer;font-size:13px;font-weight:600;transition:all .2s;border:none;color:var(--text);}
        .ga-dir-btn.active{background:var(--accent);color:#000;}
        .ga-quiz-card{max-width:600px;margin:0 auto;text-align:center;}
        .ga-quiz-q{font-size:1.4rem;font-weight:700;margin:20px 0;font-family:var(--serif);}
        .ga-quiz-options{display:grid;gap:10px;margin:20px 0;}
        .ga-quiz-opt{padding:14px 20px;border-radius:10px;border:1px solid var(--border);background:var(--card-bg);cursor:pointer;font-size:14px;text-align:left;transition:all .2s;color:var(--text);}
        .ga-quiz-opt:hover{border-color:var(--accent);background:rgba(245,158,11,.08);color:var(--text);}
        .ga-quiz-opt.correct{border-color:#22c55e;background:rgba(34,197,94,.15);color:var(--text);}
        .ga-quiz-opt.wrong{border-color:#ef4444;background:rgba(239,68,68,.15);color:var(--text);}
        .ga-quiz-progress{display:flex;gap:6px;justify-content:center;margin:20px 0;}
        .ga-quiz-dot{width:10px;height:10px;border-radius:50%;background:var(--border);}
        .ga-quiz-dot.done{background:#22c55e;}
        .ga-quiz-dot.current{background:var(--accent);box-shadow:0 0 8px var(--accent);}
        .ga-quiz-dot.wrong-dot{background:#ef4444;}
        .ga-quiz-score{font-size:3rem;font-weight:900;margin:10px 0;}
        .ga-trending-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
        .ga-trend-card{background:var(--card-bg);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
        .ga-trend-card:hover{border-color:var(--accent);transform:translateY(-3px);}
        .ga-trend-term{font-size:1.1rem;font-weight:800;margin:0 0 4px;}
        .ga-trend-score{font-size:2rem;font-weight:900;opacity:.2;position:absolute;top:8px;right:12px;}
        .ga-trend-bar{height:4px;border-radius:2px;margin-top:10px;}
        .ga-count{font-size:13px;color:var(--muted);margin:16px 0 0;text-align:center;}
        .ga-lab-section{margin-bottom:36px;}
        .ga-lab-section h2{font-family:var(--serif);margin:0 0 6px;}
        .ga-lab-section>p{color:var(--muted);font-size:14px;margin:0 0 20px;}
        .ga-pattern-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;}
        .ga-pattern-card{background:var(--card-bg);border:1px solid var(--border);border-radius:14px;padding:18px;transition:all .2s;}
        .ga-pattern-card:hover{border-color:var(--accent);transform:translateY(-2px);}
        .ga-pattern-emoji{font-size:1.6rem;}
        .ga-pattern-name{font-weight:800;font-size:1rem;margin:6px 0 4px;}
        .ga-pattern-desc{font-size:13px;color:var(--muted);line-height:1.4;margin-bottom:10px;}
        .ga-pattern-ex{font-size:12px;color:var(--muted);padding:3px 0;font-style:italic;}
        .ga-pred-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;}
        .ga-pred-card{background:var(--card-bg);border:1px solid var(--border);border-radius:14px;padding:18px;position:relative;transition:all .2s;}
        .ga-pred-card:hover{border-color:var(--accent);}
        .ga-pred-term{font-size:1.3rem;font-weight:800;margin:0 0 4px;}
        .ga-pred-pattern{display:inline-block;font-size:11px;padding:3px 10px;border-radius:8px;background:rgba(139,92,246,.15);color:#8b5cf6;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
        .ga-pred-def{font-size:14px;color:var(--text);line-height:1.5;margin:10px 0;}
        .ga-pred-example{font-style:italic;color:var(--muted);font-size:13px;background:rgba(255,255,255,.04);padding:8px 12px;border-radius:8px;margin:8px 0;}
        .ga-pred-meta{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--muted);margin-top:10px;}
        .ga-pred-evolved{font-size:12px;color:var(--muted);margin-top:6px;}
        .ga-likelihood{display:flex;align-items:center;gap:6px;margin-top:8px;}
        .ga-likelihood-label{font-size:11px;color:var(--muted);}
        .ga-likelihood-bar{flex:1;max-width:120px;height:6px;background:var(--border);border-radius:3px;overflow:hidden;}
        .ga-likelihood-fill{height:100%;border-radius:3px;}
        .ga-likelihood-num{font-size:12px;font-weight:700;}
        .ga-vote-row{display:flex;gap:8px;margin-top:12px;align-items:center;}
        .ga-vote-btn{background:none;border:1px solid var(--border);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:13px;color:var(--text);transition:all .2s;}
        .ga-vote-btn:hover{border-color:var(--accent);background:rgba(245,158,11,.08);}
        .ga-vote-btn.voted{border-color:#22c55e;background:rgba(34,197,94,.12);color:#22c55e;}
/* toast styles removed - using shared cc-toast */
        @media(max-width:600px){.ga-grid{grid-template-columns:1fr;}.ga-trending-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));}.ga-pattern-grid{grid-template-columns:1fr;}.ga-pred-grid{grid-template-columns:1fr;}}
      </style>
      <div class="ga-wrap">
        <cc-fade-in>
        <div class="ga-header">
          <h1>🧠 GenAlpha Brainrot Dictionary</h1>
          <p>No cap, this is the most bussin slang reference fr fr</p>
        </div>
        </cc-fade-in>
        
        <cc-tabs active="${this.activeTab}" no-url>
          <cc-tab name="dictionary" label="📖 Dictionary" icon="book">
            <div id="dictionary-content"></div>
          </cc-tab>
          <cc-tab name="translator" label="🔄 Translator" icon="repeat">
            <div id="translator-content"></div>
          </cc-tab>
          <cc-tab name="quiz" label="🧠 Brainrot Quiz" icon="brain">
            <div id="quiz-content"></div>
          </cc-tab>
          <cc-tab name="trending" label="🔥 Trending" icon="trending-up">
            <div id="trending-content"></div>
          </cc-tab>
          <cc-tab name="slang-lab" label="🧪 Slang Lab" icon="flask">
            <div id="slang-lab-content"></div>
          </cc-tab>
          <cc-tab name="trendsetter" label="🔮 Trendsetter" icon="crystal-ball">
            <div id="trendsetter-content"></div>
          </cc-tab>
        </cc-tabs>
      </div>
    `;

    // Listen for tab changes and render content
    this.addEventListener('tab-change', (e) => {
      this.activeTab = e.detail.tab;
      if (e.detail.tab === 'quiz' && !this.quizState) this.startQuiz();
      this.renderTabContent();
    });

    // Initial render
    this.renderTabContent();
  }

  renderTabContent() {
    const dictionaryContent = this.querySelector('#dictionary-content');
    const translatorContent = this.querySelector('#translator-content');
    const quizContent = this.querySelector('#quiz-content');
    const trendingContent = this.querySelector('#trending-content');
    const slangLabContent = this.querySelector('#slang-lab-content');
    const trendsetterContent = this.querySelector('#trendsetter-content');

    if (this.activeTab === 'dictionary' && dictionaryContent) this.renderDictionary(dictionaryContent);
    else if (this.activeTab === 'translator' && translatorContent) this.renderTranslator(translatorContent);
    else if (this.activeTab === 'quiz' && quizContent) this.renderQuiz(quizContent);
    else if (this.activeTab === 'trending' && trendingContent) this.renderTrending(trendingContent);
    else if (this.activeTab === 'slang-lab' && slangLabContent) this.renderSlangLab(slangLabContent);
    else if (this.activeTab === 'trendsetter' && trendsetterContent) this.renderTrendsetter(trendsetterContent);
  }

  renderDictionary(el) {
    this.filterSlang();
    const catItems = this.categories.map(c => c === 'all' ? {value:'all',label:'All'} : {value:c,label:c});
    el.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <cc-search placeholder="Search slang terms..." value="${this._escAttr(this.searchTerm)}"></cc-search>
        <cc-view-toggle app="gen-alpha" value="${this._dictView || 'cards'}"></cc-view-toggle>
      </div>
      <cc-pill-dropdown label="Category" items='${this._escAttr(JSON.stringify(catItems))}' value="${this._escAttr(this.activeCategory)}"></cc-pill-dropdown>
      <div class="ga-count">${this.filtered.length} term${this.filtered.length !== 1 ? 's' : ''} found</div>
      ${(this._dictView || 'cards') === 'list' ? `<div class="view-list" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="list-row" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <span class="row-name">${this._esc(s.term)}</span>
            <span class="ga-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};flex-shrink:0;font-size:11px;padding:2px 8px;border-radius:10px;">${this._esc(s.category)}</span>
            <span class="row-desc">${this._esc(s.definition)}</span>
            <span style="font-size:12px;color:var(--muted);flex-shrink:0;">🔥 ${s.vibeScore}/10</span>
          </div>
        `).join('')}
      </div>`
      : (this._dictView) === 'expanded' ? `<div class="view-expanded" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="expanded-card" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
              <div class="ga-term">${this._esc(s.term)}</div>
              <span class="ga-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            </div>
            <div class="ga-def">${this._esc(s.definition)}</div>
            <div class="ga-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="ga-origin">📍 ${this._esc(s.origin)} · ${this._esc(s.era)}</div>
            ${s.aliases && s.aliases.length ? `<div class="ga-aliases">${s.aliases.map(a => `<span class="ga-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
            ${GenAlpha.GEN_X_MAP[s.id] ? `<div style="font-size:12px;color:var(--muted);margin-top:6px;">Gen X equivalent: <strong>${this._esc(GenAlpha.GEN_X_MAP[s.id])}</strong></div>` : ''}
          </div>
        `).join('')}
      </div>`
      : `<cc-stagger animation="fade-up" delay="60">
      <div class="ga-grid" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="card" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div class="ga-term">${this._esc(s.term)}</div>
              <span class="ga-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            </div>
            <div class="ga-def">${this._esc(s.definition)}</div>
            <div class="ga-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="ga-origin">📍 ${this._esc(s.origin)} · ${this._esc(s.era)}</div>
            ${s.aliases && s.aliases.length ? `<div class="ga-aliases">${s.aliases.map(a => `<span class="ga-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>
      </cc-stagger>`}
    `;
    if (!this.filtered.length) {
      const container = el.querySelector('.ga-grid') || el.querySelector('.view-list') || el.querySelector('.view-expanded');
      if (container) container.innerHTML = `<cc-empty-state message="No slang found for that search. That's kinda mid." icon="😵"></cc-empty-state>`;
    }

    el.querySelector('cc-search').addEventListener('cc-search', e => {
      this.searchTerm = e.detail.value;
      this.filterSlang();
      this.renderDictionary(el);
    });
    const vt = el.querySelector('cc-view-toggle');
    if (vt) vt.addEventListener('cc-view-change', e => {
      this._dictView = e.detail.view;
      this.renderDictionary(el);
    });
    el.querySelector('cc-pill-dropdown').addEventListener('dropdown-change', e => {
      this.activeCategory = e.detail.value;
      this.filterSlang();
      this.renderDictionary(el);
    });

    el.querySelectorAll('.card[data-id], .list-row[data-id], .expanded-card[data-id]').forEach(c => {
      c.addEventListener('click', () => {
        const s = this.slang.find(x => x.id === c.dataset.id);
        if (!s) return;
        const eqText = GenAlpha.GEN_X_MAP[s.id] || '';
        const modal = document.createElement('cc-modal');
        modal.setAttribute('title', this._esc(s.term));
        modal.setAttribute('size', 'sm');
        modal.innerHTML = `
          <div style="padding:8px;">
            <span class="ga-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <p class="ga-def" style="margin-top:12px;">${this._esc(s.definition)}</p>
            <div class="ga-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="ga-origin" style="margin-top:12px;">📍 ${this._esc(s.origin)}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--muted);">🕐 ${this._esc(s.era)}</div>
            ${s.aliases?.length ? `<div class="ga-aliases" style="margin-top:8px;">${s.aliases.map(a => `<span class="ga-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
            ${eqText ? `<div style="margin-top:16px;padding:12px 16px;background:rgba(245,158,11,.08);border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">📼 Gen X Said</div>
              <div style="font-size:15px;font-weight:700;color:#f59e0b;">${this._esc(eqText)} 🤙</div>
            </div>` : ''}
          </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.open());
      });
    });
  }

  renderTranslator(el) {
    this._transDir = this._transDir || 'to-gen';
    el.innerHTML = `
      <div class="ga-translator">
        <div class="ga-dir-toggle">
          <button class="ga-dir-btn ${this._transDir === 'to-gen' ? 'active' : ''}" data-dir="to-gen">English → Gen Alpha 🧠</button>
          <button class="ga-dir-btn ${this._transDir === 'from-gen' ? 'active' : ''}" data-dir="from-gen">Gen Alpha → English 📚</button>
        </div>
        <textarea class="ga-textarea" placeholder="${this._transDir === 'to-gen' ? 'Type normal English here...' : 'Type Gen Alpha slang here...'}">${this._transInput || ''}</textarea>
        <div style="text-align:center;">
          <button class="btn btn-primary">Translate 🔥</button>
        </div>
        <div class="ga-result-box" id="ga-trans-result">${this._transResult || '<span style="color:var(--muted);">Translation will appear here no cap</span>'}</div>
      </div>
    `;
    el.querySelectorAll('.ga-dir-btn').forEach(b => {
      b.addEventListener('click', () => { this._transDir = b.dataset.dir; this.renderTranslator(el); });
    });
    el.querySelector('.btn-primary').addEventListener('click', () => {
      const input = el.querySelector('.ga-textarea').value.trim();
      this._transInput = input;
      if (!input) { this._transResult = '<span style="color:var(--muted);">Type something first bestie</span>'; this.renderTranslator(el); return; }
      this._transResult = this._transDir === 'to-gen' ? this.translateToGen(input) : this.translateFromGen(input);
      this.renderTranslator(el);
    });
  }

  _escAttr(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  translateToGen(text) {
    const map = {
      'good': 'bussin', 'great': 'fire', 'amazing': 'slay', 'cool': 'based',
      'awesome': 'goat-level', 'really': 'fr fr', 'very': 'lowkey',
      'suspicious': 'sus', 'lying': 'capping', 'truth': 'no cap',
      'agree': 'bet', 'okay': 'bet', 'yes': 'bet',
      'funny': 'sending me 💀', 'hilarious': 'I\'m dead 💀',
      'attractive': 'got rizz', 'charming': 'W rizz',
      'weird': 'only in Ohio fr', 'strange': 'sus ngl',
      'average': 'mid', 'mediocre': 'mid af',
      'show off': 'flex', 'brag': 'flexing',
      'gossip': 'tea ☕', 'drama': 'the tea is hot',
      'embarrassing': 'cringe', 'awkward': 'giving ick',
      'independent': 'sigma', 'confident': 'main character energy',
      'delusional': 'delulu (but delulu is the solulu)',
      'phase': 'era', 'energy': 'aura',
      'win': 'W', 'lose': 'L', 'loss': 'L',
      'serious': 'no cap', 'honestly': 'ngl',
      'perfect': 'ate and left no crumbs', 'excellent': 'understood the assignment',
      'bad': 'L', 'terrible': 'massive L',
      'food': 'bussin eats', 'eat': 'fanum tax incoming',
      'throw': 'yeet', 'beautiful': 'snatched',
      'fan': 'stan', 'obsessed': 'living for this',
      'crazy': 'brainrot level', 'chaotic': 'skibidi',
      'stop': 'touch grass', 'calm down': 'touch grass fr',
      'handsome': 'mogging everyone', 'pretty': 'slay queen',
      'impressive': 'let him cook', 'talented': 'cooking rn',
      'trying hard': 'looksmaxxing', 'exercise': 'mewing era',
      'obviously': 'highkey', 'secretly': 'lowkey',
      'disgusting': 'ick', 'turn off': 'giving me the ick',
      'compliment': 'glazing', 'praise': 'glazing hard',
      'caught': 'caught in 4K', 'evidence': '4K footage',
      'special': 'hits different', 'unique': 'hits different fr'
    };

    let result = this._esc(text.toLowerCase());
    const sorted = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
    for (const [eng, gen] of sorted) {
      const re = new RegExp(`\\b${eng}\\b`, 'gi');
      result = result.replace(re, `<strong>${this._esc(gen)}</strong>`);
    }
    if (result === this._esc(text.toLowerCase())) {
      return `<strong>${this._esc(text)}</strong> is already giving brainrot energy ngl 🧠`;
    }
    return result + ' 🔥';
  }

  translateFromGen(text) {
    const map = {};
    for (const s of this.slang) {
      map[s.term.toLowerCase()] = s.definition;
      for (const a of (s.aliases || [])) {
        if (a) map[a.toLowerCase()] = s.definition;
      }
    }
    const sorted = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
    let result = this._esc(text);
    let found = false;
    for (const [slang, def] of sorted) {
      const re = new RegExp(`\\b${slang.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (re.test(result)) {
        found = true;
        result = result.replace(re, `<strong title="${this._escAttr(def)}">[${this._esc(def.split('.')[0].trim())}]</strong>`);
      }
    }
    if (!found) return `Hmm, couldn't find any Gen Alpha terms in there. Maybe try: ${this.slang.slice(0, 5).map(s => this._esc(s.term)).join(', ')}`;
    return result;
  }

  startQuiz() {
    const shuffled = [...this.slang].sort(() => Math.random() - 0.5).slice(0, 10);
    this.quizState = {
      questions: shuffled.map(s => {
        const wrong = this.slang.filter(x => x.id !== s.id).sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [s, ...wrong].sort(() => Math.random() - 0.5);
        return { term: s.term, correctId: s.id, options: options.map(o => ({ id: o.id, def: o.definition })) };
      }),
      current: 0,
      score: 0,
      answered: [],
      done: false
    };
  }

  renderQuiz(el) {
    if (!this.quizState) { this.startQuiz(); }
    const q = this.quizState;

    if (q.done) {
      const pct = Math.round((q.score / q.questions.length) * 100);
      let title, msg;
      if (pct >= 90) { title = '🧠 MAXIMUM BRAINROT'; msg = 'You are terminally online and we respect it. Your aura is +10000.'; }
      else if (pct >= 70) { title = '🔥 Certified Gen Alpha'; msg = 'You understood the assignment fr fr. Solid rizz.'; }
      else if (pct >= 50) { title = '😤 Getting There'; msg = 'Not bad but you need more screen time. Touch your phone, not grass.'; }
      else if (pct >= 30) { title = '😬 Kinda Mid'; msg = 'You\'re giving NPC energy rn. Time to scroll more TikTok.'; }
      else { title = '💀 Go Touch Grass'; msg = 'You have zero brainrot. Go outside? Oh wait, you already do. L.'; }

      el.innerHTML = `
        <div class="ga-quiz-card">
          <div class="ga-quiz-progress">${q.answered.map(a => `<div class="ga-quiz-dot ${a ? 'done' : 'wrong-dot'}"></div>`).join('')}</div>
          <h2 style="font-family:var(--serif);margin-top:24px;">${title}</h2>
          <div class="ga-quiz-score">${q.score}/${q.questions.length}</div>
          <p style="color:var(--muted);font-size:15px;margin:8px 0 24px;">${msg}</p>
          <p style="font-size:13px;color:var(--muted);">Brainrot Level: ${pct}%</p>
          <div style="height:8px;background:var(--border);border-radius:4px;margin:8px 0 24px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${pct >= 70 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444'};border-radius:4px;"></div>
          </div>
          <button class="btn btn-primary" id="ga-quiz-restart">Try Again 🔁</button>
        </div>
      `;
      el.querySelector('#ga-quiz-restart').addEventListener('click', () => { this.startQuiz(); this.renderQuiz(el); });
      return;
    }

    const curr = q.questions[q.current];
    const answered = q.answered.length > q.current;

    el.innerHTML = `
      <div class="ga-quiz-card">
        <div class="ga-quiz-progress">
          ${q.questions.map((_, i) => {
            let cls = 'ga-quiz-dot';
            if (i < q.answered.length) cls += q.answered[i] ? ' done' : ' wrong-dot';
            else if (i === q.current) cls += ' current';
            return `<div class="${cls}"></div>`;
          }).join('')}
        </div>
        <p style="color:var(--muted);font-size:13px;margin:16px 0 0;">Question ${q.current + 1} of ${q.questions.length}</p>
        <div class="ga-quiz-q">What does "${this._esc(curr.term)}" mean?</div>
        <div class="ga-quiz-options">
          ${curr.options.map(o => {
            let cls = 'ga-quiz-opt';
            if (answered) {
              if (o.id === curr.correctId) cls += ' correct';
              else if (q._lastPick === o.id) cls += ' wrong';
            }
            return `<button class="${cls}" data-id="${this._escAttr(o.id)}" ${answered ? 'disabled' : ''}>${this._esc(o.def)}</button>`;
          }).join('')}
        </div>
        ${answered ? `<button class="btn btn-primary" id="ga-quiz-next">${q.current < q.questions.length - 1 ? 'Next →' : 'See Results 🏆'}</button>` : ''}
      </div>
    `;

    if (!answered) {
      el.querySelectorAll('.ga-quiz-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          const picked = btn.dataset.id;
          const correct = picked === curr.correctId;
          q._lastPick = picked;
          if (correct) q.score++;
          q.answered.push(correct);
          this.renderQuiz(el);
        });
      });
    }

    const nextBtn = el.querySelector('#ga-quiz-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        q.current++;
        if (q.current >= q.questions.length) q.done = true;
        this.renderQuiz(el);
      });
    }
  }

  renderTrending(el) {
    const sorted = [...this.slang].sort((a, b) => b.vibeScore - a.vibeScore);
    const top = sorted.slice(0, 20);
    el.innerHTML = `
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="font-family:var(--serif);margin:0;">🔥 Trending Wall</h2>
        <p style="color:var(--muted);font-size:14px;">The hottest Gen Alpha slang rn, ranked by vibe score</p>
      </div>
      <div class="ga-trending-grid">
        ${top.map((s, i) => `
          <div class="ga-trend-card" title="${this._escAttr(s.definition)}" data-id="${this._escAttr(s.id)}">
            <div class="ga-trend-score">${s.vibeScore}</div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">#${i + 1}</div>
            <div class="ga-trend-term">${this._esc(s.term)}</div>
            <span class="ga-cat-badge" style="font-size:10px;background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <div class="ga-trend-bar" style="background:linear-gradient(90deg,${this.categoryColor(s.category)},transparent);"></div>
          </div>
        `).join('')}
      </div>
    `;

    el.querySelectorAll('.ga-trend-card').forEach(c => {
      c.addEventListener('click', () => {
        const s = this.slang.find(x => x.id === c.dataset.id);
        if (!s) return;
        const modal = document.createElement('cc-modal');
        modal.setAttribute('title', this._esc(s.term));
        modal.setAttribute('size', 'sm');
        modal.innerHTML = `
          <div style="padding:8px;">
            <span class="ga-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <p class="ga-def" style="margin-top:12px;">${this._esc(s.definition)}</p>
            <div class="ga-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="ga-origin" style="margin-top:12px;">📍 ${this._esc(s.origin)}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--muted);">🕐 ${this._esc(s.era)}</div>
            ${s.aliases?.length ? `<div class="ga-aliases" style="margin-top:8px;">${s.aliases.map(a => `<span class="ga-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
            ${GenAlpha.GEN_X_MAP[s.id] ? `<div style="margin-top:16px;padding:12px 16px;background:rgba(245,158,11,.08);border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">📼 Gen X Said</div>
              <div style="font-size:15px;font-weight:700;color:#f59e0b;">${this._esc(GenAlpha.GEN_X_MAP[s.id])} 🤙</div>
            </div>` : ''}
          </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.open());
      });
    });
  }
  _showToast(msg) {
    window.showToast?.(msg, 3000);
  }

  _likelihoodColor(score) {
    if (score >= 8) return '#22c55e';
    if (score >= 6) return '#eab308';
    if (score >= 4) return '#f97316';
    return '#ef4444';
  }

  _getPatternName(id) {
    const p = GenAlpha.EVOLUTION_PATTERNS.find(x => x.id === id);
    return p ? `${p.emoji} ${p.name}` : id;
  }

  async renderSlangLab(el) {
    // Load saved predictions from DB
    const savedPreds = this.slang.filter(s => s.category === 'lab' || s.category === 'predicted');
    // Votes stored in localStorage
    const votes = JSON.parse(localStorage.getItem('ga-lab-votes') || '{}');

    const patterns = GenAlpha.EVOLUTION_PATTERNS;
    const preds = GenAlpha.PRESEEDED_PREDICTIONS;

    el.innerHTML = `
      <div class="ga-lab-section" style="text-align:center;margin-bottom:32px;">
        <h2>🧪 Slang Lab</h2>
        <p>Trend forecaster & slang incubator — analyzing how Gen Alpha slang evolves and predicting what's next</p>
      </div>

      <div class="ga-lab-section">
        <h2>📐 Evolution Patterns</h2>
        <p>Gen Alpha slang follows these repeatable patterns. Understanding them lets us predict what's coming next.</p>
        <div class="ga-pattern-grid">
          ${patterns.map(p => `
            <div class="ga-pattern-card">
              <div class="ga-pattern-emoji">${p.emoji}</div>
              <div class="ga-pattern-name">${p.name}</div>
              <div class="ga-pattern-desc">${p.desc}</div>
              ${p.examples.map(ex => `<div class="ga-pattern-ex">→ ${ex}</div>`).join('')}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="ga-lab-section">
        <h2>🤖 AI Slang Predictions</h2>
        <p>Our AI analyzed existing slang patterns and predicted these terms that could emerge next. Vote on which ones you think will catch on!</p>
        <div class="ga-pred-grid">
          ${preds.sort((a, b) => b.likelihood - a.likelihood).map((p, i) => {
            const saved = savedPreds.find(s => s.term === p.term);
            const voted = votes[p.term];
            return `
            <div class="ga-pred-card">
              <div style="display:flex;justify-content:space-between;align-items:start;">
                <div class="ga-pred-term">${p.term}</div>
                <span class="ga-pred-pattern">${this._getPatternName(p.pattern)}</span>
              </div>
              <div class="ga-pred-def">${p.definition}</div>
              <div class="ga-pred-example">"${p.example}"</div>
              <div class="ga-likelihood">
                <span class="ga-likelihood-label">Likelihood</span>
                <div class="ga-likelihood-bar">
                  <div class="ga-likelihood-fill" style="width:${p.likelihood * 10}%;background:${this._likelihoodColor(p.likelihood)};"></div>
                </div>
                <span class="ga-likelihood-num" style="color:${this._likelihoodColor(p.likelihood)};">${p.likelihood}/10</span>
              </div>
              <div class="ga-pred-evolved">📼 Evolved from: ${p.evolved_from} → Gen X said: "${p.gen_x}"</div>
              <div class="ga-vote-row">
                <button class="ga-vote-btn ${voted === 'up' ? 'voted' : ''}" data-term="${this._escAttr(p.term)}" data-vote="up">👍 This will catch on</button>
                <button class="ga-vote-btn ${voted === 'down' ? 'voted' : ''}" data-term="${this._escAttr(p.term)}" data-vote="down">👎 No way</button>
                ${!saved ? `<button class="ga-vote-btn ga-save-btn" data-idx="${i}" title="Save to dictionary">💾</button>` : `<span style="font-size:11px;color:#22c55e;">✅ Saved</span>`}
              </div>
            </div>`;
          }).join('')}
        </div>
        <div style="text-align:center;margin-top:24px;">
          <button class="btn btn-primary" id="ga-request-more">🔮 Request More Predictions</button>
        </div>
      </div>

      ${savedPreds.length ? `
      <div class="ga-lab-section">
        <h2>💾 Community Predictions (Saved)</h2>
        <p>Predictions that have been saved to the dictionary. These are experimental terms from the lab.</p>
        <div class="ga-pred-grid">
          ${savedPreds.sort((a, b) => (b.vibeScore || 0) - (a.vibeScore || 0)).map(s => `
            <div class="ga-pred-card" style="border-left:3px solid #8b5cf6;">
              <div class="ga-pred-term">${this._esc(s.term)}</div>
              <span class="ga-cat-badge" style="background:rgba(139,92,246,.15);color:#8b5cf6;">🧪 lab</span>
              <div class="ga-pred-def" style="margin-top:8px;">${this._esc(s.definition)}</div>
              <div class="ga-pred-example">"${this._esc(s.example)}"</div>
              ${this.vibeBar(s.vibeScore || 5)}
            </div>
          `).join('')}
        </div>
      </div>` : ''}
    `;

    // Vote buttons
    el.querySelectorAll('.ga-vote-btn[data-vote]').forEach(btn => {
      btn.addEventListener('click', () => {
        const term = btn.dataset.term;
        const vote = btn.dataset.vote;
        const votes = JSON.parse(localStorage.getItem('ga-lab-votes') || '{}');
        votes[term] = vote;
        localStorage.setItem('ga-lab-votes', JSON.stringify(votes));
        this.renderSlangLab(el);
      });
    });

    // Save buttons
    el.querySelectorAll('.ga-save-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.idx);
        const sorted = [...GenAlpha.PRESEEDED_PREDICTIONS].sort((a, b) => b.likelihood - a.likelihood);
        const p = sorted[idx];
        if (!p) return;
        try {
          await this.db.upsert({
            id: p.term.toLowerCase().replace(/\s+/g, '-'),
            term: p.term,
            definition: p.definition,
            example: p.example,
            category: 'lab',
            origin: `Slang Lab prediction (${this._getPatternName(p.pattern)})`,
            era: '2025+',
            vibe_score: p.likelihood,
            aliases: []
          });
          // Refresh local data
          const rows = await this.db.getAll();
          this.slang = rows.map(r => ({ ...r, vibeScore: r.vibe_score ?? r.vibeScore ?? 0, createdAt: r.created_at ?? r.createdAt, updatedAt: r.updated_at ?? r.updatedAt }));
          this.filtered = [...this.slang];
          this._showToast(`💾 "${p.term}" saved to dictionary!`);
          this.renderSlangLab(el);
        } catch (e) {
          console.error('Save error:', e);
          this._showToast('❌ Failed to save — try again');
        }
      });
    });

    // Request more button
    el.querySelector('#ga-request-more')?.addEventListener('click', () => {
      this._showToast('🔮 New predictions are generated daily by our AI — check back tomorrow!');
    });
  }

  renderTrendsetter(el) {
    const patterns = GenAlpha.TRENDSETTER_PATTERNS;
    const preds = GenAlpha.TRENDSETTER_PREDICTIONS;
    const activePattern = this._trendPattern || 'all';
    const filtered = activePattern === 'all' ? preds : preds.filter(p => p.pattern === activePattern);
    const sortBy = this._trendSort || 'confidence';
    const sorted = [...filtered].sort((a, b) => sortBy === 'confidence' ? b.confidence - a.confidence : a.term.localeCompare(b.term));

    el.innerHTML = `
      <style>
        .ts-hero{text-align:center;margin-bottom:32px;padding:32px 20px;background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(245,158,11,.08));border-radius:20px;border:1px solid var(--border);}
        .ts-hero h2{font-family:var(--serif);font-size:1.8rem;margin:0 0 8px;}
        .ts-hero p{color:var(--muted);font-size:14px;margin:0;max-width:600px;margin:0 auto;}
        .ts-timeline{position:relative;padding:0 0 0 32px;margin:24px 0;}
        .ts-timeline::before{content:'';position:absolute;left:12px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,var(--accent),#8b5cf6,#ec4899);}
        .ts-era{position:relative;margin-bottom:20px;}
        .ts-era::before{content:'';position:absolute;left:-24px;top:6px;width:10px;height:10px;border-radius:50%;background:var(--accent);border:2px solid var(--bg);z-index:1;}
        .ts-era-label{font-size:11px;color:var(--accent);font-weight:700;text-transform:uppercase;letter-spacing:1px;}
        .ts-era-text{font-size:13px;color:var(--text);margin:2px 0 0;}
        .ts-pattern-selector{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0;}
        .ts-pat-btn{padding:8px 16px;border-radius:10px;border:1px solid var(--border);background:var(--card-bg);cursor:pointer;font-size:13px;color:var(--text);transition:all .2s;display:flex;align-items:center;gap:6px;}
        .ts-pat-btn:hover{border-color:var(--accent);}
        .ts-pat-btn.active{border-color:var(--accent);background:rgba(245,158,11,.1);color:var(--accent);}
        .ts-card{background:var(--card-bg);border:1px solid var(--border);border-radius:16px;padding:20px;transition:all .3s;position:relative;overflow:hidden;}
        .ts-card:hover{border-color:var(--accent);transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.15);}
        .ts-card::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
        .ts-conf-high::after{background:linear-gradient(90deg,#22c55e,#10b981);}
        .ts-conf-med::after{background:linear-gradient(90deg,#eab308,#f59e0b);}
        .ts-conf-low::after{background:linear-gradient(90deg,#f97316,#ef4444);}
        .ts-term{font-size:1.4rem;font-weight:900;margin:0 0 4px;font-family:var(--serif);}
        .ts-badge{display:inline-block;font-size:10px;padding:3px 10px;border-radius:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;}
        .ts-evolution{margin:12px 0;padding:12px 16px;background:rgba(139,92,246,.06);border-radius:10px;border-left:3px solid #8b5cf6;}
        .ts-evolution-label{font-size:10px;color:#8b5cf6;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
        .ts-evolution-text{font-size:13px;color:var(--text);line-height:1.5;}
        .ts-conf-ring{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;flex-shrink:0;}
        .ts-genx-box{margin-top:10px;padding:10px 14px;background:rgba(245,158,11,.06);border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;}
        .ts-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:28px;}
        .ts-stat{background:var(--card-bg);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center;}
        .ts-stat-num{font-size:2rem;font-weight:900;background:linear-gradient(135deg,var(--accent),#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
        .ts-stat-label{font-size:12px;color:var(--muted);margin-top:4px;}
      </style>

      <div class="ts-hero">
        <div style="font-size:2.5rem;margin-bottom:8px;">🔮</div>
        <h2>Trendsetter — AI-Predicted Slang</h2>
        <p>Analyzing how language evolves across generations to predict what Gen Alpha will say next. Each prediction is backed by a real linguistic pattern.</p>
      </div>

      <div class="ts-stats">
        <div class="ts-stat">
          <div class="ts-stat-num">${preds.length}</div>
          <div class="ts-stat-label">Predictions</div>
        </div>
        <div class="ts-stat">
          <div class="ts-stat-num">${patterns.length}</div>
          <div class="ts-stat-label">Evolution Patterns</div>
        </div>
        <div class="ts-stat">
          <div class="ts-stat-num">${Math.round(preds.reduce((a,p) => a+p.confidence,0)/preds.length*10)}%</div>
          <div class="ts-stat-label">Avg Confidence</div>
        </div>
        <div class="ts-stat">
          <div class="ts-stat-num">${preds.filter(p=>p.confidence>=8).length}</div>
          <div class="ts-stat-label">High Confidence</div>
        </div>
      </div>

      <h3 style="font-family:var(--serif);margin:0 0 12px;">🧬 How Language Evolves</h3>
      <p style="color:var(--muted);font-size:14px;margin:0 0 20px;">Each pattern shows a generational timeline — see how the same linguistic mechanic repeats across eras.</p>

      <div class="ga-pattern-grid" style="margin-bottom:36px;">
        ${patterns.map(p => `
          <div class="ga-pattern-card" style="cursor:pointer;" data-pattern="${p.id}">
            <div class="ga-pattern-emoji">${p.emoji}</div>
            <div class="ga-pattern-name">${p.name}</div>
            <div class="ga-pattern-desc">${p.desc}</div>
            <div class="ts-timeline">
              ${p.lineage.map(l => {
                const [era, ...rest] = l.split(':');
                return `<div class="ts-era"><div class="ts-era-label">${era.trim()}</div><div class="ts-era-text">${rest.join(':').trim()}</div></div>`;
              }).join('')}
            </div>
            <div style="font-size:12px;color:var(--accent);font-weight:600;margin-top:8px;">⚡ Next wave: ${p.nextWave}</div>
          </div>
        `).join('')}
      </div>

      <h3 style="font-family:var(--serif);margin:0 0 8px;">🔮 Predicted Terms</h3>
      <p style="color:var(--muted);font-size:14px;margin:0 0 16px;">Terms our AI predicts will emerge or go mainstream based on evolution patterns above.</p>

      <div class="ts-pattern-selector">
        <button class="ts-pat-btn ${activePattern === 'all' ? 'active' : ''}" data-pat="all">All</button>
        ${patterns.map(p => `<button class="ts-pat-btn ${activePattern === p.id ? 'active' : ''}" data-pat="${p.id}">${p.emoji} ${p.name}</button>`).join('')}
      </div>

      <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;">
        <span style="font-size:12px;color:var(--muted);">Sort:</span>
        <button class="pill ${sortBy === 'confidence' ? 'active' : ''}" data-sort="confidence">🎯 Confidence</button>
        <button class="pill ${sortBy === 'alpha' ? 'active' : ''}" data-sort="alpha">🔤 A-Z</button>
        <span style="font-size:13px;color:var(--muted);margin-left:auto;">${filtered.length} prediction${filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <cc-stagger animation="fade-up" delay="80">
      <div class="ga-pred-grid">
        ${sorted.map(p => {
          const confClass = p.confidence >= 8 ? 'ts-conf-high' : p.confidence >= 6 ? 'ts-conf-med' : 'ts-conf-low';
          const confColor = p.confidence >= 8 ? '#22c55e' : p.confidence >= 6 ? '#eab308' : '#f97316';
          const patInfo = patterns.find(x => x.id === p.pattern);
          return `
          <div class="ts-card ${confClass}">
            <div style="display:flex;justify-content:space-between;align-items:start;gap:12px;">
              <div>
                <div class="ts-term">${this._esc(p.term)}</div>
                <span class="ts-badge" style="background:rgba(139,92,246,.12);color:#8b5cf6;">${patInfo ? `${patInfo.emoji} ${this._esc(patInfo.name)}` : this._esc(p.pattern)}</span>
              </div>
              <div class="ts-conf-ring" style="background:${confColor}18;color:${confColor};border:2px solid ${confColor};">${p.confidence}</div>
            </div>
            <div class="ga-pred-def" style="margin:12px 0;">${this._esc(p.definition)}</div>
            <div class="ga-pred-example">"${this._esc(p.example)}"</div>
            <div class="ts-evolution">
              <div class="ts-evolution-label">Evolution Path</div>
              <div class="ts-evolution-text">${this._esc(p.evolution)}</div>
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:6px;">🌱 Source: ${this._esc(p.emerged)}</div>
            <div class="ts-genx-box">
              <div style="font-size:10px;color:var(--muted);margin-bottom:2px;">📼 Gen X Said</div>
              <div style="font-size:14px;font-weight:700;color:#f59e0b;">${this._esc(p.genXsaid)}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
      </cc-stagger>

      ${!filtered.length ? '<cc-empty-state message="No predictions for this pattern yet" icon="🔮"></cc-empty-state>' : ''}
    `;

    // Pattern filter
    el.querySelectorAll('.ts-pat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._trendPattern = btn.dataset.pat;
        this.renderTrendsetter(el);
      });
    });

    // Sort toggle
    el.querySelectorAll('.pill[data-sort]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._trendSort = btn.dataset.sort;
        this.renderTrendsetter(el);
      });
    });

    // Click pattern cards to filter
    el.querySelectorAll('.ga-pattern-card[data-pattern]').forEach(card => {
      card.addEventListener('click', () => {
        this._trendPattern = card.dataset.pattern;
        this.renderTrendsetter(el);
      });
    });
  }
}

customElements.define('gen-alpha', GenAlpha);
