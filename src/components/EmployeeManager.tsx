import React, { useState } from "react";
import { Plus, Search, MapPin, Phone, Briefcase, Calendar, Banknote, Edit3, Trash2, ArrowLeft, MoreHorizontal, User, UserCheck, Check, AlertCircle, RefreshCw } from "lucide-react";
import { Employee, AttendanceRecord } from "../types";
import { calculateEmployeeStats, getMonthDaysCount } from "../utils/db";

interface EmployeeManagerProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  onAddEmployee: (emp: Omit<Employee, "id" | "isActive">) => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  showToast: (msg: string, isError?: boolean) => void;
}

type ViewMode = "LIST" | "ADD" | "EDIT" | "PROFILE";

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  employees,
  attendance,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  showToast,
}) => {
  const [mode, setMode] = useState<ViewMode>("LIST");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Year/Month state for Profile Individual Calendar view
  const [profileMonth, setProfileMonth] = useState("2026-06");

  // Form states
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [designation, setDesignation] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("15000");
  const [dailyWageOption, setDailyWageOption] = useState(false);

  const resetForm = () => {
    setName("");
    setMobileNumber("");
    setAddress("");
    setJoiningDate(new Date().toISOString().split("T")[0]);
    setDesignation("");
    setMonthlySalary("12000");
    setDailyWageOption(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setMode("ADD");
  };

  const handleOpenEdit = (emp: Employee) => {
    setName(emp.name);
    setMobileNumber(emp.mobileNumber);
    setAddress(emp.address);
    setJoiningDate(emp.joiningDate);
    setDesignation(emp.designation);
    setMonthlySalary(String(emp.monthlySalary));
    setDailyWageOption(emp.dailyWageOption);
    setSelectedEmp(emp);
    setMode("EDIT");
  };

  const handleOpenProfile = (emp: Employee) => {
    setSelectedEmp(emp);
    setMode("PROFILE");
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobileNumber.trim() || !designation.trim() || !monthlySalary) {
      showToast("Please fill all mandatory fields", true);
      return;
    }
    const payNum = parseFloat(monthlySalary);
    if (isNaN(payNum) || payNum <= 0) {
      showToast("Wage/Salary must be a positive number", true);
      return;
    }

    onAddEmployee({
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      address: address.trim(),
      joiningDate,
      designation: designation.trim(),
      monthlySalary: payNum,
      dailyWageOption,
    });
    setMode("LIST");
    resetForm();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    if (!name.trim() || !mobileNumber.trim() || !designation.trim() || !monthlySalary) {
      showToast("Please fill all mandatory fields", true);
      return;
    }
    const payNum = parseFloat(monthlySalary);
    if (isNaN(payNum) || payNum <= 0) {
      showToast("Wage/Salary must be a positive number", true);
      return;
    }

    onEditEmployee({
      ...selectedEmp,
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      address: address.trim(),
      joiningDate,
      designation: designation.trim(),
      monthlySalary: payNum,
      dailyWageOption,
    });
    setMode("LIST");
    resetForm();
  };

  const handleDelete = (id: string, empName: string) => {
    // Custom non-blocking confirm overlay or direct prompt
    const confirmDelete = window.confirm(`Are you absolutely sure you want to remove ${empName} from the database? This action will wipe their profiles but preserve past calculations.`);
    if (confirmDelete) {
      onDeleteEmployee(id);
      if (selectedEmp?.id === id) {
        setMode("LIST");
      }
    }
  };

  // Searching filter
  const filteredEmployees = employees.filter((e) => {
    if (!e.isActive) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return e.name.toLowerCase().includes(q) || e.mobileNumber.includes(q) || e.designation.toLowerCase().includes(q);
  });

  // Calendar rendering math for Profile page
  const renderProfileCalendar = (emp: Employee) => {
    const [yearStr, monthStr] = profileMonth.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const totalDays = getMonthDaysCount(year, month);
    // Find first day of month (0 = Sun, 1 = Mon ... )
    const firstDayIndex = new Date(year, month - 1, 1).getDay();

    const blanks = Array(firstDayIndex).fill(null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const gridElements = [...blanks, ...days];

    return (
      <div className="space-y-4">
        {/* Month Dropdown Selector */}
        <div className="flex gap-2 items-center">
          <label className="text-xs font-bold text-slate-500 uppercase">Select Month:</label>
          <select
            value={profileMonth}
            onChange={(e) => setProfileMonth(e.target.value)}
            className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="2026-06">June 2026</option>
            <option value="2026-05">May 2026</option>
            <option value="2026-04">April 2026</option>
            <option value="2026-03">March 2026</option>
            <option value="2025-12">December 2025</option>
          </select>
        </div>

        {/* Attendance Grid Calendar */}
        <div className="border border-slate-100 rounded-2xl bg-slate-50 p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {gridElements.map((day, idx) => {
              if (day === null) {
                return <div key={`blank-${idx}`} className="h-9"></div>;
              }

              const dateStr = `${profileMonth}-${String(day).padStart(2, "0")}`;
              const record = attendance.find((r) => r.employeeId === emp.id && r.date === dateStr);

              let bgClass = "bg-white text-slate-700 border border-slate-100";
              let badgeChar = "";

              if (record) {
                if (record.status === "PRESENT") {
                  bgClass = "bg-emerald-500 text-white font-bold";
                  badgeChar = "P";
                } else if (record.status === "ABSENT") {
                  bgClass = "bg-red-500 text-white font-bold";
                  badgeChar = "A";
                } else if (record.status === "HALF_DAY") {
                  bgClass = "bg-amber-500 text-white font-bold";
                  badgeChar = "H";
                }
              }

              return (
                <div
                  key={`day-${day}`}
                  className={`h-9 flex flex-col items-center justify-center rounded-xl text-xs relative select-none ${bgClass}`}
                  title={`${dateStr}: ${record ? record.status : "No record"}`}
                >
                  <span className="font-semibold">{day}</span>
                  {badgeChar && (
                    <span className="text-[7px] absolute bottom-0.5 opacity-90 scale-90">
                      {badgeChar}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Checklist Guide */}
        <div className="flex gap-4 justify-center text-[10px] font-bold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <b className="w-2 h-2 rounded bg-emerald-500" /> Present (P)
          </span>
          <span className="inline-flex items-center gap-1">
            <b className="w-2 h-2 rounded bg-amber-500" /> Half Day (H)
          </span>
          <span className="inline-flex items-center gap-1">
            <b className="w-2 h-2 rounded bg-red-500" /> Absent (A)
          </span>
          <span className="inline-flex items-center gap-1">
            <b className="w-2 h-2 rounded bg-white border border-slate-200" /> Unmarked
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR FOR LIST */}
      {mode === "LIST" && (
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-wrap gap-3">
          <div>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wider font-display">
              Garage Staff Directory
            </h2>
            <p className="text-xs text-slate-400">
              Manage profiles, designations, and wages ({employees.length} entries)
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/15 cursor-pointer active:scale-95 transition-all text-center"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      )}

      {/* RENDER LIST VIEW */}
      {mode === "LIST" && (
        <>
          {/* SEARCH BAR */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-3 bg-white border border-slate-150 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-slate-800 placeholder-slate-400"
              placeholder="Search garage mechanics, advisors, car detailers by name, mobile, role..."
            />
          </div>

          {/* LIST GRID */}
          {filteredEmployees.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <User className="w-12 h-12 text-slate-350 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">No active garage staff found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery ? "Try altering the search filters" : "Register your mechanics using the button above"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group cursor-pointer"
                  onClick={() => handleOpenProfile(emp)}
                >
                  <div>
                    {/* Role Header */}
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-extrabold uppercase tracking-widest rounded-md">
                          {emp.designation}
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-800 group-hover:text-blue-700 transition-colors mt-2 truncate">
                          {emp.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium font-mono">
                          {emp.id}
                        </p>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-xl transition-colors"
                          title="Edit Profile"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.name)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Meta contacts */}
                    <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{emp.mobileNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 truncate" />
                        <span className="truncate max-w-[200px]">{emp.address || "No Address Added"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial stats */}
                  <div className="mt-6 pt-3.5 border-t border-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Wage Plan</p>
                      <p className="font-extrabold text-slate-700 mt-0.5">
                        {emp.dailyWageOption ? "Daily Wages" : "Fixed Monthly Pay"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 uppercase font-bold">
                        {emp.dailyWageOption ? "Daily Rate" : "Monthly Rate"}
                      </p>
                      <p className="font-black text-blue-600 mt-0.5">
                        ₹{emp.monthlySalary.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* RENDER ADD / EDIT FORM VIEW */}
      {(mode === "ADD" || mode === "EDIT") && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6">
          <div className="flex items-center gap-2.5 mb-6.5">
            <button
              onClick={() => setMode("LIST")}
              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-black text-slate-800 font-display">
                {mode === "ADD" ? "Register New Crew Member" : "Modify Staff Profile"}
              </h2>
              <p className="text-xs text-slate-400">
                Ensure exact records to automate correct payroll deductions
              </p>
            </div>
          </div>

          <form onSubmit={mode === "ADD" ? handleSaveAdd : handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 pl-1">
                  Employee Full Name *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 font-semibold"
                    placeholder="e.g. Ramesh Kumar Patel"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 pl-1">
                  Mobile Contact Number *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 font-mono font-semibold"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 pl-1">
                  Designation / Role *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 font-semibold"
                    placeholder="e.g. Chief Mechanic, Car Detailer, Helper"
                  />
                </div>
              </div>

              {/* Joining Date */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 pl-1">
                  Joining Station Date *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 pl-1">
                Residential Address
              </label>
              <div className="relative">
                <span className="absolute top-3 left-3.5 text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 font-semibold h-18 resize-none"
                  placeholder="Street name, Sector number, landmark..."
                />
              </div>
            </div>

            {/* Payroll Wage Scheme */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-4">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Salary Scheme Rules
              </h3>

              <div className="flex gap-4">
                <label className="flex-1 p-3 flex items-center justify-between bg-white rounded-xl border border-slate-200 cursor-pointer select-none">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="wage_scheme"
                      checked={!dailyWageOption}
                      onChange={() => setDailyWageOption(false)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">Fixed Monthly Salary</p>
                      <p className="text-[10px] text-slate-400">Standard monthly base pays</p>
                    </div>
                  </div>
                </label>

                <label className="flex-1 p-3 flex items-center justify-between bg-white rounded-xl border border-slate-200 cursor-pointer select-none">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="wage_scheme"
                      checked={dailyWageOption}
                      onChange={() => setDailyWageOption(true)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">Daily Wages Plan</p>
                      <p className="text-[10px] text-slate-400">Payable based on daily muster</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Salary Numerical Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 pl-1">
                  {dailyWageOption ? "Daily Wage Rate (₹ per day) *" : "Monthly Base Salary (₹ per month) *"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Banknote className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    required
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-blue-600 font-mono font-extrabold"
                    placeholder={dailyWageOption ? "e.g. 500" : "e.g. 18000"}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 pl-1 leading-snug">
                  {dailyWageOption 
                    ? "Worker gets paid Daily Wage multiplied by exact Payable Days. No pay for absent days." 
                    : "Deductions of (Base Wage / days) * absent days apply based on actual month duration."}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setMode("LIST")}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all text-xs"
              >
                Cancel
              </button>
              <button
                id="employee-form-submit"
                type="submit"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all text-xs shadow-md shadow-blue-600/10"
              >
                {mode === "ADD" ? "Complete Registration" : "Save Configurations"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RENDER EMPLOYEE PROFILE (INDIVIDUAL PAGE) */}
      {mode === "PROFILE" && selectedEmp && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-5.5">
              <button
                onClick={() => setMode("LIST")}
                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base font-black text-slate-800 font-display uppercase tracking-wider">
                  Employee Dashboard Detail
                </h2>
                <p className="text-xs text-slate-400">
                  Profile card, performance track scorecard and calendar
                </p>
              </div>
            </div>

            {/* Profile Header Block */}
            <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black text-xl shadow-inner uppercase">
                {selectedEmp.name.substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-extrabold uppercase tracking-widest rounded-md">
                  {selectedEmp.designation}
                </span>
                <h2 className="text-lg font-black text-slate-800 font-display mt-1 tracking-tight">
                  {selectedEmp.name}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID Token: {selectedEmp.id} • Registered {new Date(selectedEmp.joiningDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </p>
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleOpenEdit(selectedEmp)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Edit profile
                </button>
                <button
                  onClick={() => handleDelete(selectedEmp.id, selectedEmp.name)}
                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-150 text-xs font-bold rounded-xl transition-all"
                >
                  Terminate
                </button>
              </div>
            </div>

            {/* Bio stats list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[9px] uppercase font-bold text-slate-400">Mobile Phone</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">{selectedEmp.mobileNumber}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[9px] uppercase font-bold text-slate-400">Salary Model</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {selectedEmp.dailyWageOption ? "Daily Wages (₹" + selectedEmp.monthlySalary + "/day)" : "Fixed Monthly (₹" + selectedEmp.monthlySalary + "/month)"}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[9px] uppercase font-bold text-slate-400">Postal Address</p>
                <p className="text-xs font-bold text-slate-750 mt-0.5 truncate" title={selectedEmp.address}>
                  {selectedEmp.address || "Not Configured"}
                </p>
              </div>
            </div>
          </div>

          {/* ATTENDANCE ACCUMULATED SCORECARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm md:col-span-1 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest font-display">
                Muster Scorecard
              </h3>
              
              {(() => {
                const stats = calculateEmployeeStats(selectedEmp.id, profileMonth, attendance);
                return (
                  <div className="space-y-4.5">
                    {/* Circle diagram representing percentage */}
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center relative w-24 h-24 rounded-full bg-slate-50 border-4 border-slate-100 shadow-inner mb-2">
                        <div className="text-center">
                          <p className="text-xl font-black text-blue-600 font-display">{stats.attendancePercentage}%</p>
                          <p className="text-[8px] text-slate-400 uppercase font-black tracking-wide">Attd-Rate</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center py-1 border-b border-slate-50 text-xs text-slate-600">
                        <span>Presents logged</span>
                        <span className="font-extrabold text-emerald-600">{stats.presentCount} Days</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-50 text-xs text-slate-600">
                        <span>Half Days logged</span>
                        <span className="font-extrabold text-amber-500">{stats.halfDayCount} Days</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-50 text-xs text-slate-600">
                        <span>Absents logged</span>
                        <span className="font-extrabold text-red-500">{stats.absentCount} Days</span>
                      </div>
                      <div className="flex justify-between items-center py-1 text-xs text-slate-600 font-bold bg-blue-50/50 p-2 rounded-xl">
                        <span>Payable Duty Days</span>
                        <span className="text-blue-700 font-black">{stats.payableDays} Days</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ATTENDANCE MONTHLY CALENDAR VIEW FIELD */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm md:col-span-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest font-display mb-4">
                Muster Calendar View
              </h3>
              {renderProfileCalendar(selectedEmp)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
