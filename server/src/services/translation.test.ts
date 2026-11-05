import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { PrismaClient } from "@prisma/client";
import {
  detectSourceLanguage,
  MockTranslationProvider,
  TranslationOutcome,
  translateWithCache
} from "./translation.service";

const previousAutoTranslateSetting = process.env.AUTO_TRANSLATE_ENABLED;
before(() => {
  process.env.AUTO_TRANSLATE_ENABLED = "true";
});
after(() => {
  if (previousAutoTranslateSetting === undefined) delete process.env.AUTO_TRANSLATE_ENABLED;
  else process.env.AUTO_TRANSLATE_ENABLED = previousAutoTranslateSetting;
});

interface CacheRow {
  translatedText: string;
  provider: string;
}

function createPrismaCache(cached: CacheRow | null = null) {
  const upserts: unknown[] = [];
  const prisma = {
    translationCache: {
      findUnique: async () => cached,
      upsert: async (input: unknown) => {
        upserts.push(input);
      }
    }
  } as unknown as PrismaClient;
  return { prisma, upserts };
}

test("detects Sinhala and Tamil scripts and preserves a valid fallback", () => {
  assert.equal(detectSourceLanguage("රැකියාව"), "si");
  assert.equal(detectSourceLanguage("வேலை"), "ta");
  assert.equal(detectSourceLanguage("English text", "ta"), "ta");
  assert.equal(detectSourceLanguage("English text", "invalid"), "en");
});

test("mock translations only translate exact dictionary phrases", async () => {
  const provider = new MockTranslationProvider();
  const exact = await provider.translateText("Carpenter", "en", "si");
  const sentence = await provider.translateText("Need an experienced carpenter", "en", "si");

  assert.equal(exact.text, "වඩු කාර්මික");
  assert.equal(sentence.text, "Need an experienced carpenter");
});

test("changed output is marked translated and cached", async () => {
  const { prisma, upserts } = createPrismaCache();
  const result = await translateWithCache(prisma, "carpenter", "en", "si");

  assert.equal(result.text, "වඩු කාර්මික");
  assert.equal(result.isMachineTranslated, true);
  assert.equal(upserts.length, 1);
});

test("unchanged mock output is not marked translated or cached", async () => {
  const { prisma, upserts } = createPrismaCache();
  const result = await translateWithCache(prisma, "Need a carpenter", "en", "si");

  assert.equal(result.text, "Need a carpenter");
  assert.equal(result.isMachineTranslated, false);
  assert.equal(upserts.length, 0);
});

test("cached rows from a different active provider are ignored", async () => {
  const { prisma, upserts } = createPrismaCache({
    translatedText: "stale translation",
    provider: "InactiveProvider"
  });
  let providerCalls = 0;
  const provider = {
    name: "ActiveProvider",
    translateText: async (): Promise<TranslationOutcome> => {
      providerCalls++;
      return { text: "current translation", provider: "ActiveProvider", cacheable: true };
    }
  };

  const result = await translateWithCache(prisma, "source text", "en", "ta", provider);

  assert.equal(result.text, "current translation");
  assert.equal(result.isMachineTranslated, true);
  assert.equal(providerCalls, 1);
  assert.equal(upserts.length, 1);
});

test("fallback translations are never cached", async () => {
  const { prisma, upserts } = createPrismaCache();
  const provider = {
    name: "GoogleTranslationProvider",
    translateText: async (): Promise<TranslationOutcome> => ({
      text: "fallback translation",
      provider: "MockTranslationProvider",
      cacheable: false
    })
  };

  const result = await translateWithCache(prisma, "source text", "en", "si", provider);

  assert.equal(result.text, "fallback translation");
  assert.equal(result.isMachineTranslated, true);
  assert.equal(upserts.length, 0);
});

test("AUTO_TRANSLATE_ENABLED disables translation and cache access", async () => {
  const previous = process.env.AUTO_TRANSLATE_ENABLED;
  process.env.AUTO_TRANSLATE_ENABLED = "false";
  const { prisma, upserts } = createPrismaCache();

  try {
    const result = await translateWithCache(prisma, "carpenter", "en", "si");
    assert.deepEqual(result, {
      text: "carpenter",
      isMachineTranslated: false,
      provider: "ORIGINAL"
    });
    assert.equal(upserts.length, 0);
  } finally {
    if (previous === undefined) delete process.env.AUTO_TRANSLATE_ENABLED;
    else process.env.AUTO_TRANSLATE_ENABLED = previous;
  }
});
