// ===== AUTH =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  birthDate?: string;
  sessionId?: string;
  role?: string;
  companyReferralCode?: string;
  psychologistReferralCode?: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

// ===== USER =====
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'PSYCHOLOGIST' | 'ADMIN' | 'EMPRESA';
  avatarUrl?: string;
  darkMode?: boolean;
  gender?: string;
  age?: number;
  birthDate?: string;
  createdAt?: string;
  emailVerified?: boolean;
}

export interface ProfileUpdate {
  name?: string;
  darkMode?: boolean;
  gender?: string | null;
  age?: number | null;
  birthDate?: string | null;
}

// ===== PSYCHOLOGIST =====
export interface Psychologist {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  education?: string;
  certifications?: string;
  specializations?: string;
  experience?: string;
  languages?: string;
  linkedinUrl?: string;
  website?: string;
  sessionPrices?: string;
  isFull?: boolean;
  averageRating?: number;
  totalRatings?: number;
}

export interface PsychologistAssignment {
  status: 'PENDING' | 'ASSIGNED';
  psychologist?: Psychologist;
}

// ===== PATIENT =====
export interface Patient {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  gender?: string;
  age?: number;
  birthDate?: string;
  isMinor?: boolean;
  consentStatus?: string;
  status?: string;
  assignedAt?: string;
  lastVisit?: string;
}

// ===== TASKS =====
export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  completed: boolean;
  dueDate?: string;
  createdAt?: string;
  userId?: number;
  userName?: string;
  psychologistId?: number;
}

export interface TaskComment {
  id: number;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface TaskFile {
  id: number;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

// ===== TESTS =====
export interface Test {
  id: number;
  code: string;
  title: string;
  description?: string;
  active: boolean;
  category?: string;
  topic?: string;
  questionCount?: number;
}

export interface Question {
  id: number;
  text: string;
  type: string;
  position: number;
  subfactorId?: number;
  subfactorName?: string;
  answers?: Answer[];
}

export interface Answer {
  id: number;
  text: string;
  value?: number;
  position: number;
}

export interface AssignedTest {
  id: number;
  testId: number;
  testTitle: string;
  testCode?: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  status: string;
  assignedAt: string;
  completedAt?: string;
}

export interface SubmitAnswerPayload {
  questionId: number;
  answerId?: number;
  numericValue?: number;
  textValue?: string;
}

// ===== APPOINTMENTS =====
export interface Appointment {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
  price?: number;
  psychologist?: { id: number; name: string; email: string };
  patient?: { id: number; name: string; email: string };
  paymentStatus?: string;
  paymentDeadline?: string;
  confirmedAt?: string;
  rating?: number;
  comment?: string;
}

export interface CalendarSlot {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
  price?: number;
  patientName?: string;
  patientEmail?: string;
}

// ===== CHAT =====
export interface ChatMessage {
  id?: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  senderName?: string;
}

// ===== ADMIN =====
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  testsCompleted?: number;
  psychologistId?: number;
  psychologistName?: string;
}

export interface AdminStatistics {
  totalUsers: number;
  users: number;
  psychologists: number;
  admins: number;
  totalTests: number;
  evaluationTests: number;
  totalAppointments: number;
  bookedAppointments: number;
  totalUserAnswers: number;
  assignedRelations: number;
  verifiedUsers: number;
}

export interface Factor {
  id: number;
  code: string;
  name: string;
  description?: string;
  position?: number;
  subfactors?: Subfactor[];
}

export interface Subfactor {
  id: number;
  code: string;
  name: string;
  description?: string;
  factorId?: number;
  position?: number;
}

// ===== AGENDA =====
export interface AgendaEntry {
  id?: number;
  entryDate: string;
  moodRating: number;
  emotions?: string;
  activities?: string;
  companions?: string;
  location?: string;
  notes?: string;
}

// ===== CONSENT =====
export interface ConsentDocumentType {
  id: number;
  code: string;
  title: string;
  active: boolean;
}

export interface ConsentRequest {
  id: number;
  userId: number;
  documentTypeId: number;
  status: string;
  place?: string;
  signerName?: string;
  createdAt: string;
}

// ===== RATING =====
export interface Rating {
  rating: number;
  comment?: string;
  patientName: string;
  createdAt: string;
}

// ===== TOAST =====
export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
