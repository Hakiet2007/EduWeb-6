import React, { useState } from "react";
import { User, AppLanguage } from "../types";
import { Search, ShieldAlert, BadgeCheck, GraduationCap, Mail, AlertTriangle } from "lucide-react";

interface ProfileSearchTabProps {
  currentUser: User | null;
  users: User[];
  language: AppLanguage;
  classrooms?: any[];
}

export default function ProfileSearchTab({
  currentUser,
  users = [],
  language,
  classrooms = []
}: ProfileSearchTabProps) {
  const isVi = language === "vi";

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Check student lock
  const isStudentLocked = currentUser?.role === "student" && (currentUser?.level || 0) < 10;

  // Trigger search on explicit button action only
  const handlePerformSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasSearched(true);
    setSelectedUser(null);

    const term = searchQuery.trim().toLowerCase();
    if (!term) {
      setResults([]);
      return;
    }

    const filtered = users.filter((u) => {
      // Don't search yourself
      if (currentUser && u.id === currentUser.id) return false;

      const matchesText =
        u.username.toLowerCase().includes(term) ||
        u.fullName.toLowerCase().includes(term) ||
        (u.email && u.email.toLowerCase().includes(term));

      if (!matchesText) return false;

      // Teachers are forbidden from searching other teachers or devs (must search students only)
      if (currentUser?.role === "teacher") {
        return u.role === "student";
      }
      // Dev can search everyone
      if (currentUser?.role === "dev") {
        return true;
      }
      // Students can search other students
      if (currentUser?.role === "student") {
        return u.role === "student";
      }
      return false;
    });

    setResults(filtered);
  };

  if (isStudentLocked) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center space-y-4 shadow-md mt-6 animate-scaleUp">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 text-amber-500 rounded-full flex items-center justify-center mx-auto text-2xl border-2 border-amber-300 dark:border-amber-900/60 shadow-inner">
          🔒
        </div>
        <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tight">
          {isVi ? "TÍNH NĂNG ĐANG BỊ KHÓA" : "FEATURE CURRENTLY LOCKED"}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-semibold">
          {isVi 
            ? "Tính năng Tra cứu hồ sơ học tập yêu cầu Học sinh đạt đến Cấp độ 10 trở lên. Hãy tích lũy XP bằng cách làm bài và trả lời câu hỏi trắc nghiệm hàng ngày nhé!"
            : "Exploring student directories requires you to reach Grade Level 10 or above. Maximize your lesson counts and complete Daily Quizzes to get there!"}
        </p>
        <div className="p-3 bg-blue-50 dark:bg-blue-955/20 border border-blue-150 dark:border-blue-900/50 rounded-xl">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
            {isVi 
              ? `Cấp độ hiện tại của bạn: Lv.${currentUser?.level || 1} / Yêu cầu: Lv.10` 
              : `Your Current Grade Level: Lv.${currentUser?.level || 1} / Required: Lv.10`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn" id="profile-search-tab">
      {/* Tab Header Banner */}
      <div className="bg-gradient-to-tr from-indigo-900 to-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/20">
            <Search className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-xl font-black tracking-tight uppercase">
            {isVi ? "Tra cứu hồ sơ thành viên" : "Explore Member Directories"}
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          {currentUser?.role === "dev"
            ? (isVi 
                ? "Bảng điều khiển tối cao dành cho Nhà phát triển: Phép tra cứu thông tin mọi tài khoản trong hệ thống và hiển thị trực tiếp hòm thư điện tử bảo mật." 
                : "Developer Administrative Directory: Query any system account credentials and access high-security emails directly.")
            : currentUser?.role === "student"
            ? (isVi 
                ? "Bảng tra cứu của Học sinh ưu tú (Lv.10+): Tìm kiếm bạn cùng lớp để xem xếp hạng, cấp độ và thi đua học tập." 
                : "Honor Student Search Directory (Lv.10+): Find academic peers, view grade standings, classes, and accumulated XP.")
            : (isVi 
                ? "Sổ liên lạc thông tin dành cho Giáo viên: Tra cứu kết quả học tập, thông tin xếp hạng và cấp học của học sinh." 
                : "Staff Query Panel: Obtain student-only overview credentials, rankings, levels, and progress parameters.")
          }
        </p>
      </div>

      {/* Advanced Search Bar Block */}
      <form onSubmit={handlePerformSearch} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3">
        <label className="block text-xs font-bold text-neutral-450 dark:text-neutral-400 uppercase tracking-widest font-mono">
          {isVi ? "Nhập thông tin tra cứu" : "Query parameters"}
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                currentUser?.role === "dev"
                  ? (isVi ? "Tên đăng nhập, họ tên hoặc hòm thư..." : "Username, display name or email address...")
                  : (isVi ? "Nhập tên đăng nhập hoặc họ tên học sinh..." : "Enter student username or full name...")
              }
              className="w-full pl-3 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 font-extrabold text-sm text-white rounded-xl active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            <Search className="w-4 h-4" />
            <span>{isVi ? "TÌM KIẾM" : "SEARCH"}</span>
          </button>
        </div>
      </form>

      {/* Results Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Results grid list */}
        <div className="lg:col-span-12 xl:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm space-y-3 min-h-[150px]">
          <h4 className="text-xs font-black text-neutral-400 dark:text-neutral-500 font-mono uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800 pb-2">
            {isVi ? "KẾT QUẢ ĐỐI CHIẾU" : "MATCHED QUERIES"}
          </h4>

          {!hasSearched ? (
            <div className="text-center py-6 text-neutral-400 dark:text-neutral-500 text-xs font-bold">
              🕊️ {isVi ? "Gõ thông tin rồi nhấn tìm kiếm" : "Enter credentials above to trace user"}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-6 text-rose-500 text-xs font-bold">
              ⚠️ {isVi ? "Không tìm thấy bản ghi phù hợp" : "No matching profile records found"}
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {results.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUser(u)}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/25"
                        : "border-neutral-100 dark:border-neutral-800/40 hover:bg-neutral-50 dark:hover:bg-neutral-950/45"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 font-black text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
                        {u.fullName.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 text-xs truncate">{u.fullName}</p>
                        <p className="text-[10px] text-neutral-400 font-mono truncate">@{u.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        u.role === "dev" ? "bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300" :
                        u.role === "teacher" ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300" :
                        "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                      }`}>
                        {u.role === "dev" ? (isVi ? "Nhà phát triển" : "Developer") : u.role === "teacher" ? (isVi ? "Giáo viên" : "Teacher") : (isVi ? "Học sinh" : "Student")}
                      </span>
                      {u.banned && (
                        <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                          BAN
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed profile viewer */}
        <div className="lg:col-span-12 xl:col-span-7 lg:sticky lg:top-4">
          {selectedUser ? (
            <div className="bg-[#f8fafc] dark:bg-[#0c1322] border-2 border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6 animate-scaleUp">
              {/* Badge & Banner Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md text-white font-black text-xl flex items-center justify-center animate-pulse">
                    {selectedUser.fullName.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-neutral-900 dark:text-white flex items-center gap-2">
                      {selectedUser.fullName}
                      {selectedUser.role === "dev" && <BadgeCheck className="w-4 h-4 text-cyan-400 fill-cyan-500/25" />}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono">@{selectedUser.username}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                  selectedUser.role === "dev" ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" :
                  selectedUser.role === "teacher" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" :
                  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                }`}>
                  {selectedUser.role === "dev" ? (isVi ? "Nhà phát triển" : "Developer") : selectedUser.role === "teacher" ? (isVi ? "Giáo viên" : "Teacher") : (isVi ? "Học sinh" : "Student")}
                </span>
              </div>

              {/* Secure Check: If user is banned, hide everything and only render the requested Ban Notice! */}
              {selectedUser.banned ? (
                <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/40 rounded-2xl flex flex-col items-center justify-center gap-3 animate-scaleUp">
                  <ShieldAlert className="w-12 h-12 text-rose-500 animate-bounce" />
                  <p className="font-black text-rose-600 dark:text-rose-400 text-sm uppercase tracking-wide">
                    {isVi ? "Tài khoản này đã bị cấm vĩnh viễn" : "This account has permantly banned"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Status parameters grids */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/80">
                      <span className="text-neutral-405 dark:text-neutral-400 text-[10px] uppercase font-bold tracking-widest block font-mono">
                        {isVi ? "Cấp độ" : "Current Grade"}
                      </span>
                      <span className="font-black text-neutral-800 dark:text-white text-base">
                        {isVi ? `Cấp ${selectedUser.level}` : `Lv.${selectedUser.level}`}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/80">
                      <span className="text-neutral-405 dark:text-neutral-400 text-[10px] uppercase font-bold tracking-widest block font-mono">
                        {isVi ? "Tổng số kinh nghiệm" : "Accumulated Points"}
                      </span>
                      <span className="font-black text-blue-600 dark:text-blue-400 text-base font-mono">
                        {selectedUser.xp} XP
                      </span>
                    </div>
                  </div>

                  {/* Secure Details for developer admin accounts only */}
                  {currentUser?.role === "dev" ? (
                    <div className="bg-zinc-950 border border-neutral-800 p-4 rounded-xl space-y-2 text-start font-mono text-xs">
                      <div className="text-cyan-400 font-extrabold flex items-center gap-2 uppercase tracking-wide">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        {isVi ? "🔑 Bảo mật hòm thư (Chỉ Dev)" : "🔑 Email Decryption (Dev Only)"}
                      </div>
                      <p className="text-neutral-300 leading-relaxed break-all bg-[#0a0f1d] p-2.5 rounded border border-neutral-800">
                        {selectedUser.email || "N/A/No-Email"}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/80 space-y-2 text-start text-xs">
                      <div className="text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider font-mono">
                        📧 Email
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-300 font-semibold font-mono">
                        •••••••••••••@••••.••• ({isVi ? "Đã mã hóa bảo mật" : "Encrypted for privacy"})
                      </p>
                    </div>
                  )}

                  {/* Classrooms mapping if role is student */}
                  {selectedUser.role === "student" && (
                    <div className="space-y-2 text-start text-xs">
                      <span className="text-neutral-400 dark:text-neutral-505 font-bold uppercase tracking-widest block font-mono">
                        <GraduationCap className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />
                        {isVi ? "CÁC LỚP HỌC ĐÃ THAM GIA" : "ENROLLED CLASSROOMS"}
                      </span>

                      {classrooms.filter(c => c.studentIds?.includes(selectedUser.id)).length === 0 ? (
                        <p className="text-neutral-400 italic font-medium p-1 text-center bg-white dark:bg-neutral-900 rounded-lg py-3 border border-dashed border-neutral-200 dark:border-neutral-800/55">
                          {isVi ? "Chưa tham gia bất kỳ lớp học tiêu chuẩn nào." : "Not enrolled in any standard classrooms yet."}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {classrooms.filter(c => c.studentIds?.includes(selectedUser.id)).map((c) => (
                            <div key={c.id} className="p-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/70 rounded-xl flex items-center justify-between">
                              <div className="font-bold text-neutral-800 dark:text-neutral-200">
                                {c.name}
                              </div>
                              <span className="text-[10px] font-mono font-bold uppercase p-1 px-2 bg-slate-150 dark:bg-slate-950 text-slate-500 dark:text-neutral-400 rounded-md">
                                {c.code}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-neutral-50 dark:bg-neutral-950/20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center text-neutral-400 dark:text-neutral-500 text-sm font-medium">
              ✨ {isVi ? "Chọn một hồ sơ bên trái để xem kết quả học tập và thông tin chi tiết!" : "Select a trace record from the list to display details of their study progress!"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
