// Mock authentication data and utilities
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

// Mock user database
const MOCK_USERS: User[] = [
  {
    id: "1",
    username: "demo",
    email: "demo@simba.dev",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "owner",
    username: "MrAshCreates",
    email: "mrashcreates@gmail.com",
    createdAt: new Date("2024-01-01"),
    isOwner: true,
  },
];

// Mock projects database
const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    userId: "1",
    name: "Hello World",
    content: `# Welcome to SimBa!
def greet(name: str) -> str:
    return f"Hello, {name}! Welcome to SimBa!"

if __name__ == "__main__":
    message = greet("Developer")
    print(message)`,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    userId: "1",
    name: "Fibonacci Example",
    content: `# Fibonacci implementation in SimBa
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

if __name__ == "__main__":
    result = fibonacci(10)
    print(f"Fibonacci(10) = {result}")`,
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
  },
];

// Mock waitlist and invite codes
const MOCK_WAITLIST: WaitlistEntry[] = [];
const MOCK_INVITE_CODES: InviteCode[] = [];

// Mock authentication functions
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check for owner account
  if (email === "mrashcreates@gmail.com" && password === process.env.SIMBA_OWNER_PASSWORD) {
    return MOCK_USERS.find((user) => user.isOwner) || null;
  }

  // Simple mock authentication - in real app, verify hashed password
  if (email === "demo@simba.dev" && password === "demo123") {
    return MOCK_USERS[0];
  }
  return null;
}

export async function createUser(
  username: string,
  email: string,
  password: string,
  phone?: string,
  inviteCode?: string,
): Promise<User | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check if user already exists
  if (MOCK_USERS.some((user) => user.email === email || user.username === username)) {
    return null;
  }

  // For now, allow creation without invite code (will be restricted later)
  // In production, this would check invite codes or waitlist approval

  // Create new user
  const newUser: User = {
    id: (MOCK_USERS.length + 1).toString(),
    username,
    email,
    phone,
    createdAt: new Date(),
  };

  MOCK_USERS.push(newUser);
  return newUser;
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const userIndex = MOCK_USERS.findIndex((user) => user.id === userId);
  if (userIndex !== -1) {
    MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...updates };
    return MOCK_USERS[userIndex];
  }
  return null;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return MOCK_PROJECTS.filter((project) => project.userId === userId);
}

export async function saveProject(userId: string, name: string, content: string, projectId?: string): Promise<Project> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (projectId) {
    // Update existing project
    const projectIndex = MOCK_PROJECTS.findIndex((p) => p.id === projectId && p.userId === userId);
    if (projectIndex !== -1) {
      MOCK_PROJECTS[projectIndex] = {
        ...MOCK_PROJECTS[projectIndex],
        name,
        content,
        updatedAt: new Date(),
      };
      return MOCK_PROJECTS[projectIndex];
    }
  }

  // Create new project
  const newProject: Project = {
    id: (MOCK_PROJECTS.length + 1).toString(),
    userId,
    name,
    content,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  MOCK_PROJECTS.push(newProject);
  return newProject;
}

export async function deleteProject(userId: string, projectId: string): Promise<boolean> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const projectIndex = MOCK_PROJECTS.findIndex((p) => p.id === projectId && p.userId === userId);
  if (projectIndex !== -1) {
    MOCK_PROJECTS.splice(projectIndex, 1);
    return true;
  }
  return false;
}

// Admin functions for owner dashboard
export async function getWaitlist(): Promise<WaitlistEntry[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...MOCK_WAITLIST];
}

export async function addToWaitlist(email: string, name: string, reason: string): Promise<WaitlistEntry> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const entry: WaitlistEntry = {
    id: (MOCK_WAITLIST.length + 1).toString(),
    email,
    name,
    reason,
    status: "pending",
    createdAt: new Date(),
  };

  MOCK_WAITLIST.push(entry);
  return entry;
}

export async function updateWaitlistStatus(entryId: string, status: "approved" | "rejected"): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const entryIndex = MOCK_WAITLIST.findIndex((entry) => entry.id === entryId);
  if (entryIndex !== -1) {
    MOCK_WAITLIST[entryIndex].status = status;
    return true;
  }
  return false;
}

export async function generateInviteCode(email?: string): Promise<InviteCode> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const invite: InviteCode = {
    id: (MOCK_INVITE_CODES.length + 1).toString(),
    code,
    email,
    createdAt: new Date(),
    isActive: true,
  };

  MOCK_INVITE_CODES.push(invite);
  return invite;
}

export async function getInviteCodes(): Promise<InviteCode[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...MOCK_INVITE_CODES];
}

export async function getAllUsers(): Promise<User[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...MOCK_USERS];
}
