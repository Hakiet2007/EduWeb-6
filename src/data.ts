import { Classroom, LeaderboardUser } from "./types";

export const DEFAULT_LEADERBOARD_USERS: LeaderboardUser[] = [
  { id: "lead_1", fullName: "Nguyễn Văn An", level: 4, xp: 340, role: "student" },
  { id: "lead_2", fullName: "Trần Thị Bình", level: 3, xp: 210, role: "student" },
  { id: "lead_3", fullName: "Phạm Minh Đức", level: 2, xp: 180, role: "student" },
  { id: "lead_4", fullName: "Lê Hoàng Yến", level: 1, xp: 90, role: "student" },
];

export const TRIAL_CLASSROOM: Classroom = {
  id: "class_trial_01",
  name: "Lớp học thử nghiệm - English Club",
  code: "ENG101",
  teacherId: "teacher_trial_01",
  teacherName: "Cô Thảo Vy",
  studentIds: [], // Empty initially, can be joined
  topics: [
    {
      id: "topic_trial_english",
      name: "Chủ đề: Tiếng Anh giao tiếp & Ngữ pháp căn bản",
      description: "Bài luyện tập tổng hợp gồm 10 câu hỏi kiểm tra đầy đủ 3 loại định dạng: trắc nghiệm ABCD, viết tự luận và điền vào chỗ trống.",
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: "q_eng_1",
          type: "abcd",
          prompt: "What is the synonym of the word 'happy'?",
          options: [
            "A. Melancholic",
            "B. Joyful",
            "C. Aggressive",
            "D. Exhausted"
          ],
          correctOption: "B"
        },
        {
          id: "q_eng_2",
          type: "abcd",
          prompt: "Which preposition is correct? 'She goes to school ___ bus.'",
          options: [
            "A. on",
            "B. in",
            "C. by",
            "D. at"
          ],
          correctOption: "C"
        },
        {
          id: "q_eng_3",
          type: "fill_in_the_blank",
          prompt: "Write the opposite of the word 'HOT' (1 word, normal lowercase):",
          fillAnswers: ["cold", "freezing"]
        },
        {
          id: "q_eng_4",
          type: "abcd",
          prompt: "Which word is a NOUN?",
          options: [
            "A. Beautifully",
            "B. Run",
            "C. Happiness",
            "D. Soft"
          ],
          correctOption: "C"
        },
        {
          id: "q_eng_5",
          type: "essay",
          prompt: "Write a short paragraph (2-3 sentences) introducing yourself in English (Name, Age, Hobbies)."
        },
        {
          id: "q_eng_6",
          type: "fill_in_the_blank",
          prompt: "Complete the sentence: 'He is interested ___ listening to music.' (1 word)",
          fillAnswers: ["in", "in "]
        },
        {
          id: "q_eng_7",
          type: "abcd",
          prompt: "What is the plural form of 'child'?",
          options: [
            "A. childs",
            "B. childrens",
            "C. children",
            "D. childes"
          ],
          correctOption: "C"
        },
        {
          id: "q_eng_8",
          type: "abcd",
          prompt: "Choose the correct spelling of the following word:",
          options: [
            "A. Receive",
            "B. Recieve",
            "C. Receve",
            "D. Riceive"
          ],
          correctOption: "A"
        },
        {
          id: "q_eng_9",
          type: "essay",
          prompt: "In your opinion, what are the benefits of learning a foreign language?"
        },
        {
          id: "q_eng_10",
          type: "fill_in_the_blank",
          prompt: "Write the past participle of the verb 'GO' (e.g. go - went - ___):",
          fillAnswers: ["gone", "GONE"]
        }
      ]
    }
  ]
};
