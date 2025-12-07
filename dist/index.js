// server/index-prod.ts
import fs from "node:fs";
import path from "node:path";
import express2 from "express";

// server/app.ts
import express from "express";
import cors from "cors";

// server/routes.ts
import { createServer } from "http";

// server/supabase.ts
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
}
var supabase = createClient(supabaseUrl, supabaseServiceKey);

// server/auth-middleware.ts
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
    req.user = {
      id: user.id,
      email: user.email || "",
      role: userData?.role || "user"
    };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return next();
  }
  supabase.auth.getUser(token).then(async ({ data: { user }, error }) => {
    if (!error && user) {
      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
      req.user = {
        id: user.id,
        email: user.email || "",
        role: userData?.role || "user"
      };
    }
    next();
  }).catch(() => next());
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// server/email.ts
import sgMail from "@sendgrid/mail";
var SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}
async function sendEmail({
  to,
  subject,
  html,
  from = "noreply@choiceproperties.com"
}) {
  if (!SENDGRID_API_KEY) {
    console.log(
      "\u{1F4E7} Mock email sent to:",
      to,
      "Subject:",
      subject
    );
    return { success: true, mock: true };
  }
  try {
    await sgMail.send({
      to,
      from,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    console.error("\u274C Email error:", error);
    return { success: false, error };
  }
}
function getAgentInquiryEmailTemplate(data) {
  return `
    <h2>New Inquiry from Choice Properties</h2>
    <p><strong>From:</strong> ${data.senderName}</p>
    <p><strong>Email:</strong> ${data.senderEmail}</p>
    <p><strong>Phone:</strong> ${data.senderPhone}</p>
    ${data.propertyTitle ? `<p><strong>Property:</strong> ${data.propertyTitle}</p>` : ""}
    <p><strong>Message:</strong></p>
    <p>${data.message}</p>
    <p>Please reply to ${data.senderEmail} to respond.</p>
  `;
}
function getApplicationConfirmationEmailTemplate(data) {
  return `
    <h2>Application Received!</h2>
    <p>Hi ${data.applicantName},</p>
    <p>We've received your application for <strong>${data.propertyTitle}</strong>.</p>
    <p>Your application is currently under review. You'll hear from us within 3-5 business days.</p>
    <p>Best regards,<br>Choice Properties Team</p>
  `;
}

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, integer, decimal, boolean, jsonb, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  role: text("role").default("user"),
  profileImage: text("profile_image"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var properties = pgTable("properties", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
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
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var applications = pgTable("applications", {
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
  status: text("status").default("pending"),
  applicationFee: decimal("application_fee", { precision: 8, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var inquiries = pgTable("inquiries", {
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
  updatedAt: timestamp("updated_at").defaultNow()
});
var requirements = pgTable("requirements", {
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
  updatedAt: timestamp("updated_at").defaultNow()
});
var reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating"),
  title: text("title"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  userPropertyUnique: unique().on(table.userId, table.propertyId)
}));
var savedSearches = pgTable("saved_searches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  filters: jsonb("filters").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow()
});
var contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertRequirementSchema = createInsertSchema(requirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true
});
var insertSavedSearchSchema = createInsertSchema(savedSearches).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  subscribedAt: true
});
var insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
  read: true
});
var signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required")
});
var loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

// server/routes.ts
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const validation = signupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { email, password, fullName } = validation.data;
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name: fullName }
      });
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      res.json({ success: true, user: data.user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { email, password } = validation.data;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        return res.status(401).json({ error: error.message });
      }
      res.json({ success: true, session: data.session });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/auth/logout", async (req, res) => {
    try {
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", req.user.id).single();
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/properties", async (req, res) => {
    try {
      const { propertyType, city, minPrice, maxPrice, status } = req.query;
      let query = supabase.from("properties").select("*");
      if (propertyType) query = query.eq("property_type", propertyType);
      if (city) query = query.ilike("city", `%${city}%`);
      if (minPrice) query = query.gte("price", minPrice);
      if (maxPrice) query = query.lte("price", maxPrice);
      if (status) {
        query = query.eq("status", status);
      } else {
        query = query.eq("status", "active");
      }
      const { data, error } = await query;
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/properties/:id", async (req, res) => {
    try {
      const { data, error } = await supabase.from("properties").select("*").eq("id", req.params.id).single();
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/properties", authenticateToken, async (req, res) => {
    try {
      const validation = insertPropertySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const propertyData = {
        ...validation.data,
        owner_id: req.user.id
      };
      const { data, error } = await supabase.from("properties").insert([propertyData]).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.patch("/api/properties/:id", authenticateToken, async (req, res) => {
    try {
      const { data: existingProperty } = await supabase.from("properties").select("owner_id").eq("id", req.params.id).single();
      if (!existingProperty) {
        return res.status(404).json({ error: "Property not found" });
      }
      if (existingProperty.owner_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to update this property" });
      }
      const { data, error } = await supabase.from("properties").update({ ...req.body, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/properties/:id", authenticateToken, async (req, res) => {
    try {
      const { data: existingProperty } = await supabase.from("properties").select("owner_id").eq("id", req.params.id).single();
      if (!existingProperty) {
        return res.status(404).json({ error: "Property not found" });
      }
      if (existingProperty.owner_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to delete this property" });
      }
      const { error } = await supabase.from("properties").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/properties/user/:userId", authenticateToken, async (req, res) => {
    try {
      if (req.params.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error } = await supabase.from("properties").select("*").eq("owner_id", req.params.userId);
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/applications", authenticateToken, async (req, res) => {
    try {
      const validation = insertApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const applicationData = {
        ...validation.data,
        user_id: req.user.id
      };
      const { data, error } = await supabase.from("applications").insert([applicationData]).select();
      if (error) throw error;
      const { data: userData } = await supabase.from("users").select("email, full_name").eq("id", req.user.id).single();
      const { data: propertyData } = await supabase.from("properties").select("title").eq("id", validation.data.propertyId).single();
      if (userData?.email) {
        await sendEmail({
          to: userData.email,
          subject: "Your Application Has Been Received",
          html: getApplicationConfirmationEmailTemplate({
            applicantName: userData.full_name || "Applicant",
            propertyTitle: propertyData?.title || "Your Property"
          })
        });
      }
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/applications/user/:userId", authenticateToken, async (req, res) => {
    try {
      if (req.params.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error } = await supabase.from("applications").select("*, properties(*)").eq("user_id", req.params.userId);
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/applications/property/:propertyId", authenticateToken, async (req, res) => {
    try {
      const { data: property } = await supabase.from("properties").select("owner_id").eq("id", req.params.propertyId).single();
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      if (property.owner_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error } = await supabase.from("applications").select("*, users(id, full_name, email, phone)").eq("property_id", req.params.propertyId);
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.patch("/api/applications/:id", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("user_id, property_id").eq("id", req.params.id).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const { data: property } = await supabase.from("properties").select("owner_id").eq("id", application.property_id).single();
      const isOwner = application.user_id === req.user.id;
      const isPropertyOwner = property?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isOwner && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error } = await supabase.from("applications").update({ ...req.body, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/inquiries", async (req, res) => {
    try {
      const validation = insertInquirySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data, error } = await supabase.from("inquiries").insert([validation.data]).select();
      if (error) throw error;
      if (validation.data.agentId) {
        const { data: agentData } = await supabase.from("users").select("email").eq("id", validation.data.agentId).single();
        if (agentData?.email) {
          await sendEmail({
            to: agentData.email,
            subject: "New Inquiry Received",
            html: getAgentInquiryEmailTemplate({
              senderName: validation.data.senderName,
              senderEmail: validation.data.senderEmail,
              senderPhone: validation.data.senderPhone || "",
              message: validation.data.message || ""
            })
          });
        }
      }
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/inquiries/agent/:agentId", authenticateToken, async (req, res) => {
    try {
      if (req.params.agentId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error } = await supabase.from("inquiries").select("*, properties(id, title, address)").eq("agent_id", req.params.agentId).order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.patch("/api/inquiries/:id", authenticateToken, async (req, res) => {
    try {
      const { data: inquiry } = await supabase.from("inquiries").select("agent_id").eq("id", req.params.id).single();
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      if (inquiry.agent_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error } = await supabase.from("inquiries").update({ ...req.body, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/requirements", optionalAuth, async (req, res) => {
    try {
      const validation = insertRequirementSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const requirementData = {
        ...validation.data,
        user_id: req.user?.id || null
      };
      const { data, error } = await supabase.from("requirements").insert([requirementData]).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/requirements/user/:userId", authenticateToken, async (req, res) => {
    try {
      if (req.params.userId !== req.user.id && req.user.role !== "admin" && req.user.role !== "agent") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error } = await supabase.from("requirements").select("*").eq("user_id", req.params.userId);
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/requirements", authenticateToken, requireRole("admin", "agent"), async (req, res) => {
    try {
      const { data, error } = await supabase.from("requirements").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/favorites", authenticateToken, async (req, res) => {
    try {
      const validation = insertFavoriteSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const favoriteData = {
        ...validation.data,
        user_id: req.user.id
      };
      const { data, error } = await supabase.from("favorites").insert([favoriteData]).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/favorites/:id", authenticateToken, async (req, res) => {
    try {
      const { data: favorite } = await supabase.from("favorites").select("user_id").eq("id", req.params.id).single();
      if (!favorite) {
        return res.status(404).json({ error: "Favorite not found" });
      }
      if (favorite.user_id !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { error } = await supabase.from("favorites").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/favorites/user/:userId", authenticateToken, async (req, res) => {
    try {
      if (req.params.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error } = await supabase.from("favorites").select("*, properties(*)").eq("user_id", req.params.userId);
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/reviews/property/:propertyId", async (req, res) => {
    try {
      const { data, error } = await supabase.from("reviews").select("*, users(id, full_name, profile_image)").eq("property_id", req.params.propertyId).order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/reviews", authenticateToken, async (req, res) => {
    try {
      const validation = insertReviewSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const reviewData = {
        ...validation.data,
        user_id: req.user.id
      };
      const { data, error } = await supabase.from("reviews").insert([reviewData]).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.patch("/api/reviews/:id", authenticateToken, async (req, res) => {
    try {
      const { data: review } = await supabase.from("reviews").select("user_id").eq("id", req.params.id).single();
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      if (review.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error } = await supabase.from("reviews").update({ ...req.body, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/reviews/:id", authenticateToken, async (req, res) => {
    try {
      const { data: review } = await supabase.from("reviews").select("user_id").eq("id", req.params.id).single();
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      if (review.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { error } = await supabase.from("reviews").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/users", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { data, error } = await supabase.from("users").select("id, email, full_name, phone, role, profile_image, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.patch("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      if (req.params.id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const allowedFields = ["full_name", "phone", "profile_image", "bio"];
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== void 0) {
          updates[field] = req.body[field];
        }
      }
      if (req.user.role === "admin" && req.body.role !== void 0) {
        updates.role = req.body.role;
      }
      updates.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      const { data, error } = await supabase.from("users").update(updates).eq("id", req.params.id).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/saved-searches", authenticateToken, async (req, res) => {
    try {
      const validation = insertSavedSearchSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const searchData = {
        ...validation.data,
        user_id: req.user.id
      };
      const { data, error } = await supabase.from("saved_searches").insert([searchData]).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/saved-searches/user/:userId", authenticateToken, async (req, res) => {
    try {
      if (req.params.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error } = await supabase.from("saved_searches").select("*").eq("user_id", req.params.userId).order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.patch("/api/saved-searches/:id", authenticateToken, async (req, res) => {
    try {
      const { data: search } = await supabase.from("saved_searches").select("user_id").eq("id", req.params.id).single();
      if (!search) {
        return res.status(404).json({ error: "Saved search not found" });
      }
      if (search.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const updateSchema = insertSavedSearchSchema.partial().pick({ name: true, filters: true });
      const validation = updateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data, error } = await supabase.from("saved_searches").update({ ...validation.data, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/saved-searches/:id", authenticateToken, async (req, res) => {
    try {
      const { data: search } = await supabase.from("saved_searches").select("user_id").eq("id", req.params.id).single();
      if (!search) {
        return res.status(404).json({ error: "Saved search not found" });
      }
      if (search.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { error } = await supabase.from("saved_searches").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const validation = insertNewsletterSubscriberSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data, error } = await supabase.from("newsletter_subscribers").insert([validation.data]).select();
      if (error) {
        if (error.code === "23505") {
          return res.json({ success: true, message: "Already subscribed" });
        }
        throw error;
      }
      res.json({ success: true, message: "Subscribed successfully", data: data[0] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/newsletter/subscribers", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/messages", async (req, res) => {
    try {
      const validation = insertContactMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data, error } = await supabase.from("contact_messages").insert([validation.data]).select();
      if (error) throw error;
      res.json({ success: true, data: data[0] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/messages", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.patch("/api/messages/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { data, error } = await supabase.from("contact_messages").update({ read: req.body.read }).eq("id", req.params.id).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  return httpServer;
}

// server/app.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function runApp(setup) {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  await setup(app, server);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
}

// server/index-prod.ts
async function serveStatic(app2, server) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
(async () => {
  await runApp(serveStatic);
})();
export {
  serveStatic
};
