"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Users,
  Settings,
  Database,
  History,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  Search
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { VerifiedBadge } from "../../components/VerifiedBadge";

export default function AdminDashboardPage() {
  const { can } = useAuth();

  const [activeTab, setActiveTab] = useState<"users" | "settings" | "master" | "audit">("users");

  // User management state
  const [users, setUsers] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Array<{ value: string; label: string; selfRegistrable: boolean }>>([]);
  const [searchUser, setSearchUser] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("Password123!");
  const [newFullName, setNewFullName] = useState("");
  const [newDob, setNewDob] = useState("1985-01-01");
  const [newRoles, setNewRoles] = useState<string[]>(["Verifier"]);

  // System settings state
  const [settings, setSettings] = useState<any[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Master data state
  const [districts, setDistricts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (can("user:manage")) fetchUsers();
    if (can("settings:manage")) fetchSettings();
    if (can("masterdata:manage")) fetchMasterData();
    if (can("audit:view")) fetchAuditLogs();
  }, [can]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const q = new URLSearchParams();
      if (searchUser) q.append("search", searchUser);
      if (userRoleFilter) q.append("role", userRoleFilter);
      if (userStatusFilter) q.append("status", userStatusFilter);

      const res = await api.get(`/admin/users?${q.toString()}`);
      if (res?.users) setUsers(res.users);
      if (res?.availableRoles) setAvailableRoles(res.availableRoles);
    } catch (err: any) {
      console.error("Failed to load users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await api.get("/admin/settings");
      if (res?.settings) setSettings(res.settings);
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [distRes, catRes, secRes] = await Promise.all([
        api.get("/master/districts"),
        api.get("/master/categories"),
        api.get("/master/sectors")
      ]);
      if (distRes?.districts) setDistricts(distRes.districts);
      if (catRes?.categories) setCategories(catRes.categories);
      if (secRes?.sectors) setSectors(secRes.sectors);
    } catch (err) {
      console.error("Failed to load master data", err);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await api.get("/admin/audit-logs");
      if (res?.logs) setAuditLogs(res.logs);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Toggle user soft deactivation
  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isActive: !currentActive });
      setMessage(`User account ${!currentActive ? "activated" : "deactivated (soft deleted)"} successfully.`);
      fetchUsers();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message || "Failed to update user status");
    }
  };

  // Create new user (e.g. Verifier or Admin)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      await api.post("/admin/users", {
        email: newEmail,
        password: newPassword,
        fullName: newFullName,
        dateOfBirth: newDob,
        roles: newRoles
      });
      setMessage("New administrative account created successfully.");
      setShowCreateModal(false);
      setNewEmail("");
      setNewFullName("");
      fetchUsers();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    }
  };

  // Update setting
  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      await api.put("/admin/settings", { key, value });
      setMessage(`Setting ${key} updated successfully.`);
      fetchSettings();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message || "Failed to update setting");
    }
  };

  const hasAdminAccess = can("user:manage") || can("settings:manage") || can("masterdata:manage") || can("audit:view");
  if (!hasAdminAccess) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-gray-200 p-6">
        <SlidersHorizontal className="mx-auto text-gray-400 mb-3" size={40} />
        <h2 className="text-lg font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 text-xs mt-1">
          This portal is reserved for Platform Super Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="surface-card p-5 lg:sticky lg:top-24">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-800"><SlidersHorizontal size={21} /></span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-primary-700">Administrator</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Platform dashboard</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Manage users, platform settings, reference data, and audit records.</p>

        <nav className="mt-6 grid gap-1" aria-label="Admin dashboard sections">
          {[
            { id: "users" as const, label: "User accounts & roles", icon: Users, permission: "user:manage" },
            { id: "settings" as const, label: "System settings", icon: Settings, permission: "settings:manage" },
            { id: "master" as const, label: "Master data", icon: Database, permission: "masterdata:manage" },
            { id: "audit" as const, label: "Audit trail", icon: History, permission: "audit:view" }
          ].filter((tab) => can(tab.permission)).map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)} aria-current={activeTab === id ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition ${activeTab === id ? "bg-primary-700 text-white shadow-sm" : "text-slate-600 hover:bg-primary-50 hover:text-primary-800"}`}>
              <Icon size={17} />{label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 space-y-6">

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl flex items-center space-x-2">
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: User Accounts & Roles */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white"
              >
                <option value="">All Roles</option>
                {availableRoles.map((roleOption) => <option key={roleOption.value} value={roleOption.value}>{roleOption.label}</option>)}
              </select>
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="deactivated">Deactivated (Soft-deleted)</option>
              </select>
            </div>

            <div className="flex space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={fetchUsers}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs"
              >
                Filter
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm"
              >
                <UserPlus size={15} />
                <span>Create Staff User</span>
              </button>
            </div>
          </div>

          {loadingUsers ? (
            <div className="text-center py-12 text-gray-500 font-medium">Loading users...</div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Roles</th>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className={u.isActive ? "hover:bg-gray-50" : "bg-red-50/30"}>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900 block">{u.fullName}</span>
                        <span className="text-gray-500 text-[11px]">{u.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r: string) => (
                            <span key={r} className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{u.district?.nameEn || "N/A"}</td>
                      <td className="py-3 px-4">
                        <VerifiedBadge isVerified={u.isVerified} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {u.isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                          className={`font-bold px-3 py-1 rounded-lg text-[11px] border transition ${
                            u.isActive
                              ? "border-red-300 text-red-700 hover:bg-red-50"
                              : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {u.isActive ? "Deactivate (Soft)" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: System Settings */}
      {activeTab === "settings" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            Platform System Settings
          </h2>
          <div className="divide-y divide-gray-100">
            {settings.map((s) => (
              <div key={s.key} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="max-w-md">
                  <span className="font-bold text-xs text-gray-800 font-mono block">{s.key}</span>
                  <span className="text-xs text-gray-500">{s.description}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    defaultValue={s.value}
                    id={`setting-${s.key}`}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs w-48 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`setting-${s.key}`) as HTMLInputElement;
                      if (el) handleUpdateSetting(s.key, el.value);
                    }}
                    className="p-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg shadow-sm"
                    title="Save setting"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Master Data */}
      {activeTab === "master" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
              All 25 Sri Lanka Districts Seeded
            </h3>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 text-xs">
              {districts.map((d) => (
                <div key={d.id} className="py-2 flex justify-between items-center">
                  <span className="font-bold text-gray-800">{d.nameEn} ({d.nameSi} / {d.nameTa})</span>
                  <span className="text-gray-500 font-mono text-[11px]">{d.lat.toFixed(2)}, {d.lng.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
              Micro-Business Sectors
            </h3>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 text-xs">
              {sectors.map((s) => (
                <div key={s.id} className="py-2">
                  <span className="font-bold text-gray-800 block">{s.nameEn}</span>
                  <span className="text-gray-500">{s.nameSi} • {s.nameTa}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === "audit" && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-sm text-gray-900">Immutable Audit Trail Logs</h2>
            <span className="text-xs text-gray-500">{auditLogs.length} events logged</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 text-xs space-y-1 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-mono">
                    {log.action}
                  </span>
                  <span className="text-gray-400 text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-gray-700">
                  <strong>Actor:</strong> {log.actor?.fullName || "System"} ({log.actor?.email || "System-set"}) • Target: <strong>{log.targetType}</strong> ({log.targetId || "N/A"})
                </div>
                {log.details && (
                  <pre className="text-[10px] bg-gray-50 p-2 rounded border border-gray-200 text-gray-600 font-mono overflow-x-auto">
                    {log.details}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Staff User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              Create Verifier or Admin Staff
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Officer Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@rakiya.lk"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={newDob}
                  onChange={(e) => setNewDob(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Assign Staff Role</label>
                <select
                  value={newRoles[0]}
                  onChange={(e) => setNewRoles([e.target.value])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
                >
                  {availableRoles.filter((roleOption) => !roleOption.selfRegistrable).map((roleOption) => (
                    <option key={roleOption.value} value={roleOption.value}>{roleOption.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
