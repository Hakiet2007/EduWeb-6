import React, { useState, useEffect } from "react";
import { User, AppLanguage, AnswerSubmission } from "../types";
import { translations } from "../utils/translations";
import { Zap, Clock, ShieldAlert, CheckCircle2, AlertCircle, BookOpen, GraduationCap } from "lucide-react";

interface DailyQuizTabProps {
  currentUser: User | null;
  language: AppLanguage;
  onRewardXp: (xpEarned: number) => void;
  onSaveQuizSubmission?: (answers: AnswerSubmission[], xpEarned: number) => void;
  onUpdateCurrentUser?: (user: User) => void;
}

interface QuizItem {
  subject: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const SUBJECT_POOL = [
  { code: "Toán", vi: "Toán học", en: "Mathematics", icon: "📐", color: "from-blue-500/10 to-indigo-500/10 border-blue-200/50 dark:border-blue-900/30 text-blue-600 dark:text-blue-400" },
  { code: "Lý", vi: "Vật lý", en: "Physics", icon: "⚡", color: "from-amber-500/10 to-orange-500/10 border-amber-200/50 dark:border-amber-900/30 text-amber-600 dark:text-amber-400" },
  { code: "Hoá", vi: "Hóa học", en: "Chemistry", icon: "🧪", color: "from-emerald-500/10 to-teal-500/10 border-emerald-200/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
  { code: "Anh", vi: "Tiếng Anh", en: "English", icon: "🇬🇧", color: "from-purple-500/10 to-fuchsia-500/10 border-purple-200/50 dark:border-purple-900/30 text-purple-600 dark:text-purple-400" },
  { code: "Sinh", vi: "Sinh học", en: "Biology", icon: "🧬", color: "from-rose-500/10 to-pink-500/10 border-rose-200/50 dark:border-rose-900/30 text-rose-600 dark:text-rose-400" },
  { code: "Khoa", vi: "Khoa học", en: "Natural Science", icon: "🌍", color: "from-cyan-500/10 to-sky-500/10 border-cyan-200/50 dark:border-cyan-900/30 text-cyan-600 dark:text-cyan-400" },
];

const GRADE_OPTIONS = [
  { value: "6", labelVi: "Lớp 6 (THCS)", labelEn: "Grade 6 (Secondary School)" },
  { value: "7", labelVi: "Lớp 7 (THCS)", labelEn: "Grade 7 (Secondary School)" },
  { value: "8", labelVi: "Lớp 8 (THCS)", labelEn: "Grade 8 (Secondary School)" },
  { value: "9", labelVi: "Lớp 9 (THCS)", labelEn: "Grade 9 (Secondary School)" },
  { value: "10", labelVi: "Lớp 10 (THPT)", labelEn: "Grade 10 (High School)" },
  { value: "11", labelVi: "Lớp 11 (THPT)", labelEn: "Grade 11 (High School)" },
  { value: "12", labelVi: "Lớp 12 (THPT)", labelEn: "Grade 12 (High School)" },
];

export default function DailyQuizTab({ currentUser, language, onRewardXp, onSaveQuizSubmission, onUpdateCurrentUser }: DailyQuizTabProps) {
  const t = translations[language];
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scores, setScores] = useState<Record<number, boolean>>({});
  const [errorMsg, setErrorMsg] = useState("");
  // Picked subjects to send to the AI
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["Toán", "Lý", "Hoá"]);
  const [isConfiguringSubjects, setIsConfiguringSubjects] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    if (!currentUser?.grade) return "10";
    const match = currentUser.grade.match(/\d+/);
    return match ? match[0] : "10";
  });

  // Cooldown status tracking states
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCooldownBlocked, setIsCooldownBlocked] = useState(false);
  const [solvedCountToday, setSolvedCountToday] = useState(0);

    // Check active cooldown status
    const getCooldownStatus = () => {
      if (!currentUser) return { isBlocked: false, timeLeftMs: 0, solvedCount: 0 };
      if (currentUser.role === "dev") {
        const todayStr = new Date().toISOString().split("T")[0];
        const lastDate = currentUser.lastQuizSolvedDate || "";
        const solvedCount = (lastDate && lastDate === todayStr) ? (currentUser.quizSolvedCountToday || 0) : 0;
        return { isBlocked: false, timeLeftMs: 0, solvedCount };
      }

    const now = Date.now();
    const cooldownTime = currentUser.quizCooldownUntil ? new Date(currentUser.quizCooldownUntil).getTime() : 0;

    // Check if cooldown timer is active
    if (cooldownTime > now) {
      return {
        isBlocked: true,
        timeLeftMs: cooldownTime - now,
        solvedCount: currentUser.quizSolvedCountToday || 0
      };
    }

    // Check if answered count today is 12 or more
    const todayStr = new Date().toISOString().split("T")[0];
    const lastDate = currentUser.lastQuizSolvedDate || "";
    let solvedCount = currentUser.quizSolvedCountToday || 0;

    if (lastDate && lastDate !== todayStr) {
      solvedCount = 0; // reset on new day
    }

    if (solvedCount >= 12) {
      return {
        isBlocked: true,
        timeLeftMs: 12 * 60 * 60 * 1000, // standard 12 hours fallback
        solvedCount
      };
    }

    return { isBlocked: false, timeLeftMs: 0, solvedCount };
  };

  useEffect(() => {
    const updateCooldown = () => {
      const status = getCooldownStatus();
      setIsCooldownBlocked(status.isBlocked);
      setSolvedCountToday(status.solvedCount);
      setTimeLeft(status.timeLeftMs);
    };

    updateCooldown();
    const timer = setInterval(() => {
      const status = getCooldownStatus();
      setIsCooldownBlocked(status.isBlocked);
      setSolvedCountToday(status.solvedCount);
      setTimeLeft(status.timeLeftMs);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser]);

  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (num: number) => String(num).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const handleDevClearCooldown = () => {
    if (!currentUser || !onUpdateCurrentUser) return;
    const restoredUser: User = {
      ...currentUser,
      quizCooldownUntil: undefined,
      quizSolvedCountToday: 0,
      devCustomCooldownMs: undefined,
    };
    onUpdateCurrentUser(restoredUser);

    setQuizzes([]);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScores({});
    setIsConfiguringSubjects(true);

    window.showToast?.(
      language === "vi" 
        ? "Đã dỡ bỏ cài đặt thời gian chờ cooldown thành công!" 
        : "Successfully cleared quiz cooldown duration!",
      "success"
    );
  };

  // Fetch quizzes using exact selected subjects list
  const fetchQuizzes = async (subjectsToGenerate: string[]) => {
    if (subjectsToGenerate.length !== 3) {
      window.showToast?.(
        language === "vi" 
          ? "Vui lòng chọn đúng chính xác 3 môn học!" 
          : "Please select exactly 3 subjects!",
        "role_alert"
      );
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          subjects: subjectsToGenerate,
          grade: selectedGrade
        }),
      });
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success && data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0) {
        setQuizzes(data.quiz);
        setSelectedAnswers({});
        setIsSubmitted(false);
        setScores({});
        setIsConfiguringSubjects(false);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Quiz generation error:", err);
      setErrorMsg(language === "vi" ? "Lỗi kết nối hoặc yêu cầu tạo câu hỏi của dịch vụ AI thất bại. Vui lòng thử lại." : "Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubject = (code: string) => {
    if (selectedSubjects.includes(code)) {
      setSelectedSubjects((prev) => prev.filter((s) => s !== code));
    } else {
      if (selectedSubjects.length < 3) {
        setSelectedSubjects((prev) => [...prev, code]);
      } else {
        window.showToast?.(
          language === "vi" 
            ? "Bạn đã chọn đủ 3 môn học, vui lòng bỏ bớt môn trước khi thay thế!" 
            : "You have selected 3 subjects, uncheck one first to replace!",
          "role_alert"
        );
      }
    }
  };

  const handleSelectAnswer = (idx: number, optChar: string) => {
    if (isSubmitted || isCooldownBlocked) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [idx]: optChar,
    }));
  };

  const handleSubmitQuiz = () => {
    if (isSubmitted || isCooldownBlocked) return;
    // Check if three questions answered
    if (Object.keys(selectedAnswers).length < quizzes.length) {
      window.showToast?.(
        language === "vi" ? "Vui lòng chọn đầy đủ đáp án cho tất cả câu hỏi!" : "Please provide answers to all questions!",
        "role_alert"
      );
      return;
    }

    let correctCount = 0;
    const itemScores: Record<number, boolean> = {};

    quizzes.forEach((q, idx) => {
      const isCorrect = selectedAnswers[idx] === q.correctAnswer;
      itemScores[idx] = isCorrect;
      if (isCorrect) {
        correctCount++;
      }
    });

    setScores(itemScores);
    setIsSubmitted(true);

    const rewards = correctCount * 20;

    if (onSaveQuizSubmission) {
      const answersList: AnswerSubmission[] = quizzes.map((q, idx) => {
        const studentAns = selectedAnswers[idx] || "";
        const isCorrect = studentAns === q.correctAnswer;
        return {
          questionId: `daily_q_${idx}_${Date.now()}`,
          studentAnswer: studentAns,
          isCorrect,
          score: isCorrect ? 20 : 0,
          gradedByTeacher: true
        };
      });
      onSaveQuizSubmission(answersList, rewards);
    } else {
      if (rewards > 0) {
        onRewardXp(rewards);
      }
    }

    if (rewards > 0) {
      window.showToast?.(
        language === "vi"
          ? `Bạn đã đạt được ${correctCount}/${quizzes.length} câu trả lời đúng và nhận +${rewards} XP!`
          : `You got ${correctCount}/${quizzes.length} correct answers and earned +${rewards} XP!`,
        "success"
      );
    } else {
      window.showToast?.(
        language === "vi"
          ? `Bạn chưa có câu trả lời đúng nào hôm nay. Hãy tiếp tục luyện tập nhé!`
          : `No correct answers today. Keep practicing!`,
        "info"
      );
    }
  };

  const startNewGenerationFlow = () => {
    if (selectedSubjects.length !== 3) {
      window.showToast?.(
        language === "vi" ? "Bạn cần chọn chính xác 3 môn học!" : "You must select exactly 3 subjects!",
        "role_alert"
      );
      return;
    }
    fetchQuizzes(selectedSubjects);
  };

  if (isCooldownBlocked) {
    return (
      <div className="max-w-md mx-auto p-8 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-3xl shadow-xl text-center space-y-6 animate-scaleUp" id="quiz-cooldown-panel">
        {/* Lock or Shield Icon with Pulse Halo */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center bg-amber-500/10 rounded-full border border-amber-500/30">
          <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40 animate-spin [animation-duration:15s]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
            {language === "vi" ? "Thời gian chờ thử thách" : "AI Quiz Cooldown Active"}
          </h2>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
            {language === "vi"
              ? "Bạn đã hoàn thành giới hạn tối đa 12 câu hỏi hằng ngày. Vui lòng nghỉ ngơi mười hai giờ trước khi bắt đầu bài kiểm tra AI tiếp theo!"
              : "You have completed the maximum limit of 12 daily challenge questions. Take a rest for twelve hours before your next AI test!"}
          </p>
        </div>

        {/* Big Monospace Digital Countdown clock */}
        <div className="p-5 bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-100 dark:border-neutral-950 rounded-2xl">
          <p className="text-[10px] font-mono font-black tracking-widest text-neutral-450 uppercase mb-1">
            {language === "vi" ? "THỜI GIAN CHỜ CÒN LẠI:" : "TIME REMAINING:"}
          </p>
          <div className="text-4xl font-black font-mono text-amber-500 tracking-widest leading-none drop-shadow-sm select-all">
            {formatTimeLeft(timeLeft)}
          </div>
        </div>

        {/* Progress bar visualizer */}
        <div className="space-y-1 text-left">
          <div className="flex justify-between text-[11px] font-bold text-neutral-400">
            <span>{language === "vi" ? "Tiến độ ngày hôm nay" : "Today's Limit Progress"}</span>
            <span className="text-amber-500 font-mono">12/12 {language === "vi" ? "câu" : "Qs"} (100%)</span>
          </div>
          <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-950 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Developer Admin panel controls */}
        {currentUser?.role === "dev" && (
          <div className="pt-4 border-t border-dashed border-neutral-150 dark:border-neutral-800 space-y-3">
            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-xs text-cyan-600 dark:text-cyan-400 leading-relaxed font-mono text-left space-y-1">
              <span className="font-extrabold block text-[10px] tracking-wider text-cyan-500 uppercase">⚡ DEV COMPONENT HUB</span>
              <p>Count Today: {solvedCountToday}/12 questions</p>
              <p>Cooldown Type: {currentUser.devCustomCooldownMs ? `${currentUser.devCustomCooldownMs / 1000}s` : "Default 12h"}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDevClearCooldown}
                className="flex-1 py-3 px-4 bg-cyan-600 hover:bg-cyan-500 select-none text-white text-xs font-black rounded-xl transition shadow cursor-pointer uppercase tracking-wider"
              >
                🔓 {language === "vi" ? "Bỏ qua chờ (Dev)" : "Bypass Cooldown"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn" id="daily-quiz-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-yellow-300 fill-current" />
            Daily Challenge
          </div>
          <h2 className="text-2xl font-black tracking-tight">{t.aiQuizTitle}</h2>
          <p className="text-xs text-amber-100">
            {language === "vi" 
              ? "Tự do chọn 3 môn học bất kỳ để AI tạo đề thi thông thái và nhận đến 240 XP mỗi ngày!" 
              : "Choose any 3 custom subjects to challenge your mind and earn up to 240 XP daily!"}
          </p>

          {/* Today's solved progress with indicator bar */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-md text-amber-50">
              {language === "vi" 
                ? `Đạt được: ${solvedCountToday}/12 câu hỏi trong ngày` 
                : `Completed: ${solvedCountToday}/12 questions today`}
            </span>
            <div className="w-full sm:w-32 h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-yellow-300 to-amber-300 transition-all duration-300 rounded-full" 
                style={{ width: `${Math.min(100, (solvedCountToday / 12) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsConfiguringSubjects(true)}
          disabled={loading}
          className="self-start md:self-auto px-5 py-2.5 bg-white text-orange-600 hover:bg-neutral-50 font-bold rounded-xl text-sm transition shadow-sm cursor-pointer disabled:opacity-50 select-none"
        >
          {language === "vi" ? "⚙️ Chọn lại 3 môn" : "⚙️ Select 3 subjects"}
        </button>
      </div>

      {/* Dynamic Subjects Setup Area */}
      {isConfiguringSubjects && (
        <div className="bg-white dark:bg-neutral-900 border-2 border-dashed border-orange-300 dark:border-orange-950 rounded-2xl p-6 space-y-5 animate-scaleUp">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-orange-500" />
            <div>
              <h3 className="font-extrabold text-neutral-900 dark:text-neutral-100">
                {language === "vi" ? "Tạo đề bài AI - Chọn môn học" : "AI Quiz Generator - Select Subjects"}
              </h3>
              <p className="text-xs text-neutral-400">
                {language === "vi" ? "Chọn lớp học và tổ hợp 3 môn học để AI tạo câu hỏi phù hợp." : "Select your grade and any 3 subjects for AI-generated questions."}
              </p>
            </div>
          </div>

          {/* Step 1: Selection of Grade Level */}
          <div className="space-y-4 p-5 bg-gradient-to-br from-orange-500/5 to-amber-500/5 dark:from-orange-950/5 dark:to-amber-950/5 rounded-2xl border border-orange-100 dark:border-orange-950/40">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-extrabold text-white">1</span>
              <label className="block text-[11px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-wider">
                {language === "vi" ? "Chọn cấp lớp của bạn" : "Choose Your Grade Level"}
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* THCS */}
              <div className="space-y-2.5 p-3.5 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-150 dark:border-neutral-800/80">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-450 dark:text-neutral-500 block">
                  {language === "vi" ? "🏫 Trung học Cơ sở (THCS)" : "🏫 Junior Secondary (Grades 6-9)"}
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {GRADE_OPTIONS.filter(g => parseInt(g.value) <= 9).map((g) => {
                    const isSelected = selectedGrade === g.value;
                    return (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setSelectedGrade(g.value)}
                        className={`py-2.5 px-1 rounded-xl text-center transition-all duration-200 cursor-pointer select-none flex flex-col justify-center items-center gap-0.5 border ${
                          isSelected
                            ? "border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-500/20 font-black scale-[1.03]"
                            : "border-neutral-200 dark:border-neutral-800 hover:border-orange-300 dark:hover:border-orange-900/60 hover:bg-orange-500/5 dark:hover:bg-orange-950/10 bg-white dark:bg-neutral-900/40"
                        }`}
                      >
                        <span className="text-sm font-extrabold leading-none">{g.value}</span>
                        <span className={`text-[8px] font-bold tracking-tight ${isSelected ? "text-orange-100" : "text-neutral-400 dark:text-neutral-500"}`}>
                          {language === "vi" ? "Lớp" : "Grade"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* THPT */}
              <div className="space-y-2.5 p-3.5 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-150 dark:border-neutral-800/80">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-450 dark:text-neutral-500 block">
                  {language === "vi" ? "🎓 Trung học Phổ thông (THPT)" : "🎓 Senior High (Grades 10-12)"}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {GRADE_OPTIONS.filter(g => parseInt(g.value) >= 10).map((g) => {
                    const isSelected = selectedGrade === g.value;
                    return (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setSelectedGrade(g.value)}
                        className={`py-2.5 px-1 rounded-xl text-center transition-all duration-200 cursor-pointer select-none flex flex-col justify-center items-center gap-0.5 border ${
                          isSelected
                            ? "border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-500/20 font-black scale-[1.03]"
                            : "border-neutral-200 dark:border-neutral-800 hover:border-orange-300 dark:hover:border-orange-900/60 hover:bg-orange-500/5 dark:hover:bg-orange-950/10 bg-white dark:bg-neutral-900/40"
                        }`}
                      >
                        <span className="text-sm font-extrabold leading-none">{g.value}</span>
                        <span className={`text-[8px] font-bold tracking-tight ${isSelected ? "text-orange-100" : "text-neutral-400 dark:text-neutral-500"}`}>
                          {language === "vi" ? "Lớp" : "Grade"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-neutral-450 dark:text-neutral-500 italic leading-snug">
              {language === "vi" 
                ? "💡 AI sẽ tự động điều chỉnh kiến thức, công thức và mức độ khó phù hợp với chương trình Lớp " + selectedGrade + "."
                : "💡 AI will customize difficulty and curriculum to match Grade " + selectedGrade + " level."}
            </p>
          </div>

          {/* Step 2 Header */}
          <div className="space-y-1 pt-1">
            <label className="block text-[11px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-wider">
              {language === "vi" ? "Bước 2: Chọn tổ hợp chính xác 3 môn học" : "Step 2: Check Exactly 3 Study Categories"}
            </label>
            <p className="text-[11px] text-neutral-450">
              {language === "vi" ? "Xây dựng tổ hợp riêng biệt để thử sức nhận 240 XP hôm nay:" : "Build your custom focus subject combination to earn +240 XP today:"}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SUBJECT_POOL.map((subj) => {
              const isSelected = selectedSubjects.includes(subj.code);
              return (
                <button
                  key={subj.code}
                  type="button"
                  onClick={() => handleToggleSubject(subj.code)}
                  className={`p-4 rounded-xl border-2 text-left transition relative cursor-pointer flex flex-col justify-between h-28 ${
                    isSelected
                      ? "border-orange-500 bg-orange-50/45 dark:bg-orange-950/20 shadow-sm"
                      : "border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/20 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl">{subj.icon}</span>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center font-bold text-[10px] ${
                      isSelected 
                        ? "border-orange-500 bg-orange-500 text-white" 
                        : "border-neutral-300 dark:border-neutral-600"
                    }`}>
                      {isSelected ? "✓" : ""}
                    </span>
                  </div>
                  <div>
                    <p className="font-black text-xs text-neutral-800 dark:text-neutral-200">
                      {language === "vi" ? subj.vi : subj.en}
                    </p>
                    <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono font-bold mt-0.5">
                      {subj.code}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-xs font-mono font-medium text-neutral-400">
              {language === "vi" 
                ? `Đang chọn: ${selectedSubjects.length}/3 môn học` 
                : `Selected: ${selectedSubjects.length}/3 subjects`}
            </span>
            <button
              onClick={startNewGenerationFlow}
              disabled={loading || selectedSubjects.length !== 3}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition shadow-md cursor-pointer disabled:opacity-50 select-none"
            >
              {loading ? (language === "vi" ? "Đang khởi tạo đề..." : "Generating quiz...") : (language === "vi" ? "BẮT ĐẦU TẠO ĐỀ AI 🚀" : "START AI GENERATION 🚀")}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-neutral-500 font-bold">{language === "vi" ? "AI đang soạn thảo đề bài riêng biệt..." : "AI is generating your unique quiz..."}</p>
        </div>
      ) : errorMsg ? (
        <div className="p-6 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50 text-center">
          <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-rose-500" />
          <p className="text-sm font-semibold">{errorMsg}</p>
          <button onClick={() => fetchQuizzes(selectedSubjects)} className="mt-4 px-4 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-500 transition cursor-pointer select-none">
            {language === "vi" ? "Thử lại" : "Retry"}
          </button>
        </div>
      ) : (
        quizzes.length > 0 && (
          <div className="space-y-6">
            {quizzes.map((quiz, quizIdx) => {
              const isCorrect = scores[quizIdx] === true;
              const submitted = isSubmitted;
              const chosen = selectedAnswers[quizIdx];

              return (
                <div
                  key={quizIdx}
                  className={`bg-white dark:bg-neutral-900 border ${
                    submitted
                      ? isCorrect
                        ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10"
                        : "border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/10"
                      : "border-neutral-150 dark:border-neutral-800"
                  } rounded-2xl p-6 shadow-sm`}
                  id={`quiz-card-${quizIdx}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black rounded-full uppercase tracking-wider shadow-sm">
                      {quiz.subject}
                    </span>
                    {submitted && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isCorrect ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-850 dark:bg-rose-950 dark:text-rose-300"
                      }`}>
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            +20 XP
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            {t.incorrectQuiz}
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <p className="text-base font-bold text-neutral-800 dark:text-neutral-100 mb-4 leading-relaxed">
                    {quiz.question}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {quiz.options.map((opt, optIdx) => {
                      const optChar = opt.trim().substring(0, 1).toUpperCase();
                      const isSelected = chosen === optChar;
                      const isActualAnswer = quiz.correctAnswer === optChar;

                      let buttonStyle = "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900";

                      if (!submitted && isSelected) {
                        buttonStyle = "border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-700 dark:text-neutral-100 font-bold ring-1 ring-orange-500";
                      } else if (!submitted && currentUser?.role === "dev" && isActualAnswer) {
                        buttonStyle = "border-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/15 text-neutral-800 dark:text-neutral-200 font-medium ring-1 ring-emerald-505/20";
                      } else if (submitted) {
                        if (isActualAnswer) {
                          buttonStyle = "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold ring-1 ring-emerald-500";
                        } else if (isSelected && !isCorrect) {
                          buttonStyle = "border-rose-500 bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 font-bold ring-1 ring-rose-500";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(quizIdx, optChar)}
                          disabled={submitted}
                          className={`group w-full text-left p-3.5 rounded-xl border-2 text-sm transition-all duration-200 flex items-center justify-between gap-2 ${
                            submitted 
                              ? "cursor-not-allowed" 
                              : "cursor-pointer hover:scale-[1.035] active:scale-[0.985] hover:shadow-md hover:border-neutral-400 dark:hover:border-neutral-600"
                          } ${buttonStyle}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-extrabold shrink-0 transition-all duration-200 group-hover:text-neutral-950 dark:group-hover:text-white group-hover:scale-110">{optChar}.</span>
                            <span className="transition-all duration-200 group-hover:text-neutral-950 dark:group-hover:text-white group-hover:font-extrabold">{opt.substring(2)}</span>
                          </div>
                          {!submitted && currentUser?.role === "dev" && isActualAnswer && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black uppercase shrink-0">
                              {language === "vi" ? "Đáp án" : "Key"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <div className="mt-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-150 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed space-y-1">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 block mb-1">
                        {language === "vi" ? "GIẢI THÍCH:" : "EXPLANATION:"}
                      </span>
                      <p className="font-medium">
                        {quiz.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {!isSubmitted ? (
              <div className="text-center pt-4">
                <button
                  onClick={handleSubmitQuiz}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-md transition transform hover:scale-105 inline-flex items-center gap-2 cursor-pointer select-none"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {language === "vi" ? "GỬI ĐÁP ÁN NHẬN XP" : "SUBMIT ANSWERS FOR XP"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-center text-sm font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  {t.completedDailyQuiz}
                </div>
                
                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setIsConfiguringSubjects(true);
                      setQuizzes([]);
                      setSelectedAnswers({});
                      setIsSubmitted(false);
                      setScores({});
                    }}
                    className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black rounded-xl shadow-md transition transform hover:scale-105 inline-flex items-center gap-2 cursor-pointer select-none"
                  >
                    <Zap className="w-4 h-4 fill-current text-yellow-300" />
                    {language === "vi" ? "Tiếp tục tạo thử thách mới 🚀" : "Create Another Challenge 🚀"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
