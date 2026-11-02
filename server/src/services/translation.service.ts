import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

export interface ITranslationProvider {
  name: string;
  translateText(text: string, fromLang: string, toLang: string): Promise<string>;
}

// Common Sri Lankan terms dictionary for Mock Provider
const DICTIONARY: Record<string, { si: string; ta: string }> = {
  "carpenter": { si: "වඩු කාර්මික", ta: "தச்சர்" },
  "electrician": { si: "විදුලි කාර්මික", ta: "மின்சார வல்லுநர்" },
  "mason": { si: "මේසන් කාර්මික", ta: "கொத்தனார்" },
  "plumber": { si: "නල කාර්මික", ta: "குழாய் பொருத்துநர்" },
  "driver": { si: "රියදුරු", ta: "சாரதி" },
  "laborer": { si: "ශ්‍රමික", ta: "தொழிலாளி" },
  "tailor": { si: "ඇඳුම් මසන්නා", ta: "தையல்காரர்" },
  "clerk": { si: "ලිපිකරු", ta: "எழுத்தர்" },
  "job": { si: "රැකියාව", ta: "வேலை" },
  "wage": { si: "වැටුප", ta: "சம்பளம்" },
  "salary": { si: "මාසික වැටුප", ta: "சம்பளம்" },
  "monthly": { si: "මාසික", ta: "மாதாந்தம்" },
  "daily": { si: "දෛනික", ta: "தினசரி" },
  "hourly": { si: "පැයකට", ta: "மணித்தியாலத்திற்கு" },
  "experience": { si: "පළපුරුද්ද", ta: "அனுபவம்" },
  "years": { si: "වසර", ta: "ஆண்டுகள்" },
  "skills": { si: "නිපුණතා", ta: "திறன்கள்" },
  "district": { si: "දිස්ත්‍රික්කය", ta: "மாவட்டம்" },
  "funding needed": { si: "අවශ්‍ය අරමුදල", ta: "தேவையான நிதி" },
  "micro-loan": { si: "ක්ෂුද්‍ර ණය", ta: "நுண்கடன்" },
  "grant": { si: "ප්‍රදානය", ta: "மானிய நிதி" },
  "business": { si: "ව්‍යාපාරය", ta: "வணிகம்" },
  "pitch": { si: "ව්‍යාපාර යෝජනාව", ta: "வணிகத் திட்டம்" },
  "hello": { si: "ආයුබෝවන්", ta: "வணக்கம்" },
  "thank you": { si: "ස්තූතියි", ta: "நன்றி" },
  "interested": { si: "උනන්දුයි", ta: "ஆர்வமாக உள்ளது" },
  "verified": { si: "තහවුරු කරන ලදී", ta: "சரிபார்க்கப்பட்டது" }
};

export class MockTranslationProvider implements ITranslationProvider {
  name = "MockTranslationProvider";

  async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
    if (!text || fromLang === toLang) {
      return text;
    }

    const clean = text.trim();
    const lower = clean.toLowerCase();

    // Check direct dictionary match
    if (DICTIONARY[lower] && (toLang === "si" || toLang === "ta")) {
      return DICTIONARY[lower][toLang];
    }

    // Replace known dictionary words if found in text
    let translated = clean;
    for (const [key, val] of Object.entries(DICTIONARY)) {
      const regex = new RegExp(`\\b${key}\\b`, "gi");
      if (toLang === "si") {
        translated = translated.replace(regex, val.si);
      } else if (toLang === "ta") {
        translated = translated.replace(regex, val.ta);
      } else if (toLang === "en") {
        // Reverse match if translation to English
        if (clean.includes(val.si)) translated = translated.replace(val.si, key);
        if (clean.includes(val.ta)) translated = translated.replace(val.ta, key);
      }
    }

    if (toLang === "si") {
      return translated !== clean ? translated : `[සිංහල] ${clean}`;
    }
    if (toLang === "ta") {
      return translated !== clean ? translated : `[தமிழ்] ${clean}`;
    }
    if (toLang === "en") {
      return translated !== clean ? translated : `[English] ${clean}`;
    }

    return clean;
  }
}

export class GoogleTranslationProvider implements ITranslationProvider {
  name = "GoogleTranslationProvider";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
    if (!text || fromLang === toLang) return text;
    if (!this.apiKey) {
      // Fallback to mock if API key is not configured
      const fallback = new MockTranslationProvider();
      return fallback.translateText(text, fromLang, toLang);
    }

    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: fromLang,
          target: toLang,
          format: "text"
        })
      });

      if (!response.ok) {
        throw new Error(`Google Translate error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      return data.data.translations[0].translatedText;
    } catch (err) {
      console.warn("Google Translate failed, falling back to mock:", err);
      const fallback = new MockTranslationProvider();
      return fallback.translateText(text, fromLang, toLang);
    }
  }
}

export function getTranslationProvider(): ITranslationProvider {
  const providerType = process.env.TRANSLATION_PROVIDER?.toLowerCase();
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

  if (providerType === "google" && apiKey) {
    return new GoogleTranslationProvider(apiKey);
  }
  return new MockTranslationProvider();
}

/**
 * Get translation with database caching
 */
export async function translateWithCache(
  prisma: PrismaClient,
  text: string,
  fromLang: string,
  toLang: string
): Promise<{ text: string; isMachineTranslated: boolean; provider: string }> {
  if (!text || fromLang === toLang) {
    return { text, isMachineTranslated: false, provider: "ORIGINAL" };
  }

  const hash = crypto.createHash("md5").update(`${fromLang}:${toLang}:${text}`).digest("hex");
  const cacheKey = `${fromLang}_${toLang}_${hash}`;

  try {
    const cached = await prisma.translationCache.findUnique({
      where: { cacheKey }
    });

    if (cached) {
      return { text: cached.translatedText, isMachineTranslated: true, provider: cached.provider };
    }
  } catch (err) {
    // DB cache failure should not block translation
    console.warn("Translation cache read failed:", err);
  }

  const provider = getTranslationProvider();
  const translated = await provider.translateText(text, fromLang, toLang);

  try {
    await prisma.translationCache.upsert({
      where: { cacheKey },
      update: { translatedText: translated },
      create: {
        cacheKey,
        sourceLang: fromLang,
        targetLang: toLang,
        originalText: text,
        translatedText: translated,
        provider: provider.name
      }
    });
  } catch (err) {
    console.warn("Translation cache write failed:", err);
  }

  return { text: translated, isMachineTranslated: true, provider: provider.name };
}

