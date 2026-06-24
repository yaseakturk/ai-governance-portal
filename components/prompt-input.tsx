"use client"

import { Loader2, MessageSquareText, Send } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export function PromptInput({
  value,
  onChange,
  onSubmit,
  loading,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  loading: boolean
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor="prompt"
        className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        <MessageSquareText className="h-3.5 w-3.5" />
        Prompt
      </Label>
      <Textarea
        id="prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit()
        }}
        placeholder="Describe the task for the governed model. e.g. Summarize this escalation thread and recommend next steps…"
        className="min-h-32 resize-y bg-input/40 leading-relaxed"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {value.trim().length} chars · ⌘/Ctrl + Enter to run
        </span>
        <Button onClick={onSubmit} disabled={loading || !value.trim()} size="sm">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Routing…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Run governed request
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
