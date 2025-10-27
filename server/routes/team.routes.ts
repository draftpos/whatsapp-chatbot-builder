import { Router } from "express";
import { db } from "../db";
import {
  users,
  userActivityLogs,
  conversationAssignments,
  DEFAULT_PERMISSIONS,
  Permission,
} from "@shared/schema";
import { eq, desc, and, sql, ne } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";
import { PERMISSIONS } from "@shared/schema";


const router = Router();

const PERMISSION_KEY_MAP: Record<string, string[]> = {
  canManageContacts: [
    "contacts:view",
    "contacts:create",
    "contacts:edit",
    "contacts:import",
    "contacts:export",
  ],
  canManageCampaigns: [
    "campaigns:view",
    "campaigns:create",
    "campaigns:edit",
    "campaigns:send",
    "campaigns:schedule",
  ],
  canManageTemplates: [
    "templates:view",
    "templates:create",
    "templates:edit",
    "templates:sync",
  ],
  canManageTeam: ["team:view", "team:create", "team:edit", "team:delete"],
  canViewAnalytics: ["analytics:view", "analytics:export"],
  canExportData: ["dashboard:export", "contacts:export", "analytics:export"],
};

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  role: z.enum(["admin", "manager", "agent"]),
  permissions: z
    .union([z.array(z.string()), z.record(z.boolean())])
    .optional()
    .transform((val) => {
      if (Array.isArray(val)) {
        // Already a valid permission array
        return val;
      }
      if (val && typeof val === "object") {
        // Expand boolean keys into full permissions
        return Object.keys(val).reduce((acc: string[], key) => {
          if (val[key] && PERMISSION_KEY_MAP[key]) {
            acc.push(...PERMISSION_KEY_MAP[key]);
          }
          return acc;
        }, []);
      }
      return [];
    }),
  avatar: z.string().optional(),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true });

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const updateStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

// Get all team members (users)
router.get("/members",requireAuth,
requirePermission(PERMISSIONS.TEAM_VIEW), async (req, res) => {
  try {
    const members = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        status: users.status,
        permissions: users.permissions,
        avatar: users.avatar,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    res.json(members);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

// Get single team member
router.get("/members/:id",requireAuth,
requirePermission(PERMISSIONS.TEAM_VIEW), async (req, res) => {
  try {
    const [member] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.params.id));

    if (!member) {
      return res.status(404).json({ error: "Team member not found" });
    }

    // Remove password from response
    const { password, ...memberData } = member;
    res.json(memberData);
  } catch (error) {
    console.error("Error fetching team member:", error);
    res.status(500).json({ error: "Failed to fetch team member" });
  }
});

// Create team member
router.post("/members",requireAuth,
requirePermission(PERMISSIONS.TEAM_CREATE), validateRequest(createUserSchema), async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      permissions,
      avatar,
    } = req.body;

    // Check if email or username already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(sql`${users.email} = ${email} OR ${users.username} = ${username}`);

    if (existingUser) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log({
      username,
      password: hashedPassword,
      email,
      firstName,
      lastName,
      role,
      permissions,
      avatar: avatar || null,
      status: "active",
    })

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName,
        role,
        permissions, // already an array from schema
        avatar: avatar || null,
        status: "active",
      })
      .returning();

    await db.insert(userActivityLogs).values({
      userId: newUser.id,
      action: "user_created",
      entityType: "user",
      entityId: newUser.id,
      details: { createdBy: "admin" },
    });

    const { password: _, ...userData } = newUser;
    res.json(userData);
  } catch (error) {
    console.error("Error creating team member:", error);
    res.status(500).json({ error: error || "Failed to create team member" });
  }
});


// Update team member
router.put(
  "/members/:id",requireAuth,
  validateRequest(updateUserSchema),
  async (req, res) => {
    console.log("Update member called") 
    try {
      const { id } = req.params;
      const updates = req.body;

      console.log("Updates : ===> " , updates)

      const [member] = await db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }

      // Log activity
      await db.insert(userActivityLogs).values({
        userId: id,
        action: "user_updated",
        entityType: "user",
        entityId: id,
        details: { updates },
      });

      // Remove password from response
      const { password, ...memberData } = member;
      res.json(memberData);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  }
);

// Update team member status
router.patch(
  "/members/:id/status",requireAuth,
  requirePermission(PERMISSIONS.TEAM_EDIT),
  validateRequest(updateStatusSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const [member] = await db
        .update(users)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }

      // Log activity
      await db.insert(userActivityLogs).values({
        userId: id,
        action: "status_changed",
        entityType: "user",
        entityId: id,
        details: { newStatus: status },
      });

      // Remove password from response
      const { password, ...memberData } = member;
      res.json(memberData);
    } catch (error) {
      console.error("Error updating team member status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  }
);

// Update user password
router.patch(
  "/members/:id/password",requireAuth,
  validateRequest(updatePasswordSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Get user to verify current password
      const [user] = await db.select().from(users).where(eq(users.id, id));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));

      // Log activity
      await db.insert(userActivityLogs).values({
        userId: id,
        action: "password_changed",
        entityType: "user",
        entityId: id,
        details: {},
      });

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  }
);

// Delete team member
router.delete("/members/:id",requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting the last admin
    const [adminCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, "admin"), ne(users.id, id)));

    const [userToDelete] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, id));

    if (userToDelete?.role === "admin" && adminCount.count === 0) {
      return res.status(400).json({
        error: "Cannot delete the last admin user",
      });
    }

    console.log("userToDelete" , userToDelete)

    // Check if user has active assignments
    const [hasAssignments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversationAssignments)
      .where(
        and(
          eq(conversationAssignments.userId, id),
          eq(conversationAssignments.status, "active")
        )
      );

      // console.log("NEW RES")

    if (hasAssignments && hasAssignments.count > 0) {
      return res.status(400).json({
        error: "Cannot delete user with active conversation assignments",
      });
    }

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Get team activity logs
router.get("/activity-logs", async (req, res) => {
  try {
    const logs = await db
      .select({
        id: userActivityLogs.id,
        userId: userActivityLogs.userId,
        userName: users.username,
        userEmail: users.email,
        action: userActivityLogs.action,
        entityType: userActivityLogs.entityType,
        entityId: userActivityLogs.entityId,
        details: userActivityLogs.details,
        ipAddress: userActivityLogs.ipAddress,
        userAgent: userActivityLogs.userAgent,
        createdAt: userActivityLogs.createdAt,
      })
      .from(userActivityLogs)
      .leftJoin(users, eq(userActivityLogs.userId, users.id))
      .orderBy(desc(userActivityLogs.createdAt))
      .limit(100);

    res.json(logs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

// Update member permissions
router.patch("/members/:id/permissions",requireAuth,
requirePermission(PERMISSIONS.TEAM_PERMISSIONS), async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const [member] = await db
      .update(users)
      .set({
        permissions,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!member) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log activity
    await db.insert(userActivityLogs).values({
      userId: id,
      action: "permissions_updated",
      entityType: "user",
      entityId: id,
      details: { permissions },
    });

    // Remove password from response
    const { password, ...memberData } = member;
    res.json(memberData);
  } catch (error) {
    console.error("Error updating permissions:", error);
    res.status(500).json({ error: "Failed to update permissions" });
  }
});

export default router;
