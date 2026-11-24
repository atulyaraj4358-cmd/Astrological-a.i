import { ChatApp } from "@/components/atulya/chat-app";
import { AppErrorBoundary } from "@/components/atulya/error-boundary";

export default function Home() {
  return (
    <AppErrorBoundary>
      <ChatApp />
    </AppErrorBoundary>
  );
}
