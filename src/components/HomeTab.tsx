import React from "react";
import { User, AppLanguage } from "../types";
import { translations } from "../utils/translations";
import { BookOpen, Star, Zap, Award, CheckCircle, FileText, Send } from "lucide-react";

interface HomeTabProps {
  currentUser: User | null;
  language: AppLanguage;
  onNavigate: (tab: string) => void;
}

export default function HomeTab({ currentUser, language, onNavigate }: HomeTabProps) {
  const t = translations[language];

  // Calculate stats
  const nextLevelXp = 100;
  const xpCurrentLevel = currentUser ? currentUser.xp % nextLevelXp : 0;
  const levelNum = currentUser ? currentUser.level : 1;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Intro Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 md:p-12 shadow-lg">
        <div className="absolute top-0 right-0 p-8 transform translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
          <BookOpen className="w-96 h-96" />
        </div>
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <SparklesIcon className="w-4 h-4 text-amber-300" />
            AI-Enhanced Learning Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            EduWeb
          </h1>
          <p className="text-lg text-indigo-100 font-medium">
            {t.introSubtitle}
          </p>
          <p className="text-sm text-indigo-200 leading-relaxed">
            {t.introDesc}
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate("classes")}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold rounded-xl transition duration-200 transform hover:scale-105 shadow-md flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-5 h-5" />
              {t.getStarted}
            </button>
            <button
              onClick={() => onNavigate("daily-quiz")}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition duration-200 border border-white/20 flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              {t.navDailyQuiz}
            </button>
          </div>
        </div>
      </div>

      {/* Brief Account overview if logged in */}
      {currentUser && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm flex items-center gap-5">
            <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-500">
              <Star className="w-8 h-8 fill-current" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-mono tracking-wider uppercase">
                {t.level}
              </p>
              <h3 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
                Lv. {levelNum}
              </h3>
              <p className="text-xs text-neutral-400">
                {currentUser.role === "dev" ? t.devAccountName : t.welcome}
              </p>
            </div>
          </div>

          <div className="bg-card border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm flex items-center gap-5">
            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500">
              <Zap className="w-8 h-8 fill-current" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-neutral-500 font-mono tracking-wider uppercase">
                {t.xp}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
                  {currentUser.xp} XP
                </span>
                <span className="text-xs text-neutral-400">
                  ({xpCurrentLevel}/100)
                </span>
              </div>
              <div className="mt-2 w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${xpCurrentLevel}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm flex items-center gap-5">
            <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-mono tracking-wider uppercase">
                {t.role}
              </p>
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 capitalize">
                {currentUser.role === "teacher"
                  ? t.teacher
                  : currentUser.role === "dev"
                  ? t.dev
                  : t.student}
              </h3>
              <p className="text-xs text-neutral-400">
                {currentUser.fullName}
              </p>
            </div>
          </div>

          {/* New Study Streak Dashboard Card */}
          <div className="bg-card border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm flex items-center gap-5 relative overflow-hidden group">
            <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-950/20 text-rose-500">
              <span className="text-3xl animate-pulse block">🔥</span>
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-mono tracking-wider uppercase">
                {t.streakTitle}
              </p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-450">
                {currentUser.streakCount || 0} {t.streakDaysSuffix}
              </h3>
              <p className="text-[10px] text-neutral-400 mt-1 leading-tight">
                {(() => {
                  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
                  return currentUser.lastActiveDate === todayStr 
                    ? t.streakMaintainedToday 
                    : t.streakNotMaintainedToday;
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feature grid */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-blue-500" />
          {t.homeTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-6 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {t.homeSection1Title}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t.homeSection1Desc}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-6 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {t.homeSection2Title}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t.homeSection2Desc}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-6 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {t.homeSection3Title}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t.homeSection3Desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
    </svg>
  );
}
