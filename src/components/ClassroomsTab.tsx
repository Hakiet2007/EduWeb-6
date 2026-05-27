import React, { useState } from "react";
import { User, Classroom, Topic, Question, QuestionType, TopicSubmission, AppLanguage, AnswerSubmission } from "../types";
import { translations } from "../utils/translations";
import { BookOpen, FolderPlus, Plus, Eye, Key, UserCheck, Code, Award, Edit3, HelpCircle, Check, Send, Sparkles, LogIn, ChevronRight, RefreshCw, X, LogOut, AlertTriangle } from "lucide-react";
import { SampleTopicView } from "./SampleTopicView";

interface ClassroomsTabProps {
  currentUser: User | null;
  classrooms: Classroom[];
  submissions: TopicSubmission[];
  language: AppLanguage;
  onCreateClassroom: (name: string) => void;
  onJoinClassroom: (code: string) => void;
  onCreateTopic: (classId: string, name: string, description: string) => void;
  onAddQuestion: (classId: string, topicId: string, question: Question) => void;
  onSubmitTopicAnswers: (submission: Omit<TopicSubmission, "id" | "submittedAt">) => void;
  onGradeAnswer: (submissionId: string, questionId: string, isCorrect: boolean) => void;
  users?: User[];
  onDeleteClassroom?: (classId: string) => void;
  onRequestLeaveClassroom?: (classId: string) => void;
  onApproveLeave?: (classId: string, studentId: string) => void;
  onDenyLeave?: (classId: string, studentId: string) => void;
  onKickStudent?: (classId: string, studentId: string) => void;
}

export default function ClassroomsTab({
  currentUser,
  classrooms,
  submissions,
  language,
  onCreateClassroom,
  onJoinClassroom,
  onCreateTopic,
  onAddQuestion,
  onSubmitTopicAnswers,
  onGradeAnswer,
  users = [],
  onDeleteClassroom,
  onRequestLeaveClassroom,
  onApproveLeave,
  onDenyLeave,
  onKickStudent,
}: ClassroomsTabProps) {
  const t = translations[language];

  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [showGradingSubId, setShowGradingSubId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [newClassName, setNewClassName] = useState("");
  const [joinClassCode, setJoinClassCode] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");

  // Question Creator state
  const [qType, setQType] = useState<QuestionType>("abcd");
  const [qGrade, setQGrade] = useState("10");
  const [qSubject, setQSubject] = useState("Toán");
  const [qPrompt, setQPrompt] = useState("");
  const [qOptA, setQOptA] = useState("");
  const [qOptB, setQOptB] = useState("");
  const [qOptC, setQOptC] = useState("");
  const [qOptD, setQOptD] = useState("");
  const [qCorrectOpt, setQCorrectOpt] = useState("A");
  const [qFillAnswers, setQFillAnswers] = useState("");
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  const handleSuggestQuestionByAI = async () => {
    setIsGeneratingQuestion(true);
    try {
      const res = await fetch("/api/generate-custom-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: qPrompt.trim() || undefined,
          type: qType,
          grade: qGrade,
          subject: qSubject,
        }),
      });
      const data = await res.json();
      if (data.success && data.question) {
        const q = data.question;
        if (q.prompt) setQPrompt(q.prompt);
        if (q.options && q.options.length >= 4) {
          const cleanOpt = (txt: string) => txt.replace(/^[A-D]\.\s*/, "").trim();
          setQOptA(cleanOpt(q.options[0]));
          setQOptB(cleanOpt(q.options[1]));
          setQOptC(cleanOpt(q.options[2]));
          setQOptD(cleanOpt(q.options[3]));
          if (q.correctOption) {
            setQCorrectOpt(q.correctOption.toUpperCase());
          }
        }
        if (q.fillAnswers) {
          setQFillAnswers(q.fillAnswers.join(", "));
        }
        window.showToast?.(
          language === "vi" 
            ? "✨ Đã gợi ý câu hỏi tự động thành công!" 
            : "✨ AI Suggested Question generated!",
          "success"
        );
      }
    } catch (err) {
      console.error(err);
      window.showToast?.("AI service failed to generate suggest question.", "info");
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  // Student Solving answers state
  const [solvingAnswers, setSolvingAnswers] = useState<Record<string, string>>({});
  const [devViewMode, setDevViewMode] = useState<"student" | "teacher">("student");

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    if (currentUser?.role !== "teacher" && currentUser?.role !== "dev") {
      window.showToast?.(
        language === "vi" ? "Chỉ Giáo viên mới có quyền tạo lớp học!" : "Only Teachers can create classrooms!",
        "error"
      );
      return;
    }
    onCreateClassroom(newClassName);
    setNewClassName("");
  };

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinClassCode.trim()) return;
    if (currentUser?.role === "teacher") {
      window.showToast?.(
        language === "vi" ? "Tài khoản Giáo viên không thể tham gia lớp học của giáo viên khác!" : "Teachers cannot join classrooms of other Teachers!",
        "error"
      );
      return;
    }
    onJoinClassroom(joinClassCode.trim());
    setJoinClassCode("");
  };

  const handleCreateTopicSubmit = (e: React.FormEvent, classId: string) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    onCreateTopic(classId, newTopicName, newTopicDesc);
    setNewTopicName("");
    setNewTopicDesc("");
  };

  const handleAddQuestionSubmit = (e: React.FormEvent, classId: string, topicId: string) => {
    e.preventDefault();
    if (!qPrompt.trim()) return;

    let questionData: Question = {
      id: "q_" + Date.now(),
      type: qType,
      prompt: qPrompt,
      grade: qGrade,
      subject: qSubject,
    };

    if (qType === "abcd") {
      questionData.options = [
        `A. ${qOptA || "Option A"}`,
        `B. ${qOptB || "Option B"}`,
        `C. ${qOptC || "Option C"}`,
        `D. ${qOptD || "Option D"}`,
      ];
      questionData.correctOption = qCorrectOpt;
    } else if (qType === "fill_in_the_blank") {
      if (qFillAnswers.trim()) {
        questionData.fillAnswers = qFillAnswers
          .split(",")
          .map((ans) => ans.trim().toLowerCase())
          .filter((ans) => ans.length > 0);
      }
    }

    onAddQuestion(classId, topicId, questionData);

    // Reset fields
    setQPrompt("");
    setQOptA("");
    setQOptB("");
    setQOptC("");
    setQOptD("");
    setQFillAnswers("");
  };

  const handleStudentSubmitAnswers = (classId: string, topic: Topic) => {
    if (!currentUser) return;

    const answersList: AnswerSubmission[] = topic.questions.map((q) => {
      const studentAnswerString = (solvingAnswers[q.id] || "").trim();
      let isCorrect: boolean | undefined = undefined;
      let score: number | undefined = undefined;

      if (q.type === "abcd") {
        isCorrect = studentAnswerString.toUpperCase() === (q.correctOption || "").toUpperCase();
        score = isCorrect ? 20 : 0;
      } else if (q.type === "fill_in_the_blank" && q.fillAnswers && q.fillAnswers.length > 0) {
        // Automatically check if it matches any developer configured answer
        const isMatched = q.fillAnswers.some(
          (ans) => ans.toLowerCase() === studentAnswerString.toLowerCase()
        );
        if (isMatched) {
          isCorrect = true;
          score = 20;
        }
      }

      return {
        questionId: q.id,
        studentAnswer: studentAnswerString,
        isCorrect,
        score,
        gradedByTeacher: isCorrect ? true : undefined,
      };
    });

    const hasUngraded = answersList.some((ans) => ans.isCorrect === undefined);

    onSubmitTopicAnswers({
      topicId: topic.id,
      topicName: topic.name,
      classId,
      className: classrooms.find((c) => c.id === classId)?.name || "",
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      answers: answersList,
      isFullyGraded: !hasUngraded,
    });

    window.showToast?.(
      t.submittedSuccess + (hasUngraded ? ` - ${t.gradeManualWarning}` : ""),
      hasUngraded ? "role_alert" : "success"
    );
    setActiveTopicId(null);
    setSolvingAnswers({});
  };

  // Filter classrooms based on user status
  const visibleClassrooms = classrooms.filter((cls) => {
    if (currentUser?.role === "teacher" || currentUser?.role === "dev") {
      return true; // Teachers and developers see all classes
    }
    // Students see enrolled classes they joined, or the default trial class template
    return cls.studentIds.includes(currentUser?.id || "") || cls.id === "class_trial_01";
  });

  const selectedClass = classrooms.find((c) => c.id === activeClassId);
  const selectedTopic = selectedClass?.topics.find((t) => t.id === activeTopicId);

  // Pre-fill correct answers for dev mode automatically when they open any topic
  React.useEffect(() => {
    if (currentUser?.role === "dev" && selectedTopic) {
      const devAnswers: Record<string, string> = {};
      selectedTopic.questions.forEach((q) => {
        if (q.type === "abcd") {
          devAnswers[q.id] = q.correctOption || "A";
        } else if (q.type === "fill_in_the_blank") {
          devAnswers[q.id] = (q.fillAnswers && q.fillAnswers[0]) || "đúng";
        } else if (q.type === "essay") {
          devAnswers[q.id] = language === "vi"
            ? "Bài làm tự luận mẫu chuẩn được AI giải đáp đầy đủ chi tiết."
            : "Standard sample essay response compiled natively for test and preview submission.";
        }
      });
      setSolvingAnswers(devAnswers);
    } else {
      setSolvingAnswers({});
    }
  }, [selectedTopic, currentUser, language]);

  return (
    <div className="space-y-8 animate-fadeIn" id="classrooms-view">
      {/* If looking at a specific topic/assignment */}
      {selectedClass && selectedTopic ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div>
              <button
                onClick={() => setActiveTopicId(null)}
                className="text-sm font-bold text-blue-600 hover:underline mb-2 flex items-center gap-1 cursor-pointer"
              >
                &larr; {language === "vi" ? "Trở lại lớp học" : "Back to Classroom"}
              </button>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                {selectedTopic.name}
              </h3>
              <p className="text-sm text-neutral-500 font-medium">
                {selectedTopic.description}
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-black rounded-full uppercase">
              {selectedTopic.questions.length} {language === "vi" ? "Câu hỏi" : "Questions"}
            </span>
          </div>

          {currentUser?.role === "dev" && (
            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800/40 p-1 rounded-xl w-max border border-neutral-150 dark:border-neutral-800">
              <button
                onClick={() => setDevViewMode("student")}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  devViewMode === "student"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                📝 {language === "vi" ? "Chế độ Làm bài (Học sinh)" : "Solve Assignment (Student Mode)"}
              </button>
              <button
                onClick={() => setDevViewMode("teacher")}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  devViewMode === "teacher"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                🛠️ {language === "vi" ? "Chế độ Quản lý (Giáo viên)" : "Manage Questions (Teacher Mode)"}
              </button>
            </div>
          )}

          {/* If it is the system sample/trial topic */}
          {selectedTopic.id === "topic_trial_english" ? (
            <SampleTopicView
              currentUser={currentUser}
              selectedTopic={selectedTopic}
              language={language}
              solvingAnswers={solvingAnswers}
              setSolvingAnswers={setSolvingAnswers}
              t={t}
              submissions={submissions}
              onSubmitTopicAnswers={onSubmitTopicAnswers}
            />
          ) : (currentUser?.role === "teacher" || (currentUser?.role === "dev" && devViewMode === "teacher")) ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Question list and Question form creator */}
              <div className="space-y-6 border-r border-neutral-100 dark:border-neutral-800 pr-0 lg:pr-6">
                <div className="bg-neutral-50 dark:bg-neutral-800/40 p-5 rounded-2xl border border-neutral-150 dark:border-neutral-800/60">
                  <h4 className="font-extrabold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-500" />
                    {t.createQuestion}
                  </h4>
                  <form onSubmit={(e) => handleAddQuestionSubmit(e, selectedClass.id, selectedTopic.id)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                          {language === "vi" ? "Câu hỏi cho Lớp?" : "Which Grade?"}
                        </label>
                        <select
                          value={qGrade}
                          onChange={(e) => setQGrade(e.target.value)}
                          className="w-full p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                            <option key={num} value={num.toString()} className="text-black dark:text-white font-semibold">
                              {language === "vi" ? `Lớp ${num}` : `Grade ${num}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                          {language === "vi" ? "Môn học?" : "Which Subject?"}
                        </label>
                        <select
                          value={qSubject}
                          onChange={(e) => setQSubject(e.target.value)}
                          className="w-full p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-bold text-amber-600 dark:text-amber-400 cursor-pointer"
                        >
                          {[
                            { value: "Toán", labelVi: "Toán học", labelEn: "Mathematics" },
                            { value: "Lý", labelVi: "Vật lý", labelEn: "Physics" },
                            { value: "Hoá", labelVi: "Hóa học", labelEn: "Chemistry" },
                            { value: "Anh", labelVi: "Tiếng Anh", labelEn: "English" },
                            { value: "Sinh", labelVi: "Sinh học", labelEn: "Biology" },
                            { value: "Khoa", labelVi: "Khoa học Tự nhiên", labelEn: "Natural Science" },
                            { value: "Văn", labelVi: "Ngữ văn", labelEn: "Literature" },
                            { value: "Sử", labelVi: "Lịch sử", labelEn: "History" },
                            { value: "Địa", labelVi: "Địa lý", labelEn: "Geography" },
                            { value: "Tin", labelVi: "Tin học", labelEn: "Computer Science" }
                          ].map((subObj) => (
                            <option key={subObj.value} value={subObj.value} className="text-black dark:text-white font-semibold">
                              {language === "vi" ? subObj.labelVi : subObj.labelEn}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          {t.questionPrompt}
                        </label>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase">
                          {language === "vi" ? "Có Thể Dùng AI" : "AI Suggestion Ready"}
                        </span>
                      </div>
                      <textarea
                        value={qPrompt}
                        onChange={(e) => setQPrompt(e.target.value)}
                        required
                        placeholder={language === "vi" ? "Nhập đề bài hoặc từ khoá/chủ đề (ví dụ: Tính chất tam giác đều)..." : "Enter prompt or keyword/topic..."}
                        className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={isGeneratingQuestion}
                          onClick={handleSuggestQuestionByAI}
                          className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isGeneratingQuestion ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></span>
                              <span>{language === "vi" ? "Đang tạo hỏi..." : "Generating..."}</span>
                            </>
                          ) : (
                            <>
                              <span>✨</span>
                              <span>{language === "vi" ? "Gợi ý câu hỏi bằng AI" : "AI Generate from Key"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                          {t.questionType}
                        </label>
                        <select
                          value={qType}
                          onChange={(e) => setQType(e.target.value as QuestionType)}
                          className="w-full p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm"
                        >
                          <option value="abcd">{t.abcdAnswer}</option>
                          <option value="essay">{t.shortAnswer}</option>
                          <option value="fill_in_the_blank">{t.fillInBlankAnswer}</option>
                        </select>
                      </div>

                      {qType === "abcd" && (
                        <div>
                          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                            {t.correctAnswer}
                          </label>
                          <select
                            value={qCorrectOpt}
                            onChange={(e) => setQCorrectOpt(e.target.value)}
                            className="w-full p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-bold text-blue-600"
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {qType === "abcd" && (
                      <div className="space-y-2 pt-2 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                          {t.options}
                        </span>
                        <input
                          type="text"
                          required
                          value={qOptA}
                          onChange={(e) => setQOptA(e.target.value)}
                          placeholder="Nội dung đáp án A"
                          className="w-full p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs dark:text-neutral-100"
                        />
                        <input
                          type="text"
                          required
                          value={qOptB}
                          onChange={(e) => setQOptB(e.target.value)}
                          placeholder="Nội dung đáp án B"
                          className="w-full p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs dark:text-neutral-100"
                        />
                        <input
                          type="text"
                          required
                          value={qOptC}
                          onChange={(e) => setQOptC(e.target.value)}
                          placeholder="Nội dung đáp án C"
                          className="w-full p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs dark:text-neutral-100"
                        />
                        <input
                          type="text"
                          required
                          value={qOptD}
                          onChange={(e) => setQOptD(e.target.value)}
                          placeholder="Nội dung đáp án D"
                          className="w-full p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs dark:text-neutral-100"
                        />
                      </div>
                    )}

                    {qType === "fill_in_the_blank" && (
                      <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                          {language === "vi" ? "Các đáp án chấp nhận chấm tự động (không bắt buộc)" : "Accepted keys for auto-grading (optional)"}
                        </label>
                        <p className="text-[10px] text-neutral-400 mb-2">
                          {t.fillInBlankHint}
                        </p>
                        <input
                          type="text"
                          value={qFillAnswers}
                          onChange={(e) => setQFillAnswers(e.target.value)}
                          placeholder="Ví dụ: apple, mận"
                          className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition cursor-pointer"
                    >
                      {t.addQuestionBtn}
                    </button>
                  </form>
                </div>

                <div className="space-y-4">
                  <h4 className="font-extrabold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-neutral-500" />
                    {t.questionList}
                  </h4>
                  {selectedTopic.questions.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-6">
                      Chưa có câu hỏi nào. Hãy soạn câu hỏi đầu tiên phía trên.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedTopic.questions.map((q, idx) => (
                        <div key={q.id} className="p-4 rounded-xl border border-neutral-150 dark:border-neutral-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-400 capitalize">
                                {q.type === "abcd"
                                  ? t.abcdAnswer
                                  : q.type === "essay"
                                  ? t.shortAnswer
                                  : t.fillInBlankAnswer}
                              </span>
                              {q.grade && (
                                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded">
                                  {language === "vi" ? `Lớp ${q.grade}` : `Grade ${q.grade}`}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-neutral-400 font-bold">#{idx + 1}</span>
                          </div>
                          <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                            {q.prompt}
                          </p>
                          {q.type === "abcd" && q.options && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {q.options.map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  className={`p-1.5 rounded border ${
                                    opt.trim().startsWith(q.correctOption || "")
                                      ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold"
                                      : "border-neutral-100 dark:border-neutral-800 text-neutral-500"
                                  }`}
                                >
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.type === "fill_in_the_blank" && q.fillAnswers && q.fillAnswers.length > 0 && (
                            <p className="text-xs text-emerald-600 font-bold mt-1">
                              🔑 {t.correctAnswer}: {q.fillAnswers.join(" / ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Grading interface: View submissions & manual grading action */}
              <div className="space-y-6">
                <h4 className="font-extrabold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-500" />
                  {t.topicGradingTitle}
                </h4>

                {submissions.filter((s) => s.topicId === selectedTopic.id).length === 0 ? (
                  <p className="text-sm text-neutral-400 py-10 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                    {t.noSubmissions}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {submissions
                      .filter((s) => s.topicId === selectedTopic.id)
                      .map((sub) => {
                        const hasUngradedAnswers = sub.answers.some((ans) => ans.isCorrect === undefined);

                        return (
                          <div
                            key={sub.id}
                            className="p-5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-150 dark:border-neutral-800 shadow-sm space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-bold text-neutral-900 dark:text-neutral-100 text-base">
                                  {sub.studentName}
                                </h5>
                                <p className="text-xs text-neutral-400">
                                  {new Date(sub.submittedAt).toLocaleString()}
                                </p>
                              </div>
                              <span className={`px-2.5 py-1 text-xs font-black rounded-lg ${
                                hasUngradedAnswers
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              }`}>
                                {hasUngradedAnswers ? t.ungraded : t.graded}
                              </span>
                            </div>

                            {/* Show details / grade console */}
                            <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-700/60">
                              {sub.answers.map((ans) => {
                                const question = selectedTopic.questions.find((qi) => qi.id === ans.questionId);
                                if (!question) return null;

                                return (
                                  <div key={ans.questionId} className="bg-neutral-50 dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 text-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-neutral-500 capitalize">
                                        {question.type === "abcd"
                                          ? t.abcdAnswer
                                          : question.type === "essay"
                                          ? t.shortAnswer
                                          : t.fillInBlankAnswer}
                                      </span>
                                      {ans.isCorrect !== undefined ? (
                                        <span className={`font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-[10px] ${
                                          ans.isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                        }`}>
                                          {ans.isCorrect ? t.correct : t.incorrect}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold uppercase animate-pulse">
                                          {t.ungraded}
                                        </span>
                                      )}
                                    </div>

                                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                                      Q: {question.prompt}
                                    </p>
                                    <p className="text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg border dark:border-neutral-700">
                                      <span className="text-[10px] font-black uppercase text-neutral-400 block mb-1">
                                        {language === "vi" ? "ĐÁP ÁN CỦA HỌC SINH:" : "STUDENT'S ANSWER:"}
                                      </span>
                                      {ans.studentAnswer || "—"}
                                    </p>

                                    {/* Evaluation controls if ungraded */}
                                    {ans.isCorrect === undefined && (
                                      <div className="flex items-center gap-2 pt-2 justify-end">
                                        <button
                                          onClick={() => onGradeAnswer(sub.id, ans.questionId, false)}
                                          className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-lg transition"
                                        >
                                          {language === "vi" ? "Chấm Sai" : "Grade Wrong"}
                                        </button>
                                        <button
                                          onClick={() => onGradeAnswer(sub.id, ans.questionId, true)}
                                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition flex items-center gap-1"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          {language === "vi" ? "Chấm Đúng" : "Grade Correct"}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Student solving assignment */
            <div className="space-y-6 max-w-2xl mx-auto">
              {(() => {
                const existingSubmission = submissions.find(
                  (sub) =>
                    sub.studentId === currentUser?.id &&
                    sub.classId === selectedClass?.id &&
                    sub.topicId === selectedTopic?.id
                );

                if (selectedTopic.questions.length === 0) {
                  return (
                    <div className="text-center py-10 text-neutral-400">
                      <HelpCircle className="w-12 h-12 mx-auto mb-2 opacity-60" />
                      <p>Chủ đề này hiện chưa có câu hỏi nào.</p>
                    </div>
                  );
                }

                const hasSubmitted = !!existingSubmission;

                return (
                  <div className="space-y-6">
                    {selectedTopic.questions.map((q, idx) => {
                      const answerObj = existingSubmission?.answers.find((a) => a.questionId === q.id);
                      const savedAns = answerObj ? answerObj.studentAnswer : "";

                      return (
                        <div key={q.id} className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-150 dark:border-neutral-800 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded uppercase">
                                {q.type === "abcd"
                                  ? t.abcdAnswer
                                  : q.type === "essay"
                                  ? t.shortAnswer
                                  : t.fillInBlankAnswer}
                              </span>
                              {q.grade && (
                                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded">
                                  {language === "vi" ? `Lớp ${q.grade}` : `Grade ${q.grade}`}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-neutral-400 font-black"># {idx + 1}</span>
                          </div>

                          <p className="text-base font-bold text-neutral-800 dark:text-neutral-100">
                            {q.prompt}
                          </p>

                          {/* Rendering option fields based on types */}
                          {q.type === "abcd" && q.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {q.options.map((opt, oIdx) => {
                                const optChar = opt.trim().substring(0, 1).toUpperCase();
                                const isChosen = hasSubmitted 
                                  ? savedAns.toUpperCase() === optChar
                                  : (solvingAnswers[q.id] || "").toUpperCase() === optChar;
                                const isCorrectOpt = q.correctOption?.toUpperCase() === optChar;

                                let btnStyle = "border-neutral-200 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80";
                                if (hasSubmitted) {
                                  if (isChosen) {
                                    if (isCorrectOpt) {
                                      btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-extrabold ring-1 ring-emerald-500";
                                    } else {
                                      btnStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-extrabold ring-1 ring-rose-500";
                                    }
                                  } else if (isCorrectOpt) {
                                    btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold opacity-80";
                                  } else {
                                    btnStyle = "border-neutral-200 bg-neutral-100 dark:bg-neutral-900 text-neutral-400 opacity-60";
                                  }
                                } else if (isChosen) {
                                  if (currentUser?.role === "dev" && isCorrectOpt) {
                                    btnStyle = "border-emerald-500 bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black ring-2 ring-emerald-500";
                                  } else {
                                    btnStyle = "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 font-extrabold ring-1 ring-blue-500";
                                  }
                                } else if (currentUser?.role === "dev" && isCorrectOpt) {
                                  btnStyle = "border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/5 text-neutral-800 dark:text-neutral-200 font-bold ring-1 ring-emerald-500/20 hover:bg-emerald-50/20";
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    disabled={hasSubmitted}
                                    onClick={() =>
                                      setSolvingAnswers((prev) => ({
                                        ...prev,
                                        [q.id]: optChar,
                                      }))
                                    }
                                    className={`group p-3.5 rounded-xl border text-sm text-left transition-all duration-200 flex items-start gap-2 ${
                                      hasSubmitted 
                                        ? "cursor-not-allowed" 
                                        : "cursor-pointer hover:scale-[1.035] active:scale-[0.985] hover:shadow-md hover:text-neutral-950 dark:hover:text-white hover:border-neutral-400 dark:hover:border-neutral-600"
                                    } ${btnStyle}`}
                                  >
                                    <span className="font-black shrink-0 transition-all duration-200 group-hover:text-neutral-950 dark:group-hover:text-white group-hover:scale-110">{optChar}.</span>
                                    <span className="flex-1 transition-all duration-200 font-semibold group-hover:text-neutral-950 dark:group-hover:text-white group-hover:font-extrabold">{opt.substring(2)}</span>
                                    {!hasSubmitted && isCorrectOpt && currentUser?.role === "dev" && (
                                      <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black uppercase shrink-0 font-sans tracking-wide">
                                        {language === "vi" ? "Đáp án" : "Key"}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {q.type === "essay" && (
                            <div className="space-y-2 font-semibold">
                              <textarea
                                value={hasSubmitted ? savedAns : (solvingAnswers[q.id] || "")}
                                disabled={hasSubmitted}
                                onChange={(e) =>
                                  setSolvingAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: e.target.value,
                                  }))
                                }
                                placeholder={t.enterAnswer}
                                rows={4}
                                className={`w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-semibold text-neutral-800 dark:text-neutral-100 ${
                                  hasSubmitted ? "cursor-not-allowed bg-neutral-100 dark:bg-neutral-950 opacity-80" : ""
                                }`}
                              />
                              {hasSubmitted && (
                                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                  <Edit3 className="w-4 h-4 shrink-0 text-amber-500" />
                                  <span>
                                    {answerObj?.gradedByTeacher 
                                      ? (language === "vi" ? `Giáo viên đã chấm điểm tự luận: ${answerObj.score} / 20` : `Teacher graded essay: ${answerObj.score} / 20`)
                                      : (language === "vi" ? "Đang chờ Giáo viên xem xét & cho điểm bài viết tự luận." : "Awaiting Teacher review and grading of the written response.")}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {q.type === "fill_in_the_blank" && (
                            <div className="space-y-2 font-semibold">
                              <input
                                type="text"
                                value={hasSubmitted ? savedAns : (solvingAnswers[q.id] || "")}
                                disabled={hasSubmitted}
                                onChange={(e) =>
                                  setSolvingAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: e.target.value,
                                  }))
                                }
                                placeholder={t.enterAnswer}
                                className={`w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-semibold text-neutral-800 dark:text-neutral-100 ${
                                  hasSubmitted ? "cursor-not-allowed bg-neutral-100 dark:bg-neutral-950 opacity-80" : ""
                                }`}
                              />
                              {hasSubmitted && (
                                <div className={`p-3 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                                  answerObj?.isCorrect 
                                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40"
                                    : "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/40"
                                }`}>
                                  {answerObj?.isCorrect ? (
                                    <>
                                      <Check className="w-4 h-4 text-emerald-500" />
                                      <span>
                                        {language === "vi" 
                                          ? "Cơ chế chấm tự động xác định ĐÁP ÁN CHÍNH XÁC (+20đ)" 
                                          : "Autograding verified accuracy (+20 points)"}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-4 h-4 text-rose-500" />
                                      <span>
                                        {language === "vi" 
                                          ? `Chưa chính xác (Yêu cầu đáp án chính xác: ${q.fillAnswers?.join(" / ")})` 
                                          : `Unmatched (Expected options: ${q.fillAnswers?.join(" / ")})`}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="pt-4 text-center">
                      {hasSubmitted ? (
                        <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200/60 dark:border-emerald-850 p-6 rounded-2xl text-center space-y-2">
                          <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                          <h5 className="font-extrabold text-neutral-950 dark:text-neutral-100 text-sm">
                            {language === "vi" ? "BÀI LÀM ĐÃ ĐƯỢC CHẤM / NỘP THÀNH CÔNG" : "ASSIGNMENT SUBMITTED SUCCESSFULLY"}
                          </h5>
                          <p className="text-xs text-neutral-400 font-medium">
                            {language === "vi" 
                              ? `Nộp vào lúc ${new Date(existingSubmission.submittedAt).toLocaleString()}` 
                              : `Submitted at ${new Date(existingSubmission.submittedAt).toLocaleString()}`}
                          </p>
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {language === "vi" ? "Hệ thống đã khóa tính năng cập nhật để đảm bảo tính minh bạch." : "Submission locked for integrity and honesty."}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStudentSubmitAnswers(selectedClass.id, selectedTopic)}
                          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition shadow-md flex items-center gap-2 mx-auto cursor-pointer"
                        >
                          <Send className="w-5 h-5" />
                          {language === "vi" ? "NỘP BÀI TẬP" : "SUBMIT TOPIC"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : selectedClass ? (
        /* If looking inside a specific classroom */
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div>
              <button
                onClick={() => setActiveClassId(null)}
                className="text-sm font-bold text-blue-600 hover:underline mb-2 flex items-center gap-1 cursor-pointer"
              >
                &larr; {language === "vi" ? "Tất cả lớp học" : "All Classrooms"}
              </button>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                {selectedClass.name}
                {selectedClass.id === "class_trial_01" && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] font-black uppercase rounded">
                    {t.trialClassTag}
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-500">
                {t.classroomCodeLabel}: <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-bold text-neutral-800 dark:text-neutral-200 uppercase">{selectedClass.code}</span>
                <span className="mx-2">•</span>
                {t.teacherNameLabel}: <span className="font-medium text-neutral-700 dark:text-neutral-300">{selectedClass.teacherName}</span>
              </p>
            </div>

            {/* Student Leave Classroom Action */}
            {currentUser?.role !== "teacher" && currentUser?.role !== "dev" && currentUser?.role !== "admin" && selectedClass.id !== "class_trial_01" && (
              <div className="shrink-0">
                {selectedClass.leaveRequests?.some(r => r.studentId === currentUser?.id) ? (
                  <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30 px-3.5 py-2 rounded-xl font-bold inline-flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {language === "vi" ? "Chờ duyệt xin rời..." : "Awaiting approval to leave..."}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onRequestLeaveClassroom) {
                        onRequestLeaveClassroom(selectedClass.id);
                      }
                    }}
                    className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    {language === "vi" ? "Xin thoát lớp học" : "Request to leave class"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: list topics */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="font-extrabold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                {language === "vi" ? "Các chủ đề học tập" : "Study Topics"}
              </h4>

              {selectedClass.topics.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                  <p>{t.noTopics}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedClass.topics.map((tp) => (
                    <div
                      key={tp.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#111927] border border-neutral-200 dark:border-[#1d293e] hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <h5 className="font-extrabold text-neutral-900 dark:text-neutral-100 text-base">
                          {tp.name}
                        </h5>
                        <p className="text-xs text-neutral-500 line-clamp-2">
                          {tp.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-400">
                          {tp.questions.length} {language === "vi" ? "câu hỏi" : "questions"}
                        </span>
                        {(() => {
                          const hasSub = submissions.find(
                            (sub) =>
                              sub.studentId === currentUser?.id &&
                              sub.classId === selectedClass.id &&
                              sub.topicId === tp.id
                          );
                          return (
                            <button
                              onClick={() => setActiveTopicId(tp.id)}
                              className={`px-4 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition ${
                                hasSub 
                                  ? "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-350"
                                  : "bg-blue-600 hover:bg-blue-500 text-white"
                              }`}
                            >
                              {(currentUser?.role === "teacher" || currentUser?.role === "dev") ? (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  {language === "vi" ? "Xem & Giao bài" : "Setup Questions"}
                                </>
                              ) : hasSub ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500 font-extrabold" />
                                  {language === "vi" ? "Xem kết quả" : "View Results"}
                                </>
                              ) : (
                                <>
                                  <LogIn className="w-3.5 h-3.5" />
                                  {t.startAssignment}
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Classroom operations (Topics, Students Roster, Leave approval, Danger Zone Deletion) for Teacher/Dev/Admin */}
            {(currentUser?.role === "teacher" || currentUser?.role === "dev" || currentUser?.role === "admin") && (
              <div className="space-y-6 self-start">
                
                {/* 1. Create Topic panel */}
                <div className="bg-neutral-50 dark:bg-neutral-800/40 p-5 rounded-2xl border border-neutral-150 dark:border-neutral-800/60">
                  <h4 className="font-bold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-indigo-500" />
                    {t.createTopic}
                  </h4>
                  <form onSubmit={(e) => handleCreateTopicSubmit(e, selectedClass.id)} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                        {t.topicName}
                      </label>
                      <input
                        type="text"
                        required
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="e.g. Thì hiện tại đơn, Lý thuyết Newton"
                        className="w-full p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                        {t.topicDesc}
                      </label>
                      <textarea
                        value={newTopicDesc}
                        onChange={(e) => setNewTopicDesc(e.target.value)}
                        placeholder="Mô tả mục tiêu của bài tập này..."
                        className="w-full p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs"
                        rows={3}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      {t.create}
                    </button>
                  </form>
                </div>

                {/* 2. Students & Leave Requests Roster */}
                <div className="bg-neutral-50 dark:bg-neutral-800/40 p-5 rounded-2xl border border-neutral-150 dark:border-neutral-800/60 space-y-4">
                  <h4 className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-500" />
                    {language === "vi" ? "Học viên & Duyệt đơn" : "Students & Approvals"}
                  </h4>

                  {/* Leave Requests Sub-Section */}
                  {(selectedClass.leaveRequests || []).length > 0 && (
                    <div className="space-y-2 border-b border-neutral-250 dark:border-neutral-800 pb-3">
                      <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">
                        {language === "vi" ? "Yêu cầu xin rời lớp (Chờ duyệt)" : "Pending Leave Requests"}
                      </p>
                      <div className="space-y-2">
                        {(selectedClass.leaveRequests || []).map((req) => (
                          <div key={req.studentId} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-1 text-xs">
                            <div>
                              <p className="font-extrabold text-amber-300">{req.studentName}</p>
                              <p className="text-[9px] text-neutral-400 font-mono">
                                {new Date(req.requestedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => onApproveLeave?.(selectedClass.id, req.studentId)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] rounded cursor-pointer transition"
                              >
                                {language === "vi" ? "Duyệt" : "Accept"}
                              </button>
                              <button
                                type="button"
                                onClick={() => onDenyLeave?.(selectedClass.id, req.studentId)}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[9px] rounded cursor-pointer transition"
                              >
                                {language === "vi" ? "Từ chối" : "Deny"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Joined students Sub-Section */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                      {language === "vi" ? `Danh sách học sinh (${selectedClass.studentIds.length})` : `Class Roster (${selectedClass.studentIds.length} students)`}
                    </p>
                    {selectedClass.studentIds.length === 0 ? (
                      <p className="text-xs text-neutral-500 italic py-2">
                        {language === "vi" ? "Chưa có học sinh tham gia lớp." : "No students in this classroom yet."}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {selectedClass.studentIds.map((stId) => {
                          const studentUser = (users || []).find((u) => u.id === stId);
                          const name = studentUser ? studentUser.fullName : (language === "vi" ? "Học sinh" : "Student");
                          const username = studentUser ? `@${studentUser.username}` : "";
                          return (
                            <div key={stId} className="flex items-center justify-between p-2.5 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-xl text-xs">
                              <div className="truncate pr-2">
                                <span className="font-bold text-neutral-800 dark:text-neutral-100">{name}</span>
                                <span className="text-[10px] text-neutral-400 font-mono ml-1.5 block md:inline">{username}</span>
                              </div>
                              {selectedClass.id !== "class_trial_01" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(language === "vi" ? `Trục xuất học sinh ${name} khỏi lớp học?` : `Kick student ${name} from this classroom?`)) {
                                      onKickStudent?.(selectedClass.id, stId);
                                    }
                                  }}
                                  className="px-2 py-1 bg-neutral-105 hover:bg-red-500 hover:text-white text-neutral-500 font-extrabold text-[9px] rounded transition duration-150 shrink-0 cursor-pointer"
                                >
                                  KICK
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Delete Classroom Danger Zone */}
                {selectedClass.id !== "class_trial_01" && (
                  <div className="bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/10 dark:border-rose-900/30 p-5 rounded-2xl space-y-3">
                    <h5 className="text-red-500 dark:text-red-400 font-black text-xs uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      {language === "vi" ? "Khu vực nguy hiểm" : "Danger Zone"}
                    </h5>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      {language === "vi" 
                        ? "Lưu ý hành động không thể hoàn tác: Xoá lớp học sẽ trục xuất toàn bộ học sinh và xoá sạch toàn bộ dữ liệu bài tập, kết quả làm bài khỏi hệ thống!" 
                        : "Warning: Action is irreversible. Deleting classroom kicks everyone and permanently wipes all classroom data, topics, and submissions!"}
                    </p>
                    
                    {showDeleteConfirm ? (
                      <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl space-y-3">
                        <p className="text-[9px] font-mono text-red-450 uppercase tracking-widest font-black text-center">
                          {language === "vi" ? "⚠️ THỰC SỰ XOÁ LỚP HỌC?" : "⚠️ CONFIRM DELETION?"}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            {language === "vi" ? "Hủy" : "Cancel"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteClassroom?.(selectedClass.id);
                              setActiveClassId(null);
                              setShowDeleteConfirm(false);
                            }}
                            className="flex-1 py-1.5 bg-red-650 hover:bg-red-600 text-white font-black text-xs rounded-lg transition cursor-pointer"
                          >
                            {language === "vi" ? "Thực sự xoá" : "Confirm Delete"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-2 bg-red-950/30 text-red-500 hover:bg-red-900 hover:text-white border border-red-900/30 font-black text-xs rounded-xl transition cursor-pointer"
                      >
                        {language === "vi" ? "Xoá lớp học này" : "Delete Classroom"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Classroom directory overview page */
        <div className="space-y-8">
          {/* Header controls for Classroom Creation or Entrance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create classroom for teachers */}
            {(currentUser?.role === "teacher" || currentUser?.role === "dev") && (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-lg font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-indigo-500" />
                  {t.createClassroom}
                </h3>
                <form onSubmit={handleCreateClass} className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Nhập tên lớp học mới..."
                    className="flex-1 p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-semibold"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer transition select-none"
                  >
                    {t.create}
                  </button>
                </form>
              </div>
            )}

            {/* Join classroom for students (Hidden for Teachers) */}
            {currentUser?.role !== "teacher" && (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-lg font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-blue-500" />
                  {t.joinClassroom}
                </h3>
                <form onSubmit={handleJoinClass} className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={joinClassCode}
                    onChange={(e) => setJoinClassCode(e.target.value)}
                    placeholder={t.enterClassCode + " (e.g. ENG101)"}
                    className="flex-1 p-2.5 bg-[#282525] dark:bg-[#282525] text-white dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-semibold uppercase tracking-widest text-center"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs cursor-pointer transition select-none"
                  >
                    {t.join}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Directory classroom cards */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-500" />
              {language === "vi" ? "Danh sách Lớp học của bạn" : "Your Classrooms list"}
            </h3>

            {visibleClassrooms.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl">
                <BookOpen className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                  {t.noClassrooms}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleClassrooms.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => setActiveClassId(cls.id)}
                    className="group bg-white dark:bg-[#111927] border border-neutral-200 dark:border-[#1d293e] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900 transition duration-200 cursor-pointer flex flex-col justify-between min-h-[160px]"
                    id={`classroom-card-${cls.id}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-extrabold text-neutral-900 dark:text-neutral-100 text-lg group-hover:text-blue-600 transition duration-200">
                          {cls.name}
                        </h4>
                        {cls.id === "class_trial_01" && (
                          <span className="shrink-0 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[9px] font-black uppercase rounded">
                            {t.trialClassTag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400">
                        {t.teacherNameLabel}: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{cls.teacherName}</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-neutral-400">
                        {t.topicsCount}: <span className="text-neutral-700 dark:text-neutral-300">{cls.topics.length}</span>
                      </span>
                      <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition duration-200">
                        {language === "vi" ? "Vào lớp" : "Open"}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
