import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { 
  templates, 
  type Template, 
  type InsertTemplate 
} from "@shared/schema";

export class TemplateRepository {
  async getAll(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(desc(templates.createdAt));
  }

  async getByChannel(channelId: string): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .where(eq(templates.channelId, channelId))
      .orderBy(desc(templates.createdAt));
  }

  async getById(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async getByName(name: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.name, name));
    return template || undefined;
  }

  async create(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async update(id: string, template: Partial<Template>): Promise<Template | undefined> {
    const [updated] = await db
      .update(templates)
      .set(template)
      .where(eq(templates.id, id))
      .returning();
    return updated || undefined;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id)).returning();
    return result.length > 0;
  }
}