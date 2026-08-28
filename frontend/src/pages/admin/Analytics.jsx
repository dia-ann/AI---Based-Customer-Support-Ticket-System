export default function Analytics() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold">Analytics</h1>
        <p className="text-[13px] text-[#9ca3af] mt-1">Track your support performance and ticket trends.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-5">
          <p className="text-[11px] tracking-widest text-[#9ca3af]">TOTAL TICKETS</p>
          <h2 className="text-[28px] font-bold mt-2">1,284</h2>
          <p className="text-[12px] text-[#4ade80] mt-1">↑ 12.5% vs last month</p>
        </div>
        <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-5">
          <p className="text-[11px] tracking-widest text-[#9ca3af]">AVG RESPONSE</p>
          <h2 className="text-[28px] font-bold mt-2">1h 24m</h2>
          <p className="text-[12px] text-[#fbbf24] mt-1">↓ 8% faster</p>
        </div>
        <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-5">
          <p className="text-[11px] tracking-widest text-[#9ca3af]">RESOLUTION RATE</p>
          <h2 className="text-[28px] font-bold mt-2">94.2%</h2>
          <p className="text-[12px] text-[#4ade80] mt-1">↑ 3.1%</p>
        </div>
        <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-5">
          <p className="text-[11px] tracking-widest text-[#9ca3af]">CSAT SCORE</p>
          <h2 className="text-[28px] font-bold mt-2">4.8/5</h2>
          <p className="text-[12px] text-[#9ca3af] mt-1">Based on 342 ratings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets by Category */}
        <div className="lg:col-span-2 bg-[#181b26] border border-[#232632] rounded-[16px] p-6">
          <h3 className="font-semibold text-[15px] mb-6">Tickets by Category</h3>
          <div className="space-y-4">
            {[
              { name: "Technical Issue", value: 420, percent: 65, color: "bg-[#fbbf24]" },
              { name: "Billing", value: 180, percent: 35, color: "bg-[#3b82f6]" },
              { name: "Account Issue", value: 120, percent: 22, color: "bg-[#a78bfa]" },
              { name: "Feature Request", value: 80, percent: 15, color: "bg-[#34d399]" },
            ].map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span>{c.name}</span>
                  <span className="text-[#9ca3af]">{c.value} tickets</span>
                </div>
                <div className="h-2 bg-[#0f1117] rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets by Status */}
        <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-6">
          <h3 className="font-semibold text-[15px] mb-6">By Status</h3>
          <div className="flex justify-center my-4">
            <div className="w-32 h-32 rounded-full border-[8px] border-[#fbbf24] border-r-[#3b82f6] border-b-[#34d399] border-l-[#232632]"></div>
          </div>
          <div className="space-y-3 mt-6 text-[13px]">
            <div className="flex justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 bg-[#fbbf24] rounded-full"></span>Open</span><span>42%</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 bg-[#3b82f6] rounded-full"></span>Resolved</span><span>38%</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 bg-[#34d399] rounded-full"></span>Pending</span><span>20%</span></div>
          </div>
        </div>
      </div>

      {/* Bottom Table */}
      <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-6 mt-6">
        <h3 className="font-semibold text-[15px] mb-4">Top Agents Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[#9ca3af] border-b border-[#232632]">
              <tr><th className="py-3 font-normal">Agent</th><th className="py-3 font-normal">Tickets Solved</th><th className="py-3 font-normal">Avg Time</th><th className="py-3 font-normal">Rating</th></tr>
            </thead>
            <tbody className="text-[#c2c4c8]">
              <tr className="border-b border-[#232632]"><td className="py-3">Jane Smith</td><td className="py-3">124</td><td className="py-3">1h 12m</td><td className="py-3 text-[#fbbf24]">4.9</td></tr>
              <tr className="border-b border-[#232632]"><td className="py-3">Mike Johnson</td><td className="py-3">98</td><td className="py-3">1h 45m</td><td className="py-3 text-[#fbbf24]">4.7</td></tr>
              <tr><td className="py-3">Sarah Williams</td><td className="py-3">86</td><td className="py-3">2h 10m</td><td className="py-3 text-[#fbbf24]">4.6</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}