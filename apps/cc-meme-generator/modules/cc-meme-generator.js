class CcMemeGenerator extends HTMLElement {
  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }
  _escAttr(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  connectedCallback() {
    this.memes = [];
    this.filtered = [];
    this.selected = null;
    this.selectedIndex = -1;
    this.topText = '';
    this.bottomText = '';
    this.fontSize = 48;
    this.textOptions = [];
    this.textIndex = -1; // -1 means custom/manual mode
    this._usedTexts = {}; // {memeId: Set of used indices} — prevents repeats
    this._shuffledOrder = {}; // {memeId: shuffled index array}
    this.render();
    this.loadMemes();
  }

  // Pre-written edgy/current text combos keyed by imgflip meme ID + generic pool
  // Text bank updated Feb 16, 2026 — Winter Olympics, T20 World Cup, Skeleton Shield, brainrot
  getTextBank() {
    return {
      // Drake Hotline Bling
      '181913649': [
        { top: 'Studying for the test', bottom: 'Watching Skeleton Banging Shield compilations for 3 hours' },
        { top: 'Doing the group consensus challenge', bottom: 'Starting a full argument in the group chat' },
        { top: 'Normal vocabulary', bottom: 'Saying lowkenuinely in every sentence' },
        { top: 'Watching the Winter Olympics for sports', bottom: 'Only following the condom shortage updates' },
        { top: 'Getting Euphoria S3 spoilers from the trailer', bottom: 'Building my entire personality around Euphoria glam looks' },
        { top: 'Watching India vs Pakistan for the cricket', bottom: 'Only there for the sitting duck memes' },
        { top: 'Planning a real vacation', bottom: 'Watching Llévame edits and pretending I\'m in Milan-Cortina' },
        { top: 'Doing actual work', bottom: 'My brain is fully AFK right now' },
        { top: 'Using normal words', bottom: 'Calling everything a Solar Rage moment' },
      ],
      // Distracted Boyfriend
      '112126428': [
        { top: 'My homework', bottom: 'Me recreating the Skeleton Banging Shield with my lunch tray' },
        { top: 'The actual Winter Olympics events', bottom: 'The Olympic Village condom shortage updates' },
        { top: 'Studying for midterms', bottom: 'Ranking every Grammy glambot walk' },
        { top: 'My responsibilities', bottom: 'Doing the thermostat game with my friends' },
        { top: 'The T20 World Cup match', bottom: 'India vs Pakistan memes on my other screen' },
        { top: 'Being productive', bottom: 'Editing my life like a reality TV show' },
        { top: 'My actual tasks', bottom: 'Brain fully AFK watching Jutta Leerdam speedskating clips' },
        { top: 'Sitting with good posture', bottom: 'Sitting like a shrimp because it just hits different' },
      ],
      // Two Buttons
      '87743020': [
        { top: 'Pay attention in class', bottom: 'Do the Skeleton Banging Shield on my desk' },
        { top: 'Go to sleep', bottom: 'Watch one more Italian brainrot compilation' },
        { top: 'Watch the Olympics for the sport', bottom: 'Follow the condom shortage saga like a soap opera' },
        { top: 'Act normal at dinner', bottom: 'Sing Tralalero Tralala under my breath' },
        { top: 'Be a functional human', bottom: 'Brain AFK, only available for memes' },
      ],
      // Change My Mind
      '129242436': [
        { top: '', bottom: 'The Olympic Village running out of 10,000 condoms in 3 days is the most honest sports story ever' },
        { top: '', bottom: 'Skeleton Banging Shield is the most accurate representation of Monday mornings ever created' },
        { top: '', bottom: 'Italian brainrot characters have deeper lore than most TV shows change my mind' },
        { top: '', bottom: 'India vs Pakistan T20 memes are better than the actual match change my mind' },
        { top: '', bottom: 'Euphoria S3 is going to break the internet worse than Italian brainrot did' },
      ],
      // Disaster Girl
      '97984': [
        { top: 'Did the RAAAH skeleton scream', bottom: 'During the moment of silence at school' },
        { top: 'Told my group chat about the thermostat game', bottom: 'Three friendships ended' },
        { top: 'Called my teacher a choppleganger', bottom: 'To her face and she googled it' },
        { top: 'Told my parents about the Olympic condom shortage', bottom: 'At dinner. Nobody ate dessert.' },
        { top: 'Edited my morning routine', bottom: 'Like a reality TV show and posted it unironically' },
      ],
      // Waiting Skeleton
      '4087833': [
        { top: 'Me waiting for', bottom: 'Euphoria Season 3 since literally 2022' },
        { top: 'Me waiting for', bottom: 'The next Italian brainrot character to drop' },
        { top: 'Me waiting for', bottom: 'GTA 6 while Skeleton Banging Shield is my only entertainment' },
        { top: 'Me waiting for', bottom: 'The Olympic Village to restock the condoms' },
        { top: 'Me waiting for', bottom: 'My brain to come back from being AFK all week' },
      ],
      // Roll Safe
      '89370399': [
        { top: 'Can\'t fail the thermostat game', bottom: 'If you live alone' },
        { top: 'Can\'t be the undesirable child', bottom: 'If you\'re an only child' },
        { top: 'Can\'t run out of condoms', bottom: 'If you don\'t make it to the Olympic Village' },
        { top: 'Can\'t lose the group consensus vote', bottom: 'If you make the questions' },
        { top: 'Can\'t be brain AFK', bottom: 'If your brain never logged on in the first place' },
      ],
      // One Does Not Simply
      '61579': [
        { top: 'One does not simply', bottom: 'Watch one Skeleton Banging Shield edit and stop' },
        { top: 'One does not simply', bottom: 'Read about the Olympic condom shortage and not tell everyone' },
        { top: 'One does not simply', bottom: 'Explain Bombardiro Crocodilo to a parent' },
        { top: 'One does not simply', bottom: 'Watch India vs Pakistan without losing their voice' },
        { top: 'One does not simply', bottom: 'Edit their morning routine like a reality TV show just once' },
      ],
      // Bernie Sanders
      '91538330': [
        { top: 'I am once again asking', bottom: 'You to stop doing the RAAAH skeleton in the hallway' },
        { top: 'I am once again asking', bottom: 'You to stop singing Tralalero Tralala in class' },
        { top: 'I am once again asking', bottom: 'How the Olympic Village went through 10,000 condoms in 3 days' },
        { top: 'I am once again asking', bottom: 'For the Wi-Fi password I literally just had' },
        { top: 'I am once again asking', bottom: 'My brain to come back online it has been AFK since Monday' },
      ],
      // Surprised Pikachu
      '155067746': [
        { top: 'Does the Skeleton Banging Shield at full volume', bottom: 'Surprised when I get detention' },
        { top: 'Sings Bombardiro Crocodilo during the test', bottom: 'Shocked when the teacher takes my phone' },
        { top: 'Puts 10,000 athletes in a village together', bottom: 'Surprised when the condoms run out' },
        { top: 'Called my sibling a choppleganger', bottom: 'Surprised when they actually cried' },
        { top: 'Said lowkenuinely in my English essay', bottom: 'Shocked when I got a zero' },
      ],
    };
  }

  // Generic/fallback text options — Feb 16, 2026 current
  getGenericTexts() {
    return [
      { top: 'Nobody:', bottom: 'My brain at 3am: RAAAH *bangs shield on desk*' },
      { top: 'Me explaining Italian brainrot lore', bottom: 'To my mom who just wanted to know what\'s for dinner' },
      { top: 'The Skeleton Banging Shield meme', bottom: 'Is lowkenuinely just how I feel every Monday morning' },
      { top: 'That moment when', bottom: 'Someone calls you a choppleganger and you can\'t even argue' },
      { top: 'My screen time report:', bottom: '11 hours. 6 were brainrot, 3 were Skeleton Shield edits, 2 were T20 clips' },
      { top: 'The Olympic Village ran out of condoms', bottom: 'In 3 days. 10,000 condoms. Three. Days.' },
      { top: 'Day 1 as a spy:', bottom: 'Immediately did the RAAAH skeleton and blew my cover' },
      { top: 'The thermostat game revealed', bottom: 'That my family has been lying to each other for years' },
      { top: 'Me: I\'ll only watch one more TikTok', bottom: 'Me 2 hours later: I now know every Skeleton Shield variant' },
      { top: 'The group consensus challenge', bottom: 'Is just a socially acceptable way to start drama' },
      { top: 'Euphoria S3 premieres April 12', bottom: 'And I have already planned my entire viewing outfit' },
      { top: 'Kendrick swept the Grammys', bottom: 'And I lowkenuinely felt that in my soul' },
      { top: 'Told my parents about the undesirable child trend', bottom: 'They both looked at me at the same time' },
      { top: 'Zimbabwe beating Australia in the T20 World Cup', bottom: 'Is the energy I bring to every group project' },
      { top: 'India vs Pakistan match memes', bottom: 'Are lowkenuinely better than the actual cricket' },
      { top: 'POV: You\'re an Olympic speedskater', bottom: 'And you just broke the internet by existing' },
      { top: 'My brain:', bottom: 'Has been AFK since the Winter Olympics started' },
      { top: 'Sitting like a shrimp at my desk', bottom: 'Is the only posture that activates my brain cells' },
      { top: 'My ADHD brain after 2 drinks', bottom: 'Trying to explain the full lore of Italian brainrot to a stranger' },
      { top: 'Reality TV edit of my morning routine', bottom: 'Complete with dramatic music when I can\'t find my keys' },
      { top: '"You have to believe me!"', bottom: 'Me explaining the Olympic condom shortage to someone who didn\'t ask' },
      { top: 'Couples doing the thermostat game', bottom: 'Is just relationship therapy with extra steps' },
      { top: 'Jutta Leerdam speedskating clips', bottom: 'Are lowkenuinely the reason the Olympic Village ran out of condoms' },
      { top: 'The "it\'s always warm right here" trend', bottom: 'But my heart is cold and my brain is AFK' },
      { top: 'Editing my life like a reality TV show', bottom: 'Adding dramatic music every time my boss sends a Slack' },
      { top: 'Solar Rage is when', bottom: 'You\'re calm on the outside but doing the RAAAH skeleton internally' },
      { top: 'Me watching India qualify for Super 8', bottom: 'While my brain has been AFK since the group stage started' },
      { top: 'The T20 World Cup sitting duck meme', bottom: 'Is lowkenuinely the funniest thing from today\'s match' },
      { top: '"Faithful or traitor?"', bottom: 'The Traitors TikTok trend but it\'s about my coworkers' },
      { top: 'Winter Olympics week 1:', bottom: 'More condom memes than medal ceremony memes' },
    ];
  }

  // IShowSpeed + other fresh/current meme templates (locally hosted images)
  getCustomTemplates() {
    return [
      {
        id: 'custom-ishowspeed-1',
        name: 'IShowSpeed Shocked',
        url: 'img/speed-amazed.jpg',
        texts: [
          { top: 'When the Olympic Village ran out of condoms', bottom: 'In THREE DAYS' },
          { top: 'When Kendrick won every Grammy', bottom: 'And you predicted it' },
          { top: 'POV: Someone just called you', bottom: 'A choppleganger of the substitute teacher' },
          { top: 'When you see the Skeleton Banging Shield meme', bottom: 'Has 400 million views across all platforms' },
          { top: 'Me when Zimbabwe knocked out Australia', bottom: 'In the T20 World Cup' },
        ]
      },
      {
        id: 'custom-ishowspeed-2',
        name: 'IShowSpeed Rage',
        url: 'img/speed-rage.jpg',
        texts: [
          { top: 'WIFI DIED DURING INDIA VS PAKISTAN', bottom: 'RIGHT WHEN THE SITTING DUCK MOMENT HAPPENED' },
          { top: 'When someone says Skeleton Banging Shield', bottom: 'Is just a Skyrim animation' },
          { top: 'Me when the Olympic condom shortage', bottom: 'Became the biggest sports story of the week' },
          { top: 'When the teacher confiscates your phone', bottom: 'Mid-Bombardiro Crocodilo video' },
          { top: 'When someone says they\'re "over"', bottom: 'Italian brainrot. Nobody is over it.' },
        ]
      },
      {
        id: 'custom-ishowspeed-3',
        name: 'IShowSpeed Smirk',
        url: 'img/speed-smirk.png',
        texts: [
          { top: 'When you lowkenuinely guess the right answer', bottom: 'And the whole class turns around' },
          { top: 'Won the group consensus challenge', bottom: 'As "most likely to succeed"' },
          { top: 'When you do the Runway Freedom Walk', bottom: 'Down the school hallway and it hits' },
          { top: 'Successfully explained Skeleton Banging Shield', bottom: 'To an adult without them questioning your sanity' },
          { top: 'When your Valentine\'s Day meme', bottom: 'Gets more likes than their actual valentine post' },
        ]
      },
      {
        id: 'custom-ishowspeed-4',
        name: 'IShowSpeed Are You Serious',
        url: 'img/speed-serious.jpg',
        texts: [
          { top: 'You lowkenuinely just said that', bottom: 'In front of everyone?' },
          { top: 'You called me a choppleganger', bottom: 'Of WHO exactly??' },
          { top: 'The undesirable child video', bottom: 'And both parents pointed at me' },
          { top: 'Someone said the RAAAH skeleton', bottom: 'Isn\'t meme of the month material. Excuse me??' },
          { top: 'The group consensus voted me', bottom: '"Most likely to peak in middle school"' },
        ]
      },
      {
        id: 'custom-ishowspeed-5',
        name: 'IShowSpeed Happy to Sad',
        url: 'img/speed-happy-sad.png',
        texts: [
          { top: 'Me before the group consensus challenge', bottom: 'vs after finding out what they really think' },
          { top: 'Seeing the Super Bowl halftime start', bottom: 'vs realizing the audience just sees a wall of grass' },
          { top: 'Getting a valentine text', bottom: 'vs it\'s the RAAAH skeleton with no context' },
          { top: 'Starting the thermostat game with your family', bottom: 'vs the results' },
          { top: 'Zimbabwe winning in the T20 World Cup', bottom: 'vs your bracket being completely destroyed' },
        ]
      },
      {
        id: 'custom-ishowspeed-6',
        name: 'IShowSpeed Jumpscare',
        url: 'img/speed-jumpscare.png',
        texts: [
          { top: 'POV: You opened your front camera', bottom: 'During class and everyone saw' },
          { top: 'When someone plays the RAAAH skeleton sound', bottom: 'On full volume in a quiet room' },
          { top: 'The face your teacher makes', bottom: 'When you say lowkenuinely in your presentation' },
          { top: 'When the test comes back', bottom: 'And it\'s lowkenuinely worse than you imagined' },
          { top: 'Last thing you see before', bottom: 'Your mom takes your phone for the night' },
        ]
      },
      {
        id: 'custom-ishowspeed-7',
        name: 'IShowSpeed FR FR',
        url: 'img/speed-fr-fr.jpg',
        texts: [
          { top: '10,000 condoms in 3 days', bottom: 'The Winter Olympics are built different' },
          { top: 'Kendrick deserved every Grammy', bottom: 'And that\'s not even debatable' },
          { top: 'Skeleton Banging Shield', bottom: 'Is the most relatable meme of 2026 so far' },
          { top: 'Italian brainrot is peak culture', bottom: 'And I will not be taking questions' },
          { top: 'India beating Pakistan in the T20', bottom: 'Is the energy I need in my life right now' },
        ]
      },
      {
        id: 'custom-ishowspeed-8',
        name: 'IShowSpeed Horrified',
        url: 'img/speed-horrified.png',
        texts: [
          { top: 'When you realize you did the RAAAH', bottom: 'Skeleton scream on a work call not on mute' },
          { top: 'Opening your screen time report', bottom: 'After a full day of Skeleton Shield variants' },
          { top: 'When autocorrect changes lowkenuinely', bottom: 'To "low key genuinely" like a narc' },
          { top: 'Finding out your parents filmed', bottom: 'Your undesirable child reaction' },
          { top: 'When you accidentally sent a valentine', bottom: 'To the group chat instead of one person' },
        ]
      },
      {
        id: 'custom-ishowspeed-9',
        name: 'IShowSpeed Calm Face',
        url: 'img/speed-calm.png',
        texts: [
          { top: 'Me pretending I didn\'t just watch', bottom: '3 hours of Skeleton Banging Shield compilations' },
          { top: 'Holding it together', bottom: 'After the group consensus voted me "most mid"' },
          { top: 'When they ask what I did Valentine\'s weekend', bottom: 'And I can\'t say "watched T20 World Cup and brainrot"' },
          { top: 'Internal RAAAH skeleton', bottom: 'External calm professional face' },
          { top: 'My face when someone says', bottom: '"I don\'t get Italian brainrot"' },
        ]
      },
      {
        id: 'custom-ishowspeed-10',
        name: 'My Mom Is Kinda Homeless',
        url: 'img/speed-homeless.png',
        texts: [
          { top: 'Day 1 as a bush person:', bottom: 'At the Super Bowl with my feet showing on camera' },
          { top: 'Things you can\'t unsay:', bottom: 'Calling your teacher\'s outfit a choppleganger look' },
          { top: 'When the RAAAH comes out', bottom: 'Before your brain can stop it' },
          { top: 'Me accidentally saying "kirk"', bottom: 'In front of someone named Kirk' },
          { top: 'Sent the Skeleton Shield meme to my grandma', bottom: 'She thinks I need an exorcism' },
        ]
      },
      {
        id: 'custom-ishowspeed-11',
        name: 'Please Speed I Need This',
        url: 'img/speed-please.jpg',
        texts: [
          { top: 'Me begging my phone', bottom: 'To last through one more Skeleton Shield compilation' },
          { top: 'Please let the teacher', bottom: 'Not check homework today' },
          { top: 'My last brain cell', bottom: 'After 6 hours of RAAAH skeleton edits' },
          { top: 'Me to Euphoria S3', bottom: 'Please don\'t disappoint after 4 years of waiting' },
          { top: 'Me to my screen time', bottom: 'Please don\'t tell my parents' },
        ]
      },
      {
        id: 'custom-skibidi',
        name: 'Skibidi Toilet',
        url: 'img/skibidi-toilet.png',
        texts: [
          { top: 'Me explaining brainrot lore timeline', bottom: 'Skibidi → Bombardiro → Skeleton Shield → whatever drops next week' },
          { top: 'The Skibidi Toilet cinematic universe', bottom: 'Now has more lore than the MCU' },
          { top: 'The substitute teacher googling', bottom: '"Skeleton Banging Shield Skyrim meme" during lunch' },
          { top: 'POV: You showed your dad', bottom: 'The RAAAH skeleton and he hasn\'t spoken since' },
          { top: 'This is what peak culture looks like', bottom: 'And that lowkenuinely concerns some people' },
        ]
      },
      {
        id: 'custom-grimace',
        name: 'Grimace Shake',
        url: 'img/grimace-shake.jpg',
        texts: [
          { top: 'Me after watching', bottom: '4 hours of Skeleton Banging Shield compilations back to back' },
          { top: 'Me after the group consensus challenge', bottom: 'Revealed everyone\'s true feelings on Valentine\'s Day' },
          { top: 'When the entire class does', bottom: 'The RAAAH skeleton scream at the same time' },
          { top: 'POV: You just learned what', bottom: 'Lowkenuinely, kirk, and choppleganger all mean in one conversation' },
          { top: 'When you realize the Super Bowl bush actors', bottom: 'Got paid $18.70 an hour to sway with visible feet' },
        ]
      },
    ];
  }

  async loadMemes() {
    try {
      const r = await fetch('https://api.imgflip.com/get_memes');
      const d = await r.json();
      if (d.success) {
        // Start with custom fresh templates at the top
        const custom = this.getCustomTemplates();
        const apiMemes = d.data.memes.slice(0, 100);
        this.memes = [
          ...custom.map(c => ({ id: c.id, name: c.name, url: c.url, _custom: true })),
          ...apiMemes
        ];
        this.filtered = [...this.memes];
        this.renderGrid();
      }
    } catch (e) {
      // Fallback to just custom templates
      const custom = this.getCustomTemplates();
      this.memes = custom.map(c => ({ id: c.id, name: c.name, url: c.url, _custom: true }));
      this.filtered = [...this.memes];
      this.renderGrid();
    }
  }

  getTextsForMeme(memeId) {
    // Check custom templates first
    const custom = this.getCustomTemplates().find(c => c.id === memeId);
    if (custom) return custom.texts;
    // Check text bank
    const bank = this.getTextBank();
    if (bank[memeId]) return bank[memeId];
    // Fall back to generic
    return this.getGenericTexts();
  }

  render() {
    this.innerHTML = `
      <style>
        .mg-wrap{max-width:1200px;margin:0 auto;padding:2rem 1rem}
        .mg-search{width:100%;padding:12px 16px;background:var(--card);border:1px solid var(--border);border-radius:8px;color:var(--heading);font-size:14px;margin-bottom:1.5rem;outline:none;box-sizing:border-box}
        .mg-search:focus{border-color:var(--accent)}
        .mg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(140px,45%),1fr));gap:12px}
        .mg-thumb{cursor:pointer;border-radius:8px;overflow:hidden;border:2px solid transparent;transition:border-color .2s;background:var(--card)}
        .mg-thumb:hover,.mg-thumb.active{border-color:var(--accent)}
        .mg-thumb img{width:100%;aspect-ratio:1;object-fit:cover;display:block}
        .mg-thumb p{padding:4px 8px;font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0}
        .mg-thumb.fresh::after{content:'🔥';position:absolute;top:4px;right:4px;font-size:16px}
        .mg-thumb{position:relative}
        .mg-editor{display:none;gap:2rem;margin-top:2rem}
        .mg-editor.open{display:grid;grid-template-columns:1fr 1fr}
        .mg-canvas-wrap{position:relative;background:var(--card);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;max-width:100%;box-sizing:border-box}
        .mg-canvas-wrap canvas{max-width:100%;width:100%;height:auto;aspect-ratio:1;max-height:60vh;border-radius:8px;object-fit:contain}
        .mg-controls{display:flex;flex-direction:column;gap:16px}
        .mg-controls label{font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:1px}
        .mg-controls input[type=text],.mg-controls textarea{width:100%;padding:10px 14px;background:var(--card);border:1px solid var(--border);border-radius:8px;color:var(--heading);font-size:14px;outline:none;box-sizing:border-box}
        .mg-controls input:focus,.mg-controls textarea:focus{border-color:var(--accent)}
        .mg-range-wrap{display:flex;align-items:center;gap:12px}
        .mg-range-wrap input[type=range]{flex:1;accent-color:var(--accent)}
        .mg-range-val{font-size:14px;color:var(--heading);min-width:36px;text-align:right}
        .mg-btn{padding:12px 24px;background:var(--accent);color:#000;border:none;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;justify-content:center}
        .mg-btn:hover{opacity:.9}
        .mg-btn-ghost{padding:10px 20px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--heading);font-size:13px;cursor:pointer}
        .mg-btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
        .mg-selected-name{font-family:var(--serif);font-size:20px;margin:0 0 4px;color:var(--heading)}
        .mg-cycle{display:flex;align-items:center;gap:12px;margin-bottom:8px}
        .mg-cycle-btn{width:40px;height:40px;border-radius:50%;border:1px solid var(--border);background:var(--card);color:var(--heading);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
        .mg-cycle-btn:hover{border-color:var(--accent);color:var(--accent);background:rgba(245,158,11,.1)}
        .mg-cycle-counter{font-size:12px;color:var(--muted)}

        .mg-text-cycle{display:flex;align-items:center;gap:8px;margin-top:8px;padding:10px 14px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:8px;max-width:100%;overflow:hidden;box-sizing:border-box}
        .mg-text-cycle-btn{width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--card);color:var(--heading);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
        .mg-text-cycle-btn:hover{border-color:var(--accent);color:var(--accent)}
        .mg-text-cycle-info{flex:1;min-width:0}
        .mg-text-cycle-label{font-size:11px;color:var(--accent);font-weight:700;text-transform:uppercase;letter-spacing:1px}
        .mg-text-cycle-count{font-size:11px;color:var(--muted);margin-left:8px}
        .mg-text-cycle-preview{font-size:12px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .mg-text-mode{display:flex;gap:8px;margin-top:6px}
        .mg-text-mode button{padding:4px 10px;border-radius:6px;border:1px solid var(--border);background:var(--card);color:var(--muted);font-size:11px;cursor:pointer;transition:all .2s}
        .mg-text-mode button.active{border-color:var(--accent);color:var(--accent);background:rgba(245,158,11,.1)}
        .mg-text-mode button:hover{border-color:var(--accent)}

        @media(max-width:768px){
          .mg-editor.open{grid-template-columns:1fr}
          .mg-canvas-wrap{padding:8px}
          .mg-canvas-wrap canvas{max-height:50vh}
          .mg-wrap{padding:1rem 0.75rem}
        }
      </style>
      <div class="mg-wrap">
        <cc-page-header icon="😂" title="Meme Generator" description="Create & share custom memes"></cc-page-header>
        <div id="meme-editor" class="mg-editor">
          <div class="mg-canvas-wrap">
            <canvas id="meme-canvas" width="600" height="600"></canvas>
          </div>
          <div class="mg-controls">
            <div>
              <div class="mg-cycle">
                <button class="mg-cycle-btn" id="prev-btn" title="Previous template">‹</button>
                <div style="flex:1;min-width:0;">
                  <h3 class="mg-selected-name" id="selected-name"></h3>
                  <span class="mg-cycle-counter" id="cycle-counter"></span>
                </div>
                <button class="mg-cycle-btn" id="next-btn" title="Next template">›</button>
              </div>
              <button class="mg-btn-ghost" id="back-btn">← Back to templates</button>
            </div>

            <div class="mg-text-cycle" id="text-cycler">
              <button class="mg-text-cycle-btn" id="prev-text-btn" title="Previous text">‹</button>
              <div class="mg-text-cycle-info">
                <span class="mg-text-cycle-label">🔥 Pre-loaded Captions</span>
                <span class="mg-text-cycle-count" id="text-cycle-count"></span>
                <div class="mg-text-cycle-preview" id="text-cycle-preview">Cycle through edgy pre-written text →</div>
              </div>
              <button class="mg-text-cycle-btn" id="next-text-btn" title="Next text">›</button>
            </div>
            <div class="mg-text-mode">
              <button class="active" id="mode-cycle-btn">🔥 Pre-loaded</button>
              <button id="mode-custom-btn">✏️ Custom</button>
            </div>

            <div><label>Top Text</label><input type="text" id="top-text" placeholder="TOP TEXT"></div>
            <div><label>Bottom Text</label><input type="text" id="bottom-text" placeholder="BOTTOM TEXT"></div>
            <div>
              <label>Font Size</label>
              <div class="mg-range-wrap">
                <input type="range" id="font-size" min="16" max="80" value="48">
                <span class="mg-range-val" id="font-val">48</span>
              </div>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              <button class="mg-btn" id="download-btn">⬇ Download Meme</button>
              <button class="mg-btn" id="save-gallery-btn" style="background:rgba(34,197,94,.15);border-color:rgba(34,197,94,.4);color:#22c55e">💾 Save to Gallery</button>
            </div>
          </div>
        </div>
        <input type="text" class="mg-search" id="meme-search" placeholder="Search meme templates... (IShowSpeed, Drake, Skibidi, etc.)">
        <div id="meme-grid" class="mg-grid"><p style="color:var(--muted);">Loading templates...</p></div>
      </div>
    `;
    this.bindEvents();
  }

  bindEvents() {
    this.querySelector('#meme-search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      this.filtered = this.memes.filter(m => m.name.toLowerCase().includes(q));
      this.renderGrid();
    });
    this.querySelector('#top-text').addEventListener('input', e => {
      this.topText = e.target.value;
      this.textIndex = -1; // switch to custom mode on manual edit
      this.updateTextModeButtons();
      this.drawCanvas();
    });
    this.querySelector('#bottom-text').addEventListener('input', e => {
      this.bottomText = e.target.value;
      this.textIndex = -1;
      this.updateTextModeButtons();
      this.drawCanvas();
    });
    this.querySelector('#font-size').addEventListener('input', e => {
      this.fontSize = parseInt(e.target.value);
      this.querySelector('#font-val').textContent = this.fontSize;
      this.drawCanvas();
    });
    this.querySelector('#back-btn').addEventListener('click', () => {
      this.selected = null;
      this.selectedIndex = -1;
      this.textIndex = -1;
      this.querySelector('#meme-editor').classList.remove('open');
      this.querySelector('#meme-search').style.display = '';
      this.querySelector('#meme-grid').style.display = '';
    });
    this.querySelector('#prev-btn').addEventListener('click', () => this.cycleMeme(-1));
    this.querySelector('#next-btn').addEventListener('click', () => this.cycleMeme(1));
    this.querySelector('#prev-text-btn').addEventListener('click', () => this.cycleText(-1));
    this.querySelector('#next-text-btn').addEventListener('click', () => this.cycleText(1));
    this.querySelector('#mode-cycle-btn').addEventListener('click', () => {
      this.textIndex = 0;
      this.applyTextFromBank();
      this.updateTextModeButtons();
    });
    this.querySelector('#mode-custom-btn').addEventListener('click', () => {
      this.textIndex = -1;
      this.updateTextModeButtons();
    });
    this.querySelector('#download-btn').addEventListener('click', () => this.downloadMeme());
    this.querySelector('#save-gallery-btn').addEventListener('click', () => this.saveToGallery());
  }

  updateTextModeButtons() {
    const cycleBtn = this.querySelector('#mode-cycle-btn');
    const customBtn = this.querySelector('#mode-custom-btn');
    if (this.textIndex >= 0) {
      cycleBtn.classList.add('active');
      customBtn.classList.remove('active');
    } else {
      cycleBtn.classList.remove('active');
      customBtn.classList.add('active');
    }
  }

  _getShuffledOrder(memeId) {
    if (!this._shuffledOrder[memeId]) {
      const texts = this.getTextsForMeme(memeId);
      const indices = texts.map((_, i) => i);
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      this._shuffledOrder[memeId] = indices;
      this._usedTexts[memeId] = new Set();
    }
    return this._shuffledOrder[memeId];
  }

  _getNextUnusedIndex(memeId) {
    const order = this._getShuffledOrder(memeId);
    const used = this._usedTexts[memeId];
    // Find next unused in shuffled order
    for (const idx of order) {
      if (!used.has(idx)) return idx;
    }
    // All used — reshuffle and start over
    this._shuffledOrder[memeId] = null;
    this._usedTexts[memeId] = new Set();
    return this._getNextUnusedIndex(memeId);
  }

  cycleText(dir) {
    if (!this.selected) return;
    const texts = this.getTextsForMeme(this.selected.id);
    if (!texts.length) return;
    const memeId = this.selected.id;
    // Always pick next unused text (ignores dir for simplicity — always forward through shuffled order)
    const nextIdx = this._getNextUnusedIndex(memeId);
    this._usedTexts[memeId].add(nextIdx);
    this.textIndex = nextIdx;
    this.applyTextFromBank();
    this.updateTextModeButtons();
  }

  applyTextFromBank() {
    if (!this.selected) return;
    const texts = this.getTextsForMeme(this.selected.id);
    if (!texts.length || this.textIndex < 0) return;
    const t = texts[this.textIndex];
    this.topText = t.top;
    this.bottomText = t.bottom;
    const topEl = this.querySelector('#top-text');
    const botEl = this.querySelector('#bottom-text');
    if (topEl) topEl.value = this.topText;
    if (botEl) botEl.value = this.bottomText;
    const countEl = this.querySelector('#text-cycle-count');
    const previewEl = this.querySelector('#text-cycle-preview');
    if (countEl) countEl.textContent = `${this.textIndex + 1} of ${texts.length}`;
    if (previewEl) previewEl.textContent = t.top ? `${t.top} / ${t.bottom}` : t.bottom;
    this.drawCanvas();
  }

  cycleMeme(dir) {
    const list = this.filtered.length ? this.filtered : this.memes;
    if (!list.length) return;
    this.selectedIndex = (this.selectedIndex + dir + list.length) % list.length;
    const meme = list[this.selectedIndex];
    this.selected = meme;
    this.querySelector('#selected-name').textContent = meme.name;
    this.querySelector('#cycle-counter').textContent = `${this.selectedIndex + 1} of ${list.length}`;
    // Auto-load a shuffled text option for new template (no repeats)
    this.textOptions = this.getTextsForMeme(meme.id);
    if (this.textOptions.length) {
      const nextIdx = this._getNextUnusedIndex(meme.id);
      this._usedTexts[meme.id] = this._usedTexts[meme.id] || new Set();
      this._usedTexts[meme.id].add(nextIdx);
      this.textIndex = nextIdx;
    } else {
      this.textIndex = -1;
    }
    this.applyTextFromBank();
    this.updateTextModeButtons();
    this.loadImage(meme.url);
  }

  renderGrid() {
    const grid = this.querySelector('#meme-grid');
    const customIds = new Set(this.getCustomTemplates().map(c => c.id));
    if (!this.filtered.length) {
      grid.innerHTML = '<cc-empty-state icon="🔍" message="No templates match that search" animation="none"></cc-empty-state>';
      return;
    }
    grid.innerHTML = this.filtered.map(m => `
      <div class="mg-thumb${this.selected && this.selected.id === m.id ? ' active' : ''}${customIds.has(m.id) ? ' fresh' : ''}" data-id="${this._escAttr(m.id)}">
        <img src="${this._escAttr(m.url)}" alt="${this._escAttr(m.name)}" loading="lazy">
        <p>${this._esc(m.name)}</p>
      </div>
    `).join('');
    grid.querySelectorAll('.mg-thumb').forEach(el => {
      el.addEventListener('click', () => {
        const meme = this.memes.find(m => m.id === el.dataset.id);
        if (meme) this.selectMeme(meme);
      });
    });
  }

  selectMeme(meme) {
    this.selected = meme;
    const list = this.filtered.length ? this.filtered : this.memes;
    this.selectedIndex = list.findIndex(m => m.id === meme.id);
    this.querySelector('#selected-name').textContent = meme.name;
    this.querySelector('#cycle-counter').textContent = `${this.selectedIndex + 1} of ${list.length}`;
    this.querySelector('#meme-editor').classList.add('open');
    this.querySelector('#meme-search').style.display = 'none';
    this.querySelector('#meme-grid').style.display = 'none';
    // Auto-load first unused text option (no repeats)
    this.textOptions = this.getTextsForMeme(meme.id);
    if (this.textOptions.length) {
      const nextIdx = this._getNextUnusedIndex(meme.id);
      this._usedTexts[meme.id] = this._usedTexts[meme.id] || new Set();
      this._usedTexts[meme.id].add(nextIdx);
      this.textIndex = nextIdx;
    } else {
      this.textIndex = -1;
    }
    this.applyTextFromBank();
    this.updateTextModeButtons();
    this.loadImage(meme.url);
  }

  loadImage(url) {
    this._img = new Image();
    this._img.crossOrigin = 'anonymous';
    this._img.onload = () => this.drawCanvas();
    this._img.onerror = () => {
      this._img = new Image();
      this._img.onload = () => { this._corsBlocked = true; this.drawCanvas(); };
      this._img.src = url;
    };
    this._corsBlocked = false;
    this._img.src = url;
  }

  drawCanvas() {
    if (!this._img || !this._img.complete) return;
    const canvas = this.querySelector('#meme-canvas');
    const ctx = canvas.getContext('2d');
    const img = this._img;

    canvas.width = img.naturalWidth || 600;
    canvas.height = img.naturalHeight || 600;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const fs = this.fontSize * (canvas.width / 600);
    ctx.font = `bold ${fs}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = fs / 12;
    ctx.lineJoin = 'round';

    if (this.topText) {
      this.drawText(ctx, this.topText.toUpperCase(), canvas.width / 2, fs + 10, canvas.width - 20, fs);
    }
    if (this.bottomText) {
      this.drawText(ctx, this.bottomText.toUpperCase(), canvas.width / 2, canvas.height - 15, canvas.width - 20, fs, true);
    }
  }

  drawText(ctx, text, x, y, maxW, fs, fromBottom = false) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lineH = fs * 1.1;
    let startY = fromBottom ? y - (lines.length - 1) * lineH : y;

    for (const l of lines) {
      ctx.strokeText(l, x, startY);
      ctx.fillText(l, x, startY);
      startY += lineH;
    }
  }

  downloadMeme() {
    const canvas = this.querySelector('#meme-canvas');
    try {
      const link = document.createElement('a');
      link.download = (this.selected?.name || 'meme').replace(/\s+/g, '-').toLowerCase() + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      window.showToast?.('CORS blocked download. Try right-clicking the canvas to save.', 5000);
    }
  }

  async saveToGallery() {
    const btn = this.querySelector('#save-gallery-btn');
    const canvas = this.querySelector('#meme-canvas');
    if (!canvas || !this.selected) {
      window.showToast?.('Select a template first', 3000);
      return;
    }
    btn.disabled = true;
    btn.textContent = '⏳ Saving...';
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const topText = this.querySelector('#top-text')?.value || '';
      const bottomText = this.querySelector('#bottom-text')?.value || '';
      const slug = (this.selected.name + '-' + (topText || bottomText || 'meme')).replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 80);
      const id = slug + '-' + Date.now();
      const SB_URL = document.querySelector('meta[name="supabase-url"]')?.content || 'https://lregiwsovpmljxjvrrsc.supabase.co';
      const SB_KEY = document.querySelector('meta[name="supabase-key"]')?.content || 'sb_publishable_HPinRWPrX97uxshGM0u1rw_UAsQsyFq';
      const headers = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
      const row = {
        id,
        name: `${this.selected.name} — ${topText || bottomText || 'custom meme'}`.slice(0, 200),
        type: 'Image',
        url: dataUrl,
        description: [topText, bottomText].filter(Boolean).join(' / ') || null,
        tags: ['meme', 'meme-generator', this.selected.name.toLowerCase().replace(/\s+/g, '-')],
        createdAt: new Date().toISOString()
      };
      const res = await fetch(`${SB_URL}/rest/v1/media`, { method: 'POST', headers, body: JSON.stringify(row) });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      window.showToast?.('Saved to media gallery! 🎉', 3000);
    } catch (e) {
      console.error('Save to gallery:', e);
      window.showToast?.('Failed to save: ' + e.message, 5000);
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Save to Gallery';
    }
  }
}
customElements.define('cc-meme-generator', CcMemeGenerator);
