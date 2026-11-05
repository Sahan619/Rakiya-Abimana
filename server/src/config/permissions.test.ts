import assert from "node:assert/strict";
import { test } from "node:test";
import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import {
  GUEST_PERMISSIONS,
  PERMISSION_NAMES,
  Permission,
  ROLE_DEFINITIONS,
  chatPairAllows,
  hasPermission,
  isRoleEnabled,
  permissionsForRoles
} from "./permissions";
import { AuthenticatedUser } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/role.middleware";

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

test("Guest can only list public jobs", () => {
  assert.deepEqual(GUEST_PERMISSIONS, ["job:list_public"]);
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

function makeRequest(roles: Role[], isVerified: boolean): Request {
  const user: AuthenticatedUser = {
    id: "test-user",
    email: "test@example.com",
    fullName: "Test User",
    roles,
    isVerified,
    preferredLanguage: "en"
  };
  return { user } as Request;
}

function makeResponse() {
  let statusCode = 200;
  let responseBody: unknown;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
      return this;
    }
  } as Response;
  return {
    response,
    statusCode: () => statusCode,
    responseBody: () => responseBody
  };
}

test("requirePermission returns 401 when the request is unauthenticated", () => {
  const { response, statusCode, responseBody } = makeResponse();
  let nextCalled = false;
  const next: NextFunction = () => { nextCalled = true; };
  requirePermission("job:create")({} as Request, response, next);
  assert.equal(statusCode(), 401);
  assert.deepEqual(responseBody(), { error: "Authentication required" });
  assert.equal(nextCalled, false);
});

test("requirePermission returns 403 when the user lacks permission", () => {
  const { response, statusCode, responseBody } = makeResponse();
  let nextCalled = false;
  const next: NextFunction = () => { nextCalled = true; };
  requirePermission("job:create")(makeRequest([Role.JobSeeker], true), response, next);
  assert.equal(statusCode(), 403);
  assert.deepEqual(responseBody(), { error: "Access denied. Insufficient permissions." });
  assert.equal(nextCalled, false);
});

test("requirePermission calls next when the user has permission", () => {
  const { response, statusCode } = makeResponse();
  let nextCalled = false;
  const next: NextFunction = () => { nextCalled = true; };
  requirePermission("job:create")(makeRequest([Role.Employer], true), response, next);
  assert.equal(nextCalled, true);
  assert.equal(statusCode(), 200);
});

test("requirePermission rejects unverified users for verified permissions", () => {
  const { response, statusCode, responseBody } = makeResponse();
  let nextCalled = false;
  const next: NextFunction = () => { nextCalled = true; };
  requirePermission("job:create")(makeRequest([Role.Employer], false), response, next);
  assert.equal(statusCode(), 403);
  assert.deepEqual(responseBody(), {
    error: "Verification required. Please complete identity and business verification to perform this action."
  });
  assert.equal(nextCalled, false);
});

test("chat pairs permit only the defined role pairings and context types", () => {
  assert.equal(chatPairAllows([Role.JobSeeker], [Role.Employer], "JOB_APPLICATION"), true);
  assert.equal(chatPairAllows([Role.Entrepreneur], [Role.Funder], "PITCH_INTEREST"), true);
  assert.equal(chatPairAllows([Role.Employer], [Role.JobSeeker], "JOB_APPLICATION"), true);
  assert.equal(chatPairAllows([Role.Funder], [Role.Entrepreneur], "PITCH_INTEREST"), true);
  assert.equal(chatPairAllows([Role.JobSeeker], [Role.Funder], "JOB_APPLICATION"), false);
  assert.equal(chatPairAllows([Role.Entrepreneur], [Role.Employer], "PITCH_INTEREST"), false);
  assert.equal(chatPairAllows([Role.Employer], [Role.JobSeeker], "PITCH_INTEREST"), false);
  assert.equal(chatPairAllows([Role.JobSeeker, Role.TrainingProvider], [Role.Employer], "JOB_APPLICATION"), true);
  assert.equal(chatPairAllows([Role.TrainingProvider], [Role.Employer], "JOB_APPLICATION"), false);
});
