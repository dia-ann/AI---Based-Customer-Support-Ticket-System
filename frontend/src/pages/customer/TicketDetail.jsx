import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTicketDetail } from "../../hooks/useTickets";
import * as ticketService from "../../services/ticketService";
import { useToast } from "../../components/common/Toast";
import Loader from "../../components/common/Loader";
import Button from "../../components/common/Button";
import RatingModal from "../../components/customer/RatingModal";
import clsx from "clsx";
import { STATUS_COLORS } from "../../utils/constants";
import { formatRelativeTime, formatDateTime } from "../../utils/formatters";

export default function CustomerTicketDetail() {
  const { ticketId } = useParams();
  const { ticket, loading, error, refetch } = useTicketDetail(ticketId);
  const { showToast } = useToast();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(true);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Fetch replies on mount
  useEffect(() => {
    if (!ticketId) return;
    ticketService
      .getTicketReplies(ticketId)
      .then((data) => setReplies(data))
      .catch(() => {})
      .finally(() => setRepliesLoading(false));
  }, [ticketId]);

  async function fetchReplies() {
    try {
      const data = await ticketService.getTicketReplies(ticketId);
      setReplies(data);
    } catch {}
  }

  async function handleSendReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await ticketService.addCustomerReply(ticketId, reply);
      setReply("");
      showToast("Reply sent", "success");
      await fetchReplies();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to send reply", "error");
    } finally {
      setSending(false);
    }
  }

  if (loading || !ticket) return <Loader fullScreen />;
  if (error) return <p className="p-8 text-sm text-red-400">{error}</p>;

  const isClosedOrResolved =
    ticket.status === "resolved" || ticket.status === "closed";

  return (
    <div className="min-h-screen w-full bg-surface-bg mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        to="/tickets"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent transition-colors"
      >
        ← Back to My Tickets
      </Link>

      {/* Ticket header */}
      <div className="mt-4 rounded-xl border border-surface-border bg-surface-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-white truncate">
              {ticket.subject}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Ticket #{ticket.id?.slice(0, 8)} • Opened{" "}
              {formatRelativeTime(ticket.created_at)}
            </p>
          </div>
          <span
            className={clsx(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize",
              STATUS_COLORS[ticket.status],
            )}
          >
            {ticket.status?.replace("_", " ")}
          </span>
        </div>

        {/* Original body */}
        <div className="mt-4 rounded-lg bg-surface-bg p-4">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {ticket.body_redacted}
          </p>
        </div>
      </div>

      {/* Conversation / Replies */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-gray-400">Conversation</h2>

        {repliesLoading ? (
          <div className="flex justify-center py-6">
            <Loader />
          </div>
        ) : replies.length === 0 ? (
          <div className="rounded-xl border border-surface-border bg-surface-card p-6 text-center">
            <p className="text-sm text-gray-500">
              No replies yet. An agent will respond to your ticket soon.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {replies
              .filter((r) => !r.is_internal_note)
              .map((r) => {
                const isCustomer = r.author_id === ticket.customer_id;
                return (
                  <div
                    key={r.id}
                    className={clsx(
                      "rounded-xl border p-4",
                      isCustomer
                        ? "border-accent/30 bg-accent/5 ml-8"
                        : "border-surface-border bg-surface-card mr-8",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500">
                        {isCustomer ? "You" : "Support Agent"}
                        {r.is_auto_reply && " • Auto-reply"}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDateTime(r.created_at)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">
                      {r.body}
                    </p>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Reply box — only if ticket is not closed */}
      {/* {!isClosedOrResolved ? (
        <form onSubmit={handleSendReply} className="mt-6">
          <div className="rounded-xl border border-surface-border bg-surface-card p-4 space-y-3">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
              placeholder="Write your reply…"
              className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent focus:outline-none"
            />
            <div className="flex justify-end">
              <Button type="submit" loading={sending}>
                Send Reply
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-6 rounded-xl border border-surface-border bg-surface-card p-6 text-center space-y-3">
          <p className="text-sm text-gray-400">
            This ticket has been {ticket.status?.replace("_", " ")}.
          </p>
          <button
            onClick={() => setIsRatingModalOpen(true)}
            className="text-sm font-medium text-brand-primary hover:text-brand-secondary transition-colors"
          >
            ★ Rate this ticket
          </button>
          <RatingModal
            ticket={ticket}
            isOpen={isRatingModalOpen}
            onClose={() => setIsRatingModalOpen(false)}
          />
        </div>
      )} */}
    </div>
  );
}
