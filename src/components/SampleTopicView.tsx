import React from "react";
import { User, Topic, AnswerSubmission, TopicSubmission } from "../types";
import { Sparkles, BookOpen, Check, X, Send, HelpCircle, Edit3 } from "lucide-react";

interface SampleTopicViewProps {
  currentUser: User | null;
  selectedTopic: Topic;
  language: "vi" | "en";
  solvingAnswers: Record<string, string>;
  setSolvingAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  t: Record<string, string>;
  submissions?: TopicSubmission[];
  onSubmitTopicAnswers?: (submission: Omit<TopicSubmission, "id" | "submittedAt">) => void;
}

export const SampleTopicView: React.FC<SampleTopicViewProps> = ({
  currentUser,
  selectedTopic,
  language,
  solvingAnswers,
  setSolvingAnswers,
  t,
  submissions,
  onSubmitTopicAnswers,
}) => {
  const existingSubmission = submissions?.find(
    (sub) =>
      sub.studentId === currentUser?.id &&
      sub.classId === "class_trial_01" &&
      sub.topicId === selectedTopic.id
  );

  const hasSubmitted = !!existingSubmission;

  const handleLocalSubmit = () => {
    if (!currentUser) return;

    const answersList: AnswerSubmission[] = selectedTopic.questions.map((q) => {
      const studentAnswerString = (solvingAnswers[q.id] || "").trim();
      let isCorrect: boolean | undefined = undefined;
      let score: number | undefined = undefined;

      if (q.type === "abcd") {
        isCorrect = studentAnswerString.toUpperCase() === (q.correctOption || "").toUpperCase();
        score = isCorrect ? 20 : 0;
      } else if (q.type === "fill_in_the_blank" && q.fillAnswers && q.fillAnswers.length > 0) {
        const isMatched = q.fillAnswers.some(
          (ans) => ans.trim().toLowerCase() === studentAnswerString.toLowerCase()
        );
        if (isMatched) {
          isCorrect = true;
          score = 20;
        } else {
          isCorrect = false;
          score = 0;
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

    onSubmitTopicAnswers?.({
      topicId: selectedTopic.id,
      topicName: selectedTopic.name,
      classId: "class_trial_01",
      className: language === "vi" ? "Lớp Học Trải Nghiệm" : "Trial Classroom",
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      answers: answersList,
      isFullyGraded: !hasUngraded,
    });

    window.showToast?.(
      language === "vi" ? "🎉 Đã nộp học liệu mẫu thành công!" : "🎉 Submitted sample topic worksheet successfully!",
      "success"
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="sample-topic-view-container">
      {/* Left Column: Guidelines */}
      <div className="lg:col-span-5 space-y-6">
        {currentUser?.role === "teacher" || currentUser?.role === "dev" ? (
          <div className="bg-slate-50 dark:bg-[#111927] p-6 rounded-2xl border border-slate-200 dark:border-[#1d293e] space-y-6">
            <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-6 h-6" />
              <h4 className="font-black text-lg">💡 {language === "vi" ? "Hướng Dẫn Biên Soạn" : "Question Guidelines"}</h4>
            </div>
            
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              ⚠️ <strong>{language === "vi" ? "Thông báo từ hệ thống:" : "System notice:"}</strong><br />
              {language === "vi" 
                ? "Đây là Chủ đề mẫu (English Club) dành cho trải nghiệm dùng thử. Bạn không thể tạo hoặc thêm/bớt câu hỏi trực tiếp vào học liệu mẫu của hệ thống. Hãy tạo Lớp Học của riêng bạn ở trang chủ để tự định cấu cấu trúc đề thi!" 
                : "This is a system trial/sample topic. You cannot add or modify questions directly on this template. Please go to homepage, create your own Classroom and enjoy full customization!"}
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 space-y-1">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">🎯 {language === "vi" ? "Nghị định 01: Trắc Nghiệm ABCD" : "Format 1: ABCD Quiz"}</span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                  {language === "vi" 
                    ? "Thiết kế 4 đáp án phân biệt (A, B, C, D). Hãy điền đầy đủ nội dung cho từng đáp án và chỉ định đáp án chính xác." 
                    : "Describe 4 clear options. Provide input for each option and select the single uppercase letter corresponding to the correct key."}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 space-y-1">
                <span className="text-xs font-black text-rose-600 dark:text-rose-400">📝 {language === "vi" ? "Nghị định 02: Điền vào chỗ trống" : "Format 2: Fill-in-the-Blank"}</span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                  {language === "vi" 
                    ? "Tận dụng để kiểm tra từ vựng, ngữ pháp. Nên ghi các đáp án dự phòng hỗ trợ phân biệt chữ viết thường cách nhau bằng dấu phẩy (vd: 'cold, freezing') để cơ chế AI tự động chấp thuận." 
                    : "Ideal for testing grammar or spelling. Supply alternative accepted terms separated by comma (e.g. 'cold, freezing') for accurate automatic scanning."}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 space-y-1">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">✍️ {language === "vi" ? "Nghị định 03: Câu hỏi tự luận" : "Format 3: Short Answer / Essay"}</span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                  {language === "vi" 
                    ? "Phụ hợp để khích lệ người học viết đoạn văn tự do. Các bài thi tự luận sẽ được lưu trữ lại hệ thống để Giáo viên chấm điểm và góp ý thủ công." 
                    : "Best for evaluating open-ended inputs. These will bypass autograder and wait in storage for Teacher manual grading and annotation."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50/70 dark:bg-[#111927] p-6 rounded-2xl border border-blue-100 dark:border-[#1d293e] space-y-4">
            <div className="flex items-center gap-2 mb-1 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-6 h-6" />
              <h4 className="font-black text-lg">{language === "vi" ? "Luyện Tập Tự Học" : "Self-Study Mode"}</h4>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-semibold">
              {language === "vi" 
                ? "Chào mừng bạn đến với học liệu mẫu thử nghiệm! Bạn có thể xem danh sách 10 câu hỏi học thuật Tiếng Anh, điền hoặc trả lời các câu hỏi để tự đánh giá năng lực của mình." 
                : "Welcome to the interactive preview topic! You can browse the 10 academic English questions, select options, and test your knowledge by submitting your responses."}
            </p>
            <div className="bg-white dark:bg-neutral-900 border border-blue-100 dark:border-[#1d293e] p-4 rounded-xl text-center">
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
                💯 10 {language === "vi" ? "CÂU HỎI TIÊU CHUẨN" : "STANDARD QUESTIONS"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Interactive Worksheet */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between pb-2">
          <h4 className="font-extrabold text-neutral-900 dark:text-neutral-100 text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            {language === "vi" ? "Học Liệu Mẫu (10 Câu)" : "Sample Topic Questions (10)"}
          </h4>
          {currentUser?.role === "dev" && (
            <span className="text-xs font-bold text-emerald-500 animate-pulse">🛠️ {language === "vi" ? "Chế độ Xem thử đáp án (Dev)" : "Developer Keys Reveal Active"}</span>
          )}
        </div>

        <div className="space-y-4">
          {selectedTopic.questions.map((q, idx) => {
            const answerObj = existingSubmission?.answers.find((a) => a.questionId === q.id);
            const savedAns = answerObj ? answerObj.studentAnswer : "";

            return (
              <div key={q.id} className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition duration-150 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 rounded uppercase border border-slate-200 dark:border-neutral-700">
                    {q.type === "abcd"
                      ? t.abcdAnswer
                      : q.type === "essay"
                      ? t.shortAnswer
                      : t.fillInBlankAnswer}
                  </span>
                  <span className="text-xs text-neutral-400 font-bold"># {idx + 1}</span>
                </div>

                <p className="text-base font-bold text-neutral-800 dark:text-neutral-100 leading-snug">
                  {q.prompt}
                </p>

                {/* Rendering ABCD OPTIONS */}
                {q.type === "abcd" && q.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-semibold">
                    {q.options.map((opt, oIdx) => {
                      const optChar = opt.trim().substring(0, 1).toUpperCase();
                      const isCorrectOption = optChar === q.correctOption;

                      // Check if currently selected/chosen
                      const isSelected = hasSubmitted 
                        ? savedAns.toUpperCase() === optChar
                        : (solvingAnswers[q.id] || "").toUpperCase() === optChar;

                      let optionBtnStyle = "border-slate-200 bg-white dark:bg-neutral-950 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-slate-100/60 dark:hover:bg-neutral-800/80";

                      if (hasSubmitted) {
                        // After submission: standard feedback highlights
                        if (isSelected) {
                          if (isCorrectOption) {
                            optionBtnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-extrabold ring-1 ring-emerald-500";
                          } else {
                            optionBtnStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-extrabold ring-1 ring-rose-500";
                          }
                        } else if (isCorrectOption) {
                          optionBtnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold opacity-85";
                        } else {
                          optionBtnStyle = "border-slate-100 bg-slate-50 dark:bg-neutral-900 text-slate-400 opacity-60";
                        }
                      } else {
                        // Before submission: No answer previews for standard teachers and students!
                        if (currentUser?.role === "dev") {
                          // Dev accounts get pre-highlighted answers for instant verification
                          if (isSelected) {
                            optionBtnStyle = "border-emerald-500 bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold ring-2 ring-emerald-500";
                          } else if (isCorrectOption) {
                            optionBtnStyle = "border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/5 text-neutral-800 dark:text-neutral-200 font-bold ring-1 ring-emerald-500/20 hover:bg-emerald-50/20";
                          }
                        } else if (isSelected) {
                          // Standard users (GV, HS) just see simple blue/active selection highlight (no preview)
                          optionBtnStyle = "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 font-extrabold ring-1 ring-blue-500";
                        }
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
                          className={`group p-3 rounded-xl border text-xs text-left transition-all duration-200 flex items-start gap-2 ${
                            hasSubmitted 
                              ? "cursor-not-allowed" 
                              : "cursor-pointer hover:scale-[1.035] active:scale-[0.985] hover:shadow-md hover:text-neutral-950 dark:hover:text-white hover:border-slate-400 dark:hover:border-neutral-600"
                          } ${optionBtnStyle}`}
                        >
                          <span className="font-black shrink-0 transition-all duration-200 group-hover:text-neutral-950 dark:group-hover:text-white group-hover:scale-110">{optChar}.</span>
                          <span className="flex-1 transition-all duration-200 font-semibold group-hover:text-neutral-950 dark:group-hover:text-white group-hover:font-extrabold">{opt.substring(2)}</span>
                          {!hasSubmitted && isCorrectOption && currentUser?.role === "dev" && (
                            <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black uppercase shrink-0 font-sans tracking-wide">
                              {language === "vi" ? "Đáp án" : "Key"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Rendering ESSAY OPTIONS */}
                {q.type === "essay" && (
                  <div className="space-y-2 font-semibold">
                    {hasSubmitted ? (
                      <div className="space-y-2">
                        <textarea
                          value={savedAns}
                          disabled
                          rows={2}
                          className="w-full p-3 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-100 opacity-80 cursor-not-allowed"
                        />
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                          <Edit3 className="w-4 h-4 shrink-0 text-amber-500" />
                          <span>
                            {language === "vi" ? "Đang chờ Giáo viên xem xét & cho điểm bài viết tự luận." : "Awaiting Teacher review and grading of the written response."}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <textarea
                        value={solvingAnswers[q.id] || ""}
                        onChange={(e) =>
                          setSolvingAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        placeholder={language === "vi" ? "Hãy soạn câu trả lời Tiếng Anh của bạn..." : "Draft your response in English here..."}
                        rows={2}
                        className="w-full p-3 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-100"
                      />
                    )}
                  </div>
                )}

                {/* Rendering FILL IN THE BLANK OPTIONS */}
                {q.type === "fill_in_the_blank" && (
                  <div className="space-y-2 font-semibold">
                    {hasSubmitted ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={savedAns}
                          disabled
                          className="w-full p-3 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-100 opacity-85 cursor-not-allowed"
                        />
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
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentUser?.role === "dev" && (
                          <div className="p-2.5 bg-emerald-50/50 dark:bg-neutral-950 rounded-lg border border-emerald-200 dark:border-neutral-800/80 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                            🔑 {language === "vi" ? "Đáp án mẫu chính xác:" : "Auto-grade Answer key:"} {q.fillAnswers?.join(" / ")}
                          </div>
                        )}
                        <input
                          type="text"
                          value={solvingAnswers[q.id] || ""}
                          onChange={(e) =>
                            setSolvingAnswers((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                          placeholder={language === "vi" ? "Điền từ đáp án chính xác..." : "Type your answer..."}
                          className="w-full p-2.5 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-100"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Developer instant hint buttons */}
                {currentUser?.role === "dev" && q.type === "abcd" && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        window.showToast?.(
                          `${language === "vi" ? "Đáp án mẫu chính xác là:" : "The accurate option is:"} [${q.correctOption}]`,
                          "info"
                        );
                      }}
                      className="text-[10px] text-blue-500 hover:underline font-bold"
                    >
                      💡 {language === "vi" ? "Xem đáp án mẫu (Chế độ Dev)" : "Show Correct Option (Dev Mode)"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit action block */}
        <div className="pt-4 text-center">
          {hasSubmitted ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200/60 dark:border-emerald-850 p-6 rounded-2xl text-center space-y-2">
              <Check className="w-8 h-8 text-emerald-500 mx-auto" />
              <h5 className="font-extrabold text-neutral-950 dark:text-neutral-100 text-sm">
                {language === "vi" ? "CHỦ ĐỀ LƯYỆN TẬP ĐÃ HOÀN THÀNH" : "SAMPLE PRACTICE COMPLETED"}
              </h5>
              <p className="text-xs text-neutral-400 font-medium">
                {language === "vi" 
                  ? `Nộp bài lúc ${new Date(existingSubmission.submittedAt).toLocaleString()}` 
                  : `Submitted at ${new Date(existingSubmission.submittedAt).toLocaleString()}`}
              </p>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {language === "vi" ? "Đã lưu lại kết quả bài luyện tập thành công!" : "Practice results recorded successfully!"}
              </div>
            </div>
          ) : (
            <button
              onClick={handleLocalSubmit}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition shadow-md flex items-center gap-2 mx-auto cursor-pointer"
            >
              <Send className="w-5 h-5" />
              {language === "vi" ? "NỘP BÀI TẬP MẪU" : "SUBMIT PRACTICE ANSWER"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
