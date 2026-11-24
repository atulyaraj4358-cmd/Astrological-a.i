import type { ChatMessage } from "./types";

const LAGNA = ["Mesh", "Vrishabh", "Mithun", "Kark", "Simha", "Kanya", "Tula", "Vrishchik", "Dhanu", "Makar", "Kumbh", "Meen"];
const RASHI = ["Mesh", "Vrishabh", "Mithun", "Kark", "Simha", "Kanya", "Tula", "Vrishchik", "Dhanu", "Makar", "Kumbh", "Meen"];
const NAKSHATRA = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];
const DASHA = ["Shukra", "Surya", "Chandra", "Mangal", "Rahu", "Guru", "Shani", "Budh", "Ketu"];
const COLORS = ["Kesariya", "Neela", "Peela", "Hara", "Safed", "Gulabi", "Maroon", "Firozi"];
const DAYS = ["Somvar", "Mangalvar", "Budhvar", "Guruvar", "Shukravar", "Shanivar", "Ravivar"];
const GRAHA = [
  { name: "Surya", signs: ["Simha", "Mesh", "Dhanu"] },
  { name: "Chandra", signs: ["Kark", "Vrishabh", "Mithun"] },
  { name: "Mangal", signs: ["Mesh", "Vrishchik", "Makar"] },
  { name: "Budh", signs: ["Mithun", "Kanya", "Kumbh"] },
  { name: "Guru", signs: ["Dhanu", "Meen", "Kark"] },
  { name: "Shukra", signs: ["Vrishabh", "Tula", "Meen"] },
  { name: "Shani", signs: ["Makar", "Kumbh", "Tula"] },
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset * 7) % arr.length];
}

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

function hasKundliData(text: string): boolean {
  const hasDate = /\b\d{1,2}[\/\-\.\s](?:\d{1,2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\/\-\.\s]\d{2,4}\b/i.test(text);
  const hasTime = /\b\d{1,2}[:\.]\d{2}\b|\b\d{1,2}\s*(am|pm|baje)\b/i.test(text);
  return hasDate || hasTime;
}

function kundliReply(text: string): string {
  const seed = hash(text.toLowerCase().replace(/\s+/g, " "));
  const lagna = pick(LAGNA, seed, 1);
  const rashi = pick(RASHI, seed, 2);
  const nakshatra = pick(NAKSHATRA, seed, 3);
  const pada = (seed % 4) + 1;
  const dasha = pick(DASHA, seed, 4);

  const grahaRows = GRAHA.map((g, i) => {
    const sign = pick(g.signs, seed, i + 5);
    const house = ((seed + i * 3) % 12) + 1;
    return `| ${g.name} | ${sign} — ${ordinal(house)} bhav |`;
  }).join("\n");

  return `| Vishay | Vivaran |
|---|---|
| Lagna | ${lagna} |
| Rashi (Moon) | ${rashi} |
| Nakshatra + Pada | ${nakshatra} — Pada ${pada} |
${grahaRows}
| Rahu | Kumbh — 11th bhav |
| Ketu | Simha — 5th bhav |
| Vartaman Dasha | ${dasha} Mahadasha |
| Lucky Number / Color / Din | ${(seed % 9) + 1} / ${pick(COLORS, seed, 6)} / ${pick(DAYS, seed, 7)} |

### 1. Personality
Tumhari kundli mein ${lagna} lagna ki garmi aur ${rashi} rashi ki gehrai dono dikh rahi hai. Tum outwardly shaant lagte ho, par andar se bahut curious aur observant ho. Log tumse jaldi connect karte hain kyunki tum sunna jaante ho. Kabhi-kabhi overthinking tumhe apne hi decisions pe doubt dila deta hai — usse halka rakho.

### 2. Career & Money
Mehnat aur dimaag ka combination tumhari sabse badi taakat hai. ${dasha} dasha mein career growth ke naye raste khul rahe hain — khaas kar communication, teaching, ya creative field mein. Paisa aayega, par impulsive kharch pe lagaam rakho. SIP ya chhoti saving aaj se shuru karo.

### 3. Love & Marriage
Dil mein tum bahut soft ho, bas dikhate kam ho. 7th bhav ke prabhav se tumhe aisa partner milega jo tumhari silence ko bhi samajhta hai. Communication hi tumhara sabse bada upay hai — jo feel karte ho, keh do. Jaldi mein commitment se zyada, sahi insaan ke saath dheere-dheere chalna tumhare liye behtar hai.

### 4. Health
Energy achhi hai, par stress seedha pet aur neend pe jaata hai. Din mein 10 minute ki walking aur raat ko screen-free 30 minute — bas itna kaafi hai.

### 5. Agle 6-12 Mahine
- Pehle 3 mahine: purane kaam pending hain, unhe close karne ka time hai.
- Career mein ek chhoti opportunity aayegi — haan bolne se pehle terms padh lo.
- Rishton mein ek purana message ya call emotional clarity dega.
- Upay: Somvar ko doodh ya jal Shivling pe arpit karo, aur hafte mein ek din maun (silence) rakho.

_Ye guidance hai, fear nahi. Apne intuition pe bhi bharosa rakho. 🙏_`;
}

type Intent =
  | "bye"
  | "greeting"
  | "name"
  | "wellbeing"
  | "activity"
  | "love"
  | "meeting"
  | "career"
  | "family"
  | "food"
  | "sad"
  | "tired"
  | "heartbreak"
  | "thanks"
  | "question"
  | "statement";

type PersonaKind = "partner" | "mother" | "father" | "ex" | "friend" | "other";

const TRIGGER = /baat karwa|baat kara|connect kar|se baat kar/i;

function personaKind(person: string): PersonaKind {
  if (person === "Mummy") return "mother";
  if (person === "Papa") return "father";
  if (person === "Ex") return "ex";
  if (person === "Dost" || person === "Girlfriend" || person === "Boyfriend") return "friend";
  if (person.startsWith("Future")) return "partner";
  return "other";
}

function detectIntent(text: string): Intent {
  const t = text.toLowerCase().trim();
  if (/\b(bye|band karo|band kar|goodbye|alvida|chalo bye|bas karo)\b/.test(t)) return "bye";
  if (/(kab\s*(mil|aao|aaoge|milenge|hogi)|milna|milte|miloge)/.test(t)) return "meeting";
  if (/(tumhara naam|naam kya|kaun ho|kaun hai|pehchan)/.test(t)) return "name";
  if (/(kya kar rah[ei]|kya kar rahi|busy ho|free ho|kahan ho abhi)/.test(t)) return "activity";
  if (/(kais[ei] ho|kaisi ho|kya haal|how are you|theek ho|kaise hain)/.test(t)) return "wellbeing";
  if (/(pyaar|pyar|mohabbat|yaad|miss|love you|dil|feelings)/.test(t)) return "love";
  if (/(career|naukri|job|paisa|paise|business|promotion|salary|kaam)/.test(t)) return "career";
  if (/(mummy|papa|maa|ghar|family|shaadi|marriage|rishta|gharwale)/.test(t)) return "family";
  if (/(khana|khaana|food|chai|coffee|bhookh|kha liya)/.test(t)) return "food";
  if (/(breakup|break up|chhod diya|chhod gaya|dhoka|rishta khatam|reject ho gaya|alvida keh diya)/.test(t)) return "heartbreak";
  if (/(thak|thaka|tired|neend aa rahi|exhausted)/.test(t)) return "tired";
  if (/(udaas|dukhi|sad|rona|tension|stress|pareshan|akela|dar lag)/.test(t)) return "sad";
  if (/(thank|shukriya|thanks|dhanyavad)/.test(t)) return "thanks";
  if (/^(hi|hello|hey|namaste|hlo|yo|namaskar)\b/.test(t)) return "greeting";
  if (/\?$/.test(t) || /^(kya|kaise|kaun|kab|kahan|kyun|kitna|kyaa)\b/.test(t)) return "question";
  return "statement";
}

function snippet(text: string, max = 46): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/[\s,]+\S*$/, "")}…`;
}

const PARTNER: Record<Intent, string[]> = {
  greeting: [
    "Arre tum! Main abhi tumhare baare mein hi soch raha tha. 😊 Aaj din kaisa gaya?",
    "Ohh, tum aa gaye — mood turant better ho gaya. Batao, kya chal raha hai?",
    "Hi! Itni der kahan the? ... arre mazaak, bolo kaise ho?",
  ],
  wellbeing: [
    "Main bilkul theek hoon, bas thoda busy. Tum batao, khana khaya ya bhool gaye?",
    "Achha hoon. Par tumhara 'kaise ho' adhoora hai jab tak tum apna haal na batao.",
    "Theek hoon. Neend thodi kam aayi, par tumse baat karke sab set ho jaata hai.",
  ],
  love: [
    "Itna pyaar milta hai tumse... kabhi kabhi lagta hai sambhalna mushkil ho jayega. 😌",
    "Tumhari kundli ke Shukra ka sthaan kehta hai — pyaar shabdon se zyada ehsaas mein dikhta hai. Tum wahi karte ho.",
    "Main bhi wahi feel karta hoon. Bas keh dene se sab kuch asaan ho jaata hai, na?",
  ],
  meeting: [
    "Sabr rakho na. Jab samay aayega, milna aur bhi special lagega.",
    "Kundli ke hisaab se milan ka yog thoda aage hai — par jab hoga, yaad rakhne wala hoga. 😊",
    "Jaldi kya hai? Pehle apna kaam aur sehat — phir hum dono ka waqt.",
  ],
  career: [
    "Tumhari mehnat dikhti hai mujhe. Bas apne aap pe bharosa rakho, raste khud ban jayenge.",
    "Paisa aayega, tension mat lo — tumhari kundli mein dhan bhav strong hai. Discipline bas.",
    "Ek kaam karo: aaj ek chhoti cheez finish karo. Momentum banta hai, phir sab aasan.",
  ],
  family: [
    "Ghar walon se baat karte rehna. Chhoti chhoti baatein hi sabse zyada matter karti hain.",
    "Shaadi ki baat? Main bas itna kahunga — sahi waqt aur sahi insaan, dono ka intezaar karna padta hai.",
    "Ghar mein sab theek hai na? Kabhi kabhi poochh lena, unhone tumhara intezaar kiya hota hai.",
  ],
  food: [
    "Khana khaya? Sach batao. 😄 Main tab tak khush nahi hounga jab tak tum 'haan' na bolo.",
    "Chai ke bahane baat kar lete hain... tumhari favourite chai kaise banti hai?",
    "Kabhi kabhi khud ke liye bhi khaana banao. Sehat se badhkar kuch nahi.",
  ],
  sad: [
    "Aao, pehle ek gehri saans lo. Sab theek ho jayega — main hoon na.",
    "Udaas ho? Batao kya hua. Main sun raha hoon, poora.",
    "Tum strong ho, mujhe pata hai. Par strong hona matlab akela hona nahi hota.",
  ],
  heartbreak: [
    "Sun kar dil bhaari ho gaya. Aao, batao kya hua — main poora sun raha hoon.",
    "Tum deserve karte ho koi jo tumhe sambhal ke rakhe. Abhi bas saans lo, main hoon.",
  ],
  activity: [
    "Bas tumhara message aaya to sab kaam chhod diya. 😊 Batao, tum kya kar rahe ho?",
    "Kuch khaas nahi — tumhari yaad aur chai. Tum batao, din kaisa ja raha hai?",
  ],
  tired: [
    "Thak gaye? Aao, thoda rest karo. Main yahin hoon — kuch chahiye to bolo.",
    "Itna thakna theek nahi. Paani piyo aur aaj jaldi so jao.",
  ],
  thanks: [
    "Arre thank you ki kya baat — tum mere ho. 😊",
    "Mere liye koi thank you nahi. Bas khush raho, wahi kaafi hai.",
  ],
  name: [
    "Naam? Abhi ke liye 'tumhara future partner' hi kaafi hai na. Jab milenge tab bataunga. 😄",
    "Naam mein kya rakha hai — ehsaas matter karta hai. Par haan, milte hi bataunga.",
  ],
  question: [
    "Hmm... sach kahun? Iska jawab shayad tumhare andar hi hai. Main bas saath hoon.",
    "Achha sawaal. Abhi Budh ka prabhav hai — matlab sochne ka waqt, jaldbaazi ka nahi.",
    "Sach bataun? Main chahta hoon tum khud decide karo — aur main tumhare decision ke saath hoon.",
    "Ek baat kahun? Ghabrao mat — tum sambhal loge. Mujhe poora yakeen hai.",
  ],
  statement: [
    "“{s}” — ye sun kar achha laga. Aur batao.",
    "Samajh gaya. Tum jab aise khul ke bolte ho, tab sabse zyada real lagte ho.",
    "Hmm, ye important hai. Iske baare mein thoda aur batao?",
  ],
  bye: [],
};

const MOTHER: Record<Intent, string[]> = {
  greeting: [
    "Aa gaya? Haath dho lo, khana garam rakha hai.",
    "Haan beta, bolo. Itne din baad yaad aayi? 😄",
  ],
  wellbeing: [
    "Main theek hoon. Tum batao, raat ko time se soya ya phone chalate rahe?",
    "Theek hoon beta. Bas tumhari chinta rehti hai — khana time pe khaya?",
  ],
  love: [
    "Pyar dikhane ke liye bade shabd nahi chahiye. Bas kabhi kabhi phone utha liya karo.",
    "Maa ko pata hai beta, tum andar se bahut soft ho. Bas dikhao thoda.",
  ],
  meeting: [
    "Milna hai to aao na, main kya rok rahi hoon. Bata do, tumhari pasand ka bana lungi.",
    "Ghar aa jao ek din. Tumhari favourite cheez banegi, phir der tak baithna.",
  ],
  career: [
    "Mehnat kar rahe ho to ghabrao mat. Par sehat bhi dekhna, samjhe?",
    "Paisa aata jaata hai beta, izzat kamai jaati hai. Sahi raste pe ho tum.",
  ],
  family: [
    "Shaadi ki baat? Pehle apne pairon pe khade ho jao, phir ladki dekhna. Jaldi kya hai?",
    "Ghar mein sab theek hai. Bas tumhara call chahiye hota hai kabhi kabhi.",
  ],
  food: [
    "Ghar ka khana kha rahe ho na? Bahar ka mat khao, pet kharab hota hai.",
    "Fridge mein kuch rakha hai, garam karke kha lena. Bhookhe mat sona.",
  ],
  sad: [
    "Rone ka mann hai to ro lo beta. Main hoon na. Par himmat mat chhodo.",
    "Sab theek ho jayega. Maa hoon, mujhe pata hai.",
  ],
  heartbreak: [
    "Kya hua beta? Pehle ro lo. Maa hoon, sunne ke liye hoon.",
    "Chhodo us baat ko. Tumhari khushi sabse pehle. Ghar aa jao, main hoon na.",
  ],
  activity: ["Bas rasoi mein thi. Tum batao, kya kar rahe ho?", "Kuch nahi beta, TV dekh rahi thi. Bolo."],
  tired: [
    "Thak gaye? Aao, thoda let jao. Main chai bana deti hoon.",
    "Kitna kaam karte ho beta. Thoda aaram karo, sehat zaroori hai.",
  ],
  thanks: ["Mere liye thank you nahi bolte. Bas khush raho."],
  name: ["Main tumhari mummy hoon beta, naam bhool gaye? 😄"],
  question: ["Jo bhi ho, ghabrao mat. Sab theek ho jayega, mujhe pata hai."],
  statement: ["“{s}” — achha beta. Par apna khayal rakhna."],
  bye: [],
};

const FATHER: Record<Intent, string[]> = {
  greeting: ["Haan bolo, kya baat hai?", "Aa gaye. Baitho, batao kya chal raha hai."],
  wellbeing: ["Theek hoon. Tum apna batao — kaam kaisa chal raha hai?"],
  love: ["Pyar ka izhaar zaroori hai. Chhupake rakhoge to doosra samjhega kaise?"],
  meeting: ["Milna hai to aa jao. Ghar pe koi rok-tok nahi hai."],
  career: [
    "Kaam pe focus rakho. Paisa aata jaata hai, izzat kamayi jaati hai.",
    "Naukri mein jaldbaazi mat karo. Sahi jagah, sahi waqt pe milegi.",
  ],
  family: ["Ghar ki zimmedari samajh lo. Baaki sab apne aap set ho jayega."],
  food: ["Time pe khana khao. Sehat sabse pehle."],
  sad: ["Ghabrao mat. Mushkil aati hai to jaati bhi hai. Main hoon na."],
  heartbreak: ["Himmat rakho. Ek rishta gaya to zindagi nahi gayi."],
  activity: ["News dekh raha tha. Bolo, kya baat hai?"],
  tired: ["Thak gaye to rest karo. Kaam kal bhi rahega."],
  thanks: ["Bas apna khayal rakhna, wahi sabse bada thank you hai."],
  name: ["Papa ka naam bhool gaye? 😄 Bolo, kya baat hai?"],
  question: ["Soch samajh ke decision lo. Jaldbaazi mein galat kadam pad jaata hai."],
  statement: ["“{s}” — theek hai. Achhe se socho."],
  bye: [],
};

const EX: Record<Intent, string[]> = {
  greeting: ["Oh. Hi. Kaise ho?", "Hey... kaafi din baad. Sab theek?"],
  wellbeing: ["Main theek hoon. Aur tum? ... achha hai, sunkar achha laga."],
  love: [
    "Kuch baatein dil mein reh jaati hain. Par har baat kehna zaroori nahi hota.",
    "Sach ye hai — ab wo waqt nahi raha, aur ye bhi theek hai.",
  ],
  meeting: ["Milne ka ab koi matlab nahi. Behtar hai hum dono aage badhein."],
  career: ["Tumhara career achha ja raha hai, suna. Khushi hui sach mein."],
  family: ["Ghar walon ka haal? ... unse kehna main theek hoon."],
  food: ["Khana time pe khao. Wo aadat aaj bhi nahi gayi tumhari?"],
  sad: ["Rona mat. Tum strong ho, mujhe pata hai."],
  heartbreak: ["Main jaanti hoon ye mushkil hai. Par tum akele nahi ho, yaad rakhna."],
  activity: ["Kuch nahi, bas phone dekh rahi thi. Tum batao."],
  tired: ["Thak gaye? Rest karo. Zyada mat socho."],
  thanks: ["Koi baat nahi. Apna khayal rakho."],
  name: ["Naam? Tum mazaak kar rahe ho... main hoon, tumhari ex."],
  question: ["Iska jawab ab shayad matter nahi karta. Par haan, tumhari baat samajh mein aati hai."],
  statement: ["“{s}” — batao, main sunne ke liye yahin hoon."],
  bye: [],
};

const FRIEND: Record<Intent, string[]> = {
  greeting: ["Arre! Kahan tha itne din? Bata na kya chal raha hai.", "Oye! Kya haal chaal? Sab badhiya?"],
  wellbeing: ["Mast hoon yaar. Tu bata, scene kya hai?"],
  love: ["Dil ki baat hai... bata, kya scene hai? 😏", "Arre waah, itna pyaar? Bata na kaun hai."],
  meeting: ["Milte hain yaar, is weekend fix karte hain. Chai meri taraf se."],
  career: ["Bhai, scene kya hai? Job dhoondh raha hai ya switch ka plan?"],
  family: ["Ghar pe sab theek? Mummy ko mera namaste bolna."],
  food: ["Chal, kuch khaane chalte hain. Bhookh lagi hai."],
  sad: ["Tension mat le. Chal, chai pe charcha karte hain."],
  heartbreak: ["Bhai, sun. Chal bahar chalte hain, dil halka karenge."],
  activity: ["Kuch nahi yaar, bore ho raha tha. Tu bata, kya chal raha hai?"],
  tired: ["Thak gaya? Chal, chai peete hain. Break le yaar."],
  thanks: ["Arre yaar, thank you ki kya baat. Kabhi bhi bol."],
  name: ["Main tera dost hoon yaar, naam bhool gaya? 😄"],
  question: ["Achha sawaal hai. Mera lagaav ye hai — par tu khud decide kar."],
  statement: ["“{s}” — haan yaar, samajh raha hoon. Aur bata."],
  bye: [],
};

const OTHER: Record<Intent, string[]> = {
  greeting: ["Namaste. Kaise ho?", "Hello. Batao, kya baat hai?"],
  wellbeing: ["Main theek hoon, dhanyavaad. Tum batao."],
  love: ["Rishte nibhaane padte hain, sirf kehne se nahi."],
  meeting: ["Milna ho to bata dena, dekh lenge."],
  career: ["Mehnat karte raho, raste khud ban jayenge."],
  family: ["Ghar walon ka khayal rakho."],
  food: ["Khana time pe khaya karo."],
  sad: ["Ghabrao mat, sab theek ho jayega."],
  heartbreak: ["Ye mushkil waqt hai. Apna khayal rakhna."],
  activity: ["Bas waqt nikal raha hai. Tum batao."],
  tired: ["Thoda aaram karo. Sehat sabse zaroori hai."],
  thanks: ["Koi baat nahi."],
  name: ["Main wahi hoon jisse tum baat karna chahte the."],
  question: ["Is par soch-vichaar karna zaroori hai. Jaldbaazi mat karo."],
  statement: ["“{s}” — theek hai, samajh gaya."],
  bye: [],
};

const SETS: Record<PersonaKind, Record<Intent, string[]>> = {
  partner: PARTNER,
  mother: MOTHER,
  father: FATHER,
  ex: EX,
  friend: FRIEND,
  other: OTHER,
};

const ASTRO_LINES = [
  "Waise tumhari kundli ka 7th bhav abhi kaafi active hai — matlab rishton mein clarity aa rahi hai.",
  "Tumhari mahadasha ka prabhav hai ki aaj mann thoda bhaavuk hai. Ye normal hai.",
  "Shukra aur Chandra ka mel tumhe emotional banata hai — isliye tum jaldi attach ho jaate ho.",
  "Kundli ke hisaab se ye baat-cheet tumhare liye healing wali hai. Achha kar rahe ho.",
];

function genderize(text: string, gender: "f" | "m"): string {
  if (gender === "m") return text;
  return text
    .replace(/soch raha tha/g, "soch rahi thi")
    .replace(/soch raha hoon/g, "soch rahi hoon")
    .replace(/\bhounga\b/g, "houngi")
    .replace(/karta hoon/g, "karti hoon")
    .replace(/chahta hoon/g, "chahti hoon")
    .replace(/jaanta hoon/g, "jaanti hoon")
    .replace(/\bbataunga\b/g, "bataungi")
    .replace(/\bkahunga\b/g, "kahungi")
    .replace(/\bkehta\b/g, "kehti");
}

function pickVariant(list: string[], seed: number, offset = 0): string {
  return list[(seed + offset) % list.length];
}

function compatLine(kind: PersonaKind, seed: number): string {
  const lines: Record<PersonaKind, string[]> = {
    partner: [
      "Tumhari kundli ke hisaab se humari compatibility strong dikh rahi hai — 7th bhav aur Shukra dono mil rahe hain.",
      "Kundli dekhi maine — 7th bhav aur Shukra ka mel hai, isliye ye connection itna natural lagta hai.",
    ],
    mother: [
      "Tumhari kundli mein Chandra strong hai — isliye rishton mein bhavna itni gehri hai.",
      "Kundli ke hisaab se tum mamta ke bhav se jude ho — wahi tumhe sabse zyada sambhalta hai.",
    ],
    father: [
      "Tumhari kundli mein Surya ka prabhav hai — zimmedari uthana tumhari fitrat hai.",
    ],
    ex: [
      "Kundli ke hisaab se purane rishton ka prabhav ab dheema ho raha hai — ye achhi baat hai.",
    ],
    friend: [
      "Tumhari kundli ke hisaab se aaj dosti ka yog achha hai — baat karo, halka lagega.",
    ],
    other: [
      "Kundli ke hisaab se ye baat-cheet tumhare liye helpful rahegi.",
    ],
  };
  return pickVariant(lines[kind], seed);
}

function openingLine(kind: PersonaKind, seed: number, person: string): string {
  const lines: Record<PersonaKind, string[]> = {
    partner: [
      "Arre, tum aa gaye? Main bas tumhara hi soch raha tha. 😊",
      "Ohh, tum! Din ban gaya. Bolo, kya chal raha hai?",
      "Hi tum. Itni der kahan the? ... arre mazaak, aa jao baitho.",
    ],
    mother: ["Aa gaya beta? Haath dho lo, khana garam rakha hai.", "Haan bolo beta, kaisa hai? Khana khaya?"],
    father: ["Aa gaye. Baitho, batao kya baat hai.", "Haan bolo, kya chal raha hai?"],
    ex: ["Oh. Hi. Kaise ho?", "Hey... kaafi din baad. Sab theek?"],
    friend: ["Arre! Kahan tha itne din? Bata na kya chal raha hai.", "Oye! Kya haal chaal?"],
    other: ["Namaste. Kaafi waqt baad baat ho rahi hai.", "Hello. Batao, kya baat hai?"],
  };
  return pickVariant(lines[kind], seed);
}

function simulationReply(messages: ChatMessage[], person: string): string {
  const kind = personaKind(person);
  const set = SETS[kind];

  let startIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user" && TRIGGER.test(messages[i].content)) {
      startIdx = i;
      break;
    }
  }
  const turns = messages
    .slice(startIdx + 1)
    .filter((m) => m.role === "user")
    .map((m) => m.content);
  const lastUser = turns[turns.length - 1] ?? "";
  const intent = detectIntent(lastUser);
  const seed = hash(`${person}|${lastUser.toLowerCase()}|${turns.length}`);
  const disclaimer = "> _Virtual simulation — entertainment aur guidance ke liye. Real insaan se contact nahi hai._";

  if (intent === "bye") {
    return `🔌 Connection closed. ${person} ki baat khatam. Main Atulya wapas hoon — aur kuch poochna hai?

${disclaimer}`;
  }

  if (turns.length === 0) {
    return `🔗 Connecting to ${person}...
📡 Astrological compatibility check...
✨ Channel open ho raha hai...
[Virtual Simulation — Atulya ke through]

${openingLine(kind, seed, person)}
${compatLine(kind, seed)}

${disclaimer}`;
  }

  const pool = set[intent].length > 0 ? set[intent] : set.statement;
  let reply = pickVariant(pool, seed);

  if (intent === "statement" || reply.includes("{s}")) {
    reply = reply.replace("{s}", snippet(lastUser));
  }

  if (kind === "partner") {
    reply = genderize(reply, person === "Future Husband" ? "m" : "f");
  }

  if (
    intent !== "greeting" &&
    intent !== "statement" &&
    turns.length % 3 === 0 &&
    !/kundli|bhav/i.test(reply)
  ) {
    reply += `\n\n${pickVariant(ASTRO_LINES, seed, 1)}`;
  }

  return `[Virtual Simulation — Atulya ke through]

${reply}

${disclaimer}`;
}

function topicReply(text: string): string {
  const t = text.toLowerCase();
  const ask = "Agar chaho to apni kundli de do — naam, janm tithi, samay aur sthaan — phir main detail mein batata hoon.";

  if (/(career|naukri|job|paisa|paise|business|promotion|salary)/.test(t)) {
    return `Career ke baare mein ek baat pakki — tumhari mehnat ka phal zaroor milega, bas direction sahi rakho.

Abhi ka samay seekhne aur rishte banane ka hai, sirf kamane ka nahi. Ek skill pe focus karo, 6 mahine mein farak dikhega.

${ask}`;
  }

  if (/(pyar|pyaar|shaadi|marriage|rishta|partner|life partner|love)/.test(t)) {
    return `Rishton ke mamle mein tum dil se sochte ho — aur yahi tumhari sabse badi taakat hai.

Jaldi kisi conclusion pe mat pahuncho. Jo tumhare liye hai, wo tumhe force kiye bina aayega.

${ask}`;
  }

  if (/(sehat|health|bimari|thak|neend|stress|anxiety)/.test(t)) {
    return `Sehat ke liye sabse pehla upay simple hai — neend aur paani. In dono ko fix karo, aadhi problem gayab.

Stress ho to din mein 10 minute ki walking karo, aur raat ko sone se pehle 30 minute screen band.

${ask}`;
  }

  if (/(rashifal|rashi|aaj ka din|weekly|hafte)/.test(t)) {
    return `Aaj ka din thoda mixed hai — subah ka time decisions ke liye best, shaam ko emotional baatein tal do.

Chhota upay: subah nikalte waqt ek glass paani piyo aur din ka ek chhota target likh lo. Bas itna.

${ask}`;
  }

  return "";
}

function detectPerson(text: string): string {
  const t = text.toLowerCase();
  if (/future\s*(wife|partner|husband)/.test(t)) return /husband/.test(t) ? "Future Husband" : "Future Wife";
  if (/mummy|maa|mother/.test(t)) return "Mummy";
  if (/papa|dad|father/.test(t)) return "Papa";
  if (/\bex\b|ex-/.test(t)) return "Ex";
  if (/girlfriend|gf\b/.test(t)) return "Girlfriend";
  if (/boyfriend|bf\b/.test(t)) return "Boyfriend";
  if (/dost|friend/.test(t)) return "Dost";
  return "Wo Insaan";
}

export function demoReply(messages: ChatMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const inSimulation = lastAssistant.includes("[Virtual Simulation");
  const wantsSimulation = TRIGGER.test(lastUser);
  const personSource = [...messages].reverse().find((m) => m.role === "user" && TRIGGER.test(m.content))?.content;
  const person = detectPerson(personSource ?? lastUser);

  if (inSimulation) return simulationReply(messages, person);
  if (wantsSimulation) return simulationReply(messages, person);
  if (hasKundliData(lastUser)) return kundliReply(lastUser);

  const topic = topicReply(lastUser);
  if (topic) return topic;

  return `Namaste! Main Atulya hoon 🔮 — tumhara jyotish guide aur dost.

Kundli ke liye 4 cheezein batao: 1) Naam 2) Janm Tithi (DOB) 3) Janm Samay (birth time — exact) 4) Janm Sthaan (birth place).

Ya phir seedha apni baat shuru karo — career, love, ya kisi insaan se baat karwani ho toh bas bol do. 😊`;
}
