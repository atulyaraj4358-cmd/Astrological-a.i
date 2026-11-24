"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, MoonStar, RotateCcw, Send, Sparkles, Square, Star, User2, Wand2 } from "lucide-react";
import { AtulyaMarkdown } from "./atulya-markdown";
import { KundliDialog } from "./kundli-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ATULYA_GREETING } from "@/lib/atulya-prompt";
import { formatKundliMessage, type ChatMessage, type KundliDetails } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STORAGE_KEY = "atulya-chat-v2";
const DRAFT_KEY = "atulya-draft-v2";

const QUICK_PROMPTS = [
  { label: "Future partner se baat karwao", icon: Wand2 },
  { label: "Career aur paisa kaisa rahega?", icon: Star },
  { label: "Mera aaj ka rashifal batao", icon: MoonStar },
];

type StoredState = {
  messages: ChatMessage[];
  kundli: KundliDetails | null;
};

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatApp() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: newId(), role: "assistant", content: ATULYA_GREETING },
  ]);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const [kundli, setKundli] = useState<KundliDetails | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"live" | "demo" | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  const commit = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      const next =
        typeof updater === "function"
          ? (updater as (prev: ChatMessage[]) => ChatMessage[])(messagesRef.current)
          : updater;
      messagesRef.current = next;
      setMessages(next);
    },
    [],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredState;
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          messagesRef.current = parsed.messages;
          setMessages(parsed.messages);
        }
        if (parsed.kundli) setKundli(parsed.kundli);
      }
      const savedDraft = sessionStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        setDraft(savedDraft);
        if (textareaRef.current) textareaRef.current.value = savedDraft;
      }
    } catch {
      // ignore corrupted storage
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages, kundli } satisfies StoredState),
      );
    } catch {
      // storage may be full or blocked
    }
  }, [messages, kundli, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (draft) sessionStorage.setItem(DRAFT_KEY, draft);
      else sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  }, [draft, mounted]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  const setComposerText = useCallback(
    (value: string) => {
      setDraft(value);
      const el = textareaRef.current;
      if (el && el.value !== value) el.value = value;
      resizeTextarea();
    },
    [resizeTextarea],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    setStreaming(false);
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) {
        toast.message("Kuch likho toh sahi 😄");
        textareaRef.current?.focus();
        return;
      }
      if (busyRef.current) return;

      busyRef.current = true;
      setStreaming(true);

      const userMsg: ChatMessage = { id: newId(), role: "user", content: text };
      const assistantId = newId();
      const history = [...messagesRef.current, userMsg];

      commit([...history, { id: assistantId, role: "assistant", content: "" }]);
      setComposerText("");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
          signal: controller.signal,
        });

        const resMode = res.headers.get("X-Atulya-Mode");
        setMode(resMode === "live" ? "live" : "demo");

        if (!res.ok || !res.body) {
          throw new Error("Atulya se connection nahi bana");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          const snapshot = acc;
          commit((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: snapshot } : m)),
          );
        }

        if (!acc.trim()) {
          commit((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: "Kuch gadbad ho gayi. Ek baar phir bhejo? 🙏" }
                : m,
            ),
          );
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          commit((prev) =>
            prev.map((m) =>
              m.id === assistantId && !m.content
                ? { ...m, content: "_Ruk gaya. Jab chaho, phir se poochho._" }
                : m,
            ),
          );
        } else {
          toast.error("Atulya abhi connect nahi ho paya. Thodi der baad try karo.");
          commit((prev) =>
            prev.map((m) =>
              m.id === assistantId && !m.content
                ? { ...m, content: "Network ki dikkat lag rahi hai. Ek baar phir bhejo? 🙏" }
                : m,
            ),
          );
          setComposerText(text);
        }
      } finally {
        abortRef.current = null;
        busyRef.current = false;
        setStreaming(false);
        textareaRef.current?.focus();
      }
    },
    [commit, setComposerText],
  );

  const handleKundliSubmit = (details: KundliDetails) => {
    setKundli(details);
    setDialogOpen(false);
    void send(formatKundliMessage(details));
  };

  const reset = () => {
    stop();
    commit([{ id: newId(), role: "assistant", content: ATULYA_GREETING }]);
    setKundli(null);
    setMode(null);
    setComposerText("");
    toast.success("Nayi shuruaat. 🔮");
  };

  const copy = async (m: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopiedId(m.id ?? null);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error("Copy nahi ho paya");
    }
  };

  const lastAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant"),
    [messages],
  );
  const inSimulation = lastAssistant?.content.includes("[Virtual Simulation") ?? false;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#0a0614] text-violet-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -left-32 h-[360px] w-[360px] rounded-full bg-violet-600/15 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.35) 0.6px, transparent 1px), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.25) 0.6px, transparent 1px), radial-gradient(circle at 45% 85%, rgba(255,255,255,0.3) 0.6px, transparent 1px)",
            backgroundSize: "180px 180px, 240px 240px, 320px 320px",
          }}
        />
      </div>

      <div className="relative mx-auto flex h-[100dvh] w-full max-w-6xl flex-col px-3 pt-4 sm:px-6">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-fuchsia-500 shadow-lg shadow-amber-500/20">
              <MoonStar className="h-6 w-6 text-[#1a1024]" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-amber-50">
                Atulya
                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-amber-200">
                  Jyotish AI
                </span>
              </h1>
              <p className="text-xs text-violet-200/50">
                {inSimulation ? "Virtual connection active" : "Tumhara jyotish guide aur dost"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === "demo" && (
              <span className="hidden rounded-full border border-violet-300/20 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wider text-violet-200/60 sm:inline">
                Demo mode
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="border-white/15 bg-white/5 text-amber-100 hover:bg-white/10 hover:text-amber-50"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Kundli
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={reset}
              aria-label="Nayi baat shuru karo"
              className="text-violet-200/60 hover:bg-white/5 hover:text-amber-100"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[270px_1fr]">
          <aside className="hidden min-h-0 flex-col gap-3 lg:flex">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-amber-200/70">
                <Star className="h-3.5 w-3.5" />
                Tumhari Kundli
              </div>
              {kundli ? (
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-amber-50">{kundli.name}</p>
                  <dl className="space-y-1.5 text-[13px] text-violet-100/70">
                    <div className="flex justify-between gap-2">
                      <dt className="text-violet-200/40">Janm Tithi</dt>
                      <dd>{kundli.dob || "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-violet-200/40">Samay</dt>
                      <dd>{kundli.time || "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="shrink-0 text-violet-200/40">Sthaan</dt>
                      <dd className="text-right">{kundli.place || "—"}</dd>
                    </div>
                  </dl>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                    className="mt-1 h-8 w-full border border-white/10 text-xs text-violet-200/70 hover:bg-white/5 hover:text-amber-100"
                  >
                    Details badlo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[13px] leading-relaxed text-violet-200/50">
                    4 details do — naam, janm tithi, samay aur sthaan — aur main tumhari kundli padhunga.
                  </p>
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="h-9 w-full bg-gradient-to-r from-amber-300 to-orange-400 text-sm font-semibold text-[#1a1024] hover:from-amber-200 hover:to-orange-300"
                  >
                    Kundli banao
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
              <div className="mb-3 text-xs font-medium uppercase tracking-widest text-amber-200/70">
                Kya poochhna hai?
              </div>
              <div className="flex flex-col gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => void send(p.label)}
                    disabled={streaming}
                    className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-left text-[13px] text-violet-100/70 transition hover:border-amber-300/30 hover:bg-amber-300/5 hover:text-amber-100 disabled:opacity-40"
                  >
                    <p.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300/60" />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-4 text-[11px] leading-relaxed text-amber-100/40">
              Atulya guidance deta hai, fear nahi. Virtual connections entertainment ke liye hain — real insaan se
              contact nahi.
            </div>
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/40 backdrop-blur-md">
            <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5 sm:px-6">
              <div className="mx-auto flex max-w-3xl flex-col gap-5">
                {messages.map((m) => (
                  <MessageRow
                    key={m.id}
                    message={m}
                    streaming={streaming && m.id === messages[messages.length - 1]?.id}
                    copied={copiedId === m.id}
                    onCopy={() => void copy(m)}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#0d0818]/60 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
              <div className="mx-auto max-w-3xl">
                <div className="mb-2 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => void send(p.label)}
                      className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-violet-100/70 active:bg-white/10"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send(textareaRef.current?.value ?? draft);
                  }}
                  className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 focus-within:border-amber-300/40"
                >
                  <Textarea
                    ref={textareaRef}
                    rows={1}
                    defaultValue={draft}
                    onChange={(e) => setComposerText(e.currentTarget.value)}
                    onInput={(e) => setComposerText(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        void send(e.currentTarget.value);
                      }
                    }}
                    enterKeyHint="send"
                    autoComplete="off"
                    autoCorrect="on"
                    autoCapitalize="sentences"
                    placeholder="Atulya se kuch bhi poochho..."
                    className="max-h-[140px] min-h-[38px] resize-none border-0 bg-transparent px-2 py-2 text-base text-violet-50 shadow-none placeholder:text-violet-200/30 focus-visible:ring-0 sm:text-[0.95rem]"
                  />
                  {streaming ? (
                    <Button
                      type="button"
                      size="icon"
                      onClick={stop}
                      aria-label="Rok do"
                      className="h-10 w-10 shrink-0 rounded-xl bg-white/10 text-amber-100 hover:bg-white/20"
                    >
                      <Square className="h-4 w-4 fill-current" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="icon"
                      aria-label="Bhejo"
                      className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 text-[#1a1024] hover:from-amber-200 hover:to-orange-300 active:scale-95"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </form>

                <p className="mt-2 text-center text-[10px] text-violet-200/30">
                  Atulya · Vedic guidance, not medical or financial advice · Simulacrum mode clearly labelled · v2
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <KundliDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleKundliSubmit} />
    </div>
  );
}

function MessageRow({
  message,
  streaming,
  copied,
  onCopy,
}: {
  message: ChatMessage;
  streaming: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  const isUser = message.role === "user";
  const isSim = message.content.includes("[Virtual Simulation");

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
          isUser
            ? "bg-white/10 text-violet-100"
            : "bg-gradient-to-br from-amber-300 via-orange-400 to-fuchsia-500 text-[#1a1024]",
        )}
      >
        {isUser ? <User2 className="h-4 w-4" /> : <MoonStar className="h-4 w-4" strokeWidth={2.4} />}
      </div>

      <div className={cn("group min-w-0 max-w-[85%]", isUser && "flex flex-col items-end")}>
        {!isUser && (
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-medium text-amber-200/80">Atulya</span>
            {isSim && (
              <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-400/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-fuchsia-200/80">
                Virtual
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            "relative rounded-2xl px-4 py-3",
            isUser
              ? "rounded-tr-sm bg-gradient-to-br from-amber-300 to-orange-400 text-[#1a1024] shadow-lg shadow-orange-500/10"
              : "rounded-tl-sm border border-white/10 bg-white/[0.04] text-violet-50",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed font-medium">{message.content}</p>
          ) : message.content ? (
            <AtulyaMarkdown content={message.content} />
          ) : (
            <div className="flex items-center gap-1.5 py-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-300/70"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
              <span className="ml-2 text-xs text-violet-200/40">Atulya dekh raha hai...</span>
            </div>
          )}
        </div>

        {!isUser && message.content && !streaming && (
          <button
            onClick={onCopy}
            className="mt-1 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-violet-200/30 opacity-0 transition hover:text-amber-200/70 group-hover:opacity-100"
          >
            <Copy className="h-3 w-3" />
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}
