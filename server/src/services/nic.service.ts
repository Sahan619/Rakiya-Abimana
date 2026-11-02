export interface NicDetails {
  isValidFormat: boolean;
  format: "OLD" | "NEW" | "INVALID";
  gender?: "MALE" | "FEMALE";
  extractedDob?: Date;
  dobMatch: boolean;
  errors: string[];
}

export interface VerificationHookResult {
  hookName: string;
  isFormatValid: boolean;
  format: "OLD" | "NEW" | "INVALID";
  dobMatch: boolean;
  extractedDob?: Date;
  details: string;
  govVerified?: boolean;
}

export interface IVerificationHook {
  name: string;
  verify(nic: string, enteredDob: Date): Promise<VerificationHookResult>;
}

// Days in months using Sri Lankan DRP 366-day model (Feb has 29 days)
const MONTH_DAYS = [
  { month: 1, days: 31 },
  { month: 2, days: 29 },
  { month: 3, days: 31 },
  { month: 4, days: 30 },
  { month: 5, days: 31 },
  { month: 6, days: 30 },
  { month: 7, days: 31 },
  { month: 8, days: 31 },
  { month: 9, days: 30 },
  { month: 10, days: 31 },
  { month: 11, days: 30 },
  { month: 12, days: 31 }
];

function getMonthAndDayFromDayOfYear(dayOfYear: number): { month: number; day: number } | null {
  if (dayOfYear < 1 || dayOfYear > 366) {
    return null;
  }
  let remainingDays = dayOfYear;
  for (const m of MONTH_DAYS) {
    if (remainingDays <= m.days) {
      return { month: m.month, day: remainingDays };
    }
    remainingDays -= m.days;
  }
  return null;
}

export function parseAndValidateNic(nicRaw: string, enteredDob: Date): NicDetails {
  const nic = (nicRaw || "").trim().toUpperCase();
  const errors: string[] = [];

  const oldNicRegex = /^(\d{2})(\d{3})(\d{4})([VX])$/;
  const newNicRegex = /^(\d{4})(\d{3})(\d{5})$/;

  let birthYear: number;
  let rawDayOfYear: number;
  let format: "OLD" | "NEW" | "INVALID" = "INVALID";

  if (oldNicRegex.test(nic)) {
    format = "OLD";
    const matches = nic.match(oldNicRegex)!;
    birthYear = 1900 + parseInt(matches[1], 10);
    rawDayOfYear = parseInt(matches[2], 10);
  } else if (newNicRegex.test(nic)) {
    format = "NEW";
    const matches = nic.match(newNicRegex)!;
    birthYear = parseInt(matches[1], 10);
    rawDayOfYear = parseInt(matches[2], 10);
  } else {
    return {
      isValidFormat: false,
      format: "INVALID",
      dobMatch: false,
      errors: ["NIC must be in old format (9 digits + V/X) or new format (12 digits)"]
    };
  }

  const gender: "MALE" | "FEMALE" = rawDayOfYear > 500 ? "FEMALE" : "MALE";
  const dayOfYear = rawDayOfYear > 500 ? rawDayOfYear - 500 : rawDayOfYear;

  const monthDay = getMonthAndDayFromDayOfYear(dayOfYear);
  if (!monthDay) {
    errors.push("Invalid day-of-year sequence encoded in NIC");
    return {
      isValidFormat: false,
      format,
      dobMatch: false,
      errors
    };
  }

  // Extracted DOB as UTC Date
  const extractedDob = new Date(Date.UTC(birthYear, monthDay.month - 1, monthDay.day));

  // Check against entered DOB
  const entered = new Date(enteredDob);
  const enteredYear = entered.getUTCFullYear();
  const enteredMonth = entered.getUTCMonth() + 1;
  const enteredDay = entered.getUTCDate();

  // Also check local time comparison to accommodate timezone differences
  const enteredLocalYear = entered.getFullYear();
  const enteredLocalMonth = entered.getMonth() + 1;
  const enteredLocalDay = entered.getDate();

  const isUtcMatch = (birthYear === enteredYear && monthDay.month === enteredMonth && monthDay.day === enteredDay);
  const isLocalMatch = (birthYear === enteredLocalYear && monthDay.month === enteredLocalMonth && monthDay.day === enteredLocalDay);

  const dobMatch = isUtcMatch || isLocalMatch;

  if (!dobMatch) {
    errors.push(`Date of birth in NIC (${birthYear}-${String(monthDay.month).padStart(2, "0")}-${String(monthDay.day).padStart(2, "0")}) does not match entered date of birth`);
  }

  return {
    isValidFormat: true,
    format,
    gender,
    extractedDob,
    dobMatch,
    errors
  };
}

export class FormatVerificationHook implements IVerificationHook {
  name = "FormatAndDobVerificationHook";

  async verify(nic: string, enteredDob: Date): Promise<VerificationHookResult> {
    const details = parseAndValidateNic(nic, enteredDob);
    return {
      hookName: this.name,
      isFormatValid: details.isValidFormat,
      format: details.format,
      dobMatch: details.dobMatch,
      extractedDob: details.extractedDob,
      details: details.errors.length > 0 ? details.errors.join("; ") : "NIC format and embedded DOB successfully validated"
    };
  }
}

export class GovernmentLiveVerificationStub implements IVerificationHook {
  name = "GovernmentLiveVerificationStub";

  async verify(nic: string, enteredDob: Date): Promise<VerificationHookResult> {
    // Runs format verification first
    const formatHook = new FormatVerificationHook();
    const result = await formatHook.verify(nic, enteredDob);

    // Stubs future government registry integration (e.g. Department of Registration of Persons live check)
    const isMockGovMatch = result.isFormatValid && result.dobMatch;

    return {
      ...result,
      hookName: this.name,
      govVerified: isMockGovMatch,
      details: isMockGovMatch
        ? `${result.details} | [STUB] Government DRP Registry verified response: ACTIVE_CITIZEN`
        : `${result.details} | [STUB] Government DRP Registry check: NOT_MATCHED`
    };
  }
}

export function getVerificationHook(hookType = process.env.VERIFICATION_HOOK): IVerificationHook {
  if (hookType === "gov_live_stub") {
    return new GovernmentLiveVerificationStub();
  }
  return new FormatVerificationHook();
}

