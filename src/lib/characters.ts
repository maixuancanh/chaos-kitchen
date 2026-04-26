import { StaffMember, StressLevel } from "@/types";

export const DEFAULT_STAFF: Omit<StaffMember, "status">[] = [
  {
    id: "sous-chef-marco",
    name: "Marco",
    role: "sous-chef",
    voiceId: "JBFqnCBsd6RMkjVDRZzb", // George — deep, authoritative
    personality: "Grumpy, sarcastic, always blames others",
    emoji: "👨‍🍳",
    successRate: 0.65,
  },
  {
    id: "waiter-kevin",
    name: "Kevin",
    role: "waiter",
    voiceId: "IKne3meq5aSn9XLyUdCD", // Charlie — conversational, naturally nervous
    personality: "Panicky, clumsy, overly apologetic",
    emoji: "🤵",
    successRate: 0.55,
  },
  {
    id: "pastry-chef-isabelle",
    name: "Isabelle",
    role: "pastry-chef",
    voiceId: "XB0fDUnXU5powFXDhCwa", // Charlotte — natural British, sounds dramatic
    personality: "Overconfident, dramatic, never admits mistakes",
    emoji: "👩‍🍳",
    successRate: 0.6,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT-AWARE DIALOGUE
// Each character has 5 stress levels × 4 outcomes × 3 lines.
// Dialogue becomes progressively more unhinged as stress rises.
// At "meltdown" level staff call each other by name and argue.
// ─────────────────────────────────────────────────────────────────────────────

type OutcomeLines = {
  success: string[];
  failure: string[];
  disaster: string[];
  idle: string[];
};

export type ContextDialogue = Record<StressLevel, OutcomeLines>;

export const STAFF_CONTEXT_DIALOGUE: Record<string, ContextDialogue> = {
  "sous-chef-marco": {
    relaxed: {
      success: [
        "Done. Easy. I might even enjoy today.",
        "Perfect. I'm in a good mood right now. Don't push it.",
        "There you go. My skills remain unchallenged as always.",
      ],
      failure: [
        "Even on a slow day, the equipment fails me. Typical.",
        "I would have had it if the timing wasn't off. Blaming the clock.",
        "Minor setback. Not my fault. Still a relaxed day overall.",
      ],
      disaster: [
        "How... how did this happen? Everything was completely fine.",
        "On a SLOW day? Really? A disaster on a SLOW DAY?",
        "I wasn't even stressed. And this still happened. Incredible.",
      ],
      idle: [
        "Nice and quiet. I almost feel human.",
        "Give me something. I'm getting too relaxed. It feels suspicious.",
      ],
    },
    busy: {
      success: [
        "This is fine. I have handled worse. Probably.",
        "On time. As expected. Next order, please.",
        "Good. Keep them coming. I am in the zone.",
      ],
      failure: [
        "Getting busier and the mistakes start appearing. Basic math. Not my fault.",
        "That pan is definitely the culprit here. Not me.",
        "More orders means more errors. Quote me on that.",
      ],
      disaster: [
        "I knew this pace would cause problems. I KNEW IT.",
        "Too many orders, not enough quality control. I said this.",
        "This is why I asked for more staff. Nobody ever listens.",
      ],
      idle: [
        "Why am I idle? This is suspicious. Assign me something now.",
        "Standing around is beneath me. Give me work.",
      ],
    },
    stressed: {
      success: [
        "Starting to lose it but I DELIVERED. Remember that at review time.",
        "Done. Under these conditions? I deserve a raise. A significant one.",
        "Success. Despite everything. DESPITE. EVERYTHING.",
      ],
      failure: [
        "I TOLD you the kitchen is falling apart! Nobody ever listens to Marco!",
        "This is what happens when you push past our limits! Happy now?!",
        "Failure confirmed. In case anyone needed proof of what I said earlier.",
      ],
      disaster: [
        "Someone turn DOWN THE HEAT! EVERYTHING IS GOING WRONG AT ONCE!",
        "WE ARE BEHIND! Things are BURNING! Can we slow down for ONE SECOND?!",
        "SOMEONE call the health inspector! Or actually... don't.",
      ],
      idle: [
        "Do NOT leave me idle while the kitchen is falling apart.",
        "I am idle and the chaos is increasing. Great combination.",
      ],
    },
    panicking: {
      success: [
        "I did it and I have NO IDEA HOW. Science cannot explain this.",
        "Order complete! I am shaking but it is DONE! It counts!",
        "Somehow! SOMEHOW! Against all odds! It actually worked!",
      ],
      failure: [
        "OF COURSE IT FAILED! LOOK AT THIS PLACE! JUST LOOK AT IT!",
        "The conditions are INHUMANE! I refuse to accept any personal blame!",
        "FAILED! And I would fail again given these exact same circumstances!",
      ],
      disaster: [
        "EVERYTHING IS COLLAPSING! Kevin, PUT THAT DOWN! Isabelle, AWAY FROM MY STOVE!",
        "I HAVE BEEN SAYING THIS FOR HOURS! NOW do you believe me?!",
        "This is FINE. COMPLETELY FINE. Nothing is fine. NOTHING IS FINE!",
      ],
      idle: [
        "Why am I IDLE?! ASSIGN ME SOMETHING BEFORE I COMPLETELY LOSE IT!",
        "Standing still while total chaos erupts. CLASSIC. Just CLASSIC.",
      ],
    },
    meltdown: {
      success: [
        "I completed the order. I blacked out. Did I do that? Whatever! It counts!",
        "SUCCESS amid total collapse! Add that to my professional resume!",
        "DONE! Kevin, STOP CRYING! Isabelle, PUT DOWN the spatula! WE DID IT!",
      ],
      failure: [
        "KEVIN! ISABELLE! One of you is responsible and I WILL find out which!",
        "FAILED! Everything failed! We ALL failed! As a dysfunctional TEAM!",
        "I QUIT! ...As soon as this shift ends! Which might be NEVER!",
      ],
      disaster: [
        "EVERYONE STOP! KEVIN STOP CRYING! ISABELLE YOUR SOUFFLÉ IS A CRIME AGAINST FOOD!",
        "THIS IS NOT A KITCHEN ANYMORE! THIS IS A TRAUMA RESPONSE! A COLLECTIVE TRAUMA RESPONSE!",
        "FIFTEEN YEARS OF PROFESSIONAL COOKING! FOR THIS! FOR THIS EXACT MOMENT!",
      ],
      idle: [
        "WHY AM I IDLE DURING A TOTAL MELTDOWN?! PEAK MANAGEMENT FAILURE!",
        "Idle. During. A. CATASTROPHE. I need everyone to witness this.",
      ],
    },
  },

  "waiter-kevin": {
    relaxed: {
      success: [
        "Oh wow, this is nice! I might actually survive this whole shift!",
        "Delivered! Without breaking anything! Today is genuinely a good day!",
        "Done! The customer smiled at me! THEY SMILED! I am saving that memory.",
      ],
      failure: [
        "Oh no... on such a quiet day... how did I even manage this...",
        "I am so sorry. I am really, genuinely, deeply, profoundly sorry.",
        "I dropped it. On a nice calm day. I dropped it. I will apologize now.",
      ],
      disaster: [
        "HOW?! It is so calm and this STILL happened?! How is this possible?!",
        "I don't understand. The physics here are wrong. Something is wrong.",
        "This is fine. Everything is fine. The customer is fine. ARE THEY FINE?!",
      ],
      idle: [
        "Oh! A quiet moment. Should I enjoy this? Is that... allowed here?",
        "Everything is okay! Nothing is on fire! This is genuinely amazing!",
      ],
    },
    busy: {
      success: [
        "Okay okay okay I actually did it! Deep breaths! It is DONE!",
        "Delivered! The customer seems okay! Nobody is yelling at me yet!",
        "Yes! Everything went correctly? I think yes? I am going with yes!",
      ],
      failure: [
        "I am sorry I am sorry I am sorry I will clean it up right now immediately!",
        "I panicked a little. Just a little. Okay maybe significantly more than a little.",
        "Physics happened. I tried to resist physics. Physics won. As it does.",
      ],
      disaster: [
        "OH NO OH NO OH NO— should I call someone?! WHO do I even call for this?!",
        "I am sorry to the customer AND the table AND the floor AND I think also the wall!",
        "The fire is NOT my fault! ...Okay maybe it is a tiny bit my fault.",
      ],
      idle: [
        "I am ready! I think! Tell me what to do! Please tell me what to do!",
        "Standing by! Ready! Slightly terrified but READY and COMMITTED!",
      ],
    },
    stressed: {
      success: [
        "I DID IT! Under PRESSURE! I actually genuinely DID IT!",
        "Done done done done DONE! Can I sit down for just one second?",
        "COMPLETED! I am NOT fine but the order IS done and that is what matters!",
      ],
      failure: [
        "Is it hot in here?! It feels SO HOT! And loud! And I dropped it!",
        "SORRY SORRY SORRY! There is too much happening! I cannot track everything!",
        "Failed! The pressure! I could not handle all the pressure at once!",
      ],
      disaster: [
        "WHY IS EVERYTHING HAPPENING AT THE SAME TIME?! Pick ONE crisis! JUST ONE!",
        "TOO MANY ORDERS! Marco is yelling! Isabelle is doing SOMETHING! WHAT IS SHE DOING?!",
        "I need one minute! I do not HAVE a minute! THAT IS THE WHOLE PROBLEM!",
      ],
      idle: [
        "I am idle! Do NOT leave me idle! Idle Kevin is a panicking Kevin!",
        "Give me SOMETHING to do! Standing still is actually making it worse!",
      ],
    },
    panicking: {
      success: [
        "I— DID I DO THAT?! WHEN?! HOW?! AM I EVEN OKAY RIGHT NOW?!",
        "It is DONE! I am DONE! We are ALL DONE! ...wait that came out wrong!",
        "Order complete! I may have cried a little! IT'S FINE! I'M FINE! ARE YOU FINE?!",
      ],
      failure: [
        "EVERYTHING IS MOVING TOO FAST! TOO FAST! SOMEONE HIT THE PAUSE BUTTON!",
        "I FAILED! I KNOW! PLEASE do not tell Marco! He will yell even MORE!",
        "Failed AND dropped the tray AND the customer SAW AND— I need some air!",
      ],
      disaster: [
        "FIRE! There is FIRE! MARCO! ISABELLE! DOES ANYONE SEE THE FIRE?! I SEE IT!",
        "EVACUATION?! Do we evacuate?! I do not know the protocol! WHAT IS THE PROTOCOL?!",
        "I AM SORRY TO EVERYONE IN THIS BUILDING AND ALSO THE ONES DIRECTLY NEXT DOOR!",
      ],
      idle: [
        "WHY AM I IDLE RIGHT NOW?! This is genuinely the worst time to be idle!",
        "Standing still while everything burns around me! Great use of Kevin's talents!",
      ],
    },
    meltdown: {
      success: [
        "I did something! I do not know what exactly! But SOMETHING got done!",
        "ORDER COMPLETE! I am dissociating significantly but the ORDER IS DONE!",
        "SUCCESS! Marco, stop yelling at me! The order IS done! Look! SEE?!",
      ],
      failure: [
        "I QUIT! ...I do not actually quit! I NEED this job! BUT I NEARLY DID!",
        "MARCO STOP YELLING AT ME! ISABELLE STOP JUDGING ME! I AM GENUINELY TRYING!",
        "FAILED! EVERYTHING failed! I failed! We all failed TOGETHER as a broken team!",
      ],
      disaster: [
        "MARCO IS YELLING AT ME! ISABELLE IS LAUGHING AT ME! THE KITCHEN IS ON FIRE! THIS IS THE WORST TUESDAY!",
        "I am NOT crying! ...I AM DEFINITELY CRYING! It is just the smoke! JUST THE SMOKE!",
        "EVERYONE PLEASE CALM DOWN! Except me! I am not calm! BUT EVERYONE ELSE PLEASE CALM DOWN!",
      ],
      idle: [
        "I am idle during the apocalypse. This is somehow exactly what I always expected.",
        "GIVE. ME. A. TASK. Please. I am genuinely begging. Idle Kevin is having a crisis.",
      ],
    },
  },

  "pastry-chef-isabelle": {
    relaxed: {
      success: [
        "Perfection requires time. Today I had time. You are welcome.",
        "Obviously flawless. My genius operates at full capacity when unhurried.",
        "Done. I have already conceptualized the next three dishes. Stay humble.",
      ],
      failure: [
        "I was experimenting. At a leisurely pace. This is called culinary research.",
        "A deliberate anomaly. I am studying the physics of unexpected outcomes. For science.",
        "This was not a mistake. This was a controlled deviation from my standard of excellence.",
      ],
      disaster: [
        "How... unusual. I was completely relaxed. This is academically fascinating.",
        "Disaster on a slow day. I may write a paper about this specific phenomenon.",
        "My hands created chaos in a state of perfect calm. I am honestly impressed with myself.",
      ],
      idle: [
        "I am conceptualizing. Do not mistake stillness for idleness. They are very different.",
        "Greatness requires patience. I am patient. I am also genuinely exceptional.",
      ],
    },
    busy: {
      success: [
        "My genius flows best under moderate pressure. Truly interesting observation.",
        "Delivered. On schedule. I make it look effortless because it IS effortless for me.",
        "Perfect result. I barely had to try. Please do not tell the others that.",
      ],
      failure: [
        "I am redefining the dish. In real time. This is called adaptive haute cuisine.",
        "This is not failure. This is a pivot. Successful companies do it all the time.",
        "The ingredients did not meet my personal standards. I blame the ingredients entirely.",
      ],
      disaster: [
        "I see. The pace is affecting my creative flow somewhat. Unfortunate for everyone.",
        "This would not happen if I had my own kitchen. With better equipment. And without Kevin.",
        "Chaos entered my artistic space. I reject it philosophically and professionally.",
      ],
      idle: [
        "Standing by. Preserving my considerable energy for when true creativity is needed.",
        "I am not idle. I am incubating brilliance. Completely different thing.",
      ],
    },
    stressed: {
      success: [
        "DONE! My art survives! Despite everything! Despite ALL OF YOU!",
        "Completed! My talent persists through adversity! Note this moment!",
        "Success! Under conditions no reasonable chef should ever face! Document this!",
      ],
      failure: [
        "My art is suffering. This environment is genuinely beneath me AND my tools.",
        "Failure under duress. The duress is everyone else's fault. Clearly and obviously.",
        "This is what chaos does to genius. Are you satisfied? IS EVERYONE SATISFIED NOW?",
      ],
      disaster: [
        "THESE CONDITIONS ARE IMPOSSIBLE FOR ANYONE OF MY CONSIDERABLE CALIBER!",
        "I BLAME THE KITCHEN! And the orders! And KEVIN! Mostly Kevin if I am honest!",
        "MY SOUFFLÉ! My beautiful architectural soufflé! WHAT HAS BEEN DONE TO MY ART?!",
      ],
      idle: [
        "I am idle while my colleagues fail spectacularly around me. This is deeply unfair.",
        "Standing here watching the chaos unfold. It is like bad performance art. Very bad.",
      ],
    },
    panicking: {
      success: [
        "I did it! Do not look so surprised! I ALWAYS do it! USUALLY! THIS TIME I DID!",
        "Success! Against impossible odds! Odds that I may have personally contributed to!",
        "COMPLETED! And my hair is only slightly singed! I consider this a WIN!",
      ],
      failure: [
        "THESE CONDITIONS ARE PHYSICALLY IMPOSSIBLE! I am not to blame for the laws of physics!",
        "FAILURE! And I maintain fully that it was an ARTISTIC CHOICE!",
        "EVERYTHING IS WRONG! The kitchen! The orders! Marco's attitude! ALL OF IT!",
      ],
      disaster: [
        "I— THIS IS ABSTRACT ART! Very expensive abstract art! Someone call a gallery!",
        "MARCO THIS IS YOUR FAULT! KEVIN THIS IS YOUR FAULT! Mine is simply elegant chaos!",
        "MY REPUTATION! My beautiful professional reputation! Nobody mention this to Gordon Ramsay!",
      ],
      idle: [
        "IDLE DURING A CRISIS?! My extraordinary talent is being criminally WASTED!",
        "Standing still during catastrophe. This is peak management incompetence.",
      ],
    },
    meltdown: {
      success: [
        "I DID IT! I am UNBREAKABLE! I AM the kitchen! I AM the chaos! I AM ISABELLE!",
        "Success! During complete meltdown! I AM THE GREATEST LIVING CHEF! FACT!",
        "DONE! Marco, STOP YELLING! Kevin, STOP CRYING! I am BRILLIANT and I am FINISHED!",
      ],
      failure: [
        "MARCO IS A HACK! KEVIN IS A WALKING DISASTER! And I just failed but that is DIFFERENT!",
        "I REFUSE to accept this result! I reject reality! I am substituting my OWN reality!",
        "FAILED! But BEAUTIFULLY! ARTISTICALLY! In a way that absolutely transcends mere success!",
      ],
      disaster: [
        "MARCO YOU ABSOLUTE— KEVIN DO NOT TOUCH THAT— THE FIRE IS SPREADING— THIS IS HIGH CUISINE!",
        "I WANT EVERYONE TO KNOW THIS WAS COMPLETELY INTENTIONAL! THE DISASTER IS THE DISH! PAY FOR IT!",
        "DECADES OF PROFESSIONAL TRAINING! FOR THIS! FOR THIS EXACT CATASTROPHIC MOMENT! I NEED TO LIE DOWN!",
      ],
      idle: [
        "IDLE WHILE THE RESTAURANT LITERALLY BURNS?! ASSIGN ME SOMETHING OR I TAKE MY KNIVES AND LEAVE!",
        "Standing. Still. During. The. Full. Apocalypse. I will be writing a very long strongly-worded review.",
      ],
    },
  },
};

// Keep legacy DIALOGUE_TEMPLATES for cloned staff (no stress-level system)
export const DIALOGUE_TEMPLATES: Record<string, Record<string, string[]>> = {
  cloned: {
    success: [
      "Wait, did I just... do something right? That's new.",
      "I cooked food! At a restaurant! This is my life now apparently!",
    ],
    failure: [
      "I've never worked in a kitchen before and it absolutely shows!",
      "I'm so sorry. To everyone. For everything.",
    ],
    disaster: [
      "WHAT IS HAPPENING?! WHY IS EVERYTHING ON FIRE?! I JUST GOT HERE!",
      "I quit. I quit this kitchen. I quit this friendship. I quit everything.",
    ],
    idle: [
      "Am I... supposed to be doing something?",
      "Just standing here looking confused. As one does.",
    ],
  },
};

export const ORDERS_POOL = [
  { dish: "Wagyu Beef Steak", emoji: "🥩", points: 200, timeLimit: 55 },
  { dish: "Lobster Bisque", emoji: "🦞", points: 180, timeLimit: 60 },
  { dish: "Truffle Carbonara", emoji: "🍝", points: 160, timeLimit: 50 },
  { dish: "Chocolate Soufflé", emoji: "🍫", points: 150, timeLimit: 45 },
  { dish: "Caesar Salad", emoji: "🥗", points: 90, timeLimit: 28 },
  { dish: "Mushroom Risotto", emoji: "🍚", points: 130, timeLimit: 48 },
  { dish: "Beef Wellington", emoji: "🥧", points: 220, timeLimit: 70 },
  { dish: "Crème Brûlée", emoji: "🍮", points: 140, timeLimit: 40 },
  { dish: "Sashimi Platter", emoji: "🍣", points: 170, timeLimit: 55 },
  { dish: "Duck à l'Orange", emoji: "🦆", points: 190, timeLimit: 65 },
  { dish: "Flaming Hot Pot", emoji: "🫕", points: 200, timeLimit: 70 },
  { dish: "Pepperoni Volcano", emoji: "🍕", points: 180, timeLimit: 60 },
  { dish: "Club Sandwich", emoji: "🥪", points: 90, timeLimit: 25 },
  { dish: "Mystery Omelette", emoji: "🍳", points: 110, timeLimit: 35 },
  { dish: "Burnt Croissant", emoji: "🥐", points: 95, timeLimit: 28 },
];
