import { sql } from "./neon";
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

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  created_at: string;
  name: string | null;
  dietary_preferences: string[] | null;
  bio: string | null;
  avatar_emoji: string | null;
  budget_goal: string | null;
  location: string | null;
};

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    salt: row.salt,
    createdAt: row.created_at,
    name: row.name ?? undefined,
    dietaryPreferences: row.dietary_preferences ?? [],
    bio: row.bio ?? undefined,
    avatarEmoji: row.avatar_emoji ?? undefined,
    budgetGoal: row.budget_goal !== null ? Number(row.budget_goal) : undefined,
    location: row.location ?? undefined,
  };
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const rows = (await sql`SELECT * FROM users WHERE email = ${email}`) as UserRow[];
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const rows = (await sql`SELECT * FROM users WHERE id = ${id}`) as UserRow[];
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

export async function createUser(email: string, password: string): Promise<User> {
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error("User already exists");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const id = crypto.randomUUID();

  const rows = (await sql`
    INSERT INTO users (id, email, password_hash, salt, dietary_preferences, avatar_emoji)
    VALUES (${id}, ${email}, ${passwordHash}, ${salt}, '[]'::jsonb, '')
    RETURNING *
  `) as UserRow[];

  return rowToUser(rows[0]);
}

export async function updateUserProfile(
  id: string,
  updates: Partial<Pick<User, "name" | "dietaryPreferences" | "bio" | "avatarEmoji" | "budgetGoal" | "location">>
): Promise<User | undefined> {
  const existing = await getUserById(id);
  if (!existing) return undefined;

  const merged = { ...existing, ...updates };

  const rows = (await sql`
    UPDATE users SET
      name = ${merged.name ?? null},
      dietary_preferences = ${JSON.stringify(merged.dietaryPreferences ?? [])}::jsonb,
      bio = ${merged.bio ?? null},
      avatar_emoji = ${merged.avatarEmoji ?? null},
      budget_goal = ${merged.budgetGoal ?? null},
      location = ${merged.location ?? null}
    WHERE id = ${id}
    RETURNING *
  `) as UserRow[];

  return rows[0] ? rowToUser(rows[0]) : undefined;
}

export async function verifyUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const hash = hashPassword(password, user.salt);
  if (hash === user.passwordHash) {
    return user;
  }
  return null;
}

export async function resetPassword(email: string, newPassword: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(newPassword, salt);

  await sql`
    UPDATE users SET password_hash = ${passwordHash}, salt = ${salt}
    WHERE id = ${user.id}
  `;

  return user;
}

export async function createSession(userId: string): Promise<Session> {
  const id = crypto.randomUUID();
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

  await sql`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (${id}, ${userId}, ${expiresAt})
  `;

  // Best-effort cleanup of expired sessions for this user
  await sql`DELETE FROM sessions WHERE user_id = ${userId} AND expires_at <= ${Date.now()}`;

  return { id, userId, expiresAt };
}

export async function getSession(sessionId: string): Promise<Session | undefined> {
  const rows = (await sql`SELECT * FROM sessions WHERE id = ${sessionId}`) as Array<{
    id: string;
    user_id: string;
    expires_at: string;
  }>;
  const row = rows[0];
  if (row && Number(row.expires_at) > Date.now()) {
    return { id: row.id, userId: row.user_id, expiresAt: Number(row.expires_at) };
  }
  return undefined;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
}
