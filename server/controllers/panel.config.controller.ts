import { Request, Response } from "express";
import {
  createPanelConfig,
  getPanelConfigs,
  getPanelConfigById,
  updatePanelConfig,
  deletePanelConfig,
  getFirstPanelConfig,
  updateFirstPanelConfig,
} from "../services/panel.config";
import { z } from "zod";
import path from "path";
import fs from "fs";

export const panelConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tagline: z.string().optional(),
  description: z.string().optional(),
  companyName: z.string().optional(),
  companyWebsite: z.string().url().optional().or(z.literal("")),
  supportEmail: z.string().email().optional().or(z.literal("")),
  defaultLanguage: z.string().length(2).default("en"),
  supportedLanguages: z.array(z.string()).default(["en"]),
});

export const brandSettingsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  tagline: z.string().optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
});


interface ParsedPanelConfig extends Partial<{
    name: string;
    description: string;
    tagline: string;
    defaultLanguage: string;
    supportedLanguages: string[];
    companyName: string;
    companyWebsite: string;
    supportEmail: string;
    logo: string;
    favicon: string;
  }> {}

// Helper function to process base64 images
const processBase64Image = async (base64Data: string, type: 'logo' | 'favicon'): Promise<string | null> => {
  if (!base64Data || !base64Data.includes('base64,')) {
    return base64Data; // Return as-is if not base64
  }

  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }

    const mimeType = matches[1];
    const data = matches[2];
    
    // Determine file extension
    let extension = 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      extension = 'jpg';
    } else if (mimeType.includes('svg')) {
      extension = 'svg';
    } else if (mimeType.includes('icon') || type === 'favicon') {
      extension = 'ico';
    }

    // Create filename
    const filename = `${type}-${Date.now()}.${extension}`;
    const uploadPath = path.join(process.cwd(), 'uploads', filename);
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(uploadPath, data, 'base64');
    
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error processing base64 image:', error);
    return null;
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const parsed = panelConfigSchema.parse(req.body);

    const data = {
      ...parsed,
      logo: (req.files as any)?.logo?.[0]?.filename,
      favicon: (req.files as any)?.favicon?.[0]?.filename,
    };

    const config = await createPanelConfig(data);
    res.status(201).json(config);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
};

export const getAll = async (_req: Request, res: Response) => {
  try {
    const configs = await getPanelConfigs();
    res.json(configs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const config = await getPanelConfigById(req.params.id);
    if (!config) return res.status(404).json({ message: "Not found" });
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
    try {
      // Parse and type as ParsedPanelConfig
      const parsed: ParsedPanelConfig = panelConfigSchema.partial().parse(req.body);
  
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  
      const data: ParsedPanelConfig = {
        ...parsed,
        logo: files?.logo?.[0]?.filename || parsed.logo,
        favicon: files?.favicon?.[0]?.filename || parsed.favicon,
      };

    const config = await updatePanelConfig(req.params.id, data);
    if (!config) return res.status(404).json({ message: "Not found" });
    res.json(config);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await deletePanelConfig(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Brand Settings endpoints (for frontend compatibility)
export const getBrandSettings = async (_req: Request, res: Response) => {
  try {
    const config = await getFirstPanelConfig();
    
    if (!config) {
      // Return default settings if no config exists
      return res.json({
        title: "Your App Name",
        tagline: "Building amazing experiences",
        logo: "",
        favicon: "",
        updatedAt: new Date().toISOString(),
      });
    }

    // Transform panel config to brand settings format
    const brandSettings = {
      title: config.name || "Your App Name",
      tagline: config.tagline || "",
      logo: config.logo ? `/uploads/${config.logo}` : "",
      favicon: config.favicon ? `/uploads/${config.favicon}` : "",
      updatedAt: config.updatedAt?.toISOString() || new Date().toISOString(),
    };

    res.json(brandSettings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBrandSettings = async (req: Request, res: Response) => {
    try {
      console.log("Parsed Body:", req.body);
      console.log("Parsed Files:", req.files);
  
      const parsed = brandSettingsSchema.parse(req.body);
  
      let logoPath: string | undefined;
      let faviconPath: string | undefined;
  
      // Case 1: multer files (actual uploads)
      if (req.files && (req.files as any).logo) {
        const logoFile = (req.files as any).logo[0];
        logoPath = logoFile.path;
      } else if (parsed.logo && parsed.logo.includes("base64,")) {
        // Case 2: base64 fallback
        logoPath = (await processBase64Image(parsed.logo, 'logo')) ?? undefined;
      }
  
      if (req.files && (req.files as any).favicon) {
        const faviconFile = (req.files as any).favicon[0];
        faviconPath = faviconFile.path;
      } else if (parsed.favicon && parsed.favicon.includes("base64,")) {
        faviconPath =  (await processBase64Image(parsed.favicon, "favicon")) ?? undefined;
      }
  
      const panelData = {
        name: parsed.title,
        tagline: parsed.tagline || "",
        logo: logoPath ? path.basename(logoPath) : undefined,
        favicon: faviconPath ? path.basename(faviconPath) : undefined,
      };
  
      const config = await updateFirstPanelConfig(panelData);
  
      const brandSettings = {
        title: config.name || parsed.title,
        tagline: config.tagline || "",
        logo: config.logo ? `/uploads/${config.logo}` : "",
        favicon: config.favicon ? `/uploads/${config.favicon}` : "",
        updatedAt: config.updatedAt?.toISOString() || new Date().toISOString(),
      };
  
      res.json(brandSettings);
    } catch (err: any) {
      res.status(400).json({ error: err.errors || err.message });
    }
  };
  

export const createBrandSettings = async (req: Request, res: Response) => {
  try {

    console.log("Creating Brand Settings with data:", req.body);
    const parsed = brandSettingsSchema.parse(req.body);

    // Process base64 images if present
    let logoPath = parsed.logo;
    let faviconPath = parsed.favicon;

    if (parsed.logo && parsed.logo.includes('base64,')) {
        logoPath = (await processBase64Image(parsed.logo, 'logo')) ?? undefined;
      }
      
      if (parsed.favicon && parsed.favicon.includes('base64,')) {
        faviconPath = (await processBase64Image(parsed.favicon, 'favicon')) ?? undefined;
      }

    // Transform brand settings to panel config format
    const panelData = {
      name: parsed.title,
      tagline: parsed.tagline || "",
      description: "",
      companyName: "",
      companyWebsite: "",
      supportEmail: "",
      defaultLanguage: "en",
      supportedLanguages: ["en"],
      logo: logoPath ? path.basename(logoPath) : undefined,
      favicon: faviconPath ? path.basename(faviconPath) : undefined,
    };

    const config = await createPanelConfig(panelData);
    
    // Return in brand settings format
    const brandSettings = {
      title: config.name || parsed.title,
      tagline: config.tagline || "",
      logo: config.logo ? `/uploads/${config.logo}` : "",
      favicon: config.favicon ? `/uploads/${config.favicon}` : "",
      updatedAt: config.updatedAt?.toISOString() || new Date().toISOString(),
    };

    res.status(201).json(brandSettings);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
};