export interface Drill {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  videoId: string;
  coachingPoints: string[];
  equipment: string[];
  categories: string[];
  position: "both" | "winger" | "striker";
}

export const DRILLS: Drill[] = [
  // Warm-Up
  {
    id: "warmup-dynamic",
    name: "Dynamic Warm-Up",
    description:
      "Full body dynamic stretching routine to prepare for training. Includes leg swings, high knees, butt kicks, lateral shuffles, and arm circles.",
    duration: 10,
    difficulty: "Beginner",
    videoId: "5v4HcDcUI9A",
    coachingPoints: [
      "Start slow and gradually increase intensity",
      "Focus on full range of motion",
      "Get a light sweat going before main session",
      "Include both upper and lower body movements",
    ],
    equipment: ["Open space"],
    categories: ["flexibility", "warmup"],
    position: "both",
  },
  {
    id: "warmup-fifa",
    name: "FIFA Dynamic Warm-Up",
    description:
      "FIFA-standard pre-match and pre-training warm-up routine with dynamic stretches and movement patterns.",
    duration: 10,
    difficulty: "Beginner",
    videoId: "LtK_Qnye5w4",
    coachingPoints: [
      "Follow the FIFA 11+ protocol",
      "Activate all major muscle groups",
      "Include balance exercises",
      "Progress from walking to jogging pace",
    ],
    equipment: ["Open space"],
    categories: ["flexibility", "warmup"],
    position: "both",
  },
  {
    id: "warmup-pro",
    name: "Pro Dynamic Warm-Up Routine",
    description:
      "Professional pre-match dynamic warm-up used by coaches. Complete routine to prepare for peak performance.",
    duration: 10,
    difficulty: "Intermediate",
    videoId: "G2HRt2-wZ-s",
    coachingPoints: [
      "Progress from low to high intensity",
      "Include sport-specific movements",
      "Activate glutes and hip flexors",
      "Finish with short sprints",
    ],
    equipment: ["Open space"],
    categories: ["flexibility", "warmup"],
    position: "both",
  },
  // Speed & Agility
  {
    id: "speed-ladder-basic",
    name: "Speed Ladder Drills",
    description:
      "15 fast footwork patterns using an agility ladder to improve foot speed, coordination and quickness.",
    duration: 15,
    difficulty: "Intermediate",
    videoId: "tMY5Cj39xN8",
    coachingPoints: [
      "Stay on the balls of your feet",
      "Drive arms in sync with feet",
      "Keep your core tight",
      "Quality over speed—master the pattern first",
      "Gradually increase speed each rep",
    ],
    equipment: ["Agility ladder"],
    categories: ["speed", "agility"],
    position: "both",
  },
  {
    id: "speed-ladder-ball",
    name: "Ladder Drills with Ball",
    description:
      "Combine agility ladder footwork with ball control. Develops coordination between fast feet and touch on the ball.",
    duration: 15,
    difficulty: "Advanced",
    videoId: "uJTYDAuyBWI",
    coachingPoints: [
      "Keep the ball close while doing ladder patterns",
      "Look up between touches",
      "Push the ball ahead then sprint through ladder",
      "Use both feet",
    ],
    equipment: ["Agility ladder", "Soccer ball"],
    categories: ["speed", "agility", "dribbling"],
    position: "both",
  },
  {
    id: "speed-agility-youth",
    name: "Soccer Speed & Agility Training",
    description:
      "Complete speed and agility session designed for youth soccer players. Includes acceleration, deceleration and change of direction.",
    duration: 15,
    difficulty: "Intermediate",
    videoId: "Ym9GfLVT31o",
    coachingPoints: [
      "Low center of gravity on direction changes",
      "Explode out of each cut",
      "Short choppy steps before changing direction",
      "Arms drive power—pump them hard",
    ],
    equipment: ["Cones", "Open space"],
    categories: ["speed", "agility"],
    position: "both",
  },
  {
    id: "speed-ladder-joner",
    name: "5 Ladder Exercises for Footballers",
    description:
      "Five essential agility ladder drills specifically designed for football players to develop quick feet.",
    duration: 10,
    difficulty: "Intermediate",
    videoId: "AtLK1nAw6lU",
    coachingPoints: [
      "Stay light on your feet",
      "Keep hips facing forward",
      "Minimize ground contact time",
      "Focus on rhythm and timing",
    ],
    equipment: ["Agility ladder"],
    categories: ["speed", "agility"],
    position: "both",
  },
  {
    id: "speed-agility-fast",
    name: "Fast Footwork & Agility Ladder",
    description:
      "Speed and agility ladder drills to increase athletic ability. Quick feet patterns for explosive performance.",
    duration: 12,
    difficulty: "Intermediate",
    videoId: "4taYjKlmihU",
    coachingPoints: [
      "Light quick touches",
      "Arms pump naturally",
      "Stay low through the ladder",
      "Sprint out after each pattern",
    ],
    equipment: ["Agility ladder"],
    categories: ["speed", "agility"],
    position: "both",
  },
  // Ball Mastery & Dribbling
  {
    id: "ball-mastery-advanced",
    name: "5 Hard Ball Mastery Drills",
    description:
      "Advanced 4-cone ball mastery drills from Joner Football. Develops elite close control and touch.",
    duration: 20,
    difficulty: "Advanced",
    videoId: "LEh08JCnUmQ",
    coachingPoints: [
      "Use all surfaces of both feet",
      "Keep the ball within playing distance",
      "Soft touch—cushion the ball",
      "Increase speed as you master each pattern",
      "Head up as much as possible",
    ],
    equipment: ["Soccer ball", "4 cones"],
    categories: ["dribbling", "ball-mastery"],
    position: "both",
  },
  {
    id: "ball-mastery-5drills",
    name: "Ball Mastery Instagram Challenge",
    description:
      "5 ball mastery drills from Joner Football. Test your close control with these technical challenges.",
    duration: 15,
    difficulty: "Intermediate",
    videoId: "IcQXkzMvvlQ",
    coachingPoints: [
      "Both feet equally",
      "Sole rolls, inside-outside combos",
      "Stay relaxed—don't tense up",
      "Record yourself to check form",
    ],
    equipment: ["Soccer ball", "Cones"],
    categories: ["dribbling", "ball-mastery"],
    position: "both",
  },
  {
    id: "dribbling-individual",
    name: "Individual Training: Dribbling & First Touch",
    description:
      "Full individual training session from 7MLC covering first touch, dribbling and finishing.",
    duration: 20,
    difficulty: "Intermediate",
    videoId: "AesPWLtCQR4",
    coachingPoints: [
      "Quality first touch out of feet",
      "Dribble with head up",
      "Use both feet equally",
      "Change pace and direction frequently",
    ],
    equipment: ["Soccer ball", "Cones"],
    categories: ["dribbling", "ball-mastery"],
    position: "both",
  },
  // 1v1 Skills
  {
    id: "1v1-five-best",
    name: "Five Best 1v1 Skills",
    description:
      "Learn the five most effective 1v1 skills to beat defenders. Step-overs, scissors, body feints and more.",
    duration: 20,
    difficulty: "Intermediate",
    videoId: "TzSSqyfiLFM",
    coachingPoints: [
      "Sell the fake with your body, not just feet",
      "Accelerate AFTER the move",
      "Practice both sides",
      "Use in game-realistic scenarios",
      "Timing is everything—do the move in the right moment",
    ],
    equipment: ["Soccer ball", "Cones"],
    categories: ["dribbling", "1v1"],
    position: "winger",
  },
  {
    id: "1v1-beginner-advanced",
    name: "Every 1v1 Skill Move: Beginner to Advanced",
    description:
      "Complete progression of 1v1 skill moves from AllAttack. From basic body feints to advanced elasticos.",
    duration: 25,
    difficulty: "Advanced",
    videoId: "YjoV7UH_0ZM",
    coachingPoints: [
      "Master basics before advanced moves",
      "Practice at walking speed first",
      "Chain moves together for unpredictability",
      "Always accelerate after beating the defender",
    ],
    equipment: ["Soccer ball", "Cones or mannequin"],
    categories: ["dribbling", "1v1"],
    position: "winger",
  },
  {
    id: "1v1-turning-moves",
    name: "Top 10 Turning Moves for 1v1",
    description:
      "10 cutting and turning moves with 90° rotations to beat your opponent. Improves ball control, quick turns, and agility.",
    duration: 20,
    difficulty: "Intermediate",
    videoId: "pSUX0GhJrpQ",
    coachingPoints: [
      "Drop shoulder before turning",
      "Use body to shield the ball",
      "Explode into space after the turn",
      "Practice Cruyff turn, drag back, and inside cut",
    ],
    equipment: ["Soccer ball", "Cones"],
    categories: ["dribbling", "1v1"],
    position: "both",
  },
  // Finishing & Shooting
  {
    id: "finishing-clinical",
    name: "10 Clinical Finishing Exercises",
    description:
      "10 shooting drills from 7MLC to help you become a clinical finisher. Placement, power, and one-touch finishing.",
    duration: 25,
    difficulty: "Intermediate",
    videoId: "0u8kPwXXsLA",
    coachingPoints: [
      "Plant foot pointing at target",
      "Lock ankle on power shots",
      "Side foot for placement, laces for power",
      "Follow through towards target",
      "Aim for corners, not center of goal",
    ],
    equipment: ["Soccer balls", "Goal", "Cones"],
    categories: ["finishing", "shooting"],
    position: "striker",
  },
  {
    id: "finishing-joner",
    name: "Insane Shooting Drill Combo",
    description:
      "Finishing drill combo from Joner Football. Works on box finishing, two-touch finishing, and long-range shots.",
    duration: 20,
    difficulty: "Advanced",
    videoId: "cJbJkFtY05A",
    coachingPoints: [
      "Quick set-up touch before shooting",
      "Keep body over the ball",
      "Hit through the ball, not under it",
      "Variety: near post, far post, low, driven",
    ],
    equipment: ["Soccer balls", "Goal", "Cones"],
    categories: ["finishing", "shooting"],
    position: "striker",
  },
  {
    id: "finishing-attackers",
    name: "Shooting Drills for Attacking Players",
    description:
      "Essential shooting drills every attacking player must learn. From Joner Football.",
    duration: 20,
    difficulty: "Intermediate",
    videoId: "ykCvff--h18",
    coachingPoints: [
      "First touch sets up the shot",
      "Body shape before receiving",
      "Open your body to see the goal early",
      "Practice with both feet",
    ],
    equipment: ["Soccer balls", "Goal"],
    categories: ["finishing", "shooting"],
    position: "both",
  },
  {
    id: "finishing-fun-games",
    name: "Fun Finishing Games: 1v1, 2v1, 2v2",
    description:
      "Fun shooting exercises including 1v1, 2v1 and 2v2 games. Competitive finishing practice.",
    duration: 20,
    difficulty: "Intermediate",
    videoId: "G9ipr76GWnE",
    coachingPoints: [
      "Make quick decisions under pressure",
      "Shoot early when you have a chance",
      "Use feints before shooting",
      "Communicate with teammates in 2v2",
    ],
    equipment: ["Soccer balls", "Goal", "Cones", "Bibs"],
    categories: ["finishing", "shooting"],
    position: "both",
  },
  // Winger Drills
  {
    id: "winger-finishing",
    name: "Winger Finishing Training Session",
    description:
      "Individual finishing training specifically designed for wingers. Cutting inside, near post finishes, and far post curlers.",
    duration: 20,
    difficulty: "Intermediate",
    videoId: "vmzNAB4PX9I",
    coachingPoints: [
      "Cut inside onto strong foot for shots",
      "Curl shots around the keeper",
      "Near post finishes with pace",
      "Hit the ball across goal to far post",
    ],
    equipment: ["Soccer balls", "Goal", "Cones"],
    categories: ["finishing", "winger"],
    position: "winger",
  },
  {
    id: "winger-cut-inside",
    name: "Winger Cut Inside & Shooting Drill",
    description:
      "Winger training drill focusing on cutting inside from wide areas combined with off-the-ball movement into shooting positions.",
    duration: 20,
    difficulty: "Intermediate",
    videoId: "y4daqIqzTaQ",
    coachingPoints: [
      "Take touch away from defender before cutting",
      "Accelerate after the cut",
      "Open body shape to create angle",
      "Shoot across goal for best chance",
    ],
    equipment: ["Soccer balls", "Goal", "Cones"],
    categories: ["finishing", "winger", "dribbling"],
    position: "winger",
  },
  // Striker Movement
  {
    id: "striker-movement",
    name: "Striker Movement: Runs Behind Defense",
    description:
      "Learn how to time runs behind the defense, create space, and finish chances as a striker.",
    duration: 15,
    difficulty: "Intermediate",
    videoId: "GdvVAwNH7QY",
    coachingPoints: [
      "Check away then spin behind",
      "Time your run with the passer's body shape",
      "Stay on the shoulder of the last defender",
      "Vary your runs: diagonal, straight, curved",
    ],
    equipment: ["Soccer balls", "Cones", "Goal"],
    categories: ["movement", "striker"],
    position: "striker",
  },
  {
    id: "striker-full-session",
    name: "Full Individual Striker Training",
    description:
      "Complete individual striker training session from 7MLC. First touch, movement, link-up play and finishing.",
    duration: 25,
    difficulty: "Advanced",
    videoId: "Kj2_9ekfa28",
    coachingPoints: [
      "Work on hold-up play",
      "Spin and finish in one movement",
      "Practice back-to-goal receiving",
      "Link play then get into the box",
    ],
    equipment: ["Soccer balls", "Goal", "Cones", "Wall/rebounder"],
    categories: ["finishing", "movement", "striker"],
    position: "striker",
  },
  // Juggling
  {
    id: "juggling-beginner",
    name: "Juggling Tutorial for Beginners",
    description:
      "Step-by-step guide to juggling a soccer ball. From catching to continuous juggles.",
    duration: 10,
    difficulty: "Beginner",
    videoId: "Txr2YQzsLDU",
    coachingPoints: [
      "Lock your ankle",
      "Hit the ball with the top of your foot (laces)",
      "Start with catch-juggle-catch",
      "Keep the ball at waist height",
      "Relax your leg—don't kick too hard",
    ],
    equipment: ["Soccer ball"],
    categories: ["ball-mastery", "juggling"],
    position: "both",
  },
  {
    id: "juggling-challenge",
    name: "Juggling Skills Challenge",
    description:
      "Advanced juggling challenge. Around the worlds, stalls, and trick juggles.",
    duration: 10,
    difficulty: "Advanced",
    videoId: "krSBbunxdUg",
    coachingPoints: [
      "Use all body parts: feet, thighs, head",
      "Try around the world once you can do 50+",
      "Practice stalls for control",
      "Set personal records and beat them",
    ],
    equipment: ["Soccer ball"],
    categories: ["ball-mastery", "juggling"],
    position: "both",
  },
  // Strength & Conditioning
  {
    id: "strength-bodyweight",
    name: "Youth Soccer Strength Training",
    description:
      "8 essential gym exercises for youth soccer players (11-14). Bodyweight focused for safe development.",
    duration: 25,
    difficulty: "Intermediate",
    videoId: "7U7OJ5Ge0I4",
    coachingPoints: [
      "Focus on form over reps",
      "Control the movement—no rushing",
      "Breathe: exhale on effort",
      "Rest 30-60 seconds between sets",
      "Stop if you feel sharp pain",
    ],
    equipment: ["Exercise mat"],
    categories: ["strength"],
    position: "both",
  },
  {
    id: "strength-plyometrics",
    name: "Essential Plyometric Exercises for Footballers",
    description:
      "5 essential plyometric exercises to develop explosive power for soccer. Box jumps, bounding, and single-leg hops.",
    duration: 15,
    difficulty: "Intermediate",
    videoId: "NQvZv3WKwaw",
    coachingPoints: [
      "Land softly—bend knees on landing",
      "Explode up as fast as possible",
      "Quality over quantity",
      "Rest fully between sets",
      "Start with lower box heights",
    ],
    equipment: ["Box/step", "Open space"],
    categories: ["strength", "plyometrics"],
    position: "both",
  },
  {
    id: "core-workout",
    name: "10 Minute Core Workout for Footballers",
    description:
      "Follow-along 10-minute core workout. Planks, bicycle crunches, dead bugs, and more.",
    duration: 10,
    difficulty: "Intermediate",
    videoId: "Jc75w4ksvLg",
    coachingPoints: [
      "Keep core engaged throughout",
      "Don't hold your breath",
      "Quality form over speed",
      "Modify exercises if needed",
    ],
    equipment: ["Exercise mat"],
    categories: ["strength", "core"],
    position: "both",
  },
  {
    id: "core-16-exercises",
    name: "16 Best Core Exercises for Soccer Players",
    description:
      "Comprehensive guide to the best core exercises specifically for football players.",
    duration: 15,
    difficulty: "Advanced",
    videoId: "pQ_Pdpvg0MQ",
    coachingPoints: [
      "Anti-rotation exercises are key",
      "Include planks, dead bugs, pallof press",
      "Train core stability, not just abs",
      "Progress difficulty over time",
    ],
    equipment: ["Exercise mat", "Resistance band"],
    categories: ["strength", "core"],
    position: "both",
  },
  {
    id: "core-4-exercises",
    name: "The Only Core Exercises Footballers Need",
    description:
      "4 essential core exercises in a circuit format. Simple, effective, and sport-specific.",
    duration: 10,
    difficulty: "Beginner",
    videoId: "Ponv7W4X0yM",
    coachingPoints: [
      "Circuit style: 30 sec work, 15 sec rest",
      "Focus on bracing your core",
      "Keep lower back pressed to floor on back exercises",
      "3 rounds for full effect",
    ],
    equipment: ["Exercise mat"],
    categories: ["strength", "core"],
    position: "both",
  },
  {
    id: "soccer-fitness-bodyweight",
    name: "Soccer Bodyweight Fitness",
    description:
      "Full bodyweight fitness circuit for soccer players. Squats, lunges, step-ups, push-ups, and planks.",
    duration: 20,
    difficulty: "Intermediate",
    videoId: "KeBv8HeBIJg",
    coachingPoints: [
      "Full range of motion on every rep",
      "Keep your back straight on squats",
      "Single leg exercises build balance",
      "3 sets of 12-15 reps each",
    ],
    equipment: ["Exercise mat", "Step/bench"],
    categories: ["strength"],
    position: "both",
  },
  {
    id: "ab-workout-10min",
    name: "10 Min Ab Workout for Soccer Players",
    description:
      "10-minute targeted ab workout from a professional soccer player. Build a strong core foundation.",
    duration: 10,
    difficulty: "Intermediate",
    videoId: "1oed7hbot_4",
    coachingPoints: [
      "Engage core before each movement",
      "Control the eccentric (lowering) phase",
      "Breathe consistently",
      "Modify if needed—build up over time",
    ],
    equipment: ["Exercise mat"],
    categories: ["strength", "core"],
    position: "both",
  },
  // Recovery & Flexibility
  {
    id: "cooldown-stretch",
    name: "Recovery Stretching Routine",
    description:
      "Quick 5-minute recovery stretching routine for soccer players. Reduce injuries and recover faster.",
    duration: 10,
    difficulty: "Beginner",
    videoId: "vPmMWP-gQs4",
    coachingPoints: [
      "Hold each stretch 20-30 seconds",
      "Never bounce in a stretch",
      "Breathe deeply and relax into it",
      "Focus on hamstrings, quads, hip flexors, calves",
    ],
    equipment: ["Exercise mat"],
    categories: ["flexibility", "recovery"],
    position: "both",
  },
  {
    id: "foam-rolling",
    name: "Foam Rolling for Soccer Players",
    description:
      "7 essential foam rolling exercises for soccer players. Recover faster and reduce muscle soreness.",
    duration: 15,
    difficulty: "Beginner",
    videoId: "1Cn3GdvZmpI",
    coachingPoints: [
      "Roll slowly—1 inch per second",
      "Spend extra time on tender spots",
      "Avoid rolling directly on joints",
      "Quads, hamstrings, IT band, calves, glutes",
    ],
    equipment: ["Foam roller"],
    categories: ["flexibility", "recovery"],
    position: "both",
  },
  {
    id: "foam-rolling-full",
    name: "Full Recovery Session: Foam Roll & Stretch",
    description:
      "Complete recovery session used by pro soccer players. Foam rolling followed by deep stretching.",
    duration: 20,
    difficulty: "Beginner",
    videoId: "fAgcU_OJTPE",
    coachingPoints: [
      "Do this after every hard session",
      "Foam roll before stretching",
      "Spend 2 minutes per muscle group",
      "Helps prevent injuries long-term",
    ],
    equipment: ["Foam roller", "Exercise mat"],
    categories: ["flexibility", "recovery"],
    position: "both",
  },
  {
    id: "foam-roll-recovery-pro",
    name: "Soccer Recovery: Foam Roller Basics",
    description:
      "How to use a foam roller properly for soccer recovery. Essential techniques for post-training recovery.",
    duration: 15,
    difficulty: "Beginner",
    videoId: "wYyC1tjK8GY",
    coachingPoints: [
      "Roll each muscle group 1-2 minutes",
      "Apply moderate pressure",
      "Pause on tight spots for 30 seconds",
      "Do after every training session",
    ],
    equipment: ["Foam roller"],
    categories: ["flexibility", "recovery"],
    position: "both",
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  warmup: "Warm-Up",
  speed: "Speed",
  agility: "Agility",
  dribbling: "Dribbling",
  "ball-mastery": "Ball Mastery",
  "1v1": "1v1 Skills",
  finishing: "Finishing",
  shooting: "Shooting",
  winger: "Winger",
  striker: "Striker",
  movement: "Movement",
  juggling: "Juggling",
  strength: "Strength",
  core: "Core",
  plyometrics: "Plyometrics",
  flexibility: "Flexibility",
  recovery: "Recovery",
};

export const FILTER_TABS = [
  { key: "all", label: "All Drills" },
  { key: "warmup", label: "Warm-Up" },
  { key: "speed", label: "Speed & Agility" },
  { key: "dribbling", label: "Dribbling" },
  { key: "finishing", label: "Finishing" },
  { key: "strength", label: "Strength" },
  { key: "recovery", label: "Recovery" },
] as const;

export type FilterTab = (typeof FILTER_TABS)[number]["key"];
