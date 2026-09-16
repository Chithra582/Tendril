export interface GuardrailCheckResult {
  isSafe: boolean;
  sanitizedText: string;
  redactedEntities: Array<{
    type: 'SSN' | 'CreditCard' | 'Email' | 'Phone' | 'APIKey' | 'IPAddress';
    original: string;
    replacement: string;
  }>;
  injectionDetected: boolean;
  injectionConfidence: number;
  warnings: string[];
}

export class EnkryptPrivacyGuardrail {
  // Regex patterns for sensitive PII & Secrets
  private static SSN_REGEX = /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g;
  private static CREDIT_CARD_REGEX = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g;
  private static EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private static PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
  private static API_KEY_REGEX = /(?:AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{35}|sk-[a-zA-Z0-9]{32,}|ghp_[a-zA-Z0-9]{36})/g;
  private static IP_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;

  // Prompt injection keywords & jailbreak patterns
  private static INJECTION_PATTERNS = [
    /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions/i,
    /disregard\s+(?:system\s+)?prompt/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /jailbreak/i,
    /reveal\s+(?:your\s+)?(?:system\s+)?instructions/i,
    /bypass\s+(?:safety|guardrails)/i,
    /act\s+as\s+an\s+unfiltered\s+ai/i,
  ];

  /**
   * Scan and sanitize input text before transmitting to the Small Cloud LLM
   */
  public static sanitize(text: string): GuardrailCheckResult {
    let sanitized = text;
    const redactedEntities: GuardrailCheckResult['redactedEntities'] = [];
    const warnings: string[] = [];
    let injectionDetected = false;
    let injectionConfidence = 0;

    // 1. Check prompt injection
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        injectionDetected = true;
        injectionConfidence = Math.max(injectionConfidence, 0.95);
        warnings.push(`Potential prompt injection detected: matching pattern "${pattern.source}"`);
      }
    }

    // 2. Redact API keys & Secrets
    sanitized = sanitized.replace(this.API_KEY_REGEX, (match) => {
      const replacement = '[REDACTED_API_KEY]';
      redactedEntities.push({ type: 'APIKey', original: match, replacement });
      return replacement;
    });

    // 3. Redact SSN
    sanitized = sanitized.replace(this.SSN_REGEX, (match) => {
      const replacement = '[REDACTED_SSN]';
      redactedEntities.push({ type: 'SSN', original: match, replacement });
      return replacement;
    });

    // 4. Redact Credit Cards
    sanitized = sanitized.replace(this.CREDIT_CARD_REGEX, (match) => {
      const replacement = '[REDACTED_CREDIT_CARD]';
      redactedEntities.push({ type: 'CreditCard', original: match, replacement });
      return replacement;
    });

    // 5. Redact Emails
    sanitized = sanitized.replace(this.EMAIL_REGEX, (match) => {
      const replacement = '[REDACTED_EMAIL]';
      redactedEntities.push({ type: 'Email', original: match, replacement });
      return replacement;
    });

    // 6. Redact Phone numbers
    sanitized = sanitized.replace(this.PHONE_REGEX, (match) => {
      const replacement = '[REDACTED_PHONE]';
      redactedEntities.push({ type: 'Phone', original: match, replacement });
      return replacement;
    });

    // 7. Redact IP addresses
    sanitized = sanitized.replace(this.IP_REGEX, (match) => {
      const replacement = '[REDACTED_IP]';
      redactedEntities.push({ type: 'IPAddress', original: match, replacement });
      return replacement;
    });

    const isSafe = !injectionDetected;

    return {
      isSafe,
      sanitizedText: sanitized,
      redactedEntities,
      injectionDetected,
      injectionConfidence,
      warnings,
    };
  }
}
