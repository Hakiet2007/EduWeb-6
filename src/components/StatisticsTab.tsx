import React from "react";
import { User, TopicSubmission, AppLanguage } from "../types";
import { translations } from "../utils/translations";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";
import { BarChart3, CheckCircle2, FileQuestion, GraduationCap, Percent, TrendingUp } from "lucide-react";

interface StatisticsTabProps {
  currentUser: User | null;
  submissions: TopicSubmission[];
  language: AppLanguage;
}

export default function StatisticsTab({ currentUser, submissions, language }: StatisticsTabProps) {
  const t = translations[language];

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-neutral-500">
        Please sign in to view statistics.
      </div>
    );
  }

  // Calculate statistics
  const isTeacher = currentUser.role === "teacher" || currentUser.role === "dev";

  // For students
  const studentSubmissions = submissions.filter((sub) => sub.studentId === currentUser.id);
  let totalStudentQuestionsAnswered = 0;
  let totalStudentCorrectAnswers = 0;

  studentSubmissions.forEach((sub) => {
    sub.answers.forEach((ans) => {
      totalStudentQuestionsAnswered++;
      if (ans.isCorrect === true) {
        totalStudentCorrectAnswers++;
      }
    });
  });

  const accuracyRate =
    totalStudentQuestionsAnswered > 0
      ? Math.round((totalStudentCorrectAnswers / totalStudentQuestionsAnswered) * 100)
      : 100;

  // For teachers (number of student submissions graded / total)
  const teacherSubmissionsTotal = submissions.length;
  const teacherSubmissionsGraded = submissions.filter((sub) => sub.isFullyGraded).length;
  const teacherSubmissionsPending = teacherSubmissionsTotal - teacherSubmissionsGraded;

  // Prepare chart data
  const studentPieData = [
    { name: language === "vi" ? "Trả lời Đúng" : "Correct Answers", value: totalStudentCorrectAnswers, color: "#10b981" },
    { name: language === "vi" ? "Chưa đúng / Chưa chấm" : "Incorrect/Ungraded", value: Math.max(0, totalStudentQuestionsAnswered - totalStudentCorrectAnswers), color: "#f43f5e" }
  ];

  const teacherPieData = [
    { name: language === "vi" ? "Đã chấm điểm" : "Graded Submissions", value: teacherSubmissionsGraded, color: "#a855f7" },
    { name: language === "vi" ? "Chờ chấm điểm" : "Pending Action", value: teacherSubmissionsPending, color: "#f97316" }
  ];

  // Subject statistics for standard categories
  const subjectChartData = [
    { name: language === "vi" ? "Tiếng Anh" : "English", total: totalStudentQuestionsAnswered, correct: totalStudentCorrectAnswers },
  ];

  return (
    <div className="space-y-8 animate-fadeIn" id="statistics-container">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Stats or Teacher Stats based on role */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-xl">
            <FileQuestion className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-mono uppercase tracking-wider">
              {t.statsStudentAnswered}
            </p>
            <h3 className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
              {totalStudentQuestionsAnswered}
            </h3>
            <p className="text-xs text-neutral-500">
              {language === "vi" ? "Số câu hỏi bạn đã nộp đáp án" : "Total answered items"}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-xl">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-mono uppercase tracking-wider">
              {t.statsCorrectAnswers}
            </p>
            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {totalStudentCorrectAnswers}
            </h3>
            <p className="text-xs text-neutral-500">
              {language === "vi" ? "Được tự động chấm Đúng hoặc GV chấm duyệt" : "Auto-graded or manually confirmed correct"}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl">
            <Percent className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-mono uppercase tracking-wider">
              {t.accuracyRate}
            </p>
            <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400">
              {accuracyRate}%
            </h3>
            <p className="text-xs text-neutral-500">
              {language === "vi" ? "Tỉ lệ chính xác học tập" : "Performance score"}
            </p>
          </div>
        </div>
      </div>

      {isTeacher && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-100 font-mono">
                {t.teacher} Dashboard
              </p>
              <h3 className="text-2xl font-black">
                {t.statsTeacherGraded}: {teacherSubmissionsGraded} / {teacherSubmissionsTotal}
              </h3>
              <p className="text-sm opacity-90 mt-1">
                {language === "vi"
                  ? `Còn lại ${teacherSubmissionsPending} bài cần xem xét.`
                  : `Waiting for feedback: ${teacherSubmissionsPending} entries.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Answer Breakdown Chart */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            {language === "vi" ? "Biểu đồ tỷ lệ kết quả học tập" : "Success & Completion Distribution"}
          </h3>
          <div className="h-64 flex items-center justify-center">
            {totalStudentQuestionsAnswered === 0 ? (
              <p className="text-neutral-400 text-sm">
                {language === "vi" ? "Chưa có dữ liệu học tập. Hãy làm thử bài tập ngay!" : "No study data yet. Go submit tasks first!"}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={studentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {studentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Teacher grading status distribution Chart */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            {language === "vi" ? "Tiến trình chấm bài của Lớp học" : "Classroom Submissions Stats"}
          </h3>
          <div className="h-64 flex items-center justify-center">
            {teacherSubmissionsTotal === 0 ? (
              <p className="text-neutral-400 text-sm">
                {language === "vi" ? "Không có bài nộp nào của học sinh trong hệ thống." : "No student submissions recorded yet."}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={teacherPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {teacherPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
