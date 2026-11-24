"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { KundliDetails } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (details: KundliDetails) => void;
};

export function KundliDialog({ open, onOpenChange, onSubmit }: Props) {
  const [form, setForm] = useState<KundliDetails>({ name: "", dob: "", time: "", place: "" });
  const [timeUnknown, setTimeUnknown] = useState(false);

  const set = (key: keyof KundliDetails, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.dob.trim() || !form.place.trim()) return;
    onSubmit({ ...form, time: timeUnknown ? "pata nahi" : form.time.trim() });
    setForm({ name: "", dob: "", time: "", place: "" });
    setTimeUnknown(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#150f24] text-violet-50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-100">
            <Sparkles className="h-4 w-4 text-amber-300" />
            Apni Kundli Batao
          </DialogTitle>
          <DialogDescription className="text-violet-200/60">
            Ye details Atulya ko bhej di jayengi, phir wo tumhari kundli padhega.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="k-name" className="text-violet-100/80">1) Naam</Label>
            <Input
              id="k-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Tumhara naam"
              className="border-white/10 bg-white/5 text-violet-50 placeholder:text-violet-200/30"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="k-dob" className="text-violet-100/80">2) Janm Tithi</Label>
              <Input
                id="k-dob"
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
                className="border-white/10 bg-white/5 text-violet-50 [color-scheme:dark]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="k-time" className="text-violet-100/80">3) Janm Samay</Label>
              <Input
                id="k-time"
                type="time"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                disabled={timeUnknown}
                className="border-white/10 bg-white/5 text-violet-50 [color-scheme:dark] disabled:opacity-40"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-violet-200/60">
            <Checkbox
              checked={timeUnknown}
              onCheckedChange={(v) => setTimeUnknown(v === true)}
              className="border-white/20 data-[state=checked]:bg-amber-400 data-[state=checked]:text-black"
            />
            Exact birth time pata nahi hai
          </label>

          <div className="space-y-1.5">
            <Label htmlFor="k-place" className="text-violet-100/80">4) Janm Sthaan</Label>
            <Input
              id="k-place"
              value={form.place}
              onChange={(e) => set("place", e.target.value)}
              placeholder="Sheher / gaon, rajya"
              className="border-white/10 bg-white/5 text-violet-50 placeholder:text-violet-200/30"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-300 to-orange-400 font-semibold text-[#1a1024] hover:from-amber-200 hover:to-orange-300"
            >
              Kundli Padho
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
