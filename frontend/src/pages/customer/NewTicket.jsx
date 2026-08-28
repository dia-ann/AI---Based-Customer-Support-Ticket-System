import { useNavigate } from "react-router-dom";
import TicketForm from "../../components/customer/TicketForm";

export default function NewTicket() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-surface-bg mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold text-white">Submit a new ticket</h1>
      <TicketForm onCreated={(ticket) => navigate(`/tickets`, { state: { newTicketId: ticket.id } })} />
    </div>
  );
}