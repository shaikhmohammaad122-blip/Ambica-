import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { Banknote, FileSpreadsheet, Download, Plus, Trash2, Calendar, Search, ArrowRight, UserCheck, CheckCircle2, ChevronRight, X, Sparkles, Receipt, Coins, CalendarDays } from "lucide-react";
import { Employee, AttendanceRecord, SalarySlip, AdvanceSalaryEntry } from "../types";
import { calculateEmployeeStats, calculatePay, convertToCSV, downloadCSVFile } from "../utils/db";

interface PayrollManagerProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  salarySlips: SalarySlip[];
  advances: AdvanceSalaryEntry[];
  garageName: string;
  onUpdateSalarySlip: (slip: SalarySlip) => void;
  onAddAdvance: (adv: Omit<AdvanceSalaryEntry, "id">) => void;
  onDeleteAdvance: (id: string) => void;
  showToast: (msg: string, isError?: boolean) => void;
}

export const PayrollManager: React.FC<PayrollManagerProps> = ({
  employees,
  attendance,
  salarySlips,
  advances,
  garageName,
  onUpdateSalarySlip,
  onAddAdvance,
  onDeleteAdvance,
  showToast,
}) => {
  const [selectedMonth, setSelectedMonth] = useState("2026-06");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeEmpForEdit, setActiveEmpForEdit] = useState<Employee | null>(null);

  // Individual additions/adjustment state inside edit panel
  const [overtime, setOvertime] = useState("");
  const [bonus, setBonus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING">("PENDING");
  const [notes, setNotes] = useState("");

  // New advance entry state
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [advanceDate, setAdvanceDate] = useState(() => new Date().toISOString().split("T")[0]);

  const activeEmployees = employees.filter((e) => e.isActive);

  // Handle opening employee payroll edit panel
  const handleOpenEdit = (emp: Employee) => {
    setActiveEmpForEdit(emp);
    
    // Check if slip already exists in state
    const matchedSlip = salarySlips.find(
      (s) => s.employeeId === emp.id && s.month === selectedMonth
    );

    if (matchedSlip) {
      setOvertime(String(matchedSlip.overtimeAmount || ""));
      setBonus(String(matchedSlip.bonusAmount || ""));
      setPaymentStatus(matchedSlip.paymentStatus || "PENDING");
      setNotes(matchedSlip.notes || "");
    } else {
      setOvertime("");
      setBonus("");
      setPaymentStatus("PENDING");
      setNotes("");
    }

    // Reset advance inputs
    setAdvanceAmount("");
    setAdvanceNotes("");
  };

  // Save compensation changes
  const handleSaveSalaryAdjustments = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmpForEdit) return;

    const stats = calculateEmployeeStats(activeEmpForEdit.id, selectedMonth, attendance);
    const payDetails = calculatePay(activeEmpForEdit, selectedMonth, stats, advances, salarySlips);

    const updatedSlip: SalarySlip = {
      id: salarySlips.find(s => s.employeeId === activeEmpForEdit.id && s.month === selectedMonth)?.id || `SLIP-${Date.now()}`,
      employeeId: activeEmpForEdit.id,
      month: selectedMonth,
      baseSalaryRate: activeEmpForEdit.monthlySalary,
      dailyWageOption: activeEmpForEdit.dailyWageOption,
      totalPresent: stats.presentCount,
      totalAbsent: stats.absentCount,
      totalHalfDay: stats.halfDayCount,
      payableDays: stats.payableDays,
      attendancePercentage: stats.attendancePercentage,
      calculatedBaseSalary: payDetails.calculatedBaseSalary,
      deductions: payDetails.deductions,
      overtimeAmount: parseFloat(overtime) || 0,
      bonusAmount: parseFloat(bonus) || 0,
      advanceAmount: payDetails.advanceAmount,
      finalSalary: Math.max(0, Math.round(payDetails.calculatedBaseSalary + (parseFloat(overtime) || 0) + (parseFloat(bonus) || 0) - payDetails.advanceAmount)),
      paymentDate: new Date().toISOString().split("T")[0],
      paymentStatus,
      notes,
    };

    onUpdateSalarySlip(updatedSlip);
    showToast(`Salary slip parameters for ${activeEmpForEdit.name} saved successfully!`);
    
    // Refresh panels
    setTimeout(() => {
      // Re-trigger calculation state updates
      handleOpenEdit(activeEmpForEdit);
    }, 100);
  };

  // Add individual advance entry
  const handleAddNewAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmpForEdit) return;
    const amount = parseFloat(advanceAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Advance amount must be a positive number", true);
      return;
    }

    onAddAdvance({
      employeeId: activeEmpForEdit.id,
      date: advanceDate,
      amount,
      notes: advanceNotes.trim() || "Salary Advance",
    });

    showToast(`Salary advance of ₹${amount} logged for ${activeEmpForEdit.name}!`);
    setAdvanceAmount("");
    setAdvanceNotes("");
  };

  // Calculation list matching search query
  const payrollSummaryList = activeEmployees
    .filter((emp) => emp.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    .map((emp) => {
      const stats = calculateEmployeeStats(emp.id, selectedMonth, attendance);
      const matchedSlip = salarySlips.find((s) => s.employeeId === emp.id && s.month === selectedMonth);

      // We override stats logic if custom parameters were saved
      const payDetails = calculatePay(emp, selectedMonth, stats, advances, salarySlips);

      return {
        employee: emp,
        stats,
        payDetails,
        paymentStatus: matchedSlip ? matchedSlip.paymentStatus : ("PENDING" as const),
      };
    });

  // Calculate high-level expense sum of the filtered workers
  const totalPayrollOutflow = payrollSummaryList.reduce((sum, item) => sum + item.payDetails.finalSalary, 0);

  // Generate EXCEL spreadsheet (CSV compliant download)
  const handleExportExcel = () => {
    const headers = [
      "Employee ID",
      "Employee Name",
      "Role",
      "Salary Plan",
      "Present Days",
      "Half Days",
      "Absent Days",
      "Payable Days",
      "Base Salary Rate (Rs)",
      "Calculated Base Salary (Rs)",
      "Overtime (Rs)",
      "Bonus (Rs)",
      "Advances Deducted (Rs)",
      "Automatic Absents Deduction (Rs)",
      "Net Paid Salary (Rs)",
      "Payment Status",
    ];

    const rows = payrollSummaryList.map((item) => [
      item.employee.id,
      item.employee.name,
      item.employee.designation,
      item.employee.dailyWageOption ? "Daily Wages" : "Fixed Monthly Salary",
      item.stats.presentCount,
      item.stats.halfDayCount,
      item.stats.absentCount,
      item.stats.payableDays,
      item.employee.monthlySalary,
      item.payDetails.calculatedBaseSalary,
      item.payDetails.overtimeAmount,
      item.payDetails.bonusAmount,
      item.payDetails.advanceAmount,
      item.payDetails.deductions,
      item.payDetails.finalSalary,
      item.paymentStatus,
    ]);

    const csvContent = convertToCSV(headers, rows);
    const fileName = `Payroll_Report_Ambica_${selectedMonth}.csv`;
    downloadCSVFile(csvContent, fileName);
    showToast(`Excel spreadsheet report downloaded: ${fileName}`);
  };

  // Generate individual PDF receipt style voucher
  const handleDownloadSalarySlipPDF = (emp: Employee) => {
    try {
      const stats = calculateEmployeeStats(emp.id, selectedMonth, attendance);
      const payDetails = calculatePay(emp, selectedMonth, stats, advances, salarySlips);
      const matchedSlip = salarySlips.find((s) => s.employeeId === emp.id && s.month === selectedMonth);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Colors
      const primaryColor = "#1e3a8a"; // blue-900

      // Outer border frame
      doc.setDrawColor(200, 220, 240);
      doc.setLineWidth(1);
      doc.rect(5, 5, 200, 287);

      // Header Brand
      doc.setFillColor(30, 58, 138); // Navy blue background for header
      doc.rect(5, 5, 201, 35, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text(garageName.toUpperCase(), 15, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("AUTO GENERAL REPAIRS & WHEEL CORRECTIONS • IN-TOWN STATION", 15, 26);
      doc.text("MONTHLY SALARY DISBURSEMENT SLIP", 15, 32);

      // Right Side Header Meta
      doc.setFontSize(10);
      doc.text("DATE: " + new Date().toLocaleDateString("en-IN"), 150, 20);
      doc.setFont("helvetica", "bold");
      doc.text("PAY PERIOD: " + selectedMonth, 150, 26);
      doc.setFillColor(255, 255, 255);

      // Employee Information Grid
      doc.setDrawColor(220, 220, 220);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("EMPLOYEE INFORMATION CARD", 15, 52);

      doc.setLineWidth(0.3);
      doc.line(15, 54, 195, 54);

      // Fields
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Employee Code:", 15, 62);
      doc.setFont("helvetica", "bold");
      doc.text(emp.id, 50, 62);

      doc.setFont("helvetica", "normal");
      doc.text("Full Name:", 15, 68);
      doc.setFont("helvetica", "bold");
      doc.text(emp.name, 50, 68);

      doc.setFont("helvetica", "normal");
      doc.text("Designation:", 15, 74);
      doc.setFont("helvetica", "bold");
      doc.text(emp.designation, 50, 74);

      // Column 2 Employees details
      doc.setFont("helvetica", "normal");
      doc.text("Mobile Contact:", 110, 62);
      doc.setFont("helvetica", "bold");
      doc.text(emp.mobileNumber, 150, 62);

      doc.setFont("helvetica", "normal");
      doc.text("Joining Date:", 110, 68);
      doc.setFont("helvetica", "bold");
      doc.text(emp.joiningDate, 150, 68);

      doc.setFont("helvetica", "normal");
      doc.text("Wage Scheme:", 110, 74);
      doc.setFont("helvetica", "bold");
      doc.text(emp.dailyWageOption ? "Daily Wages Mode" : "Monthly Fixed Salary", 150, 74);

      // Attendance Metrics Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("ATTENDANCE SUMMATION FOR THE MONTH", 15, 87);
      doc.line(15, 89, 195, 89);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Present Duty Days:", 15, 96);
      doc.setFont("helvetica", "bold");
      doc.text(String(stats.presentCount), 50, 96);

      doc.setFont("helvetica", "normal");
      doc.text("Half Day clock-ins:", 15, 102);
      doc.setFont("helvetica", "bold");
      doc.text(String(stats.halfDayCount), 50, 102);

      doc.setFont("helvetica", "normal");
      doc.text("Absent Days:", 15, 108);
      doc.setFont("helvetica", "bold");
      doc.text(String(stats.absentCount), 50, 108);

      doc.setFont("helvetica", "normal");
      doc.text("Rate of Pay (₹):", 110, 96);
      doc.setFont("helvetica", "bold");
      doc.text("rs " + emp.monthlySalary.toLocaleString("en-IN"), 150, 96);

      doc.setFont("helvetica", "normal");
      doc.text("Total Payable Days:", 110, 102);
      doc.setFont("helvetica", "bold");
      doc.text(String(stats.payableDays) + " Days", 150, 102);

      doc.setFont("helvetica", "normal");
      doc.text("Attendance Percentage:", 110, 108);
      doc.setFont("helvetica", "bold");
      doc.text(String(stats.attendancePercentage) + "%", 150, 108);

      // Financial Calculation voucher double entry table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("PAYROLL BREAKDOWN LEDGER", 15, 122);
      doc.line(15, 124, 195, 124);

      // Table Header columns
      doc.setFillColor(241, 245, 249);
      doc.rect(15, 129, 180, 8, "F");
      doc.setFontSize(9);
      doc.text("EARNINGS DESCRIPTIONS", 18, 134.5);
      doc.text("AMOUNT (₹)", 75, 134.5);
      doc.text("DEDUCTIONS / OFFSETS", 110, 134.5);
      doc.text("AMOUNT (₹)", 170, 134.5);

      // Table rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      
      // Row 1 Base
      doc.text("Gross Base Pay Scheduled:", 18, 144);
      doc.setFont("helvetica", "bold");
      doc.text(emp.monthlySalary.toLocaleString("en-IN"), 75, 144);
      doc.setFont("helvetica", "normal");
      doc.text("Automatic Absent Deduction:", 110, 144);
      doc.setFont("helvetica", "bold");
      doc.text(payDetails.deductions.toLocaleString("en-IN"), 170, 144);

      // Row 2 Additions
      doc.setFont("helvetica", "normal");
      doc.text("Clocked Overtime (OT):", 18, 151);
      doc.setFont("helvetica", "bold");
      doc.text(payDetails.overtimeAmount.toLocaleString("en-IN"), 75, 151);
      doc.setFont("helvetica", "normal");
      doc.text("Salary Advance Drawn:", 110, 151);
      doc.setFont("helvetica", "bold");
      doc.text(payDetails.advanceAmount.toLocaleString("en-IN"), 170, 151);

      // Row 3 Bonus
      doc.setFont("helvetica", "normal");
      doc.text("Incentives / Bonus:", 18, 158);
      doc.setFont("helvetica", "bold");
      doc.text(payDetails.bonusAmount.toLocaleString("en-IN"), 75, 158);
      doc.text("N/A - Tax/Welfare Offsets:", 110, 158);
      doc.text("0", 170, 158);

      // Under-line double-entry
      doc.setLineWidth(0.1);
      doc.line(15, 163, 195, 163);

      // Totals
      doc.setFont("helvetica", "normal");
      doc.text("Sub-total Additions (A):", 18, 168);
      doc.setFont("helvetica", "bold");
      const subEar = payDetails.calculatedBaseSalary + payDetails.overtimeAmount + payDetails.bonusAmount;
      doc.text(subEar.toLocaleString("en-IN"), 75, 168);

      doc.setFont("helvetica", "normal");
      doc.text("Sub-total Deductions (B):", 110, 168);
      doc.setFont("helvetica", "bold");
      const subDed = payDetails.deductions + payDetails.advanceAmount;
      doc.text(subDed.toLocaleString("en-IN"), 170, 168);

      // Final net pay highlight card
      doc.setFillColor(30, 58, 138); // blue-900 background for final payout box
      doc.rect(15, 175, 180, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("NET PAYABLE SALARY DISBURSED:", 22, 184);
      doc.setFontSize(14);
      doc.setFont("courier", "bold"); // retro terminal currency view
      doc.text("INR " + payDetails.finalSalary.toLocaleString("en-IN") + "/-", 115, 184);

      // Meta notes
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.text("Voucher metadata: " + (matchedSlip?.notes || "Employee worked duty roster faithfully. Cash payment dispersed offline."), 15, 201);
      
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Payment Status: " + (matchedSlip ? matchedSlip.paymentStatus : "PENDING"), 15, 207);

      // Signatures
      doc.setDrawColor(180, 180, 180);
      doc.line(20, 255, 75, 255);
      doc.line(130, 255, 185, 255);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("AUTHORISED SIGNATORY", 28, 260);
      doc.text("EMPLOYEE SIGN-OFF", 142, 260);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.text("Station seal & ledger verified", 31, 264);
      doc.text("Acknowledging cash receipts", 141, 264);

      // Save PDF slip
      doc.save(`${emp.name.toLowerCase().replace(/\s+/g, "_")}_salaryslip_${selectedMonth}.pdf`);
      showToast(`Salary Slip receipt generated and downloaded successfully for ${emp.name}!`);
    } catch (err) {
      console.error("PDF generation failure", err);
      showToast("Could not generate PDF download", true);
    }
  };

  // Generate complete full-month PAYROLL REPORT sheet PDF
  const handleExportPayrollReportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Frame
      doc.setDrawColor(210, 225, 240);
      doc.setLineWidth(0.8);
      doc.rect(5, 5, 287, 200);

      // Title
      doc.setFillColor(30, 58, 138);
      doc.rect(5, 5, 287, 25, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(garageName.toUpperCase() + " • COMPLETE PAYROLL LOG SHEET", 12, 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`MUSTER SUMMARY STATEMENT AND SALARY BURDENS FOR THE CALENDAR MONTH OF: ${selectedMonth.toUpperCase()}`, 12, 20);

      // Date Stamp right top
      doc.setFontSize(9);
      doc.text(`EXCEL SHEET COMPATIBLE • PRINT DATE: ${new Date().toLocaleDateString("en-IN")}`, 200, 14);

      // Table mapping in landscape grid
      doc.setFillColor(241, 245, 249);
      doc.rect(10, 36, 277, 8, "F");

      doc.setTextColor(30, 41, 59);
      doc.setDrawColor(220, 220, 220);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      
      doc.text("CODE", 12, 41);
      doc.text("STAFF MEMBER NAME", 30, 41);
      doc.text("DESIGNATION", 75, 41);
      doc.text("SCHEME", 112, 41);
      doc.text("PRES", 132, 41);
      doc.text("H-DY", 143, 41);
      doc.text("ABST", 155, 41);
      doc.text("PAY-DYS", 168, 41);
      doc.text("BASE-RTE", 185, 41);
      doc.text("NET-PAY (₹)", 212, 41);
      doc.text("STATUS", 244, 41);
      doc.text("AUDIT SIGN-OFF", 262, 41);

      doc.setLineWidth(0.2);
      doc.line(10, 44, 287, 44);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);

      let lineY = 49;
      payrollSummaryList.forEach((item) => {
        if (lineY > 185) {
          doc.addPage();
          // Frame new page
          doc.setDrawColor(210, 225, 240);
          doc.setLineWidth(0.8);
          doc.rect(5, 5, 287, 200);

          doc.setFillColor(30, 58, 138);
          doc.rect(3, 3, 281, 20, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.text("CONTD: AMBICA PAYROLL STATUS", 10, 12);
          
          doc.setFillColor(241, 245, 249);
          doc.rect(10, 28, 277, 8, "F");
          doc.setTextColor(30, 41, 59);
          doc.setFontSize(8);
          doc.text("CODE", 12, 33);
          doc.text("STAFF MEMBER NAME", 35, 33);
          doc.text("NET-PAY (₹)", 212, 33);
          doc.text("STATUS", 244, 33);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          lineY = 41;
        }

        doc.text(item.employee.id, 12, lineY);
        // Truncate name
        const displayName = item.employee.name.length > 20 ? item.employee.name.substring(0, 18) + ".." : item.employee.name;
        doc.text(displayName, 30, lineY);
        doc.text(item.employee.designation, 75, lineY);
        doc.text(item.employee.dailyWageOption ? "Daily Wages" : "Fixed Monthly", 112, lineY);
        doc.text(String(item.stats.presentCount), 133, lineY);
        doc.text(String(item.stats.halfDayCount), 144, lineY);
        doc.text(String(item.stats.absentCount), 156, lineY);
        doc.text(String(item.stats.payableDays), 169, lineY);
        doc.text(item.employee.monthlySalary.toLocaleString("en-IN"), 185, lineY);
        
        doc.setFont("helvetica", "bold");
        doc.text("₹" + item.payDetails.finalSalary.toLocaleString("en-IN"), 212, lineY);
        doc.text(item.paymentStatus, 244, lineY);
        doc.setFont("helvetica", "normal");

        doc.setDrawColor(240, 240, 240);
        doc.line(10, lineY + 2, 287, lineY + 2);

        lineY += 6.8;
      });

      // Print total sum footer in page bottom
      doc.setFillColor(30, 58, 138);
      doc.rect(10, 175, 277, 12, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("TOTAL DISBURSED SALARY POOL SUM:", 15, 182.5);
      doc.setFontSize(11);
      doc.setFont("courier", "bold");
      doc.text("INR " + totalPayrollOutflow.toLocaleString("en-IN") + "/-", 95, 182.5);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.text("System logs audit compiled fully. This document acts as an industrial financial ledger proof.", 185, 182);

      doc.save(`payroll_summary_report_ambica_${selectedMonth}.pdf`);
      showToast(`Comprehensive Payroll PDF statement exported for ${selectedMonth}!`);
    } catch (err) {
      console.error(err);
      showToast("Failure exporting landscaped ledger PDF", true);
    }
  };

  return (
    <div className="space-y-6">
      {/* PAYROLL MANAGER PORTAL HEADER CARDS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wider font-display">
              Automated Payroll Dashboard
            </h2>
            <p className="text-xs text-slate-400">
              Calculate wages, record overtime and cash advances, issue PDF and Excel statements
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Muster Month:</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 pointer-events-none">
                <Calendar className="w-3.5 h-3.5" />
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setActiveEmpForEdit(null); // Deselect on changing month to reflect correct recalculated states
                }}
                className="text-xs font-black bg-slate-100 border border-slate-200 rounded-xl pl-8 pr-2.5 py-2 text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="2026-06">June 2026</option>
                <option value="2026-05">May 2026</option>
                <option value="2026-04">April 2026</option>
                <option value="2026-03">March 2026</option>
                <option value="2025-12">December 2025</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global actions: Excel, PDF Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-50">
          <p className="text-xs font-bold text-slate-650">
            Total Ledger Incurred: <span className="font-mono text-blue-700 font-extrabold text-sm ml-1">₹{totalPayrollOutflow.toLocaleString("en-IN")}</span>
          </p>

          <div className="flex flex-wrap gap-2 select-none">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-220 hover:bg-slate-50 hover:border-slate-350 text-slate-700 text-[11px] font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleExportPayrollReportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-220 hover:bg-slate-50 hover:border-slate-350 text-slate-700 text-[11px] font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-red-500" />
              <span>Export Payroll PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH AND TWO COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT TWO COLUMNS: SEARCH AND STAFF CALCULATIONS LEDGER */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-3 bg-white border border-slate-150 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm text-slate-800 placeholder-slate-400"
              placeholder="Filter workers in active month..."
            />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
            {payrollSummaryList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No active mechanics matching the query. Add personnel under Employees tab.
              </div>
            ) : (
              payrollSummaryList.map(({ employee, stats, payDetails, paymentStatus: paySt }) => {
                const isActivePanel = activeEmpForEdit?.id === employee.id;

                return (
                  <div
                    key={employee.id}
                    className={`p-4 transition-all hover:bg-slate-50/50 cursor-pointer flex justify-between items-center flex-wrap sm:flex-nowrap gap-4 ${
                      isActivePanel ? "bg-blue-50/20 border-l-4 border-blue-600 pl-3 md:pl-3" : ""
                    }`}
                    onClick={() => handleOpenEdit(employee)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-slate-850 truncate">{employee.name}</h4>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                          {employee.id}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                        {employee.designation} • Payable: {stats.payableDays} Days ({stats.attendancePercentage}%)
                      </p>
                    </div>

                    {/* Numeric and actions buttons */}
                    <div className="flex items-center gap-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-black">Net Cash</p>
                        <p className="font-mono text-xs font-black text-slate-800">
                          ₹{payDetails.finalSalary.toLocaleString("en-IN")}
                        </p>
                      </div>

                      {/* Payment Status Stamp */}
                      <div>
                        {paySt === "PAID" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded-full border border-emerald-100">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase rounded-full border border-indigo-100">
                            Unpaid
                          </span>
                        )}
                      </div>

                      {/* PDF download direct action */}
                      <button
                        onClick={() => handleDownloadSalarySlipPDF(employee)}
                        className="p-2 border border-slate-200 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-50 hover:border-slate-350 transition-all cursor-pointer"
                        title="Download PDF slip direct"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-slate-350" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SINGLE WORKER SALARY ADJUSTMENTS DRAWER FIELD */}
        <div className="space-y-6">
          {activeEmpForEdit ? (
            <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-md shadow-slate-100/40 space-y-6 animate-fade-in">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div className="min-w-0">
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-black uppercase tracking-wider rounded">
                    SLIP ADJUSTER
                  </span>
                  <h3 className="text-sm font-black text-slate-800 font-display mt-1.5 truncate">
                    {activeEmpForEdit.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium font-mono">
                    Compiling Period: {selectedMonth}
                  </p>
                </div>
                <button
                  onClick={() => setActiveEmpForEdit(null)}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Attendance metrics check overview */}
              {(() => {
                const stats = calculateEmployeeStats(activeEmpForEdit.id, selectedMonth, attendance);
                const calc = calculatePay(activeEmpForEdit, selectedMonth, stats, advances, salarySlips);

                return (
                  <div className="space-y-5">
                    {/* Raw automatic stats block */}
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-650 space-y-2">
                      <div className="flex justify-between">
                        <span>Attendance Ledger Stats:</span>
                        <span className="font-bold text-slate-800">{stats.presentCount}P • {stats.halfDayCount}H • {stats.absentCount}A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Audited Pay Days:</span>
                        <span className="font-bold text-blue-700">{stats.payableDays} Days ({stats.attendancePercentage}%)</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-150 pt-2 text-slate-500">
                        <span>Base calculated pay:</span>
                        <span className="font-bold text-slate-700">₹{calc.calculatedBaseSalary.toLocaleString("en-IN")}</span>
                      </div>
                      {!activeEmpForEdit.dailyWageOption && calc.deductions > 0 && (
                        <div className="flex justify-between text-red-500 font-semibold">
                          <span>Absent Penalties deducted:</span>
                          <span>- ₹{calc.deductions.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>

                    {/* OVERTIME & BONUS ADJUSTMENTS FORM */}
                    <form onSubmit={handleSaveSalaryAdjustments} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Overtime */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Overtime (Rs)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={overtime}
                            onChange={(e) => setOvertime(e.target.value)}
                            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-slate-800 font-semibold placeholder-slate-400"
                            placeholder="e.g. 1500"
                          />
                        </div>

                        {/* Bonus */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Bonus / Incentives
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={bonus}
                            onChange={(e) => setBonus(e.target.value)}
                            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-slate-800 font-semibold placeholder-slate-400"
                            placeholder="e.g. 500"
                          />
                        </div>
                      </div>

                      {/* Pay Voucher Memo text notes */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Voucher Audit Memo Notes
                        </label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-semibold placeholder-slate-400"
                          placeholder="e.g. Cash handed over faithfully"
                        />
                      </div>

                      {/* Payment status dropdown */}
                      <div className="flex gap-2 items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Disbursed status:</label>
                        <button
                          type="button"
                          onClick={() => setPaymentStatus(prev => prev === "PAID" ? "PENDING" : "PAID")}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                            paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-black"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200 font-black"
                          }`}
                        >
                          {paymentStatus}
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-950 text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer shadow-sm text-center"
                      >
                        Commit Slip Adjustments
                      </button>
                    </form>

                    {/* INTERACTIVE SALARY ADVANCE SUB-SECTION */}
                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <div className="flex justify-between items-center select-none">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Log Advance draws
                        </h4>
                        <span className="p-1 text-[9px] bg-red-50 text-red-600 rounded font-black uppercase font-mono">
                          Curr-Month Total: -₹{calc.advanceAmount}
                        </span>
                      </div>

                      {/* New Advance Entry form inside drawer */}
                      <form onSubmit={handleAddNewAdvance} className="space-y-3 bg-red-50/10 p-3 rounded-2xl border border-red-50">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Amount */}
                          <div>
                            <input
                              type="number"
                              required
                              value={advanceAmount}
                              onChange={(e) => setAdvanceAmount(e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono text-red-600 font-semibold"
                              placeholder="Amount (₹)"
                            />
                          </div>

                          {/* Date */}
                          <div>
                            <input
                              type="date"
                              required
                              value={advanceDate}
                              onChange={(e) => setAdvanceDate(e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-slate-700 select-none cursor-pointer font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={advanceNotes}
                            onChange={(e) => setAdvanceNotes(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-semibold placeholder-slate-400"
                            placeholder="Reason for advance draws..."
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 px-3 bg-red-650 hover:bg-red-700 text-white font-bold text-[10px] rounded-lg transition-all shadow-sm shadow-red-500/10 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Deduct Cash Advance
                        </button>
                      </form>

                      {/* Selected Employee's cumulative advances list in active month */}
                      {(() => {
                        const monthlyEmployeeAdvances = advances.filter(
                          (a) => a.employeeId === activeEmpForEdit.id && a.date.startsWith(selectedMonth)
                        );

                        if (monthlyEmployeeAdvances.length > 0) {
                          return (
                            <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-50">
                              {monthlyEmployeeAdvances.map((adv) => (
                                <div key={adv.id} className="flex justify-between items-center text-[10px] text-slate-500 py-1.5">
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-700 truncate">{adv.notes}</p>
                                    <p className="text-[8px] font-mono text-slate-400">
                                      {new Date(adv.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold font-mono text-red-500">-₹{adv.amount}</span>
                                    <button
                                      onClick={() => {
                                        if (window.confirm("Delete this advance draw record? Final cash pay will recalculate instantly.")) {
                                          onDeleteAdvance(adv.id);
                                          showToast("Advance record erased.");
                                        }
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[300px]">
              <Receipt className="w-10 h-10 text-slate-300 mb-2" />
              <p className="font-bold text-slate-550 uppercase mb-1">Slip Adjuster Panel</p>
              <p className="max-w-[180px] leading-relaxed">
                Click on any worker's row in the left roster to log cash advances, allocate overtimes/bonuses, adjust paid stamps, and compile pdf files.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
