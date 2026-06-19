import React, { useState, useEffect } from "react";
import { Wrench, Users, ClipboardCheck, Banknote, Settings, LogOut, Moon, Sun, AlertCircle, CheckCircle2, CircleCheck } from "lucide-react";
import { Employee, AttendanceRecord, SalarySlip, AdvanceSalaryEntry, BackupData, AttendanceStatus } from "./types";
import { getDatabase, saveDatabase, calculateEmployeeStats, calculatePay } from "./utils/db";

// Sub-components
import { AdminLogin } from "./components/AdminLogin";
import { Dashboard } from "./components/Dashboard";
import { EmployeeManager } from "./components/EmployeeManager";
import { AttendanceMarker } from "./components/AttendanceMarker";
import { PayrollManager } from "./components/PayrollManager";
import { SettingsView } from "./components/SettingsView";

export default function App() {
  const [db, setDb] = useState<BackupData>(() => getDatabase());
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Custom Toast state
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(null);

  // Check login session stability on initial render
  useEffect(() => {
    const keepIn = localStorage.getItem("keep_logged_in") === "true";
    const sessionUser = localStorage.getItem("session_username");
    if (keepIn && sessionUser) {
      setIsAdminLoggedIn(true);
    }
  }, []);

  const triggerToast = (text: string, isError = false) => {
    setToast({ text, isError });
    // Dismiss toast after 3.2 seconds
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  // Helper sync database local states and persistent localStorage triggers
  const syncDb = (updated: BackupData) => {
    setDb(updated);
    saveDatabase(updated);
  };

  const handleLoginSuccess = (username: string) => {
    setIsAdminLoggedIn(true);
    triggerToast(`Welcome back, Administrator ${username}! Connecting secure terminal.`);
  };

  const handleLogout = () => {
    localStorage.removeItem("keep_logged_in");
    localStorage.removeItem("session_username");
    setIsAdminLoggedIn(false);
    setActiveTab("dashboard");
    triggerToast("Terminal session closed successfully.");
  };

  // Employee additions
  const handleAddEmployee = (newEmpDetails: Omit<Employee, "id" | "isActive">) => {
    const nextIdNum = db.employees.length > 0 
      ? Math.max(...db.employees.map(e => parseInt(e.id.replace("EMP-", "")))) + 1 
      : 1001;
    const newEmp: Employee = {
      ...newEmpDetails,
      id: `EMP-${nextIdNum}`,
      isActive: true,
    };

    const nextEmployees = [...db.employees, newEmp];
    syncDb({
      ...db,
      employees: nextEmployees,
    });
    triggerToast(`Registered worker ${newEmp.name} (Code: ${newEmp.id}) safely.`);
  };

  const handleEditEmployee = (modifiedEmp: Employee) => {
    const nextEmployees = db.employees.map((e) => (e.id === modifiedEmp.id ? modifiedEmp : e));
    syncDb({
      ...db,
      employees: nextEmployees,
    });
    triggerToast(`Profile parameters updated for ${modifiedEmp.name}!`);
  };

  const handleDeleteEmployee = (id: string) => {
    // Soft deactivate instead of hard wipe so logs do not corrupt historical calculations
    const nextEmployees = db.employees.map((e) => (e.id === id ? { ...e, isActive: false } : e));
    syncDb({
      ...db,
      employees: nextEmployees,
    });
    triggerToast("Worker removed from active personnel schedules.");
  };

  // Attendance logging
  const handleMarkAttendance = (employeeId: string, date: string, status: AttendanceStatus) => {
    // Check if record already exists for date
    const filteredRecords = db.attendance.filter(
      (r) => !(r.employeeId === employeeId && r.date === date)
    );

    const nextAttendance = [
      ...filteredRecords,
      { employeeId, date, status },
    ];

    syncDb({
      ...db,
      attendance: nextAttendance,
    });
    // Silent auto save acknowledgement as requested ("Auto save attendance")
  };

  const handleClearAttendance = (employeeId: string, date: string) => {
    const nextAttendance = db.attendance.filter(
      (r) => !(r.employeeId === employeeId && r.date === date)
    );

    syncDb({
      ...db,
      attendance: nextAttendance,
    });
  };

  // Payroll / Slip logging
  const handleUpdateSalarySlip = (slip: SalarySlip) => {
    const filteredSlips = db.salarySlips.filter(
      (s) => !(s.employeeId === slip.employeeId && s.month === slip.month)
    );

    const nextSlips = [...filteredSlips, slip];
    syncDb({
      ...db,
      salarySlips: nextSlips,
    });
  };

  const handleAddAdvance = (newAdvDetails: Omit<AdvanceSalaryEntry, "id">) => {
    const newAdv: AdvanceSalaryEntry = {
      ...newAdvDetails,
      id: `ADV-${Date.now()}`,
    };

    const nextAdvances = [...db.advances, newAdv];
    syncDb({
      ...db,
      advances: nextAdvances,
    });
  };

  const handleDeleteAdvance = (id: string) => {
    const nextAdvances = db.advances.filter((a) => a.id !== id);
    syncDb({
      ...db,
      advances: nextAdvances,
    });
  };

  // Restoring full database
  const handleRestoreBackupStructure = (restoredDb: BackupData) => {
    setDb(restoredDb);
    saveDatabase(restoredDb);
  };

  // Dynamic calculable totals across entire team for Monthly Salary Expense dashboard card
  const getActiveMonthlySalaryExpenseSum = () => {
    const activeMonth = "2026-06"; // Seeding calendar timeframe
    const sum = db.employees
      .filter((e) => e.isActive)
      .reduce((acc, emp) => {
        const stats = calculateEmployeeStats(emp.id, activeMonth, db.attendance);
        const payValDetails = calculatePay(emp, activeMonth, stats, db.advances, db.salarySlips);
        return acc + payValDetails.finalSalary;
      }, 0);
    return sum;
  };

  const toggleThemeMode = () => {
    const nextTheme = db.themeMode === "light" ? "dark" : "light";
    syncDb({
      ...db,
      themeMode: nextTheme,
    });
    triggerToast(`Flipped workspace layout to ${nextTheme} skin.`);
  };

  const handleUpdateGarageName = (name: string) => {
    syncDb({
      ...db,
      garageName: name,
    });
  };

  const handleUpdateAdminCredentials = (user: string, pass: string) => {
    localStorage.setItem("admin_password", pass);
    localStorage.setItem("admin_username", user);
    syncDb({
      ...db,
      adminUsername: user,
    });
    triggerToast("Terminal Administrator credentials altered securely!");
  };

  // Guard routing login intercept
  if (!isAdminLoggedIn) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        savedUsername={db.adminUsername}
        garageName={db.garageName}
      />
    );
  }

  return (
    <div className={`min-h-screen ${db.themeMode === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} flex flex-col transition-colors duration-150`}>
      {/* GLOBAL TOAST OVERLAY / SnackBar Emulation */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce cursor-pointer flex items-center gap-2.5 p-4 rounded-2xl shadow-xl border select-none max-w-sm w-[90%]"
             style={{
               background: toast.isError ? "#fef2f2" : "#ecfdf5",
               borderColor: toast.isError ? "#fee2e2" : "#d1fae5",
               color: toast.isError ? "#dc2626" : "#059669",
             }}
             onClick={() => setToast(null)}
        >
          {toast.isError ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CircleCheck className="w-5 h-5 flex-shrink-0 stroke-[2.5px]" />
          )}
          <span className="text-xs font-black tracking-tight leading-snug">
            {toast.text}
          </span>
        </div>
      )}

      {/* TOP NOTIFY HEADER BAR (Android Frame Header emulation) */}
      <header className={`sticky top-0 z-30 ${db.themeMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} border-b py-3 px-6 shadow-sm flex justify-between items-center select-none`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-xl text-white shadow shadow-blue-500/10">
            <Wrench className="w-4 h-4 rotate-45" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-widest font-display text-blue-600 uppercase">
              {db.garageName}
            </h1>
            <p className="text-[9px] font-bold text-slate-400 font-mono mt-0.5">
              OFFLINE SECURED PORTAL • V1.5.0
            </p>
          </div>
        </div>

        {/* Global theme quick button toggler */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleThemeMode}
            className={`p-2 rounded-xl transition-all border ${
              db.themeMode === "dark"
                ? "bg-slate-800 border-slate-700 text-amber-400"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
            }`}
            title="Toggle theme skin"
          >
            {db.themeMode === "dark" ? <Sun className="w-4 h-4 fill-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleLogout}
            className="p-2 border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 rounded-xl transition-all"
            title="Secure Sign off"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN BODY LAYOUT VIEW STAGE */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 overflow-y-auto mb-16.5 md:mb-18">
        {activeTab === "dashboard" && (
          <Dashboard
            employees={db.employees}
            attendance={db.attendance}
            garageName={db.garageName}
            onNavigate={(tab) => {
              setActiveTab(tab);
              // Direct navigation hooks focus
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            currentDateStr={new Date().toISOString().split("T")[0]}
            monthlySalaryExpense={getActiveMonthlySalaryExpenseSum()}
          />
        )}

        {activeTab === "attendance" && (
          <AttendanceMarker
            employees={db.employees}
            attendance={db.attendance}
            onMarkAttendance={handleMarkAttendance}
            onClearAttendance={handleClearAttendance}
            showToast={triggerToast}
          />
        )}

        {activeTab === "employees" && (
          <EmployeeManager
            employees={db.employees}
            attendance={db.attendance}
            onAddEmployee={handleAddEmployee}
            onEditEmployee={handleEditEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            showToast={triggerToast}
          />
        )}

        {activeTab === "payroll" && (
          <PayrollManager
            employees={db.employees}
            attendance={db.attendance}
            salarySlips={db.salarySlips}
            advances={db.advances}
            garageName={db.garageName}
            onUpdateSalarySlip={handleUpdateSalarySlip}
            onAddAdvance={handleAddAdvance}
            onDeleteAdvance={handleDeleteAdvance}
            showToast={triggerToast}
          />
        )}

        {activeTab === "settings" && (
          <SettingsView
            garageName={db.garageName}
            adminUsername={db.adminUsername}
            themeMode={db.themeMode}
            onUpdateGarageName={handleUpdateGarageName}
            onUpdateAdminCredentials={handleUpdateAdminCredentials}
            onToggleTheme={toggleThemeMode}
            onLogoutAdmin={handleLogout}
            onRestoreBackup={handleRestoreBackupStructure}
            getCurrentDbState={() => db}
            showToast={triggerToast}
          />
        )}
      </main>

      {/* FOOTER NAVIGATION - Bottom navigation bar matching an Android App */}
      <footer className={`fixed bottom-0 left-0 right-0 z-40 border-t select-none ${
        db.themeMode === "dark" ? "bg-slate-900 border-slate-850" : "bg-white border-slate-150"
      }`}>
        <div className="max-w-xl mx-auto flex justify-around items-center py-2 px-1">
          {/* Nav Home Dashboard */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center justify-center flex-1 py-1 group transition-all text-center select-none cursor-pointer ${
              activeTab === "dashboard"
                ? "text-blue-600 scale-105 font-black"
                : "text-slate-400 font-medium"
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === "dashboard" ? "bg-blue-50/10" : "bg-transparent"}`}>
              <Wrench className="w-5 h-5 rotate-45" />
            </div>
            <span className="text-[10px] tracking-wide mt-0.5">Terminal</span>
          </button>

          {/* Nav Attendance */}
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex flex-col items-center justify-center flex-1 py-1 group transition-all text-center select-none cursor-pointer ${
              activeTab === "attendance"
                ? "text-blue-600 scale-105 font-black"
                : "text-slate-400 font-medium"
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === "attendance" ? "bg-blue-50/10" : "bg-transparent"}`}>
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-wide mt-0.5">Muster</span>
          </button>

          {/* Nav Payroll */}
          <button
            onClick={() => setActiveTab("payroll")}
            className={`flex flex-col items-center justify-center flex-1 py-1 group transition-all text-center select-none cursor-pointer ${
              activeTab === "payroll"
                ? "text-blue-600 scale-105 font-black"
                : "text-slate-400 font-medium"
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === "payroll" ? "bg-blue-50/10" : "bg-transparent"}`}>
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-wide mt-0.5">Payroll</span>
          </button>

          {/* Nav Staff Employees */}
          <button
            onClick={() => setActiveTab("employees")}
            className={`flex flex-col items-center justify-center flex-1 py-1 group transition-all text-center select-none cursor-pointer ${
              activeTab === "employees"
                ? "text-blue-600 scale-105 font-black"
                : "text-slate-400 font-medium"
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === "employees" ? "bg-blue-50/10" : "bg-transparent"}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-wide mt-0.5">Staff</span>
          </button>

          {/* Nav Settings Console */}
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center flex-1 py-1 group transition-all text-center select-none cursor-pointer ${
              activeTab === "settings"
                ? "text-blue-600 scale-105 font-black"
                : "text-slate-400 font-medium"
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === "settings" ? "bg-blue-50/10" : "bg-transparent"}`}>
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-wide mt-0.5">Console</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
