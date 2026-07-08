import { readJsonFile, writeJsonFile } from "./db";
import crypto from "crypto";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  name?: string;
  dietaryPreferences?: string[];
  bio?: string;
  avatarEmoji?: string;
  budgetGoal?: number;
  location?: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
}

const USERS_FILE = "users.json";
const SESSIONS_FILE = "sessions.json";

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function getUserByEmail(email: string): User | undefined {
  const users = readJsonFile<User[]>(USERS_FILE, []);
  return users.find((u) => u.email === email);
}

export function getUserById(id: string): User | undefined {
  const users = readJsonFile<User[]>(USERS_FILE, []);
  return users.find((u) => u.id === id);
}

export function createUser(email: string, password: string): User {
  const users = readJsonFile<User[]>(USERS_FILE, []);
  if (users.some((u) => u.email === email)) {
    throw new Error("User already exists");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);

  const newUser: User = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    dietaryPreferences: [],
    avatarEmoji: "", // No emoji avatar
  };

  users.push(newUser);
  writeJsonFile(USERS_FILE, users);
  return newUser;
}

export function updateUserProfile(id: string, updates: Partial<Pick<User, "name" | "dietaryPreferences" | "bio" | "avatarEmoji" | "budgetGoal" | "location">>): User | undefined {
  const users = readJsonFile<User[]>(USERS_FILE, []);
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return undefined;

  users[index] = { ...users[index], ...updates };
  writeJsonFile(USERS_FILE, users);
  return users[index];
}

export function verifyUser(email: string, password: string): User | null {
  const user = getUserByEmail(email);
  if (!user) return null;

  const hash = hashPassword(password, user.salt);
  if (hash === user.passwordHash) {
    return user;
  }
  return null;
}

export function createSession(userId: string): Session {
  const sessions = readJsonFile<Session[]>(SESSIONS_FILE, []);
  
  // Clean up old sessions
  const now = Date.now();
  const validSessions = sessions.filter((s) => s.expiresAt > now);

  const newSession: Session = {
    id: crypto.randomUUID(),
    userId,
    // 30 days expiration
    expiresAt: now + 30 * 24 * 60 * 60 * 1000,
  };

  validSessions.push(newSession);
  writeJsonFile(SESSIONS_FILE, validSessions);
  return newSession;
}

export function getSession(sessionId: string): Session | undefined {
  const sessions = readJsonFile<Session[]>(SESSIONS_FILE, []);
  const session = sessions.find((s) => s.id === sessionId);
  if (session && session.expiresAt > Date.now()) {
    return session;
  }
  return undefined;
}

export function deleteSession(sessionId: string): void {
  const sessions = readJsonFile<Session[]>(SESSIONS_FILE, []);
  const newSessions = sessions.filter((s) => s.id !== sessionId);
  writeJsonFile(SESSIONS_FILE, newSessions);
}
