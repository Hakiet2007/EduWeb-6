export type Role = "teacher" | "student" | "dev" | "admin";

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  level: number;
  xp: number;
  email?: string;
  password?: string;
  banned?: boolean;
  grade?: string; // e.g. "Lớp 10", "Lớp 3", or "Class 10"
  streakCount?: number;
  lastActiveDate?: string;
  quizSolvedCountToday?: number;
  lastQuizSolvedDate?: string;
  quizCooldownUntil?: string;
  devCustomCooldownMs?: number;
  warnedUntil?: string | null;
  warningType?: "remind" | "3days" | "7days" | "30days" | null;
}

export type QuestionType = "abcd" | "essay" | "fill_in_the_blank";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  grade?: string; // e.g. "10", "3", or "Khác"
  subject?: string; // e.g. "Toán", "Lý", "Hoá", "Anh", "Sinh", "Khoa"
  // For abcd
  options?: string[]; // e.g. ["A. Cat", "B. Dog", "C. Fish", "D. Bird"]
  correctOption?: string; // e.g. "B"
  // For fill in the blank
  fillAnswers?: string[]; // Acceptable specific answers (1 or 2 answers)
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  createdAt: string;
}

export interface Classroom {
  id: string;
  name: string;
  code: string; // unique code to join
  teacherId: string;
  teacherName: string;
  topics: Topic[];
  studentIds: string[];
  updatedAt?: number;
  leaveRequests?: { studentId: string; studentName: string; requestedAt: number }[];
  deniedLeaves?: Record<string, number>; // studentId -> block timestamp until wait is over
}

export interface AnswerSubmission {
  questionId: string;
  studentAnswer: string;
  isCorrect?: boolean; // true/false for auto-graded; if essay or ungraded fill, is undefined
  score?: number; // 20 XP if correct, 0 if wrong
  gradedByTeacher?: boolean;
}

export interface TopicSubmission {
  id: string;
  topicId: string;
  topicName: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  answers: AnswerSubmission[];
  submittedAt: string;
  isFullyGraded: boolean;
}

export interface LeaderboardUser {
  id: string;
  fullName: string;
  level: number;
  xp: number;
  role: Role;
  banned?: boolean;
  warnedUntil?: string | null;
  warningType?: "remind" | "3days" | "7days" | "30days" | null;
  grade?: string;
  streakCount?: number;
}

export type AppLanguage = "vi" | "en";
export type AppTheme = "light" | "dark";

export interface AppSettings {
  language: AppLanguage;
  theme: AppTheme;
}
