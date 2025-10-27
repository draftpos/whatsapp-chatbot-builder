import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { 
  campaigns, 
  type Campaign, 
  type InsertCampaign 
} from "@shared/schema";

export class CampaignRepository {
  async getAll(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getByChannel(channelId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.channelId, channelId))
      .orderBy(desc(campaigns.createdAt));
  }

  async getById(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async create(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values({
        ...insertCampaign,
        contactGroups: (insertCampaign.contactGroups || []) as string[],
      })
      .returning();
    return campaign;
  }
  

  async update(id: string, campaign: Partial<Campaign>): Promise<Campaign | undefined> {
    const [updated] = await db
      .update(campaigns)
      .set(campaign)
      .where(eq(campaigns.id, id))
      .returning();
    return updated || undefined;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id)).returning();
    return result.length > 0;
  }
}