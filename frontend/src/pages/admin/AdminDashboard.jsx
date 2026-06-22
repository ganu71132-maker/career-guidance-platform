import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useData } from '../../contexts/DataContext';
import { Briefcase, Map, BookOpen, Users, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { getStats, careers } = useData();
  const stats = getStats();

  // Count resources by type
  const resourcesByType = {};
  careers.forEach(c => c.roadmap.forEach(s => s.resources.forEach(r => {
    resourcesByType[r.type] = (resourcesByType[r.type] || 0) + 1;
  })));

  return (
    <AdminLayout>
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
        <p className="text-slate-500">Overview of all platform content and statistics.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-50 rounded-lg"><Briefcase className="h-6 w-6 text-blue-600" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{stats.totalCareers}</div>
          <div className="text-xs text-slate-500">Total Careers</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-50 rounded-lg"><Map className="h-6 w-6 text-purple-600" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{stats.totalSteps}</div>
          <div className="text-xs text-slate-500">Roadmap Steps</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-50 rounded-lg"><BookOpen className="h-6 w-6 text-emerald-600" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{stats.totalResources}</div>
          <div className="text-xs text-slate-500">Total Resources</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-orange-50 rounded-lg"><TrendingUp className="h-6 w-6 text-orange-600" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{stats.totalCategories}</div>
          <div className="text-xs text-slate-500">Categories</div>
        </div>
      </div>

      {/* Careers Table */}
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">All Careers Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="text-left px-6 py-3 font-medium">Career</th>
                <th className="text-left px-6 py-3 font-medium">Category</th>
                <th className="text-left px-6 py-3 font-medium">Steps</th>
                <th className="text-left px-6 py-3 font-medium">Resources</th>
                <th className="text-left px-6 py-3 font-medium">Demand</th>
                <th className="text-left px-6 py-3 font-medium">Salary</th>
              </tr>
            </thead>
            <tbody>
              {careers.map(career => (
                <tr key={career.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{career.title}</td>
                  <td className="px-6 py-4 text-slate-600">{career.category}</td>
                  <td className="px-6 py-4 text-slate-500">{career.roadmap.length}</td>
                  <td className="px-6 py-4 text-slate-500">{career.roadmap.reduce((s, st) => s + st.resources.length, 0)}</td>
                  <td className="px-6 py-4"><span className="text-emerald-600 font-semibold">{career.demandLevel}</span></td>
                  <td className="px-6 py-4 text-slate-500">{career.salary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Resources by Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(resourcesByType).map(([type, count]) => (
            <div key={type} className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 hover:border-emerald-200 transition-colors">
              <div className="text-2xl font-bold text-slate-800 mb-1">{count}</div>
              <div className="text-xs text-slate-500 capitalize">{type}s</div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
