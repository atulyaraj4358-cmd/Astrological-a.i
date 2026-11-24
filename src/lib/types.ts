export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id?: string;
  role: ChatRole;
  content: string;
};

export type KundliDetails = {
  name: string;
  dob: string;
  time: string;
  place: string;
};

export function formatKundliMessage(d: KundliDetails): string {
  return [
    "Meri kundli dekh lo:",
    `1) Naam: ${d.name || "—"}`,
    `2) Janm Tithi: ${d.dob || "—"}`,
    `3) Janm Samay: ${d.time || "pata nahi"}`,
    `4) Janm Sthaan: ${d.place || "—"}`,
  ].join("\n");
}
