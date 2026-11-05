import { Role } from "@prisma/client";

export const PERMISSION_NAMES = [
  "job:list_public",
  "job:view_detail",
  "job:apply",
  "application:view_own",
  "job:nearby",
  "job:create",
  "job:manage_own",
  "applicant:view",
  "applicant:update_status",
  "pitch:create",
  "pitch:manage_own",
  "pitch:browse_approved",
  "pitch:express_interest",
  "funder:browse",
  "funder:contact",
  "funder:manage_listing",
  "chat:use",
  "verification:submit",
  "verification:review",
  "pitch:review",
  "user:manage",
  "settings:manage",
  "masterdata:manage",
  "audit:view",
  "profile:manage_own",
  "notification:view_own"
] as const;

export type Permission = typeof PERMISSION_NAMES[number];

interface PermissionMetadata {
  requiresVerified?: boolean;
  verificationExemptRoles?: Role[];
}

export const PERMISSIONS: Record<Permission, PermissionMetadata> = {
  "job:list_public": {},
  "job:view_detail": {},
  "job:apply": {},
  "application:view_own": {},
  "job:nearby": {},
  "job:create": { requiresVerified: true },
  "job:manage_own": {},
  "applicant:view": {},
  "applicant:update_status": {},
  "funder:browse": { requiresVerified: true, verificationExemptRoles: [Role.Admin, Role.Verifier] },
  "funder:contact": { requiresVerified: true },
  "funder:manage_listing": {},
  "pitch:create": { requiresVerified: true },
  "pitch:manage_own": {},
  "pitch:browse_approved": {},
  "pitch:express_interest": {},
  "chat:use": {},
  "verification:submit": {},
  "verification:review": {},
  "pitch:review": {},
  "user:manage": {},
  "settings:manage": {},
  "masterdata:manage": {},
  "audit:view": {},
  "profile:manage_own": {},
  "notification:view_own": {}
};

export interface RoleDefinition {
  label: string;
  enabled: boolean;
  selfRegistrable: boolean;
  permissions: Permission[];
}

const publicAndAccountPermissions: Permission[] = [
  "job:list_public",
  "profile:manage_own",
  "notification:view_own"
];

const accountPermissions: Permission[] = [
  "profile:manage_own",
  "notification:view_own"
];

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  [Role.Admin]: {
    label: "Admin",
    enabled: true,
    selfRegistrable: false,
    permissions: [
      ...publicAndAccountPermissions,
      "job:view_detail",
      "pitch:browse_approved",
      "funder:browse",
      "user:manage",
      "settings:manage",
      "masterdata:manage",
      "audit:view"
    ]
  },
  [Role.Verifier]: {
    label: "Verifier",
    enabled: true,
    selfRegistrable: false,
    permissions: [
      ...publicAndAccountPermissions,
      "pitch:browse_approved",
      "funder:browse",
      "verification:review",
      "pitch:review"
    ]
  },
  [Role.JobSeeker]: {
    label: "Job Seeker",
    enabled: true,
    selfRegistrable: true,
    permissions: [
      ...publicAndAccountPermissions,
      "job:view_detail",
      "job:apply",
      "application:view_own",
      "job:nearby",
      "chat:use",
      "verification:submit"
    ]
  },
  [Role.Entrepreneur]: {
    label: "Entrepreneur",
    enabled: true,
    selfRegistrable: true,
    permissions: [
      ...accountPermissions,
      "pitch:create",
      "pitch:manage_own",
      "funder:browse",
      "funder:contact",
      "chat:use",
      "verification:submit"
    ]
  },
  [Role.Employer]: {
    label: "Employer",
    enabled: true,
    selfRegistrable: true,
    permissions: [
      ...publicAndAccountPermissions,
      "job:view_detail",
      "job:create",
      "job:manage_own",
      "applicant:view",
      "applicant:update_status",
      "chat:use",
      "verification:submit"
    ]
  },
  [Role.Funder]: {
    label: "Funder",
    enabled: true,
    selfRegistrable: true,
    permissions: [
      ...publicAndAccountPermissions,
      "pitch:browse_approved",
      "pitch:express_interest",
      "funder:manage_listing",
      "chat:use",
      "verification:submit"
    ]
  },
  [Role.TrainingProvider]: {
    label: "Training Provider",
    enabled: false,
    selfRegistrable: false,
    permissions: []
  }
};

export const GUEST_PERMISSIONS: Permission[] = ["job:list_public"];

export const CHAT_PAIRS: ReadonlyArray<{
  type: "JOB_APPLICATION" | "PITCH_INTEREST" | "FUNDER_DIRECTORY";
  roles: readonly [Role, Role];
}> = [
  { type: "JOB_APPLICATION", roles: [Role.JobSeeker, Role.Employer] },
  { type: "PITCH_INTEREST", roles: [Role.Entrepreneur, Role.Funder] },
  { type: "FUNDER_DIRECTORY", roles: [Role.Entrepreneur, Role.Funder] }
];

export function chatPairAllows(
  firstRoles: readonly Role[],
  secondRoles: readonly Role[],
  type: string
): boolean {
  return CHAT_PAIRS.some(({ roles, type: pairType }) =>
    pairType === type &&
    ((isRoleEnabled(roles[0]) && firstRoles.includes(roles[0]) &&
      isRoleEnabled(roles[1]) && secondRoles.includes(roles[1])) ||
      (isRoleEnabled(roles[1]) && firstRoles.includes(roles[1]) &&
        isRoleEnabled(roles[0]) && secondRoles.includes(roles[0])))
  );
}

interface PermissionLookup {
  permissionsForRoles(roles: readonly Role[]): Set<Permission>;
  isRoleEnabled(role: Role): boolean;
}

const configPermissionLookup: PermissionLookup = {
  permissionsForRoles(roles) {
    const permissions = new Set<Permission>();
    for (const role of roles) {
      const definition = ROLE_DEFINITIONS[role];
      if (definition?.enabled) {
        definition.permissions.forEach((permission) => permissions.add(permission));
      }
    }
    return permissions;
  },
  isRoleEnabled(role) {
    return ROLE_DEFINITIONS[role]?.enabled ?? false;
  }
};

export function permissionsForRoles(roles: readonly Role[]): Permission[] {
  return Array.from(configPermissionLookup.permissionsForRoles(roles));
}

export function hasPermission(roles: readonly Role[], permission: Permission): boolean {
  return configPermissionLookup.permissionsForRoles(roles).has(permission);
}

export function isRoleEnabled(role: Role): boolean {
  return configPermissionLookup.isRoleEnabled(role);
}

export function permissionsForGuest(): Permission[] {
  return [...GUEST_PERMISSIONS];
}
