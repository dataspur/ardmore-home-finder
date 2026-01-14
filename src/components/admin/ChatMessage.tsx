import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

export function ChatMessage({ role, content, isLoading }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 p-4", isUser ? "bg-muted/50" : "bg-background")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <p className="text-sm font-medium">{isUser ? "You" : "AI Assistant"}</p>
        {isLoading ? (
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-muted-foreground">
            {content.split("\n").map((line, i) => (
              <p key={i} className="mb-1 last:mb-0">
                {line || "\u00A0"}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
