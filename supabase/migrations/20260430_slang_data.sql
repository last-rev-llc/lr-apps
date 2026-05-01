-- Seed data for the Slang Translator catalog (Gen Alpha entries).
-- Ships to every environment via `supabase db push`. Idempotent — re-running
-- claims any pre-existing rows (e.g. from local seed.sql runs) and stamps
-- them with seed_source = 'gen_alpha_v1'.
--
-- Pattern (see docs/guides/migrations.md "Data migrations"):
--   * `seed_source text` column tags rows owned by a specific seed batch.
--   * The natural primary key (id) gives us ON CONFLICT for free — no extra
--     unique constraint needed.
--   * Rolling back deletes only this batch's rows.

alter table public.slang
  add column if not exists seed_source text;

create index if not exists idx_slang_seed_source
  on public.slang (seed_source) where seed_source is not null;

insert into public.slang
  (id, term, definition, example, category, vibe_score, origin, era, aliases, equivalents, seed_source)
values
  ('rizz', 'Rizz', 'Charisma; the skill of charming or attracting a romantic partner.', 'He''s got mad rizz, she said yes in two minutes.', 'Status', 10, 'Streamer Kai Cenat / shortened from "charisma"', '2020s', array['rizzler','rizzed up'], '{"genX": "Smooth / Charm / Game"}'::jsonb, 'gen_alpha_v1'),
  ('gyatt', 'Gyatt', 'Exclamation reacting to an attractive figure; usually an enthusiastic "wow".', 'Gyatt! Did you see her new fit?', 'Reaction', 8, 'Twitch / streaming culture', '2020s', array['gyat','gyaaat'], '{"genX": "Damn! / Whoa!"}'::jsonb, 'gen_alpha_v1'),
  ('sigma', 'Sigma', 'Lone-wolf high-status male archetype; ironic praise for stoic confidence.', 'He left the party at 9pm without saying bye — sigma move.', 'Identity', 8, 'Online masculinity discourse / ironic memes', '2020s', array['sigma male','sigma grindset'], '{"genX": "Lone wolf / Cool customer"}'::jsonb, 'gen_alpha_v1'),
  ('skibidi', 'Skibidi', 'Nonsense intensifier from the Skibidi Toilet meme; can mean cool, weird, or chaotic.', 'That movie was straight skibidi, I loved it.', 'Reaction', 7, 'Skibidi Toilet YouTube series', '2020s', array['skibidi toilet'], '{"genX": "Wild / Bonkers"}'::jsonb, 'gen_alpha_v1'),
  ('fanum-tax', 'Fanum Tax', 'Taking a portion of someone''s food without asking, jokingly framed as a tax.', 'Bro just hit me with the fanum tax on my fries.', 'Action', 7, 'Streamer Fanum (AMP)', '2020s', array['fanum'], '{"genX": "Mooching / Five-finger discount on fries"}'::jsonb, 'gen_alpha_v1'),
  ('bussin', 'Bussin''', 'Extremely good, especially food.', 'These tacos are bussin'' bussin''.', 'Approval', 9, 'Black/AAVE internet slang', '2020s', array['bussin bussin'], '{"genX": "The bomb / Killer"}'::jsonb, 'gen_alpha_v1'),
  ('no-cap', 'No Cap', 'No lie; for real.', 'No cap, that was the best movie this year.', 'Affirmation', 9, 'AAVE / hip-hop', '2020s', array['nocap','fr no cap'], '{"genX": "For real / I kid you not"}'::jsonb, 'gen_alpha_v1'),
  ('cap', 'Cap', 'A lie; calling someone out for lying.', 'You ran a 5-minute mile? Cap.', 'Disapproval', 8, 'AAVE / hip-hop', '2020s', array['capping','cappin'], '{"genX": "BS / Yeah right"}'::jsonb, 'gen_alpha_v1'),
  ('slay', 'Slay', 'To do something extremely well; impressive performance.', 'You slayed that presentation.', 'Approval', 9, 'Drag / ballroom culture (revived)', '2020s', array['slayed','slaying'], '{"genX": "Killed it / Crushed it"}'::jsonb, 'gen_alpha_v1'),
  ('mid', 'Mid', 'Mediocre; underwhelming.', 'That sequel was mid, don''t bother.', 'Disapproval', 7, 'Wrestling / NBA Twitter', '2020s', array['so mid','straight mid'], '{"genX": "Meh / Whatever"}'::jsonb, 'gen_alpha_v1'),
  ('lit', 'Lit', 'Exciting, intense, or great.', 'The party was lit last night.', 'Approval', 8, 'AAVE / club scene', '2010s', array['litty','lituation'], '{"genX": "Off the hook / Rad"}'::jsonb, 'gen_alpha_v1'),
  ('sus', 'Sus', 'Suspicious or shady.', 'He''s acting kinda sus, I don''t trust him.', 'Disapproval', 8, 'Among Us video game', '2020s', array['suspect','suss'], '{"genX": "Shady / Fishy"}'::jsonb, 'gen_alpha_v1'),
  ('periodt', 'Periodt', 'End of discussion; emphatic full stop.', 'I''m not going, periodt.', 'Affirmation', 7, 'Black queer / drag culture', '2020s', array['period','perioduh'], '{"genX": "End of story"}'::jsonb, 'gen_alpha_v1'),
  ('drip', 'Drip', 'Stylish outfit or look.', 'Look at his drip — that fit is fire.', 'Approval', 9, 'Hip-hop fashion', '2010s', array['dripping','drippy'], '{"genX": "Threads / Flossin''"}'::jsonb, 'gen_alpha_v1'),
  ('vibe', 'Vibe', 'A mood, atmosphere, or feeling.', 'The whole café had a chill vibe.', 'Status', 8, 'Counterculture (revived)', '2010s', array['vibing','vibes'], '{"genX": "Mood / Scene"}'::jsonb, 'gen_alpha_v1'),
  ('slaps', 'Slaps', 'Sounds extremely good (usually music).', 'This new track absolutely slaps.', 'Approval', 9, 'Music Twitter / AAVE', '2010s', array['slapping','slap'], '{"genX": "Bangs / Jams"}'::jsonb, 'gen_alpha_v1'),
  ('bet', 'Bet', 'Affirmative; "okay, sure" or "I accept".', 'Wanna get pizza? — Bet.', 'Affirmation', 8, 'AAVE', '2010s', array[]::text[], '{"genX": "Cool / You got it"}'::jsonb, 'gen_alpha_v1'),
  ('finna', 'Finna', 'About to / fixing to.', 'I''m finna head out, see y''all later.', 'Action', 6, 'Southern Black English', '2010s', array['fin to','fitna'], '{"genX": "Bout to / Fixing to"}'::jsonb, 'gen_alpha_v1'),
  ('lowkey', 'Lowkey', 'Quietly, somewhat; a soft admission.', 'I lowkey love that song even though it''s embarrassing.', 'Modifier', 7, 'AAVE / internet', '2010s', array['low key','low-key'], '{"genX": "Kind of / Sort of"}'::jsonb, 'gen_alpha_v1'),
  ('highkey', 'Highkey', 'Openly, very much; the opposite of lowkey.', 'I''m highkey obsessed with this show.', 'Modifier', 7, 'AAVE / internet', '2010s', array['high key','high-key'], '{"genX": "Totally / Big time"}'::jsonb, 'gen_alpha_v1'),
  ('w', 'W', 'A win; something good.', 'Free pizza in the break room? Big W.', 'Approval', 8, 'Twitch chat', '2020s', array['big w','dub'], '{"genX": "Score / Win"}'::jsonb, 'gen_alpha_v1'),
  ('l', 'L', 'A loss; a bad outcome.', 'They cancelled the trip, huge L.', 'Disapproval', 7, 'Twitch chat', '2020s', array['big l','take an l'], '{"genX": "Bummer / Tough break"}'::jsonb, 'gen_alpha_v1'),
  ('mood', 'Mood', 'Strong relatable feeling.', 'Eating cold pizza for breakfast — big mood.', 'Reaction', 7, 'Tumblr / Twitter', '2010s', array['big mood','whole mood'], '{"genX": "Same / Story of my life"}'::jsonb, 'gen_alpha_v1'),
  ('salty', 'Salty', 'Bitter, upset, or holding a grudge.', 'He''s still salty about losing the bet.', 'Disapproval', 7, 'Gaming / online', '2010s', array['salt'], '{"genX": "Bitter / Sour grapes"}'::jsonb, 'gen_alpha_v1'),
  ('ratio', 'Ratio''d', 'Getting more replies than likes — a sign your post bombed.', 'His tweet got ratio''d hard, totally cooked.', 'Disapproval', 7, 'Twitter', '2020s', array['ratioed'], '{"genX": "Roasted / Owned"}'::jsonb, 'gen_alpha_v1'),
  ('tea', 'Tea', 'Gossip; juicy info.', 'Spill the tea — what happened at the party?', 'Status', 8, 'Black drag culture', '2010s', array['the tea','t'], '{"genX": "Dirt / Gossip / Scoop"}'::jsonb, 'gen_alpha_v1'),
  ('sheesh', 'Sheesh', 'Exclamation of being impressed.', 'You got 99 on the test? Sheeeesh.', 'Reaction', 8, 'TikTok', '2020s', array['sheeesh'], '{"genX": "Whoa / Damn"}'::jsonb, 'gen_alpha_v1'),
  ('savage', 'Savage', 'Brutally bold, harsh, or impressive.', 'That comeback was savage.', 'Approval', 7, 'Hip-hop / internet', '2010s', array[]::text[], '{"genX": "Cold-blooded / Brutal"}'::jsonb, 'gen_alpha_v1'),
  ('cringe', 'Cringe', 'Embarrassing or awkward.', 'That dance trend is so cringe.', 'Disapproval', 8, 'Reddit / 4chan', '2010s', array['cringey','cringeworthy'], '{"genX": "Lame / Cheesy"}'::jsonb, 'gen_alpha_v1'),
  ('ghosted', 'Ghosted', 'Cut off contact suddenly without explanation.', 'We had three dates and then he ghosted me.', 'Action', 7, 'Online dating', '2010s', array['ghost','ghosting'], '{"genX": "Blew off / Gave the cold shoulder"}'::jsonb, 'gen_alpha_v1'),
  ('flex', 'Flex', 'To show off, especially possessions or status.', 'Stop flexing your new car on the group chat.', 'Action', 8, 'Hip-hop', '2010s', array['flexing','flexin'], '{"genX": "Show off / Brag"}'::jsonb, 'gen_alpha_v1'),
  ('glow-up', 'Glow Up', 'A dramatic positive transformation in appearance or status.', 'Her senior-year glow up was unreal.', 'Status', 8, 'Twitter', '2010s', array['glo up'], '{"genX": "Comeback / Makeover"}'::jsonb, 'gen_alpha_v1'),
  ('hits-different', 'Hits Different', 'Feels uniquely good or impactful.', 'Coffee on a rainy morning hits different.', 'Approval', 8, 'TikTok', '2020s', array['hits diff','hits dif'], '{"genX": "Hits the spot / On another level"}'::jsonb, 'gen_alpha_v1'),
  ('fire', 'Fire', 'Extremely good, hot, or impressive.', 'That new album is straight fire.', 'Approval', 9, 'Hip-hop', '2010s', array['🔥'], '{"genX": "Hot / Killer"}'::jsonb, 'gen_alpha_v1'),
  ('stan', 'Stan', 'An obsessive fan; to fervently support.', 'I stan that band, saw them three times.', 'Action', 7, 'Eminem song "Stan" (2000)', '2010s', array['stanning'], '{"genX": "Diehard fan / Groupie"}'::jsonb, 'gen_alpha_v1'),
  ('shade', 'Shade', 'A subtle insult or contempt.', 'She threw shade at his outfit all night.', 'Action', 8, 'Black queer / drag culture', '2010s', array['throw shade'], '{"genX": "Dis / Snub"}'::jsonb, 'gen_alpha_v1'),
  ('vibe-check', 'Vibe Check', 'An informal assessment of someone''s mood or energy.', 'Quick vibe check — how''s everyone feeling?', 'Action', 7, 'Twitter / TikTok', '2020s', array['vibecheck'], '{"genX": "Temperature read / Pulse check"}'::jsonb, 'gen_alpha_v1'),
  ('big-yikes', 'Big Yikes', 'A reaction to something extremely awkward or embarrassing.', 'He texted his ex at 2am — big yikes.', 'Reaction', 7, 'Twitter', '2010s', array['yikes'], '{"genX": "Oof / Not good"}'::jsonb, 'gen_alpha_v1'),
  ('basic', 'Basic', 'Mainstream and unoriginal in taste.', 'PSL in October is so basic, but I love it.', 'Disapproval', 7, 'Twitter', '2010s', array[]::text[], '{"genX": "Mainstream / Vanilla"}'::jsonb, 'gen_alpha_v1'),
  ('boujee', 'Boujee', 'Luxurious in a flashy way; from "bourgeois".', 'Brunch at the rooftop place is too boujee for me.', 'Status', 7, 'Migos "Bad and Boujee" (2016)', '2010s', array['bougie'], '{"genX": "Yuppie / Fancy"}'::jsonb, 'gen_alpha_v1'),
  ('cancelled', 'Cancelled', 'Publicly rejected for problematic behavior.', 'That actor got cancelled after the leaked emails.', 'Status', 7, 'Black Twitter', '2010s', array['canceled','cancel'], '{"genX": "Persona non grata / Blackballed"}'::jsonb, 'gen_alpha_v1'),
  ('goat', 'GOAT', 'Greatest Of All Time.', 'LeBron is the GOAT, no debate.', 'Approval', 9, 'Hip-hop / sports', '2010s', array['the goat','🐐'], '{"genX": "The best / The man"}'::jsonb, 'gen_alpha_v1'),
  ('hella', 'Hella', 'Very; a lot of.', 'It''s hella cold outside today.', 'Modifier', 7, 'Bay Area slang', '90s', array[]::text[], '{"genX": "Wicked / Mad"}'::jsonb, 'gen_alpha_v1'),
  ('bestie', 'Bestie', 'Close friend; also used as an affectionate address to anyone.', 'Bestie, you have to try this place.', 'Identity', 7, 'TikTok', '2020s', array['bestie!'], '{"genX": "BFF / Bud"}'::jsonb, 'gen_alpha_v1'),
  ('deadass', 'Deadass', 'Seriously; no joke.', 'I''m deadass not coming if it''s raining.', 'Affirmation', 7, 'NYC slang', '2010s', array['dead ass'], '{"genX": "Dead serious / I swear"}'::jsonb, 'gen_alpha_v1'),
  ('on-god', 'On God', 'I swear; for real.', 'On god, I didn''t eat your leftovers.', 'Affirmation', 7, 'AAVE / hip-hop', '2010s', array['ong'], '{"genX": "Swear to god / On my life"}'::jsonb, 'gen_alpha_v1'),
  ('fr-fr', 'Fr Fr', 'For real for real; emphatic agreement.', 'That movie was bad, fr fr.', 'Affirmation', 7, 'TikTok / AAVE', '2020s', array['fr','for real for real'], '{"genX": "Honestly / No joke"}'::jsonb, 'gen_alpha_v1'),
  ('ok-boomer', 'OK Boomer', 'Dismissive reply to out-of-touch older opinions.', 'You think TikTok rots brains? OK boomer.', 'Reaction', 6, 'TikTok / Twitter', '2010s', array['k boomer'], '{"genX": "Whatever, dad / Ok grandma"}'::jsonb, 'gen_alpha_v1'),
  ('snatched', 'Snatched', 'Looking incredibly good; perfectly styled.', 'Her waist is snatched in that dress.', 'Approval', 7, 'Drag / ballroom culture', '2010s', array[]::text[], '{"genX": "On point / Looking sharp"}'::jsonb, 'gen_alpha_v1'),
  ('main-character', 'Main Character', 'Acting as the protagonist of life; centering yourself.', 'Walking through the city in big sunglasses — main character energy.', 'Identity', 8, 'TikTok', '2020s', array['main character energy'], '{"genX": "Center of attention / Ham"}'::jsonb, 'gen_alpha_v1'),
  ('brainrot', 'Brainrot', 'Mind-numbing online content; also the state of consuming it for too long.', 'I scrolled TikTok for 3 hours, total brainrot.', 'Status', 8, 'Reddit / TikTok', '2020s', array['brain rot','rotting'], '{"genX": "Couch Potato / Vegging Out"}'::jsonb, 'gen_alpha_v1'),
  ('ohio', 'Ohio', 'Surreal, weird, or dystopian; an absurd vibe.', 'Why is there a goat in the kitchen — this party is straight Ohio.', 'Reaction', 7, 'Only-in-Ohio memes', '2020s', array['only in ohio'], '{"genX": "Twilight Zone"}'::jsonb, 'gen_alpha_v1'),
  ('mewing', 'Mewing', 'Tongue-on-roof posture for a sharper jawline; also a meme silencing gesture.', 'He''s been mewing in every photo to look chiseled.', 'Action', 6, 'Orthodontic forums / TikTok', '2020s', array['mew'], '{"genX": "Keeping It Real"}'::jsonb, 'gen_alpha_v1'),
  ('aura', 'Aura', 'Cool factor; an ineffable quality of presence — often counted in points.', 'She walked in late and stole the show — pure aura, +1000 points.', 'Status', 8, 'TikTok', '2020s', array['aura points','+1000 aura'], '{"genX": "Vibe"}'::jsonb, 'gen_alpha_v1'),
  ('delulu', 'Delulu', 'Delusional, especially romantically or hopefully — usually self-aware.', 'I think he likes me too — okay, I''m being delulu.', 'Identity', 7, 'K-pop fandom / TikTok', '2020s', array['delulu girlie','delusional'], '{"genX": "Trippin''"}'::jsonb, 'gen_alpha_v1'),
  ('npc', 'NPC', 'Acting without personality or agency; from "non-player character".', 'Bro replied with the same emoji to everything, total NPC behavior.', 'Disapproval', 7, 'Gaming / 4chan', '2020s', array['npc behavior'], '{"genX": "Scrub / Poser"}'::jsonb, 'gen_alpha_v1'),
  ('ate', 'Ate', 'Did something so well it was untouchable.', 'She ate that performance and left no crumbs.', 'Approval', 9, 'Black queer / drag culture', '2020s', array['ate that','left no crumbs'], '{"genX": "Killed It / Nailed It"}'::jsonb, 'gen_alpha_v1'),
  ('ick', 'Ick', 'A sudden turn-off about someone you were into.', 'He chewed with his mouth open — instant ick.', 'Disapproval', 7, 'Love Island UK', '2020s', array['icky','the ick'], '{"genX": "Gag Me with a Spoon"}'::jsonb, 'gen_alpha_v1'),
  ('yeet', 'Yeet', 'To throw forcefully; an exclamation of energetic motion.', 'I yeeted my old phone into the drawer and never looked back.', 'Action', 8, 'Vine (2014)', '2010s', array['yeeted','yeeting'], '{"genX": "Chuck / Hurl"}'::jsonb, 'gen_alpha_v1'),
  ('simp', 'Simp', 'Someone overly attentive or submissive to a love interest.', 'He left the boys'' trip to drive her home — full simp.', 'Disapproval', 6, 'Hip-hop (revived) / Twitch', '2010s', array['simping','simp nation'], '{"genX": "Whipped"}'::jsonb, 'gen_alpha_v1'),
  ('based', 'Based', 'Confidently and unapologetically authentic; agreeing with a bold take.', 'He posted his honest opinion knowing he''d get hate — based.', 'Approval', 7, 'Lil B / 4chan', '2010s', array['based take'], '{"genX": "Radical / Keeping It Real"}'::jsonb, 'gen_alpha_v1'),
  ('sending-me', 'Sending Me', 'Making me laugh extremely hard.', 'Her impression of the boss is sending me, I can''t breathe.', 'Reaction', 7, 'Black Twitter', '2010s', array['im sending','im dead'], '{"genX": "Cracking Up"}'::jsonb, 'gen_alpha_v1'),
  ('understood-the-assignment', 'Understood the Assignment', 'Delivered exactly what the moment called for, perfectly.', 'Her costume tonight understood the assignment.', 'Approval', 8, 'Twitter', '2020s', array['understood the assignment'], '{"genX": "Nailed It"}'::jsonb, 'gen_alpha_v1'),
  ('touch-grass', 'Touch Grass', 'Dismissive command to step away from the internet and reconnect with reality.', 'Bro is arguing about anime in the comments — touch grass.', 'Reaction', 7, 'Twitter / Reddit', '2020s', array['go touch grass'], '{"genX": "Take a Chill Pill"}'::jsonb, 'gen_alpha_v1'),
  ('rent-free', 'Rent Free', 'Living in someone''s head; obsessing over them or a thing.', 'That movie ending has been living rent free in my mind for a week.', 'Status', 7, 'Twitter', '2010s', array['living rent free'], '{"genX": "Living In Your Head"}'::jsonb, 'gen_alpha_v1'),
  ('caught-in-4k', 'Caught in 4K', 'Caught on undeniable, high-resolution video evidence.', 'He got caught in 4K cheating on the test, RIP.', 'Reaction', 8, 'TikTok / Twitter', '2020s', array['4k','caught lacking'], '{"genX": "Busted"}'::jsonb, 'gen_alpha_v1'),
  ('ghosting', 'Ghosting', 'The act of cutting off contact suddenly without warning.', 'We were texting daily then she started ghosting me.', 'Action', 7, 'Online dating', '2010s', array['ghost','ghosted'], '{"genX": "Bounce / Dip"}'::jsonb, 'gen_alpha_v1')
on conflict (id) do update set
  term = excluded.term,
  definition = excluded.definition,
  example = excluded.example,
  category = excluded.category,
  vibe_score = excluded.vibe_score,
  origin = excluded.origin,
  era = excluded.era,
  aliases = excluded.aliases,
  equivalents = excluded.equivalents,
  seed_source = excluded.seed_source;
