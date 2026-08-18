export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  developerStatus?: string;
  simbaUsage?: string;
  createdAt: Date;
  isOwner?: boolean;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  name: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export interface InviteCode {
  id: string;
  code: string;
  email?: string;
  usedBy?: string;
  createdAt: Date;
  usedAt?: Date;
  isActive: boolean;
}
