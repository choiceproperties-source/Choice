import type { Express } from "express";
import { createServer, type Server } from "http";
import { supabase } from "./supabase";
import {
  sendEmail,
  getAgentInquiryEmailTemplate,
  getApplicationConfirmationEmailTemplate,
} from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // ===== AUTHENTICATION =====
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, fullName } = req.body;

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name: fullName },
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true, user: data.user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      res.json({ success: true, session: data.session });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== PROPERTIES =====
  app.get("/api/properties", async (req, res) => {
    try {
      const { propertyType, city, minPrice, maxPrice } = req.query;

      let query = supabase.from("properties").select("*");

      if (propertyType) query = query.eq("property_type", propertyType);
      if (city) query = query.ilike("city", `%${city}%`);
      if (minPrice) query = query.gte("price", minPrice);
      if (maxPrice) query = query.lte("price", maxPrice);

      const { data, error } = await query;

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .insert([req.body])
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== APPLICATIONS =====
  app.post("/api/applications", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .insert([req.body])
        .select();

      if (error) throw error;

      // Send confirmation email
      await sendEmail({
        to: req.body.applicantEmail || "",
        subject: "Your Application Has Been Received",
        html: getApplicationConfirmationEmailTemplate({
          applicantName: req.body.applicantName || "Applicant",
          propertyTitle: req.body.propertyTitle || "Your Property",
        }),
      });

      res.json(data[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/applications/user/:userId", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", req.params.userId);

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/applications/:id", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .update(req.body)
        .eq("id", req.params.id)
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== INQUIRIES =====
  app.post("/api/inquiries", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .insert([req.body])
        .select();

      if (error) throw error;

      // Send email to agent
      const agentData = await supabase
        .from("users")
        .select("email")
        .eq("id", req.body.agent_id)
        .single();

      if (agentData.data?.email) {
        await sendEmail({
          to: agentData.data.email,
          subject: "New Inquiry Received",
          html: getAgentInquiryEmailTemplate({
            senderName: req.body.sender_name,
            senderEmail: req.body.sender_email,
            senderPhone: req.body.sender_phone,
            message: req.body.message,
          }),
        });
      }

      res.json(data[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/inquiries/agent/:agentId", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .eq("agent_id", req.params.agentId);

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== REQUIREMENTS =====
  app.post("/api/requirements", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("requirements")
        .insert([req.body])
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/requirements/user/:userId", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("requirements")
        .select("*")
        .eq("user_id", req.params.userId);

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== FAVORITES =====
  app.post("/api/favorites", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .insert([req.body])
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/favorites/:id", async (req, res) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/favorites/user/:userId", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", req.params.userId);

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== REVIEWS =====
  app.get("/api/reviews/property/:propertyId", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("property_id", req.params.propertyId);

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert([req.body])
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== HEALTH CHECK =====
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return httpServer;
}
