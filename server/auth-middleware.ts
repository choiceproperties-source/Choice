import { Request, Response, NextFunction } from "express";
import { supabase } from "./supabase";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email || "",
      role: userData?.role || "user",
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  supabase.auth
    .getUser(token)
    .then(async ({ data: { user }, error }) => {
      if (!error && user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        req.user = {
          id: user.id,
          email: user.email || "",
          role: userData?.role || "user",
        };
      }
      next();
    })
    .catch(() => next());
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

export function requireOwnership(resourceType: "property" | "application" | "review") {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.role === "admin") {
      return next();
    }

    const resourceId = req.params.id;
    let isOwner = false;

    try {
      if (resourceType === "property") {
        const { data } = await supabase
          .from("properties")
          .select("owner_id")
          .eq("id", resourceId)
          .single();
        isOwner = data?.owner_id === req.user.id;
      } else if (resourceType === "application") {
        const { data } = await supabase
          .from("applications")
          .select("user_id")
          .eq("id", resourceId)
          .single();
        isOwner = data?.user_id === req.user.id;
      } else if (resourceType === "review") {
        const { data } = await supabase
          .from("reviews")
          .select("user_id")
          .eq("id", resourceId)
          .single();
        isOwner = data?.user_id === req.user.id;
      }

      if (!isOwner) {
        return res.status(403).json({ error: "You do not own this resource" });
      }

      next();
    } catch (error) {
      console.error("Ownership check error:", error);
      return res.status(500).json({ error: "Failed to verify ownership" });
    }
  };
}
