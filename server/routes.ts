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
  insertAgencySchema,
  insertTransactionSchema,
  insertAgentReviewSchema,
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

      const { email, password, fullName, phone, role = 'renter' } = validation.data;

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        phone: phone || undefined,
        user_metadata: { full_name: fullName, phone: phone || null, role },
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
              role: role
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

  app.post("/api/auth/resend-verification", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.email) {
        return res.status(400).json({ error: "No email address found" });
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: req.user.email,
      });

      if (error) {
        console.error("[AUTH] Resend verification error:", error.message);
        return res.status(400).json({ error: error.message || "Failed to resend verification email" });
      }

      res.json({ success: true, message: "Verification email sent" });
    } catch (err: any) {
      console.error("[AUTH] Resend verification exception:", err);
      res.status(500).json({ error: "Failed to resend verification email" });
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
  // Mock payment processing endpoint
  app.post("/api/payments/process", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { applicationId, amount, cardToken } = req.body;
      
      if (!applicationId || !amount) {
        return res.status(400).json({ error: "Missing applicationId or amount" });
      }

      // Simulate payment processing (in real app, would call Stripe/PayPal/etc)
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockTransactionId = `txn_${Date.now()}`;

      // In production, verify amount matches application fee
      // For now, mock success after 100ms delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));

      return res.json(success({
        paymentId: mockPaymentId,
        transactionId: mockTransactionId,
        amount,
        status: "completed",
        timestamp: new Date().toISOString(),
        message: "[MOCK PAYMENT] In production, this would process with real payment provider"
      }, "Payment processed successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to process payment"));
    }
  });

  // Endpoint for guest and authenticated users to submit applications
  app.post("/api/applications/guest", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validation = insertApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const guestEmail = (req.body as any).guestEmail;
      const guestName = (req.body as any).guestName;
      const propertyId = validation.data.propertyId;

      // Check for duplicate application (guest or authenticated)
      if (req.user) {
        const { data: existing } = await supabase
          .from("applications")
          .select("id")
          .eq("user_id", req.user.id)
          .eq("property_id", propertyId)
          .single();
        
        if (existing) {
          return res.status(409).json({ error: "You have already applied for this property" });
        }
      }

      let userId = req.user?.id || null;

      // Create guest user if not authenticated
      if (!userId && guestEmail) {
        const { data: guestUser, error: guestError } = await supabase
          .from("users")
          .insert([{
            email: guestEmail,
            full_name: guestName || "Guest User",
            role: "renter",
            password_hash: Math.random().toString(36), // Dummy hash for guests
          }])
          .select("id")
          .single();

        if (guestUser?.id) {
          userId = guestUser.id;
        }
      }

      const applicationData = {
        ...validation.data,
        user_id: userId,
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

      const propertyId = validation.data.propertyId;

      // Prevent duplicate applications per property per user
      const { data: existing, error: checkError } = await supabase
        .from("applications")
        .select("id")
        .eq("user_id", req.user!.id)
        .eq("property_id", propertyId)
        .single();
      
      if (existing) {
        return res.status(409).json({ error: "You have already applied for this property. Please check your existing applications." });
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

      // Get admin email from settings, fallback to admin user
      let adminEmail = null;
      const { data: adminSetting } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "admin_email")
        .single();
      
      if (adminSetting?.value) {
        adminEmail = adminSetting.value;
      } else {
        // Fallback: get first admin user's email
        const { data: adminUser } = await supabase
          .from("users")
          .select("email")
          .eq("role", "admin")
          .limit(1)
          .single();
        adminEmail = adminUser?.email;
      }

      // Get agent/persona name for context
      let agentName = "Unknown Agent";
      if (validation.data.agentId) {
        const { data: agentData } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", validation.data.agentId)
          .single();
        agentName = agentData?.full_name || "Unknown Agent";
      }

      // Always send to admin email (centralized management)
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `New Inquiry for ${agentName} - Choice Properties`,
          html: getAgentInquiryEmailTemplate({
            senderName: validation.data.senderName,
            senderEmail: validation.data.senderEmail,
            senderPhone: validation.data.senderPhone || "",
            message: validation.data.message || "",
            propertyTitle: agentName ? `(Agent: ${agentName})` : undefined,
          }),
        });
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
      // Fetch property
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (propertyError) {
        console.error("[PROPERTY] Supabase property error:", propertyError);
        throw propertyError;
      }

      // Fetch owner if owner_id exists
      let ownerData = null;
      if (propertyData?.owner_id) {
        const { data: owner, error: ownerError } = await supabase
          .from("users")
          .select("id, full_name, email, phone, profile_image, bio")
          .eq("id", propertyData.owner_id)
          .single();

        if (ownerError) {
          console.error("[PROPERTY] Supabase owner error:", ownerError);
          // Don't throw - owner is optional
        } else {
          ownerData = owner;
        }
      }

      const result = { ...propertyData, owner: ownerData };
      return res.json(success(result, "Property with owner fetched successfully"));
    } catch (err: any) {
      console.error("[PROPERTY] Error fetching property:", err);
      return res.status(500).json(errorResponse("Failed to fetch property"));
    }
  });

  // ===== AGENCIES =====
  app.get("/api/agencies", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Agencies fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch agencies"));
    }
  });

  app.get("/api/agencies/:id", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("agencies")
        .select(`
          *,
          agents:users!users_agency_id_fkey (
            id, full_name, email, phone, profile_image, bio, 
            license_number, license_verified, specialties, 
            years_experience, total_sales, rating, review_count, location
          )
        `)
        .eq("id", req.params.id)
        .is("deleted_at", null)
        .single();

      if (error) throw error;
      return res.json(success(data, "Agency fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch agency"));
    }
  });

  app.post("/api/agencies", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const validation = insertAgencySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(errorResponse(validation.error.errors[0].message));
      }

      const agencyData = {
        ...validation.data,
        owner_id: req.user?.id,
      };

      const { data, error } = await supabase
        .from("agencies")
        .insert(agencyData)
        .select()
        .single();

      if (error) throw error;

      // Update the creator's agency_id
      if (data && req.user?.id) {
        await supabase
          .from("users")
          .update({ agency_id: data.id })
          .eq("id", req.user.id);
      }

      return res.json(success(data, "Agency created successfully"));
    } catch (err: any) {
      console.error("[AGENCY] Create error:", err);
      return res.status(500).json(errorResponse("Failed to create agency"));
    }
  });

  app.patch("/api/agencies/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Check ownership
      const { data: agency } = await supabase
        .from("agencies")
        .select("owner_id")
        .eq("id", req.params.id)
        .single();

      if (!agency || (agency.owner_id !== req.user?.id && req.user?.role !== "admin")) {
        return res.status(403).json(errorResponse("Not authorized to update this agency"));
      }

      const { data, error } = await supabase
        .from("agencies")
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;
      return res.json(success(data, "Agency updated successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to update agency"));
    }
  });

  app.delete("/api/agencies/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: agency } = await supabase
        .from("agencies")
        .select("owner_id")
        .eq("id", req.params.id)
        .single();

      if (!agency || (agency.owner_id !== req.user?.id && req.user?.role !== "admin")) {
        return res.status(403).json(errorResponse("Not authorized to delete this agency"));
      }

      const { error } = await supabase
        .from("agencies")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", req.params.id);

      if (error) throw error;
      return res.json(success(null, "Agency deleted successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to delete agency"));
    }
  });

  // Get agency's agents
  app.get("/api/agencies/:id/agents", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, phone, profile_image, bio, license_number, license_verified, specialties, years_experience, total_sales, rating, review_count, location, role")
        .eq("agency_id", req.params.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Agency agents fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch agency agents"));
    }
  });

  // Add agent to agency
  app.post("/api/agencies/:id/agents", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: agency } = await supabase
        .from("agencies")
        .select("owner_id")
        .eq("id", req.params.id)
        .single();

      if (!agency || (agency.owner_id !== req.user?.id && req.user?.role !== "admin")) {
        return res.status(403).json(errorResponse("Not authorized to add agents to this agency"));
      }

      const { agentId } = req.body;
      if (!agentId) {
        return res.status(400).json(errorResponse("Agent ID is required"));
      }

      const { data, error } = await supabase
        .from("users")
        .update({ agency_id: req.params.id })
        .eq("id", agentId)
        .select()
        .single();

      if (error) throw error;
      return res.json(success(data, "Agent added to agency successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to add agent to agency"));
    }
  });

  // Remove agent from agency
  app.delete("/api/agencies/:id/agents/:agentId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: agency } = await supabase
        .from("agencies")
        .select("owner_id")
        .eq("id", req.params.id)
        .single();

      if (!agency || (agency.owner_id !== req.user?.id && req.user?.role !== "admin")) {
        return res.status(403).json(errorResponse("Not authorized to remove agents from this agency"));
      }

      const { error } = await supabase
        .from("users")
        .update({ agency_id: null })
        .eq("id", req.params.agentId)
        .eq("agency_id", req.params.id);

      if (error) throw error;
      return res.json(success(null, "Agent removed from agency successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to remove agent from agency"));
    }
  });

  // ===== AGENTS (Database-driven) =====
  app.get("/api/agents", async (req, res) => {
    try {
      const { specialty, search, location } = req.query;
      
      let query = supabase
        .from("users")
        .select(`
          id, full_name, email, phone, profile_image, bio,
          license_number, license_state, license_expiry, license_verified,
          specialties, years_experience, total_sales, rating, review_count, location,
          agency:agency_id (id, name, logo)
        `)
        .eq("role", "agent")
        .is("deleted_at", null);

      if (location) {
        query = query.ilike("location", `%${location}%`);
      }

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,location.ilike.%${search}%`);
      }

      const { data, error } = await query.order("rating", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Filter by specialty if provided (handled client-side since jsonb array filtering is complex)
      let filteredData = data || [];
      if (specialty && specialty !== "all") {
        filteredData = filteredData.filter((agent: any) => 
          agent.specialties?.includes(specialty)
        );
      }

      return res.json(success(filteredData, "Agents fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch agents"));
    }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          id, full_name, email, phone, profile_image, bio,
          license_number, license_state, license_expiry, license_verified,
          specialties, years_experience, total_sales, rating, review_count, location,
          agency:agency_id (id, name, logo, website, phone, email)
        `)
        .eq("id", req.params.id)
        .eq("role", "agent")
        .single();

      if (error) throw error;
      return res.json(success(data, "Agent fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch agent"));
    }
  });

  // Update agent profile (self)
  app.patch("/api/agents/:id/profile", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user?.id !== req.params.id && req.user?.role !== "admin") {
        return res.status(403).json(errorResponse("Not authorized to update this profile"));
      }

      const allowedFields = [
        "bio", "profile_image", "phone", "location",
        "license_number", "license_state", "license_expiry",
        "specialties", "years_experience"
      ];

      const updateData: any = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;
      return res.json(success(data, "Agent profile updated successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to update agent profile"));
    }
  });

  // Get agent's properties (listings)
  app.get("/api/agents/:id/properties", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("listing_agent_id", req.params.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Agent properties fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch agent properties"));
    }
  });

  // Get agent's reviews
  app.get("/api/agents/:id/reviews", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("agent_reviews")
        .select(`
          *,
          reviewer:reviewer_id (id, full_name, profile_image)
        `)
        .eq("agent_id", req.params.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Agent reviews fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch agent reviews"));
    }
  });

  // Submit agent review
  app.post("/api/agents/:id/reviews", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const validation = insertAgentReviewSchema.safeParse({
        ...req.body,
        agentId: req.params.id,
        reviewerId: req.user?.id,
      });

      if (!validation.success) {
        return res.status(400).json(errorResponse(validation.error.errors[0].message));
      }

      const { data, error } = await supabase
        .from("agent_reviews")
        .insert({
          agent_id: req.params.id,
          reviewer_id: req.user?.id,
          rating: req.body.rating,
          title: req.body.title,
          comment: req.body.comment,
          would_recommend: req.body.wouldRecommend ?? true,
          transaction_id: req.body.transactionId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return res.status(400).json(errorResponse("You have already reviewed this agent"));
        }
        throw error;
      }

      // Update agent's rating
      const { data: reviews } = await supabase
        .from("agent_reviews")
        .select("rating")
        .eq("agent_id", req.params.id);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
        await supabase
          .from("users")
          .update({ 
            rating: avgRating.toFixed(2), 
            review_count: reviews.length 
          })
          .eq("id", req.params.id);
      }

      return res.json(success(data, "Review submitted successfully"));
    } catch (err: any) {
      console.error("[AGENT REVIEW] Error:", err);
      return res.status(500).json(errorResponse("Failed to submit review"));
    }
  });

  // ===== TRANSACTIONS =====
  app.get("/api/transactions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      let query = supabase
        .from("transactions")
        .select(`
          *,
          property:property_id (id, title, address, city, state),
          agent:agent_id (id, full_name, email),
          agency:agency_id (id, name),
          buyer:buyer_id (id, full_name, email)
        `);

      // Filter based on role
      if (role === "agent") {
        query = query.eq("agent_id", userId);
      } else if (role !== "admin") {
        // Agency owner or broker sees all agency transactions
        const { data: userAgency } = await supabase
          .from("agencies")
          .select("id")
          .eq("owner_id", userId)
          .single();

        if (userAgency) {
          query = query.eq("agency_id", userAgency.id);
        } else {
          query = query.eq("agent_id", userId);
        }
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Transactions fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch transactions"));
    }
  });

  app.post("/api/transactions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const validation = insertTransactionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(errorResponse(validation.error.errors[0].message));
      }

      // Calculate commissions
      const transactionAmount = parseFloat(req.body.transactionAmount || "0");
      const commissionRate = parseFloat(req.body.commissionRate || "3");
      const agentSplit = parseFloat(req.body.agentSplit || "70");

      const commissionAmount = (transactionAmount * commissionRate) / 100;
      const agentCommission = (commissionAmount * agentSplit) / 100;
      const agencyCommission = commissionAmount - agentCommission;

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          ...validation.data,
          commission_amount: commissionAmount,
          agent_commission: agentCommission,
          agency_commission: agencyCommission,
        })
        .select()
        .single();

      if (error) throw error;

      // Update agent's total sales
      if (req.body.agentId && req.body.status === "completed") {
        await supabase.rpc("increment_agent_sales", { agent_id: req.body.agentId });
      }

      return res.json(success(data, "Transaction created successfully"));
    } catch (err: any) {
      console.error("[TRANSACTION] Create error:", err);
      return res.status(500).json(errorResponse("Failed to create transaction"));
    }
  });

  app.patch("/api/transactions/:id/status", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.body;
      const updateData: any = { status, updated_at: new Date().toISOString() };

      if (status === "completed") {
        updateData.closed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;

      // Update agent's total sales when completed
      if (status === "completed" && data.agent_id) {
        const { data: agent } = await supabase
          .from("users")
          .select("total_sales")
          .eq("id", data.agent_id)
          .single();

        await supabase
          .from("users")
          .update({ total_sales: (agent?.total_sales || 0) + 1 })
          .eq("id", data.agent_id);
      }

      return res.json(success(data, "Transaction status updated successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to update transaction status"));
    }
  });

  // ===== ADMIN PERSONA MANAGEMENT =====
  // Get all managed personas (agents, landlords, property managers controlled by admin)
  app.get("/api/admin/personas", authenticateToken, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("is_managed_profile", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.json(success(data, "Personas fetched successfully"));
    } catch (err: any) {
      console.error("[ADMIN] Get personas error:", err);
      return res.status(500).json(errorResponse("Failed to fetch personas"));
    }
  });

  // Create a new managed persona
  app.post("/api/admin/personas", authenticateToken, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const { fullName, email, displayEmail, displayPhone, role, bio, profileImage, location, specialties, yearsExperience } = req.body;

      if (!fullName || !email) {
        return res.status(400).json(errorResponse("Full name and email are required"));
      }

      // Create the managed profile
      const { data, error } = await supabase
        .from("users")
        .insert({
          email,
          full_name: fullName,
          display_email: displayEmail || email,
          display_phone: displayPhone || null,
          role: role || "agent",
          bio: bio || null,
          profile_image: profileImage || null,
          location: location || null,
          specialties: specialties || null,
          years_experience: yearsExperience || null,
          is_managed_profile: true,
          managed_by: req.user!.id,
          password_hash: "managed_profile_no_login", // Managed profiles can't login
        })
        .select()
        .single();

      if (error) throw error;
      return res.json(success(data, "Persona created successfully"));
    } catch (err: any) {
      console.error("[ADMIN] Create persona error:", err);
      if (err.message?.includes("duplicate") || err.code === "23505") {
        return res.status(400).json(errorResponse("A user with this email already exists"));
      }
      return res.status(500).json(errorResponse("Failed to create persona"));
    }
  });

  // Update a managed persona
  app.patch("/api/admin/personas/:id", authenticateToken, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const personaId = req.params.id;

      // Verify this is a managed profile
      const { data: existing, error: checkError } = await supabase
        .from("users")
        .select("id, is_managed_profile, managed_by")
        .eq("id", personaId)
        .single();

      if (checkError || !existing) {
        return res.status(404).json(errorResponse("Persona not found"));
      }

      if (!existing.is_managed_profile) {
        return res.status(400).json(errorResponse("This user is not a managed persona"));
      }

      const { fullName, displayEmail, displayPhone, role, bio, profileImage, location, specialties, yearsExperience } = req.body;

      const updateData: any = { updated_at: new Date().toISOString() };
      if (fullName !== undefined) updateData.full_name = fullName;
      if (displayEmail !== undefined) updateData.display_email = displayEmail;
      if (displayPhone !== undefined) updateData.display_phone = displayPhone;
      if (role !== undefined) updateData.role = role;
      if (bio !== undefined) updateData.bio = bio;
      if (profileImage !== undefined) updateData.profile_image = profileImage;
      if (location !== undefined) updateData.location = location;
      if (specialties !== undefined) updateData.specialties = specialties;
      if (yearsExperience !== undefined) updateData.years_experience = yearsExperience;

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", personaId)
        .select()
        .single();

      if (error) throw error;
      return res.json(success(data, "Persona updated successfully"));
    } catch (err: any) {
      console.error("[ADMIN] Update persona error:", err);
      return res.status(500).json(errorResponse("Failed to update persona"));
    }
  });

  // Delete a managed persona
  app.delete("/api/admin/personas/:id", authenticateToken, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const personaId = req.params.id;

      // Verify this is a managed profile before deleting
      const { data: existing, error: checkError } = await supabase
        .from("users")
        .select("id, is_managed_profile")
        .eq("id", personaId)
        .single();

      if (checkError || !existing) {
        return res.status(404).json(errorResponse("Persona not found"));
      }

      if (!existing.is_managed_profile) {
        return res.status(400).json(errorResponse("Cannot delete a non-managed user from this endpoint"));
      }

      // Soft delete the persona
      const { error } = await supabase
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", personaId);

      if (error) throw error;
      return res.json(success(null, "Persona deleted successfully"));
    } catch (err: any) {
      console.error("[ADMIN] Delete persona error:", err);
      return res.status(500).json(errorResponse("Failed to delete persona"));
    }
  });

  // Get admin settings
  app.get("/api/admin/settings", authenticateToken, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*");

      if (error) throw error;

      // Convert to key-value object
      const settings: Record<string, string> = {};
      (data || []).forEach((item: any) => {
        settings[item.key] = item.value;
      });

      return res.json(success(settings, "Settings fetched successfully"));
    } catch (err: any) {
      console.error("[ADMIN] Get settings error:", err);
      return res.status(500).json(errorResponse("Failed to fetch settings"));
    }
  });

  // Update admin settings
  app.post("/api/admin/settings", authenticateToken, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const { key, value } = req.body;

      if (!key) {
        return res.status(400).json(errorResponse("Setting key is required"));
      }

      // Upsert the setting
      const { data, error } = await supabase
        .from("admin_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
        .select()
        .single();

      if (error) throw error;
      return res.json(success(data, "Setting saved successfully"));
    } catch (err: any) {
      console.error("[ADMIN] Save setting error:", err);
      return res.status(500).json(errorResponse("Failed to save setting"));
    }
  });

  // ===== MESSAGING =====
  // Get user's conversations
  app.get("/api/conversations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", req.user!.id);

      if (partError) throw partError;

      if (!participations || participations.length === 0) {
        return res.json(success([], "No conversations found"));
      }

      const conversationIds = participations.map(p => p.conversation_id);

      const { data: conversations, error } = await supabase
        .from("conversations")
        .select(`
          *,
          properties:property_id(id, title, address, images),
          conversation_participants(user_id, last_read_at, users:user_id(id, full_name, email, profile_image)),
          messages(id, content, sender_id, created_at)
        `)
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const enrichedConversations = (conversations || []).map((conv: any) => {
        const lastMessage = conv.messages?.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        const myParticipation = conv.conversation_participants?.find((p: any) => p.user_id === req.user!.id);
        const unreadCount = conv.messages?.filter((m: any) => 
          m.sender_id !== req.user!.id && 
          (!myParticipation?.last_read_at || new Date(m.created_at) > new Date(myParticipation.last_read_at))
        ).length || 0;

        return {
          ...conv,
          lastMessage,
          unreadCount,
          participants: conv.conversation_participants?.map((p: any) => p.users).filter(Boolean),
        };
      });

      return res.json(success(enrichedConversations, "Conversations fetched successfully"));
    } catch (err: any) {
      console.error("[MESSAGING] Get conversations error:", err);
      return res.status(500).json(errorResponse("Failed to fetch conversations"));
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: participation } = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", req.params.id)
        .eq("user_id", req.user!.id)
        .single();

      if (!participation) {
        return res.status(403).json(errorResponse("Not authorized to view this conversation"));
      }

      const { data: conversation, error } = await supabase
        .from("conversations")
        .select(`
          *,
          properties:property_id(id, title, address, images),
          conversation_participants(user_id, last_read_at, users:user_id(id, full_name, email, profile_image)),
          messages(id, content, sender_id, message_type, attachments, created_at, users:sender_id(id, full_name, profile_image))
        `)
        .eq("id", req.params.id)
        .single();

      if (error) throw error;

      if (conversation?.messages) {
        conversation.messages = conversation.messages.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      return res.json(success(conversation, "Conversation fetched successfully"));
    } catch (err: any) {
      console.error("[MESSAGING] Get conversation error:", err);
      return res.status(500).json(errorResponse("Failed to fetch conversation"));
    }
  });

  // Create new conversation
  app.post("/api/conversations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { propertyId, applicationId, recipientId, subject, initialMessage } = req.body;

      if (!recipientId) {
        return res.status(400).json(errorResponse("Recipient is required"));
      }

      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert([{ property_id: propertyId, application_id: applicationId, subject }])
        .select()
        .single();

      if (convError) throw convError;

      await supabase.from("conversation_participants").insert([
        { conversation_id: conversation.id, user_id: req.user!.id },
        { conversation_id: conversation.id, user_id: recipientId },
      ]);

      if (initialMessage) {
        await supabase.from("messages").insert([{
          conversation_id: conversation.id,
          sender_id: req.user!.id,
          content: initialMessage,
        }]);
      }

      return res.json(success(conversation, "Conversation created successfully"));
    } catch (err: any) {
      console.error("[MESSAGING] Create conversation error:", err);
      return res.status(500).json(errorResponse("Failed to create conversation"));
    }
  });

  // Send message
  app.post("/api/conversations/:id/messages", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { data: participation } = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", req.params.id)
        .eq("user_id", req.user!.id)
        .single();

      if (!participation) {
        return res.status(403).json(errorResponse("Not authorized to send messages to this conversation"));
      }

      const { content, messageType, attachments } = req.body;

      if (!content?.trim()) {
        return res.status(400).json(errorResponse("Message content is required"));
      }

      const { data: message, error } = await supabase
        .from("messages")
        .insert([{
          conversation_id: req.params.id,
          sender_id: req.user!.id,
          content: content.trim(),
          message_type: messageType || "text",
          attachments: attachments || null,
        }])
        .select(`*, users:sender_id(id, full_name, profile_image)`)
        .single();

      if (error) throw error;

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", req.params.id);

      return res.json(success(message, "Message sent successfully"));
    } catch (err: any) {
      console.error("[MESSAGING] Send message error:", err);
      return res.status(500).json(errorResponse("Failed to send message"));
    }
  });

  // Mark conversation as read
  app.patch("/api/conversations/:id/read", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { error } = await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", req.params.id)
        .eq("user_id", req.user!.id);

      if (error) throw error;
      return res.json(success(null, "Conversation marked as read"));
    } catch (err: any) {
      console.error("[MESSAGING] Mark read error:", err);
      return res.status(500).json(errorResponse("Failed to mark conversation as read"));
    }
  });

  // Agency dashboard stats
  app.get("/api/agencies/:id/stats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const agencyId = req.params.id;

      const [agentsResult, transactionsResult, propertiesResult] = await Promise.all([
        supabase
          .from("users")
          .select("id, total_sales, rating")
          .eq("agency_id", agencyId)
          .is("deleted_at", null),
        supabase
          .from("transactions")
          .select("*")
          .eq("agency_id", agencyId),
        supabase
          .from("properties")
          .select("id, status")
          .eq("agency_id", agencyId)
          .is("deleted_at", null),
      ]);

      const agents = agentsResult.data || [];
      const transactions = transactionsResult.data || [];
      const properties = propertiesResult.data || [];

      const completedTransactions = transactions.filter(t => t.status === "completed");
      const totalRevenue = completedTransactions.reduce((acc, t) => acc + parseFloat(t.agency_commission || "0"), 0);
      const totalCommissions = completedTransactions.reduce((acc, t) => acc + parseFloat(t.commission_amount || "0"), 0);

      const stats = {
        totalAgents: agents.length,
        totalProperties: properties.length,
        activeListings: properties.filter(p => p.status === "active").length,
        totalTransactions: transactions.length,
        completedTransactions: completedTransactions.length,
        pendingTransactions: transactions.filter(t => t.status === "pending").length,
        totalRevenue,
        totalCommissions,
        averageAgentRating: agents.length > 0 
          ? agents.reduce((acc, a) => acc + parseFloat(a.rating || "0"), 0) / agents.length 
          : 0,
        totalSales: agents.reduce((acc, a) => acc + (a.total_sales || 0), 0),
      };

      return res.json(success(stats, "Agency stats fetched successfully"));
    } catch (err: any) {
      return res.status(500).json(errorResponse("Failed to fetch agency stats"));
    }
  });

  return httpServer;
}
