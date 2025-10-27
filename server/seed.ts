import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

interface User {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  permissions: string[];
}

async function seed() {
  try {
    console.log("Seeding database...");

    // Helper to create user if not exists
    async function createUserIfNotExists({ username, password, email, firstName, lastName, role, status, permissions }: User) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (existingUser) {
        console.log(`User '${username}' already exists`);
        return existingUser;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          email,
          firstName,
          lastName,
          role,
          status,
          permissions,
        })
        .returning();

      console.log(`✅ User '${username}' created successfully`);
      return newUser;
    }

    // Default permissions
    const defaultPermissions = [
      // Contacts
      'contacts:view',
      'contacts:create',
      'contacts:edit',
      'contacts:delete',
      'contacts:export',

      // Campaigns
      'campaigns:view',
      'campaigns:create',
      'campaigns:edit',
      'campaigns:delete',

      // Templates
      'templates:view',
      'templates:create',
      'templates:edit',
      'templates:delete',

      // Analytics
      'analytics:view',

      // Team
      'team:view',
      'team:create',
      'team:edit',
      'team:delete',

      // Settings
      'settings:view',

      // Inbox
      'inbox:view',
      'inbox:send',
      'inbox:assign',

      // Automations
      'automations:view',
      'automations:create',
      'automations:edit',
      'automations:delete',
    ];

    // Create Admin
    const adminUser = await createUserIfNotExists({
      username: "whatsway",
      password: "Admin@123",
      email: "admin@whatsway.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      status: "active",
      permissions: defaultPermissions,
    });

    // Create Demo User
    const demoUser = await createUserIfNotExists({
      username: "demouser",
      password: "Demo@12345",
      email: "demo@whatsway.com",
      firstName: "Demo",
      lastName: "User",
      role: "user",
      status: "active",
      permissions: ['contacts:view', 'campaigns:view', 'templates:view', 'analytics:view', 'inbox:view'],
    });

    console.log("\n=== Default Users Created ===");
    console.log("Admin:");
    console.log("  Username: whatsway");
    console.log("  Password: Admin@123");
    console.log("Demo:");
    console.log("  Username: demouser");
    console.log("  Password: Demo@12345");
    console.log("\n⚠️  Please change passwords after first login!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run seed function
seed()
  .then(() => {
    console.log("✅ Seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
