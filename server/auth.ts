import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "dev-local-jwt-secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-local-refresh-secret";

const ACCESS_TOKEN_COOKIE = "talkeasy_access";
const REFRESH_TOKEN_COOKIE = "talkeasy_refresh";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    claims: { sub: string };
  };
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): { sub: string } | null {
  try { return jwt.verify(token, JWT_SECRET) as { sub: string }; } catch { return null; }
}

export function verifyRefreshToken(token: string): { sub: string } | null {
  try { return jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string }; } catch { return null; }
}

export const isAuthenticated: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE] || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const payload = verifyAccessToken(token);
  if (!payload || !payload.sub) return res.status(401).json({ message: "Unauthorized" });

  req.user = { id: payload.sub, claims: { sub: payload.sub } };
  next();
};

export function setupLocalAuth(app: Express) {
  app.use(cookieParser());

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, ageGroup, preferredLanguage } = req.body;
      const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

      if (!normalizedEmail || !password) return res.status(400).json({ message: "Email and password are required" });
      if (!firstName || !lastName) return res.status(400).json({ message: "First name and last name are required" });

      const existing = await db.select().from(users).where(sql`lower(${users.email}) = ${normalizedEmail}`);
      if (existing.length > 0) return res.status(409).json({ message: "User with this email already exists" });

      const passwordHash = await bcrypt.hash(password, 12);
      const [newUser] = await db.insert(users).values({
        email: normalizedEmail,
        username: normalizedEmail.split("@")[0],
        passwordHash,
        firstName,
        lastName,
        ageGroup: ageGroup || "Young Adult (20-35)",
        preferredLanguage: preferredLanguage || "English",
      }).returning();

      const accessToken = generateAccessToken(newUser.id);
      const refreshToken = generateRefreshToken(newUser.id);
      setAuthCookies(res, accessToken, refreshToken);

      const { passwordHash: _, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      // Accept both email and identifier for compatibility with saved/autofilled credentials.
      const rawIdentifier = req.body?.email ?? req.body?.identifier ?? req.body?.username;
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      const identifier = typeof rawIdentifier === "string" ? rawIdentifier.trim() : "";

      if (!identifier || !password) return res.status(400).json({ message: "Email and password are required" });

      const normalizedIdentifier = identifier.toLowerCase();
      const [user] = await db.select().from(users).where(
        sql`lower(${users.email}) = ${normalizedIdentifier} OR lower(${users.username}) = ${normalizedIdentifier}`
      );

      if (!user || !user.passwordHash) return res.status(401).json({ message: "Invalid email or password" });

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) return res.status(401).json({ message: "Invalid email or password" });

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      setAuthCookies(res, accessToken, refreshToken);

      const { passwordHash: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Failed to log in" });
    }
  });

  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
      if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

      const payload = verifyRefreshToken(refreshToken);
      if (!payload || !payload.sub) return res.status(401).json({ message: "Invalid refresh token" });

      const [user] = await db.select().from(users).where(eq(users.id, payload.sub));
      if (!user) return res.status(401).json({ message: "User not found" });

      const newAccessToken = generateAccessToken(user.id);
      const newRefreshToken = generateRefreshToken(user.id);
      setAuthCookies(res, newAccessToken, newRefreshToken);

      const { passwordHash: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Refresh token error:", error);
      return res.status(500).json({ message: "Failed to refresh token" });
    }
  });

  const handleLogout = (_req: Request, res: Response) => {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
    return res.json({ success: true, message: "Logged out successfully" });
  };

  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/logout", (req, res) => handleLogout(req, res));
  app.get("/api/logout", (_req, res) => {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
    return res.redirect("/");
  });

  app.get("/api/auth/user", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(401).json({ message: "User not found" });

      const { passwordHash: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Auth user error:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}
