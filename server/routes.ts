import type { Express } from "express";
import { createServer, type Server } from "http";
import { supabase } from "./supabase";
import { authenticateToken, optionalAuth, requireRole, requireOwnership, type AuthenticatedRequest } from "./auth-middleware";
import { success, error as errorResponse } from "./response";
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
import { cache, CACHE_TTL } from "./cache";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // ===== AUTHENTICATION =====
  app.post("/api/auth/signup", signupLimiter, async (req, res) => {
    try {
      const validation = signupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { email, password, fullName, phone } = validation.data;

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        phone: phone || undefined,
        user_metadata: { full_name: fullName, phone: phone || null },
      });

      if (error) {
        if (error.message?.includes("duplicate") || error.message?.includes("already exists")) {
          return res.status(400).json({ error: "An account with this email already exists. Please sign in instead." });
        }
        console.error("[AUTH] Signup error:", error.message);
        return res.status(400).json({ error: error.message || "Signup failed. Please try again." });
      }

      // Store user data in users table
      if (data.user) {
        try {
          await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: email,
              full_name: fullName,
              phone: phone || null,
              role: 'renter'
            }, { onConflict: 'id' });
        } catch (profileError) {
          console.error('Failed to save user profile:', profileError);
        }
      }

      res.json({ success: true, user: data.user });
    } catch (err: any) {
      console.error("[AUTH] Signup exception:", err);
      res.status(500).json({ error: err.message || "Signup failed. Please try again." });
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
        console.error("[AUTH] Login error:", error.message);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ success: true, session: data.session });
    } catch (err: any) {
      console.error("[AUTH] Login exception:", err);
      res.status(500).json({ error: "Invalid request" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      res.json({ success: true });
    } catch (err: any) {
      console.error("[AUTH] Logout exception:", err);
      res.status(500).json({ error: "Invalid request" });
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
      return res.json(success(data, "User fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch user"));
    }
  });

  // ===== PROPERTIES =====
  app.get("/api/properties", async (req, res) => {
    try {
      const { propertyType, city, minPrice, maxPrice, status, page = "1", limit = "20" } = req.query;

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
      const offset = (pageNum - 1) * limitNum;

      const cacheKey = `properties:${propertyType || ''}:${city || ''}:${minPrice || ''}:${maxPrice || ''}:${status || 'active'}:${pageNum}:${limitNum}`;
      const cached = cache.get<{ properties: any; pagination: any }>(cacheKey);
      if (cached) {
        return res.json(success(cached, "Properties fetched successfully"));
      }

      let query = supabase.from("properties").select("*", { count: "exact" });

      if (propertyType) query = query.eq("property_type", propertyType);
      if (city) query = query.ilike("city", `%${city}%`);
      if (minPrice) query = query.gte("price", minPrice);
      if (maxPrice) query = query.lte("price", maxPrice);
      if (status) {
        query = query.eq("status", status);
      } else {
        query = query.eq("status", "active");
      }

      query = query.order("created_at", { ascending: false })
        .range(offset, offset + limitNum - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      
      const totalPages = Math.ceil((count || 0) / limitNum);
      
      const result = {
        properties: data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        }
      };

      cache.set(cacheKey, result, CACHE_TTL.PROPERTIES_LIST);

      return res.json(success(result, "Properties fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch properties"));
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const cacheKey = `property:${req.params.id}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(success(cached, "Property fetched successfully"));
      }

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (error) throw error;
      
      cache.set(cacheKey, data, CACHE_TTL.PROPERTY_DETAIL);
      
      return res.json(success(data, "Property fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch property"));
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
      
      cache.invalidate("properties:");
      
      return res.json(success(data[0], "Property created successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to create property"));
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
      
      cache.invalidate(`property:${req.params.id}`);
      cache.invalidate("properties:");
      
      return res.json(success(data[0], "Property updated successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to update property"));
    }
  });

  app.delete("/api/properties/:id", authenticateToken, requireOwnership("property"), async (req: AuthenticatedRequest, res) => {
    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", req.params.id);

      if (error) throw error;
      
      cache.invalidate(`property:${req.params.id}`);
      cache.invalidate("properties:");
      
      return res.json(success(null, "Property deleted successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to delete property"));
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
      return res.status(500).json(errorResponse("Failed to fetch user properties"));
    }
  });

  // ===== APPLICATIONS =====
  // Endpoint for guest and authenticated users to submit applications
  app.post("/api/applications/guest", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validation = insertApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const guestEmail = (req.body as any).guestEmail;
      const guestName = (req.body as any).guestName;

      const applicationData = {
        ...validation.data,
        user_id: req.user?.id || null,
      };

      const { data, error } = await supabase
        .from("applications")
        .insert([applicationData])
        .select();

      if (error) throw error;

      // Send confirmation email to authenticated user or guest
      const emailTo = req.user ? 
        (await supabase.from("users").select("email, full_name").eq("id", req.user.id).single()).data :
        { email: guestEmail, full_name: guestName };

      const { data: propertyData } = await supabase
        .from("properties")
        .select("title")
        .eq("id", validation.data.propertyId)
        .single();

      if (emailTo?.email) {
        sendEmail({
          to: emailTo.email,
          subject: "Your Application Has Been Received",
          html: getApplicationConfirmationEmailTemplate({
            applicantName: emailTo.full_name || "Applicant",
            propertyTitle: propertyData?.title || "Your Property",
          }),
        }).catch((err) => console.error("Email send error:", err));
      }

      return res.json(success(data[0], "Application submitted successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to submit application"));
    }
  });

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
        // Fire-and-forget email sending (don't block request)
        sendEmail({
          to: userData.email,
          subject: "Your Application Has Been Received",
          html: getApplicationConfirmationEmailTemplate({
            applicantName: userData.full_name || "Applicant",
            propertyTitle: propertyData?.title || "Your Property",
          }),
        }).catch((err) => console.error("Email send error:", err));
      }

      return res.json(success(data[0], "Application submitted successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to submit application"));
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
      return res.status(500).json(errorResponse("Failed to fetch user applications"));
    }
  });

  app.get("/api/applications/owner", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Allow owners, agents, and admins to access this endpoint
      if (req.user!.role !== "owner" && req.user!.role !== "agent" && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not authorized - property owners/agents/admins only" });
      }

      const { data: ownedProperties, error: propError } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", req.user!.id);

      if (propError) throw propError;

      if (!ownedProperties || ownedProperties.length === 0) {
        return res.json(success([], "No applications found"));
      }

      const propertyIds = ownedProperties.map(p => p.id);

      const { data, error } = await supabase
        .from("applications")
        .select("*, users(id, full_name, email, phone), properties(id, title, address, city, state)")
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Owner applications fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch owner applications"));
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
        return res.status(404).json(errorResponse("Property not found"));
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
      return res.status(500).json(errorResponse("Failed to fetch property applications"));
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
      return res.status(500).json(errorResponse("Failed to update application"));
    }
  });

  // Get application with full details (co-applicants, comments, notifications)
  app.get("/api/applications/:id/full", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { getApplicationWithDetails } = await import("./application-service");
      const application = await getApplicationWithDetails(req.params.id);
      
      if (!application) {
        return res.status(404).json(errorResponse("Application not found"));
      }

      // Check authorization
      const { data: property } = await supabase
        .from("properties")
        .select("owner_id")
        .eq("id", application.property_id)
        .single();

      const isApplicant = application.user_id === req.user!.id;
      const isPropertyOwner = property?.owner_id === req.user!.id;
      const isAdmin = req.user!.role === "admin";

      if (!isApplicant && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Filter out internal comments for applicants
      if (isApplicant && !isPropertyOwner && !isAdmin) {
        application.comments = application.comments.filter((c: any) => !c.is_internal);
      }

      return res.json(success(application, "Application details fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch application details"));
    }
  });

  // Update application status with validation
  app.patch("/api/applications/:id/status", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, rejectionCategory, rejectionReason, rejectionDetails, reason } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      // Verify authorization
      const { data: application } = await supabase
        .from("applications")
        .select("user_id, property_id, status")
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

      const isApplicant = application.user_id === req.user!.id;
      const isPropertyOwner = property?.owner_id === req.user!.id;
      const isAdmin = req.user!.role === "admin";

      // Only applicant can withdraw, only property owner/admin can approve/reject
      if (status === "withdrawn" && !isApplicant) {
        return res.status(403).json({ error: "Only applicant can withdraw application" });
      }
      
      if (["approved", "rejected", "under_review", "pending_verification"].includes(status) && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only property owner can update this status" });
      }

      const { updateApplicationStatus } = await import("./application-service");
      const result = await updateApplicationStatus(req.params.id, status, req.user!.id, {
        rejectionCategory,
        rejectionReason,
        rejectionDetails,
        reason,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json(success(result.data, "Application status updated successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to update application status"));
    }
  });

  // Calculate and update application score
  app.post("/api/applications/:id/score", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Verify authorization - only property owner or admin can score
      const { data: application } = await supabase
        .from("applications")
        .select("*, properties(owner_id)")
        .eq("id", req.params.id)
        .single();

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      const isPropertyOwner = (application.properties as any)?.owner_id === req.user!.id;
      const isAdmin = req.user!.role === "admin";

      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only property owner can score applications" });
      }

      const { calculateApplicationScore } = await import("./application-service");
      const scoreBreakdown = calculateApplicationScore({
        personalInfo: application.personal_info,
        employment: application.employment,
        rentalHistory: application.rental_history,
        documents: application.documents,
        documentStatus: application.document_status,
      });

      const { data, error } = await supabase
        .from("applications")
        .update({
          score: scoreBreakdown.totalScore,
          score_breakdown: scoreBreakdown,
          scored_at: new Date().toISOString(),
        })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;

      return res.json(success({ application: data, scoreBreakdown }, "Application scored successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to score application"));
    }
  });

  // Compare applications for a property
  app.get("/api/applications/compare/:propertyId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: property } = await supabase
        .from("properties")
        .select("owner_id")
        .eq("id", req.params.propertyId)
        .single();

      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      const isPropertyOwner = property.owner_id === req.user!.id;
      const isAdmin = req.user!.role === "admin";

      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only property owner can compare applications" });
      }

      const { compareApplications } = await import("./application-service");
      const comparisons = await compareApplications(req.params.propertyId);

      return res.json(success(comparisons, "Applications compared successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to compare applications"));
    }
  });

  // ===== CO-APPLICANTS =====
  app.post("/api/applications/:applicationId/co-applicants", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: application } = await supabase
        .from("applications")
        .select("user_id, property_id, personal_info")
        .eq("id", req.params.applicationId)
        .single();

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      if (application.user_id !== req.user!.id) {
        return res.status(403).json({ error: "Only applicant can add co-applicants" });
      }

      const { email, fullName, phone, relationship, personalInfo, employment, income } = req.body;

      if (!email || !fullName) {
        return res.status(400).json({ error: "Email and full name are required" });
      }

      const { data, error } = await supabase
        .from("co_applicants")
        .insert([{
          application_id: req.params.applicationId,
          email,
          full_name: fullName,
          phone,
          relationship,
          personal_info: personalInfo,
          employment,
          income,
        }])
        .select();

      if (error) throw error;

      // Get property info for email
      const { data: propertyData } = await supabase
        .from("properties")
        .select("title")
        .eq("id", application.property_id)
        .single();

      // Get main applicant name from personal info
      const mainApplicantName = (application.personal_info as any)?.firstName || "Applicant";

      // Send invitation email (fire-and-forget)
      const { getCoApplicantInvitationEmailTemplate } = await import("./email");
      sendEmail({
        to: email,
        subject: `You've Been Invited as a Co-Applicant - ${propertyData?.title || 'Choice Properties'}`,
        html: getCoApplicantInvitationEmailTemplate({
          coApplicantName: fullName,
          mainApplicantName: mainApplicantName,
          propertyTitle: propertyData?.title || "the property",
          invitationLink: `${process.env.PUBLIC_URL || 'https://choice-properties.replit.dev'}/applications/${req.params.applicationId}`,
        }),
      }).catch((err) => console.error("Failed to send co-applicant invitation email:", err));

      return res.json(success(data[0], "Co-applicant added successfully and invitation email sent"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to add co-applicant"));
    }
  });

  app.get("/api/applications/:applicationId/co-applicants", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: application } = await supabase
        .from("applications")
        .select("user_id, property_id")
        .eq("id", req.params.applicationId)
        .single();

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      const { data: property } = await supabase
        .from("properties")
        .select("owner_id")
        .eq("id", application.property_id)
        .single();

      const isApplicant = application.user_id === req.user!.id;
      const isPropertyOwner = property?.owner_id === req.user!.id;
      const isAdmin = req.user!.role === "admin";

      if (!isApplicant && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { data, error } = await supabase
        .from("co_applicants")
        .select("*")
        .eq("application_id", req.params.applicationId);

      if (error) throw error;

      return res.json(success(data, "Co-applicants fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch co-applicants"));
    }
  });

  app.delete("/api/co-applicants/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: coApplicant } = await supabase
        .from("co_applicants")
        .select("application_id")
        .eq("id", req.params.id)
        .single();

      if (!coApplicant) {
        return res.status(404).json({ error: "Co-applicant not found" });
      }

      const { data: application } = await supabase
        .from("applications")
        .select("user_id")
        .eq("id", coApplicant.application_id)
        .single();

      if (application?.user_id !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Only applicant can remove co-applicants" });
      }

      const { error } = await supabase
        .from("co_applicants")
        .delete()
        .eq("id", req.params.id);

      if (error) throw error;

      return res.json(success(null, "Co-applicant removed successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to remove co-applicant"));
    }
  });

  // Delete co-applicant (alternative path that matches frontend)
  app.delete("/api/applications/:applicationId/co-applicants/:coApplicantId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: coApplicant } = await supabase
        .from("co_applicants")
        .select("application_id")
        .eq("id", req.params.coApplicantId)
        .eq("application_id", req.params.applicationId)
        .single();

      if (!coApplicant) {
        return res.status(404).json({ error: "Co-applicant not found" });
      }

      const { data: application } = await supabase
        .from("applications")
        .select("user_id")
        .eq("id", req.params.applicationId)
        .single();

      if (application?.user_id !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Only applicant can remove co-applicants" });
      }

      const { error } = await supabase
        .from("co_applicants")
        .delete()
        .eq("id", req.params.coApplicantId);

      if (error) throw error;

      return res.json(success(null, "Co-applicant removed successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to remove co-applicant"));
    }
  });

  // Resend co-applicant invitation
  app.post("/api/applications/:applicationId/co-applicants/:coApplicantId/resend", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: coApplicant } = await supabase
        .from("co_applicants")
        .select("*, applications(user_id, property_id, users(full_name)), properties:applications(properties(title))")
        .eq("id", req.params.coApplicantId)
        .eq("application_id", req.params.applicationId)
        .single();

      if (!coApplicant) {
        return res.status(404).json({ error: "Co-applicant not found" });
      }

      const { data: application } = await supabase
        .from("applications")
        .select("user_id")
        .eq("id", req.params.applicationId)
        .single();

      if (application?.user_id !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Only applicant can resend invitations" });
      }

      // Update invited_at timestamp
      await supabase
        .from("co_applicants")
        .update({ invited_at: new Date().toISOString() })
        .eq("id", req.params.coApplicantId);

      // In a real implementation, this would send an email
      // For now, we just update the timestamp and return success
      console.log(`[CO-APPLICANT] Resent invitation to ${coApplicant.email}`);

      return res.json(success(null, "Invitation resent successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to resend invitation"));
    }
  });

  // ===== APPLICATION COMMENTS =====
  app.post("/api/applications/:applicationId/comments", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: application } = await supabase
        .from("applications")
        .select("user_id, property_id")
        .eq("id", req.params.applicationId)
        .single();

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      const { data: property } = await supabase
        .from("properties")
        .select("owner_id")
        .eq("id", application.property_id)
        .single();

      const isApplicant = application.user_id === req.user!.id;
      const isPropertyOwner = property?.owner_id === req.user!.id;
      const isAdmin = req.user!.role === "admin";

      if (!isApplicant && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { comment, commentType, isInternal } = req.body;

      if (!comment) {
        return res.status(400).json({ error: "Comment is required" });
      }

      // Applicants can only add non-internal comments
      const actualIsInternal = isApplicant && !isPropertyOwner && !isAdmin ? false : (isInternal ?? true);

      const { data, error } = await supabase
        .from("application_comments")
        .insert([{
          application_id: req.params.applicationId,
          user_id: req.user!.id,
          comment,
          comment_type: commentType || "note",
          is_internal: actualIsInternal,
        }])
        .select("*, users(id, full_name)");

      if (error) throw error;

      return res.json(success(data[0], "Comment added successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to add comment"));
    }
  });

  app.get("/api/applications/:applicationId/comments", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: application } = await supabase
        .from("applications")
        .select("user_id, property_id")
        .eq("id", req.params.applicationId)
        .single();

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      const { data: property } = await supabase
        .from("properties")
        .select("owner_id")
        .eq("id", application.property_id)
        .single();

      const isApplicant = application.user_id === req.user!.id;
      const isPropertyOwner = property?.owner_id === req.user!.id;
      const isAdmin = req.user!.role === "admin";

      if (!isApplicant && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }

      let query = supabase
        .from("application_comments")
        .select("*, users(id, full_name)")
        .eq("application_id", req.params.applicationId)
        .order("created_at", { ascending: true });

      // Filter out internal comments for applicants
      if (isApplicant && !isPropertyOwner && !isAdmin) {
        query = query.eq("is_internal", false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return res.json(success(data, "Comments fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch comments"));
    }
  });

  // ===== APPLICATION NOTIFICATIONS =====
  app.get("/api/applications/:applicationId/notifications", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: application } = await supabase
        .from("applications")
        .select("user_id")
        .eq("id", req.params.applicationId)
        .single();

      if (!application || application.user_id !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { data, error } = await supabase
        .from("application_notifications")
        .select("*")
        .eq("application_id", req.params.applicationId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.json(success(data, "Notifications fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch notifications"));
    }
  });

  app.patch("/api/notifications/:id/read", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: notification } = await supabase
        .from("application_notifications")
        .select("user_id")
        .eq("id", req.params.id)
        .single();

      if (!notification || notification.user_id !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { data, error } = await supabase
        .from("application_notifications")
        .update({ read_at: new Date().toISOString(), status: "read" })
        .eq("id", req.params.id)
        .select();

      if (error) throw error;

      return res.json(success(data[0], "Notification marked as read"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to mark notification as read"));
    }
  });

  // Get all user notifications
  app.get("/api/user/notifications", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabase
        .from("application_notifications")
        .select("*, applications(id, property_id, properties(title))")
        .eq("user_id", req.user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return res.json(success(data, "User notifications fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch user notifications"));
    }
  });

  // Document status update
  app.patch("/api/applications/:id/documents/:docType", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: application } = await supabase
        .from("applications")
        .select("user_id, property_id, document_status")
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

      const isPropertyOwner = property?.owner_id === req.user!.id;
      const isAdmin = req.user!.role === "admin";

      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only property owner can verify documents" });
      }

      const { verified, notes } = req.body;
      const docType = req.params.docType;

      const currentDocStatus = application.document_status || {};
      const updatedDocStatus = {
        ...currentDocStatus,
        [docType]: {
          ...currentDocStatus[docType],
          verified: verified ?? false,
          verifiedAt: verified ? new Date().toISOString() : undefined,
          verifiedBy: verified ? req.user!.id : undefined,
          notes,
        },
      };

      const { data, error } = await supabase
        .from("applications")
        .update({ document_status: updatedDocStatus })
        .eq("id", req.params.id)
        .select();

      if (error) throw error;

      return res.json(success(data[0], "Document status updated successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to update document status"));
    }
  });

  // Set application expiration
  app.patch("/api/applications/:id/expiration", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: application } = await supabase
        .from("applications")
        .select("property_id")
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

      const isPropertyOwner = property?.owner_id === req.user!.id;
      const isAdmin = req.user!.role === "admin";

      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only property owner can set expiration" });
      }

      const { setApplicationExpiration } = await import("./application-service");
      const daysUntilExpiration = req.body.daysUntilExpiration || 30;
      const result = await setApplicationExpiration(req.params.id, daysUntilExpiration);

      if (!result) {
        return res.status(500).json(errorResponse("Failed to set expiration"));
      }

      return res.json(success(null, `Application expires in ${daysUntilExpiration} days`));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to set application expiration"));
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
      return res.status(500).json(errorResponse("Failed to submit inquiry"));
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
      return res.status(500).json(errorResponse("Failed to fetch agent inquiries"));
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
      return res.status(500).json(errorResponse("Failed to update inquiry"));
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
      return res.status(500).json(errorResponse("Failed to create requirement"));
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
      return res.status(500).json(errorResponse("Failed to fetch user requirements"));
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
      return res.status(500).json(errorResponse("Failed to fetch requirements"));
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
      return res.json(success(data[0], "Favorite created successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to create favorite"));
    }
  });

  app.delete("/api/favorites/:id", authenticateToken, requireOwnership("favorite"), async (req: AuthenticatedRequest, res) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", req.params.id);

      if (error) throw error;
      return res.json(success(null, "Favorite deleted successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to delete favorite"));
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
      return res.json(success(data, "User favorites fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch user favorites"));
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
      return res.status(500).json(errorResponse("Failed to fetch reviews"));
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
      return res.status(500).json(errorResponse("Failed to create review"));
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
      return res.status(500).json(errorResponse("Failed to update review"));
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
      return res.status(500).json(errorResponse("Failed to delete review"));
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
      return res.status(500).json(errorResponse("Failed to fetch users"));
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
        return res.status(404).json(errorResponse("User not found"));
      }

      return res.json(success(data, "User fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch user"));
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
      return res.status(500).json(errorResponse("Failed to update user"));
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
      return res.status(500).json(errorResponse("Failed to create saved search"));
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
      return res.status(500).json(errorResponse("Failed to fetch saved searches"));
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
      return res.status(500).json(errorResponse("Failed to update saved search"));
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
      return res.status(500).json(errorResponse("Failed to delete saved search"));
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
      return res.status(500).json(errorResponse("Failed to subscribe to newsletter"));
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
      return res.status(500).json(errorResponse("Failed to fetch newsletter subscribers"));
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
      return res.status(500).json(errorResponse("Failed to send message"));
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
      return res.status(500).json(errorResponse("Failed to fetch contact messages"));
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
      return res.status(500).json(errorResponse("Failed to update message"));
    }
  });

  // ===== CONTACT (alias for messages) =====
  app.post("/api/contact", inquiryLimiter, async (req, res) => {
    try {
      const validation = insertContactMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(errorResponse(validation.error.errors[0].message));
      }

      const { data, error } = await supabase
        .from("contact_messages")
        .insert([validation.data])
        .select();

      if (error) throw error;
      return res.json(success(data[0], "Message sent successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to send message"));
    }
  });

  // ===== HEALTH CHECK =====
  app.get("/api/health", (_req, res) => {
    return res.json(success({ status: "ok", timestamp: new Date().toISOString() }, "Server is healthy"));
  });

  // ===== USER DASHBOARD (All user activities in one call) =====
  app.get("/api/user/dashboard", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;

      // Fetch all user activities in parallel
      const [applicationsResult, favoritesResult, savedSearchesResult, requirementsResult, reviewsResult, propertiesResult] = await Promise.all([
        // Applications with property details
        supabase
          .from("applications")
          .select(`
            *,
            properties:property_id (
              id, title, address, city, state, price, bedrooms, bathrooms, images, status, property_type
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        // Favorites with property details
        supabase
          .from("favorites")
          .select(`
            id,
            property_id,
            created_at,
            properties:property_id (
              id, title, address, city, state, price, bedrooms, bathrooms, images, status, property_type, square_feet
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        // Saved searches
        supabase
          .from("saved_searches")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        // Requirements
        supabase
          .from("requirements")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        // User's reviews
        supabase
          .from("reviews")
          .select(`
            *,
            properties:property_id (id, title, address, city)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        // User's properties (if owner/agent)
        supabase
          .from("properties")
          .select("*")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false })
      ]);

      // Transform data to include property info properly
      const applications = (applicationsResult.data || []).map(app => ({
        ...app,
        property: app.properties
      }));

      const favorites = (favoritesResult.data || []).map(fav => ({
        ...fav,
        property: fav.properties
      }));

      const reviews = (reviewsResult.data || []).map(review => ({
        ...review,
        property: review.properties
      }));

      // Calculate stats
      const stats = {
        totalApplications: applications.length,
        pendingApplications: applications.filter(a => a.status === 'pending').length,
        approvedApplications: applications.filter(a => a.status === 'approved').length,
        rejectedApplications: applications.filter(a => a.status === 'rejected').length,
        totalFavorites: favorites.length,
        totalSavedSearches: savedSearchesResult.data?.length || 0,
        totalRequirements: requirementsResult.data?.length || 0,
        totalReviews: reviews.length,
        totalProperties: propertiesResult.data?.length || 0
      };

      return res.json(success({
        applications,
        favorites,
        savedSearches: savedSearchesResult.data || [],
        requirements: requirementsResult.data || [],
        reviews,
        properties: propertiesResult.data || [],
        stats
      }, "User dashboard data fetched successfully"));
    } catch (err: any) {
      console.error("[DASHBOARD] Error fetching user dashboard:", err);
      return res.status(500).json(errorResponse("Failed to fetch user dashboard data"));
    }
  });

  // ===== PROPERTY WITH OWNER =====
  app.get("/api/properties/:id/full", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          owner:owner_id (
            id, full_name, email, phone, profile_image, bio
          )
        `)
        .eq("id", req.params.id)
        .single();

      if (error) throw error;
      
      return res.json(success(data, "Property with owner fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch property"));
    }
  });

  return httpServer;
}
