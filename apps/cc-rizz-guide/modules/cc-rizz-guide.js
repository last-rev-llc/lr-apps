/* cc-rizz-guide — The No-BS College Dating Guide (2025-2026) */
class CcRizzGuide extends HTMLElement {
  connectedCallback() {
    this._render();
    this._setupQuizzes();
    this._setupEventListeners();
  }

  _setupEventListeners() {
    // Flag toggle click handlers
    this.addEventListener('click', (e) => {
      const flagCard = e.target.closest('[data-action="toggle-flag"]');
      if (flagCard) {
        const flagDetail = flagCard.querySelector('.flag-detail');
        if (flagDetail) {
          flagDetail.toggleAttribute('hidden');
        }
      }
    });
  }

  _esc(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  _render() {
    this.innerHTML = `
<style>
.rg{max-width:800px;margin:0 auto;padding:1rem;}
.rg h2{font-family:var(--serif);font-size:1.6rem;margin:0 0 .75rem;}
.rg h3{font-size:1.15rem;margin:1.25rem 0 .5rem;color:var(--text);}
.rg p,.rg li{color:var(--muted);line-height:1.7;font-size:.95rem;}
.rg .tip-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.25rem;margin:.75rem 0;}
.rg .tip-card h4{margin:0 0 .5rem;font-size:1rem;color:var(--text);}
.rg .tip-card p{margin:0;font-size:.9rem;}
.rg .msg-example{background:var(--prompt-bg);border-radius:10px;padding:.75rem 1rem;margin:.5rem 0;font-size:.9rem;border-left:3px solid var(--accent);}
.rg .msg-good{border-left-color:var(--green);}
.rg .msg-bad{border-left-color:var(--red);}
.rg .msg-label{font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.25rem;font-weight:600;}
.rg .msg-label.good{color:var(--green);}
.rg .msg-label.bad{color:var(--red);}
.rg .flag-card{border-radius:12px;padding:1rem 1.25rem;margin:.5rem 0;cursor:pointer;transition:transform .15s;}
.rg .flag-card:hover{transform:translateY(-2px);}
.rg .flag-red{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);}
.rg .flag-green{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);}
.rg .flag-amber{background:rgba(234,179,8,.1);border:1px solid rgba(234,179,8,.3);}
.rg .flag-card h4{margin:0 0 .35rem;font-size:.95rem;}
.rg .flag-card p{margin:0;font-size:.85rem;}
.rg .scenario{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:1.5rem;margin:1rem 0;}
.rg .scenario h4{margin:0 0 .75rem;font-size:1.05rem;color:var(--accent);}
.rg .do-dont{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:.75rem 0;}
@media(max-width:600px){.rg .do-dont{grid-template-columns:1fr;}}
.rg .do-col h5,.rg .dont-col h5{margin:0 0 .5rem;font-size:.85rem;}
.rg .do-col h5{color:var(--green);}
.rg .dont-col h5{color:var(--red);}
.rg .do-col li,.rg .dont-col li{font-size:.85rem;margin:.25rem 0;}
.rg .quiz-container{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:1.5rem;margin:1rem 0;}
.rg .quiz-progress{display:flex;gap:6px;margin-bottom:1rem;}
.rg .quiz-dot{width:10px;height:10px;border-radius:50%;background:var(--border);transition:background .2s;}
.rg .quiz-dot.active{background:var(--accent);}
.rg .quiz-dot.done{background:var(--green);}
.rg .quiz-q{font-size:1.05rem;margin-bottom:1rem;color:var(--text);font-weight:500;}
.rg .quiz-opts{display:flex;flex-direction:column;gap:.5rem;}
.rg .quiz-opt{background:var(--prompt-bg);border:1px solid var(--border);border-radius:10px;padding:.75rem 1rem;cursor:pointer;font-size:.9rem;color:var(--text);transition:all .15s;text-align:left;}
.rg .quiz-opt:hover{border-color:var(--accent);background:rgba(124,58,237,.1);}
.rg .quiz-opt.selected{border-color:var(--accent);background:rgba(124,58,237,.15);}
.rg .quiz-result{text-align:center;padding:2rem 1rem;}
.rg .quiz-result h3{color:var(--accent);font-size:1.3rem;margin-bottom:.5rem;}
.rg .quiz-result p{max-width:500px;margin:0 auto;}
.rg .quiz-btn{background:var(--accent);color:#fff;border:none;border-radius:8px;padding:.6rem 1.5rem;font-size:.9rem;cursor:pointer;margin-top:1rem;}
.rg .quiz-btn:hover{opacity:.9;}
.rg .quiz-btn:disabled{opacity:.4;cursor:not-allowed;}
.rg .section-intro{font-size:1rem;color:var(--text);margin-bottom:1.25rem;line-height:1.7;}
.rg .app-tip{display:inline-block;background:rgba(124,58,237,.12);border-radius:6px;padding:2px 8px;font-size:.8rem;color:var(--accent);font-weight:500;margin:2px;}
.rg .step-num-inline{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;font-size:.75rem;font-weight:700;margin-right:.5rem;flex-shrink:0;}
.rg ul{padding-left:1.25rem;}
.rg .tabs-intro{margin-bottom:0;}
</style>

<div class="rg">
  <cc-fade-in>
    <div style="text-align:center;margin-bottom:1.5rem;">
      <h1 style="font-family:var(--serif);font-size:2rem;margin:0;">The Rizz Guide</h1>
      <p style="color:var(--muted);margin:.5rem 0 0;">A no-BS guide to dating and connecting in college — 2025-2026 edition</p>
    </div>
  </cc-fade-in>

  <cc-tabs active="landscape">

    <!-- ═══════════ TAB 1: THE LANDSCAPE ═══════════ -->
    <cc-tab name="landscape" label="The Landscape" icon="map">
      <cc-stagger delay="40">
        <div>
          <h2>How Dating Actually Works Right Now</h2>
          <p class="section-intro">Forget everything your older siblings told you. The game has shifted — hard. Here's what's actually happening on campuses in 2025-2026.</p>

          <div class="tip-card">
            <h4>IRL Is Back (For Real This Time)</h4>
            <p>The post-pandemic pendulum swung. Gen Z is burned out on apps — Hinge fatigue is real. More people are meeting through classes, clubs, and group hangs than through swiping. Situationships are declining because people are craving actual connection. If you've been hiding behind a screen, now's the time to touch grass.</p>
          </div>

          <div class="tip-card">
            <h4>Story Reactions = The New "Hey"</h4>
            <p>Nobody cold-DMs anymore (well, nobody who gets responses). The move now is the story reaction pipeline: you react to their Instagram story with a 🔥 or 😂, they react back, you reply to the next one with an actual comment, and suddenly you're in each other's DMs without either of you technically "sliding in." It's a digital wink — low-risk, high-signal.</p>
          </div>

          <div class="tip-card">
            <h4>Voice Notes > Text Walls</h4>
            <p>Texting paragraphs is giving try-hard. Voice notes hit different — they convey tone, energy, and personality in a way text can't. Keep them under 90 seconds though (anything longer and you're recording a podcast, not flirting). They're especially clutch when you're past the initial "hey" phase and want to build actual rapport.</p>
          </div>

          <div class="tip-card">
            <h4>Google Calendar Invites Are Normal</h4>
            <p>This sounds unhinged but it's actually peak efficiency: sending a Google Calendar invite for a date is completely normal now. It shows you're serious, organized, and actually planning to show up. "I'll send you a cal invite" after agreeing on coffee Tuesday is chef's kiss — not corporate, just intentional.</p>
          </div>

          <div class="tip-card">
            <h4>Screensharing as Intimacy</h4>
            <p>Before FaceTime dates were the move. Now it's screensharing — watching TikToks together on FaceTime, co-building a Spotify playlist, or doing side-by-side homework on Discord screenshare. It's low-pressure intimacy that doesn't require you to stare at each other's faces for an hour. If they let you see their For You Page, that's basically third-date energy.</p>
          </div>

          <div class="tip-card">
            <h4>The "Soft Launch" Ecosystem</h4>
            <p>The progression: you exist → you're in their Close Friends → your hand appears in their story → they tag you → you're in a main grid post. This is the modern relationship escalation ladder. Don't skip steps. And for the love of god, don't post someone without their explicit consent — that's a relationship-ending ick.</p>
          </div>

          <h3>The Current App Landscape</h3>
          <p><span class="app-tip">Hinge</span> Still the "relationship app" — best for people actually looking for something. Prompts matter more than photos.</p>
          <p><span class="app-tip">Bumble</span> Women message first, which some people love and others find limiting. The friend/networking modes are actually useful.</p>
          <p><span class="app-tip">Tinder</span> Still exists, still mostly hookup-coded. Gold/Platinum is not worth it in college. Useful at a new campus to see who's around.</p>
          <p><span class="app-tip">Instagram</span> The #1 non-dating-app dating app. Story reactions → DMs is the meta.</p>
          <p><span class="app-tip">Snapchat</span> If you're under 22, this is still a primary communication tool. Snap score doesn't matter but streaks signal consistency.</p>
        </div>
      </cc-stagger>
    </cc-tab>

    <!-- ═══════════ TAB 2: APPROACH IRL ═══════════ -->
    <cc-tab name="irl" label="IRL Approach" icon="users">
      <cc-stagger delay="40">
        <div>
          <h2>How to Actually Approach People IRL</h2>
          <p class="section-intro">The biggest flex in 2025 is being able to talk to someone in person. Most people can't — which means if you can, you're already ahead. Here's how to do it without being weird.</p>

          <h3>The Proximity Method</h3>
          <div class="tip-card">
            <h4>Step 1: Be Present</h4>
            <p>Before you ever say a word, just... be around. Sit in the same area of the lecture hall. Go to the same coffee shop. Show up to the same club meetings. Humans are wired to feel comfortable around familiar faces — psychologists call it the "mere exposure effect." You're not stalking; you're becoming a known entity.</p>
          </div>
          <div class="tip-card">
            <h4>Step 2: Make Passive Contact</h4>
            <p>Eye contact + a small smile. Not a stare — a glance that says "I see you and I'm not weird." If they look back, you're golden. If they smile back? You basically have permission to speak. This sounds small but most people skip this and jump straight to talking, which can feel jarring.</p>
          </div>
          <div class="tip-card">
            <h4>Step 3: Find a Context</h4>
            <p>The best approaches have a reason. "Hey, did you catch what the prof said about the midterm?" is 10x more natural than "Hey, you're cute." Context removes the pressure from both sides. You're not confessing your feelings — you're being a normal human who talks to other humans.</p>
          </div>

          <h3>Scenario: Coffee Shop / Library</h3>
          <div class="scenario">
            <h4>"I want to talk to someone I keep seeing at the same study spot"</h4>
            <p>This is actually the easiest setting because you already have repeated proximity. The move:</p>
            <ul>
              <li>Week 1-2: Just be there. Nod/smile if you make eye contact.</li>
              <li>Week 2-3: Low-stakes interaction. "Is this outlet working?" or "Mind watching my stuff for a sec?"</li>
              <li>Week 3+: Actual conversation. "I feel like we're on the same study schedule — I'm [name]."</li>
            </ul>
            <div class="do-dont">
              <div class="do-col">
                <h5>DO</h5>
                <ul>
                  <li>Keep it brief the first time — plant the seed and bounce</li>
                  <li>Wear one headphone out (signal you're approachable)</li>
                  <li>Sit nearby but not directly next to them</li>
                  <li>Reference the shared environment</li>
                </ul>
              </div>
              <div class="dont-col">
                <h5>DON'T</h5>
                <ul>
                  <li>Sit across from them and stare over your laptop</li>
                  <li>Interrupt if they have both headphones in</li>
                  <li>Open with a pickup line (just... no)</li>
                  <li>Linger after they give short answers</li>
                </ul>
              </div>
            </div>
          </div>

          <h3>Scenario: Parties & Social Events</h3>
          <div class="scenario">
            <h4>"I'm at a party and I see someone I want to talk to"</h4>
            <p>Parties are honestly easier because the social contract already says "talk to people." The energy is loose. Use it.</p>
            <ul>
              <li>Position yourself near them (kitchen, drink area, porch — wherever they're hanging)</li>
              <li>Comment on something shared: the music, the vibe, someone's wild outfit</li>
              <li>"This song is actually so good" or "Do you know whose house this is?" — anything contextual</li>
              <li>If the vibe is there after 5-10 minutes, suggest moving somewhere quieter to actually talk</li>
            </ul>
            <div class="do-dont">
              <div class="do-col">
                <h5>DO</h5>
                <ul>
                  <li>Bring your own energy — don't rely on liquid courage</li>
                  <li>Include their friends in the convo (it builds trust)</li>
                  <li>Exchange Instagrams, not just numbers</li>
                  <li>Follow up the next day with a story reaction</li>
                </ul>
              </div>
              <div class="dont-col">
                <h5>DON'T</h5>
                <ul>
                  <li>Corner someone or block their exit</li>
                  <li>Push drinks on anyone</li>
                  <li>Follow them around the party</li>
                  <li>Get too drunk to have a real conversation</li>
                </ul>
              </div>
            </div>
          </div>

          <h3>Scenario: Classes & Study Groups</h3>
          <div class="scenario">
            <h4>"There's someone in my class I want to get to know"</h4>
            <p>Classes are the #1 IRL meeting spot for college students and it's not close. You have built-in proximity, shared context, and a natural excuse to talk.</p>
            <ul>
              <li>Sit near them (not next to — one or two seats away)</li>
              <li>Ask about notes, assignments, or study groups</li>
              <li>"Want to study for the exam together?" is the golden ask</li>
              <li>Group study sessions → smaller group → one-on-one → coffee after</li>
            </ul>
            <div class="msg-example msg-good">
              <div class="msg-label good">GOOD OPENER</div>
              "Hey, are you in [Prof]'s 2pm section too? I'm lost on the reading for Thursday — have you started it?"
            </div>
            <div class="msg-example msg-bad">
              <div class="msg-label bad">BAD OPENER</div>
              "Hey I've been wanting to talk to you all semester, you're really pretty"
            </div>
            <p style="font-size:.85rem;">The first is natural and creates a reason to keep talking. The second puts all your cards on the table with zero rapport built — it's overwhelming and usually makes people uncomfortable.</p>
          </div>

          <h3>Reading Interest Signals</h3>
          <div class="tip-card">
            <h4>They're Into It If...</h4>
            <p>They're angling their body toward you. They ask follow-up questions (not just answering yours). They find reasons to touch their hair/face/neck while talking to you. They remember details from previous conversations. They laugh at things that aren't that funny. They don't check their phone. They suggest hanging out ("we should study together sometime").</p>
          </div>
          <div class="tip-card">
            <h4>They're Not Into It If...</h4>
            <p>Short answers with no follow-ups. Body angled away or toward the door. They mention a partner (take the hint). Consistently "busy" with no counter-offer. Left on read more than once. They're polite but never initiate. Trust your gut — if it feels like you're pulling teeth, you probably are.</p>
          </div>
        </div>
      </cc-stagger>
    </cc-tab>

    <!-- ═══════════ TAB 3: DIGITAL GAME ═══════════ -->
    <cc-tab name="digital" label="Digital Game" icon="smartphone">
      <cc-stagger delay="40">
        <div>
          <h2>How to Actually Do It Online</h2>
          <p class="section-intro">Your digital presence IS your first impression for a lot of people. Here's how to make it count without being cringe or catfishy.</p>

          <h3>The DM Slide Framework</h3>
          <div class="tip-card">
            <h4>The 3-Step Pipeline</h4>
            <p>Cold DMs are dead. The meta is a gradual warmup:</p>
            <p><span class="step-num-inline">1</span> <strong>React to their story.</strong> Just a 🔥 or 😂. This puts you on their radar. Low commitment, low risk.</p>
            <p><span class="step-num-inline">2</span> <strong>Reply to a story with a comment.</strong> Not "haha" — something specific. "Wait where is that coffee shop??" or "Okay that sunset is unreal." You're now in their DMs but in a contextual way.</p>
            <p><span class="step-num-inline">3</span> <strong>Start an actual conversation.</strong> If they respond positively to step 2, you can now DM them about other things. The door is open.</p>
          </div>

          <div class="msg-example msg-good">
            <div class="msg-label good">GOOD DM SLIDE</div>
            [Reacts 🔥 to their hiking story]<br>
            → Next story: "Ok I need that trail name, I've been trying to find good hikes near campus"<br>
            → Convo flows → "We should check out [trail] sometime, I've been meaning to go"
          </div>
          <div class="msg-example msg-bad">
            <div class="msg-label bad">BAD DM SLIDE</div>
            "Hey 👋 I know we don't really know each other but I think you're really attractive and I'd love to get to know you"
          </div>
          <p style="font-size:.85rem;color:var(--muted);">The first feels organic. The second reads like a cover letter for a relationship. Even if your intentions are sweet, it's too much too fast.</p>

          <h3>Profile Optimization</h3>
          <div class="tip-card">
            <h4>Photos That Actually Work</h4>
            <ul>
              <li><strong>Lead with a clear face shot.</strong> Not a group photo, not a sunset, not your car. Your face.</li>
              <li><strong>Show your life.</strong> A candid at a party, doing a hobby, with friends, traveling. People want to see what hanging out with you looks like.</li>
              <li><strong>Ditch the mirror selfies.</strong> Especially shirtless gym ones. If you're fit, let it show naturally in a beach/pool/hiking photo.</li>
              <li><strong>Quality matters.</strong> You don't need a DSLR but no blurry screenshots of screenshots.</li>
              <li><strong>Pet photos work.</strong> This is evergreen. If you have a dog, that photo goes in the lineup.</li>
            </ul>
          </div>

          <div class="tip-card">
            <h4>Bios That Don't Suck</h4>
            <p>Your bio should do one of three things: make them laugh, tell them something interesting, or give them something to ask about. Ideally two of three.</p>
            <ul>
              <li><strong>AI-written bios are fine</strong> if they actually sound like you. Nobody cares how you wrote it — they care if it's good.</li>
              <li><strong>Avoid:</strong> "Just ask" / height listing with nothing else / "fluent in sarcasm" / "looking for my partner in crime"</li>
              <li><strong>Include:</strong> One specific hobby, one opinion or take, and something that invites a question</li>
            </ul>
            <div class="msg-example msg-good">
              <div class="msg-label good">GOOD BIO</div>
              "Psych major who makes a suspiciously good oat milk latte. Will argue that Die Hard is a Christmas movie. Currently losing a battle against my sourdough starter."
            </div>
            <div class="msg-example msg-bad">
              <div class="msg-label bad">BAD BIO</div>
              "6'1 if that matters. Love to travel, eat good food, and have deep conversations. Looking for my person 🤷‍♂️"
            </div>
          </div>

          <h3>Voice Notes vs. Text</h3>
          <div class="tip-card">
            <h4>When to Use Voice Notes</h4>
            <ul>
              <li>When you want to convey energy/emotion that text can't capture</li>
              <li>Responding to something they told you about their day</li>
              <li>When a text would be too long (if you're typing a paragraph, just voice note it)</li>
              <li>Late-night conversations when you want it to feel more intimate</li>
            </ul>
            <h4>When to Stick to Text</h4>
            <ul>
              <li>Logistics (time, place, address)</li>
              <li>First few messages with someone new (voice notes too early can feel intense)</li>
              <li>When they're clearly at work/class and can't listen</li>
              <li>Sharing links, memes, or screenshots</li>
            </ul>
          </div>

          <h3>Platform-Specific Tips</h3>

          <div class="tip-card">
            <h4>Hinge</h4>
            <ul>
              <li>Comment on prompts, not just photos. "I need to hear the story behind [prompt answer]" works every time.</li>
              <li>Voice prompts are underrated — use them to stand out.</li>
              <li>Don't send a like without a comment. That's the app equivalent of waving from across a crowded room.</li>
              <li>If convo is good after 5-10 messages, suggest meeting up. Don't let it die in the app.</li>
            </ul>
          </div>

          <div class="tip-card">
            <h4>Bumble</h4>
            <ul>
              <li>If you can receive first messages: make your profile give them something to open with.</li>
              <li>If you send first: reference something specific from their profile. "Hey!" alone gets ignored 90% of the time.</li>
              <li>The 24-hour timer creates urgency — which is actually a feature, not a bug.</li>
            </ul>
          </div>

          <div class="tip-card">
            <h4>Snapchat</h4>
            <ul>
              <li>Streaks are maintenance, not flirting. Don't confuse consistency with interest.</li>
              <li>Snap them casual stuff from your day — your lunch, campus, study spot. It creates familiarity.</li>
              <li>If you want to take it somewhere, respond to their snap with a text message (not another snap). It signals you want to actually talk.</li>
            </ul>
          </div>

          <div class="tip-card">
            <h4>Soft-Launching Etiquette</h4>
            <ul>
              <li><strong>Always get consent</strong> before posting someone, even in a subtle way</li>
              <li>A hand in a story → a shadow/silhouette → a tagged post. This is the accepted progression.</li>
              <li>If someone asks you not to post them, respect it immediately. No guilt trips.</li>
              <li>Don't hard-launch before you've had the DTR conversation. That's putting the cart before the horse.</li>
            </ul>
          </div>
        </div>
      </cc-stagger>
    </cc-tab>

    <!-- ═══════════ TAB 4: THE PLAYBOOK ═══════════ -->
    <cc-tab name="playbook" label="Playbook" icon="book-open">
      <cc-stagger delay="40">
        <div>
          <h2>The Playbook</h2>
          <p class="section-intro">Real scenarios with step-by-step guidance. No generic "just be yourself" energy — actual moves.</p>

          <div class="scenario">
            <h4>"I see them in class every day but never talked to them"</h4>
            <p>This is the most common scenario and honestly the easiest to play. You have built-in proximity and shared context. The key is patience — don't rush it.</p>
            <p><span class="step-num-inline">1</span> <strong>Weeks 1-2:</strong> Sit in their general area. Make eye contact occasionally. Exist in their awareness.</p>
            <p><span class="step-num-inline">2</span> <strong>Week 3:</strong> Low-stakes comment before or after class. "Did you get what they meant about [topic]?" or "Is the homework due tomorrow or Thursday?"</p>
            <p><span class="step-num-inline">3</span> <strong>Week 4:</strong> "Hey, I didn't catch your name — I'm [name]." Exchange names and maybe Instagrams.</p>
            <p><span class="step-num-inline">4</span> <strong>Week 5+:</strong> "A bunch of us are studying for the midterm at [place], you should come." Group setting = low pressure.</p>
            <p><span class="step-num-inline">5</span> <strong>The close:</strong> After the group hang, follow up one-on-one. "That study session was clutch. Want to grab coffee before next class?"</p>
            <div class="msg-example msg-good">
              <div class="msg-label good">FOLLOW-UP TEXT</div>
              "hey it was nice actually meeting you today lol. lmk if you want to study for the midterm — I found a solid study guide"
            </div>
            <p><strong>What to expect:</strong> This will take 3-6 weeks. That's normal. Rushing it makes it weird. The slow burn builds genuine comfort.</p>
          </div>

          <div class="scenario">
            <h4>"We matched on an app but convo is dying"</h4>
            <p>App conversations have a 48-hour half-life. If it's dying, you need to either escalate or let it go.</p>
            <p><span class="step-num-inline">1</span> <strong>Diagnose:</strong> Are you asking questions they can't build on? ("What do you do for fun?" is a dead end. "I saw you're into hiking — what's the best trail you've done?" is alive.)</p>
            <p><span class="step-num-inline">2</span> <strong>Shift the medium:</strong> "Okay this app is terrible for actual conversations — what's your ig?" Moving to Instagram or text makes it feel more real.</p>
            <p><span class="step-num-inline">3</span> <strong>Propose a plan:</strong> Don't ask "would you maybe want to hang out sometime?" Ask: "There's a really good coffee spot on [street] — want to check it out Thursday afternoon?"</p>
            <div class="do-dont">
              <div class="do-col">
                <h5>DO</h5>
                <ul>
                  <li>Suggest a specific plan with a time and place</li>
                  <li>Move to a different platform if the app is killing the vibe</li>
                  <li>Send a voice note to inject some personality</li>
                  <li>Reference something specific from their profile</li>
                </ul>
              </div>
              <div class="dont-col">
                <h5>DON'T</h5>
                <ul>
                  <li>Double or triple text if they haven't responded</li>
                  <li>Send "hey" after a gap — acknowledge the gap naturally</li>
                  <li>Interview them (question after question with no sharing from you)</li>
                  <li>Take it personally — people are busy and apps are exhausting</li>
                </ul>
              </div>
            </div>
            <div class="msg-example msg-good">
              <div class="msg-label good">REVIVING A DEAD CONVO</div>
              "okay I just saw the most unhinged thing in the dining hall and I immediately thought of your answer about [their prompt]. [tells story]"
            </div>
          </div>

          <div class="scenario">
            <h4>"We've been in a situationship for 3 months"</h4>
            <p>Three months is the make-or-break point. You're either about to become something real or this is going to fade into "we used to talk." Time to have the conversation.</p>
            <p><span class="step-num-inline">1</span> <strong>Check in with yourself first.</strong> What do you actually want? Be honest. If you want a relationship, own that. If you're fine with casual, own that too. But don't pretend you're chill when you're not.</p>
            <p><span class="step-num-inline">2</span> <strong>Have the DTR conversation.</strong> In person. Not over text. Not after hooking up. Over coffee or on a walk. "Hey, I've been really enjoying this and I want to be honest about where I'm at — I'm starting to want more than just casual. What are you thinking?"</p>
            <p><span class="step-num-inline">3</span> <strong>Accept the answer.</strong> If they want the same thing, great. If they don't, you have your answer. Don't try to convince someone to want a relationship with you. That never ends well.</p>
            <div class="msg-example msg-good">
              <div class="msg-label good">HOW TO BRING IT UP</div>
              "hey can we talk about something? not in a scary way lol. I just want to make sure we're on the same page about what this is. want to grab coffee tomorrow?"
            </div>
            <div class="msg-example msg-bad">
              <div class="msg-label bad">HOW NOT TO BRING IT UP</div>
              "so what are we 🙃" (over text at 1am)
            </div>
          </div>

          <div class="scenario">
            <h4>"My friend's friend is cute"</h4>
            <p>The mutual friend pipeline is GOATED. It's the most natural way to meet someone because trust is already built in.</p>
            <p><span class="step-num-inline">1</span> <strong>Tell your friend.</strong> Literally just say "hey, your friend [name] seems cool — what's their deal?" Your friend becomes an intel source and potential wingperson.</p>
            <p><span class="step-num-inline">2</span> <strong>Engineer a group hang.</strong> "We should all go to [event/dinner/party] together." The goal is to be in the same space naturally.</p>
            <p><span class="step-num-inline">3</span> <strong>Follow them on Instagram after the hang.</strong> You've met in person so this isn't weird. Like a recent post. React to a story. You know the pipeline.</p>
            <p><span class="step-num-inline">4</span> <strong>Suggest one-on-one.</strong> After the group hang: "It was fun meeting you last night! Want to grab lunch this week?"</p>
            <p><strong>Pro tip:</strong> Ask your friend to casually mention you before the group hang. "Oh yeah [your name] is coming too, they're really cool." Pre-game your reputation.</p>
          </div>

          <div class="scenario">
            <h4>"I got their Snap but what now"</h4>
            <p>Getting the Snap is step one, not the finish line. Here's how to turn a username into an actual connection.</p>
            <p><span class="step-num-inline">1</span> <strong>Don't immediately start snapping selfies.</strong> Start with their stories. Reply to one with something relevant.</p>
            <p><span class="step-num-inline">2</span> <strong>Send casual life snaps.</strong> Your coffee, a funny sign, campus sunset. You're building familiarity, not performing.</p>
            <p><span class="step-num-inline">3</span> <strong>Graduate to text chats within Snap.</strong> Snaps are vibes; text is where plans happen.</p>
            <p><span class="step-num-inline">4</span> <strong>Move off Snap within a week or two.</strong> "Here, let me just give you my number — Snap notifications are so broken for me." This signals you want something more substantial.</p>
            <div class="msg-example msg-good">
              <div class="msg-label good">NATURAL SNAP OPENER</div>
              [Sends snap of campus quad] "okay fall campus is actually gorgeous today"<br>
              → They reply → conversation starts organically
            </div>
          </div>
        </div>
      </cc-stagger>
    </cc-tab>

    <!-- ═══════════ TAB 5: FLAGS ═══════════ -->
    <cc-tab name="flags" label="Flags" icon="flag">
      <cc-stagger delay="40">
        <div>
          <h2>Red Flags, Green Flags & Amber Alerts</h2>
          <p class="section-intro">Not everything that glitters is a green flag, and not everything that scares you is red. Here's a real breakdown — tap any card for more detail.</p>

          <h3 style="color:var(--red);">Red Flags</h3>

          <div class="flag-card flag-red" data-action="toggle-flag">
            <h4>Love Bombing</h4>
            <p>"You're the most amazing person I've ever met" — and you met three days ago.</p>
            <div class="flag-detail" hidden style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid rgba(239,68,68,.2);font-size:.85rem;color:var(--muted);">
              Excessive compliments, gifts, and attention way too early. It feels amazing at first but it's often a control pattern. Healthy interest builds gradually — if someone is all-in before they actually know you, ask yourself what they're really into: you, or the idea of you?
            </div>
          </div>

          <div class="flag-card flag-red" data-action="toggle-flag">
            <h4>Breadcrumbing</h4>
            <p>Just enough contact to keep you interested, never enough to actually move forward.</p>
            <div class="flag-detail" hidden style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid rgba(239,68,68,.2);font-size:.85rem;color:var(--muted);">
              They text you once every few days with something flirty, like a post occasionally, maybe even suggest hanging out — but plans never materialize. You're being kept on the roster as a backup option. If someone wants to see you, they'll make it happen. Period.
            </div>
          </div>

          <div class="flag-card flag-red" data-action="toggle-flag">
            <h4>Ghosting Patterns</h4>
            <p>Disappears for days then pops back up like nothing happened — repeatedly.</p>
            <div class="flag-detail" hidden style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid rgba(239,68,68,.2);font-size:.85rem;color:var(--muted);">
              Everyone gets busy sometimes. But if someone consistently goes silent for 3-5 days then resurfaces with "sorry I've been so busy" without changing the pattern, they're showing you their actual priority level. Believe them.
            </div>
          </div>

          <div class="flag-card flag-red" data-action="toggle-flag">
            <h4>Jealousy Disguised as Care</h4>
            <p>"Who were you with last night?" framed as "I was just worried about you."</p>
            <div class="flag-detail" hidden style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid rgba(239,68,68,.2);font-size:.85rem;color:var(--muted);">
              Checking your location, getting upset when you hang out with other people, wanting to know who you're texting — none of this is romantic. It's controlling. Real care sounds like "hope you had fun tonight!" not "who was at that party?"
            </div>
          </div>

          <div class="flag-card flag-red" data-action="toggle-flag">
            <h4>Only Texts Late at Night</h4>
            <p>"wyd" at 11pm but radio silence during actual daylight hours.</p>
            <div class="flag-detail" hidden style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid rgba(239,68,68,.2);font-size:.85rem;color:var(--muted);">
              If the only time they think of you is after 10pm, you're not a priority — you're an option. Someone who actually likes you will text you at 2pm on a Tuesday about something that reminded them of you.
            </div>
          </div>

          <h3 style="color:var(--green);">Green Flags</h3>

          <div class="flag-card flag-green" data-action="toggle-flag">
            <h4>Consistent Communication</h4>
            <p>They text you back at a normal pace and keep conversations going without you having to carry it.</p>
            <div class="flag-detail" hidden style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid rgba(34,197,94,.2);font-size:.85rem;color:var(--muted);">
              Consistency isn't about texting 24/7 — it's about a reliable rhythm. They reply within a few hours (not days). They ask questions back. They bring up new topics. You don't feel like you're always the one initiating. This is the bare minimum, but it's honestly rare enough to be a green flag.
            </div>
          </div>

          <div class="flag-card flag-green" data-action="toggle-flag">
            <h4>Respects Boundaries</h4>
            <p>You say "I can't tonight" and they respond with "no worries, another time!" — genuinely.</p>
            <div class="flag-detail" hidden style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid rgba(34,197,94,.2);font-size:.85rem;color:var(--muted);">
              They don't guilt-trip you. They don't get passive-aggressive. They don't keep pushing. Respecting a "no" — even a small one — tells you everything about how they'll handle bigger boundaries later. This is huge.
            </div>
          </div>

          <div class="flag-card flag-green" data-action="toggle-flag">
            <h4>Shows Up IRL</h4>
            <p>Makes actual plans and follows through. Suggests real activities, not just "we should hang sometime."</p>
            <div class="flag-detail" hidden style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid rgba(34,197,94,.2);font-size:.85rem;color:var(--muted);">
              "Let's get ramen at that place on 5th, Friday at 7" hits completely different from "we should totally hang out soon." One is a plan. The other is a wish. People who are genuinely interested make specific, concrete plans.
            </div>
          </div>

          <div class="flag-card flag-green" data-action="toggle-flag">
            <h4>Introduces You to Their People</h4>
            <p>They bring you around their friends, mention you to their family, include you in group plans.</p>
            <div class="flag-detail" hidden style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid rgba(34,197,94,.2);font-size:.85rem;color:var(--muted);">
              If you only ever hang out alone (especially at their place), that's a pattern worth questioning. Someone who sees a future with you will naturally integrate you into their life. You'll meet the roommate, get invited to the friend group dinner, hear "my friends want to meet you."
            </div>
          </div>

          <h3 style="color:var(--yellow);">Amber Flags</h3>
          <p style="font-size:.9rem;color:var(--muted);">Not necessarily deal-breakers, but worth watching.</p>

          <div class="flag-card flag-amber" data-action="toggle-flag">
            <h4>Taking Forever to Define Things</h4>
            <p>"I don't like labels" — after 4 months of acting like a couple.</p>
            <div class="flag-detail" hidden style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid rgba(234,179,8,.2);font-size:.85rem;color:var(--muted);">
              Some people genuinely move slower and that's okay. But there's a difference between "I want to take our time" (with clear escalation) and "I don't want to define this" (with no movement). If you've been exclusive in practice for months but they won't call it a relationship, that's worth a direct conversation.
            </div>
          </div>

          <div class="flag-card flag-amber" data-action="toggle-flag">
            <h4>Never Makes Plans</h4>
            <p>Always down to hang when YOU suggest it, but never initiates.</p>
            <div class="flag-detail" hidden style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid rgba(234,179,8,.2);font-size:.85rem;color:var(--muted);">
              Could mean they're shy, could mean they're passive, could mean they're not that invested. Test it: stop initiating for a week and see what happens. If they reach out, they might just be a go-with-the-flow type. If radio silence? That's your answer.
            </div>
          </div>

          <div class="flag-card flag-amber" data-action="toggle-flag">
            <h4>Still Very Active on Dating Apps</h4>
            <p>You're three dates in and their Hinge is still getting daily updates.</p>
            <div class="flag-detail" hidden style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid rgba(234,179,8,.2);font-size:.85rem;color:var(--muted);">
              Before you've had the exclusivity talk, this is technically fine — they don't owe you monogamy after two coffee dates. But if you're past the casual stage and they're still actively swiping, it's worth addressing. "Hey, are you seeing other people?" is a valid question at any point.
            </div>
          </div>
        </div>
      </cc-stagger>
    </cc-tab>

    <!-- ═══════════ TAB 6: REALITY CHECKS ═══════════ -->
    <cc-tab name="reality" label="Reality Checks" icon="shield">
      <cc-stagger delay="40">
        <div>
          <h2>Pitfalls & Reality Checks</h2>
          <p class="section-intro">The stuff nobody wants to hear but everybody needs to. This section might sting a little — that's how you know it's working.</p>

          <div class="tip-card">
            <h4>Rejection Is Information, Not a Verdict</h4>
            <p>Here's the reframe that changes everything: rejection doesn't mean you're not attractive/interesting/worthy. It means that specific person, at that specific time, didn't feel a specific spark. That's it. You've rejected people too — not because they were bad, but because the vibe wasn't there. Give yourself the same grace. The goal isn't to make everyone like you. It's to find the people who do.</p>
          </div>

          <div class="tip-card">
            <h4>Why Situationships Happen (And How to Avoid Them)</h4>
            <p>Situationships exist because they're comfortable. You get companionship, physical intimacy, and someone to text without the "risk" of defining things and potentially losing it. The trap: you end up invested in something that was never meant to hold weight.</p>
            <p><strong>How to avoid if you don't want one:</strong></p>
            <ul>
              <li>Be honest about what you want early — even on the second date</li>
              <li>Don't play it cool when you actually have feelings</li>
              <li>Set a mental timeline (6-8 weeks) and if the conversation hasn't happened, bring it up yourself</li>
              <li>Pay attention to actions, not words. "I really like you" means nothing if their behavior says otherwise</li>
            </ul>
          </div>

          <div class="tip-card">
            <h4>The "Talking Stage" Trap</h4>
            <p>The talking stage should be a bridge, not a destination. If you've been "talking" for two months and still haven't been on a real date, you're not talking — you're being benched. Someone who wants to be with you will want to actually be with you, in person, doing things together. Texting indefinitely is not dating. It's pen-palling.</p>
          </div>

          <div class="tip-card">
            <h4>Social Media Is Lying to You</h4>
            <p>That couple on your feed who posts every date? They might be miserable. That person who seems to effortlessly attract everyone? They have insecurities too. That friend who's always "in a new thing"? Quality ≠ quantity. Instagram is a highlight reel. Nobody posts the nights they cried over a situationship or the dates that went nowhere. Stop comparing your behind-the-scenes to everyone else's highlight reel.</p>
          </div>

          <div class="tip-card">
            <h4>Hookup Culture vs. Relationship Goals</h4>
            <p>Both are valid. Full stop. The problem isn't hooking up or wanting a relationship — it's pretending you want one when you want the other. Be honest with yourself and the people you're involved with:</p>
            <ul>
              <li>If you want casual, say so. Don't act like you want a relationship to get someone in bed.</li>
              <li>If you want a relationship, don't pretend to be cool with casual hoping it'll "turn into something."</li>
              <li>You're allowed to change your mind — just communicate when you do.</li>
              <li>There's no moral hierarchy. Casual isn't immature and commitment isn't boring.</li>
            </ul>
          </div>

          <div class="tip-card">
            <h4>Consent Is Sexy, Not Awkward</h4>
            <p>"Can I kiss you?" is not a mood killer — it's actually incredibly attractive. Here's why: it shows confidence (you're stating your desire), respect (you're giving them a choice), and emotional intelligence (you're reading the room AND confirming). The people who say asking is "awkward" are telling on themselves. Every step of physical escalation should be enthusiastic from both sides. If you're not sure, ask. If the answer isn't an enthusiastic yes, it's a no.</p>
          </div>

          <div class="tip-card">
            <h4>Your Worth ≠ Your Relationship Status</h4>
            <p>Being single in college is not a failure state. It's actually an incredible time to figure out who you are without being defined by someone else. The best relationships happen when two whole people come together — not two half-people trying to complete each other. Work on being someone you'd want to date: have hobbies, have opinions, have a life that you love. The right people will be drawn to that energy.</p>
          </div>
        </div>
      </cc-stagger>
    </cc-tab>

    <!-- ═══════════ TAB 7: QUIZZES ═══════════ -->
    <cc-tab name="quizzes" label="Quizzes" icon="zap">
      <cc-stagger delay="40">
        <div>
          <h2>Interactive Quizzes</h2>
          <p class="section-intro">Find out your style, check your vibe, and diagnose your situation. (Not scientifically rigorous. Very fun.)</p>

          <h3>What's Your Flirting Style?</h3>
          <div class="quiz-container" id="quiz-flirt"></div>

          <h3>Are You Giving Green Flags?</h3>
          <div class="quiz-container" id="quiz-flags"></div>

          <h3>Situationship or Relationship?</h3>
          <div class="quiz-container" id="quiz-situ"></div>
        </div>
      </cc-stagger>
    </cc-tab>

    <!-- ═══════════ TAB 8: SOURCES ═══════════ -->
    <cc-tab name="sources" label="Sources" icon="bookmark">
      <cc-stagger delay="40">
        <div>
          <h2>Sources & References</h2>
          <p class="section-intro">Everything in this guide is backed by real research, surveys, and reporting. Here's where it all comes from.</p>

          <h3>IRL Dating & The App Fatigue Trend</h3>
          <div class="tip-card">
            <h4>77% of Gen Z Met Their Partner IRL</h4>
            <p>Hims/Hers national survey (March 2025) found only 23% of 18-29-year-olds met their partner digitally — 77% met the old-fashioned way.</p>
            <p><a href="https://www.hims.com/news/dating-in-person-vs-online" target="_blank" style="color:var(--accent);">hims.com — Gen Z Finding Love the Old Fashioned Way</a></p>
          </div>
          <div class="tip-card">
            <h4>72% of Gen Z Met Partners In Person</h4>
            <p>A separate 2026 survey confirmed 72% of Gen Z met their current or most recent partner in person.</p>
            <p><a href="https://www.prnewswire.com/news-releases/gen-zs-secret-love-lives-exposed-1-in-3-caught-texting-during-sex-and-24-texted-mom-back-302679457.html" target="_blank" style="color:var(--accent);">PR Newswire — Gen Z's Secret Love Lives Exposed (2026)</a></p>
          </div>
          <div class="tip-card">
            <h4>78% Report Dating App Burnout</h4>
            <p>Forbes Health survey (July 2025): 78% of Gen Z report dating app burnout. More than half feel burned out "often or always."</p>
            <p><a href="https://www.forbes.com/health/dating/dating-app-fatigue/" target="_blank" style="color:var(--accent);">Forbes Health — 78% of Gen Z Report Dating App Burnout</a></p>
          </div>
          <div class="tip-card">
            <h4>Gen Z Is Leaving Dating Apps</h4>
            <p>Tinder lost 594K users, Bumble lost 368K, and Hinge lost 131K between May 2023–2024. Newsweek and Deseret News covered the exodus.</p>
            <p><a href="https://www.newsweek.com/gen-z-dating-app-usage-decline-evolution-hinge-tinder-feeld-bumble-2092939" target="_blank" style="color:var(--accent);">Newsweek — Is Gen Z Killing the Dating App? (July 2025)</a></p>
            <p><a href="https://www.deseret.com/lifestyle/2025/07/01/gen-z-still-swiping/" target="_blank" style="color:var(--accent);">Deseret News — Dating App Fatigue: A Gen Z Diagnosis</a></p>
          </div>
          <div class="tip-card">
            <h4>The IRL Revival Is Real</h4>
            <p>The Future Laboratory's 2026 report confirms AI distrust is pushing Gen Z toward traditional meet-cute scenarios and in-person matchmaking.</p>
            <p><a href="https://www.thefuturelaboratory.com/blog/the-future-of-dating-2026" target="_blank" style="color:var(--accent);">The Future Laboratory — The Future of Dating 2026</a></p>
          </div>

          <h3>Google Calendar Date Invites</h3>
          <div class="tip-card">
            <h4>GCal for Hookups — It's a Real Trend</h4>
            <p>NBC Palm Springs (Aug 2025) covered college students using Google Calendar for scheduling dates and hookups — treating dating with the same time-management tools as school.</p>
            <p><a href="https://www.nbcpalmsprings.com/therogginreport/2025/08/07/google-calendar-for-hookups-gen-z-turns-to-scheduling-for-love-life-and-everything-in-between" target="_blank" style="color:var(--accent);">NBC Palm Springs — Google Calendar for Hookups (Aug 2025)</a></p>
          </div>
          <div class="tip-card">
            <h4>The "Hook Up?" Calendar Invite Story</h4>
            <p>On-air with Ryan Seacrest: one woman received a GCal invite for 11:30 PM Friday that said "Hook Up?" — she accepted, and they dated the rest of the semester.</p>
            <p><a href="https://kisscincinnati.iheart.com/featured/ryan-seacrest/content/2025-08-19-51-on-air-with-ryan-seacrest-college-students-are-using-google-calendar-for/" target="_blank" style="color:var(--accent);">iHeart/Kiss 107.1 — College Students Using Google Calendar for Dating</a></p>
          </div>

          <h3>Instagram & Story Reactions as Dating Tool</h3>
          <div class="tip-card">
            <h4>Instagram Is the #1 Non-Dating Dating App</h4>
            <p>TIME and NBC News both reported on Gen Z using Instagram (story reactions → DMs) as their primary dating pipeline, preferring "organic" connections over dating apps.</p>
            <p><a href="https://time.com/6256719/gen-z-instagram-dating-app/" target="_blank" style="color:var(--accent);">TIME — Gen Z is Using Instagram to Date (Feb 2023)</a></p>
            <p><a href="https://www.nbcnews.com/news/gen-z-organic-dating-instagram-rcna70459" target="_blank" style="color:var(--accent);">NBC News — Gen Z Wants to Date More 'Organically' via Instagram</a></p>
          </div>

          <h3>Emotional Intimacy & Communication</h3>
          <div class="tip-card">
            <h4>84% Seek New Ways to Build Emotional Intimacy</h4>
            <p>Hinge's 2025 Gen Z D.A.T.E. Report: 84% of Gen Z daters want new ways to build emotional intimacy. 48% of Gen Z men avoid it early on, fearing they'll seem "too much."</p>
            <p><a href="https://hinge.co/newsroom/2025-GenZ-Report" target="_blank" style="color:var(--accent);">Hinge — 2025 Gen Z D.A.T.E. Report</a></p>
            <p><a href="https://mashable.com/article/gen-z-daters-using-ai-communication-gap-hinge-report" target="_blank" style="color:var(--accent);">Mashable — Gen Z Daters Want Deeper Connections (Nov 2025)</a></p>
          </div>

          <h3>Psychology</h3>
          <div class="tip-card">
            <h4>The Mere Exposure Effect (Proximity Method)</h4>
            <p>The "proximity method" in our IRL Approach tab is grounded in Robert Zajonc's mere exposure effect (1968) — repeated exposure to a stimulus increases liking. Festinger, Schacter & Back (1950) demonstrated that physical proximity drives friendship formation.</p>
            <p><a href="https://www.simplypsychology.org/mere-exposure-effect.html" target="_blank" style="color:var(--accent);">Simply Psychology — Mere Exposure Effect</a></p>
            <p><a href="https://www.sas.rochester.edu/psy/people/faculty/reis_harry/assets/pdf/ReisManiaciCaprarielloEastwickFinkel_2011.pdf" target="_blank" style="color:var(--accent);">Reis et al. (2011) — Familiarity Promotes Attraction in Live Interaction (PDF)</a></p>
          </div>

          <h3>Additional Coverage</h3>
          <div class="tip-card">
            <h4>More Reading</h4>
            <p>
              <a href="https://www.newschoolfreepress.com/2025/12/12/why-is-gen-z-leaving-dating-apps/" target="_blank" style="color:var(--accent);">The New School Free Press — Why Is Gen Z Leaving Dating Apps? (Dec 2025)</a><br>
              <a href="https://rewirenewsgroup.com/2025/11/24/gen-z-tinder-bumble-hinge-dating-love/" target="_blank" style="color:var(--accent);">Rewire News — Gen Z Wants to Ditch Tinder. Can They Find Love IRL? (Nov 2025)</a><br>
              <a href="https://www.wokewaves.com/posts/gen-z-dating-etiquette-2026" target="_blank" style="color:var(--accent);">WokeWaves — Digital Dating Etiquette in 2026</a><br>
              <a href="https://www.globaldatinginsights.com/featured/hinge-report-reveals-gen-zs-question-deficit/" target="_blank" style="color:var(--accent);">Global Dating Insights — Hinge Report: Gen Z's Question Deficit (Nov 2025)</a><br>
              <a href="https://www.attacktheculture.com/previews-reviews-more/how-gen-z-is-dating-in-2025" target="_blank" style="color:var(--accent);">Attack the Culture — How Gen Z Is Dating in 2025</a>
            </p>
          </div>
        </div>
      </cc-stagger>
    </cc-tab>

  </cc-tabs>
</div>`;
  }

  _setupQuizzes() {
    // Quiz 1: Flirting Style
    this._buildQuiz('quiz-flirt', [
      { q: "You see someone cute at a party. Your move?", opts: [
        { t: "Walk right up and introduce yourself", s: "direct" },
        { t: "Make a joke about the music/food/vibe to the group they're in", s: "humor" },
        { t: "Position yourself nearby and wait for eye contact first", s: "slow" },
        { t: "Find their Instagram later and react to a story", s: "digital" }
      ]},
      { q: "How do you usually start conversations with someone you're into?", opts: [
        { t: "\"Hey, I wanted to come say hi — I'm [name]\"", s: "direct" },
        { t: "Send them a meme that's weirdly specific to something they said", s: "humor" },
        { t: "Find excuses to be around them until it happens naturally", s: "slow" },
        { t: "Reply to their story with something thoughtful", s: "digital" }
      ]},
      { q: "Your ideal first date energy?", opts: [
        { t: "One-on-one, face to face, real conversation", s: "direct" },
        { t: "Something fun and active — mini golf, arcade, comedy show", s: "humor" },
        { t: "A long walk where conversation flows without pressure", s: "slow" },
        { t: "Start with FaceTime, then meet if the vibe is right", s: "digital" }
      ]},
      { q: "Someone you're interested in hasn't texted back in 2 days. You:", opts: [
        { t: "Text them again — if you want something, go after it", s: "direct" },
        { t: "Send something funny and unrelated to break the tension", s: "humor" },
        { t: "Wait it out — if they're interested, they'll come back", s: "slow" },
        { t: "Check their social media activity to gauge the situation", s: "digital" }
      ]},
      { q: "What compliment are you most likely to give?", opts: [
        { t: "\"I think you're really attractive and I wanted you to know\"", s: "direct" },
        { t: "\"Your energy is genuinely unmatched, I can't stop laughing\"", s: "humor" },
        { t: "\"I really like talking to you — this feels easy\"", s: "slow" },
        { t: "\"Your story from yesterday was literally the best thing I saw all day\"", s: "digital" }
      ]}
    ], {
      direct: { title: "The Direct Approach", desc: "You don't play games and people respect that. You say what you mean, shoot your shot without overthinking, and you'd rather get a clear answer than wonder. Your superpower is confidence. Just make sure you're reading the room — directness without awareness can come on strong." },
      humor: { title: "The Comedy Route", desc: "You flirt by making people laugh, and honestly? It works. Humor builds comfort fast and makes you memorable. Your superpower is making people feel at ease. Watch out for deflecting serious moments with jokes though — sometimes vulnerability hits harder than a punchline." },
      slow: { title: "The Slow Burn", desc: "You let things develop naturally and you're patient enough to let attraction build over time. Your superpower is creating genuine comfort and deep connections. The risk? Sometimes you wait so long that the moment passes. Learning to make a move before you're 100% sure is your growth edge." },
      digital: { title: "The Digital-First Player", desc: "You're most comfortable building connections through screens first — and there's nothing wrong with that. You're strategic, thoughtful, and great at building rapport through text. Your superpower is crafting the perfect message. Challenge yourself to take things offline sooner rather than later — the real magic happens in person." }
    });

    // Quiz 2: Green Flags Self-Check
    this._buildQuiz('quiz-flags', [
      { q: "When someone you're seeing says they need space, you:", opts: [
        { t: "Respect it immediately and check in after a day or two", s: "green" },
        { t: "Say \"okay\" but still text them throughout the day", s: "amber" },
        { t: "Ask why and try to fix whatever's wrong right now", s: "red" },
        { t: "Get anxious and assume they're losing interest", s: "amber" }
      ]},
      { q: "Your partner/person is having a bad day. You:", opts: [
        { t: "Ask what they need — space, comfort, distraction — and follow their lead", s: "green" },
        { t: "Show up with their favorite snack unannounced", s: "amber" },
        { t: "Give them advice on how to fix the problem", s: "red" },
        { t: "Get upset that their mood is affecting your plans", s: "red" }
      ]},
      { q: "You see your person talking to someone attractive at a party. Your reaction:", opts: [
        { t: "Literally don't think about it — they're allowed to have conversations", s: "green" },
        { t: "Feel a twinge but don't act on it — that's a you problem", s: "green" },
        { t: "Go over and insert yourself into the conversation", s: "amber" },
        { t: "Bring it up later — \"who was that person you were talking to?\"", s: "red" }
      ]},
      { q: "They cancel plans last minute. You:", opts: [
        { t: "\"No worries! Let me know when you're free to reschedule\"", s: "green" },
        { t: "\"That's fine\" (it's not fine, but you won't say that)", s: "amber" },
        { t: "\"You always do this\" — even if it's the first time", s: "red" },
        { t: "Check if the reason is legitimate before deciding how to feel", s: "red" }
      ]},
      { q: "Honest check: do you keep score in relationships?", opts: [
        { t: "No — I do things because I want to, not for reciprocity points", s: "green" },
        { t: "Sometimes — I notice when things feel unbalanced", s: "amber" },
        { t: "Yes — if I do something nice, I expect something in return", s: "red" },
        { t: "I don't keep score but I do communicate when I feel undervalued", s: "green" }
      ]}
    ], {
      green: { title: "You're Giving Green Flags", desc: "Nice. You communicate well, respect boundaries, and bring emotional maturity to your connections. Keep doing what you're doing — this energy attracts the right people. Remember that being a green flag doesn't mean being a pushover though — boundaries are green flags too." },
      amber: { title: "Mostly Green with Some Work to Do", desc: "You're not toxic but you've got some patterns worth examining. Maybe it's anxiety showing up as clinginess, or insecurity disguised as \"caring.\" The fact that you're self-aware enough to take this quiz means you're already on the right track. Focus on the difference between your feelings (valid) and your actions (controllable)." },
      red: { title: "Time for Some Real Talk", desc: "Hey, no judgment — self-awareness is step one, and you just took it. Some of your patterns might be pushing people away without you realizing it. Jealousy, score-keeping, and not respecting boundaries usually come from a place of fear, not malice. Consider talking to someone (therapist, trusted friend) about where these patterns come from. Growth is hot." }
    });

    // Quiz 3: Situationship or Relationship?
    this._buildQuiz('quiz-situ', [
      { q: "Have you met each other's friends?", opts: [
        { t: "Yes, we hang out with each other's friend groups regularly", s: "rel" },
        { t: "I've met a couple of their friends but not really integrated", s: "maybe" },
        { t: "We only ever hang out alone", s: "situ" }
      ]},
      { q: "If someone asked them \"are you seeing anyone?\", they would say:", opts: [
        { t: "\"Yeah, I'm with [your name]\" — no hesitation", s: "rel" },
        { t: "\"It's complicated\" or \"sort of\"", s: "maybe" },
        { t: "Honestly? I have no idea what they'd say", s: "situ" }
      ]},
      { q: "Do you make plans more than 2 weeks in advance?", opts: [
        { t: "Yes — we plan trips, events, and future stuff together", s: "rel" },
        { t: "Sometimes, but it's mostly week-to-week", s: "maybe" },
        { t: "Planning ahead? We barely confirm plans for tomorrow", s: "situ" }
      ]},
      { q: "When's the last time you had a serious conversation about feelings?", opts: [
        { t: "Recently — we check in about how we're feeling regularly", s: "rel" },
        { t: "It's happened once or twice but we usually keep it light", s: "maybe" },
        { t: "We don't really talk about feelings. It's more vibes-based.", s: "situ" }
      ]},
      { q: "What happens when one of you is going through a tough time?", opts: [
        { t: "We support each other — they're one of my first calls", s: "rel" },
        { t: "We're there for each other but I wouldn't say they're my go-to person", s: "maybe" },
        { t: "We mostly just hang when things are good — bad days are solo", s: "situ" }
      ]}
    ], {
      rel: { title: "That's a Relationship", desc: "Even if you haven't \"officially\" defined it, what you're describing has all the hallmarks of a real relationship: integration into each other's lives, emotional vulnerability, future planning, and mutual support. If the label matters to you (and it's okay if it does), have the conversation — it sounds like it'll go well." },
      maybe: { title: "You're in the Gray Zone", desc: "Classic in-between territory. You've got some relationship elements but some significant gaps. This isn't automatically bad — some people move slower than others. The question is: is it trending toward more, or has it plateaued? If it's been like this for more than 2-3 months with no progression, it might be time for a direct conversation about what you both actually want." },
      situ: { title: "That's a Situationship", desc: "Real talk: what you're describing is a situationship. The hallmarks are there — you keep it surface-level, you haven't integrated into each other's lives, and there's an avoidance of serious conversations. This isn't a moral judgment — some people are fine with this arrangement. But if you want more, you need to either have the conversation or accept that this is what it is. Staying and hoping it changes on its own almost never works." }
    });
  }

  _buildQuiz(containerId, questions, results) {
    const container = this.querySelector(`#${containerId}`);
    if (!container) return;
    let current = 0;
    let answers = [];

    const render = () => {
      if (current >= questions.length) {
        // Show results
        const counts = {};
        answers.forEach(a => { counts[a] = (counts[a] || 0) + 1; });
        const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        const result = results[winner];
        container.innerHTML = `
          <div class="quiz-result">
            <h3>${this._esc(result.title)}</h3>
            <p>${this._esc(result.desc)}</p>
            <button class="quiz-btn" data-action="restart">Take Again</button>
          </div>`;
        container.querySelector('[data-action="restart"]').addEventListener('click', () => {
          current = 0; answers = []; render();
        });
        return;
      }
      const q = questions[current];
      container.innerHTML = `
        <div class="quiz-progress">${questions.map((_, i) =>
          `<div class="quiz-dot ${i < current ? 'done' : i === current ? 'active' : ''}"></div>`
        ).join('')}</div>
        <div class="quiz-q">${this._esc(q.q)}</div>
        <div class="quiz-opts">${q.opts.map((o, i) =>
          `<button class="quiz-opt" data-idx="${i}" data-score="${this._esc(o.s)}">${this._esc(o.t)}</button>`
        ).join('')}</div>`;
      container.querySelectorAll('.quiz-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          answers.push(btn.dataset.score);
          current++;
          render();
        });
      });
    };
    render();
  }
}
customElements.define('cc-rizz-guide', CcRizzGuide);
