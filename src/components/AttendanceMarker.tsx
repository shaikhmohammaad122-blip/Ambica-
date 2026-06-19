import React, { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Search, Check, X, AlertCircle, RefreshCw, ClipboardCheck, Filter, UserCheck, AlertTriangle } from "lucide-react";
import { Employee, AttendanceRecord, AttendanceStatus } from "../types";

interface AttendanceMarkerProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  onMarkAttendance: (employeeId: string, date: string, status: AttendanceStatus) => void;
  onClearAttendance: (employeeId: string, date: string) => void;
  showToast: (msg: string, isError?: boolean) => void;
}

export const AttendanceMarker: React.FC<AttendanceMarkerProps> = ({
  employees,
  attendance,
  onMarkAttendance,
  onClearAttendance,
  showToast,
}) => {
  // Active date selection state (defaults to today's date in local perspective)
  const [activeDate, setActiveDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PRESENT" | "ABSENT" | "HALF_DAY" | "UNMARKED">("ALL");

  const activeEmployees = employees.filter((e) => e.isActive);

  // Date scrubbing helpers (stepping back or forward)
  const stepDate = (amount: number) => {
    const d = new Date(activeDate);
    d.setDate(d.getDate() + amount);
    setActiveDate(d.toISOString().split("T")[0]);
  };

  // Status mapping
  const activeRecords = attendance.filter((r) => r.date === activeDate);
  const totalMarked = activeRecords.length;
  const unmarkedCount = activeEmployees.length - totalMarked;

  const handleMark = (empId: string, status: AttendanceStatus) => {
    onMarkAttendance(empId, activeDate, status);
  };

  const handleClear = (empId: string) => {
    onClearAttendance(empId, activeDate);
  };

  // Filtering list
  const processedEmployees = activeEmployees.filter((emp) => {
    // Search query
    const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) || 
                        emp.designation.toLowerCase().includes(searchTerm.toLowerCase().trim());
    
    if (!matchSearch) return false;

    // Status filter
    const record = activeRecords.find((r) => r.employeeId === emp.id);
    if (filterStatus === "ALL") return true;
    if (filterStatus === "UNMARKED") return !record;
    return record?.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Muster header banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wider font-display">
              Daily Attendance Ledger
            </h2>
            <p className="text-xs text-slate-400">
              Muster daily sheets. Records are automatically persistent and recalculate salary slips.
            </p>
          </div>
          <div className="inline-flex items-center bg-blue-50/50 p-2 border border-blue-100 rounded-xl text-blue-850 font-bold text-xs gap-1.5 shadow-inner">
            <ClipboardCheck className="w-4 h-4 text-blue-600" />
            <span>Marked: {totalMarked} / {activeEmployees.length} Workers</span>
          </div>
        </div>

        {/* Date Selector Scrubbing Controls */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-2 max-w-sm mx-auto shadow-inner">
          <button
            onClick={() => stepDate(-1)}
            className="p-2 bg-white border border-slate-200 text-slate-650 hover:bg-slate-100 active:scale-95 transition-all rounded-xl shadow-sm cursor-pointer"
            title="Yesterday"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <CalendarDays className="w-4.5 h-4.5 text-blue-600" />
            <input
              type="date"
              value={activeDate}
              onChange={(e) => {
                if (e.target.value) setActiveDate(e.target.value);
              }}
              className="bg-transparent border-none text-xs font-black font-mono text-slate-800 focus:outline-none cursor-pointer outline-none text-center"
            />
          </div>

          <button
            onClick={() => stepDate(1)}
            className="p-2 bg-white border border-slate-200 text-slate-650 hover:bg-slate-100 active:scale-95 transition-all rounded-xl shadow-sm cursor-pointer"
            title="Tomorrow"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS BUTTON GROUP */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400 font-semibold"
            placeholder="Search mechanics by name or role..."
          />
        </div>

        {/* Filter Quick-Buttons */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 font-bold select-none text-[10px]">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-2 rounded-xl border transition-all truncate cursor-pointer ${
              filterStatus === "ALL"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm font-black"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            All ({activeEmployees.length})
          </button>
          <button
            onClick={() => setFilterStatus("PRESENT")}
            className={`px-3 py-2 rounded-xl border transition-all truncate cursor-pointer ${
              filterStatus === "PRESENT"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm font-black"
                : "bg-white text-emerald-600 border-slate-200 hover:bg-emerald-50/50"
            }`}
          >
            Present ({activeRecords.filter((r) => r.status === "PRESENT").length})
          </button>
          <button
            onClick={() => setFilterStatus("HALF_DAY")}
            className={`px-3 py-2 rounded-xl border transition-all truncate cursor-pointer ${
              filterStatus === "HALF_DAY"
                ? "bg-amber-505 bg-amber-500 text-white border-amber-500 shadow-sm font-black"
                : "bg-white text-amber-500 border-slate-200 hover:bg-amber-50/50"
            }`}
          >
            Half ({activeRecords.filter((r) => r.status === "HALF_DAY").length})
          </button>
          <button
            onClick={() => setFilterStatus("ABSENT")}
            className={`px-3 py-2 rounded-xl border transition-all truncate cursor-pointer ${
              filterStatus === "ABSENT"
                ? "bg-red-600 text-white border-red-600 shadow-sm font-black"
                : "bg-white text-red-500 border-slate-200 hover:bg-red-50/50"
            }`}
          >
            Absent ({activeRecords.filter((r) => r.status === "ABSENT").length})
          </button>
          <button
            onClick={() => setFilterStatus("UNMARKED")}
            className={`px-3 py-2 rounded-xl border transition-all truncate cursor-pointer ${
              filterStatus === "UNMARKED"
                ? "bg-slate-700 text-white border-slate-700 shadow-sm font-black"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Unmarked ({unmarkedCount})
          </button>
        </div>
      </div>

      {/* CLOCK-IN LEDGER WORKER CARDS */}
      {processedEmployees.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">No Mechanics Fit active filter</h4>
          <p className="text-xs text-slate-450 mt-1">
            Try resetting your status button toggles. Yes, we have {activeEmployees.length} staff total registered.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {processedEmployees.map((emp) => {
            const record = activeRecords.find((r) => r.employeeId === emp.id);
            const status = record?.status;

            return (
              <div
                key={emp.id}
                className="bg-white border border-slate-100 rounded-3xl shadow-sm p-4 flex flex-col md:flex-row items-stretch justify-between gap-4 relative overflow-hidden group hover:border-slate-200 transition-all"
              >
                {/* Visual Status strip left */}
                <div
                  className={`absolute top-0 bottom-0 left-0 w-1.5 transition-all ${
                    status === "PRESENT"
                      ? "bg-emerald-500"
                      : status === "HALF_DAY"
                      ? "bg-amber-500"
                      : status === "ABSENT"
                      ? "bg-red-500"
                      : "bg-slate-100"
                  }`}
                />

                {/* Left block: worker info */}
                <div className="flex items-center gap-3.5 pl-2.5 flex-1 min-w-0">
                  <div className="h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 text-slate-650 flex items-center justify-center font-black text-sm uppercase">
                    {emp.name.substring(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-extrabold text-slate-850 truncate group-hover:text-blue-700 transition-colors">
                      {emp.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 truncate">
                      {emp.designation} • {emp.dailyWageOption ? "Daily Wages (₹" + emp.monthlySalary + ")" : "Fixed Monthly Pay"}
                    </p>
                  </div>
                </div>

                {/* Right block: Clock actions (Large comfortable touch targets) */}
                <div className="flex items-center gap-2 justify-end self-end md:self-center pr-1.5 select-none">
                  {/* Mark Present */}
                  <button
                    onClick={() => handleMark(emp.id, "PRESENT")}
                    className={`py-3 px-3.5 rounded-2xl border flex items-center gap-1.5 font-bold text-[10px] transition-all cursor-pointer active:scale-95 ${
                      status === "PRESENT"
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10 font-black"
                        : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100/50"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    <span>Present</span>
                  </button>

                  {/* Mark Half Day */}
                  <button
                    onClick={() => handleMark(emp.id, "HALF_DAY")}
                    className={`py-3 px-3.5 rounded-2xl border flex items-center gap-1.5 font-bold text-[10px] transition-all cursor-pointer active:scale-[0.95] ${
                      status === "HALF_DAY"
                        ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/10 font-black"
                        : "bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100/50"
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Half Day</span>
                  </button>

                  {/* Mark Absent */}
                  <button
                    onClick={() => handleMark(emp.id, "ABSENT")}
                    className={`py-3 px-3.5 rounded-2xl border flex items-center gap-1.5 font-bold text-[10px] transition-all cursor-pointer active:scale-[0.95] ${
                      status === "ABSENT"
                        ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-500/10 font-black"
                        : "bg-red-50 border-red-100 text-red-700 hover:bg-red-100/50"
                    }`}
                  >
                    <X className="w-3.5 h-3.5 stroke-[3px]" />
                    <span>Absent</span>
                  </button>

                  {/* Clear selection */}
                  {status && (
                    <button
                      onClick={() => handleClear(emp.id)}
                      className="p-3 border border-slate-200 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                      title="Clear attendance status"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
