import { sql } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, integer, decimal, boolean, jsonb, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const agencies = pgTable("agencies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  logo: text("logo"),
  website: text("website"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  licenseNumber: text("license_number"),
  licenseExpiry: date("license_expiry"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  status: text("status").default("active"),
  ownerId: uuid("owner_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  role: text("role").default("renter"),
  profileImage: text("profile_image"),
  bio: text("bio"),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
  licenseNumber: text("license_number"),
  licenseState: text("license_state"),
  licenseExpiry: date("license_expiry"),
  licenseVerified: boolean("license_verified").default(false),
  specialties: jsonb("specialties").$type<string[]>(),
  yearsExperience: integer("years_experience"),
  totalSales: integer("total_sales").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").default(0),
  location: text("location"),
  isManagedProfile: boolean("is_managed_profile").default(false),
  managedBy: uuid("managed_by"),
  displayEmail: text("display_email"),
  displayPhone: text("display_phone"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorBackupCodes: jsonb("two_factor_backup_codes").$type<string[]>(),
  lastLoginAt: timestamp("last_login_at"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
  listingAgentId: uuid("listing_agent_id").references(() => users.id, { onDelete: "set null" }),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  price: decimal("price", { precision: 12, scale: 2 }),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  squareFeet: integer("square_feet"),
  propertyType: text("property_type"),
  amenities: jsonb("amenities"),
  images: jsonb("images"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  furnished: boolean("furnished").default(false),
  petsAllowed: boolean("pets_allowed").default(false),
  leaseTerm: text("lease_term"),
  utilitiesIncluded: jsonb("utilities_included"),
  status: text("status").default("active"),
  listedAt: timestamp("listed_at"),
  soldAt: timestamp("sold_at"),
  soldPrice: decimal("sold_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Application status workflow: draft -> pending -> under_review -> approved/rejected/expired
// Valid transitions: draft->pending, pending->under_review, under_review->approved/rejected, pending->expired
export const APPLICATION_STATUSES = [
  "draft",
  "pending", 
  "under_review",
  "pending_verification",
  "approved",
  "approved_pending_lease",
  "rejected",
  "withdrawn",
  "expired"
] as const;

export const REJECTION_CATEGORIES = [
  "income_insufficient",
  "credit_issues",
  "background_check_failed",
  "rental_history_issues",
  "incomplete_application",
  "missing_documents",
  "verification_failed",
  "other"
] as const;

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  step: integer("step").default(0),
  personalInfo: jsonb("personal_info"),
  rentalHistory: jsonb("rental_history"),
  employment: jsonb("employment"),
  references: jsonb("references"),
  disclosures: jsonb("disclosures"),
  documents: jsonb("documents"),
  status: text("status").default("draft"),
  previousStatus: text("previous_status"),
  statusHistory: jsonb("status_history").$type<Array<{
    status: string;
    changedAt: string;
    changedBy: string;
    reason?: string;
  }>>(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  // Scoring
  score: integer("score"),
  scoreBreakdown: jsonb("score_breakdown").$type<{
    incomeScore: number;
    creditScore: number;
    rentalHistoryScore: number;
    employmentScore: number;
    documentsScore: number;
    totalScore: number;
    maxScore: number;
    flags: string[];
  }>(),
  scoredAt: timestamp("scored_at"),
  // Rejection
  rejectionCategory: text("rejection_category"),
  rejectionReason: text("rejection_reason"),
  rejectionDetails: jsonb("rejection_details").$type<{
    categories: string[];
    explanation: string;
    appealable: boolean;
  }>(),
  // Documents
  requiredDocuments: jsonb("required_documents").$type<string[]>(),
  documentStatus: jsonb("document_status").$type<Record<string, {
    uploaded: boolean;
    verified: boolean;
    verifiedAt?: string;
    verifiedBy?: string;
    notes?: string;
  }>>(),
  // Expiration
  expiresAt: timestamp("expires_at"),
  expiredAt: timestamp("expired_at"),
  // Application fee
  applicationFee: decimal("application_fee", { precision: 8, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  userPropertyUnique: unique().on(table.userId, table.propertyId),
}));

// Co-applicants for multiple people on one application
export const coApplicants = pgTable("co_applicants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  relationship: text("relationship"), // spouse, roommate, family, etc.
  personalInfo: jsonb("personal_info"),
  employment: jsonb("employment"),
  income: decimal("income", { precision: 12, scale: 2 }),
  status: text("status").default("pending"), // pending, verified, rejected
  invitedAt: timestamp("invited_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Application comments for internal notes and tracking
export const applicationComments = pgTable("application_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  commentType: text("comment_type").default("note"), // note, decision, verification, flag
  isInternal: boolean("is_internal").default(true), // internal notes vs. applicant-visible
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Application notifications for tracking sent notifications
export const applicationNotifications = pgTable("application_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  notificationType: text("notification_type").notNull(), // status_change, document_request, reminder, expiration_warning
  channel: text("channel").default("email"), // email, in_app, sms
  subject: text("subject"),
  content: text("content"),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  status: text("status").default("pending"), // pending, sent, failed, read
  createdAt: timestamp("created_at").defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: uuid("agent_id").references(() => users.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderPhone: text("sender_phone"),
  message: text("message"),
  inquiryType: text("inquiry_type"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const requirements = pgTable("requirements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  budgetMin: decimal("budget_min", { precision: 10, scale: 2 }),
  budgetMax: decimal("budget_max", { precision: 10, scale: 2 }),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  propertyType: jsonb("property_type"),
  locations: jsonb("locations"),
  amenities: jsonb("amenities"),
  pets: jsonb("pets"),
  leaseTerm: text("lease_term"),
  moveInDate: date("move_in_date"),
  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating"),
  title: text("title"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  userPropertyUnique: unique().on(table.userId, table.propertyId),
}));

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userPropertyUnique: unique().on(table.userId, table.propertyId),
}));

export const savedSearches = pgTable("saved_searches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  filters: jsonb("filters").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminSettings = pgTable("admin_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const AUDIT_ACTIONS = [
  "create", "update", "delete", "view", "login", "logout", 
  "2fa_enable", "2fa_disable", "2fa_verify", "password_change",
  "role_change", "status_change", "document_upload", "document_verify",
  "application_review", "application_approve", "application_reject"
] as const;

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id"),
  previousData: jsonb("previous_data"),
  newData: jsonb("new_data"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sensitiveData = pgTable("sensitive_data", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  dataType: text("data_type").notNull(),
  encryptedValue: text("encrypted_value").notNull(),
  encryptionKeyId: text("encryption_key_id"),
  accessedBy: jsonb("accessed_by").$type<Array<{ userId: string; accessedAt: string; reason: string }>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ALLOWED_FILE_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const uploadedFiles = pgTable("uploaded_files", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  storagePath: text("storage_path").notNull(),
  checksum: text("checksum"),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: uuid("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSensitiveDataSchema = createInsertSchema(sensitiveData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  createdAt: true,
  isVerified: true,
  verifiedBy: true,
  verifiedAt: true,
});

export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AuditAction = typeof AUDIT_ACTIONS[number];

export type InsertSensitiveData = z.infer<typeof insertSensitiveDataSchema>;
export type SensitiveData = typeof sensitiveData.$inferSelect;

export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type AllowedFileType = typeof ALLOWED_FILE_TYPES[number];

export const TRANSACTION_TYPES = ["sale", "lease", "referral"] as const;
export const TRANSACTION_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
  agentId: uuid("agent_id").references(() => users.id, { onDelete: "set null" }),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
  buyerId: uuid("buyer_id").references(() => users.id, { onDelete: "set null" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  transactionType: text("transaction_type").default("lease"),
  transactionAmount: decimal("transaction_amount", { precision: 12, scale: 2 }),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }),
  agentSplit: decimal("agent_split", { precision: 5, scale: 2 }),
  agentCommission: decimal("agent_commission", { precision: 12, scale: 2 }),
  agencyCommission: decimal("agency_commission", { precision: 12, scale: 2 }),
  status: text("status").default("pending"),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agentReviews = pgTable("agent_reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: uuid("agent_id").references(() => users.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "cascade" }),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(),
  title: text("title"),
  comment: text("comment"),
  wouldRecommend: boolean("would_recommend").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  reviewerAgentUnique: unique().on(table.reviewerId, table.agentId),
}));

// Conversations for messaging between users (related to properties or applications)
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  subject: text("subject"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Participants in a conversation
export const conversationParticipants = pgTable("conversation_participants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  conversationUserUnique: unique().on(table.conversationId, table.userId),
}));

// Messages within conversations
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, system, attachment
  attachments: jsonb("attachments").$type<string[]>(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgencySchema = createInsertSchema(agencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  reviewedBy: true,
  reviewedAt: true,
  score: true,
  scoreBreakdown: true,
  scoredAt: true,
  rejectionCategory: true,
  rejectionReason: true,
  rejectionDetails: true,
  expiredAt: true,
  statusHistory: true,
  previousStatus: true,
});

export const insertCoApplicantSchema = createInsertSchema(coApplicants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  invitedAt: true,
  respondedAt: true,
});

export const insertApplicationCommentSchema = createInsertSchema(applicationComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationNotificationSchema = createInsertSchema(applicationNotifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  readAt: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const insertRequirementSchema = createInsertSchema(requirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertSavedSearchSchema = createInsertSchema(savedSearches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  subscribedAt: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
  read: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
});

export const insertAgentReviewSchema = createInsertSchema(agentReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({
  id: true,
  createdAt: true,
  lastReadAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  readAt: true,
});

export type InsertAgency = z.infer<typeof insertAgencySchema>;
export type Agency = typeof agencies.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

export type InsertCoApplicant = z.infer<typeof insertCoApplicantSchema>;
export type CoApplicant = typeof coApplicants.$inferSelect;

export type InsertApplicationComment = z.infer<typeof insertApplicationCommentSchema>;
export type ApplicationComment = typeof applicationComments.$inferSelect;

export type InsertApplicationNotification = z.infer<typeof insertApplicationNotificationSchema>;
export type ApplicationNotification = typeof applicationNotifications.$inferSelect;

export type ApplicationStatus = typeof APPLICATION_STATUSES[number];
export type RejectionCategory = typeof REJECTION_CATEGORIES[number];

export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;

export type InsertRequirement = z.infer<typeof insertRequirementSchema>;
export type Requirement = typeof requirements.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;
export type SavedSearch = typeof savedSearches.$inferSelect;

export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type TransactionType = typeof TRANSACTION_TYPES[number];
export type TransactionStatus = typeof TRANSACTION_STATUSES[number];

export type InsertAgentReview = z.infer<typeof insertAgentReviewSchema>;
export type AgentReview = typeof agentReviews.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  // Password requirements: 8+ characters, at least one uppercase letter, at least one number
  // These same requirements are displayed as hints on the login form for consistency
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string()
    // Accepts international phone numbers with optional + prefix, country code, and flexible formatting
    // Examples: +1 555-123-4567, 555.123.4567, (555) 123-4567, +44 20 7946 0958, +81-90-1234-5678
    .regex(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  role: z.enum(['renter', 'buyer', 'landlord', 'property_manager', 'agent']).optional().default('renter'),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  // Note: Login schema only validates that password is not empty.
  // Password format requirements are enforced at signup and displayed as a UX hint on login form.
  // The actual password validation happens server-side via Supabase auth.
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
