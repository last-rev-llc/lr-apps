// ─── Prompts Tab (ported from Command Center Higgsfield page) ─────────────────
class CcPromptsTab extends HTMLElement {
  connectedCallback() {
    this._injectStyles();
    this._render();
    this._bindEvents();
  }

  get PROMPTS() {
    return [
      // ──────── IMAGE GENERATION ────────
      {cat:'image',title:'Cinematic Portrait — Golden Hour',model:'Higgsfield Soul',tags:['portrait','cinematic','golden hour','photorealistic'],startFrame:true,prompt:'Close-up portrait of a weathered fisherman in his 60s, deep wrinkles mapping decades at sea, salt-and-pepper beard catching golden hour light. Shot on Arri Alexa Mini with Cooke S7/i 75mm at f/1.4. Warm amber backlight creating rim lighting on hair and shoulders. Shallow depth of field, bokeh of harbor lights behind. Skin texture hyper-detailed, visible pores, sun damage. Color graded with warm teal shadows, 4K, ultra-detailed, hyperrealistic.'},
      {cat:'image',title:'Luxury Product — Perfume Bottle',model:'Seedream 4.0',tags:['product','luxury','advertising','glass'],startFrame:true,prompt:'Luxury perfume bottle on black obsidian slab, studio lighting. Bottle is faceted crystal with amber liquid, gold cap. Single dramatic key light from upper-left creating caustic light patterns through glass onto surface. Volumetric light haze in background. Water droplets on bottle surface catching highlights. Reflection on glossy black surface. Shot on Phase One IQ4 150MP, 120mm macro, f/8. 4K, ultra-detailed, commercial photography, product hero shot.'},
      {cat:'image',title:'Brutalist Architecture at Dusk',model:'FLUX.1 Pro',tags:['architecture','brutalist','dusk','moody'],startFrame:true,prompt:'Massive brutalist concrete apartment complex photographed from ground level at blue hour. Raw concrete textures with water stains and moss. Warm amber light spilling from scattered windows against deep blue twilight sky. Dramatic perspective converging lines. Fog rolling through the courtyard at base. Shot on Sony A7R V with Laowa 12mm f/2.8 ultra-wide. Long exposure smoothing clouds. 4K, ultra-detailed, architectural photography, urban decay aesthetic.'},
      {cat:'image',title:'Abstract Fluid Dynamics',model:'Nano Banana Pro',tags:['abstract','fluid','colorful','art'],prompt:'Abstract macro photograph of colliding ink drops in water. Vivid magenta and electric cyan pigments creating fractal tendrils and mushroom cloud formations. Backlit on a lightbox, shot at 1/8000s to freeze motion. Fibonacci spiral patterns emerging in the fluid dynamics. Pure black negative space surrounding the explosion of color. Ultra-sharp focus on leading edge of ink dispersion. 4K, ultra-detailed, fine art photography.'},
      {cat:'image',title:'Dark Fantasy Landscape',model:'GPT Image',tags:['fantasy','landscape','dark','epic'],startFrame:true,prompt:'Epic dark fantasy landscape: a lone armored knight standing at the edge of a massive obsidian cliff overlooking an endless sea of storm clouds lit from below by volcanic fire. Ancient ruined stone bridge extending into the void, partially collapsed. Three moons visible through a break in the thunderheads, each a different phase. Bioluminescent vegetation clinging to cliff edges. God rays piercing cloud layer. Matte painting style, 4K, ultra-detailed, concept art quality.'},
      {cat:'image',title:'Cyberpunk Street Market',model:'Kling O1',tags:['sci-fi','cyberpunk','street','neon'],startFrame:true,prompt:'Cyberpunk night market in a rain-soaked alley, Neo-Tokyo 2087. Dense holographic signage in Japanese and Chinese characters, neon pink and electric blue reflections on wet asphalt. Street vendors selling bioluminescent food from modified shipping containers. Crowds with cybernetic augmentations, LED tattoos glowing through rain. Steam rising from gutter grates. Overhead tangle of cables and laundry lines. Shot on Arri Alexa 65 with anamorphic lens flares. 4K, ultra-detailed, hyperrealistic.'},
      {cat:'image',title:'Macro — Frost on Spider Web',model:'Seedream 4.0',tags:['macro','nature','frost','delicate'],startFrame:true,prompt:'Extreme macro photograph of morning frost crystals forming on a spider web. Each ice crystal is a perfect hexagonal prism refracting dawn light into micro rainbows. Web strands visible as silver threads connecting crystal nodes. Soft pink and gold bokeh from sunrise in background. Focus stacked composite for infinite depth of field on web plane. Water droplets trapped between ice formations. Shot on Canon R5 with MP-E 65mm at 5x magnification. 4K, ultra-detailed, nature macro photography.'},
      {cat:'image',title:'Havana Street Photography',model:'Higgsfield Soul',tags:['street','vintage','warm','documentary'],startFrame:true,prompt:'Street photograph in Old Havana, Cuba. Elderly man in white linen shirt and straw fedora leaning against a crumbling pastel-pink colonial wall, smoking a hand-rolled cigar. Turquoise 1957 Chevrolet Bel Air parked behind him, chrome bumper reflecting afternoon sun. Laundry lines overhead with white sheets billowing. Patina of decades on every surface. Shot on Leica M11 with Summilux 35mm f/1.4, Kodachrome color palette. 4K, ultra-detailed, documentary photography.'},
      {cat:'image',title:'Underwater Cathedral',model:'FLUX.1 Pro',tags:['underwater','surreal','light','ethereal'],prompt:'Surreal underwater scene: a sunken Gothic cathedral with intact stained glass windows, light shafts penetrating the water surface and illuminating the interior in colored beams. Schools of silver fish swimming through the nave. Coral and anemones growing on carved stone pillars. Whale shark passing through a collapsed section of the roof. Caustic light patterns dancing on the stone floor. Particulate matter creating depth atmosphere. 4K, ultra-detailed, hyperrealistic underwater photography.'},
      {cat:'image',title:'Minimal Zen Composition',model:'Nano Banana Pro',tags:['minimal','zen','monochrome','fine art'],prompt:'Minimalist fine art photograph: single smooth black river stone balanced on a thin wooden stick, casting a long shadow on white sand garden with perfectly raked concentric circles. Morning side light creating extreme contrast. Negative space dominating 80% of frame. Grain texture of sand visible. Subtle warm tone in highlights, cool blue in shadows. Shot on Hasselblad X2D with XCD 90mm, f/16. 4K, ultra-detailed, zen aesthetic, wabi-sabi.'},

      // ──────── TEXT-TO-VIDEO ────────
      {cat:'video',title:'Epic Cinematic — Mountain Fortress',model:'Sora 2',tags:['cinematic','epic','fantasy','aerial'],tip:'5-10s duration recommended',prompt:'Sweeping aerial establishing shot of an ancient mountain fortress emerging from dense fog at sunrise. Camera starts high above cloud layer, slowly descending and pushing forward as towers and battlements pierce through the mist. Eagles circling the highest spire. Volumetric god rays breaking through clouds illuminating stone walls. Snow-capped peaks in background. Epic orchestral energy. Cinematic 24fps, anamorphic lens characteristics, subtle lens flare from sun. Hyperrealistic, 4K.'},
      {cat:'video',title:'Product Reveal — Sneaker Drop',model:'Veo 3.1',tags:['product','commercial','dynamic','fashion'],tip:'3-5s punchy reveal',prompt:'Dynamic product reveal: matte black sneaker drops from above onto a mirror-surface puddle in slow motion. Impact creates a perfect radial splash of iridescent liquid that catches studio light in rainbow patterns. Shoe rotates slightly on impact revealing textured sole. Liquid settles to reveal reflection. Camera at ground level, ultra-close. Dramatic rim lighting from behind. 120fps slow motion, shallow depth of field. Commercial grade, 4K.'},
      {cat:'video',title:'Nature Timelapse — Desert Bloom',model:'WAN 2.6',tags:['nature','timelapse','flowers','transformation'],tip:'5-8s for full bloom cycle',prompt:'Timelapse of desert wildflowers blooming after rain in Death Valley. Camera low to ground, wide angle. Cracked dry earth in foreground. Over 5 seconds: green shoots push through cracks, buds form and open into vibrant orange poppies and purple lupines spreading across the desert floor. Clouds race overhead casting moving shadows. Sun arcs across sky. Background mountains shimmer in heat haze. National Geographic quality, 4K, ultra-detailed.'},
      {cat:'video',title:'Action Sequence — Parkour Rooftop',model:'Kling 2.5 Turbo',tags:['action','parkour','urban','dynamic'],tip:'5s burst of movement',prompt:'Tracking shot following a parkour athlete sprinting across rain-wet rooftops at twilight. Athlete vaults over AC units, precision jumps between buildings, rolls on landing. Camera follows at shoulder height in smooth Steadicam motion. City lights blurring in background. Rain droplets suspended in air during slow-motion jump sequence. Neon signs reflecting off wet surfaces. Shot on Arri Alexa with 24mm anamorphic. Cinematic color grade, teal and orange. 4K, hyperrealistic.'},
      {cat:'video',title:'Emotional Moment — Reunion',model:'Sora 2',tags:['emotional','human','cinematic','warm'],tip:'5-8s for emotional build',prompt:'Medium shot: elderly woman sitting alone on a park bench in autumn, golden leaves falling. She looks up — her expression shifts from melancholy to recognition to pure joy. Camera slowly pushes in on her face as tears form. Rack focus to reveal her grown son walking toward her in the background. Warm golden afternoon light. Shallow depth of field, bokeh of autumn foliage. Subtle camera movement, handheld intimacy. 24fps cinematic, Kodak film emulation, 4K.'},
      {cat:'video',title:'Urban Atmosphere — Tokyo Rain',model:'MiniMax Hailuo 02',tags:['urban','rain','neon','atmospheric'],tip:'5-10s ambient loop',prompt:'Slow dolly forward through a narrow Tokyo alley at night during heavy rain. Neon signs reflecting in puddles — pink, blue, amber kanji characters. Steam rising from a ramen shop on the left, red lantern swaying in wind. Silhouette of a person with a transparent umbrella walking away from camera. Rain streaks visible in neon light. Shallow depth of field, anamorphic bokeh. Lo-fi atmospheric mood. Cinematic 24fps, 4K.'},
      {cat:'video',title:'Sci-Fi VFX — Wormhole Transit',model:'Veo 3.1',tags:['sci-fi','vfx','space','epic'],tip:'5s dramatic sequence',prompt:'First-person POV of a spacecraft entering a wormhole. Stars stretch into infinite light trails as the ship accelerates. Wormhole interior is a tunnel of bending spacetime — iridescent gravitational lensing, fractal energy patterns, lightning-like discharge along the walls. Ship console visible in foreground, holographic HUD flickering. Exit burst into a binary star system with a ringed gas giant. Lens flare, chromatic aberration. Cinematic sci-fi, 4K, photorealistic VFX.'},
      {cat:'video',title:'Commercial — Coffee Morning Ritual',model:'Seedance Pro',tags:['commercial','lifestyle','warm','product'],tip:'5-8s lifestyle spot',prompt:'Macro slow-motion pour of espresso into a ceramic cup, rich crema forming. Pull back to reveal hands cupping the mug — steam rising in morning window light. Golden hour sunbeams cutting through kitchen, dust motes floating. Person takes first sip, closes eyes, slight smile. Shallow depth of field throughout. Camera movement: slow crane up from cup to face. Warm color palette, film grain. Commercial lifestyle photography, 4K.'},
      {cat:'video',title:'Underwater Ballet',model:'WAN 2.5',tags:['underwater','dance','ethereal','artistic'],tip:'5-8s fluid motion',prompt:'Underwater wide shot: professional ballet dancer in flowing white silk dress performing an arabesque in crystal-clear cenote water. Fabric billowing in slow motion around her body creating wing-like formations. Sun rays penetrating from surface creating god rays and caustic patterns on limestone walls. Air bubbles trailing from movement. Bioluminescent particles in water. Camera slowly orbiting the dancer. 60fps slow motion, 4K, fine art cinematography.'},

      // ──────── IMAGE-TO-VIDEO (START FRAME) ────────
      {cat:'i2v',title:'Lighthouse Storm — Calm to Chaos',model:'Any video model',tags:['dramatic','weather','transformation'],imgPrompt:'Photorealistic lighthouse on rocky cliff at dusk, calm sea, dramatic clouds building on horizon. Warm light from lighthouse lamp. Shot on Nikon Z9, 35mm, golden hour. 4K, ultra-detailed, hyperrealistic.',vidPrompt:'The calm sea begins to churn as massive storm waves build and crash against the rocky cliff base. Wind intensifies, spray shooting 50 feet up the cliff face. Lightning illuminates thunderheads. The lighthouse beam sweeps through sheets of rain. Waves grow progressively more violent. Camera holds steady, dramatizing the raw power of nature. 5 seconds, cinematic.'},
      {cat:'i2v',title:'Portrait Comes to Life',model:'Any video model',tags:['portrait','magical','subtle'],imgPrompt:'Oil painting portrait in ornate gold frame hanging on dark museum wall. Subject is a young woman in 18th-century dress with enigmatic expression. Craquelure visible on paint surface. Museum spot lighting. Shot on Canon R5, 85mm, f/2.8. 4K, hyperrealistic photograph of a painting.',vidPrompt:'The painted woman\'s eyes slowly shift to look directly at the viewer. A subtle smile forms on her lips. Her chest rises with a slight breath. A strand of painted hair moves as if caught by a breeze. The craquelure on the canvas seems to heal where she moves. Candlelight from within the painting begins to flicker, casting moving shadows. Slow, eerie, magical. 5 seconds.'},
      {cat:'i2v',title:'Frozen Moment — Shattered Glass',model:'Any video model',tags:['action','slow-mo','dynamic'],imgPrompt:'Frozen moment in time: baseball mid-impact shattering a plate glass window. Glass shards suspended in air forming a starburst pattern. Baseball visible at center of impact. Dramatic side lighting creating sparkles on glass edges. Black background. Shot at hypothetical 10000fps freeze frame. 4K, ultra-detailed, hyperrealistic.',vidPrompt:'Time unfreezes in ultra slow motion. Glass shards continue their explosive trajectory outward, tumbling and catching light. The baseball pushes through, spinning, stitches visible. Glass fragments create a cascading waterfall of reflections. Some pieces collide mid-air, shattering further. Dust and micro-particles visible in light beam. Camera slowly dollies around the explosion. 120fps ultra slow motion, 5 seconds.'},
      {cat:'i2v',title:'Cyberpunk Alley — Neon Awakening',model:'Any video model',tags:['cyberpunk','urban','neon','atmospheric'],imgPrompt:'Dark cyberpunk alley, powered-down state. Dormant neon signs with faded kanji text lining both walls. Wet asphalt reflecting dim ambient light. Steam grate in foreground. Trash and cables on ground. One flickering fluorescent tube providing minimal light. Moody, noir atmosphere. 4K, ultra-detailed, hyperrealistic.',vidPrompt:'The alley awakens: neon signs power on one by one in a cascade from background to foreground — pink, cyan, amber, violet. Each sign buzzes and flickers before stabilizing. Holographic advertisements materialize above doorways. Steam intensifies from grates. Rain begins to fall, creating instant reflections of all the new light. A drone flies through overhead. The alley transforms from dead to electric. 5 seconds.'},
      {cat:'i2v',title:'Flower Bloom Macro',model:'Any video model',tags:['nature','macro','timelapse','beautiful'],imgPrompt:'Extreme macro of a closed peony bud, tight layers of deep pink petals visible. Morning dew drops on outer petals. Soft bokeh of garden behind. Shot on Canon R5 with MP-E 65mm macro. Early morning diffused light. 4K, ultra-detailed, nature photography.',vidPrompt:'The peony bud slowly opens in timelapse — outer petals unfurl first, revealing increasingly delicate inner layers. Dew drops roll off moving petals, catching light as they fall. Petals spread wide revealing golden stamens at center. A bee arrives and lands on an open petal, legs dusted with pollen. Subtle camera push into the heart of the flower. 5 seconds, smooth timelapse.'},
      {cat:'i2v',title:'Astronaut Helmet Reflection',model:'Any video model',tags:['sci-fi','space','reflection','cinematic'],imgPrompt:'Close-up of astronaut helmet visor, reflective gold coating. In the reflection: Earth\'s curved horizon, the sun rising behind it, and the astronaut\'s gloved hand raised. Space station solar panels visible. Stars in deep black space. Condensation inside helmet near edges. 4K, ultra-detailed, hyperrealistic, shot on IMAX camera.',vidPrompt:'In the helmet reflection, the sun crests over Earth\'s horizon in a brilliant sunrise — atmosphere layers shifting from deep blue to orange to white. Sun flare blooms across the visor. Earth rotates slowly, cloud patterns moving. The reflected hand slowly lowers revealing more of the view. Internal helmet condensation shifts. Breathing sound, visor slightly fogs and clears rhythmically. 5 seconds, awe-inspiring.'},
      {cat:'i2v',title:'Ancient Door Opens',model:'Any video model',tags:['mystery','fantasy','dramatic','light'],imgPrompt:'Massive ancient stone door covered in glowing runic carvings, set into a cliff face deep underground. Torches flanking both sides casting warm flickering light on wet stone. Moss and roots growing around the frame. Small stream of water running from beneath the sealed door. Archaeological equipment in foreground. 4K, ultra-detailed, cinematic, fantasy realism.',vidPrompt:'The runic carvings pulse with increasing intensity — blue light racing through the carved channels. The ground trembles, dust falling from the ceiling. The massive stone door begins to grind open, ancient mechanisms echoing. Brilliant white-gold light floods out from inside, illuminating the cavern. Silhouettes of impossibly tall structures visible within. Wind rushes outward, extinguishing the torches. 5 seconds, epic reveal.'},
      {cat:'i2v',title:'Vintage Car Engine Start',model:'Any video model',tags:['automotive','vintage','mechanical','satisfying'],imgPrompt:'Engine bay of a restored 1969 Ford Mustang Boss 429, hood open. Pristine chrome valve covers, black air cleaner, braided steel fuel lines. Everything perfectly detailed and clean. Garage lighting, concrete floor. Shot on medium format, shallow depth of field on carburetor. 4K, ultra-detailed, automotive photography.',vidPrompt:'The engine cranks — starter motor whines, engine catches and roars to life. Vibration ripples through all components. The carburetor butterfly valves open as RPMs rise, visible air intake distortion from suction. Fan spins up, belt-driven accessories engage. Subtle exhaust heat shimmer rises from headers. Fuel line pulses with flow. Camera holds steady as the mechanical symphony reaches idle. 5 seconds, satisfying mechanical ASMR.'},

      // ──────── START + END FRAME (KLING ONLY) ────────
      {cat:'startend',title:'Day to Night — City Skyline',model:'Kling 2.5 Turbo',tags:['timelapse','urban','transformation'],note:'Kling → General preset required',startPrompt:'City skyline at noon on a clear day. Bright blue sky with white cumulus clouds. Glass skyscrapers reflecting sunlight. Busy harbor with boats. Trees in full green foliage in foreground park. Shot from elevated viewpoint on tripod. 4K, ultra-detailed, hyperrealistic cityscape photography.',endPrompt:'Same exact city skyline at midnight. Deep navy sky with stars visible. Every building illuminated — office windows, LED facades, rooftop beacons. Harbor water reflecting city lights in long streaks. Car light trails on highways. Foreground park lit by warm path lamps. Same camera position, same composition. 4K, ultra-detailed, hyperrealistic night cityscape.',vidPrompt:'Smooth timelapse transition from bright midday to deep night. Sun arcs across sky and sets — golden hour colors wash across buildings, then blue hour, then darkness. Building lights switch on progressively. Cloud shadows race across the cityscape. Stars emerge. Water reflections transform from sun glitter to city light streaks. 5 seconds, seamless day-to-night transition.'},
      {cat:'startend',title:'Seasons — Spring to Winter',model:'Kling 2.5 Turbo',tags:['nature','seasons','transformation','beautiful'],note:'Kling → General preset required',startPrompt:'Country road lined with cherry blossom trees in full spring bloom. Pink petals drifting in breeze. Bright green grass, wildflowers in ditches. Warm afternoon sun, blue sky with fluffy clouds. White wooden fence along road. Shot on Canon R5, 35mm, f/8. 4K, ultra-detailed, idyllic spring landscape.',endPrompt:'Same country road in deep winter. Trees bare, branches heavy with fresh snow. Road covered in untouched snow with single tire track. Fence posts wearing snow caps. Overcast grey sky, soft diffused light. Warm glow from a distant farmhouse window. Same exact camera position and composition. 4K, ultra-detailed, winter landscape photography.',vidPrompt:'Seamless seasonal transition along the country road. Cherry blossoms give way to full green summer canopy, then golden-orange autumn foliage with leaves falling, then bare branches accumulating snow. Grass transitions from green to golden to snow-covered. Sky shifts from blue to grey. Temperature of light changes warm to cool. 5 seconds.'},
      {cat:'startend',title:'Portrait Aging — Youth to Elder',model:'Kling 2.5 Turbo',tags:['portrait','aging','transformation','emotional'],note:'Kling → General preset required',startPrompt:'Portrait of a woman at age 25. Smooth skin, bright eyes, dark brown hair in a simple bun. Wearing a white cotton blouse. Gentle confident smile. Neutral grey background. Even studio lighting, no harsh shadows. Shot on Hasselblad X2D, 100mm, f/4. Clean, timeless portrait. 4K, ultra-detailed, hyperrealistic.',endPrompt:'Same woman at age 85. Same pose, same white blouse style, same grey background, same lighting setup. Silver-white hair in same bun style. Deep smile lines, age spots, thinner lips. Same warm eyes but with accumulated wisdom. Pearl earrings added. Same camera, same lens, same framing. 4K, ultra-detailed, hyperrealistic portrait.',vidPrompt:'Smooth aging transformation from 25 to 85. Skin gradually develops character — laugh lines deepen, hair silvers strand by strand. Eyes maintain their spark while face matures through decades. Subtle changes: jawline softens, neck changes, hands age. Expression maintains the same gentle warmth throughout. A lifetime in 5 seconds. Respectful, beautiful, cinematic.'},
      {cat:'startend',title:'Construction — Empty Lot to Skyscraper',model:'Kling 2.5 Turbo',tags:['architecture','construction','timelapse','urban'],note:'Kling → General preset required',startPrompt:'Empty urban lot with chain-link fence, weeds growing through cracked concrete pad. Adjacent buildings on both sides. Clear blue sky above. Construction permit sign on fence. Puddle reflecting sky. Shot from across the street, slightly elevated. 4K, ultra-detailed, documentary photography.',endPrompt:'Same viewpoint: completed 40-story glass skyscraper filling the former empty lot. Modern curtain wall facade reflecting sky and neighboring buildings. Landscaped plaza at base with trees and water feature. People walking on sidewalk. Same adjacent buildings providing scale reference. Same camera position. 4K, ultra-detailed, architectural photography.',vidPrompt:'Accelerated construction timelapse: demolition of old pad, excavation, foundation pour, steel framework rising floor by floor, glass curtain wall installed panel by panel, crane removed, landscaping completed, people appear. Clouds race overhead. Day-night cycles flash. Each construction phase visible. 5 seconds, satisfying building progression.'},
      {cat:'startend',title:'Emotional Shift — Grief to Joy',model:'Kling 2.5 Turbo',tags:['emotional','portrait','transformation','cinematic'],note:'Kling → General preset required',startPrompt:'Close-up portrait of a man in his 30s, expression of deep grief. Red-rimmed eyes, tear tracks on cheeks. Looking slightly downward. Rain-streaked window behind him, cold blue light. Dark clothing. Shot on Arri Alexa, 85mm anamorphic, shallow depth of field. Moody, blue color grade. 4K, cinematic, hyperrealistic.',endPrompt:'Same man, same framing, same camera position. Now his expression is pure unbridled joy — wide genuine smile reaching his eyes, laugh lines visible. Same window behind but now showing golden sunset light flooding in. Warm amber color grade. Eyes bright and alive. Same clothing but warmer light transforms everything. 4K, cinematic, hyperrealistic.',vidPrompt:'Emotional transformation: grief slowly dissolves as light through the window shifts from cold blue rain to warm golden sunset. His expression transitions — tension releases from jaw, brow unfurrows, eyes lift, the faintest smile begins and grows into full radiant joy. Light and emotion transform together. 5 seconds, deeply human, cinematic.'},
      {cat:'startend',title:'Abandoned to Restored — Victorian House',model:'Kling 2.5 Turbo',tags:['architecture','restoration','transformation','satisfying'],note:'Kling → General preset required',startPrompt:'Abandoned Victorian house in severe disrepair. Peeling paint revealing bare wood, broken windows with torn curtains, sagging porch, overgrown yard with waist-high weeds. Crooked shutters, missing roof shingles. Gloomy overcast sky. Shot on Sony A7R V, 24mm. 4K, ultra-detailed, decay photography.',endPrompt:'Same Victorian house fully restored to glory. Fresh painted in period-correct deep blue with cream trim and burgundy accents. All windows restored with lace curtains. Porch rebuilt with turned balusters. Manicured garden with roses, trimmed hedges, brick walkway. Same camera position, same time of day but now sunny. 4K, ultra-detailed, architectural photography.',vidPrompt:'Restoration timelapse: scaffolding appears, crews work in fast-forward. Rotten wood replaced, new paint applied in smooth strokes, windows installed, porch rebuilt. Yard cleared and landscaped. Seasons shift subtly. Clouds clear from overcast to sunny as the house transforms. Final moment: front door opens and warm light spills out. 5 seconds.'},

      // ──────── EFFECTS & VFX ────────
      {cat:'vfx',title:'Particle Dissolution',model:'Veo 3.1',tags:['vfx','particles','magical','dramatic'],prompt:'A marble statue of a Greek goddess standing in a dark void begins to dissolve into millions of glowing golden particles starting from the fingertips. Particles swirl upward in a double-helix pattern, each emitting soft light. The dissolution reveals an inner core of pure crystalline energy before that too disperses. Camera slowly orbits the disintegrating figure. Particles catch and refract light like fireflies. 4K, photorealistic VFX, cinematic lighting.'},
      {cat:'vfx',title:'Elemental Morphing — Water to Fire',model:'Sora 2',tags:['vfx','elements','morphing','surreal'],prompt:'A human hand made entirely of flowing, transparent water — every finger detailed with internal currents and bubbles. The hand slowly clenches into a fist, and as it does, water transmutes into roaring fire from fingertips inward. Steam explosion at the boundary line between elements. Fire hand opens palm toward camera revealing a swirling galaxy in the palm. Camera macro close-up, dramatic studio lighting. 4K, photorealistic VFX.'},
      {cat:'vfx',title:'Glitch Reality Tear',model:'WAN 2.6',tags:['vfx','glitch','cyberpunk','surreal'],prompt:'Normal-looking office hallway. Suddenly a vertical tear appears in reality — edges pixelate and glitch with RGB splitting. Through the tear: an alien landscape with bioluminescent flora under a sky with two suns. The tear widens as digital artifacts spread across the office walls like infection — tiles lift, fluorescent lights strobe. A figure steps through from the other side, trailing data particles. 4K, hyperrealistic with digital VFX overlay.'},
      {cat:'vfx',title:'Liquid Metal Transformation',model:'Kling 2.5 Turbo',tags:['vfx','metal','morphing','sci-fi'],prompt:'A sphere of liquid mercury hovering in zero gravity. It begins to morph — extruding limbs, forming a humanoid figure in T-2000 style. Surface is perfectly reflective, showing distorted reflections of surrounding environment. Each movement creates ripples across the metal surface. Figure takes a step forward, foot splashing into mercury puddle on impact. Chrome reflections of studio ring lights sliding across the body. 4K, photorealistic, cinematic VFX.'},
      {cat:'vfx',title:'Nature Overgrowth — Reclaiming the City',model:'Veo 3.1',tags:['vfx','nature','timelapse','post-apocalyptic'],prompt:'Modern city intersection in fast-forward as nature reclaims it over centuries. Cracks appear in asphalt, grass pushes through, then saplings, then full trees. Vines climb buildings, roots crack foundations. Cars rust and crumble. Deer walk through what was a crosswalk. Building facades collapse revealing forests growing inside. River reforms where a road was. Accelerated to show 500 years in 5 seconds. 4K, National Geographic meets VFX.'},
      {cat:'vfx',title:'Frozen Time — Bullet Through Apple',model:'MiniMax Hailuo 02',tags:['vfx','slow-mo','physics','dramatic'],prompt:'Ultra slow motion: a bullet passing through a red apple suspended on a string. Entry point creates a shockwave visible in the apple flesh. Apple splits in half with a perfect cross-section visible for a frame — seeds, core, flesh layers all detailed. Juice and fragments spray outward in a radial pattern. The bullet exits trailing apple debris. Each droplet of juice catches studio light. Camera orbits 90 degrees during the event. 10000fps equivalent. 4K, hyperrealistic physics simulation.'},

      // ──────── CAMERA CONTROLS ────────
      {cat:'camera',title:'Crash Zoom — Eye of the Storm',model:'Sora 2',tags:['camera','crash zoom','dramatic','weather'],prompt:'Start on extreme wide shot of a massive supercell thunderstorm over flat Kansas plains. CRASH ZOOM at extreme speed directly into the funnel cloud — piercing through the debris field, rain bands, into the calm eye of the tornado. Final frame: looking straight up through the hollow vortex at clear blue sky above, walls of spinning clouds surrounding. One continuous impossible camera move. 4K, cinematic, hyperrealistic storm chasing.'},
      {cat:'camera',title:'Crane Shot — Ballroom Reveal',model:'Veo 3.1',tags:['camera','crane','elegant','cinematic'],prompt:'Camera starts tight on a pair of hands — one placing a white glove on the other. Slow crane up reveals an elegant woman in a 1920s beaded gown. Continue craning up and pulling back to reveal she\'s standing at the top of a grand marble staircase. Continue pulling back and up to reveal an enormous Art Deco ballroom below — 500 guests dancing, live orchestra, crystal chandeliers. One continuous upward crane, 8 seconds of pure cinematic elegance. 4K.'},
      {cat:'camera',title:'Dolly Zoom — Vertigo Effect',model:'Kling 2.5 Turbo',tags:['camera','dolly zoom','psychological','thriller'],prompt:'Classic Hitchcock dolly zoom (Vertigo effect) in a long hospital corridor. Camera dollies backward while zooming in, creating the disorienting effect of the hallway stretching impossibly long. Fluorescent lights creating repeating patterns that exaggerate the effect. A lone figure at the far end appears to stay the same size while the world warps around them. Unsettling, psychological. 4K, cinematic, thriller aesthetic.'},
      {cat:'camera',title:'360° Orbit — Frozen Moment',model:'Sora 2',tags:['camera','orbit','bullet-time','action'],prompt:'Frozen-moment bullet-time orbit: a martial artist captured mid-flying kick, opponent reacting, sweat droplets and dust particles suspended in air. Camera performs a complete smooth 360-degree orbit around the frozen action. Every detail sharp — fabric folds, muscle tension, expression of concentration. Gymnasium setting with dramatic side lighting. Full rotation over 5 seconds, buttery smooth, consistent lighting throughout. 4K, cinematic, Matrix-style.'},
      {cat:'camera',title:'Tracking Shot — Single Take Street',model:'WAN 2.6',tags:['camera','tracking','one-take','urban'],prompt:'Continuous Steadicam tracking shot following a musician carrying a trumpet through the French Quarter of New Orleans at dusk. He weaves through crowds, crosses streets, nods to other musicians. Camera maintains medium shot, fluid movement. Jazz spills from open doorways. Neon signs flicker on as evening arrives. He reaches Jackson Square and begins to play — camera slowly circles him as a crowd gathers. One unbroken take, 8 seconds. 4K, documentary cinema.'},
      {cat:'camera',title:'Whip Pan Transitions',model:'Seedance Pro',tags:['camera','whip pan','transitions','dynamic'],prompt:'Series of whip pan transitions connecting different locations: Start in a Tokyo sushi bar — WHIP PAN RIGHT — seamlessly transition to a Paris café terrace — WHIP PAN RIGHT — into a New York yellow cab interior — WHIP PAN RIGHT — onto a Marrakech rooftop at sunset. Each location has 1 second of stable footage before the next whip pan. Motion blur seamlessly blends environments. Color palette shifts with each location. 4K, travel commercial aesthetic.'},
      {cat:'camera',title:'Macro to Astro — Infinite Zoom Out',model:'Veo 3.1',tags:['camera','zoom','cosmic','mind-bending'],prompt:'Infinite zoom out starting from the atomic level — electron orbits around a carbon atom. Zoom out to reveal a DNA double helix, then a cell, then an eye, then a human face, then a person standing on a cliff, then the coastline, then Earth from orbit, then the solar system, then the Milky Way, then the cosmic web of galaxy clusters. Each scale transition is seamless. Consistent zoom speed throughout. Powers of Ten homage. 4K, educational meets cinematic.'},
      {cat:'camera',title:'Dutch Angle Chase',model:'Kling 2.5 Turbo',tags:['camera','dutch angle','thriller','chase'],prompt:'Intense chase sequence shot entirely in Dutch angle (15-degree tilt). POV pursuer running through a rain-soaked parking garage. Fluorescent lights strobing overhead. Concrete pillars whipping past creating rhythmic visual pattern. Target visible 50 meters ahead, weaving between parked cars. Camera height low, aggressive forward momentum. Water splashing underfoot. Tire screech sounds implied by a car backing out, near-miss. Thriller tension. 4K, cinematic, Fincher aesthetic.'},
    ];
  }

  get CATEGORIES() {
    return {
      image: {icon:'🖼️', title:'Image Generation Prompts'},
      video: {icon:'🎥', title:'Text-to-Video Prompts'},
      i2v:   {icon:'🖼️→🎥', title:'Image-to-Video (Start Frame)'},
      startend:{icon:'🔄', title:'Start + End Frame (Kling Only)'},
      vfx:   {icon:'✨', title:'Effects & VFX'},
      camera:{icon:'🎥', title:'Camera Controls'},
    };
  }

  _esc(s) { if(!s) return ''; const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

  _copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
      if (window.showToast) window.showToast('Copied to clipboard!', 2000);
    }).catch(() => {
      if (window.showToast) window.showToast('Copy failed', 2000);
    });
  }

  _renderCard(p, idx) {
    const esc = s => this._esc(s);
    let body = '';
    if (p.cat === 'i2v') {
      body = `
        <div class="hf-step-label">Step 1: Generate start frame image</div>
        <div class="hf-prompt-text">${esc(p.imgPrompt)}</div>
        <button class="hf-copy-btn" data-copy="imgPrompt" data-idx="${idx}">📋 Copy Image Prompt</button>
        <div class="hf-step-label">Step 2: Generate video from image</div>
        <div class="hf-prompt-text">${esc(p.vidPrompt)}</div>
        <button class="hf-copy-btn" data-copy="vidPrompt" data-idx="${idx}">📋 Copy Video Prompt</button>`;
    } else if (p.cat === 'startend') {
      body = `
        <div class="hf-step-label">Start Frame Image Prompt</div>
        <div class="hf-prompt-text">${esc(p.startPrompt)}</div>
        <button class="hf-copy-btn" data-copy="startPrompt" data-idx="${idx}">📋 Copy Start Frame</button>
        <div class="hf-step-label">End Frame Image Prompt</div>
        <div class="hf-prompt-text">${esc(p.endPrompt)}</div>
        <button class="hf-copy-btn" data-copy="endPrompt" data-idx="${idx}">📋 Copy End Frame</button>
        <div class="hf-step-label">Video Prompt</div>
        <div class="hf-prompt-text">${esc(p.vidPrompt)}</div>
        <button class="hf-copy-btn" data-copy="vidPrompt" data-idx="${idx}">📋 Copy Video Prompt</button>
        ${p.note ? `<div class="hf-tip">⚠️ ${p.note}</div>` : ''}`;
    } else {
      body = `
        <div class="hf-prompt-text">${esc(p.prompt)}</div>
        <button class="hf-copy-btn" data-copy="prompt" data-idx="${idx}">📋 Copy Prompt</button>`;
    }

    const badges = `<div class="hf-badges">
      <span class="hf-badge model">${esc(p.model)}</span>
      ${p.startFrame ? '<span class="hf-badge start-frame">Start Frame</span>' : ''}
      ${p.cat === 'startend' ? '<span class="hf-badge kling">Kling Only</span>' : ''}
    </div>`;

    const tags = p.tags.map(t => `<span class="hf-tag">${esc(t)}</span>`).join('');
    const tip = p.tip ? `<div class="hf-tip">⏱️ ${p.tip}</div>` : '';

    return `<div class="hf-card cc-fade-in" data-cat="${p.cat}" data-search="${esc((p.title + ' ' + p.tags.join(' ') + ' ' + (p.prompt||'') + ' ' + (p.vidPrompt||'') + ' ' + (p.imgPrompt||'')).toLowerCase())}">
      <div class="hf-card-header"><span class="hf-card-title">${esc(p.title)}</span></div>
      ${badges}
      <div class="hf-tags">${tags}</div>
      ${tip}
      ${body}
    </div>`;
  }

  _render() {
    const PROMPTS = this.PROMPTS;
    const CATEGORIES = this.CATEGORIES;

    // Build models reference
    const modelsHtml = `<div class="hf-models cc-fade-in">
      <details>
        <summary>📋 Model Reference — Capabilities & Support</summary>
        <div class="hf-models-grid">
          <div class="hf-model-card"><h4>🖼️ Image Models</h4><ul>
            <li><b>Nano Banana Pro</b> — fast, stylized</li>
            <li><b>Higgsfield Soul</b> — photorealistic portraits</li>
            <li><b>Seedream 4.0</b> — high-detail scenes</li>
            <li><b>GPT Image</b> — versatile, instruction-following</li>
            <li><b>FLUX.1 Pro / Dev / Schnell</b> — fast diffusion</li>
            <li><b>Kling O1</b> — photorealistic, high-res</li>
          </ul></div>
          <div class="hf-model-card"><h4>🎥 Video Models</h4><ul>
            <li><b>Sora 2</b> — text-only, start frame</li>
            <li><b>Veo 3.1</b> — text-only, start frame</li>
            <li><b>WAN 2.5 / 2.6</b> — text-only, start frame</li>
            <li><b>Kling 2.5 Turbo</b> — text, start, <em>start+end frame</em></li>
            <li><b>MiniMax Hailuo 02</b> — text-only, start frame</li>
            <li><b>Seedance Pro</b> — text-only, start frame</li>
          </ul></div>
          <div class="hf-model-card"><h4>⚙️ Feature Support</h4><ul>
            <li>✅ <b>Text-only</b> — all video models</li>
            <li>✅ <b>Start frame</b> — all video models</li>
            <li>⚡ <b>Start + End frame</b> — <em>Kling only</em> (General preset required)</li>
          </ul></div>
        </div>
      </details>
    </div>`;

    // Build controls
    const controlsHtml = `<div class="hf-controls cc-fade-in">
      <input type="text" class="hf-search" data-role="hf-search" placeholder="🔍 Search prompts…" autocomplete="off">
      <div class="hf-pills" data-role="hf-pills">
        <button class="hf-pill active" data-cat="all">All</button>
        <button class="hf-pill" data-cat="image">🖼️ Image</button>
        <button class="hf-pill" data-cat="video">🎥 Video</button>
        <button class="hf-pill" data-cat="i2v">🖼️→🎥 Image-to-Video</button>
        <button class="hf-pill" data-cat="startend">🔄 Start+End</button>
        <button class="hf-pill" data-cat="vfx">✨ VFX</button>
        <button class="hf-pill" data-cat="camera">🎥 Camera</button>
      </div>
    </div>`;

    // Build content
    let contentHtml = '';
    for (const [cat, meta] of Object.entries(CATEGORIES)) {
      const cards = PROMPTS.map((p,i) => [p,i]).filter(([p]) => p.cat === cat);
      if (!cards.length) continue;
      contentHtml += `<div class="hf-section" data-cat="${cat}"><h2>${meta.icon} ${meta.title}</h2></div>`;
      contentHtml += `<div class="hf-grid" data-cat="${cat}">${cards.map(([p,i]) => this._renderCard(p,i)).join('')}</div>`;
    }

    this.innerHTML = `
      <div class="page-header cc-fade-in">
        <h1>🎬 <span>Prompts</span></h1>
        <p style="color:var(--muted);font-size:1rem;margin-top:.25rem;">Ready-to-use prompts for AI image and video generation</p>
      </div>
      ${modelsHtml}
      ${controlsHtml}
      <div data-role="hf-content">${contentHtml}</div>`;
  }

  _bindEvents() {
    const PROMPTS = this.PROMPTS;

    // Copy buttons
    this.addEventListener('click', e => {
      const btn = e.target.closest('.hf-copy-btn');
      if (!btn) return;
      const idx = parseInt(btn.dataset.idx);
      const field = btn.dataset.copy;
      if (PROMPTS[idx] && PROMPTS[idx][field]) this._copyText(PROMPTS[idx][field]);
    });

    // Filter pills
    const pills = this.querySelector('[data-role="hf-pills"]');
    if (pills) pills.addEventListener('click', e => {
      const pill = e.target.closest('.hf-pill');
      if (!pill) return;
      this.querySelectorAll('.hf-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      this._filterAll();
    });

    // Search
    const search = this.querySelector('[data-role="hf-search"]');
    if (search) search.addEventListener('input', () => this._filterAll());
  }

  _filterAll() {
    const cat = this.querySelector('.hf-pill.active')?.dataset.cat || 'all';
    const q = this.querySelector('[data-role="hf-search"]')?.value.toLowerCase().trim() || '';

    this.querySelectorAll('.hf-card').forEach(card => {
      const catMatch = cat === 'all' || card.dataset.cat === cat;
      const searchMatch = !q || card.dataset.search.includes(q);
      card.classList.toggle('hidden', !(catMatch && searchMatch));
    });

    this.querySelectorAll('.hf-section, .hf-grid').forEach(el => {
      const sCat = el.dataset.cat;
      if (cat !== 'all' && sCat !== cat) { el.classList.add('hidden'); return; }
      el.classList.remove('hidden');
      if (el.classList.contains('hf-grid') && q) {
        const hasVisible = el.querySelector('.hf-card:not(.hidden)');
        const section = el.previousElementSibling;
        if (!hasVisible) { el.classList.add('hidden'); if(section) section.classList.add('hidden'); }
      }
    });
  }

  _injectStyles() {
    if (document.getElementById('cc-prompts-tab-styles')) return;
    const s = document.createElement('style');
    s.id = 'cc-prompts-tab-styles';
    s.textContent = `
      .hf-controls { display: flex; flex-wrap: wrap; gap: .75rem; margin: 1.5rem auto; max-width: 1200px; padding: 0 1rem; align-items: center; }
      .hf-search { flex: 1; min-width: 200px; padding: .6rem 1rem; border-radius: 8px; border: 1px solid var(--border, #334155); background: var(--surface); color: var(--text); font-size: .95rem; }
      .hf-pills { display: flex; flex-wrap: wrap; gap: .5rem; }
      .hf-pill { padding: .4rem .9rem; border-radius: 20px; border: 1px solid var(--border, #334155); background: transparent; color: var(--muted); cursor: pointer; font-size: .85rem; transition: all .2s; }
      .hf-pill:hover, .hf-pill.active { background: var(--accent); color: #000; border-color: var(--accent); }
      .hf-models { max-width: 1200px; margin: 1rem auto; padding: 0 1rem; }
      .hf-models details { background: var(--surface); border: 1px solid var(--border, #334155); border-radius: 12px; padding: 1rem 1.25rem; }
      .hf-models summary { cursor: pointer; font-weight: 600; font-size: 1.05rem; color: var(--text); }
      .hf-models-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem; }
      .hf-model-card { background: var(--glass-bg, rgba(255,255,255,.03)); border-radius: 8px; padding: .75rem 1rem; border: 1px solid var(--border, #334155); }
      .hf-model-card h4 { margin: 0 0 .5rem; font-size: .9rem; color: var(--accent); }
      .hf-model-card ul { margin: 0; padding-left: 1.2rem; font-size: .82rem; color: var(--muted); }
      .hf-model-card li { margin-bottom: .2rem; }
      .hf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.25rem; max-width: 1200px; margin: 1.5rem auto; padding: 0 1rem; }
      .hf-card { background: var(--glass-bg, rgba(255,255,255,.04)); backdrop-filter: blur(12px); border: 1px solid var(--border, #334155); border-radius: 14px; padding: 1.25rem; display: flex; flex-direction: column; gap: .6rem; transition: transform .15s, box-shadow .15s; }
      .hf-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.3); }
      .hf-card.hidden { display: none; }
      .hf-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: .5rem; }
      .hf-card-title { font-weight: 700; font-size: 1.05rem; color: var(--text); }
      .hf-badges { display: flex; flex-wrap: wrap; gap: .35rem; }
      .hf-badge { font-size: .7rem; padding: .2rem .55rem; border-radius: 6px; background: var(--accent); color: #000; font-weight: 600; white-space: nowrap; }
      .hf-badge.model { background: var(--purple, #6366f1); color: #fff; }
      .hf-badge.start-frame { background: var(--green, #22c55e); color: #fff; }
      .hf-badge.kling { background: var(--pink, #ec4899); color: #fff; }
      .hf-tags { display: flex; flex-wrap: wrap; gap: .3rem; }
      .hf-tag { font-size: .7rem; padding: .15rem .5rem; border-radius: 4px; background: var(--glass-bg, rgba(255,255,255,.06)); color: var(--muted); }
      .hf-prompt-text { font-family: 'SF Mono', 'Fira Code', monospace; font-size: .82rem; line-height: 1.5; color: var(--muted); background: var(--card, rgba(0,0,0,.25)); border-radius: 8px; padding: .75rem; white-space: pre-wrap; word-break: break-word; position: relative; max-height: 200px; overflow-y: auto; }
      .hf-step-label { font-size: .75rem; font-weight: 700; color: var(--accent); margin-top: .3rem; }
      .hf-copy-btn { align-self: flex-end; padding: .35rem .8rem; border-radius: 6px; border: 1px solid var(--border, #334155); background: transparent; color: var(--muted); cursor: pointer; font-size: .8rem; transition: all .2s; }
      .hf-copy-btn:hover { background: var(--accent); color: #000; border-color: var(--accent); }
      .hf-tip { font-size: .75rem; color: var(--muted); font-style: italic; }
      .hf-section { max-width: 1200px; margin: 2rem auto .5rem; padding: 0 1rem; }
      .hf-section h2 { font-size: 1.3rem; color: var(--text); margin: 0; }
      .hf-section.hidden { display: none; }
      .hf-grid.hidden { display: none; }
      @media (max-width: 600px) { .hf-grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(s);
  }
}

if (!customElements.get('cc-prompts-tab')) customElements.define('cc-prompts-tab', CcPromptsTab);
