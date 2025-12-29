export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-700">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of child immunization records and activities
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Children" value="0" />
        <StatCard title="Vaccinated" value="0" />
        <StatCard title="Pending Vaccines" value="0" />
        <StatCard title="Health Workers" value="0" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-green-700 mb-4">
            Recent Activity
          </h2>

          <div className="text-sm text-gray-500">
            No recent activity available.
          </div>
        </div>

        {/* Right Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-green-700 mb-4">
            System Summary
          </h2>

          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex justify-between">
              <span>System Status</span>
              <span className="text-green-600 font-medium">Active</span>
            </li>
            <li className="flex justify-between">
              <span>Last Update</span>
              <span>—</span>
            </li>
            <li className="flex justify-between">
              <span>Reports Generated</span>
              <span>0</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------
   Reusable Stat Card Component
-------------------------------- */
function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-5 border border-green-100">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-green-700 mt-2">
        {value}
      </p>
    </div>
  );
}
