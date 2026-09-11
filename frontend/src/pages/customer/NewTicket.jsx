import { useNavigate, Link } from "react-router-dom";
import { HelpCircle, ArrowLeft } from "lucide-react";
import TicketForm from "../../components/customer/TicketForm";

export default function NewTicket() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-surface-bg mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Tickets</span>
        </Link>
        <Link
          to="/faq"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Check FAQ first</span>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Submit a New Ticket</h1>
        <p className="mt-1 text-sm text-gray-400">
          Describe your issue and our AI system will automatically categorize and route it to the right support agent.
        </p>
      </div>

      <TicketForm
        onCreated={(ticket) =>
          navigate(`/tickets/${ticket.id || ""}`, {
            state: { newTicketId: ticket.id },
          })
        }
      />
    </div>
  );
}