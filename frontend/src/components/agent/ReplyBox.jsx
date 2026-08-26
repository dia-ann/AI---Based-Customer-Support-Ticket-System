import { useState } from "react";
import Button from "../common/Button";
import { useToast } from "../common/Toast";
import * as ticketService from "../../services/ticketService";

export default function ReplyBox({ ticketId, onSent }) {
  const { showToast } = useToast();
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await ticketService.sendAgentReply(ticketId, message, isInternal);
      setMessage("");
      onSent?.();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to send reply", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleSuggest() {
    setSuggesting(true);
    try {
      const { suggestion } = await ticketService.getSuggestedReply(ticketId);
      setMessage(suggestion);
    } catch (err) {
      showToast("AI suggestion unavailable right now", "error");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border bg-white p-4">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="Write a reply to the customer…"
        className="w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
          />
          Internal note (not visible to customer)
        </label>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSuggest} loading={suggesting}>
            ✨ AI Suggest
          </Button>
          <Button onClick={handleSend} loading={sending}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
