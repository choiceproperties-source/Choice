import type { Express } from "express";
import { createServer, type Server } from "http";
import { supabase } from "./supabase";
import { authenticateToken, optionalAuth, requireRole, requireOwnership, type AuthenticatedRequest } from "./auth-middleware";
import { success, error } from "./response";
import {
  sendEmail,
  getAgentInquiryEmailTemplate,
  getApplicationConfirmationEmailTemplate,
} from "./email";
import {
  signupSchema,
  loginSchema,
  insertPropertySchema,
  insertApplicationSchema,
  insertInquirySchema,
  insertRequirementSchema,
  insertReviewSchema,
  insertFavoriteSchema,
  insertSavedSearchSchema,
  insertNewsletterSubscriberSchema,
  insertContactMessageSchema,
} from "@shared/schema";
import { authLimiter, signupLimiter, inquiryLimiter, newsletterLimiter } from "./rate-limit";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // ===== AUTHENTICATION =====
  app.post("/api/auth/signup", signupLimiter, async (req, res) => {
    try {
      const validation = signupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { email, password, fullName } = validation.data;

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name: fullName },
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true, user: data.user });
    } catch (err: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { email, password } = validation.data;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      res.json({ success: true, session: data.session });
    } catch (err: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", req.user!.id)
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== PROPERTIES =====
  app.get("/api/properties", async (req, res) => {
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
      return res.json(success(data, "Properties fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch properties"));
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (error) throw error;
      return res.json(success(data, "Property fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch property"));
    }
  });

  app.post("/api/properties", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const validation = insertPropertySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const propertyData = {
        ...validation.data,
        owner_id: req.user!.id,
      };

      const { data, error } = await supabase
        .from("properties")
        .insert([propertyData])
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (err: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/properties/:id", authenticateToken, requireOwnership("property"), async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .select();

      if (error) throw error;
      return res.json(success(data[0], "Property updated successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to update property"));
    }
  });

  app.delete("/api/properties/:id", authenticateToken, requireOwnership("property"), async (req: AuthenticatedRequest, res) => {
    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/properties/user/:userId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.params.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", req.params.userId);

      if (error) throw error;
      return res.json(success(data, "User properties fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch user properties"));
    }
  });

  // ===== APPLICATIONS =====
  app.post("/api/applications", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const validation = insertApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const applicationData = {
        ...validation.data,
        user_id: req.user!.id,
      };

      const { data, error } = await supabase
        .from("applications")
        .insert([applicationData])
        .select();

      if (error) throw error;

      const { data: userData } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("id", req.user!.id)
        .single();

      const { data: propertyData } = await supabase
        .from("properties")
        .select("title")
        .eq("id", validation.data.propertyId)
        .single();

      if (userData?.email) {
        await sendEmail({
          to: userData.email,
          subject: "Your Application Has Been Received",
          html: getApplicationConfirmationEmailTemplate({
            applicantName: userData.full_name || "Applicant",
            propertyTitle: propertyData?.title || "Your Property",
          }),
        });
      }

      return res.json(success(data[0], "Application submitted successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to submit application"));
    }
  });

  app.get("/api/applications/user/:userId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.params.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { data, error } = await supabase
        .from("applications")
        .select("*, properties(*)")
        .eq("user_id", req.params.userId);

      if (error) throw error;
      return res.json(success(data, "User applications fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch user applications"));
    }
  });

  app.get("/api/applications/property/:propertyId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("owner_id")
        .eq("id", req.params.propertyId)
        .single();

      if (propertyError || !property) {
        return res.status(404).json(error("Property not found"));
      }

      if (property.owner_id !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { data, error } = await supabase
        .from("applications")
        .select("*, users(id, full_name, email, phone)")
        .eq("property_id", req.params.propertyId);

      if (error) throw error;
      return res.json(success(data, "Property applications fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch property applications"));
    }
  });

  app.patch("/api/applications/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: application } = await supabase
        .from("applications")
        .select("user_id, property_id")
        .eq("id", req.params.id)
        .single();

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      const { data: property } = await supabase
        .from("properties")
        .select("owner_id")
        .eq("id", application.property_id)
        .single();

      const isOwner = application.user_id === req.user!.id;
      const isPropertyOwner = property?.owner_id === req.user!.id;
      const isAdmin = req.user!.role === "admin";

      if (!isOwner && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { data, error } = await supabase
        .from("applications")
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .select();

      if (error) throw error;
      return res.json(success(data[0], "Application updated successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to update application"));
    }
  });

  // ===== INQUIRIES =====
  app.post("/api/inquiries", inquiryLimiter, async (req, res) => {
    try {
      const validation = insertInquirySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { data, error } = await supabase
        .from("inquiries")
        .insert([validation.data])
        .select();

      if (error) throw error;

      if (validation.data.agentId) {
        const { data: agentData } = await supabase
          .from("users")
          .select("email")
          .eq("id", validation.data.agentId)
          .single();

        if (agentData?.email) {
          await sendEmail({
            to: agentData.email,
            subject: "New Inquiry Received",
            html: getAgentInquiryEmailTemplate({
              senderName: validation.data.senderName,
              senderEmail: validation.data.senderEmail,
              senderPhone: validation.data.senderPhone || "",
              message: validation.data.message || "",
            }),
          });
        }
      }

      return res.json(success(data[0], "Inquiry submitted successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to submit inquiry"));
    }
  });

  app.get("/api/inquiries/agent/:agentId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.params.agentId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { data, error } = await supabase
        .from("inquiries")
        .select("*, properties(id, title, address)")
        .eq("agent_id", req.params.agentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Agent inquiries fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch agent inquiries"));
    }
  });

  app.patch("/api/inquiries/:id", authenticateToken, requireOwnership("inquiry"), async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .select();

      if (error) throw error;
      return res.json(success(data[0], "Inquiry updated successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to update inquiry"));
    }
  });

  // ===== REQUIREMENTS =====
  app.post("/api/requirements", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validation = insertRequirementSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const requirementData = {
        ...validation.data,
        user_id: req.user?.id || null,
      };

      const { data, error } = await supabase
        .from("requirements")
        .insert([requirementData])
        .select();

      if (error) throw error;
      return res.json(success(data[0], "Requirement created successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to create requirement"));
    }
  });

  app.get("/api/requirements/user/:userId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.params.userId !== req.user!.id && req.user!.role !== "admin" && req.user!.role !== "agent") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { data, error } = await supabase
        .from("requirements")
        .select("*")
        .eq("user_id", req.params.userId);

      if (error) throw error;
      return res.json(success(data, "User requirements fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch user requirements"));
    }
  });

  app.get("/api/requirements", authenticateToken, requireRole("admin", "agent"), async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabase
        .from("requirements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Requirements fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch requirements"));
    }
  });

  // ===== FAVORITES =====
  app.post("/api/favorites", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const validation = insertFavoriteSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const favoriteData = {
        ...validation.data,
        user_id: req.user!.id,
      };

      const { data, error } = await supabase
        .from("favorites")
        .insert([favoriteData])
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (err: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/favorites/:id", authenticateToken, requireOwnership("favorite"), async (req: AuthenticatedRequest, res) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/favorites/user/:userId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.params.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { data, error } = await supabase
        .from("favorites")
        .select("*, properties(*)")
        .eq("user_id", req.params.userId);

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== REVIEWS =====
  app.get("/api/reviews/property/:propertyId", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, users(id, full_name, profile_image)")
        .eq("property_id", req.params.propertyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Reviews fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch reviews"));
    }
  });

  app.post("/api/reviews", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const validation = insertReviewSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const reviewData = {
        ...validation.data,
        user_id: req.user!.id,
      };

      const { data, error } = await supabase
        .from("reviews")
        .insert([reviewData])
        .select();

      if (error) throw error;
      return res.json(success(data[0], "Review created successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to create review"));
    }
  });

  app.patch("/api/reviews/:id", authenticateToken, requireOwnership("review"), async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .select();

      if (error) throw error;
      return res.json(success(data[0], "Review updated successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to update review"));
    }
  });

  app.delete("/api/reviews/:id", authenticateToken, requireOwnership("review"), async (req: AuthenticatedRequest, res) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", req.params.id);

      if (error) throw error;
      return res.json(success(null, "Review deleted successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to delete review"));
    }
  });

  // ===== USERS (Admin only) =====
  app.get("/api/users", authenticateToken, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, phone, role, profile_image, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Users fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch users"));
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const { data, error: dbError } = await supabase
        .from("users")
        .select("id, full_name, profile_image, bio")
        .eq("id", req.params.id)
        .single();

      if (dbError || !data) {
        return res.status(404).json(error("User not found"));
      }

      return res.json(success(data, "User fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch user"));
    }
  });

  app.patch("/api/users/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.params.id !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const allowedFields = ["full_name", "phone", "profile_image", "bio"];
      const updates: Record<string, any> = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (req.user!.role === "admin" && req.body.role !== undefined) {
        updates.role = req.body.role;
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", req.params.id)
        .select();

      if (error) throw error;
      return res.json(success(data[0], "User updated successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to update user"));
    }
  });

  // ===== SAVED SEARCHES =====
  app.post("/api/saved-searches", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const validation = insertSavedSearchSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const searchData = {
        ...validation.data,
        user_id: req.user!.id,
      };

      const { data, error } = await supabase
        .from("saved_searches")
        .insert([searchData])
        .select();

      if (error) throw error;
      return res.json(success(data[0], "Saved search created successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to create saved search"));
    }
  });

  app.get("/api/saved-searches/user/:userId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.params.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", req.params.userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Saved searches fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch saved searches"));
    }
  });

  app.patch("/api/saved-searches/:id", authenticateToken, requireOwnership("saved_search"), async (req: AuthenticatedRequest, res) => {
    try {
      // Validate and extract only allowed fields (name and filters)
      const updateSchema = insertSavedSearchSchema.partial().pick({ name: true, filters: true });
      const validation = updateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { data, error } = await supabase
        .from("saved_searches")
        .update({ ...validation.data, updated_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .select();

      if (error) throw error;
      return res.json(success(data[0], "Saved search updated successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to update saved search"));
    }
  });

  app.delete("/api/saved-searches/:id", authenticateToken, requireOwnership("saved_search"), async (req: AuthenticatedRequest, res) => {
    try {
      const { error: delError } = await supabase
        .from("saved_searches")
        .delete()
        .eq("id", req.params.id);

      if (delError) throw delError;
      return res.json(success(null, "Saved search deleted successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to delete saved search"));
    }
  });

  // ===== NEWSLETTER =====
  app.post("/api/newsletter/subscribe", newsletterLimiter, async (req, res) => {
    try {
      const validation = insertNewsletterSubscriberSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .insert([validation.data])
        .select();

      if (error) {
        if (error.code === "23505") {
          return res.json(success(null, "Already subscribed"));
        }
        throw error;
      }

      return res.json(success(data[0], "Subscribed successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to subscribe to newsletter"));
    }
  });

  app.get("/api/newsletter/subscribers", authenticateToken, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Newsletter subscribers fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch newsletter subscribers"));
    }
  });

  // ===== CONTACT MESSAGES =====
  app.post("/api/messages", inquiryLimiter, async (req, res) => {
    try {
      const validation = insertContactMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { data, error } = await supabase
        .from("contact_messages")
        .insert([validation.data])
        .select();

      if (error) throw error;
      return res.json(success(data[0], "Message sent successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to send message"));
    }
  });

  app.get("/api/messages", authenticateToken, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Contact messages fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to fetch contact messages"));
    }
  });

  app.patch("/api/messages/:id", authenticateToken, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .update({ read: req.body.read })
        .eq("id", req.params.id)
        .select();

      if (error) throw error;
      return res.json(success(data[0], "Message updated successfully"));
    } catch (err: any) {
      return res.status(500).json(error("Failed to update message"));
    }
  });

  // ===== HEALTH CHECK =====
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return httpServer;
}
