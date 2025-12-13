import { Request, Response, NextFunction } from "express";
import { supabase } from "./supabase";
import { cache, CACHE_TTL } from "./cache";
import { logSecurityEvent } from "./security/audit-logger";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    twoFactorEnabled?: boolean;
    twoFactorVerified?: boolean;
  };
}

export const ROLE_HIERARCHY: Record<string, number> = {
  admin: 100,
  owner: 80,
  agent: 70,
  landlord: 60,
  property_manager: 60,
  buyer: 20,
  renter: 10,
  guest: 0,
};

export const PROPERTY_EDIT_ROLES = ["admin", "owner", "agent", "landlord", "property_manager"];
export const APPLICATION_REVIEW_ROLES = ["admin", "owner", "agent", "landlord", "property_manager"];
export const SENSITIVE_DATA_ROLES = ["admin", "owner", "agent", "landlord", "property_manager"];
export const ADMIN_ONLY_ROLES = ["admin"];

export function hasHigherOrEqualRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

export function canEditProperties(role: string): boolean {
  return PROPERTY_EDIT_ROLES.includes(role);
}

export function canReviewApplications(role: string): boolean {
  return APPLICATION_REVIEW_ROLES.includes(role);
}

export function canAccessSensitiveData(role: string): boolean {
  return SENSITIVE_DATA_ROLES.includes(role);
}

export function isAdminOnly(role: string): boolean {
  return ADMIN_ONLY_ROLES.includes(role);
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

export function requirePropertyEditAccess() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!canEditProperties(req.user.role)) {
      logSecurityEvent(req.user.id, "login", false, { 
        reason: "Unauthorized property edit attempt", 
        role: req.user.role 
      }, req);
      return res.status(403).json({ 
        error: "You don't have permission to edit properties. Only landlords, property managers, agents, and admins can edit properties." 
      });
    }

    next();
  };
}

export function requireApplicationReviewAccess() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!canReviewApplications(req.user.role)) {
      logSecurityEvent(req.user.id, "login", false, { 
        reason: "Unauthorized application review attempt", 
        role: req.user.role 
      }, req);
      return res.status(403).json({ 
        error: "You don't have permission to review applications. Only property owners, landlords, agents, and admins can review applications." 
      });
    }

    next();
  };
}

export function preventTenantPropertyEdit() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const tenantRoles = ["renter", "buyer"];
    if (tenantRoles.includes(req.user.role)) {
      logSecurityEvent(req.user.id, "login", false, { 
        reason: "Tenant attempted to edit property", 
        role: req.user.role,
        path: req.path,
        method: req.method
      }, req);
      return res.status(403).json({ 
        error: "Tenants cannot modify property listings. Please contact the property owner or agent." 
      });
    }

    next();
  };
}

export function require2FAVerified() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.twoFactorEnabled && !req.user.twoFactorVerified) {
      return res.status(403).json({ 
        error: "Two-factor authentication required",
        requiresTwoFactor: true 
      });
    }

    next();
  };
}
