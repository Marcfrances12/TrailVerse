const ADMIN_ROLE = "ADMIN";

function idString(value) {
  if (value == null) return null;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (typeof value === "object") {
    const nestedId = value._id ?? value.id;
    if (nestedId != null && nestedId !== value) return idString(nestedId);
  }
  return String(value);
}

function isAdmin(user) {
  return user?.role === ADMIN_ROLE;
}

function isOwnerOrAdmin(user, resource) {
  if (isAdmin(user)) return true;
  const ownerId = resource?.ownerId ?? resource?.userId ?? resource?.createdBy;
  const actorId = user?.id ?? user?._id;
  return idString(ownerId) !== null && idString(ownerId) === idString(actorId);
}

function canAccessUserResource(user, resource) {
  if (isAdmin(user)) return true;
  const resourceUserId = resource?.userId ?? resource?._id ?? resource?.id;
  const actorId = user?.id ?? user?._id;
  return idString(resourceUserId) !== null && idString(resourceUserId) === idString(actorId);
}

function canModifyExperience(user, experience) {
  return isOwnerOrAdmin(user, experience);
}

module.exports = { isAdmin, isOwnerOrAdmin, canAccessUserResource, canModifyExperience };
