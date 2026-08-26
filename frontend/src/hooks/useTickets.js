import { useCallback, useEffect, useState } from "react";
import * as ticketService from "../services/ticketService";

/**
 * Generic ticket-list hook.
 * mode: "mine" (customer's own tickets) or "queue" (agent queue)
 */
export function useTickets(mode = "mine", params = {}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data =
        mode === "queue"
          ? await ticketService.getQueue(params)
          : await ticketService.getMyTickets(params);
      setTickets(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, JSON.stringify(params)]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, loading, error, refetch: fetchTickets };
}

export function useTicketDetail(ticketId) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const data = await ticketService.getTicketById(ticketId);
      setTicket(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  return { ticket, loading, error, refetch: fetchTicket };
}
