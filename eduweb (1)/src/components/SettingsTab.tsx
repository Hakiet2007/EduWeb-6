import React, { useState } from "react";
import { User, AppLanguage, AppTheme } from "../types";
import { translations } from "../utils/translations";
import { Save, Languages, Sun, Moon, ShieldAlert } from "lucide-react";

interface SettingsTabProps {
  currentUser: User | null;
  language: AppLanguage;
  theme: AppTheme;
  onUpdateSettings: (lang: AppLanguage, theme: AppTheme) => void;
  onUpdateDevXpLevel?: (level: number, xp: number) => void;
  onUpdateProfile?: (newEmail: string, newUsername: string, newPassword?: string) => boolean;
  onDeleteAccount?: (password: string) => boolean;
  users: User[];
}

export default function SettingsTab({
  currentUser,
  language,
  theme,
  onUpdateSettings,
  onUpdateDevXpLevel,
  onUpdateProfile,
  onDeleteAccount,
  users,
}: SettingsTabProps) {
  const t = translations[language];

  const [langInput, setLangInput] = useState<AppLanguage>(language);
  const [themeInput, setThemeInput] = useState<AppTheme>(theme);

  // Profile credentials inputs
  const [emailInput, setEmailInput] = useState(currentUser?.email || "");
  const [usernameInput, setUsernameInput] = useState(currentUser?.username || "");
  const [passwordInput, setPasswordInput] = useState(currentUser?.password || "");

  // Search profile states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Delete account confirmation
  const [deletePasswordConfirm, setDeletePasswordConfirm] = useState("");

  const handleDeleteClick = () => {
    if (!deletePasswordConfirm) {
      window.showToast?.(
        language === "vi" ? "Vui lòng nhập mật khẩu xác nhận!" : "Please enter your password to confirm!",
        "error"
      );
      return;
    }
    if (onDeleteAccount) {
      onDeleteAccount(deletePasswordConfirm);
    }
  };

  const handleSaveSettings = () => {
    if (!usernameInput.trim()) {
      window.showToast?.(
        language === "vi" ? "Tên đăng nhập không được để trống!" : "Username cannot be empty!",
        "error"
      );
      return;
    }
    if (!emailInput.trim() || !emailInput.includes("@")) {
      window.showToast?.(
        language === "vi" ? "Vui lòng nhập Email hợp lệ!" : "Please enter a valid email address!",
        "error"
      );
      return;
    }
    if (passwordInput && passwordInput.length < 6) {
      window.showToast?.(
        language === "vi" ? "Mật khẩu phải dài ít nhất 6 ký tự!" : "Password must be at least 6 characters!",
        "error"
      );
      return;
    }

    if (onUpdateProfile) {
      const success = onUpdateProfile(emailInput.trim(), usernameInput.trim(), passwordInput);
      if (!success) return; // Stop if username or check is invalid
    }

    onUpdateSettings(langInput, themeInput);
    window.showToast?.(t.savedAlert, "success");
  };

  // Filter users based on query and role permissions
  const filteredSearchUsers = searchQuery.trim() === "" 
    ? [] 
    : users.filter((u) => {
        const term = searchQuery.toLowerCase();
        const matchesQuery = 
          u.username.toLowerCase().includes(term) || 
          u.fullName.toLowerCase().includes(term) || 
          (u.email && u.email.toLowerCase().includes(term));

        if (!matchesQuery) return false;

        if (currentUser?.role === "dev") {
          return true; // Dev sees everyone
        } else if (currentUser?.role === "teacher") {
          return u.role === "student"; // Teacher only sees students
        }
        return false;
      });

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-8 animate-fadeIn" id="settings-container">
      <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-xl">
          <Languages className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
            {t.settingsTitle}
          </h2>
          <p className="text-xs text-neutral-400">
            {language === "vi" ? "Định cấu hình tài khoản, ngôn ngữ và tìm kiếm hồ sơ" : "Configure account, language options, styling & explore members"}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account Profile Editing */}
        {currentUser && (
          <div className="space-y-4 border-b border-neutral-100 dark:border-neutral-800 pb-6">
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">
              {language === "vi" ? "THÔNG TIN TÀI KHOẢN" : "ACCOUNT PROFILE"}
            </label>
            <div className="space-y-4 text-xs font-semibold">
              {/* Username */}
              <div className="space-y-1">
                <label className="text-neutral-600 dark:text-neutral-300">
                  {language === "vi" ? "Tên đăng nhập" : "Username"}
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              
              {/* Email */}
              <div className="space-y-1">
                <label className="text-neutral-600 dark:text-neutral-300">
                  Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-neutral-600 dark:text-neutral-300">
                  {language === "vi" ? "Mật khẩu" : "Password"}
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-950 dark:text-neutral-100 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Language Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">
            {t.languageLabel}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLangInput("vi")}
              className={`p-3 rounded-xl border-2 text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                langInput === "vi"
                  ? "border-blue-500 bg-blue-50/45 text-blue-600 dark:text-blue-400 dark:bg-blue-950/20"
                  : "border-neutral-100 dark:border-neutral-800 text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              }`}
            >
              <span>🇻🇳 Tiếng Việt</span>
            </button>
            <button
              onClick={() => setLangInput("en")}
              className={`p-3 rounded-xl border-2 text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                langInput === "en"
                  ? "border-blue-500 bg-blue-50/45 text-blue-600 dark:text-blue-400 dark:bg-blue-950/20"
                  : "border-neutral-100 dark:border-neutral-800 text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              }`}
            >
              <span>🇺🇸 English</span>
            </button>
          </div>
        </div>

        {/* Theme Switching */}
        <div className="space-y-2 pb-6 border-b border-neutral-100 dark:border-neutral-800">
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">
            {t.themeLabel}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setThemeInput("light")}
              className={`p-3 rounded-xl border-2 text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                themeInput === "light"
                  ? "border-blue-500 bg-blue-50/45 text-blue-600"
                  : "border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100"
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>{t.lightTheme}</span>
            </button>
            <button
              onClick={() => setThemeInput("dark")}
              className={`p-3 rounded-xl border-2 text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                themeInput === "dark"
                  ? "border-blue-500 bg-blue-950/35 text-blue-400"
                  : "border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100"
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>{t.darkTheme}</span>
            </button>
          </div>
        </div>

        {/* Developer Sandbox Level controls replaced by Command Board guide */}
        {currentUser?.role === "dev" && (
          <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-900/50 space-y-3 font-mono">
            <h4 className="font-extrabold text-cyan-400 flex items-center gap-2 text-sm uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              {t.devControlTitle}
            </h4>
            <p className="text-neutral-350 dark:text-neutral-300 text-xs leading-relaxed">
              {language === "vi" 
                ? "💡 Điều khiển thủ công đã được chuyển thành Bảng Lệnh để tăng năng suất. Hãy bấm phím tổ hợp sau để mở máy chủ điều khiển:" 
                : "💡 Manual adjustments have been upgraded to the Command Board. Use the hotkey below to spin up the Admin Shell:"}
            </p>
            <div className="flex items-center gap-3 p-3 bg-neutral-950/85 rounded-xl border border-neutral-800 text-center justify-center">
              <kbd className="px-2.5 py-1 bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-lg text-xs font-black select-none shadow">
                Ctrl
              </kbd>
              <span className="text-neutral-550 text-xs font-bold font-sans text-neutral-400">+</span>
              <kbd className="px-2.5 py-1 bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-lg text-xs font-black select-none shadow">
                /
              </kbd>
            </div>
            <p className="text-[10px] text-center text-cyan-500">
              {language === "vi" ? "Gõ /lv <số> hoặc /ban <email>" : "Type /lv <number> or /ban <email>"}
            </p>
          </div>
        )}

        {/* Danger Zone: Delete Account */}
        <div className="pt-6 border-t border-rose-200/50 dark:border-rose-950/40 space-y-4">
          <label className="block text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {language === "vi" ? "VÙNG NGUY HIỂM" : "DANGER ZONE"}
          </label>
          
          <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-950/60 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
              {language === "vi" 
                ? "⚠️ CẢNH BÁO: XÓA TÀI KHOẢN VĨNH VIỄN" 
                : "⚠️ WARNING: PERMANENT ACCOUNT DELETION"}
            </p>
            <p className="text-[11px] leading-relaxed text-rose-600/80 dark:text-rose-400/85 font-semibold">
              {language === "vi"
                ? "Hành động này sẽ xóa tài khoản của bạn vĩnh viễn khỏi cơ sở dữ liệu và không thể khôi phục lại. Toàn bộ tiến trình học tập, bảng xếp hạng và các bài nộp của bạn sẽ bị xóa bỏ."
                : "This action will permanently delete your account from the server database. It is completely irreversible. All your study progress, learning history, classrooms, and grades will be lost forever."}
            </p>

            <div className="space-y-2 mt-2">
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                {language === "vi" 
                  ? "Nhập mật khẩu hiện tại để xác nhận xóa:" 
                  : "Enter your current password to confirm deletion:"}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  placeholder={language === "vi" ? "Mật khẩu xác nhận..." : "Confirm password..."}
                  value={deletePasswordConfirm}
                  onChange={(e) => setDeletePasswordConfirm(e.target.value)}
                  className="flex-1 p-2 bg-white dark:bg-neutral-950 border border-rose-200 dark:border-rose-950/60 text-neutral-900 dark:text-neutral-100 rounded-lg text-xs focus:outline-none focus:border-rose-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition duration-150 cursor-pointer shadow-sm shadow-rose-500/10 shrink-0"
                >
                  {language === "vi" ? "Xác nhận xóa" : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm select-none"
        >
          <Save className="w-5 h-5" />
          {t.saveBtn}
        </button>
      </div>
    </div>
  );
}
