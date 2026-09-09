import TicketTable from "./TicketTable";

export default function TicketQueue({ tickets, loading, onBulkUpdated, departments = [] }) {
  return (
    <TicketTable
      tickets={tickets}
      loading={loading}
      onBulkUpdated={onBulkUpdated}
      departments={departments}
    />
  );
}