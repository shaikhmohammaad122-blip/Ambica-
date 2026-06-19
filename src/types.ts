export interface Employee {
  id: string; // Unique ID (e.g., EMP-1001)
  name: string;
  mobileNumber: string;
  address: string;
  joiningDate: string; // YYYY-MM-DD
  designation: string;
  monthlySalary: number; // For daily wage, this is the daily rate (e.g., 500)
  dailyWageOption: boolean; // true = Daily Wage; false = Fixed Monthly Salary
  isActive: boolean;
}

export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY";

export interface AttendanceRecord {
  employeeId: string;
  date: string; // YYYYY-MM-DD
  status: AttendanceStatus;
}

export interface SalarySlip {
  id: string;
  employeeId: string;
  month: string; // YYYY-MM
  baseSalaryRate: number; // monthlySalary or daily wage rate
  dailyWageOption: boolean;
  totalPresent: number;
  totalAbsent: number;
  totalHalfDay: number;
  payableDays: number;
  attendancePercentage: number;
  calculatedBaseSalary: number;
  deductions: number; // automatic deductions for absent days
  overtimeAmount: number;
  bonusAmount: number;
  advanceAmount: number;
  finalSalary: number;
  paymentDate: string; // YYYY-MM-DD
  paymentStatus: "PAID" | "PENDING";
  notes?: string;
}

export interface AdvanceSalaryEntry {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  notes: string;
}

export interface DailyReminderLog {
  date: string; // YYYY-MM-DD
  notified: boolean;
}

export interface BackupData {
  employees: Employee[];
  attendance: AttendanceRecord[];
  salarySlips: SalarySlip[];
  advances: AdvanceSalaryEntry[];
  adminUsername: string;
  garageName: string;
  themeMode: "light" | "dark";
  dailyRemindersNotified: string[]; // dates that sent reminders
}
