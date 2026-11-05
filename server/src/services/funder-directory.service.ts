import { Role } from "@prisma/client";

export interface FunderDirectoryRecord {
  id: string;
  fullName: string;
  isActive: boolean;
  isVerified: boolean;
  roles: { role: Role }[];
  funderProfile: {
    listedInDirectory: boolean;
    funderType: string;
    organizationName: string | null;
    focusDistricts: string | null;
    focusSectors: string | null;
    fundingInterests: string | null;
  } | null;
}

export interface PublicFunder {
  id: string;
  displayName: string;
  funderType: string;
  focusDistricts: string[];
  focusSectors: string[];
  shortBio: string | null;
  isVerified: boolean;
}

export interface FunderDirectoryFilters {
  district?: string;
  sector?: string;
  funderType?: string;
}

function splitValues(value: string | null): string[] {
  return value
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
}

function hasValue(values: string[], filter: string | undefined): boolean {
  return !filter || values.some((value) => value.toLocaleLowerCase() === filter.toLocaleLowerCase());
}

export function filterFunderDirectory(
  records: readonly FunderDirectoryRecord[],
  filters: FunderDirectoryFilters
): PublicFunder[] {
  return records.flatMap((record) => {
    const profile = record.funderProfile;
    if (
      !record.isActive ||
      !record.isVerified ||
      !record.roles.some(({ role }) => role === Role.Funder) ||
      !profile?.listedInDirectory
    ) {
      return [];
    }

    const focusDistricts = splitValues(profile.focusDistricts);
    const focusSectors = splitValues(profile.focusSectors);
    if (
      !hasValue(focusDistricts, filters.district) ||
      !hasValue(focusSectors, filters.sector) ||
      (filters.funderType && profile.funderType.toLocaleLowerCase() !== filters.funderType.toLocaleLowerCase())
    ) {
      return [];
    }

    return [{
      id: record.id,
      displayName: profile.organizationName?.trim() || record.fullName,
      funderType: profile.funderType,
      focusDistricts,
      focusSectors,
      shortBio: profile.fundingInterests,
      isVerified: true
    }];
  });
}
