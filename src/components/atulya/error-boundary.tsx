"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Atulya crashed:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#0a0614] px-6 text-violet-50">
          <div className="max-w-sm space-y-4 text-center">
            <p className="text-3xl">🔮</p>
            <h1 className="text-lg font-semibold text-amber-100">Atulya thoda atak gaya</h1>
            <p className="text-sm text-violet-200/60">
              Koi technical dikkat aayi hai. Page reload karne se sab theek ho jayega — tumhari chat safe hai.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-xl bg-gradient-to-r from-amber-300 to-orange-400 px-4 py-2.5 text-sm font-semibold text-[#1a1024]"
            >
              Reload karo
            </button>
            <p className="text-[10px] text-violet-200/30">{this.state.error.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
