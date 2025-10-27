import type { Express } from "express";
import * as contactsController from "../controllers/contacts.controller";
import { validateRequest } from "../middlewares/validation.middleware";
import { insertContactSchema , PERMISSIONS } from "@shared/schema";
import { extractChannelId } from "../middlewares/channel.middleware";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";

export function registerContactRoutes(app: Express) {
  // Get all contacts
  app.get("/api/contacts-all", 
  requireAuth,
  requirePermission(PERMISSIONS.CONTACTS_VIEW),
    extractChannelId,
    contactsController.getContacts
  );

  app.get("/api/contacts", 
  requireAuth,
  requirePermission(PERMISSIONS.CONTACTS_VIEW),
    extractChannelId,
    contactsController.getContactsWithPagination
  );

  // Get single contact
  app.get("/api/contacts/:id", requireAuth,
  requirePermission(PERMISSIONS.CONTACTS_VIEW), contactsController.getContact);

  // Create contact
  app.post("/api/contacts",
    extractChannelId, requireAuth,
    requirePermission(PERMISSIONS.CONTACTS_CREATE),
    validateRequest(insertContactSchema),
    contactsController.createContact
  );

  // Update contact
  app.put(
    "/api/contacts/:id",
    requireAuth,
    requirePermission(PERMISSIONS.CONTACTS_EDIT),
    contactsController.updateContact
  );

  // Delete contact
  app.delete(
    "/api/contacts/:id",
    requireAuth,
    requirePermission(PERMISSIONS.CONTACTS_DELETE),
    contactsController.deleteContact
  );

  // Delete Bulk contact
  app.delete(
    "/api/contacts-bulk",
    requireAuth,
    requirePermission(PERMISSIONS.CONTACTS_DELETE),
    contactsController.deleteBulkContacts
  );

  // Import contacts
  app.post(
    "/api/contacts/import",
    requireAuth,
    requirePermission(PERMISSIONS.CONTACTS_EXPORT), // or CONTACTS_IMPORT if you defined it
    extractChannelId,
    contactsController.importContacts
  );
}