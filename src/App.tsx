import React, { useState, useEffect, useRef } from "react";
import { User, Classroom, TopicSubmission, AppLanguage, AppTheme, Topic, Question, AnswerSubmission } from "./types";
import { DEFAULT_LEADERBOARD_USERS, TRIAL_CLASSROOM } from "./data";
import { translations } from "./utils/translations";

// Components
import HomeTab from "./components/HomeTab";
import ClassroomsTab from "./components/ClassroomsTab";
import DailyQuizTab from "./components/DailyQuizTab";
import LeaderboardTab from "./components/LeaderboardTab";
import StatisticsTab from "./components/StatisticsTab";
import SettingsTab from "./components/SettingsTab";
import ProfileSearchTab from "./components/ProfileSearchTab";

// Icons
import { BookOpen, Home, Zap, Award, BarChart3, Settings, LogOut, Key, UserCheck, Shield, ChevronLeft, Moon, Sun, Globe, X, Sparkles, Check, Users, Search } from "lucide-react";

declare global {
  interface Window {
    showToast?: (message: string, type: "success" | "role_alert" | "error" | "info") => void;
  }
}

export default function App() {
  // Global configuration loads from LocalStorage
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const cached = localStorage.getItem("eduweb_lang");
    return (cached as AppLanguage) || "vi";
  });

  const [theme, setTheme] = useState<AppTheme>(() => {
    const cached = localStorage.getItem("eduweb_theme");
    if (cached) return cached as AppTheme;
    if (typeof window !== "undefined" && window.matchMedia) {
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return isSystemDark ? "dark" : "light";
    }
    return "dark";
  });

  // Track if we are on Sign In (login) or Register (signup) tab
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  // Persistent language and theme changes to LocalStorage
  useEffect(() => {
    localStorage.setItem("eduweb_theme", theme);
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("eduweb_lang", language);
  }, [language]);

  // Prepopulated accounts
  const [users, setUsers] = useState<User[]>(() => {
    const devUser: User = {
      id: "dev_user_01",
      username: "kietxx_173",
      fullName: "kietxx_173",
      role: "dev",
      level: 1,
      xp: 60,
      email: "kietxx_173@dev.local",
      password: "24122014@",
    };

    const cached = localStorage.getItem("eduweb_users");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as User[];
        // Filter out virtual mock accounts
        const filtered = parsed.filter((u) => u.id === "dev_user_01" || (!u.id.startsWith("lead_") && u.role !== "dev"));
        // Force kietxx_173's fullName to be 'kietxx_173'
        const mapped = filtered.map((u) => {
          if (u.id === "dev_user_01" || u.username === "kietxx_173") {
            return { ...u, fullName: "kietxx_173" };
          }
          return u;
        });
        // Ensure kietxx_173 is retained correctly
        if (!mapped.some((u) => u.id === "dev_user_01")) {
          mapped.push(devUser);
        }
        return mapped;
      } catch (e) {
        // ignore fallback
      }
    }

    // Return only the dev user initially
    return [devUser];
  });

  // Cache users lists
  useEffect(() => {
    localStorage.setItem("eduweb_users", JSON.stringify(users));
  }, [users]);

  // Current session configuration
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const cached = localStorage.getItem("eduweb_current_user");
    if (cached) {
      try {
        const u = JSON.parse(cached) as User;
        if (u.id === "dev_user_01" || u.username === "kietxx_173") {
          u.fullName = "kietxx_173";
        }
        return u;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("eduweb_current_user", JSON.stringify(currentUser));
      // Keep main users list synchronized when current credentials changes
      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? currentUser : u))
      );
    } else {
      localStorage.removeItem("eduweb_current_user");
    }
  }, [currentUser]);

  const getLocalDateString = (date = new Date()) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const getYesterdayDateString = () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const d = new Date(yesterday.getTime() - yesterday.getTimezoneOffset() * 60000);
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const handleRecordUserAction = () => {
    if (!currentUser) return;

    const today = getLocalDateString();
    const yesterday = getYesterdayDateString();
    const lastActive = currentUser.lastActiveDate;

    let currentStreak = currentUser.streakCount || 0;

    if (lastActive === today) {
      // Already maintained today! No need to toast again or increase
      return;
    } else if (lastActive === yesterday) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    const updatedUser = {
      ...currentUser,
      lastActiveDate: today,
      streakCount: currentStreak,
      updatedAt: Date.now(),
    };

    setCurrentUser(updatedUser);
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
    );

    triggerToast(
      language === "vi"
        ? `🔥 Chuỗi ngày học tập được tiếp tục: ${currentStreak} ngày!`
        : `🔥 Your learning streak was continued to ${currentStreak} days!`,
      "success"
    );
  };

  useEffect(() => {
    if (!currentUser) return;
    const today = getLocalDateString();
    const yesterday = getYesterdayDateString();
    const lastActive = currentUser.lastActiveDate;

    // If they missed studying yesterday, reset streakCount to 0
    if (lastActive && lastActive !== today && lastActive !== yesterday) {
      if ((currentUser.streakCount || 0) > 0) {
        const updatedUser = {
          ...currentUser,
          streakCount: 0,
          updatedAt: Date.now(),
        };
        setCurrentUser(updatedUser);
        setUsers((prev) =>
          prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
        );
      }
    }
  }, [currentUser?.id, currentUser?.lastActiveDate]);

  // Current classrooms list starting with English Trial class
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    const cached = localStorage.getItem("eduweb_classrooms");
    if (cached) return JSON.parse(cached);
    return [TRIAL_CLASSROOM];
  });

  useEffect(() => {
    localStorage.setItem("eduweb_classrooms", JSON.stringify(classrooms));
  }, [classrooms]);

  // Student assignment submissions lists
  const [submissions, setSubmissions] = useState<TopicSubmission[]>(() => {
    const cached = localStorage.getItem("eduweb_submissions");
    return cached ? JSON.parse(cached) : [];
  });

  useEffect(() => {
    localStorage.setItem("eduweb_submissions", JSON.stringify(submissions));
  }, [submissions]);

  // Robust sync references to prevent cycle loops
  const usersRef = useRef(users);
  const classroomsRef = useRef(classrooms);
  const submissionsRef = useRef(submissions);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    classroomsRef.current = classrooms;
  }, [classrooms]);

  useEffect(() => {
    submissionsRef.current = submissions;
  }, [submissions]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const triggerImmediateSync = async (latestUsers?: User[], deletedUserId?: string, latestSubmissions?: TopicSubmission[]) => {
    try {
      const response = await fetch("/api/sync-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientUsers: latestUsers || usersRef.current,
          clientClassrooms: classroomsRef.current,
          clientSubmissions: latestSubmissions || submissionsRef.current,
          deletedUserId: deletedUserId,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (JSON.stringify(data.users) !== JSON.stringify(usersRef.current)) {
            setUsers(data.users);
          }
          if (JSON.stringify(data.classrooms) !== JSON.stringify(classroomsRef.current)) {
            setClassrooms(data.classrooms);
          }
          if (JSON.stringify(data.submissions) !== JSON.stringify(submissionsRef.current)) {
            setSubmissions(data.submissions);
          }
          if (currentUserRef.current) {
            const updatedSelf = data.users.find((u: any) => u.id === currentUserRef.current?.id);
            if (updatedSelf && JSON.stringify(updatedSelf) !== JSON.stringify(currentUserRef.current)) {
              setCurrentUser(updatedSelf);
            }
          }
          return data.users as User[];
        }
      }
    } catch (err) {
      console.error("Immediate sync failed:", err);
    }
  };

  // Dynamic background data sync across devices
  useEffect(() => {
    const doSync = () => {
      triggerImmediateSync();
    };

    doSync();
    const interval = setInterval(doSync, 3000);
    return () => clearInterval(interval);
  }, []);

  // Current visible tab view
  const [activeTab, setActiveTab] = useState<string>("home");

  // Command Board state variables
  const [openCommandBoard, setOpenCommandBoard] = useState(false);
  const [cmdInput, setCmdInput] = useState("");

  // Dev admin quick account creation panel states
  const [showDevRegisterPanel, setShowDevRegisterPanel] = useState(false);
  const [devNewEmail, setDevNewEmail] = useState("");
  const [devNewUsername, setDevNewUsername] = useState("");
  const [devNewFullName, setDevNewFullName] = useState("");
  const [devNewPassword, setDevNewPassword] = useState("");
  const [devNewRole, setDevNewRole] = useState<"student" | "teacher" | "dev">("student");
  const [devNewGrade, setDevNewGrade] = useState("10");

  // Entrance form control states
  const [showIntroduction, setShowIntroduction] = useState<boolean>(!currentUser);
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);

  // Authentication credentials states
  const [authEmail, setAuthEmail] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authRole, setAuthRole] = useState<"student" | "teacher">("student");
  const [authGrade, setAuthGrade] = useState("10");
  const [validationError, setValidationError] = useState("");

  const [showVerificationStep, setShowVerificationStep] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [userSubmittedCode, setUserSubmittedCode] = useState<string>("");
  const [pendingTeacherUser, setPendingTeacherUser] = useState<User | null>(null);

  // Dev admin live telemetry panel states
  const [devRamUsage, setDevRamUsage] = useState(115.4);
  const [devCpuLoad, setDevCpuLoad] = useState(12.5);

  useEffect(() => {
    if (!openCommandBoard) return;
    const interval = setInterval(() => {
      setDevRamUsage((prev) => {
        const delta = (Math.random() - 0.5) * 2.5;
        const next = prev + delta;
        return next < 80 ? 80 : next > 240 ? 240 : parseFloat(next.toFixed(1));
      });
      setDevCpuLoad((prev) => {
        const delta = (Math.random() - 0.5) * 5;
        const next = prev + delta;
        return next < 3 ? 3 : next > 45 ? 45 : parseFloat(next.toFixed(1));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [openCommandBoard]);

  const handleDevQuickRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const uEmail = devNewEmail.trim();
    const uUsername = devNewUsername.trim();
    const uFullName = devNewFullName.trim() || uUsername;
    const uPassword = devNewPassword.trim() || "123456@";

    if (!uUsername) {
      triggerToast(language === "vi" ? "Vui lòng nhập Tên đăng nhập!" : "Username is required!", "error");
      return;
    }

    if (!uEmail || !uEmail.includes("@")) {
      triggerToast(language === "vi" ? "Vui lòng nhập Email hợp lệ!" : "Invalid Email address!", "error");
      return;
    }

    const collision = users.some(u => u.username.toLowerCase() === uUsername.toLowerCase() || (u.email && u.email.toLowerCase() === uEmail.toLowerCase()));
    if (collision) {
      triggerToast(language === "vi" ? "Tên đăng nhập hoặc Email này đã tồn tại!" : "Username or Email already exists!", "error");
      return;
    }

    const created: User = {
      id: "quick_user_" + Date.now(),
      username: uUsername,
      fullName: uFullName,
      role: devNewRole,
      level: 1,
      xp: 0,
      email: uEmail,
      password: uPassword,
      grade: devNewRole === "student" ? devNewGrade : undefined,
    };

    setUsers(prev => [...prev, created]);
    triggerToast(
      language === "vi" 
        ? `Tạo tài khoản thành công! Tên đăng nhập: ${uUsername}, vai trò: ${devNewRole === "teacher" ? "Giáo viên" : devNewRole === "dev" ? "Quản trị" : "Học sinh"}` 
        : `Registered ${devNewRole} successfully for username: ${uUsername}`, 
      "success"
    );

    // reset fields
    setDevNewEmail("");
    setDevNewUsername("");
    setDevNewFullName("");
    setDevNewPassword("");
    setDevNewRole("student");
    setShowDevRegisterPanel(false);
  };

  interface EduwebToast {
    id: string;
    message: string;
    type: "success" | "role_alert" | "error" | "info";
  }
  const [toasts, setToasts] = useState<EduwebToast[]>([]);

  const triggerToast = (message: string, type: "success" | "role_alert" | "error" | "info" = "success") => {
    const id = Math.random().toString() + Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    window.showToast = triggerToast;
    return () => {
      window.showToast = undefined;
    };
  }, []);

  const t = translations[language];

  // Helper password logic validation:
  // - Minimum 6 characters
  const validatePasswordConstraint = (pw: string): boolean => {
    return pw.length >= 6;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    const originalTerm = authUsername.trim();
    const inputTerm = originalTerm.toLowerCase();

    // Dev account credentials search bypass
    if (
      (inputTerm === "kietxx_173" || inputTerm === "kietxx_173@dev.local") &&
      authPassword === "24122014@"
    ) {
      const devAccount = users.find((u) => u.username === "kietxx_173" || u.email === "kietxx_173@dev.local") || {
        id: "dev_user_01",
        username: "kietxx_173",
        fullName: "kietxx_173",
        role: "dev" as const,
        level: 1,
        xp: 60,
        email: "kietxx_173@dev.local",
        password: "24122014@",
      };
      setCurrentUser(devAccount);
      setShowLoginModal(false);
      setShowIntroduction(false);
      return;
    }

    let currentUsersList = [...users];

    // Standard credential checking
    let matchedUser = currentUsersList.find(
      (u) =>
        u.username.toLowerCase() === inputTerm ||
        (u.email && u.email.toLowerCase() === inputTerm)
    );

    // Fallback sync: if not found locally, fetch latest registered accounts securely!
    if (!matchedUser) {
      try {
        const response = await fetch("/api/sync-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientUsers: usersRef.current,
            clientClassrooms: classroomsRef.current,
            clientSubmissions: submissionsRef.current,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.users)) {
            currentUsersList = data.users;
            setUsers(data.users);
            matchedUser = data.users.find(
              (u: any) =>
                u.username.toLowerCase() === inputTerm ||
                (u.email && u.email.toLowerCase() === inputTerm)
            );
          }
        }
      } catch (err) {
        console.error("Failed synchronizing accounts database during login fallback check:", err);
      }
    }

    if (matchedUser) {
      if (matchedUser.banned) {
        setValidationError(
          language === "vi"
            ? "Tài khoản của bạn đã bị khóa vĩnh viễn bởi quản trị viên!"
            : "Your account has been banned permanently by the administrator!"
        );
        return;
      }

      if (matchedUser.warnedUntil && matchedUser.warningType !== "remind" && new Date(matchedUser.warnedUntil) > new Date()) {
        const unlockDate = new Date(matchedUser.warnedUntil).toLocaleString(
          language === "vi" ? "vi-VN" : "en-US"
        );
        setValidationError(
          language === "vi"
            ? `Tài khoản của bạn đang bị cảnh cáo khóa tạm thời cho đến: ${unlockDate}!`
            : `Your account is temporarily suspended under warning until: ${unlockDate}!`
        );
        return;
      }

      // If user has a password set, verify it
      if (matchedUser.password && matchedUser.password !== authPassword) {
        setValidationError(
          language === "vi"
            ? "Mật khẩu không chính xác!"
            : "Incorrect password!"
        );
        return;
      }
      setCurrentUser(matchedUser);
      setShowLoginModal(false);
      setShowIntroduction(false);
    } else {
      setValidationError(
        language === "vi"
          ? "Sai thông tin đăng nhập hoặc tài khoản chưa đăng ký. Vui lòng kiểm tra lại hoặc tạo tài khoản mới!"
          : "Invalid credentials or account does not exist. Please register a new account!"
      );
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    const emailValue = authEmail.trim();
    const usernameValue = authUsername.trim();
    const fullnameValue = authFullName.trim() || usernameValue;

    if (!emailValue || !emailValue.includes("@")) {
      setValidationError(
        language === "vi" ? "Vui lòng nhập Email hợp lệ!" : "Please enter a valid email address!"
      );
      return;
    }

    if (!usernameValue) {
      setValidationError(
        language === "vi" ? "Vui lòng nhập Tên đăng nhập!" : "Please enter a username!"
      );
      return;
    }

    if (!validatePasswordConstraint(authPassword)) {
      setValidationError(
        language === "vi" 
          ? "Mật khẩu phải dài ít nhất 6 ký tự!" 
          : "Password must be at least 6 characters!"
      );
      return;
    }

    const cleanUsername = usernameValue.toLowerCase();
    const cleanEmail = emailValue.toLowerCase();

    // Check availability
    const alreadyExists = users.some(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        (u.email && u.email.toLowerCase() === cleanEmail)
    );
    if (alreadyExists) {
      setValidationError(
        language === "vi"
          ? "Tên đăng nhập hoặc Email đã tồn tại trong hệ thống!"
          : "Username or Email is already registered!"
      );
      return;
    }

    const newUser: User = {
      id: "user_" + Date.now(),
      username: usernameValue,
      fullName: fullnameValue,
      role: authRole,
      level: 1,
      xp: 0,
      email: emailValue,
      password: authPassword,
      grade: authRole === "student" ? authGrade : undefined,
    };

    setUsers((prev) => {
      const updated = [...prev, newUser];
      // Push immediately to backend to make it discoverable on other machines in a flash!
      fetch("/api/sync-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientUsers: updated,
          clientClassrooms: classroomsRef.current,
          clientSubmissions: submissionsRef.current,
        }),
      }).catch((err) => console.error("Immediate registration push failed:", err));
      return updated;
    });
    setCurrentUser(newUser);
    setShowRegisterModal(false);
    setShowIntroduction(false);

    triggerToast(
      language === "vi"
        ? `🎉 Đăng ký tài khoản ${authRole === "teacher" ? "Giáo viên" : "Học sinh"} thành công và đã tự động đăng nhập!`
        : `🎉 ${authRole === "teacher" ? "Teacher" : "Student"} account successfully registered and logged in!`,
      "success"
    );

    // Clear credential states
    setAuthEmail("");
    setAuthUsername("");
    setAuthPassword("");
    setAuthFullName("");
    setAuthGrade("10");
  };

  const handleVerifyOtpSubmit = () => {
    setValidationError("");
    if (userSubmittedCode !== verificationCode) {
      setValidationError(
        language === "vi"
          ? "Mã OTP không chính xác. Vui lòng kiểm tra lại!"
          : "Incorrect OTP code. Please try again!"
      );
      return;
    }

    if (pendingTeacherUser) {
      setUsers((prev) => [...prev, pendingTeacherUser]);
      setCurrentUser(pendingTeacherUser);
      setShowRegisterModal(false);
      setShowIntroduction(false);

      triggerToast(
        language === "vi"
          ? "🎉 Đăng ký và kích hoạt tài khoản Giáo viên thành công!"
          : "🎉 Teacher account verified and registered successfully!",
        "success"
      );

      // Clear credential states
      setAuthEmail("");
      setAuthUsername("");
      setAuthPassword("");
      setAuthFullName("");
      setPendingTeacherUser(null);
      setUserSubmittedCode("");
      setShowVerificationStep(false);
    }
  };

  // Helper callback to update current user state with updatedAt and sync
  const handleUpdateCurrentUser = (updatedUser: User) => {
    const userWithTime = {
      ...updatedUser,
      updatedAt: Date.now(),
    };
    setCurrentUser(userWithTime);
    const updatedList = users.map((u) => (u.id === userWithTime.id ? userWithTime : u));
    setUsers(updatedList);
    triggerImmediateSync(updatedList);
  };

  // Helper callback when student earns XP from questions
  const handleEarnXp = (xpEarned: number) => {
    if (!currentUser) return;

    let nextXp = currentUser.xp + xpEarned;
    let nextLevel = currentUser.level || 1;
    while (nextXp >= 100) {
      nextXp -= 100;
      nextLevel += 1;
    }
    const updated = {
      ...currentUser,
      xp: nextXp,
      level: nextLevel,
      updatedAt: Date.now(),
    };

    setCurrentUser(updated);
    const updatedList = users.map((u) => (u.id === updated.id ? updated : u));
    setUsers(updatedList);
    triggerImmediateSync(updatedList);
  };

  // Classroom handlers
  const handleCreateClassroom = (name: string) => {
    if (!currentUser) return;

    if (currentUser.role === "student") {
      triggerToast(
        language === "vi"
          ? "Học sinh không có quyền tạo lớp học!"
          : "Students are not authorized to create classrooms!",
        "error"
      );
      return;
    }

    const newClass: Classroom = {
      id: "class_" + Date.now(),
      name,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      teacherId: currentUser.id,
      teacherName: currentUser.fullName,
      studentIds: [],
      topics: [],
    };
    setClassrooms((prev) => [...prev, newClass]);
    triggerToast(
      language === "vi"
        ? `Lớp học "${name}" được tạo thành công! Mã lớp: ${newClass.code}`
        : `Classroom "${name}" has been created! Code: ${newClass.code}`,
      "success"
    );
  };

  const handleJoinClassroom = (code: string) => {
    if (!currentUser) return;

    if (currentUser.role === "teacher") {
      triggerToast(
        language === "vi"
          ? "Tài khoản Giáo viên không thể tham gia lớp học của giáo viên khác!"
          : "Teacher accounts cannot join other teacher's classrooms!",
        "error"
      );
      return;
    }

    const targetClass = classrooms.find((c) => c.code.toUpperCase() === code.toUpperCase());

    if (!targetClass) {
      triggerToast(
        language === "vi" ? "Không tìm thấy lớp học với mã này!" : "Classroom code not found!",
        "error"
      );
      return;
    }

    if (targetClass.studentIds.includes(currentUser.id)) {
      triggerToast(
        language === "vi" ? "Bạn đã tham gia lớp học này rồi!" : "You are already in this classroom!",
        "role_alert"
      );
      return;
    }

    setClassrooms((prev) =>
      prev.map((cls) => {
        if (cls.id === targetClass.id) {
          return {
            ...cls,
            studentIds: [...cls.studentIds, currentUser.id],
          };
        }
        return cls;
      })
    );
    triggerToast(
      language === "vi" ? "Tham gia lớp học thành công!" : "Classroom joined successfully!",
      "success"
    );
  };

  const handleDeleteClassroom = (classId: string) => {
    setClassrooms((prev) => prev.filter((c) => c.id !== classId));
    setSubmissions((prev) => prev.filter((s) => s.classId !== classId));

    fetch("/api/sync-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientUsers: usersRef.current,
        clientClassrooms: classroomsRef.current.filter((c) => c.id !== classId),
        clientSubmissions: submissionsRef.current.filter((s) => s.classId !== classId),
        deletedClassroomId: classId,
      }),
    })
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (JSON.stringify(data.classrooms) !== JSON.stringify(classroomsRef.current)) {
            setClassrooms(data.classrooms);
          }
          if (JSON.stringify(data.submissions) !== JSON.stringify(submissionsRef.current)) {
            setSubmissions(data.submissions);
          }
        }
      }
    })
    .catch((err) => console.error("Failed to sync classroom deletion:", err));

    triggerToast(
      language === "vi" ? "Đã xoá hoàn toàn lớp học!" : "Successfully deleted classroom!",
      "success"
    );
  };

  const handleRequestLeaveClassroom = (classId: string) => {
    if (!currentUser) return;
    const target = classrooms.find((c) => c.id === classId);
    if (!target) return;

    const blockUntil = target.deniedLeaves?.[currentUser.id] || 0;
    if (Date.now() < blockUntil) {
      const hoursLeft = Math.ceil((blockUntil - Date.now()) / (1000 * 60 * 60));
      triggerToast(
        language === "vi" 
          ? `Đơn bị từ chối trước đó. Cần chờ thêm ${hoursLeft} giờ để xin lại!` 
          : `Previous request denied. Wait ${hoursLeft} hours to reapply!`,
        "error"
      );
      return;
    }

    if (target.leaveRequests?.some(r => r.studentId === currentUser.id)) {
      triggerToast(
        language === "vi" ? "Đã gửi đơn, vui lòng chờ duyệt!" : "Already requested, wait approval!",
        "info"
      );
      return;
    }

    const updated = classrooms.map((cls) => {
      if (cls.id === classId) {
        const reqs = cls.leaveRequests || [];
        return {
          ...cls,
          updatedAt: Date.now(),
          leaveRequests: [...reqs, { studentId: currentUser.id, studentName: currentUser.fullName, requestedAt: Date.now() }]
        };
      }
      return cls;
    });

    setClassrooms(updated);
    triggerToast(
      language === "vi" ? "Đã gửi yêu cầu rời lớp!" : "Requested leave successfully!",
      "success"
    );
  };

  const handleApproveLeave = (classId: string, studentId: string) => {
    const updated = classrooms.map((cls) => {
      if (cls.id === classId) {
        const reqs = (cls.leaveRequests || []).filter(r => r.studentId !== studentId);
        const studs = (cls.studentIds || []).filter(id => id !== studentId);
        return {
          ...cls,
          updatedAt: Date.now(),
          studentIds: studs,
          leaveRequests: reqs
        };
      }
      return cls;
    });

    setClassrooms(updated);
    triggerToast(
      language === "vi" ? "Đã phê duyệt rời lớp!" : "Approved leave!",
      "success"
    );
  };

  const handleDenyLeave = (classId: string, studentId: string) => {
    const updated = classrooms.map((cls) => {
      if (cls.id === classId) {
        const reqs = (cls.leaveRequests || []).filter(r => r.studentId !== studentId);
        const denied = { ...(cls.deniedLeaves || {}) };
        denied[studentId] = Date.now() + 24 * 60 * 60 * 1000;
        return {
          ...cls,
          updatedAt: Date.now(),
          leaveRequests: reqs,
          deniedLeaves: denied
        };
      }
      return cls;
    });

    setClassrooms(updated);
    triggerToast(
      language === "vi" ? "Đã bác bỏ đơn xin rời!" : "Denied leave request!",
      "info"
    );
  };

  const handleKickStudent = (classId: string, studentId: string) => {
    const updated = classrooms.map((cls) => {
      if (cls.id === classId) {
        const studs = (cls.studentIds || []).filter(id => id !== studentId);
        const reqs = (cls.leaveRequests || []).filter(r => r.studentId !== studentId);
        return {
          ...cls,
          updatedAt: Date.now(),
          studentIds: studs,
          leaveRequests: reqs
        };
      }
      return cls;
    });

    setClassrooms(updated);
    triggerToast(
      language === "vi" ? "Đã trục xuất học sinh!" : "Kicked student!",
      "success"
    );
  };

  const handleCreateTopic = (classId: string, name: string, description: string) => {
    const newTopic: Topic = {
      id: "topic_" + Date.now(),
      name,
      description,
      questions: [],
      createdAt: new Date().toISOString(),
    };

    setClassrooms((prev) =>
      prev.map((cls) => {
        if (cls.id === classId) {
          return {
            ...cls,
            topics: [...cls.topics, newTopic],
          };
        }
        return cls;
      })
    );
    triggerToast(
      language === "vi" ? `Đã tạo chủ đề: ${name}` : `Topic created: ${name}`,
      "success"
    );
  };

  const handleAddQuestion = (classId: string, topicId: string, question: Question) => {
    if (topicId === "topic_trial_english") {
      triggerToast(
        language === "vi"
          ? "Đây là chủ đề học liệu mẫu của hệ thống. Bạn không thể thêm câu hỏi mới trực tiếp vào đây!"
          : "This is a system sample study topic. You cannot add new questions directly here!",
        "error"
      );
      return;
    }

    setClassrooms((prev) =>
      prev.map((cls) => {
        if (cls.id === classId) {
          const updatedTopics = cls.topics.map((t) => {
            if (t.id === topicId) {
              return {
                ...t,
                questions: [...t.questions, question],
              };
            }
            return t;
          });
          return {
            ...cls,
            topics: updatedTopics,
          };
        }
        return cls;
      })
    );
  };

  const handleSubmitTopicAnswers = (newSubmissionData: Omit<TopicSubmission, "id" | "submittedAt">) => {
    const newSubmission: TopicSubmission = {
      ...newSubmissionData,
      id: "submission_" + Date.now(),
      submittedAt: new Date().toISOString(),
    };

    setSubmissions((prev) => [...prev, newSubmission]);

    // Give immediate XP rewards for auto-graded correctly answered items
    let autoEarnedXp = 0;
    newSubmission.answers.forEach((ans) => {
      if (ans.isCorrect === true) {
        autoEarnedXp += 20;
      }
    });

    if (autoEarnedXp > 0) {
      handleEarnXp(autoEarnedXp);
    }
    
    // Maintain streak record
    handleRecordUserAction();
  };

  const handleSaveDailyQuizSubmission = (answers: AnswerSubmission[], xpEarned = 0) => {
    if (!currentUser) return;
    const newSubmission: TopicSubmission = {
      id: "daily_submission_" + Date.now(),
      topicId: "daily_quiz_" + Date.now(),
      topicName: language === "vi" ? "Thử thách Luyện tập hàng ngày" : "Daily Challenge Quiz",
      classId: "class_daily_quiz",
      className: language === "vi" ? "Luyện tập hàng ngày (AI)" : "Daily Challenge (AI)",
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      answers,
      submittedAt: new Date().toISOString(),
      isFullyGraded: true,
    };
    setSubmissions((prev) => [...prev, newSubmission]);

    // Track completed quiz questions solved count under daily limits
    const todayStr = new Date().toISOString().split("T")[0];

    const prevDate = currentUser.lastQuizSolvedDate || "";
    let currentSolvedCount = currentUser.quizSolvedCountToday || 0;

    // Reset daily solved questions to 0 if we crossed midnight boundary
    if (prevDate && prevDate !== todayStr) {
      currentSolvedCount = 0;
    }

    const nextSolvedCount = currentSolvedCount + answers.length;
    let newCooldownTime = currentUser.quizCooldownUntil;

    // Check if total solved reaches 12 questions to trigger 12-hour cooldown
    if (nextSolvedCount >= 12 && currentUser.role !== "dev") {
      const durationMs = currentUser.devCustomCooldownMs !== undefined
        ? currentUser.devCustomCooldownMs
        : 12 * 60 * 60 * 1000; // default 12 hours
      newCooldownTime = new Date(Date.now() + durationMs).toISOString();

      triggerToast(
        language === "vi"
          ? `Bạn đã hoàn thành đủ ${nextSolvedCount}/12 câu hôm nay! Kích hoạt đếm ngược cooldown 12h.`
          : `You completed all ${nextSolvedCount}/12 questions today! 12h Cooldown activated.`,
        "info"
      );
    }

    // Add XP atomic logic
    let nextXp = currentUser.xp + xpEarned;
    let nextLevel = currentUser.level || 1;
    while (nextXp >= 100) {
      nextXp -= 100;
      nextLevel += 1;
    }

    const updatedUser = {
      ...currentUser,
      xp: nextXp,
      level: nextLevel,
      quizSolvedCountToday: nextSolvedCount,
      quizCooldownUntil: currentUser.role === "dev" ? undefined : newCooldownTime,
      lastQuizSolvedDate: todayStr,
      updatedAt: Date.now(),
    };

    setCurrentUser(updatedUser);
    const updatedList = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedList);
    triggerImmediateSync(updatedList);

    // Maintain streak record
    handleRecordUserAction();
  };

  const handleGradeAnswer = (submissionId: string, questionId: string, isCorrect: boolean) => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id === submissionId) {
          const updatedAnswers = sub.answers.map((ans) => {
            if (ans.questionId === questionId) {
              return {
                ...ans,
                isCorrect,
                score: isCorrect ? 20 : 0,
                gradedByTeacher: true,
              };
            }
            return ans;
          });

          // Check if now fully evaluated
          const remainsUngraded = updatedAnswers.some((ans) => ans.isCorrect === undefined);

          // If standard correct answer awarded, add XP to the student who submitted it!
          if (isCorrect) {
            // Find student and reward
            setUsers((prevUsers) =>
              prevUsers.map((u) => {
                if (u.id === sub.studentId) {
                  const newXp = u.xp + 20;
                  const newLevel = Math.floor(newXp / 100) + 1;
                  return {
                    ...u,
                    xp: newXp,
                    level: newLevel,
                  };
                }
                return u;
              })
            );

            // If current user is that student, update interactive state too
            if (currentUser && currentUser.id === sub.studentId) {
              setCurrentUser((c) => {
                if (!c) return null;
                const newXp = c.xp + 20;
                const newLvl = Math.floor(newXp / 100) + 1;
                return { ...c, xp: newXp, level: newLvl };
              });
            }
          }

          return {
            ...sub,
            answers: updatedAnswers,
            isFullyGraded: !remainsUngraded,
          };
        }
        return sub;
      })
    );
  };

  // Language & Theme update setting callbacks
  const handleUpdateSettings = (lang: AppLanguage, appTheme: AppTheme) => {
    setLanguage(lang);
    setTheme(appTheme);
    localStorage.setItem("eduweb_lang", lang);
    localStorage.setItem("eduweb_theme", appTheme);
  };

  const handleUpdateDevXpLevel = (level: number, xp: number) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      level,
      xp,
      updatedAt: Date.now(),
    };
    setCurrentUser(updatedUser);
    const updatedList = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
    setUsers(updatedList);
    triggerImmediateSync(updatedList);
  };

  const handleUpdateProfile = (newEmail: string, newUsername: string, newPassword?: string) => {
    if (!currentUser) return false;

    // Check username duplication
    const usernameTaken = users.find(u => u.username.toLowerCase() === newUsername.toLowerCase() && u.id !== currentUser.id);
    if (usernameTaken) {
      triggerToast(
        language === "vi" ? "Tên đăng nhập này đã có người sử dụng!" : "This username is already taken!",
        "error"
      );
      return false;
    }

    // Check email duplication
    const emailTaken = users.find(u => u.email && u.email.toLowerCase() === newEmail.toLowerCase() && u.id !== currentUser.id);
    if (emailTaken) {
      triggerToast(
        language === "vi" ? "Email này đã được đăng ký cho tài khoản khác!" : "This email is already registered by another account!",
        "error"
      );
      return false;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        const isDev = u.id === "dev_user_01" || u.username === "kietxx_173";
        return {
          ...u,
          username: newUsername,
          fullName: isDev ? "kietxx_173" : u.fullName,
          email: newEmail,
          password: newPassword || u.password
        };
      }
      return u;
    }));

    setCurrentUser(prev => {
      if (!prev) return null;
      const isDev = prev.id === "dev_user_01" || prev.username === "kietxx_173";
      return {
        ...prev,
        username: newUsername,
        fullName: isDev ? "kietxx_173" : prev.fullName,
        email: newEmail,
        password: newPassword || prev.password
      };
    });

    triggerToast(
      language === "vi" ? "Đã lưu thông tin cài đặt thành công!" : "Successfully saved profile credential configurations!",
      "success"
    );
    return true;
  };

  const handleDeleteAccount = (passwordConfirm: string) => {
    if (!currentUser) return false;

    // Check password
    if (currentUser.password !== passwordConfirm) {
      triggerToast(
        language === "vi" ? "Mật khẩu xác nhận không chính xác!" : "Confirm password does not match!",
        "error"
      );
      return false;
    }

    const userIdToDelete = currentUser.id;
    const updatedUsers = users.filter(u => u.id !== userIdToDelete);

    // Update state and exit session
    setUsers(updatedUsers);
    setCurrentUser(null);
    setShowIntroduction(true);
    setActiveTab("home");

    // Sync deletion completely with backend server database
    fetch("/api/sync-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientUsers: updatedUsers,
        clientClassrooms: classroomsRef.current,
        clientSubmissions: submissionsRef.current,
        deletedUserId: userIdToDelete,
      }),
    })
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUsers(data.users);
        }
      }
    })
    .catch((err) => console.error("Failed to sync account deletion:", err));

    triggerToast(
      language === "vi" 
        ? "Tài khoản của bạn đã được xóa vĩnh viễn khỏi hệ thống!" 
        : "Your account has been permanently deleted from the system database!",
      "success"
    );
    return true;
  };

  const handleDeleteUserByAdmin = (userId: string) => {
    const userToDelete = users.find((usr) => usr.id === userId);
    if (!userToDelete) return;
    
    // Prevent deleting supreme admin
    if (userToDelete.username === "kietxx_173" || userToDelete.id === "dev_user_01") {
      triggerToast(
        language === "vi" ? "Không được phép xóa tài khoản quản trị viên tối cao!" : "Supreme Admin account deletion not permitted!",
        "error"
      );
      return;
    }

    const updatedList = users.filter((usr) => usr.id !== userId);
    setUsers(updatedList);
    triggerImmediateSync(updatedList, userId);
    triggerToast(
      language === "vi" ? `Đã xoá vĩnh viễn tài khoản: ${userToDelete.username || userToDelete.fullName}` : `Permanently deleted account: ${userToDelete.username || userToDelete.fullName}`,
      "success"
    );
  };

  const handleUpdateUserStatus = (
    userId: string,
    status: {
      banned?: boolean;
      warnedUntil?: string | null;
      warningType?: "remind" | "3days" | "7days" | "30days" | null;
    }
  ) => {
    const updatedList = users.map((u) => {
      if (u.id === userId) {
        const updated = { ...u, updatedAt: Date.now() };
        if (status.banned !== undefined) updated.banned = status.banned;
        if (status.warnedUntil !== undefined) {
          updated.warnedUntil = status.warnedUntil;
        }
        if (status.warningType !== undefined) {
          updated.warningType = status.warningType;
        }
        return updated;
      }
      return u;
    });

    setUsers(updatedList);
    triggerImmediateSync(updatedList);

    // Also update currentUser session if matches
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, updatedAt: Date.now() };
        if (status.banned !== undefined) updated.banned = status.banned;
        if (status.warnedUntil !== undefined) {
          updated.warnedUntil = status.warnedUntil;
        }
        if (status.warningType !== undefined) {
          updated.warningType = status.warningType;
        }
        return updated;
      });
    }

    triggerToast(
      language === "vi" ? "Cập nhật trạng thái thành viên thành công!" : "Successfully updated member administration status!",
      "success"
    );
  };

  // Keyboard command shortcut handler for developers or administrators
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentUser?.role === "dev" || currentUser?.role === "admin") {
        if (e.ctrlKey && (e.key === "/" || e.code === "Slash")) {
          e.preventDefault();
          setOpenCommandBoard((prev) => !prev);
        } else if (e.key === "Escape") {
          setOpenCommandBoard(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentUser]);

  // Convert Leaderboard user status mapping lists
  const globalLeaderboardUsers = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    level: u.level,
    xp: u.xp,
    role: u.role,
    banned: u.banned,
    warnedUntil: u.warnedUntil,
    warningType: u.warningType,
    grade: u.grade,
    streakCount: u.streakCount,
  }));

  const handleLogout = () => {
    setCurrentUser(null);
    setShowIntroduction(true);
    setShowLanding(true);
  };

  // Custom calculation level bar
  const currentLvl = currentUser ? currentUser.level : 1;
  const currentXp = currentUser ? currentUser.xp : 0;
  const xpInCurrentLevel = currentXp % 100;

  return (
    <div className="min-h-screen bg-[#f3f6fa] dark:bg-[#060b13] text-neutral-800 dark:text-neutral-100 transition-colors duration-200 font-sans flex flex-col md:flex-row">
      
      {/* Beautiful High-Fidelity Entrance Page modeled on the requested screenshot */}
      {showIntroduction && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f3f6fa] dark:bg-[#060b13] transition-colors duration-200 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
          {showLanding ? (
            <div className="max-w-2xl w-full flex flex-col items-center py-6 text-center space-y-8 animate-fadeIn">
              {/* App Large Logo Block */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-[24px] flex items-center justify-center shadow-lg shadow-blue-500/20 mb-5 relative overflow-hidden">
                  <svg viewBox="0 0 512 512" className="w-12 h-12 text-white animate-pulse" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round">
                    {/* Left open page with beautiful rounded outer corners */}
                    <path d="M 72 112 H 208 C 236 112 248 128 256 160 V 384 C 248 352 236 344 208 344 H 72 C 54 344 48 334 48 316 V 140 C 48 122 54 112 72 112 Z" />
                    {/* Right open page with beautiful rounded outer corners */}
                    <path d="M 440 112 H 304 C 276 112 264 128 256 160 V 384 C 264 352 276 344 304 344 H 440 C 458 344 464 334 464 316 V 140 C 464 122 458 112 440 112 Z" />
                    {/* Center Spine Line */}
                    <path d="M 256 160 V 384" strokeWidth="24" />
                  </svg>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-[#0f172a] dark:text-white tracking-tight leading-none mb-3">
                  EduWeb
                </h1>
                <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 max-w-lg leading-snug">
                  {t.introSubtitle}
                </p>
              </div>

              {/* Description & Features Bento Grid */}
              <div className="bg-white dark:bg-[#111927] rounded-3xl p-6 sm:p-8 border border-slate-100/80 dark:border-[#1d293e] shadow-xl dark:shadow-none text-left space-y-6">
                <p className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed font-semibold">
                  {t.introDesc}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-slate-50 dark:bg-[#172237] rounded-2xl border border-slate-100 dark:border-[#22314d] space-y-2">
                    <span className="text-2xl">🏆</span>
                    <h4 className="text-xs font-black text-[#0f172a] dark:text-slate-200 uppercase tracking-wider">{language === "vi" ? "Cấp độ & XP" : "Level & XP"}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-350 leading-relaxed font-semibold">{language === "vi" ? "Tích lũy XP thông qua các bài học câu hỏi để nâng cấp bậc vinh dự của bạn." : "Earn gamified XP through questions, level up and trace your ranking."}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-[#172237] rounded-2xl border border-slate-100 dark:border-[#22314d] space-y-2">
                    <span className="text-2xl">🤖</span>
                    <h4 className="text-xs font-black text-[#0f172a] dark:text-slate-200 uppercase tracking-wider">{language === "vi" ? "Đề bài AI" : "AI Challenges"}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-350 leading-relaxed font-semibold">{language === "vi" ? "Thử thách khoa học tự nhiên hằng ngày được khởi động tức thời từ AI Gemini." : "A daily scientific exercise set automatically structured by AI Gemini Flash."}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-[#172237] rounded-2xl border border-slate-100 dark:border-[#22314d] space-y-2">
                    <span className="text-2xl">📝</span>
                    <h4 className="text-xs font-black text-[#0f172a] dark:text-slate-200 uppercase tracking-wider">{language === "vi" ? "Giao bài mẫu" : "Exam Formats"}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-350 leading-relaxed font-semibold">{language === "vi" ? "Thực hành linh hoạt với trắc nghiệm ABCD, tự luận chấm tay và điền từ." : "Engage with custom ABCD quizzes, written short essays, and fill-blanks."}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowLanding(false)}
                    className="px-8 py-4 bg-[#3b82f6] hover:bg-blue-600 active:bg-blue-700 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.03] duration-150 cursor-pointer flex items-center gap-2 group"
                  >
                    <span>{t.getStarted}</span>
                    <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Bottom Language & Theme Toggles */}
              <div className="flex items-center justify-between w-full max-w-xs mt-4 text-xs text-slate-505 dark:text-neutral-400 font-bold select-none">
                <button
                  type="button"
                  onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                  className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-white transition cursor-pointer bg-white dark:bg-[#111927] p-2.5 rounded-xl border border-slate-100 dark:border-[#1d293e]"
                >
                  {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
                  <span>{theme === "dark" ? t.lightTheme : t.darkTheme}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage((prev) => (prev === "vi" ? "en" : "vi"))}
                  className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-white transition cursor-pointer bg-white dark:bg-[#111927] p-2.5 rounded-xl border border-slate-100 dark:border-[#1d293e]"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{language === "vi" ? "🇺🇸 English" : "🇻🇳 Tiếng Việt"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-md w-full flex flex-col items-center py-6">
              
              {/* App Header Block */}
              <div className="flex flex-col items-center text-center mb-7 relative w-full">
                <button
                  type="button"
                  onClick={() => {
                    setShowLanding(true);
                    setValidationError("");
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-black text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  &larr; {language === "vi" ? "Quay lại" : "Back"}
                </button>
                <div className="w-14 h-14 bg-[#3b82f6] rounded-[18px] flex items-center justify-center shadow-md mb-3 mx-auto">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-black text-[#0f172a] dark:text-white tracking-tight mb-1">
                  EduWeb
                </h1>
                <p className="text-xs font-bold text-slate-500 dark:text-neutral-400">
                  {language === "vi" ? "Phòng Đăng Nhập & Thành Viên" : "Member Enrollment Portal"}
                </p>
              </div>

              {/* Main Interactive Card Container */}
              <div className="bg-white dark:bg-[#111927] w-full rounded-3xl p-7 sm:p-8 border border-slate-100/80 dark:border-[#1d293e] shadow-xl dark:shadow-none relative space-y-6">
                
                {/* Segmented Tab Bar exactly matching the requested photo */}
                <div className="bg-[#f0f4f9] dark:bg-[#1a2333] p-1 rounded-2xl flex w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("login");
                      setValidationError("");
                      setShowVerificationStep(false);
                      setPendingTeacherUser(null);
                      setUserSubmittedCode("");
                    }}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold text-center rounded-xl transition-all duration-150 ${
                      authTab === "login"
                        ? "bg-white dark:bg-[#253248] text-[#1e293b] dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-neutral-400 hover:text-[#1e293b] dark:hover:text-white"
                    }`}
                  >
                    {language === "vi" ? "Đăng Nhập" : "Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("register");
                      setValidationError("");
                      setShowVerificationStep(false);
                      setPendingTeacherUser(null);
                      setUserSubmittedCode("");
                    }}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold text-center rounded-xl transition-all duration-150 ${
                      authTab === "register"
                        ? "bg-white dark:bg-[#253248] text-[#1e293b] dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-neutral-400 hover:text-[#1e293b] dark:hover:text-white"
                    }`}
                  >
                    {language === "vi" ? "Đăng Ký" : "Register"}
                  </button>
                </div>

                {/* Validation Warning Notice */}
                {validationError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-750 dark:text-red-300 text-xs rounded-xl font-bold border border-red-100 dark:border-red-900/45 leading-snug animate-pulse">
                    ⚠️ {validationError}
                  </div>
                )}

                {/* AUTH TAB: SIGN IN */}
                {authTab === "login" && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-extrabold text-[#111827] dark:text-slate-200 mb-2">
                        {language === "vi" ? "Email hoặc Tên đăng nhập" : "Email or Username"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={language === "vi" ? "hocsinh@eduweb.com hoặc user123" : "student@eduweb.com or user123"}
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        className="w-full py-3.5 px-4 bg-[#eef2fc] dark:bg-[#1a2333] border border-[#eef2fc] dark:border-[#1d293e] rounded-xl text-slate-900 dark:text-white placeholder-slate-400/80 dark:placeholder-[#5a6b82] font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#3b82f6] focus:bg-white dark:focus:bg-[#141b27] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#111827] dark:text-slate-200 mb-2">
                        {language === "vi" ? "Mật khẩu" : "Password"}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full py-3.5 px-4 bg-[#eef2fc] dark:bg-[#1a2333] border border-[#eef2fc] dark:border-[#1d293e] rounded-xl text-slate-900 dark:text-white placeholder-slate-400/80 dark:placeholder-[#5a6b82] font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#3b82f6] focus:bg-white dark:focus:bg-[#141b27] transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#3b82f6] hover:bg-blue-600 active:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 hover:scale-[1.01] cursor-pointer"
                    >
                      {language === "vi" ? "Đăng Nhập" : "Sign In"}
                    </button>
                  </form>
                )}

                {/* AUTH TAB: REGISTER */}
                {authTab === "register" && (
                  showVerificationStep ? (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="p-4 bg-blue-50 dark:bg-blue-955/20 text-blue-800 dark:text-blue-300 rounded-xl leading-snug text-xs font-semibold border border-blue-105 dark:border-blue-900/40 space-y-2">
                        <div>
                          🔑 <strong>{language === "vi" ? "MÀN HÌNH GIẢ LẬP Hòm Thư & SMTP OTP" : "TEACHER OTP VERIFICATION (SANDBOX)"}</strong><br />
                          {language === "vi"
                            ? `Trong môi trường xem trước (Sandbox) của hệ thống, mã OTP được tự động đón bắt và hiển thị trực tiếp để bạn kích hoạt tài khoản ngay tức thì:`
                            : `In this sandbox preview environment, the OTP is intercepted and presented here to allow immediate setup without an external SMTP mail server config:`}
                        </div>
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-850/40 rounded-lg text-center flex flex-col items-center justify-center gap-1.5">
                          <span className="text-[9px] uppercase font-black tracking-widest text-[#4f46e5] dark:text-[#a5b4fc] font-mono">
                            {language === "vi" ? "⚡ MÃ OTP XÁC MINH NHẬN ĐƯỢC" : "⚡ INTERCEPTED SMTP CODE"}
                          </span>
                          <span className="text-2xl font-black font-mono tracking-widest text-indigo-700 dark:text-indigo-300 animate-pulse">
                            {verificationCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setUserSubmittedCode(verificationCode);
                              triggerToast(
                                language === "vi" ? "Đã điền tự động mã OTP!" : "OTP Autofilled!",
                                "success"
                              );
                            }}
                            className="mt-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-[10px] font-bold text-white transition active:scale-95 cursor-pointer select-none"
                          >
                            {language === "vi" ? "Nhập tự động mã OTP này" : "Auto-fill this OTP"}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#111827] dark:text-slate-200 mb-2">
                          {language === "vi" ? "Nhập Mã OTP" : "Enter Verification OTP"}
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          placeholder="e.g. 582190"
                          value={userSubmittedCode}
                          onChange={(e) => setUserSubmittedCode(e.target.value.trim())}
                          className="w-full text-center py-3.5 px-4 bg-[#eef2fc] dark:bg-[#1a2333] border border-[#eef2fc] dark:border-[#1d293e] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-mono font-black text-lg tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowVerificationStep(false);
                            setPendingTeacherUser(null);
                            setUserSubmittedCode("");
                            setValidationError("");
                          }}
                          className="flex-1 py-3 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-extrabold rounded-xl text-xs transition cursor-pointer"
                        >
                          {language === "vi" ? "Hủy bỏ" : "Cancel"}
                        </button>
                        <button
                          type="button"
                          onClick={handleVerifyOtpSubmit}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-md"
                        >
                          {language === "vi" ? "Xác nhận & Kích hoạt" : "Confirm & Activate"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-extrabold text-[#111827] dark:text-slate-200 mb-2">
                          Gmail / Email
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="email_vi_du@eduweb.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="w-full py-3.5 px-4 bg-[#eef2fc] dark:bg-[#1a2333] border border-[#eef2fc] dark:border-[#1d293e] rounded-xl text-slate-900 dark:text-white placeholder-slate-400/80 dark:placeholder-[#5a6b82] font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#3b82f6] focus:bg-white dark:focus:bg-[#141b27] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#111827] dark:text-slate-200 mb-2">
                          {language === "vi" ? "Tên đăng nhập" : "Username"}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="user123"
                          value={authUsername}
                          onChange={(e) => setAuthUsername(e.target.value)}
                          className="w-full py-3.5 px-4 bg-[#eef2fc] dark:bg-[#1a2333] border border-[#eef2fc] dark:border-[#1d293e] rounded-xl text-slate-900 dark:text-white placeholder-slate-400/80 dark:placeholder-[#5a6b82] font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#3b82f6] focus:bg-white dark:focus:bg-[#141b27] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#111827] dark:text-slate-200 mb-2">
                          {language === "vi" ? "Họ và Tên" : "Full Name"}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={language === "vi" ? "Ví dụ: Nguyễn Văn A" : "e.g. John Doe"}
                          value={authFullName}
                          onChange={(e) => setAuthFullName(e.target.value)}
                          className="w-full py-3.5 px-4 bg-[#eef2fc] dark:bg-[#1a2333] border border-[#eef2fc] dark:border-[#1d293e] rounded-xl text-slate-900 dark:text-white placeholder-slate-400/80 dark:placeholder-[#5a6b82] font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#3b82f6] focus:bg-white dark:focus:bg-[#141b27] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#111827] dark:text-slate-200 mb-2">
                          {language === "vi" ? "Mật khẩu" : "Password"}
                        </label>
                        <p className="text-[10px] text-slate-450 dark:text-neutral-500 mb-1.5 leading-tight">
                          {language === "vi" 
                            ? "Mật khẩu tối thiểu 6 ký tự (Ví dụ: matkhau123)" 
                            : "At least 6 characters (e.g., matkhau123)"}
                        </p>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full py-3.5 px-4 bg-[#eef2fc] dark:bg-[#1a2333] border border-[#eef2fc] dark:border-[#1d293e] rounded-xl text-slate-900 dark:text-white placeholder-slate-400/80 dark:placeholder-[#5a6b82] font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#3b82f6] focus:bg-white dark:focus:bg-[#141b27] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#111827] dark:text-slate-200 mb-2">
                          {language === "vi" ? "Vai trò người dùng" : "Role"}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAuthRole("student")}
                            className={`py-3.5 rounded-xl border text-xs font-bold transition-all ${
                              authRole === "student"
                                ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "border-slate-100 dark:border-[#1d293e] text-slate-500 dark:text-neutral-400"
                            }`}
                          >
                            🧑‍🎓 {language === "vi" ? "Học Sinh" : "Student"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAuthRole("teacher")}
                            className={`py-3.5 rounded-xl border text-xs font-bold transition-all ${
                              authRole === "teacher"
                                ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "border-slate-100 dark:border-[#1d293e] text-slate-500 dark:text-neutral-400"
                            }`}
                          >
                            👩‍🏫 {language === "vi" ? "Giáo Viên" : "Teacher"}
                          </button>
                        </div>
                      </div>

                      {authRole === "student" && (
                        <div className="animate-scaleUp">
                          <label className="block text-xs font-extrabold text-[#111827] dark:text-slate-200 mb-2">
                            {language === "vi" ? "Học sinh Lớp mấy?" : "Which grade are you in?"}
                          </label>
                          <select
                            value={authGrade}
                            onChange={(e) => setAuthGrade(e.target.value)}
                            className="w-full py-3.5 px-4 bg-[#eef2fc] dark:bg-[#1a2333] border border-[#eef2fc] dark:border-[#1d293e] rounded-xl text-slate-900 dark:text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#3b82f6] cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                              <option key={num} value={num.toString()} className="text-black dark:text-white">
                                {language === "vi" ? `Lớp ${num}` : `Grade ${num}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-[#3b82f6] hover:bg-blue-600 active:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 hover:scale-[1.01] cursor-pointer"
                      >
                        {language === "vi" ? "Tạo Tài Khoản" : "Register"}
                      </button>
                    </form>
                  )
                )}



              </div>

              {/* Bottom System-defined Toggles (Theme/Language switcher) */}
              <div className="flex items-center justify-between w-full mt-6 px-4 text-xs text-slate-500 dark:text-neutral-400 font-bold select-none">
                <button
                  type="button"
                  onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                  className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-white transition cursor-pointer bg-white dark:bg-[#111927] p-2 rounded-xl border border-slate-100 dark:border-[#1d293e]"
                >
                  {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
                  <span>{theme === "dark" ? t.lightTheme : t.darkTheme}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage((prev) => (prev === "vi" ? "en" : "vi"))}
                  className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-white transition cursor-pointer bg-white dark:bg-[#111927] p-2 rounded-xl border border-slate-100 dark:border-[#1d293e]"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{language === "vi" ? "🇺🇸 English" : "🇻🇳 Tiếng Việt"}</span>
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Primary Workspace screen after Auth bypass / success */}
      {/* Sidebar navigation system modeled exactly on user's image request */}
      <aside className="w-full md:w-64 bg-white dark:bg-[#0a1120] text-[#1e293b] dark:text-slate-100 border-r border-slate-200 dark:border-neutral-800 flex flex-col shrink-0">
        {/* Banner with book and app title */}
        <div className="p-5 border-b border-slate-200 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg font-bold shrink-0 relative overflow-hidden">
            <svg viewBox="0 0 512 512" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round">
              {/* Left open page with beautiful rounded outer corners */}
              <path d="M 72 112 H 208 C 236 112 248 128 256 160 V 384 C 248 352 236 344 208 344 H 72 C 54 344 48 334 48 316 V 140 C 48 122 54 112 72 112 Z" />
              {/* Right open page with beautiful rounded outer corners */}
              <path d="M 440 112 H 304 C 276 112 264 128 256 160 V 384 C 264 352 276 344 304 344 H 440 C 458 344 464 334 464 316 V 140 C 464 122 458 112 440 112 Z" />
              {/* Center Spine Line */}
              <path d="M 256 160 V 384" strokeWidth="24" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center text-slate-950 dark:text-white">
              {t.appName}
            </h2>
            <span className="text-[10px] text-slate-500 dark:text-neutral-500 uppercase font-mono tracking-widest">v1.2 Smart AI</span>
          </div>
        </div>

        {/* Profile Container showing Dev Admin or customized user status widgets */}
        {currentUser && (
          <div
            onClick={() => setActiveTab("settings")}
            className="p-5 border-b border-slate-200 dark:border-neutral-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-900/40 cursor-pointer transition select-none group"
            title={language === "vi" ? "Bấm để vào Cài đặt" : "Click to view Settings"}
            id="profile-panel-container"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/60 ring-2 ring-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center text-sm font-bold capitalize shrink-0 group-hover:ring-blue-500 transition">
                {currentUser.fullName.substring(0, 1).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {currentUser.fullName}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-neutral-500 font-medium capitalize truncate">
                  {currentUser.role === "dev" ? t.dev : currentUser.role === "teacher" ? t.teacher : t.student}
                </p>
              </div>
            </div>

            {/* Level status widget precisely configured to resemble reference picture */}
            <div className="mt-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-200 dark:border-neutral-800/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-bold text-amber-500 dark:text-amber-400">
                  <Award className="w-3.5 h-3.5 fill-current" />
                  {t.level} {currentLvl}
                </span>
                <span className="flex items-center gap-0.5 font-bold text-blue-500 dark:text-blue-400">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  {currentXp} {t.xp}
                </span>
              </div>

              {/* Progress Bar inside sidebar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${xpInCurrentLevel}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-500 dark:text-neutral-500 font-medium text-center">
                {xpInCurrentLevel}/100 XP {t.progressToNextLevel} {currentLvl + 1}
              </p>
            </div>

            {/* Streak status widget */}
            <div className="mt-2 bg-gradient-to-br from-amber-500/5 to-rose-500/5 dark:from-amber-500/10 dark:to-rose-500/10 rounded-xl p-3 border border-amber-500/20 dark:border-amber-500/30 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-extrabold text-rose-500 dark:text-rose-400">
                  <span className="animate-pulse">🔥</span>
                  {t.streakTitle}
                </span>
                <span className="font-mono font-black text-amber-500 text-sm">
                  {currentUser.streakCount || 0} {t.streakDaysSuffix}
                </span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-neutral-400 leading-normal">
                {currentUser.lastActiveDate === getLocalDateString()
                  ? t.streakMaintainedToday
                  : t.streakNotMaintainedToday}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Sidebar Lists */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab("home")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition duration-150 cursor-pointer ${
              activeTab === "home" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/30"
            }`}
          >
            <Home className={`w-4 h-4 shrink-0 transition-all duration-200 ${activeTab === "home" ? "text-white" : ""}`} />
            <span>{t.navHome}</span>
          </button>

          <button
            onClick={() => setActiveTab("classes")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition duration-150 cursor-pointer ${
              activeTab === "classes" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/30"
            }`}
          >
            <BookOpen className={`w-4 h-4 shrink-0 transition-all duration-200 ${activeTab === "classes" ? "text-white fill-white/20" : "text-indigo-500 dark:text-indigo-400 fill-indigo-500/10"}`} />
            <span>{t.navClasses}</span>
          </button>

          <button
            onClick={() => setActiveTab("daily-quiz")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition duration-150 cursor-pointer ${
              activeTab === "daily-quiz" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/30"
            }`}
          >
            <Zap className={`w-4 h-4 shrink-0 transition-all duration-200 ${activeTab === "daily-quiz" ? "text-white fill-white/20 animate-pulse" : "text-amber-500 dark:text-amber-400 fill-amber-500/25"}`} />
            <span>{t.navDailyQuiz}</span>
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition duration-150 cursor-pointer ${
              activeTab === "leaderboard" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/30"
            }`}
          >
            <Award className={`w-4 h-4 shrink-0 transition-all duration-200 ${activeTab === "leaderboard" ? "text-white fill-white/20" : "text-yellow-500 dark:text-yellow-400 fill-yellow-500/15"}`} />
            <span>{t.navLeaderboard}</span>
          </button>

          <button
            onClick={() => setActiveTab("statistics")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition duration-150 cursor-pointer ${
              activeTab === "statistics" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/30"
            }`}
          >
            <BarChart3 className={`w-4 h-4 shrink-0 transition-all duration-200 ${activeTab === "statistics" ? "text-white" : "text-emerald-500 dark:text-emerald-400"}`} />
            <span>{t.navStatistics}</span>
          </button>

          {(currentUser?.role === "teacher" || currentUser?.role === "dev" || currentUser?.role === "student") && (
            <button
              onClick={() => setActiveTab("profile-search")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition duration-150 cursor-pointer ${
                activeTab === "profile-search" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-4 h-4 shrink-0 transition-all duration-200 ${activeTab === "profile-search" ? "text-white fill-white/20" : "text-fuchsia-500 dark:text-fuchsia-400 fill-fuchsia-500/10"}`} />
                <span>{language === "vi" ? "Tra cứu hồ sơ" : "Profile Search"}</span>
              </div>
              {currentUser?.role === "student" && currentLvl < 10 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold px-1.5 py-0.5 rounded font-mono uppercase">
                  Lv.10 🔒
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition duration-150 cursor-pointer ${
              activeTab === "settings" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/30"
            }`}
          >
            <Settings className={`w-4 h-4 shrink-0 transition-all duration-200 ${activeTab === "settings" ? "text-white animate-spin" : "text-orange-500 dark:text-orange-400 hover:rotate-45"}`} style={{ animationDuration: activeTab === "settings" ? "6s" : undefined }} />
            <span>{t.navSettings}</span>
          </button>
        </nav>

        {/* Global language and logout bottom bar */}
        <div className="p-4 border-t border-slate-200 dark:border-neutral-800 space-y-3 bg-[#f8fafc] dark:bg-[#080d1a]">
          {currentUser && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition duration-150 rounded-xl text-xs font-bold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.logout}</span>
            </button>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-500 font-bold px-1">
            <span className="uppercase">{language} Theme ({theme})</span>
            <div className="flex gap-2">
              <button onClick={() => setLanguage("vi")} className={`cursor-pointer ${language === "vi" ? "text-blue-500 dark:text-blue-400" : ""}`}>VI</button>
              <span>|</span>
              <button onClick={() => setLanguage("en")} className={`cursor-pointer ${language === "en" ? "text-blue-500 dark:text-blue-400" : ""}`}>EN</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Primary content Workspace canvas */}
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Responsive mobile header bar */}
        <header className="flex md:hidden items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 shadow-sm mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-black text-neutral-900 dark:text-neutral-100">{t.appName}</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("settings")}
              className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              🌟 Lv.{currentLvl}
            </button>
            {showIntroduction && (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg"
              >
                {t.login}
              </button>
            )}
          </div>
        </header>

        {/* Admonition/Nhắc nhở active banner */}
        {currentUser?.warningType === "remind" && (!currentUser?.warnedUntil || new Date(currentUser.warnedUntil) > new Date()) && (
          <div className="mb-4 mx-4 sm:mx-0 p-4 bg-amber-50 dark:bg-amber-950/25 border-2 border-amber-300 dark:border-amber-900 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-start animate-scaleUp">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">⚠️</span>
              <div>
                <h4 className="font-extrabold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider font-mono">
                  {language === "vi" ? "NHẮC NHỞ QUAN TRỌNG TỪ BAN QUẢN TRỊ" : "IMPORTANT BOARD REMINDER"}
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-medium leading-relaxed font-mono">
                  {language === "vi" 
                    ? "Tài khoản của bạn đã nhận được một nhắc nhở từ Quản trị viên hệ thống. Vui lòng giữ môi trường học tập lành mạnh và ôn tập bài đầy đủ!" 
                    : "Your account was issued an advisory reminder by the moderator. Please align with our study standards and play fair!"
                  }
                  {currentUser?.warnedUntil && (
                    <span className="block mt-1.5 font-bold text-[10px] text-amber-600 dark:text-amber-500">
                      ⏱️ {language === "vi" 
                        ? `Nhắc nhở này sẽ tự động hết hiệu lực sau: ${Math.max(1, Math.ceil((new Date(currentUser.warnedUntil).getTime() - Date.now()) / 60000))} phút nữa.` 
                        : `This reminder will automatically expire in: ${Math.max(1, Math.ceil((new Date(currentUser.warnedUntil).getTime() - Date.now()) / 60000))} minutes.`}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {currentUser?.role === "dev" && (
              <button
                type="button"
                onClick={() => {
                  handleUpdateUserStatus(currentUser.id, {
                    warnedUntil: null,
                    warningType: null,
                  });
                  triggerToast(
                    language === "vi" 
                      ? "Đã gỡ nhắc nhở thành công!" 
                      : "Advisory reminder dismissed successfully!",
                    "success"
                  );
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-[10px] rounded-lg tracking-wider uppercase transition cursor-pointer shrink-0"
              >
                {language === "vi" ? "Gỡ nhắc nhở" : "Dismiss"}
              </button>
            )}
          </div>
        )}

        {/* Tab content Router switch */}
        {activeTab === "home" && (
          <HomeTab currentUser={currentUser} language={language} onNavigate={setActiveTab} />
        )}

        {activeTab === "classes" && (
          <ClassroomsTab
            currentUser={currentUser}
            classrooms={classrooms}
            submissions={submissions}
            language={language}
            onCreateClassroom={handleCreateClassroom}
            onJoinClassroom={handleJoinClassroom}
            onCreateTopic={handleCreateTopic}
            onAddQuestion={handleAddQuestion}
            onSubmitTopicAnswers={handleSubmitTopicAnswers}
            onGradeAnswer={handleGradeAnswer}
            users={users}
            onDeleteClassroom={handleDeleteClassroom}
            onRequestLeaveClassroom={handleRequestLeaveClassroom}
            onApproveLeave={handleApproveLeave}
            onDenyLeave={handleDenyLeave}
            onKickStudent={handleKickStudent}
          />
        )}

        {activeTab === "daily-quiz" && (
          <DailyQuizTab
            currentUser={currentUser}
            language={language}
            onRewardXp={handleEarnXp}
            onSaveQuizSubmission={handleSaveDailyQuizSubmission}
            onUpdateCurrentUser={handleUpdateCurrentUser}
          />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardTab
            currentUser={currentUser}
            users={globalLeaderboardUsers}
            onUpdateUserStatus={handleUpdateUserStatus}
            language={language}
            onDeleteUser={handleDeleteUserByAdmin}
          />
        )}

        {activeTab === "statistics" && (
          <StatisticsTab currentUser={currentUser} submissions={submissions} language={language} />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            currentUser={currentUser}
            language={language}
            theme={theme}
            onUpdateSettings={handleUpdateSettings}
            onUpdateDevXpLevel={handleUpdateDevXpLevel}
            onUpdateProfile={handleUpdateProfile}
            onDeleteAccount={handleDeleteAccount}
            users={users}
          />
        )}

        {activeTab === "profile-search" && (currentUser?.role === "teacher" || currentUser?.role === "dev" || currentUser?.role === "student") && (
          <ProfileSearchTab
            currentUser={currentUser}
            users={users}
            language={language}
            classrooms={classrooms}
          />
        )}
      </main>

      {openCommandBoard && currentUser?.role === "dev" && (
        <div className="fixed inset-0 z-[200000] bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4" id="command-board-overlay">
          <div className="w-full max-w-4xl bg-neutral-900 border-2 border-cyan-500/80 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden animate-scaleUp text-start font-mono text-white max-h-[85vh]">
            
            {/* Modal Title bar */}
            <div className="bg-neutral-950/80 p-4 border-b border-cyan-900/40 flex items-center justify-between text-cyan-400 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-xs font-black tracking-widest uppercase">
                  {language === "vi" ? "📊 TRUNG TÂM QUẢN TRỊ & GIÁM SÁT HỆ THỐNG - EDUWEB" : "📊 EDUWEB SUPER ADMIN CONTROL CENTER & HUD"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpenCommandBoard(false);
                  setCmdInput("");
                  setShowDevRegisterPanel(false);
                }}
                className="text-xs font-bold text-neutral-400 hover:text-cyan-400 transition uppercase cursor-pointer px-2.5 py-1 bg-neutral-900/60 rounded border border-neutral-800"
              >
                {language === "vi" ? "Đóng [Esc]" : "Close [Esc]"}
              </button>
            </div>

            {/* Split layout inside command board */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[350px]">
              
              {/* Left Column: Console logs & Live system telemetry (Memory/CPU) */}
              <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-cyan-900/40 p-5 flex flex-col gap-4 bg-[#0a0f1d] overflow-y-auto shrink-0">
                
                {/* 1. Live Memory & Resource Visualizer */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black tracking-widest text-cyan-400 uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {language === "vi" ? "⚡ GIÁM SÁT TÀI NGUYÊN (LIVE)" : "⚡ LIVE TELEMETRY METRICS"}
                  </h4>

                  {currentUser?.role === "dev" ? (
                    /* Shrunk concise resource line for developer */
                    <div className="p-3 bg-neutral-950/85 rounded-xl border border-neutral-800 text-[10px]">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-cyan-400 font-bold uppercase tracking-wider text-[8px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          SYS MON:
                        </span>
                        <span className="text-neutral-400 font-mono">
                          {devRamUsage}MB / 512MB RAM • CPU {devCpuLoad}% • DB {(JSON.stringify(users).length / 1024).toFixed(1)}KB
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Gorgeous full multi-line graphs/meters for admin role */
                    <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-950/85 rounded-xl border border-neutral-800 text-[11px]">
                      <div className="space-y-1">
                        <p className="text-neutral-500 font-bold uppercase text-[9px]">{language === "vi" ? "BỘ NHỚ RAM (HEAP)" : "RAM HEAP SIZE"}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-cyan-400 font-extrabold text-base">{devRamUsage}</span>
                          <span className="text-neutral-500 text-[10px]">MB / 512MB</span>
                        </div>
                        <div className="w-full bg-neutral-800 h-1.5 rounded overflow-hidden">
                          <div 
                            className="bg-cyan-500 h-full transition-all duration-1000" 
                            style={{ width: `${(devRamUsage / 512) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-neutral-500 font-bold uppercase text-[9px]">{language === "vi" ? "TẢI TIẾN TRÌNH CPU" : "PROCESS CPU LOAD"}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-emerald-400 font-extrabold text-base">{devCpuLoad}</span>
                          <span className="text-neutral-500 text-[10px]">% load</span>
                        </div>
                        <div className="w-full bg-neutral-800 h-1.5 rounded overflow-hidden">
                          <div 
                            className="bg-emerald-400 h-full transition-all duration-1000" 
                            style={{ width: `${devCpuLoad}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1 col-span-2 pt-1 border-t border-neutral-900 flex items-center justify-between">
                        <span className="text-neutral-500 text-[9px] uppercase font-bold">{language === "vi" ? "DUNG LƯỢNG DATABASE" : "DB ENVELOPED SIZE"}:</span>
                        <span className="text-amber-400 text-xs font-bold font-mono">
                          {(JSON.stringify(users).length / 1024).toFixed(2)} KB ({users.length} users)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Instruction Guide or Admin view */}
                {currentUser?.role === "admin" ? (
                  <div className="p-3 bg-red-950/20 rounded-xl border border-red-900/45 space-y-2 text-[11px] text-neutral-350">
                    <p className="text-red-400 font-bold text-center border-b border-red-900/40 pb-1.5 uppercase tracking-wider">
                      ℹ️ {language === "vi" ? "Thông tin Tài khoản" : "Your Account Info"}
                    </p>
                    <div className="space-y-1">
                      <p className="flex justify-between">
                        <span className="text-neutral-500 text-[10px]">{language === "vi" ? "Họ tên:" : "Full Name:"}</span>
                        <span className="font-bold text-white shrink-0">{currentUser?.fullName}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-neutral-500 text-[10px]">{language === "vi" ? "Tên dùng:" : "Username:"}</span>
                        <span className="font-bold text-white shrink-0">@{currentUser?.username}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-neutral-500 text-[10px]">Email:</span>
                        <span className="font-bold text-yellow-305 shrink-0 select-all">{currentUser?.email}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-neutral-500 text-[10px]">{language === "vi" ? "Vai trò:" : "Role:"}</span>
                        <span className="font-bold text-amber-400 uppercase tracking-widest text-[9px]">Administrator</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-neutral-500 text-[10px]">{language === "vi" ? "Mật khẩu:" : "Password:"}</span>
                        <span className="font-mono text-cyan-300 select-all font-bold shrink-0">{currentUser?.password}</span>
                      </p>
                    </div>
                    <div className="p-2.5 bg-neutral-950/80 rounded border border-neutral-800 text-[10px] text-neutral-450 leading-relaxed mt-2 text-center font-bold">
                      {language === "vi" 
                        ? "⚠️ Quyền hạn Admin: Giám sát tài nguyên và xem mật khẩu, không thể xoá tài khoản hoặc thực thi lệnh hệ thống."
                        : "⚠️ Admin Role: Monitor system stats and lookup passwords. Execution of root console commands and SQL deletion are lock-disabled."}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-neutral-950/90 rounded-xl border border-neutral-800 space-y-1.5 text-[11px]">
                    <p className="text-emerald-400 font-bold text-center border-b border-neutral-900 pb-1 mb-2">
                      [CONSOLE TOOL ACTIONS]
                    </p>
                    <p className="text-cyan-400"><b className="text-white">/lv &lt;số&gt;</b> - {language === "vi" ? "Đặt cấp độ (ví dụ: /lv 15)" : "Set admin level (e.g. /lv 15)"}</p>
                    <p className="text-cyan-400"><b className="text-white">/ban &lt;email&gt;</b> - {language === "vi" ? "Khóa tài khoản (ví dụ: /ban hs@gmail.com)" : "Ban account (e.g. /ban hs@gmail.com)"}</p>
                    <p className="text-cyan-400"><b className="text-white">/streak &lt;số&gt;</b> - {language === "vi" ? "Đặt chuỗi liên tục (Làm mới chuỗi của bạn)" : "Set learning streak count"}</p>
                    <p className="text-yellow-400"><b className="text-white">/acc</b> - {language === "vi" ? "Mở bảng tạo tài khoản nhanh" : "Open quick registration panel"}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Account database table OR the slide quick registers form */}
              <div className="flex-1 p-5 flex flex-col overflow-hidden bg-neutral-900/40 relative">
                
                {/* Check if we are showing /acc Quick account registration panel */}
                {showDevRegisterPanel ? (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto animate-scaleUp">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between border-b border-cyan-900/30 pb-2">
                        <h4 className="text-xs font-black tracking-widest text-[#e11d48] uppercase flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48] animate-ping" />
                          {language === "vi" ? "🛠️ TẠO TÀI KHOẢN NHANH TRỰC TIẾP" : "🛠️ QUICK ACCOUNT CREATOR PANEL"}
                        </h4>
                        <button 
                          type="button" 
                          onClick={() => setShowDevRegisterPanel(false)}
                          className="px-2 py-0.5 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded uppercase font-bold cursor-pointer"
                        >
                          {language === "vi" ? "Quay lại danh sách" : "Back to list"}
                        </button>
                      </div>

                      <form onSubmit={handleDevQuickRegister} className="grid grid-cols-2 gap-3 text-xs">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                            {language === "vi" ? "Tên đăng nhập *" : "Username *"}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="username123"
                            value={devNewUsername}
                            onChange={(e) => setDevNewUsername(e.target.value)}
                            className="w-full p-2 bg-[#141b27] border border-cyan-900/60 rounded text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                            {language === "vi" ? "Họ và Tên (Tùy chọn)" : "Full Name (Optional)"}
                          </label>
                          <input
                            type="text"
                            placeholder="Nguyễn Văn A"
                            value={devNewFullName}
                            onChange={(e) => setDevNewFullName(e.target.value)}
                            className="w-full p-2 bg-[#141b27] border border-cyan-900/60 rounded text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                            Gmail / Email *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="email@example.com"
                            value={devNewEmail}
                            onChange={(e) => setDevNewEmail(e.target.value)}
                            className="w-full p-2 bg-[#141b27] border border-cyan-900/60 rounded text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                            {language === "vi" ? "Mật khẩu *" : "Password *"}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Mật khẩu bảo mật"
                            value={devNewPassword}
                            onChange={(e) => setDevNewPassword(e.target.value)}
                            className="w-full p-2 bg-[#141b27] border border-cyan-900/60 rounded text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400"
                          />
                          <button
                            type="button"
                            onClick={() => setDevNewPassword("Matkhau123@")}
                            className="text-[9px] text-[#38bdf8] hover:underline block mt-1"
                          >
                            ⚡ {language === "vi" ? "Điền mặc định: Matkhau123@" : "Set default: Matkhau123@"}
                          </button>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                            {language === "vi" ? "Vai trò *" : "Role *"}
                          </label>
                          <select
                            value={devNewRole}
                            onChange={(e) => setDevNewRole(e.target.value as any)}
                            className="w-full p-2 bg-[#141b27] border border-cyan-900/60 rounded text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
                          >
                            <option value="student">{language === "vi" ? "🧑‍🎓 Học Sinh" : "🧑‍🎓 Student"}</option>
                            <option value="teacher">{language === "vi" ? "👩‍🏫 Giáo Viên" : "👩‍🏫 Teacher"}</option>
                            <option value="dev">{language === "vi" ? "🛠️ Quản Trị (Dev)" : "🛠️ Super Dev"}</option>
                          </select>
                        </div>

                        {devNewRole === "student" && (
                          <div className="col-span-2 animate-scaleUp">
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                              {language === "vi" ? "Khối Lớp (Học sinh)" : "Grade (Student)"}
                            </label>
                            <select
                              value={devNewGrade}
                              onChange={(e) => setDevNewGrade(e.target.value)}
                              className="w-full p-2 bg-[#141b27] border border-cyan-900/60 rounded text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
                            >
                              {[10, 11, 12, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                                <option key={num} value={String(num)}>{language === "vi" ? `Khối Lớp ${num}` : `Grade ${num}`}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="col-span-2 flex gap-2 pt-3">
                          <button
                            type="button"
                            onClick={handleDevQuickRegister}
                            className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded text-xs font-bold text-white transition active:scale-95 cursor-pointer"
                          >
                            {language === "vi" ? "🚀 HOÀN TẤT TẠO TK" : "🚀 COMPLETE ACCOUNT CREATE"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  // Default Account database management table view
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    
                    {/* Header with quick creation button */}
                    <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3 mb-2 shrink-0">
                      <h4 className="text-[10px] font-black tracking-widest text-cyan-400 uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {language === "vi" ? `⚙️ QUẢN LÝ TÀI KHOẢN DATABASE (${users.length})` : `⚙️ USER DATABASE ACCOUNTS CONTROL (${users.length})`}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowDevRegisterPanel(true)}
                        className="px-2.5 py-1 bg-[#e11d48] hover:bg-[#rose-500] text-white rounded text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition select-none active:scale-95"
                      >
                        ⚡ {language === "vi" ? "TẠO NHANH [/acc]" : "QUICK NEW [/acc]"}
                      </button>
                    </div>

                    {/* Table of user records */}
                    <div className="flex-1 overflow-y-auto max-h-[300px] border border-neutral-800 rounded bg-neutral-950/40 divide-y divide-neutral-900">
                      {users.length === 0 ? (
                        <div className="text-center py-10 text-neutral-500 text-xs text-italic">
                          No accounting database record discovered
                        </div>
                      ) : (
                        users.map((u) => {
                          const isDeletable = u.username !== "kietxx_173" && u.id !== "dev_user_01";
                          return (
                            <div key={u.id} className="p-2 flex items-center justify-between gap-3 text-[11px] hover:bg-neutral-800/30 transition">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-cyan-300 truncate">
                                    {u.fullName || u.username}
                                  </span>
                                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded shrink-0 ${
                                    u.role === "dev" 
                                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" 
                                      : u.role === "admin"
                                      ? "bg-amber-400/20 text-amber-300 border border-amber-400/30 font-black animate-pulse"
                                      : u.role === "teacher" 
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" 
                                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  }`}>
                                    {u.role === "dev" ? (language === "vi" ? "Nhà phát triển" : "Developer") : u.role === "admin" ? "Admin" : u.role === "teacher" ? (language === "vi" ? "Giáo viên" : "Teacher") : (language === "vi" ? "Học sinh" : "Student")}
                                  </span>
                                  {u.banned && (
                                    <span className="text-[8px] bg-red-600 px-1 rounded font-bold text-white uppercase shrink-0 animate-pulse">
                                      Banned
                                    </span>
                                  )}
                                </div>
                                <div className="text-neutral-500 text-[10px] truncate">
                                  {u.email || "No email"} • Pass: <span className="font-sans font-semibold text-neutral-400">{u.password}</span>
                                </div>
                                {u.role === "student" && (
                                  <div className="text-[10px] text-indigo-400 font-bold">
                                    {language === "vi" ? `Khối Lớp ${u.grade || "10"}` : `Grade ${u.grade || "10"}`} • Lvl {u.level} ({u.xp} XP)
                                  </div>
                                )}
                              </div>

                              {/* Operations toolkit */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                
                                {/* 1. Change Role */}
                                <button
                                  type="button"
                                  disabled={u.role === "dev" || currentUser?.role === "admin"}
                                  onClick={() => {
                                    if (u.role === "dev") {
                                      triggerToast(
                                        language === "vi" ? "Không thể thay đổi vai trò của Dev!" : "Cannot change Dev roles!",
                                        "error"
                                      );
                                      return;
                                    }
                                    const updatedList = users.map((usr) => {
                                      if (usr.id === u.id) {
                                        const roles: Array<"student" | "teacher" | "dev" | "admin"> = ["student", "teacher", "dev", "admin"];
                                        const idx = roles.indexOf(usr.role as any);
                                        const nextRole = roles[(idx + 1) % roles.length];
                                        return { ...usr, role: nextRole, updatedAt: Date.now() };
                                      }
                                      return usr;
                                    });
                                    setUsers(updatedList);
                                    triggerImmediateSync(updatedList);
                                    triggerToast(
                                      language === "vi" ? `Đã thay đổi vai trò của ${u.username}` : `Updated role for ${u.username}`,
                                      "info"
                                    );
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                    u.role === "dev" || currentUser?.role === "admin"
                                      ? "bg-neutral-800 text-neutral-500 border-neutral-800 cursor-not-allowed"
                                      : "bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border-neutral-700 cursor-pointer"
                                  }`}
                                  title={u.role === "dev" ? "Dev Account Locked" : "Cycle role student->teacher->dev->admin"}
                                >
                                  Role
                                </button>

                                {/* 2. Ban / Unban Toggle */}
                                {u.username !== "kietxx_173" && currentUser?.role !== "admin" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedList = users.map((usr) => {
                                        if (usr.id === u.id) return { ...usr, banned: !usr.banned, updatedAt: Date.now() };
                                        return usr;
                                      });
                                      setUsers(updatedList);
                                      triggerImmediateSync(updatedList);
                                      triggerToast(
                                        u.banned 
                                          ? (language === "vi" ? `Đã mở khoá: ${u.username}` : `Unbanned user ${u.username}`)
                                          : (language === "vi" ? `Đã khoá: ${u.username}` : `Banned user ${u.username}`),
                                        u.banned ? "success" : "role_alert"
                                      );
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${u.banned ? "bg-emerald-950 text-emerald-400 border-emerald-800" : "bg-orange-950 text-orange-400 border-orange-850"}`}
                                  >
                                    {u.banned ? "Unban" : "Ban"}
                                  </button>
                                )}

                                {/* 3. Delete button */}
                                {isDeletable && currentUser?.role !== "admin" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedList = users.filter((usr) => usr.id !== u.id);
                                      setUsers(updatedList);
                                      triggerImmediateSync(updatedList, u.id);
                                      triggerToast(
                                        language === "vi" ? `Đã xoá tài khoản: ${u.username}` : `Deleted account: ${u.username}`,
                                        "error"
                                      );
                                    }}
                                    className="px-1.5 py-0.5 rounded text-[9px] bg-rose-950/40 text-rose-400 border border-rose-900/50 hover:bg-rose-900 hover:text-white"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Bar form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = cmdInput.trim();
                if (!text) return;

                if (text === "/acc") {
                  setShowDevRegisterPanel(true);
                  triggerToast(
                    language === "vi" ? "Nhập chi tiết thông tin tài khoản bên phải!" : "Enter new user specifications in the creator panel!",
                    "info"
                  );
                  setCmdInput("");
                } else if (text.startsWith("/lv ")) {
                  const valStr = text.substring(4).trim();
                  const lvl = parseInt(valStr, 10);
                  if (isNaN(lvl) || lvl < 1) {
                    triggerToast(
                      language === "vi" ? "Số cấp độ nhập vào không hợp lệ!" : "Invalid target level integer!",
                      "role_alert"
                    );
                  } else {
                    handleUpdateDevXpLevel(lvl, 0);
                    triggerToast(
                      language === "vi" ? `Thành công! Cấp độ của bạn đã được cập nhật thành: Cấp ${lvl}` : `Success! Set level to ${lvl}`,
                      "success"
                    );
                    setCmdInput("");
                  }
                } else if (text.startsWith("/ban ")) {
                  const targetEmail = text.substring(5).trim();
                  if (!targetEmail || !targetEmail.includes("@")) {
                    triggerToast(
                      language === "vi" ? "Vui lòng nhập Email hợp lệ để ban!" : "Specify a valid email address to ban!",
                      "error"
                    );
                  } else {
                    const matched = users.find(u => u.email && u.email.toLowerCase() === targetEmail.toLowerCase());
                    if (!matched) {
                      triggerToast(
                        language === "vi" ? `Không tìm thấy tài khoản nào có email: ${targetEmail}` : `No user record found with email ${targetEmail}`,
                        "error"
                      );
                    } else if (matched.role === "dev") {
                      triggerToast(
                        language === "vi" ? "Không được khóa tài khoản của Dev Admin khác!" : "Forbidden: You cannot ban another Dev Admin account!",
                        "error"
                      );
                    } else {
                      const updatedList = users.map(u => {
                        if (u.id === matched.id) return { ...u, banned: true, updatedAt: Date.now() };
                        return u;
                      });
                      setUsers(updatedList);
                      triggerImmediateSync(updatedList);
                      triggerToast(
                        language === "vi" ? `Đã ban thành công tài khoản: ${matched.fullName} (${targetEmail})` : `Banned account ${matched.fullName} (${targetEmail}) successfully`,
                        "success"
                      );
                      setCmdInput("");
                    }
                  }
                } else if (text.startsWith("/streak ")) {
                  const valStr = text.substring(8).trim();
                  const streakNum = parseInt(valStr, 10);
                  if (isNaN(streakNum) || streakNum < 0) {
                    triggerToast(
                      language === "vi" ? "Số chuỗi nhập vào không hợp lệ!" : "Invalid target streak count integer!",
                      "role_alert"
                    );
                  } else {
                    if (currentUser) {
                      const updatedUser = {
                        ...currentUser,
                        streakCount: streakNum,
                        lastActiveDate: streakNum > 0 ? getLocalDateString() : undefined,
                        updatedAt: Date.now(),
                      };
                      setCurrentUser(updatedUser);
                      const updatedList = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
                      setUsers(updatedList);
                      triggerImmediateSync(updatedList);
                      triggerToast(
                        language === "vi" 
                          ? `Thành công! Chuỗi ngày học tập được sửa đổi thành: ${streakNum} ngày` 
                          : `Success! Learning streak count updated to: ${streakNum}`,
                        "success"
                      );
                      setCmdInput("");
                    }
                  }
                } else if (text.startsWith("/cd ")) {
                  const valStr = text.substring(4).trim().toLowerCase();
                  if (!valStr) {
                    triggerToast(
                      language === "vi" ? "Cú pháp: /cd <số><s/m/h/d> (Ví dụ: /cd 1s, /cd 12h, /cd 0s để tắt)" : "Syntax: /cd <num><s/m/h/d> (e.g. /cd 1s, /cd 12h, /cd 0s to disable)",
                      "role_alert"
                    );
                  } else {
                    const match = valStr.match(/^(\d+(\.\d+)?)(s|m|h|d)$/);
                    if (!match) {
                      triggerToast(
                        language === "vi" 
                          ? "Cú pháp nhập sai! Thử lại kiểu: /cd 1s (giây), /cd 5m (phút), /cd 12h (giờ), /cd 1d (ngày). Nhập 0s để tắt." 
                          : "Invalid syntax! Examples: /cd 1s (sec), /cd 5m (min), /cd 12h (hr), /cd 1d (day). Enter 0s to disable.",
                        "error"
                      );
                    } else {
                      const amount = parseFloat(match[1]);
                      const unit = match[3];
                      let multiplier = 1000;
                      if (unit === "s") multiplier = 1000;
                      else if (unit === "m") multiplier = 60 * 1000;
                      else if (unit === "h") multiplier = 60 * 60 * 1000;
                      else if (unit === "d") multiplier = 24 * 60 * 60 * 1000;

                      const durationMs = amount * multiplier;

                      if (currentUser) {
                        let updatedUser: User;
                        if (durationMs === 0) {
                          updatedUser = {
                            ...currentUser,
                            quizCooldownUntil: undefined,
                            quizSolvedCountToday: 0,
                            devCustomCooldownMs: undefined,
                            updatedAt: Date.now(),
                          };
                          triggerToast(
                            language === "vi" ? "Đã gỡ bỏ cooldown quiz thành công!" : "Successfully cleared quiz cooldown!",
                            "success"
                          );
                        } else {
                          const newCooldownTime = new Date(Date.now() + durationMs).toISOString();
                          updatedUser = {
                            ...currentUser,
                            quizCooldownUntil: newCooldownTime,
                            quizSolvedCountToday: 12, // simulate limit reached
                            devCustomCooldownMs: durationMs, // preserve custom dev choice
                            updatedAt: Date.now(),
                          };
                          triggerToast(
                            language === "vi" 
                              ? `Đã thiết lập cooldown quiz mới: còn ${valStr} (${durationMs.toLocaleString()} ms)` 
                              : `Set quiz cooldown custom duration: remaining ${valStr} (${durationMs.toLocaleString()} ms)`,
                            "success"
                          );
                        }

                        setCurrentUser(updatedUser);
                        const updatedList = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
                        setUsers(updatedList);
                        triggerImmediateSync(updatedList);
                        setCmdInput("");
                      }
                    }
                  }
                } else {
                  triggerToast(
                    language === "vi" ? "Sai cú pháp! Hỗ trợ lệnh: /lv <số>, /ban <email>, /streak <số>, /cd <thời gian>, /acc" : "Invalid syntax! Supported: /lv <num>, /ban <email>, /streak <num>, /cd <time>, /acc",
                    "error"
                  );
                }
              }}
              className="p-4 bg-neutral-950/80 border-t border-cyan-900/40 flex gap-2 shrink-0"
            >
              <span className="text-cyan-500 font-extrabold text-lg select-none self-center">&gt;</span>
              {currentUser?.role === "admin" ? (
                <div className="flex-1 text-[#ef4444] font-bold text-center text-xs self-center select-none uppercase tracking-wider animate-pulse py-1">
                  ⚠️ {language === "vi" 
                    ? "Tài khoản ADMIN bị hạn chế quyền nhập lệnh hệ thống!" 
                    : "Admin account is restricted from entering system console commands!"}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={cmdInput}
                    onChange={(e) => setCmdInput(e.target.value)}
                    autoFocus
                    placeholder={language === "vi" ? "Nhập lệnh /ban <email>, /lv <số>, /streak <số>, /cd <thời gian> hoặc /acc..." : "Type command /ban, /lv, /streak, /cd <time> or /acc..."}
                    className="flex-1 bg-transparent border-none text-cyan-400 font-mono text-sm focus:outline-none placeholder-cyan-950 focus:ring-0"
                  />
                  <button
                    type="submit"
                    className="p-2 px-4 bg-cyan-950 text-cyan-400 hover:bg-cyan-900 rounded-lg text-xs font-bold border border-cyan-800 transition cursor-pointer select-none space-x-1"
                  >
                    <span>RUN</span>
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* High-fidelity custom bottom-right toast container */}
      <div className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-3 max-w-sm w-full pointer-events-none p-4">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isDanger = toast.type === "error" || toast.type === "role_alert";
          const isInfo = toast.type === "info";

          let colorStyles = "";
          if (isSuccess) {
            colorStyles = "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-500/10";
          } else if (isDanger) {
            colorStyles = "bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-rose-500/10";
          } else {
            colorStyles = "bg-blue-600 hover:bg-blue-750 text-white border-blue-500 shadow-blue-500/10";
          }

          return (
            <div
              key={toast.id}
              className={`animate-slideIn pointer-events-auto flex items-start gap-3.5 p-4 rounded-xl shadow-2xl border relative transition-all duration-300 ${colorStyles}`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && (
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                {isDanger && (
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <X className="w-3.5 h-3.5" />
                  </div>
                )}
                {isInfo && (
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 pr-4">
                <p className="text-xs sm:text-sm font-black leading-normal text-white">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="absolute top-3.5 right-3.5 text-white/70 hover:text-white transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
