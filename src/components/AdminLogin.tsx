import React, { useState } from "react";
import { Lock, User, Key, KeyRound, Wrench } from "lucide-react";

interface AdminLoginProps {
  onLoginSuccess: (username: string) => void;
  savedUsername: string;
  garageName: string;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  savedUsername,
  garageName,
}) => {
  const [username, setUsername] = useState(savedUsername || "admin");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setFeedback({ text: "Please enter both credentials", isError: true });
      return;
    }

    // Default or stored passwords
    const storedPass = localStorage.getItem("admin_password") || "password123";
    const storedUser = localStorage.getItem("admin_username") || "admin";

    if (
      username.toLowerCase() === storedUser.toLowerCase() &&
      password === storedPass
    ) {
      if (keepLoggedIn) {
        localStorage.setItem("keep_logged_in", "true");
        localStorage.setItem("session_username", username);
      } else {
        localStorage.removeItem("keep_logged_in");
      }
      setFeedback({ text: "Login successful!", isError: false });
      setTimeout(() => onLoginSuccess(username), 800);
    } else {
      setFeedback({ text: "Invalid username or password", isError: true });
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityAnswer.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setFeedback({ text: "All fields are required", isError: true });
      return;
    }

    const cleanAnswer = securityAnswer.trim().toLowerCase();
    // Default security question answers: "ambica" or "garage" or "mechanic" or "lubricant" 
    if (!cleanAnswer.includes("ambica") && !cleanAnswer.includes("garage") && !cleanAnswer.includes("car")) {
      setFeedback({ text: "Incorrect Security Answer! Hint: Name of the station", isError: true });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setFeedback({ text: "Passwords do not match", isError: true });
      return;
    }

    if (newPassword.length < 4) {
      setFeedback({ text: "Password must be at least 4 characters long", isError: true });
      return;
    }

    localStorage.setItem("admin_password", newPassword);
    setFeedback({ text: "Password reset successful! You can now log in.", isError: false });
    setTimeout(() => {
      setIsForgotMode(false);
      setPassword("");
      setFeedback(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>

      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 z-10 transition-all">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-3 shadow-md shadow-blue-500/20">
            <Wrench className="w-8 h-8 rotate-45" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-display">
            {garageName}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Attendance & Payroll Terminal
          </p>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-xl text-center text-xs font-semibold mb-4 transition-all animate-bounce ${
              feedback.isError
                ? "bg-red-50 text-red-600 border border-red-100"
                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {!isForgotMode ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                Admin Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-sm pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="e.g. admin"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 pl-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Secret Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(true);
                    setFeedback(null);
                    setSecurityAnswer("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                  }}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center pl-1">
              <input
                id="keep-logged-in-checkbox"
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="keep-logged-in-checkbox"
                className="ml-2 text-xs font-bold text-slate-500 select-none cursor-pointer"
              >
                Keep Logged In on this Device
              </label>
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all text-sm shadow-lg shadow-blue-600/20 mt-2 cursor-pointer"
            >
              Secure Sign In
            </button>

            <div className="text-center pt-2">
              <span className="text-[10px] text-slate-400 font-mono">
                Default: admin / password123
              </span>
            </div>
          </form>
        ) : (
          /* FORGOT PASSWORD FORM */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-800 space-y-1">
              <p className="font-bold">Security Question Verification</p>
              <p>Which Car Service Station are we managing?</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                Your Answer
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <KeyRound className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="w-full text-sm pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="e.g. Ambica Car Service"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Key className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-sm pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="At least 4 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                placeholder="Re-enter password"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgotMode(false);
                  setFeedback(null);
                }}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all text-sm"
              >
                Cancel
              </button>
              <button
                id="reset-password-submit"
                type="submit"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all text-sm shadow-md shadow-blue-600/10"
              >
                Reset Password
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="absolute bottom-4 text-center text-[11px] text-slate-600">
        © 2026 Admin Panel Secure System. All rights reserved.
      </div>
    </div>
  );
};
