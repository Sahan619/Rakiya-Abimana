import assert from "node:assert/strict";
import { test } from "node:test";
import { Role } from "@prisma/client";
import {
  CHAT_PAIRS,
  PERMISSION_NAMES,
  Permission,
  ROLE_DEFINITIONS,
  hasPermission,
  isRoleEnabled,
  permissionsForRoles
} from "./permissions";

const expectedPermissions: Record<Role, Permission[]> = {
  [Role.Admin]: [
    "job:list_public",
    "job:view_detail",
    "pitch:browse_approved",
    "user:manage",
    "settings:manage",
    "masterdata:manage",
    "audit:view",
    "profile:manage_own",
    "notification:view_own"
  ],
  [Role.Verifier]: [
    "job:list_public",
    "pitch:browse_approved",
    "verification:review",
    "pitch:review",
    "profile:manage_own",
    "notification:view_own"
  ],
  [Role.JobSeeker]: [
    "job:list_public",
    "job:view_detail",
    "job:apply",
    "application:view_own",
    "job:nearby",
    "chat:use",
    "verification:submit",
    "profile:manage_own",
    "notification:view_own"
  ],
  [Role.Entrepreneur]: [
    "job:list_public",
    "job:nearby",
    "pitch:create",
    "pitch:manage_own",
    "chat:use",
    "verification:submit",
    "profile:manage_own",
    "notification:view_own"
  ],
  [Role.Employer]: [
    "job:list_public",
    "job:view_detail",
    "job:create",
    "job:manage_own",
    "applicant:view",
    "applicant:update_status",
    "chat:use",
    "verification:submit",
    "profile:manage_own",
    "notification:view_own"
  ],
  [Role.Funder]: [
    "job:list_public",
    "pitch:browse_approved",
    "pitch:express_interest",
    "chat:use",
    "verification:submit",
    "profile:manage_own",
    "notification:view_own"
  ],
  [Role.TrainingProvider]: []
};

test("every role has exactly its configured permission allow-list", () => {
  for (const role of Object.values(Role)) {
    const allowed = expectedPermissions[role];
    assert.deepEqual(permissionsForRoles([role]).sort(), [...allowed].sort(), `${role} permissions`);
    for (const permission of PERMISSION_NAMES) {
      assert.equal(hasPermission([role], permission), allowed.includes(permission), `${role} ${permission}`);
    }
  }
  assert.equal(hasPermission([Role.JobSeeker], "job:create"), false);
  assert.equal(hasPermission([Role.Admin], "pitch:review"), false);
  assert.equal(hasPermission([Role.Entrepreneur], "job:create"), false);
  assert.equal(hasPermission([Role.Funder], "job:apply"), false);
});

test("TrainingProvider is disabled and cannot self-register", () => {
  assert.deepEqual(ROLE_DEFINITIONS[Role.TrainingProvider].permissions, []);
  assert.equal(ROLE_DEFINITIONS[Role.TrainingProvider].selfRegistrable, false);
  assert.equal(isRoleEnabled(Role.TrainingProvider), false);
});

test("multiple roles contribute a union and disabled roles contribute nothing", () => {
  const permissions = permissionsForRoles([Role.JobSeeker, Role.Employer, Role.TrainingProvider]);
  assert.equal(permissions.includes("job:apply"), true);
  assert.equal(permissions.includes("job:create"), true);
  assert.equal(permissions.includes("pitch:create"), false);
  assert.deepEqual(
    permissionsForRoles([Role.JobSeeker, Role.TrainingProvider]).sort(),
    permissionsForRoles([Role.JobSeeker]).sort()
  );
});

test("chat pairs permit only the defined role pairings and context types", () => {
  const allowed = (first: Role, second: Role, type: "JOB_APPLICATION" | "PITCH_INTEREST") =>
    CHAT_PAIRS.some((pair) =>
      pair.type === type &&
      ((pair.roles[0] === first && pair.roles[1] === second) ||
        (pair.roles[0] === second && pair.roles[1] === first))
    );

  assert.equal(allowed(Role.JobSeeker, Role.Employer, "JOB_APPLICATION"), true);
  assert.equal(allowed(Role.Entrepreneur, Role.Funder, "PITCH_INTEREST"), true);
  assert.equal(allowed(Role.JobSeeker, Role.Funder, "JOB_APPLICATION"), false);
  assert.equal(allowed(Role.Entrepreneur, Role.Employer, "PITCH_INTEREST"), false);
  assert.equal(allowed(Role.Employer, Role.JobSeeker, "PITCH_INTEREST"), false);
});
