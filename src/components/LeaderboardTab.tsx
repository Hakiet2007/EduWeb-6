import React, { useState } from "react";
import { LeaderboardUser, AppLanguage, User } from "../types";
import { translations } from "../utils/translations";
import { Award, ShieldAlert, Trophy, Medal, MoreVertical, Ban, Bell, ShieldCheck, Calendar, Star, AlertTriangle, Trash2 } from "lucide-react";

interface LeaderboardTabProps {
  currentUser: User | null;
  users: LeaderboardUser[];
  onUpdateUserStatus: (
    userId: string,
    status: {
      banned?: boolean;
      warnedUntil?: string | null;
      warningType?: "remind" | "3days" | "7days" | "30days" | null;
    }
  ) => void;
  language: AppLanguage;
  onDeleteUser?: (userId: string) => void;
}

export default function LeaderboardTab({ currentUser, users, onUpdateUserStatus, language, onDeleteUser }: LeaderboardTabProps) {
  const t = translations[language];
  const isVi = language === "vi";

  // Dropdown states
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [showWarningModalForUser, setShowWarningModalForUser] = useState<LeaderboardUser | null>(null);

  // Filter out developers, banned accounts, and fake mock accounts. Keep active students and sort by Level/XP
  const studentUsers = users
    .filter((user) => user.role !== "dev" && !user.banned && !user.id.startsWith("lead_"))
    .sort((a, b) => {
      if (a.level !== b.level) {
        return b.level - a.level;
      }
      return b.xp - a.xp;
    });

  const isAdmin = currentUser?.role === "dev" || currentUser?.role === "teacher";

  const handleApplyWarning = (user: LeaderboardUser, type: "remind" | "3days" | "7days" | "30days") => {
    let warnedUntil: string | null = null;
    if (type === "remind") {
      warnedUntil = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();
    } else if (type === "3days") {
      warnedUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    } else if (type === "7days") {
      warnedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (type === "30days") {
      warnedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    onUpdateUserStatus(user.id, {
      banned: false, // Normalizing block state
      warnedUntil,
      warningType: type,
    });
    setShowWarningModalForUser(null);
    setActiveMenuUserId(null);
  };

  const handleApplyBan = (user: LeaderboardUser) => {
    onUpdateUserStatus(user.id, {
      banned: true,
      warnedUntil: null,
      warningType: null,
    });
    setActiveMenuUserId(null);
  };

  const handleLiftAllSanctions = (user: LeaderboardUser) => {
    onUpdateUserStatus(user.id, {
      banned: false,
      warnedUntil: null,
      warningType: null,
    });
    setActiveMenuUserId(null);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto animate-fadeIn relative" id="leaderboard-container">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-xl">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
            {t.leaderboardTitle}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t.leaderboardExcludeDev}
          </p>
        </div>
      </div>

      {studentUsers.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-60" />
          <p className="text-sm font-semibold mb-2">
            {isVi ? "Chưa có học sinh nào trong danh sách!" : "No students registered for ranking list."}
          </p>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            {isVi 
              ? "Hãy tạo tài khoản học sinh mới để tham gia thi đua và leo bảng xếp hạng!" 
              : "Register new student profiles and start challenges to test your level on the run!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4" id="leaderboard-list">
          {studentUsers.map((user, idx) => {
            const rank = idx + 1;
            let rankBadgeClass = "";
            let trophyIcon = null;

            if (rank === 1) {
              rankBadgeClass = "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white font-bold ring-4 ring-amber-150 dark:ring-amber-950/50 shadow-md";
              trophyIcon = <Trophy className="w-4 h-4 text-amber-100" />;
            } else if (rank === 2) {
              rankBadgeClass = "bg-gradient-to-br from-slate-200 to-slate-450 text-slate-900 dark:text-slate-100 font-bold dark:from-slate-650 dark:to-slate-800 ring-4 ring-slate-150 dark:ring-slate-950/50 shadow-sm";
              trophyIcon = <Medal className="w-4 h-4 text-slate-200 dark:text-slate-300" />;
            } else if (rank === 3) {
              rankBadgeClass = "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-50 font-bold ring-4 ring-orange-150 dark:ring-orange-950/50 shadow-sm";
              trophyIcon = <Medal className="w-4 h-4 text-orange-200" />;
            } else {
              rankBadgeClass = "bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-750 text-neutral-600 dark:text-neutral-400 font-extrabold shadow-sm";
            }

            const isUserBanned = user.banned;
            const isUserWarned = user.warningType && (!user.warnedUntil || new Date(user.warnedUntil) > new Date());

            return (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md relative ${
                  activeMenuUserId === user.id ? "z-35" : "z-0"
                } ${
                  isUserBanned
                    ? "bg-rose-50/40 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/60 opacity-80"
                    : isUserWarned
                    ? "bg-amber-50/40 dark:bg-amber-950/15 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/10"
                    : "bg-white dark:bg-neutral-900 border-neutral-150 dark:border-neutral-800 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 hover:border-indigo-200/60 dark:hover:border-indigo-900/30"
                }`}
                id={`leaderboard-item-${user.id}`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0 ${rankBadgeClass}`}>
                    {trophyIcon ? trophyIcon : <span>{rank}</span>}
                  </div>
                  <div className="pl-1">
                    <h4 className={`font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 ${isUserBanned ? "line-through text-neutral-400" : ""}`}>
                      <span>{user.fullName}</span>
                      {user.streakCount && user.streakCount > 0 ? (
                        <span className="inline-flex items-center gap-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full select-none" title={isVi ? `Chuỗi học tập duy trì ${user.streakCount} ngày` : `Maintained ${user.streakCount} days study streak`}>
                          🔥 {user.streakCount}
                        </span>
                      ) : null}
                      {isUserBanned && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 font-extrabold uppercase text-[9px] tracking-wider text-white">
                          BAN
                        </span>
                      )}
                      {isUserWarned && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 font-extrabold uppercase text-[9px] tracking-wider text-black flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {user.warningType === "remind" ? (isVi ? "NHẮC NHỞ" : "REMIND") : (isVi ? "CẢNH CÁO" : "WARN")}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-neutral-400 capitalize">
                      {user.role === "student" ? t.student : t.teacher}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                      {t.level} {user.level}
                    </span>
                    <p className="text-sm font-black text-neutral-800 dark:text-neutral-200 mt-1">
                      {user.xp} XP
                    </p>
                  </div>

                  {/* Administrative Dropdown Trigger (only Dev Admin / Teachers) */}
                  {isAdmin && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuUserId(activeMenuUserId === user.id ? null : user.id)}
                        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition cursor-pointer"
                        title={isVi ? "Tùy chọn quản trị" : "Moderator options"}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {/* Dropdown Menu block */}
                      {activeMenuUserId === user.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActiveMenuUserId(null)} 
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-20 py-1.5 animate-scaleUp text-start">
                            <div className="px-3 py-1 border-b border-neutral-100 dark:border-neutral-800 mb-1.5">
                              <span className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-widest">
                                {isVi ? "QUẢN LÝ THÀNH VIÊN" : "MODERATION"}
                              </span>
                            </div>

                            {/* Option 1: Warn / Cảnh cáo Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setShowWarningModalForUser(user);
                                setActiveMenuUserId(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 flex items-center gap-2 cursor-pointer transition"
                            >
                              <Bell className="w-3.5 h-3.5" />
                              <span>{isVi ? "1. Cảnh cáo / Nhắc nhở" : "1. Warn / Remind"}</span>
                            </button>

                             {/* Option 2: Ban Account Button (dev only) */}
                             {currentUser?.role === "dev" && (
                               <button
                                 type="button"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleApplyBan(user);
                                 }}
                                 className="w-full px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer transition"
                               >
                                 <Ban className="w-3.5 h-3.5" />
                                 <span>{isVi ? "2. Ban (Khoá vĩnh viễn)" : "2. Permanent Ban"}</span>
                               </button>
                             )}

                             {/* Option 3: Delete Account completely (dev only) */}
                             {currentUser?.role === "dev" && onDeleteUser && (
                               <button
                                 type="button"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   onDeleteUser(user.id);
                                   setActiveMenuUserId(null);
                                 }}
                                 className="w-full px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer transition border-t border-neutral-150 dark:border-neutral-800"
                               >
                                 <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                 <span>{isVi ? "3. Xóa hoàn toàn khỏi DB" : "3. Permanent DB Delete"}</span>
                               </button>
                             )}

                            {/* Reset / Lift Sanctions Button */}
                            {(isUserBanned || isUserWarned) && (
                              <button
                                type="button"
                                onClick={() => handleLiftAllSanctions(user)}
                                className="w-full px-3.5 py-2 mt-1 border-t border-neutral-100 dark:border-neutral-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-2 cursor-pointer transition"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>{isVi ? "Bỏ phạt / Gỡ khoá" : "Lift Sanctions"}</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warning Options Mini Modal Frame */}
      {showWarningModalForUser && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scaleUp">
            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <span>{isVi ? "THIẾT LẬP PHẠT CẢNH CÁO" : "CONFIGURE PENALTY LOCK"}</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5 leading-relaxed">
              {isVi 
                ? `Chọn mức phạt cảnh cáo áp dụng cho tài khoản học tập của ${showWarningModalForUser.fullName}:` 
                : `Select advisory level or temporary exclusion parameters for ${showWarningModalForUser.fullName}:`}
            </p>

            <div className="space-y-3">
              {/* Reminder Choice */}
              <button
                type="button"
                onClick={() => handleApplyWarning(showWarningModalForUser, "remind")}
                className="w-full p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-400 dark:hover:border-amber-900 text-left bg-neutral-50 dark:bg-neutral-900 hover:bg-amber-50/20 transition cursor-pointer flex items-start gap-3.5"
              >
                <div className="p-2 bg-amber-150 dark:bg-amber-900/30 text-amber-500 rounded-lg shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {isVi ? "Mức 1: Nhắc nhở thành viên" : "Level 1: General Reminder"}
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {isVi 
                      ? "Không khóa đăng nhập. Chỉ hiển thị dải thông báo đỏ nhắc nhở trên trang chủ." 
                      : "User can study normal. Only a caution alert is pinned inside their interface dashboard."}
                  </p>
                </div>
              </button>

              {/* 3 Days Suspend Lock */}
              <button
                type="button"
                onClick={() => handleApplyWarning(showWarningModalForUser, "3days")}
                className="w-full p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-400 dark:hover:border-amber-900 text-left bg-neutral-50 dark:bg-neutral-900 hover:bg-amber-50/20 transition cursor-pointer flex items-start gap-3.5"
              >
                <div className="p-2 bg-amber-150 dark:bg-amber-900/30 text-amber-500 rounded-lg shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {isVi ? "Mức 2: Khóa tạm thời 3 Ngày" : "Level 2: 3-Day Suspension"}
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {isVi 
                      ? "Khóa học tập trong vòng 3 ngày kể từ bây giờ. Sẽ hiển thị ngày mở khóa cụ thể khi cố đăng nhập." 
                      : "Disables sign in parameters for exactly 3 days. Show automated exact expiration countdown on login form."}
                  </p>
                </div>
              </button>

              {/* 7 Days Suspend Lock */}
              <button
                type="button"
                onClick={() => handleApplyWarning(showWarningModalForUser, "7days")}
                className="w-full p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-400 dark:hover:border-amber-900 text-left bg-neutral-50 dark:bg-neutral-900 hover:bg-amber-50/20 transition cursor-pointer flex items-start gap-3.5"
              >
                <div className="p-2 bg-amber-150 dark:bg-amber-900/30 text-amber-500 rounded-lg shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {isVi ? "Mức 3: Kháo tạm thời 7 Ngày" : "Level 3: 7-Day Suspension"}
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {isVi 
                      ? "Khóa tài khoản và chặn truy cập trong vòng 1 tuần sắp tới." 
                      : "Disables access to classroom modules and test submissions for complete 7 days."}
                  </p>
                </div>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowWarningModalForUser(null)}
                className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 bg-neutral-150 dark:bg-neutral-900 rounded-xl transition cursor-pointer"
              >
                {isVi ? "Hủy bỏ" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
