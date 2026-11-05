import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

export type TranslationLanguage = "en" | "si" | "ta";

export interface TranslationOutcome {
  text: string;
  provider: string;
  cacheable: boolean;
}

export interface ITranslationProvider {
  name: string;
  translateText(text: string, fromLang: string, toLang: string): Promise<TranslationOutcome>;
}

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

function normalizedPhrase(text: string): string {
  return text.trim().toLocaleLowerCase();
}

export function detectSourceLanguage(text: string, fallback = "en"): TranslationLanguage {
  let sinhalaCharacters = 0;
  let tamilCharacters = 0;

  for (const character of text) {
    const codePoint = character.codePointAt(0) || 0;
    if (codePoint >= 0x0d80 && codePoint <= 0x0dff) sinhalaCharacters++;
    if (codePoint >= 0x0b80 && codePoint <= 0x0bff) tamilCharacters++;
  }

  if (sinhalaCharacters > tamilCharacters) return "si";
  if (tamilCharacters > sinhalaCharacters) return "ta";
  return fallback === "si" || fallback === "ta" ? fallback : "en";
}

export function isAutoTranslationEnabled(): boolean {
  const setting = process.env.AUTO_TRANSLATE_ENABLED?.trim().toLowerCase();
  return setting !== "false" && setting !== "0";
}

export class MockTranslationProvider implements ITranslationProvider {
  name = "MockTranslationProvider";

  async translateText(text: string, fromLang: string, toLang: string): Promise<TranslationOutcome> {
    const unchanged = (): TranslationOutcome => ({ text, provider: this.name, cacheable: true });
    if (!text || fromLang === toLang) return unchanged();

    const phrase = normalizedPhrase(text);
    if (toLang === "si" || toLang === "ta") {
      const exactMatch = DICTIONARY[phrase];
      return exactMatch
        ? { text: exactMatch[toLang], provider: this.name, cacheable: true }
        : unchanged();
    }

    if (toLang === "en" && (fromLang === "si" || fromLang === "ta")) {
      const exactMatch = Object.entries(DICTIONARY).find(([, translations]) =>
        normalizedPhrase(translations[fromLang]) === phrase
      );
      return exactMatch
        ? { text: exactMatch[0], provider: this.name, cacheable: true }
        : unchanged();
    }

    return unchanged();
  }
}

export class GoogleTranslationProvider implements ITranslationProvider {
  name = "GoogleTranslationProvider";

  constructor(private readonly apiKey: string) {}

  async translateText(text: string, fromLang: string, toLang: string): Promise<TranslationOutcome> {
    if (!text || fromLang === toLang) {
      return { text, provider: this.name, cacheable: true };
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

      const data = await response.json() as {
        data?: { translations?: Array<{ translatedText?: string }> };
      };
      const translatedText = data.data?.translations?.[0]?.translatedText;
      if (typeof translatedText !== "string") {
        throw new Error("Google Translate returned an invalid response.");
      }

      return { text: translatedText, provider: this.name, cacheable: true };
    } catch (error) {
      console.warn("Google Translate failed, falling back to mock:", error);
      const fallback = await new MockTranslationProvider().translateText(text, fromLang, toLang);
      return { ...fallback, cacheable: false };
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

export async function translateWithCache(
  prisma: PrismaClient,
  text: string,
  fromLang: string,
  toLang: string,
  provider: ITranslationProvider = getTranslationProvider()
): Promise<{ text: string; isMachineTranslated: boolean; provider: string }> {
  if (!text || fromLang === toLang || !isAutoTranslationEnabled()) {
    return { text, isMachineTranslated: false, provider: "ORIGINAL" };
  }

  const hash = crypto.createHash("md5").update(`${fromLang}:${toLang}:${text}`).digest("hex");
  const cacheKey = `${fromLang}_${toLang}_${hash}`;

  try {
    const cached = await prisma.translationCache.findUnique({ where: { cacheKey } });
    if (cached?.provider === provider.name) {
      return {
        text: cached.translatedText,
        isMachineTranslated: cached.translatedText !== text,
        provider: cached.provider
      };
    }
  } catch (error) {
    console.warn("Translation cache read failed:", error);
  }

  const outcome = await provider.translateText(text, fromLang, toLang);
  const isMachineTranslated = outcome.text !== text;
  if (isMachineTranslated && outcome.cacheable) {
    try {
      await prisma.translationCache.upsert({
        where: { cacheKey },
        update: { translatedText: outcome.text, provider: outcome.provider },
        create: {
          cacheKey,
          sourceLang: fromLang,
          targetLang: toLang,
          originalText: text,
          translatedText: outcome.text,
          provider: outcome.provider
        }
      });
    } catch (error) {
      console.warn("Translation cache write failed:", error);
    }
  }

  return {
    text: outcome.text,
    isMachineTranslated,
    provider: outcome.provider
  };
}
