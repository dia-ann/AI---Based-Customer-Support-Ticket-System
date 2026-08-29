import { Link } from "react-router-dom";
import { useTickets } from "../../hooks/useTickets";
import TicketStatus from "../../components/customer/TicketStatus";
import Loader from "../../components/common/Loader";
import Button from "../../components/common/Button";

export default function MyTickets() {
  const { tickets, loading, error } = useTickets("mine");

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen w-full bg-surface-bg mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">My Tickets</h1>
        <Link to="/tickets/new">
          <Button>+ New Ticket</Button>
        </Link>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!error && !tickets.length && (
        <p className="text-sm text-gray-500">You haven't raised any tickets yet.</p>
      )}

      <div className="space-y-3">
        {tickets.map((t) => (
          <TicketStatus key={t.id} ticket={t} />
        ))}
      </div>
    </div>
  );
}