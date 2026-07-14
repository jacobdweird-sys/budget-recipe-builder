import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

// Explicit Db Row Types to satisfy TS/ESLint rules
interface UserDbRow {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  created_at: string;
  name: string | null;
  dietary_preferences: string[];
  bio: string | null;
  avatar_emoji: string;
  budget_goal: number | null;
  location: string | null;
}

interface SessionDbRow {
  id: string;
  user_id: string;
  expires_at: string;
}

interface HistoryDbRow {
  id: string;
  user_id: string;
  zip_code: string | null;
  pantry_items: string[];
  food_preferences: string[];
  budget: string;
  meals: unknown[];
  generated_at: string;
}

interface IngredientDbRow {
  id: string;
  user_id: string;
  ingredient_name: string;
  scanned_at: string;
}

interface ResetTokenDbRow {
  id: string;
  email: string;
  token: string;
  expires_at: string;
}

export interface PlannerEntryDbRow {
  id: string;
  user_id: string;
  date: string;
  recipe: any;
  created_at: string;
}

type SqlFunction = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>;

let sqlExport: SqlFunction;

if (process.env.DATABASE_URL) {
  sqlExport = neon(process.env.DATABASE_URL) as unknown as SqlFunction;
} else {
  // Local JSON Database Simulation Engine
  const DATA_DIR = path.resolve("./data");

  const readJson = <T>(filename: string, defaultValue: T): T => {
    const filepath = path.join(DATA_DIR, filename);
    try {
      if (!fs.existsSync(filepath)) {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(filepath, JSON.stringify(defaultValue, null, 2), "utf-8");
        return defaultValue;
      }
      const data = fs.readFileSync(filepath, "utf-8");
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  };

  const writeJson = <T>(filename: string, data: T): void => {
    const filepath = path.join(DATA_DIR, filename);
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error(`[DATABASE SIMULATOR] Error writing to ${filename}:`, err);
    }
  };

  const toIsoStr = (val: unknown): string => {
    if (val instanceof Date) return val.toISOString();
    try {
      return new Date(val as string | number).toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  sqlExport = async (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]> => {
    const rawQuery = strings.map((s, i) => s + (i < values.length ? "?" : "")).join("");
    const query = rawQuery.replace(/\s+/g, " ").trim();

    // 1. SELECT * FROM users WHERE email = ?
    if (query.includes("SELECT * FROM users WHERE email = ?")) {
      const email = values[0] as string;
      const users = readJson<UserDbRow[]>("users.json", []);
      const user = users.find((u) => u.email?.toLowerCase() === email?.toLowerCase());
      return user ? [user] : [];
    }

    // 2. SELECT * FROM users WHERE id = ?
    if (query.includes("SELECT * FROM users WHERE id = ?")) {
      const id = values[0] as string;
      const users = readJson<UserDbRow[]>("users.json", []);
      const user = users.find((u) => u.id === id);
      return user ? [user] : [];
    }

    // 3. INSERT INTO users
    if (query.startsWith("INSERT INTO users")) {
      const users = readJson<UserDbRow[]>("users.json", []);
      const newUser: UserDbRow = {
        id: values[0] as string,
        email: values[1] as string,
        password_hash: values[2] as string,
        salt: values[3] as string,
        created_at: new Date().toISOString(),
        name: null,
        dietary_preferences: [],
        bio: null,
        avatar_emoji: "",
        budget_goal: null,
        location: null,
      };
      users.push(newUser);
      writeJson("users.json", users);
      return [newUser];
    }

    // 4. UPDATE users SET
    if (query.startsWith("UPDATE users SET")) {
      const users = readJson<UserDbRow[]>("users.json", []);

      if (query.includes("password_hash = ?")) {
        const passwordHash = values[0] as string;
        const salt = values[1] as string;
        const id = values[2] as string;

        const idx = users.findIndex((u) => u.id === id);
        if (idx !== -1) {
          users[idx] = {
            ...users[idx],
            password_hash: passwordHash,
            salt: salt,
          };
          writeJson("users.json", users);
          return [users[idx]];
        }
      } else {
        const name = values[0] as string | null;
        const dietaryPrefsJson = values[1] as string | null;
        const bio = values[2] as string | null;
        const avatarEmoji = values[3] as string | null;
        const budgetGoal = values[4] as number | null;
        const location = values[5] as string | null;
        const id = values[6] as string;

        const idx = users.findIndex((u) => u.id === id);
        if (idx !== -1) {
          users[idx] = {
            ...users[idx],
            name: name !== undefined ? name : users[idx].name,
            dietary_preferences: dietaryPrefsJson ? JSON.parse(dietaryPrefsJson) as string[] : users[idx].dietary_preferences,
            bio: bio !== undefined ? bio : users[idx].bio,
            avatar_emoji: avatarEmoji !== null && avatarEmoji !== undefined ? avatarEmoji : users[idx].avatar_emoji,
            budget_goal: budgetGoal !== null && budgetGoal !== undefined ? Number(budgetGoal) : users[idx].budget_goal,
            location: location !== undefined ? location : users[idx].location,
          };
          writeJson("users.json", users);
          return [users[idx]];
        }
      }
      return [];
    }

    // 5. INSERT INTO sessions
    if (query.startsWith("INSERT INTO sessions")) {
      const sessions = readJson<SessionDbRow[]>("sessions.json", []);
      const newSession: SessionDbRow = {
        id: values[0] as string,
        user_id: values[1] as string,
        expires_at: (values[2] as number | string | bigint).toString(),
      };
      sessions.push(newSession);
      writeJson("sessions.json", sessions);
      return [newSession];
    }

    // 6. DELETE FROM sessions WHERE user_id = ? AND expires_at <= ?
    if (query.includes("DELETE FROM sessions WHERE user_id = ? AND expires_at <=")) {
      const userId = values[0] as string;
      const now = Number(values[1]);
      const sessions = readJson<SessionDbRow[]>("sessions.json", []);
      const filtered = sessions.filter((s) => !(s.user_id === userId && Number(s.expires_at) <= now));
      writeJson("sessions.json", filtered);
      return [];
    }

    // 7. SELECT * FROM sessions WHERE id = ?
    if (query.includes("SELECT * FROM sessions WHERE id = ?")) {
      const id = values[0] as string;
      const sessions = readJson<SessionDbRow[]>("sessions.json", []);
      const session = sessions.find((s) => s.id === id);
      return session ? [session] : [];
    }

    // 8. DELETE FROM sessions WHERE id = ?
    if (query.includes("DELETE FROM sessions WHERE id = ?")) {
      const id = values[0] as string;
      const sessions = readJson<SessionDbRow[]>("sessions.json", []);
      const filtered = sessions.filter((s) => s.id !== id);
      writeJson("sessions.json", filtered);
      return [];
    }

    // 9. INSERT INTO history
    if (query.startsWith("INSERT INTO history")) {
      const history = readJson<HistoryDbRow[]>("history.json", []);
      const newHistory: HistoryDbRow = {
        id: values[0] as string,
        user_id: values[1] as string,
        zip_code: values[2] as string | null,
        pantry_items: JSON.parse(values[3] as string) as string[],
        food_preferences: JSON.parse(values[4] as string) as string[],
        budget: (values[5] as number).toString(),
        meals: JSON.parse(values[6] as string) as unknown[],
        generated_at: new Date().toISOString(),
      };
      history.push(newHistory);
      writeJson("history.json", history);
      return [newHistory];
    }

    // 10. SELECT id, zip_code, pantry_items, food_preferences, budget, meals, generated_at FROM history
    if (query.startsWith("SELECT id, zip_code, pantry_items, food_preferences, budget, meals, generated_at FROM history")) {
      const userId = values[0] as string;
      const history = readJson<HistoryDbRow[]>("history.json", []);
      const filtered = history
        .filter((h) => h.user_id === userId)
        .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
      return filtered;
    }

    // 11. DELETE FROM history WHERE id = ? AND user_id = ? RETURNING id
    if (query.includes("DELETE FROM history WHERE id = ? AND user_id = ? RETURNING id")) {
      const id = values[0] as string;
      const userId = values[1] as string;
      const history = readJson<HistoryDbRow[]>("history.json", []);
      const item = history.find((h) => h.id === id && h.user_id === userId);
      if (item) {
        const filtered = history.filter((h) => !(h.id === id && h.user_id === userId));
        writeJson("history.json", filtered);
        return [{ id }];
      }
      return [];
    }

    // 12. SELECT * FROM ingredients WHERE user_id = ? AND LOWER(ingredient_name) = LOWER(?) LIMIT 1
    if (query.includes("SELECT * FROM ingredients WHERE user_id = ? AND LOWER(ingredient_name) = LOWER(?) LIMIT 1")) {
      const userId = values[0] as string;
      const name = values[1] as string;
      const ingredients = readJson<IngredientDbRow[]>("ingredients.json", []);
      const ing = ingredients.find((i) => i.user_id === userId && i.ingredient_name?.toLowerCase() === name?.toLowerCase());
      return ing ? [ing] : [];
    }

    // 13. UPDATE ingredients SET scanned_at = now() WHERE id = ? RETURNING *
    if (query.includes("UPDATE ingredients SET scanned_at = now() WHERE id = ? RETURNING *")) {
      const id = values[0] as string;
      const ingredients = readJson<IngredientDbRow[]>("ingredients.json", []);
      const idx = ingredients.findIndex((i) => i.id === id);
      if (idx !== -1) {
        ingredients[idx].scanned_at = new Date().toISOString();
        writeJson("ingredients.json", ingredients);
        return [ingredients[idx]];
      }
      return [];
    }

    // 14. INSERT INTO ingredients (id, user_id, ingredient_name)
    if (query.startsWith("INSERT INTO ingredients")) {
      const ingredients = readJson<IngredientDbRow[]>("ingredients.json", []);
      const newIng: IngredientDbRow = {
        id: values[0] as string,
        user_id: values[1] as string,
        ingredient_name: values[2] as string,
        scanned_at: new Date().toISOString(),
      };
      ingredients.push(newIng);
      writeJson("ingredients.json", ingredients);
      return [newIng];
    }

    // 15. SELECT * FROM ingredients WHERE user_id = ? ORDER BY scanned_at DESC
    if (query.includes("SELECT * FROM ingredients WHERE user_id = ? ORDER BY scanned_at DESC")) {
      const userId = values[0] as string;
      const ingredients = readJson<IngredientDbRow[]>("ingredients.json", []);
      const filtered = ingredients
        .filter((i) => i.user_id === userId)
        .sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());
      return filtered;
    }

    // 16. DELETE FROM reset_tokens WHERE email = ?
    if (query.includes("DELETE FROM reset_tokens WHERE email = ?")) {
      const email = values[0] as string;
      const tokens = readJson<ResetTokenDbRow[]>("reset_tokens.json", []);
      const filtered = tokens.filter((t) => t.email?.toLowerCase() !== email?.toLowerCase());
      writeJson("reset_tokens.json", filtered);
      return [];
    }

    // 17. INSERT INTO reset_tokens
    if (query.startsWith("INSERT INTO reset_tokens")) {
      const tokens = readJson<ResetTokenDbRow[]>("reset_tokens.json", []);
      const newToken: ResetTokenDbRow = {
        id: values[0] as string,
        email: values[1] as string,
        token: values[2] as string,
        expires_at: toIsoStr(values[3]),
      };
      tokens.push(newToken);
      writeJson("reset_tokens.json", tokens);
      return [newToken];
    }

    // 18. SELECT * FROM reset_tokens WHERE email = ? AND token = ? AND expires_at > now()
    if (query.includes("SELECT * FROM reset_tokens WHERE email = ? AND token = ? AND expires_at > now()")) {
      const email = values[0] as string;
      const token = values[1] as string;
      const tokens = readJson<ResetTokenDbRow[]>("reset_tokens.json", []);
      const match = tokens.find(
        (t) =>
          t.email?.toLowerCase() === email?.toLowerCase() &&
          t.token === token &&
          new Date(t.expires_at).getTime() > Date.now()
      );
      return match ? [match] : [];
    }

    // 19. SELECT * FROM planner_entries WHERE user_id = ?
    if (query.includes("SELECT * FROM planner_entries WHERE user_id = ?")) {
      const userId = values[0] as string;
      const entries = readJson<PlannerEntryDbRow[]>("planner_entries.json", []);
      const filtered = entries.filter((e) => e.user_id === userId);
      return filtered;
    }

    // 20. DELETE FROM planner_entries WHERE user_id = ?
    if (query.includes("DELETE FROM planner_entries WHERE user_id = ?")) {
      const userId = values[0] as string;
      const entries = readJson<PlannerEntryDbRow[]>("planner_entries.json", []);
      const filtered = entries.filter((e) => e.user_id !== userId);
      writeJson("planner_entries.json", filtered);
      return [];
    }

    // 21. INSERT INTO planner_entries
    if (query.startsWith("INSERT INTO planner_entries")) {
      const entries = readJson<PlannerEntryDbRow[]>("planner_entries.json", []);
      const newEntry: PlannerEntryDbRow = {
        id: values[0] as string,
        user_id: values[1] as string,
        date: values[2] as string,
        recipe: JSON.parse(values[3] as string),
        created_at: new Date().toISOString(),
      };
      entries.push(newEntry);
      writeJson("planner_entries.json", entries);
      return [newEntry];
    }

    console.warn("[DATABASE SIMULATOR] Unsupported query:", query);
    return [];
  };
}

export const sql = sqlExport;
