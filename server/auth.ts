import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import { db } from "./db";
import { users, passwordResetTokens } from "@shared/schema";
import { eq, sql, and, gt } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Security check: fail fast if secrets are not configured in production
if (process.env.NODE_ENV === 'production' && (!JWT_SECRET || !JWT_REFRESH_SECRET)) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in production');
}

// Fallback only for development - should never be used in production
const ACCESS_SECRET = JWT_SECRET || "dev-local-jwt-secret-change-this";
const REFRESH_SECRET = JWT_REFRESH_SECRET || "dev-local-refresh-secret-change-this";

const ACCESS_TOKEN_COOKIE = "talkeasy_access";
const REFRESH_TOKEN_COOKIE = "talkeasy_refresh";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    claims: { sub: string };
  };
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, ACCESS_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): { sub: string } | null {
  try { return jwt.verify(token, ACCESS_SECRET) as { sub: string }; } catch { return null; }
}

export function verifyRefreshToken(token: string): { sub: string } | null {
  try { return jwt.verify(token, REFRESH_SECRET) as { sub: string }; } catch { return null; }
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

  // Password reset request
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const normalizedEmail = email.trim().toLowerCase();
      const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${normalizedEmail}`);

      // Always return success to prevent account enumeration
      if (!user) {
        return res.json({ message: "If an account exists with this email, a password reset link has been sent." });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in database
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt,
        used: false,
      });

      // In production, send email with reset link
      // For now, return the token (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('Password reset token (development only):', resetToken);
        return res.json({ 
          message: "If an account exists with this email, a password reset link has been sent.",
          devToken: resetToken // Only in development
        });
      }

      return res.json({ message: "If an account exists with this email, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Verify reset token
  app.post("/api/auth/verify-reset-token", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: "Token is required" });

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            eq(passwordResetTokens.used, false),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        );

      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      return res.json({ valid: true });
    } catch (error) {
      console.error("Verify token error:", error);
      return res.status(500).json({ message: "Failed to verify token" });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            eq(passwordResetTokens.used, false),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        );

      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Update user password
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, resetToken.userId));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetToken.id));

      return res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({ message: "Failed to reset password" });
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
