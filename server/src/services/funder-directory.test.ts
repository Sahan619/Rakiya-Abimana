import assert from "node:assert/strict";
import { test } from "node:test";
import { Role } from "@prisma/client";
import { filterFunderDirectory, FunderDirectoryRecord } from "./funder-directory.service";

const publicFunder = {
  id: "funder-1",
  fullName: "A. Funder",
  email: "private@example.com",
  phone: "+94000000000",
  isActive: true,
  isVerified: true,
  roles: [{ role: Role.Funder }],
  funderProfile: {
    listedInDirectory: true,
    funderType: "NGO",
    organizationName: "Community Fund",
    focusDistricts: "colombo, kandy",
    focusSectors: "agriculture",
    fundingInterests: "Supports local agriculture."
  }
} satisfies FunderDirectoryRecord & { email: string; phone: string };

test("public directory data excludes contact and identity information", () => {
  const [funder] = filterFunderDirectory([publicFunder], {});
  assert.deepEqual(Object.keys(funder).sort(), [
    "displayName",
    "focusDistricts",
    "focusSectors",
    "funderType",
    "id",
    "isVerified",
    "shortBio"
  ]);
  assert.equal("email" in funder, false);
  assert.equal("phone" in funder, false);
  assert.equal("nic" in funder, false);
  assert.equal("documents" in funder, false);
});

test("directory omits unlisted, inactive, unverified, and non-Funder records", () => {
  const ineligible = [
    { ...publicFunder, funderProfile: { ...publicFunder.funderProfile, listedInDirectory: false } },
    { ...publicFunder, isActive: false },
    { ...publicFunder, isVerified: false },
    { ...publicFunder, roles: [{ role: Role.Entrepreneur }] }
  ];
  assert.deepEqual(filterFunderDirectory(ineligible, {}), []);
});

test("directory filters exact focus values and funder type", () => {
  assert.equal(filterFunderDirectory([publicFunder], { district: "colombo" }).length, 1);
  assert.equal(filterFunderDirectory([publicFunder], { district: "ombo" }).length, 0);
  assert.equal(filterFunderDirectory([publicFunder], { sector: "agriculture" }).length, 1);
  assert.equal(filterFunderDirectory([publicFunder], { funderType: "ngo" }).length, 1);
  assert.equal(filterFunderDirectory([publicFunder], { funderType: "MFI" }).length, 0);
});
