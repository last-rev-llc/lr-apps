import type { Permission } from "@repo/db/types";

export const PERMISSION_HIERARCHY: Permission[] = ["view", "edit", "admin"];

export function hasPermission(
  userPermission: Permission,
  requiredPermission: Permission,
): boolean {
  const userLevel = PERMISSION_HIERARCHY.indexOf(userPermission);
  const requiredLevel = PERMISSION_HIERARCHY.indexOf(requiredPermission);
  return userLevel >= requiredLevel;
}
