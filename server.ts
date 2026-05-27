import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client lazily to avoid crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (err) {
        console.error("Error initializing Gemini API client:", err);
      }
    }
  }
  return aiClient;
}

// Fallback high-quality STEM/Arts questions based on subjects chosen by student
const SubjectFallbackPool: Record<string, Array<{ subject: string, question: string, options: string[], correctAnswer: string, explanation: string }>> = {
  "Toán": [
    {
      subject: "Toán",
      question: "Tìm giá trị của x trong phương trình: 2x + 7 = 15.",
      options: ["A. x = 3", "B. x = 4", "C. x = 5", "D. x = 6"],
      correctAnswer: "B",
      explanation: "Ta có: 2x = 15 - 7 => 2x = 8 => x = 4."
    },
    {
      subject: "Toán",
      question: "Diện tích hình tròn có bán kính r = 3 cm xấp xỉ bằng bao nhiêu? (Lấy pi = 3.14)",
      options: ["A. 9.42 cm²", "B. 18.84 cm²", "C. 28.26 cm²", "D. 31.42 cm²"],
      correctAnswer: "C",
      explanation: "S = pi * r² = 3.14 * 3² = 3.14 * 9 = 28.26 cm²."
    }
  ],
  "Lý": [
    {
      subject: "Lý",
      question: "Công thức nào sau đây mô tả Định luật II Newton?",
      options: ["A. F = m/a", "B. F = m * a", "C. F = p * d", "D. F = 1/2 m v²"],
      correctAnswer: "B",
      explanation: "Định luật II Newton phát biểu lực F tác dụng vào một vật tỷ lệ thuận với gia tốc a và khối lượng m: F = m * a."
    },
    {
      subject: "Lý",
      question: "Đơn vị đo điện trở trong hệ SI là gì?",
      options: ["A. Ampe (A)", "B. Vôn (V)", "C. Ôm (Ω)", "D. Oát (W)"],
      correctAnswer: "C",
      explanation: "Đơn vị đo điện trở là Ôm, ký hiệu là Ω."
    }
  ],
  "Hoá": [
    {
      subject: "Hoá",
      question: "Công thức hóa học của muối ăn thông thường là gì?",
      options: ["A. HCl", "B. NaOH", "C. NaCl", "D. CuSO4"],
      correctAnswer: "C",
      explanation: "Công thức của muối ăn là Natri Clorua (NaCl)."
    },
    {
      subject: "Hoá",
      question: "Khí nào sau đây chiếm tỷ lệ thể tích lớn nhất trong không khí?",
      options: ["A. Oxi (O2)", "B. Nitơ (N2)", "C. Cacbon đioxit (CO2)", "D. Argon (Ar)"],
      correctAnswer: "B",
      explanation: "Khí Nitơ chiếm khoảng 78% thể tích không khí Trái Đất."
    }
  ],
  "Anh": [
    {
      subject: "Anh",
      question: "Chọn từ phù hợp điền vào chỗ trống: \"She _______ English for three years before she moved to London.\"",
      options: ["A. has studied", "B. had studied", "C. was studying", "D. studies"],
      correctAnswer: "B",
      explanation: "Thì quá khứ hoàn thành (had studied) diễn tả hành động xảy ra trước một hành động khác trong quá khứ."
    },
    {
      subject: "Anh",
      question: "Từ đồng nghĩa với từ \"beautiful\" là gì?",
      options: ["A. Ugly", "B. Pretty", "C. Sad", "D. Angry"],
      correctAnswer: "B",
      explanation: "\"Pretty\" đồng nghĩa với \"beautiful\" (đẹp, dễ nhìn)."
    }
  ],
  "Sinh": [
    {
      subject: "Sinh",
      question: "Đơn vị cấu tạo cơ bản của mọi sinh vật sống là gì?",
      options: ["A. Mô", "B. Cơ quan", "C. Tế bào", "D. Nguyên tử"],
      correctAnswer: "C",
      explanation: "\"Tế bào\" là đơn vị cấu trúc và chức năng cơ bản của mọi sự sống."
    },
    {
      subject: "Sinh",
      question: "Trong cơ thể người, cơ quan nào chịu trách nhiệm lọc máu và tạo ra nước tiểu?",
      options: ["A. Gan", "B. Phổi", "C. Thận", "D. Tim"],
      correctAnswer: "C",
      explanation: "Thận lọc các chất thải từ máu để tạo ra nước tiểu thải ra ngoài cơ thể."
    }
  ],
  "Khoa": [
    {
      subject: "Khoa",
      question: "Hành tinh nào gần Mặt Trời nhất trong Hệ Mặt Trời?",
      options: ["A. Kim tinh (Venus)", "B. Thủy tinh (Mercury)", "C. Hỏa tinh (Mars)", "D. Trái Đất"],
      correctAnswer: "B",
      explanation: "Thủy tinh (Mercury) là hành tinh nằm gần Mặt Trời nhất trong Hệ Mặt Trời."
    },
    {
      subject: "Khoa",
      question: "Hiện tượng nào sau đây là sự biến đổi hóa học?",
      options: ["A. Nước đá tan thành nước lỏng", "B. Đốt cháy một mảnh giấy", "C. Hòa tan muối vào nước cốc", "D. Thủy tinh vỡ ra thành từng mảnh"],
      correctAnswer: "B",
      explanation: "Đốt cháy giấy biến chuyển cellulose thành than carbon, tạo thành một chất mới khác biệt hoàn toàn (biến đổi hóa học)."
    }
  ]
};

// Server API to generate mathematical, physics, and chemical questions
app.post("/api/generate-quiz", async (req, res) => {
  const client = getGeminiClient();
  const subjects: string[] = req.body.subjects || ["Toán", "Lý", "Hoá"];
  const grade: string = req.body.grade || "10";

  // Fallback function to generate 3 customized subjects from pool
  const getPoolFallbackQuiz = () => {
    return subjects.map((sub: string) => {
      let key = "Toán";
      const sLower = sub.toLowerCase();
      if (sLower.includes("toán") || sLower.includes("math")) key = "Toán";
      else if (sLower.includes("lý") || sLower.includes("physic") || sLower.includes("vật lý")) key = "Lý";
      else if (sLower.includes("hoá") || sLower.includes("hóa") || sLower.includes("chem") || sLower.includes("hóa học")) key = "Hoá";
      else if (sLower.includes("anh") || sLower.includes("english") || sLower.includes("tiếng anh")) key = "Anh";
      else if (sLower.includes("sinh") || sLower.includes("biol") || sLower.includes("sinh học")) key = "Sinh";
      else if (sLower.includes("khoa") || sLower.includes("scien") || sLower.includes("khoa học")) key = "Khoa";

      const pool = SubjectFallbackPool[key] || SubjectFallbackPool["Toán"];
      const randQ = pool[Math.floor(Math.random() * pool.length)];
      return {
        ...randQ,
        subject: sub
      };
    });
  };

  if (!client) {
    console.log("No Gemini API key configured. Utilizing high-quality fallback subject questions.");
    return res.json({
      success: true,
      quiz: getPoolFallbackQuiz(),
      source: "fallback_no_key"
    });
  }

  try {
    const prompt = `Hãy tạo chính xác 3 câu hỏi trắc nghiệm khách quan tương ứng cho 3 môn học sau: ${subjects.join(", ")}. Mỗi môn học tạo đúng 1 câu hỏi.
Yêu cầu:
1. Độ khó: PHẢI phù hợp chính xác tuyệt đối với trình độ học sinh Lớp ${grade} (Cấp lớp ${grade} ở Việt Nam). Các kiến thức và công thức sử dụng phải xoay quanh chương trình của Lớp ${grade}.
2. Ngôn ngữ câu hỏi hoàn toàn bằng tiếng Việt chất lượng tốt.
3. Mỗi câu hỏi gồm 4 lựa chọn (A, B, C, D) rõ ràng và ghi đúng cú pháp ví dụ: "A. <nội dung>", "B. <nội dung>"...
4. Chọn đúng đáp án chính xác (chỉ ghi chữ cái đại diện như 'A', 'B', 'C', HOẶC 'D').
5. Thêm phần giải thích ngắn gọn, dễ hiểu ở cấp độ Lớp ${grade} để học sinh hiểu cách làm.
6. TUYỆT ĐỐI KHÔNG sử dụng ký tự hay định dạng LaTeX như $, $$, \\mathbb, \\mid, \\{, kí hiệu mũ ^ phức tạp dạng latex, v.v. Hãy ghi công thức toán học/hóa học dưới dạng chữ unicode thuần tiếng Việt, ký hiệu latin thường và các phép tính cơ bản dễ đọc trực tiếp trên trình duyệt (ví dụ: viết "x^2 - 5x + 6 = 0" thay vì "x^2 - 5x + 6 = 0" trong thẻ đô la latex; viết "x thuộc số thực R" thay vì "x thuộc \\mathbb{R}", viết "H2SO4" thay vì có mã latex...). Đề bài phải hoàn toàn hiển thị đẹp mắt và rõ ràng mà không cần bất kỳ thư viện hỗ trợ render LaTeX nào.

Yêu cầu trả về đúng định dạng JSON Array chứa đúng 3 đối tượng khớp với 3 môn học có các thuộc tính chính xác sau:
- "subject": tên môn học gốc tương ứng từ danh sách (${subjects.join(", ")})
- "question": nội dung văn bản câu hỏi
- "options": mảng gồm 4 chuỗi đáp án (bắt đầu bằng A., B., C., D.)
- "correctAnswer": chuỗi chứa duy nhất một ký tự hoa 'A', 'B', 'C' hoặc 'D'.
- "explanation": chuỗi giải thích tại sao đáp án đó đúng.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 4 choices labeled as A. , B. , C. , D."
              },
              correctAnswer: { type: Type.STRING, description: "Exact single character A, B, C, or D" },
              explanation: { type: Type.STRING }
            },
            required: ["subject", "question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      const quizData = JSON.parse(text);
      return res.json({
        success: true,
        quiz: quizData,
        source: "gemini_ai"
      });
    } else {
      throw new Error("Empty text response from Gemini model.");
    }
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes("429") || errMsg.toLowerCase().includes("quota")) {
      console.warn("[Gemini API Quota Limit] 429 Resource exhausted or rate limit hit. Gracefully serving offline high-quality fallback quiz.");
    } else {
      console.error("Error generating dynamic quiz via Gemini. Falling back:", error);
    }
    return res.json({
      success: true,
      quiz: getPoolFallbackQuiz(),
      source: "fallback_error"
    });
  }
});

// AI custom classroom question helper
app.post("/api/generate-custom-question", async (req, res) => {
  const client = getGeminiClient();
  const { topic, type, grade, subject } = req.body;
  const gradeValue = grade || "10";
  const typeValue = type || "abcd";
  const topicValue = topic || "Kiến thức chung";
  const subjectValue = subject || "";

  const getFallback = () => {
    if (typeValue === "abcd") {
      return {
        prompt: `Câu hỏi trắc nghiệm tự động ${subjectValue ? `môn ${subjectValue} ` : ""}về [${topicValue}] dành cho học sinh Lớp ${gradeValue}? (Vui lòng cấu hình API Key để tạo chất lượng)`,
        options: [
          "A. Đáp án tham khảo đúng",
          "B. Phương án nhiễu 1",
          "C. Phương án nhiễu 2",
          "D. Phương án nhiễu 3"
        ],
        correctOption: "A"
      };
    } else {
      return {
        prompt: `Câu hỏi tự luận/điền từ ${subjectValue ? `môn ${subjectValue} ` : ""}về [${topicValue}] dành cho học sinh Lớp ${gradeValue}? (Vui lòng cấu hình API Key để tạo chất lượng)`,
        fillAnswers: ["mẫu"]
      };
    }
  };

  if (!client) {
    return res.json({ success: true, question: getFallback() });
  }

  try {
    const prompt = `Hãy đóng vai giáo viên, tạo ra đúng 1 câu hỏi có độ khó phù hợp hoàn toàn cho học sinh Lớp ${gradeValue} (Việt Nam) ${subjectValue ? `môn "${subjectValue}" ` : ""}về chủ đề: "${topicValue}".
Thể loại câu hỏi: ${typeValue === "abcd" ? "Trắc nghiệm 4 lựa chọn (A, B, C, D)" : typeValue === "essay" ? "Tự luận ngắn" : "Điền vào chỗ trống"}.

Yêu cầu định dạng JSON trả về dạng đối tượng gồm:
- "prompt": nội dung đề câu hỏi bằng tiếng Việt rõ ràng, bám sát trình độ Lớp ${gradeValue}. TUYỆT ĐỐI KHÔNG sử dụng ký tự hay định dạng LaTeX như $, $$, \\mathbb, \\mid, \\{, kí hiệu mũ ^ phức tạp dạng latex, v.v. Hãy ghi tất cả công thức toán hay hóa dưới dạng chữ unicode thuần tiếng Việt, ký hiệu latin thường và các phép tính cơ bản dễ đọc trực tiếp trên trình duyệt (ví dụ: viết "x^2 - 5x + 6 = 0" thay vì "x^2 - 5x + 6 = 0" trong thư mục đô la latex; viết "x thuộc số thực R" thay vì "x thuộc \\mathbb{R}", viết "H2SO4" thay vì có mã latex...). Đề bài phải hoàn toàn hiển thị đẹp mắt và rõ ràng mà không cần bất kỳ thư viện hỗ trợ render LaTeX nào.
${typeValue === "abcd" ? `- "options": mảng gồm đúng 4 chuỗi chứa các lựa chọn dạng ["A. <nội dung>", "B. <nội dung>", "C. <nội dung>", "D. <nội dung>"]\n- "correctOption": chuỗi chứa duy nhất một chữ cái 'A', 'B', 'C' hoặc 'D'` : ""}
${typeValue === "fill_in_the_blank" ? `- "fillAnswers": mảng các kết quả mẫu có thể chấp nhận (chuỗi viết thường)` : ""}
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctOption: { type: Type.STRING },
            fillAnswers: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["prompt"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return res.json({ success: true, question: JSON.parse(text) });
    }
    return res.json({ success: true, question: getFallback() });
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes("429") || errMsg.toLowerCase().includes("quota")) {
      console.warn("[Gemini API Quota Limit] 429 Resource exhausted inside generate-custom-question. Serving high-quality offline fallback question.");
    } else {
      console.error("Error generating custom question:", error);
    }
    return res.json({ success: true, question: getFallback() });
  }
});

// --- SERVER-SIDE DB INTEGRATION FOR MULTI-DEVICE ACC SYNC ---
let serverUsers: any[] = [];
let serverClassrooms: any[] = [];
let serverSubmissions: any[] = [];
let serverDeletedUserIds: string[] = [];
let serverDeletedClassroomIds: string[] = [];

try {
  if (fs.existsSync("./server_users.json")) {
    serverUsers = JSON.parse(fs.readFileSync("./server_users.json", "utf-8"));
  }
  if (fs.existsSync("./server_deleted_users.json")) {
    serverDeletedUserIds = JSON.parse(fs.readFileSync("./server_deleted_users.json", "utf-8"));
  }
  if (fs.existsSync("./server_deleted_classrooms.json")) {
    serverDeletedClassroomIds = JSON.parse(fs.readFileSync("./server_deleted_classrooms.json", "utf-8"));
  }
  if (fs.existsSync("./server_classrooms.json")) {
    serverClassrooms = JSON.parse(fs.readFileSync("./server_classrooms.json", "utf-8"));
  }
  if (fs.existsSync("./server_submissions.json")) {
    serverSubmissions = JSON.parse(fs.readFileSync("./server_submissions.json", "utf-8"));
  }
} catch (e) {
  console.error("Error loading server db state:", e);
}

function saveDb() {
  try {
    fs.writeFileSync("./server_users.json", JSON.stringify(serverUsers, null, 2), "utf-8");
    fs.writeFileSync("./server_deleted_users.json", JSON.stringify(serverDeletedUserIds, null, 2), "utf-8");
    fs.writeFileSync("./server_deleted_classrooms.json", JSON.stringify(serverDeletedClassroomIds, null, 2), "utf-8");
    fs.writeFileSync("./server_classrooms.json", JSON.stringify(serverClassrooms, null, 2), "utf-8");
    fs.writeFileSync("./server_submissions.json", JSON.stringify(serverSubmissions, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing server db state:", err);
  }
}

app.post("/api/sync-data", (req, res) => {
  const { clientUsers, clientClassrooms, clientSubmissions, deletedUserId, deletedClassroomId } = req.body;

  // Add to deleted users set if explicitly requested
  if (deletedUserId && !serverDeletedUserIds.includes(deletedUserId)) {
    serverDeletedUserIds.push(deletedUserId);
  }

  // Add to deleted classrooms set if explicitly requested
  if (deletedClassroomId && !serverDeletedClassroomIds.includes(deletedClassroomId)) {
    serverDeletedClassroomIds.push(deletedClassroomId);
  }

  // 1. Merge Users
  const mergedUsersMap = new Map();
  // Load server-side users first, filtering out the user if explicitly deleted or recorded as deleted
  for (const u of serverUsers) {
    if (u && u.id) {
      if (deletedUserId && u.id === deletedUserId) {
        continue;
      }
      if (serverDeletedUserIds.includes(u.id)) {
        continue;
      }
      mergedUsersMap.set(u.id, u);
    }
  }

  // Overlay client-side users
  if (Array.isArray(clientUsers)) {
    for (const u of clientUsers) {
      if (u && u.id) {
        if (deletedUserId && u.id === deletedUserId) {
          continue;
        }
        if (serverDeletedUserIds.includes(u.id)) {
          continue;
        }

        if (mergedUsersMap.has(u.id)) {
          const existing = mergedUsersMap.get(u.id);

          // Standard LWW merge: compare updatedAt
          const existingUpdatedAt = existing.updatedAt || 0;
          const clientUpdatedAt = u.updatedAt || 0;

          if (clientUpdatedAt > existingUpdatedAt) {
            // Client represents a direct deliberate update that happened recently
            const merged = {
              ...existing,
              ...u,
            };
            mergedUsersMap.set(u.id, merged);
          } else if (existingUpdatedAt > clientUpdatedAt) {
            // Server's data is strictly newer, discard client's stale information on this specific user
          } else {
            // Equal or no timestamps: fallback to safe manual merge
            const merged = {
              ...existing,
              ...u,
              banned: existing.banned !== undefined ? existing.banned : u.banned,
              role: existing.role || u.role,
              warnedUntil: existing.warnedUntil !== undefined ? existing.warnedUntil : u.warnedUntil,
              warningType: existing.warningType !== undefined ? existing.warningType : u.warningType,
            };

            // 1. Keep the highest quizSolvedCountToday if on the same day, or preserve the latest day's solved stats
            const existingDate = existing.lastQuizSolvedDate || "";
            const clientDate = u.lastQuizSolvedDate || "";
            if (existingDate && clientDate) {
              if (existingDate === clientDate) {
                merged.quizSolvedCountToday = Math.max(existing.quizSolvedCountToday || 0, u.quizSolvedCountToday || 0);
              } else if (existingDate > clientDate) {
                merged.lastQuizSolvedDate = existingDate;
                merged.quizSolvedCountToday = existing.quizSolvedCountToday;
              } else {
                merged.lastQuizSolvedDate = clientDate;
                merged.quizSolvedCountToday = u.quizSolvedCountToday;
              }
            } else if (existingDate) {
              merged.lastQuizSolvedDate = existingDate;
              merged.quizSolvedCountToday = existing.quizSolvedCountToday;
            }

            // 2. Keep the future quizCooldownUntil representing any active cooldown period
            const existingCooldown = existing.quizCooldownUntil ? new Date(existing.quizCooldownUntil).getTime() : 0;
            const clientCooldown = u.quizCooldownUntil ? new Date(u.quizCooldownUntil).getTime() : 0;
            if (existingCooldown > 0 || clientCooldown > 0) {
              merged.quizCooldownUntil = existingCooldown > clientCooldown 
                ? existing.quizCooldownUntil 
                : u.quizCooldownUntil;
            }

            // Prevent losing higher XP/level/streak if server version had greater points
            const existingScore = (existing.xp || 0) + (existing.level || 0) * 100 + (existing.streakCount || 0) * 10;
            const clientScore = (u.xp || 0) + (u.level || 0) * 100 + (u.streakCount || 0) * 10;
            if (existingScore > clientScore) {
              merged.xp = existing.xp;
              merged.level = existing.level;
              merged.streakCount = existing.streakCount;
            }
            
            mergedUsersMap.set(u.id, merged);
          }
        } else {
          mergedUsersMap.set(u.id, u);
        }
      }
    }
  }

  // Ensure dev_user_01 exists always
  if (!mergedUsersMap.has("dev_user_01")) {
    mergedUsersMap.set("dev_user_01", {
      id: "dev_user_01",
      username: "kietxx_173",
      fullName: "kietxx_173",
      role: "dev",
      level: 1,
      xp: 60,
      email: "kietxx_173@dev.local",
      password: "24122014@",
    });
  }
  serverUsers = Array.from(mergedUsersMap.values());

  // 2. Merge Classrooms
  const mergedClassroomsMap = new Map();
  for (const c of serverClassrooms) {
    if (c && c.id) {
      if (deletedClassroomId && c.id === deletedClassroomId) {
        continue;
      }
      if (serverDeletedClassroomIds.includes(c.id)) {
        continue;
      }
      mergedClassroomsMap.set(c.id, JSON.parse(JSON.stringify(c)));
    }
  }
  if (Array.isArray(clientClassrooms)) {
    for (const c of clientClassrooms) {
      if (c && c.id) {
        if (deletedClassroomId && c.id === deletedClassroomId) {
          continue;
        }
        if (serverDeletedClassroomIds.includes(c.id)) {
          continue;
        }
        if (!mergedClassroomsMap.has(c.id)) {
          mergedClassroomsMap.set(c.id, JSON.parse(JSON.stringify(c)));
        } else {
          const existing = mergedClassroomsMap.get(c.id);
          const existingUpdatedAt = existing.updatedAt || 0;
          const clientUpdatedAt = c.updatedAt || 0;

          if (clientUpdatedAt >= existingUpdatedAt) {
            existing.studentIds = c.studentIds || [];
            if (c.leaveRequests !== undefined) existing.leaveRequests = c.leaveRequests;
            if (c.deniedLeaves !== undefined) existing.deniedLeaves = c.deniedLeaves;
            existing.updatedAt = clientUpdatedAt;
          }

          // Merge classroom topics
          const tMap = new Map();
          for (const t of (existing.topics || [])) {
            if (t && t.id) tMap.set(t.id, t);
          }
          for (const t of (c.topics || [])) {
            if (t && t.id) {
              if (!tMap.has(t.id)) {
                tMap.set(t.id, t);
              } else {
                const existingTopic = tMap.get(t.id);
                // Merge questions
                const qMap = new Map();
                for (const q of (existingTopic.questions || [])) {
                  if (q && q.id) qMap.set(q.id, q);
                }
                for (const q of (t.questions || [])) {
                  if (q && q.id) qMap.set(q.id, q);
                }
                existingTopic.questions = Array.from(qMap.values());
                if (t.name) existingTopic.name = t.name;
                if (t.description) existingTopic.description = t.description;
              }
            }
          }
          existing.topics = Array.from(tMap.values());
          if (c.name) existing.name = c.name;
        }
      }
    }
  }
  serverClassrooms = Array.from(mergedClassroomsMap.values());

  // 3. Merge Submissions
  const mergedSubmissionsMap = new Map();
  for (const s of serverSubmissions) {
    if (s && s.id) {
      if (deletedClassroomId && s.classId === deletedClassroomId) {
        continue;
      }
      if (s.classId && serverDeletedClassroomIds.includes(s.classId)) {
        continue;
      }
      mergedSubmissionsMap.set(s.id, s);
    }
  }
  if (Array.isArray(clientSubmissions)) {
    for (const s of clientSubmissions) {
      if (s && s.id) {
        if (deletedClassroomId && s.classId === deletedClassroomId) {
          continue;
        }
        if (s.classId && serverDeletedClassroomIds.includes(s.classId)) {
          continue;
        }
        if (!mergedSubmissionsMap.has(s.id)) {
          mergedSubmissionsMap.set(s.id, s);
        } else {
          const existing = mergedSubmissionsMap.get(s.id);
          const existingAns = Object.keys(existing.answers || {}).length;
          const clientAns = Object.keys(s.answers || {}).length;
          if (s.graded || clientAns >= existingAns) {
            mergedSubmissionsMap.set(s.id, s);
          }
        }
      }
    }
  }
  serverSubmissions = Array.from(mergedSubmissionsMap.values());

  saveDb();

  res.json({
    success: true,
    users: serverUsers,
    classrooms: serverClassrooms,
    submissions: serverSubmissions
  });
});

// Setup Vite development middleware or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduWeb Server listening on port ${PORT}...`);
  });
}

startServer();
