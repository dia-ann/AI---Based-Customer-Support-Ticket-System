import { useState } from "react";
import Button from "../common/Button";
import { useToast } from "../common/Toast";
import * as ticketService from "../../services/ticketService";

export default function TicketForm({ onCreated }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ subject: "", description: "", category_id: "" });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ticket = await ticketService.createTicket(form);
      showToast("Ticket submitted successfully", "success");
      setForm({ subject: "", description: "", category_id: "" });
      onCreated?.(ticket);
    } catch (err) {
      showToast(err.response?.data?.detail || "Could not submit ticket", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
        <input
          name="subject"
          value={form.subject}
          onChange={handleChange}
          required
          className="w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          placeholder="Briefly describe the issue"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          rows={5}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          placeholder="Give as much detail as you can — the AI classifier uses this to route your ticket"
        />
      </div>

      <Button type="submit" loading={submitting}>
        Submit Ticket
      </Button>
    </form>
  );
}
