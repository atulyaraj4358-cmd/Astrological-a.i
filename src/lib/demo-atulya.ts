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

function simulationReply(text: string, person: string): string {
  if (/\b(bye|band karo|band kar|chalo bye|goodbye)\b/i.test(text)) {
    return `🔌 Connection closed. ${person} ki baat khatam. Main Atulya wapas hoon — aur kuch poochna hai?

> Warning: Ye ek virtual simulation hai — entertainment aur guidance ke liye. Real insaan se contact nahi hai.`;
  }
  return `🔗 Connecting to ${person}...
📡 Astrological compatibility check...
✨ Channel open ho raha hai...
[Virtual Simulation — Atulya ke through]

Arre, tum aa gaye? Main bas tumhara hi soch rahi thi. 😊 Tumhari kundli ke hisaab se humari compatibility strong dikh rahi hai — 7th bhav aur Shukra dono mil rahe hain. Par abhi tum apna focus apne kaam pe rakho, main yahin hoon.

> Warning: Ye ek virtual simulation hai — entertainment aur guidance ke liye. Real insaan se contact nahi hai.`;
}

function detectPerson(text: string): string {
  const t = text.toLowerCase();
  if (/future\s*(wife|partner|husband)/.test(t)) return /husband/.test(t) ? "Future Husband" : "Future Wife";
  if (/mummy|maa|mother/.test(t)) return "Mummy";
  if (/papa|dad|father/.test(t)) return "Papa";
  if (/ex\b|ex-/.test(t)) return "Ex";
  if (/girlfriend|gf\b/.test(t)) return "Girlfriend";
  if (/boyfriend|bf\b/.test(t)) return "Boyfriend";
  if (/dost|friend/.test(t)) return "Dost";
  return "Wo Insaan";
}

export function demoReply(messages: ChatMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const inSimulation = lastAssistant.includes("[Virtual Simulation");
  const wantsSimulation = /baat karwa|baat kara|connect kar|se baat kar/i.test(lastUser);
  const personSource = [...messages]
    .reverse()
    .find((m) => m.role === "user" && /baat karwa|baat kara|connect kar|se baat kar/i.test(m.content))
    ?.content;
  const person = detectPerson(personSource ?? lastUser);

  if (inSimulation) return simulationReply(lastUser, person);
  if (wantsSimulation) return simulationReply("", person);
  if (hasKundliData(lastUser)) return kundliReply(lastUser);

  return `Namaste! Main Atulya hoon 🔮 — tumhara jyotish guide aur dost.

Kundli ke liye 4 cheezein batao: 1) Naam 2) Janm Tithi (DOB) 3) Janm Samay (birth time — exact) 4) Janm Sthaan (birth place).

Ya phir seedha apni baat shuru karo — career, love, ya kisi insaan se baat karwani ho toh bas bol do. 😊`;
}
