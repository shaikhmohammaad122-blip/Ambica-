import React, { useState } from "react";
import { Settings, ShieldAlert, KeyRound, CloudUpload, CloudDownload, LogOut, Moon, Sun, Bell, RefreshCw, Undo2, Wrench, Check, Shield } from "lucide-react";
import { BackupData } from "../types";

interface SettingsViewProps {
  garageName: string;
  adminUsername: string;
  themeMode: "light" | "dark";
  onUpdateGarageName: (name: string) => void;
  onUpdateAdminCredentials: (user: string, pass: string) => void;
  onToggleTheme: () => void;
  onLogoutAdmin: () => void;
  onRestoreBackup: (data: BackupData) => void;
  getCurrentDbState: () => BackupData;
  showToast: (msg: string, isError?: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  garageName,
  adminUsername,
  themeMode,
  onUpdateGarageName,
  onUpdateAdminCredentials,
  onToggleTheme,
  onLogoutAdmin,
  onRestoreBackup,
  getCurrentDbState,
  showToast,
}) => {
  // Station name
  const [stationNameInput, setStationNameInput] = useState(garageName);
  
  // Credentials change settings
  const [newUser, setNewUser] = useState(adminUsername);
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Notification states
  const [notifyDaily, setNotifyDaily] = useState(true);

  // Schema state updates
  const handleSaveStationName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationNameInput.trim()) {
      showToast("Station name cannot be left blank", true);
      return;
    }
    onUpdateGarageName(stationNameInput.trim());
    showToast("Garage brand name updated successfully!");
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currPassword.trim() || !newPassword.trim() || !confirmPass.trim()) {
      showToast("Please fill all credential fields", true);
      return;
    }

    const savedPass = localStorage.getItem("admin_password") || "password123";
    if (currPassword !== savedPass) {
      showToast("Incorrect CURRENT secret password", true);
      return;
    }

    if (newPassword !== confirmPass) {
      showToast("The new passwords do not match", true);
      return;
    }

    if (newPassword.length < 4) {
      showToast("New password must be at least 4 characters long", true);
      return;
    }

    onUpdateAdminCredentials(newUser.trim(), newPassword);
    setCurrPassword("");
    setNewPassword("");
    setConfirmPass("");
  };

  // BACKUP FUNCTIONALITY: DOWNLOAD SYSTEM DATABASE FILE (JSON)
  const handleDownloadBackupFile = () => {
    try {
      const dbState = getCurrentDbState();
      const stringifiedData = JSON.stringify(dbState, null, 2);
      
      const blob = new Blob([stringifiedData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ambica_car_service_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast("Database Backup file (.json) downloaded successfully! Move it to safe storage.");
    } catch (e) {
      showToast("Error generating backup download", true);
    }
  };

  // RESTORE FUNCTIONALITY: RESTORE FROM UPLOADED JSON FILE
  const handleUploadedBackupRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawText = event.target?.result as string;
        const parsed = JSON.parse(rawText);

        // SCHEMA STRUCTURE INTEGRITY VERIFICATION
        if (!parsed.employees || !Array.isArray(parsed.employees)) {
          showToast("Invalid Backup file format. No 'employees' list found.", true);
          return;
        }

        const confirmRestore = window.confirm(
          "WARNING: Restoring will overwrite all current garage staff rosters, attendance records, and salary advances. Continue?"
        );

        if (confirmRestore) {
          onRestoreBackup({
            employees: parsed.employees || [],
            attendance: parsed.attendance || [],
            salarySlips: parsed.salarySlips || [],
            advances: parsed.advances || [],
            adminUsername: parsed.adminUsername || "admin",
            garageName: parsed.garageName || "Ambica Car Service Station",
            themeMode: parsed.themeMode || "light",
            dailyRemindersNotified: parsed.dailyRemindersNotified || [],
          });
          
          showToast("Garage Database restored successfully! Page will refresh configurations.");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch (err) {
        showToast("Corruption detected. Could not parse restore backup file (.json).", true);
      }
    };
    reader.readAsText(file);
  };

  // QUICK CLEAN FLUSH
  const handleHardWipeClean = () => {
    const confirmWipe = window.confirm(
      "DANGER: Are you sure you want to clean-sweep the database? This wipes all employees & attendances, resetting the station back to the factory pre-seeds."
    );
    if (confirmWipe) {
      localStorage.removeItem("ambica_payroll_db");
      localStorage.removeItem("admin_password");
      localStorage.removeItem("admin_username");
      localStorage.removeItem("keep_logged_in");
      showToast("Garage Ledger wiped dry. Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER HERO */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-base font-black text-slate-800 uppercase tracking-wider font-display">
          Station Center Console
        </h2>
        <p className="text-xs text-slate-400">
          Admin profiles, backup/restore systems, terminal settings and brand properties
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BRANDING SETUP AND PREFERENCES */}
        <div className="space-y-6">
          {/* Station name change */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600 rotate-45" /> Terminal Title Branding
            </h3>

            <form onSubmit={handleSaveStationName} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 pl-0.5">
                  Garage Display Title
                </label>
                <input
                  type="text"
                  value={stationNameInput}
                  onChange={(e) => setStationNameInput(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-extrabold text-slate-800"
                  placeholder="e.g. Ambica Car Service Station"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer"
              >
                Apply Terminal Title
              </button>
            </form>
          </div>

          {/* Core Device Preferences: Reminders + Themes */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">
               Device Preferences
            </h3>

            <div className="divide-y divide-slate-50 text-xs">
              {/* Theme Settings */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-bold text-slate-800">Visual Dark Mode</p>
                  <p className="text-[10px] text-slate-400">Dim fluorescent screens for night operations</p>
                </div>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  {themeMode === "dark" ? (
                    <span className="flex items-center text-blue-600 font-bold gap-1 text-[10px]">
                      <Moon className="w-4 h-4 fill-blue-600" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center text-slate-500 font-bold gap-1 text-[10px]">
                      <Sun className="w-4 h-4" /> Deactive
                    </span>
                  )}
                </button>
              </div>

              {/* Notification preferences */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-bold text-slate-800">Muster Reminders</p>
                  <p className="text-[10px] text-slate-400">Trigger simulated warnings on unlogged days</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotifyDaily(!notifyDaily);
                    showToast(notifyDaily ? "Daily alert simulations muted." : "System attendance simulations active.");
                  }}
                  className={`px-3 py-1.5 border text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                    notifyDaily 
                      ? "bg-slate-800 text-white border-slate-800" 
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  {notifyDaily ? "Enabled" : "Muted"}
                </button>
              </div>

              {/* Quick Logout */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="font-bold text-red-650">Sign Out Admin</p>
                  <p className="text-[10px] text-slate-400">Ends station session triggers password lock</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("Sign out from the admin station ledger?")) {
                      onLogoutAdmin();
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100/60 transition-all font-bold rounded-xl scroll-p-1 text-[10px]"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* REPLICATED OFFLINE SYSTEM BACKUP AND CREDS */}
        <div className="space-y-6">
          {/* SECURE PASSWORD CHANGES FORM */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" /> Admin Access Controls
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1 pl-0.5">
                    User Code Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                {/* Current pass info */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1 pl-0.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* New password */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1 pl-0.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    placeholder="min 4 digits"
                  />
                </div>

                {/* Confirm pass */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1 pl-0.5">
                    Confirm Pass
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer text-center"
              >
                Change Admin Credentials
              </button>
            </form>
          </div>

          {/* SECURED DATABASE JSON BACKUPS (Offline persistent database) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <div>
              <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-600 animate-pulse" /> Offline Disaster Backup
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Database backups run automatically on storage alterations but download manual offline backups as disaster files to export/import to other devices.
              </p>
            </div>

            <div className="space-y-3">
              {/* Download Backup */}
              <button
                onClick={handleDownloadBackupFile}
                className="w-full py-3 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-350 text-slate-800 font-extrabold text-xs rounded-2xl transition-all flex items-center justify-between shadow-sm active:scale-[0.99] cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <CloudDownload className="w-4.5 h-4.5 text-blue-600" /> Download Manual Backup File
                </span>
                <span className="text-[9px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-black uppercase">
                  .json File
                </span>
              </button>

              {/* Upload Restore Backup */}
              <label className="w-full py-3 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-350 text-slate-805 text-slate-800 font-extrabold text-xs rounded-2xl transition-all flex items-center justify-between shadow-sm active:scale-[0.99] cursor-pointer relative">
                <span className="flex items-center gap-2">
                  <CloudUpload className="w-4.5 h-4.5 text-emerald-600" /> Restore Database Backup File
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleUploadedBackupRestore}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-black uppercase pointer-events-none">
                  Upload file
                </span>
              </label>
            </div>

            {/* Danger Zone: Reset Database completely */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-red-600 uppercase tracking-widest">Danger Zone</p>
                <p className="text-[9px] text-slate-405 text-slate-400">Destructive: Sweep standard registers tidy</p>
              </div>
              <button
                onClick={handleHardWipeClean}
                className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 hover:text-red-800 text-red-650 font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
              >
                Hard Reset Database
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
