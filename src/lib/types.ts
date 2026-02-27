export type UserRole = "CLIENT" | "FREELANCER";

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: Record<string, string> | null;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: number;
  email: string;
  role: UserRole;
}

export interface AuthSession extends AuthResponse {
  expiresAt: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  tags: string[];
}

export interface JobResponse {
  id: number;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  tags: string[];
  status: string;
  clientId: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface CreateProposalRequest {
  jobId: number;
  coverLetter: string;
  price: number;
  durationDays: number;
}

export interface ProposalResponse {
  id: number;
  jobId: number;
  freelancerId: number;
  freelancerEmail: string;
  coverLetter: string;
  price: number;
  durationDays: number;
  status: string;
  acceptedByClientId: number | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneResponse {
  id: number;
  contractId: number;
  title: string;
  amount: number;
  dueDate: string;
  status: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractResponse {
  id: number;
  sourceProposalId: number;
  jobId: number;
  clientId: number;
  freelancerId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  milestones: MilestoneResponse[];
}

export interface NotificationResponse {
  id: number;
  recipientUserId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}
