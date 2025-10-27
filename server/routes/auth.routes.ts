import { Router } from "express";
import { db } from "../db";
import { users, userActivityLogs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { resolveUserPermissions } from "server/utils/role-permissions";

const router = Router();

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});




// Login endpoint
router.post("/login", validateRequest(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;

    // console.log("Login request body:", req.body);

    // Find user by username
    const results = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    const user = results[0];
     console.log(`admin------> ${user?.password}`);
    if (!user) {
      console.warn("User not found:", username);
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Check if user is active
    if (user.status !== "active") {
      return res.status(403).json({ error: "Account is inactive. Please contact administrator." });
    }

    // Ensure password field exists
    if (!user.password) {
      console.error("User has no password in DB:", user.id);
      return res.status(500).json({ error: "User record is invalid. Contact support." });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log(isValidPassword)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Update last login
    await db
      .update(users)
      .set({
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Log activity
    try {
      await db.insert(userActivityLogs).values({
        userId: user.id,
        action: "login",
        entityType: "user",
        entityId: user.id,
        details: JSON.stringify({
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    } catch (logError) {
      console.error("Failed to log login activity:", logError);
    }

    // Store user in session
    if (!(req as any).session) {
      console.error("Session not initialized");
      return res.status(500).json({ error: "Session not initialized" });
    }

    (req as any).session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: resolveUserPermissions(user.role, user.permissions as any),
      avatar: user.avatar,
    };

    // Remove password before sending back
    const { password: _, ...userData } = user;

    res.json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.log("Error during login:", error);
    res.status(500).json({ error: "Login failed", message: (error as Error).message });
  }
});


// Logout endpoint
router.post("/logout", (req, res) => {
  const userId = (req as any).session?.user?.id;

  if (userId) {
    // Log activity
    db.insert(userActivityLogs)
      .values({
        userId,
        action: "logout",
        entityType: "user",
        entityId: userId,
        details: {},
      })
      .catch(console.error);
  }

  // Destroy session
  (req as any).session.destroy((err: any) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ error: "Logout failed" });
    }

    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
});

// Get current user
router.get("/me", async (req, res) => {
  // console.log("Fetching current user" , req.session);
  const user = (req as any).session?.user;
// console.log("Session user:", user);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Get fresh user data
  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id));

  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  // Remove password from response
  const { password, ...userData } = currentUser;
  res.json(userData);
});

// Check if authenticated (for frontend)
router.get("/check", (req, res) => {
  const user = (req as any).session?.user;
  res.json({ authenticated: !!user, user });
});

export default router;