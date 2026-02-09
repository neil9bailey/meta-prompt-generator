// /backend-ui-bridge/auth/rbac.js

export const ROLES = {
  ADMIN: "admin",
  GOVERNOR: "governor",
  VIEWER: "viewer",
};

export const ROLE_PERMISSIONS = {
  admin: ["govern", "export", "view", "trust"],
  governor: ["govern", "view"],
  viewer: ["view"],
};

export function authorize(requiredPermission) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role || !ROLE_PERMISSIONS[role]?.includes(requiredPermission)) {
      return res.status(403).json({
        error: "Forbidden",
        reason: "Insufficient role permissions",
      });
    }

    next();
  };
}
