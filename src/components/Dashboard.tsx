import React from "react";
import { Users, CalendarDays, CheckCircle2, AlertCircle, RefreshCw, Landmark, ArrowRight, UserCheck, UserX, AlertTriangle, Play } from "lucide-react";
import { Employee, AttendanceRecord } from "../types";

interface DashboardProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  garageName: string;
  onNavigate: (tab: string) => void;
  currentDateStr: string; // YYYY-MM-DD
  monthlySalaryExpense: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  employees,
  attendance,
  garageName,
  onNavigate,
  currentDateStr,
  monthlySalaryExpense,
}) => {
  // Today's attendance calculations
  const todayRecords = attendance.filter((r) => r.date === currentDateStr);
  const totalEmployees = employees.filter((e) => e.isActive).length;

  const presentToday = todayRecords.filter((r) => r.status === "PRESENT").length;
  const absentToday = todayRecords.filter((r) => r.status === "ABSENT").length;
  const halfDayToday = todayRecords.filter((r) => r.status === "HALF_DAY").length;
  
  const unmarkedToday = totalEmployees - todayRecords.length;
  const isAttendanceMarked = todayRecords.length > 0;

  // Formatting currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Get current active month and year name
  const currentMonthName = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 pb-6">
      {/* Station Banner Cards */}
      <div className="relative bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-6 rounded-3xl shadow-xl shadow-blue-500/10 overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <CalendarDays className="w-40 h-40 transform translate-x-12 -translate-y-6 rotate-12" />
        </div>
        <div className="relative z-10 space-y-4">
          <div>
            <span className="px-3 py-1 bg-white/15 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-full">
              GARAGE TERMINAL
            </span>
            <h1 className="text-2xl font-black tracking-tight font-display mt-2 sm:text-3xl">
              {garageName}
            </h1>
            <p className="text-xs text-blue-100 font-medium">
              Daily Attendance, Wages & Automated Payroll
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
            <div>
              <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">
                System Time
              </p>
              <p className="text-sm font-bold font-mono text-white">
                {new Date(currentDateStr).toLocaleDateString("en-IN", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={() => onNavigate("attendance")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Notification Reminder Banner */}
      {!isAttendanceMarked && totalEmployees > 0 && (
        <div 
          onClick={() => onNavigate("attendance")}
          className="flex items-start gap-4 p-4 bg-orange-50 border border-orange-200 hover:border-orange-300 rounded-2xl cursor-pointer transition-all hover:bg-orange-100/50 animate-pulse active:scale-[0.99] shadow-sm"
        >
          <div className="p-2.5 bg-orange-500 text-white rounded-xl shadow-sm">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-orange-800 uppercase tracking-wider">
              Attendance Alert!
            </h4>
            <p className="text-xs text-orange-700 mt-0.5 line-clamp-2">
              Today's attendance has not been recorded yet. Please complete the morning muster for {totalEmployees} active garage staff.
            </p>
            <span className="inline-flex items-center text-[10px] font-bold text-orange-800 mt-1.5 hover:underline gap-0.5">
              Begin Attendance Now <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      )}

      {/* Statistics Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div 
          onClick={() => onNavigate("employees")}
          className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/40 hover:border-blue-200 transition-all cursor-pointer group hover:shadow-md"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="p-2 border border-blue-50 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Staff
          </p>
          <h2 className="text-2xl font-black text-slate-800 font-display mt-0.5">
            {totalEmployees}
          </h2>
          <span className="text-[10px] text-blue-600 font-bold group-hover:underline flex items-center gap-0.5 mt-2 transition-all">
            Manage Staff <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Present Today */}
        <div 
          onClick={() => onNavigate("attendance")}
          className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/40 hover:border-emerald-200 transition-all cursor-pointer group hover:shadow-md"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="p-2 border border-emerald-50 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <UserCheck className="w-5 h-5" />
            </div>
            {isAttendanceMarked && (
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">
                Live
              </span>
            )}
          </div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Present Today
          </p>
          <h2 className="text-2xl font-black text-emerald-600 font-display mt-0.5">
            {isAttendanceMarked ? presentToday : "-"}
          </h2>
          <span className="text-[10px] text-slate-400 font-medium block mt-2">
            Status: {unmarkedToday > 0 ? `${unmarkedToday} Unmarked` : "Complete"}
          </span>
        </div>

        {/* Half Day Today */}
        <div 
          onClick={() => onNavigate("attendance")}
          className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/40 hover:border-amber-200 transition-all cursor-pointer group hover:shadow-md"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="p-2 border border-amber-50 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-all">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Half Days
          </p>
          <h2 className="text-2xl font-black text-amber-600 font-display mt-0.5">
            {isAttendanceMarked ? halfDayToday : "-"}
          </h2>
          <span className="text-[10px] text-slate-400 font-medium block mt-2">
            0.5 Pay Days equivalent
          </span>
        </div>

        {/* Absent Today */}
        <div 
          onClick={() => onNavigate("attendance")}
          className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/40 hover:border-red-200 transition-all cursor-pointer group hover:shadow-md"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="p-2 border border-red-50 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Absents Today
          </p>
          <h2 className="text-2xl font-black text-red-500 font-display mt-0.5">
            {isAttendanceMarked ? absentToday : "-"}
          </h2>
          <span className="text-[10px] text-slate-400 font-medium block mt-2">
            Fills salary deduction logs
          </span>
        </div>
      </div>

      {/* Salary Expense & Quick Access Button */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs uppercase font-extrabold text-blue-600 tracking-wide">
                  Active Month Outflow
                </p>
                <h3 className="text-lg font-bold text-slate-700 mt-0.5">
                  Financial Burden Estimation
                </h3>
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Landmark className="w-5 h-5" />
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Estimated Total Payroll expense for {currentMonthName}
            </p>
            <h1 className="text-3xl font-black text-slate-900 font-mono tracking-tight mt-1">
              {formatCurrency(monthlySalaryExpense)}
            </h1>
            <p className="text-xs text-slate-500 mt-2 leading-snug">
              Includes base pay calculations, overtime allowances, festival/bonus additions, minus accumulated employee advances and auto-salary deductions.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-50">
            <button
              onClick={() => onNavigate("payroll")}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-all"
            >
              Examine Payroll Summary <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Muster Button / Android Action layout */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl text-white flex flex-col justify-between shadow-lg">
          <div>
            <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider rounded">
              MUST-DO FOR THE DAY
            </span>
            <h3 className="text-base font-bold font-display tracking-tight text-white mt-3">
              Muster Roll Terminal
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Open the visual checklist of mechanics, car detailers, and helpers to record attendance for today ({currentDateStr}).
            </p>
          </div>

          <button
            onClick={() => onNavigate("attendance")}
            className="w-full inline-flex items-center justify-between mt-6 px-4 py-3 bg-blue-600 text-white text-xs font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-md shadow-blue-500/20 group active:scale-[0.98] cursor-pointer"
          >
            <span>Launch Quick Attendance</span>
            <span className="p-1 bg-white/20 rounded-full group-hover:translate-x-1 transition-transform">
              <Play className="w-3 h-3 fill-white" />
            </span>
          </button>
        </div>
      </div>

      {/* Staff Muster Roll Detail (Mini Board) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 font-display uppercase tracking-wider">
              Today's Station Crew ({employees.length})
            </h3>
            <p className="text-xs text-slate-400">
              Live status overview of workers clocked in for {currentDateStr}
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full text-slate-500 font-bold font-mono">
            {todayRecords.length} / {totalEmployees} marked
          </span>
        </div>

        {employees.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No employees registered yet. Go to Employees tab to register your garage mechanics.
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-[220px] overflow-y-auto pr-1">
            {employees.map((emp) => {
              const todayRecord = todayRecords.find((r) => r.employeeId === emp.id);
              return (
                <div key={emp.id} className="flex justify-between items-center py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{emp.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {emp.designation} • {emp.dailyWageOption ? "Daily Wages" : "Fixed Monthly Pay"}
                    </p>
                  </div>
                  {todayRecord ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                        todayRecord.status === "PRESENT"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : todayRecord.status === "HALF_DAY"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-red-50 text-red-600 border border-red-100"
                      }`}
                    >
                      {todayRecord.status === "PRESENT" && <b className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {todayRecord.status === "HALF_DAY" && <b className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                      {todayRecord.status === "ABSENT" && <b className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                      {todayRecord.status.replace("_", " ")}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2.5 py-1 bg-slate-50 text-slate-400 border border-slate-100 font-bold rounded-full">
                      Not Clocked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
