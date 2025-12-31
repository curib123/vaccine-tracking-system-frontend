'use client';

import {
  Baby,
  Bell,
  Syringe,
  Users,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-6">

      {/* =========================
         GREETING
      ========================= */}
      <section>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
          Welcome 👋
        </h1>
        <p className="text-sm text-slate-500">
          Here’s a quick overview of today’s records
        </p>
      </section>

      {/* =========================
         STATS CARDS
      ========================= */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Children"
          value="128"
          icon={Baby}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          title="Parents"
          value="96"
          icon={Users}
          color="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          title="Vaccinations"
          value="342"
          icon={Syringe}
          color="bg-purple-100 text-purple-700"
        />
        <StatCard
          title="Announcements"
          value="5"
          icon={Bell}
          color="bg-amber-100 text-amber-700"
        />
      </section>

      {/* =========================
         QUICK ACTIONS
      ========================= */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionCard
            label="Add Child"
            href="/children"
            icon={Baby}
          />
          <ActionCard
            label="New Announcement"
            href="/announcements"
            icon={Bell}
          />
          <ActionCard
            label="Vaccination Records"
            href="/immunization"
            icon={Syringe}
          />
          <ActionCard
            label="Manage Parents"
            href="/parents"
            icon={Users}
          />
        </div>
      </section>

      {/* =========================
         RECENT ACTIVITY
      ========================= */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Recent Activity
        </h2>

        <div className="bg-white rounded-xl shadow-sm divide-y">
          <ActivityItem
            title="New child registered"
            description="Juan Dela Cruz"
            time="10 minutes ago"
          />
          <ActivityItem
            title="Vaccination completed"
            description="MMR Vaccine"
            time="1 hour ago"
          />
          <ActivityItem
            title="Announcement posted"
            description="Free vaccination schedule"
            time="Yesterday"
          />
        </div>
      </section>

    </div>
  );
}

/* =========================
   COMPONENTS
========================= */

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: any) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{title}</p>
        <p className="text-lg font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function ActionCard({
  label,
  href,
  icon: Icon,
}: any) {
  return (
    <a
      href={href}
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 text-center"
    >
      <Icon className="w-6 h-6 text-blue-600" />
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>
    </a>
  );
}

function ActivityItem({
  title,
  description,
  time,
}: any) {
  return (
    <div className="p-4">
      <p className="text-sm font-medium text-slate-800">
        {title}
      </p>
      <p className="text-xs text-slate-500">
        {description}
      </p>
      <p className="text-xs text-slate-400 mt-1">
        {time}
      </p>
    </div>
  );
}
