import { Request, Response, NextFunction } from "express";
import { supabase } from "./supabase";
import { cache, CACHE_TTL } from "./cache";

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

    // Check cache first to avoid N+1 query
    const cacheKey = `user_role:${user.id}`;
    let cachedRole = cache.get<string>(cacheKey) || "renter";
    
    if (cachedRole === "renter" && !cache.has(cacheKey)) {
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      cachedRole = userData?.role || "renter";
      cache.set(cacheKey, cachedRole, CACHE_TTL.USER_ROLE);
    }

    req.user = {
      id: user.id,
      email: user.email || "",
      role: cachedRole,
    };

    next();
  } catch (error) {
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
        // Check cache first to avoid N+1 query
        const cacheKey = `user_role:${user.id}`;
        let cachedRole = cache.get<string>(cacheKey) || "renter";
        
        if (cachedRole === "renter" && !cache.has(cacheKey)) {
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();
          cachedRole = userData?.role || "renter";
          cache.set(cacheKey, cachedRole, CACHE_TTL.USER_ROLE);
        }

        req.user = {
          id: user.id,
          email: user.email || "",
          role: cachedRole,
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

export function requireOwnership(resourceType: "property" | "application" | "review" | "inquiry" | "saved_search" | "user" | "favorite") {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.role === "admin") {
      return next();
    }

    const resourceId = req.params.id;
    let data: any = null;
    let isOwner = false;
    const resourceNames: Record<string, string> = {
      property: "Property",
      application: "Application",
      review: "Review",
      inquiry: "Inquiry",
      saved_search: "Saved search",
      user: "User",
      favorite: "Favorite",
    };

    try {
      if (resourceType === "property") {
        const result = await supabase
          .from("properties")
          .select("owner_id")
          .eq("id", resourceId)
          .single();
        data = result.data;
        isOwner = data?.owner_id === req.user.id;
      } else if (resourceType === "application") {
        const result = await supabase
          .from("applications")
          .select("user_id")
          .eq("id", resourceId)
          .single();
        data = result.data;
        isOwner = data?.user_id === req.user.id;
      } else if (resourceType === "review") {
        const result = await supabase
          .from("reviews")
          .select("user_id")
          .eq("id", resourceId)
          .single();
        data = result.data;
        isOwner = data?.user_id === req.user.id;
      } else if (resourceType === "inquiry") {
        const result = await supabase
          .from("inquiries")
          .select("agent_id")
          .eq("id", resourceId)
          .single();
        data = result.data;
        isOwner = data?.agent_id === req.user.id;
      } else if (resourceType === "saved_search") {
        const result = await supabase
          .from("saved_searches")
          .select("user_id")
          .eq("id", resourceId)
          .single();
        data = result.data;
        isOwner = data?.user_id === req.user.id;
      } else if (resourceType === "user") {
        isOwner = resourceId === req.user.id;
        data = isOwner ? { id: resourceId } : null;
      } else if (resourceType === "favorite") {
        const result = await supabase
          .from("favorites")
          .select("user_id")
          .eq("id", resourceId)
          .single();
        data = result.data;
        isOwner = data?.user_id === req.user.id;
      }

      if (!data) {
        return res.status(404).json({ error: `${resourceNames[resourceType]} not found` });
      }

      if (!isOwner) {
        return res.status(403).json({ error: "You do not own this resource" });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: "Failed to verify ownership" });
    }
  };
}
