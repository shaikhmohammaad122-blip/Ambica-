import { Employee, AttendanceRecord, SalarySlip, AdvanceSalaryEntry, BackupData } from "../types";

const LOCAL_STORAGE_KEY = "ambica_payroll_db";

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: "EMP-1001",
    name: "Ramesh Kumar",
    mobileNumber: "9876543210",
    address: "G-12, Sector 4, Ambica Nagar, Gujarat",
    joiningDate: "2025-01-15",
    designation: "Chief Mechanic",
    monthlySalary: 25000,
    dailyWageOption: false,
    isActive: true,
  },
  {
    id: "EMP-1002",
    name: "Suresh Patel",
    mobileNumber: "9988776655",
    address: "Block B, Shivam Residency, Gujarat",
    joiningDate: "2025-03-10",
    designation: "Senior Electrician",
    monthlySalary: 22000,
    dailyWageOption: false,
    isActive: true,
  },
  {
    id: "EMP-1003",
    name: "Mohammad Shaikh",
    mobileNumber: "9123456789",
    address: "Flat 402, Al-Barkat Complex, Gujarat",
    joiningDate: "2025-06-01",
    designation: "Service Advisor",
    monthlySalary: 18000,
    dailyWageOption: false,
    isActive: true,
  },
  {
    id: "EMP-1004",
    name: "Anil Chavda",
    mobileNumber: "8877665544",
    address: "Hari Om Nagar Society, Part-2, Gujarat",
    joiningDate: "2026-01-20",
    designation: "Car detailer & Polisher",
    monthlySalary: 800, // INR 800 per day
    dailyWageOption: true,
    isActive: true,
  },
  {
    id: "EMP-1005",
    name: "Vikram Rathod",
    mobileNumber: "7766554433",
    address: "Shreeji Kripa Chawl, Station Road, Gujarat",
    joiningDate: "2026-02-15",
    designation: "Washing Helper",
    monthlySalary: 500, // INR 500 per day
    dailyWageOption: true,
    isActive: true,
  },
];

// Pre-seed some historical attendance for June 2026 (the current timeframe)
const generateInitialAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const daysInJune = 18; // Seeding attendance from June 1 up to June 18
  const employeeIds = DEFAULT_EMPLOYEES.map((e) => e.id);

  for (let day = 1; day <= daysInJune; day++) {
    const dateStr = `2026-06-${String(day).padStart(2, "0")}`;
    employeeIds.forEach((empId) => {
      // Mechanics & Advisors are regular (mostly Present, occasionally Half day)
      // Washing helpers may have occasional absents
      let status: "PRESENT" | "ABSENT" | "HALF_DAY" = "PRESENT";
      const roll = Math.random();
      
      if (empId === "EMP-1005") { // Washer
        if (roll < 0.15) status = "ABSENT";
        else if (roll < 0.3) status = "HALF_DAY";
      } else if (empId === "EMP-1004") { // Detailer
        if (roll < 0.1) status = "ABSENT";
        else if (roll < 0.2) status = "HALF_DAY";
      } else {
        if (roll < 0.05) status = "ABSENT";
        else if (roll < 0.12) status = "HALF_DAY";
      }

      records.push({ employeeId: empId, date: dateStr, status });
    });
  }
  return records;
};

// Pre-seed some advances
const INITIAL_ADVANCES: AdvanceSalaryEntry[] = [
  {
    id: "ADV-1001",
    employeeId: "EMP-1003", // Mohammad Shaikh
    date: "2026-06-05",
    amount: 1500,
    notes: "Emergency medical expense for daughter",
  },
  {
    id: "ADV-1002",
    employeeId: "EMP-1005", // Vikram Rathod
    date: "2026-06-12",
    amount: 500,
    notes: "Festival advance",
  },
];

// Load full store or initialize with seeds
export const getDatabase = (): BackupData => {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // Ensure all arrays exist
      return {
        employees: parsed.employees || [],
        attendance: parsed.attendance || [],
        salarySlips: parsed.salarySlips || [],
        advances: parsed.advances || [],
        adminUsername: parsed.adminUsername || "admin",
        garageName: parsed.garageName || "Ambica Car Service Station",
        themeMode: parsed.themeMode || "light",
        dailyRemindersNotified: parsed.dailyRemindersNotified || [],
      };
    } catch (e) {
      console.error("Local storage corruption, resetting database", e);
    }
  }

  // Pre-seed data if empty
  const initialDb: BackupData = {
    employees: DEFAULT_EMPLOYEES,
    attendance: generateInitialAttendance(),
    salarySlips: [],
    advances: INITIAL_ADVANCES,
    adminUsername: "admin",
    garageName: "Ambica Car Service Station",
    themeMode: "light",
    dailyRemindersNotified: [],
  };
  saveDatabase(initialDb);
  return initialDb;
};

export const saveDatabase = (db: BackupData): void => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
};

// Calculations helper
export const getMonthDaysCount = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

export interface EmployeeAttendanceStats {
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  payableDays: number;
  attendancePercentage: number;
}

export const calculateEmployeeStats = (
  employeeId: string,
  yearMonth: string, // YYYY-MM
  attendanceRecords: AttendanceRecord[]
): EmployeeAttendanceStats => {
  const monthRecords = attendanceRecords.filter(
    (r) => r.employeeId === employeeId && r.date.startsWith(yearMonth)
  );

  let presentCount = 0;
  let absentCount = 0;
  let halfDayCount = 0;

  monthRecords.forEach((r) => {
    if (r.status === "PRESENT") presentCount++;
    else if (r.status === "ABSENT") absentCount++;
    else if (r.status === "HALF_DAY") halfDayCount++;
  });

  const totalMarkedDays = monthRecords.length;
  // If no attendance marked, default statistical basis to 0
  const payableDays = presentCount + halfDayCount * 0.5;

  // Percentage calculation based on total calendar working days or total marked days
  // The standard in payroll is either marked days, or standard working days (e.g. 26 or 30).
  // Let's divide by total marked days in the month (or standard 30 if none marked)
  const divisor = totalMarkedDays > 0 ? totalMarkedDays : 30;
  const attendancePercentage = Math.round((payableDays / divisor) * 100) || 0;

  return {
    presentCount,
    absentCount,
    halfDayCount,
    payableDays,
    attendancePercentage,
  };
};

// Calculate pay details
export interface PayCalculationDetails {
  baseSalaryRate: number;
  payableDays: number;
  calculatedBaseSalary: number; // calculated salary based on attendance
  deductions: number; // automatic salary deduction
  advanceAmount: number; // drawn advance in selected month
  overtimeAmount: number;
  bonusAmount: number;
  finalSalary: number;
}

export const calculatePay = (
  employee: Employee,
  yearMonth: string, // YYYY-MM
  stats: EmployeeAttendanceStats,
  advancesList: AdvanceSalaryEntry[],
  currentSlips: SalarySlip[]
): PayCalculationDetails => {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const totalDaysInMonth = getMonthDaysCount(year, month);

  const baseSalaryRate = employee.monthlySalary;
  const payableDays = stats.payableDays;

  let calculatedBaseSalary = 0;
  let deductions = 0;

  if (employee.dailyWageOption) {
    // Daily Wage option: baseSalaryRate is Daily Wage
    // Salary = Payable Days * Daily Wage Rate
    calculatedBaseSalary = payableDays * baseSalaryRate;
    // Absent deduction isn't a manual penalty; they just don't get paid.
    // However, if we want to show visual "deductions", it is: (Total marked - Payable Days) * rate
    const totalMarkedDays = stats.presentCount + stats.absentCount + stats.halfDayCount;
    const unpaidDays = totalMarkedDays - payableDays;
    deductions = unpaidDays * baseSalaryRate;
  } else {
    // Fixed Monthly Salary option: baseSalaryRate is Monthly Salary
    // Standard pay per day = Monthly Salary / Total Days in Month
    const dailyRate = baseSalaryRate / totalDaysInMonth;
    calculatedBaseSalary = payDaysMonthly(baseSalaryRate, payableDays, totalDaysInMonth);
    // Deductions reflect absent days
    // E.g. (Absent + HalfDay*0.5) * dailyRate
    const absentPenaltyDays = stats.absentCount + stats.halfDayCount * 0.5;
    deductions = Math.round(absentPenaltyDays * dailyRate);
  }

  // Advance salary for this employee in this month
  const advanceAmount = advancesList
    .filter((a) => a.employeeId === employee.id && a.date.startsWith(yearMonth))
    .reduce((curr, next) => curr + next.amount, 0);

  // Look up existing slip for custom edits (overtime, bonus, custom notes) if saved
  const matchedSlip = currentSlips.find(
    (s) => s.employeeId === employee.id && s.month === yearMonth
  );

  const overtimeAmount = matchedSlip ? matchedSlip.overtimeAmount : 0;
  const bonusAmount = matchedSlip ? matchedSlip.bonusAmount : 0;

  // Final Salary = Calculated Base Salary + Overtime + Bonus - Advance
  // Note: For Monthly Salary Option, calculatedBaseSalary is already baseSalary - deductions.
  // Let's formulate: Final Salary = standardPayableSalary + Overtime + Bonus - Advance
  const finalSalary = Math.max(0, Math.round(calculatedBaseSalary + overtimeAmount + bonusAmount - advanceAmount));

  return {
    baseSalaryRate,
    payableDays,
    calculatedBaseSalary: Math.round(calculatedBaseSalary),
    deductions,
    advanceAmount,
    overtimeAmount,
    bonusAmount,
    finalSalary,
  };
};

const payDaysMonthly = (monthlyBase: number, payableDays: number, totalDays: number): number => {
  // Option 1: Strictly pay based on actual payable days
  // (monthlyBase / totalDays) * payableDays
  // Let's implement full monthly pay minus absent/half day penalties.
  const baseSalary = (monthlyBase / totalDays) * payableDays;
  return baseSalary;
};

// Export to CSV helper
export const convertToCSV = (headers: string[], rows: (string | number)[][]): string => {
  const headerLine = headers.join(",");
  const rowLines = rows.map((row) =>
    row
      .map((val) => {
        const strVal = String(val);
        // Escape quotes
        if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      })
      .join(",")
  );
  return [headerLine, ...rowLines].join("\n");
};

// Download CSV trigger
export const downloadCSVFile = (csvContent: string, fileName: string): void => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
