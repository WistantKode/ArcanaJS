import * as argon2 from "argon2";
import crypto from "crypto";
import { AuthConfig } from "../types";

/**
 * Password strength validation result
 */
export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

/**
 * Argon2 configuration for secure password hashing
 * Based on OWASP recommendations for Argon2id
 */
interface Argon2Options {
  type: 0 | 1 | 2; // 0 = argon2d, 1 = argon2i, 2 = argon2id
  memoryCost: number; // in KiB
  timeCost: number; // iterations
  parallelism: number;
}

/**
 * Secure Password Hasher with validation and Argon2 algorithm support
 * Implements OWASP password security best practices
 * Uses Argon2id which provides sufficient computational effort for modern security requirements
 */
export class PasswordHasher {
  private static config: AuthConfig["password"];
  // OWASP recommended Argon2id parameters: 19 MiB memory, 2 iterations, 1 parallelism
  private static readonly DEFAULT_MEMORY_COST = 19456; // 19 MiB in KiB
  private static readonly DEFAULT_TIME_COST = 2;
  private static readonly DEFAULT_PARALLELISM = 1;
  private static readonly MIN_PASSWORD_LENGTH = 8;
  private static readonly MAX_PASSWORD_LENGTH = 128;

  /**
   * Initialize with configuration
   */
  static init(config?: AuthConfig["password"]) {
    this.config = config;
  }

  /**
   * Hash a password with optional pepper
   * @param password The password to hash
   * @returns The hashed password
   */
  static async hash(password: string): Promise<string> {
    // Validate password length to prevent DoS
    if (
      password.length > (this.config?.maxLength || this.MAX_PASSWORD_LENGTH)
    ) {
      throw new PasswordError(
        "Password exceeds maximum length",
        "PASSWORD_TOO_LONG"
      );
    }

    // Apply pepper if configured (pre-hash secret)
    const pepperedPassword = this.applyPepper(password);

    // Get Argon2 options from config or use secure defaults
    const argon2Options: Argon2Options = {
      type: argon2.argon2id,
      memoryCost:
        this.config?.argon2Options?.memoryCost || this.DEFAULT_MEMORY_COST,
      timeCost: this.config?.argon2Options?.timeCost || this.DEFAULT_TIME_COST,
      parallelism:
        this.config?.argon2Options?.parallelism || this.DEFAULT_PARALLELISM,
    };

    // Argon2 handles long passwords natively, no pre-hashing needed
    return argon2.hash(pepperedPassword, argon2Options);
  }

  /**
   * Verify a password against a hash using timing-safe comparison
   * @param password The plain text password
   * @param hash The hashed password
   * @returns True if the password matches the hash
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    // Validate inputs
    if (!password || !hash) {
      // Still perform a dummy verification to prevent timing attacks
      // Use a valid Argon2 hash format for timing-safe dummy comparison
      const dummyHash =
        "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$dGltaW5nc2FmZWR1bW15aGFzaA";
      try {
        await argon2.verify(dummyHash, "dummy");
      } catch {
        /* expected */
      }
      return false;
    }

    // Validate password length
    if (
      password.length > (this.config?.maxLength || this.MAX_PASSWORD_LENGTH)
    ) {
      // Timing-safe rejection for too-long passwords
      const dummyHash =
        "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$dGltaW5nc2FmZWR1bW15aGFzaA";
      try {
        await argon2.verify(dummyHash, "dummy");
      } catch {
        /* expected */
      }
      return false;
    }

    // Apply pepper if configured
    const pepperedPassword = this.applyPepper(password);

    // Argon2 handles long passwords natively, no pre-hashing needed
    try {
      return await argon2.verify(hash, pepperedPassword);
    } catch {
      // Hash format invalid or verification failed
      return false;
    }
  }

  /**
   * Validate password strength according to configuration
   * @param password The password to validate
   * @returns Validation result with score and feedback
   */
  static validateStrength(password: string): PasswordStrengthResult {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    const minLength = this.config?.minLength || this.MIN_PASSWORD_LENGTH;
    const maxLength = this.config?.maxLength || this.MAX_PASSWORD_LENGTH;

    // Length checks
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    } else {
      score += Math.min(25, password.length * 2);
    }

    if (password.length > maxLength) {
      errors.push(`Password must not exceed ${maxLength} characters`);
    }

    // Character type checks
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password
    );

    if (this.config?.requireUppercase !== false) {
      if (hasUppercase) {
        score += 15;
      } else if (this.config?.requireUppercase) {
        errors.push("Password must contain at least one uppercase letter");
      } else {
        suggestions.push("Add uppercase letters for stronger security");
      }
    }

    if (this.config?.requireLowercase !== false) {
      if (hasLowercase) {
        score += 15;
      } else if (this.config?.requireLowercase) {
        errors.push("Password must contain at least one lowercase letter");
      } else {
        suggestions.push("Add lowercase letters for stronger security");
      }
    }

    if (this.config?.requireNumbers !== false) {
      if (hasNumbers) {
        score += 15;
      } else if (this.config?.requireNumbers) {
        errors.push("Password must contain at least one number");
      } else {
        suggestions.push("Add numbers for stronger security");
      }
    }

    if (this.config?.requireSpecialChars !== false) {
      if (hasSpecialChars) {
        score += 20;
      } else if (this.config?.requireSpecialChars) {
        errors.push("Password must contain at least one special character");
      } else {
        suggestions.push(
          "Add special characters (!@#$%^&*) for stronger security"
        );
      }
    }

    // Check for common patterns
    if (this.hasCommonPatterns(password)) {
      score -= 20;
      suggestions.push(
        "Avoid common patterns like '123', 'abc', or keyboard sequences"
      );
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      suggestions.push("Avoid repeated characters");
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    return {
      isValid: errors.length === 0,
      score,
      errors,
      suggestions,
    };
  }

  /**
   * Check if password contains common weak patterns
   */
  private static hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /123456/i,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /letmein/i,
      /welcome/i,
      /admin/i,
      /login/i,
      /master/i,
      /111111/,
      /000000/,
      /123123/,
      /12345678/,
      /1234567890/,
      /abcdef/i,
      /qwertyuiop/i,
      /asdfghjkl/i,
      /zxcvbnm/i,
    ];

    const lowerPassword = password.toLowerCase();
    return commonPatterns.some((pattern) => pattern.test(lowerPassword));
  }

  /**
   * Apply pepper to password (server-side secret)
   * Concatenates pepper with password so Argon2 receives the full password data.
   * This preserves password entropy while adding the server-side secret.
   */
  private static applyPepper(password: string): string {
    if (!this.config?.pepper) {
      return password;
    }
    // Concatenate pepper with password - Argon2 will handle the secure hashing
    // Using pepper as prefix prevents length-extension attacks
    return this.config.pepper + password;
  }

  /**
   * Generate a cryptographically secure random password
   * @param length Password length (default: 16)
   * @param options Character set options
   */
  static generateSecurePassword(
    length: number = 16,
    options?: {
      includeUppercase?: boolean;
      includeLowercase?: boolean;
      includeNumbers?: boolean;
      includeSpecialChars?: boolean;
    }
  ): string {
    const defaults = {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSpecialChars: true,
    };
    const opts = { ...defaults, ...options };

    let charset = "";
    if (opts.includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (opts.includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (opts.includeNumbers) charset += "0123456789";
    if (opts.includeSpecialChars) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (!charset) {
      throw new PasswordError(
        "At least one character set must be enabled",
        "INVALID_OPTIONS"
      );
    }

    let password = "";
    const charsetLength = charset.length;
    const maxUnbiasedValue = Math.floor(256 / charsetLength) * charsetLength;
    while (password.length < length) {
      const randomByte = crypto.randomBytes(1)[0];
      if (randomByte >= maxUnbiasedValue) {
        continue; // reject biased byte
      }
      password += charset[randomByte % charsetLength];
    }

    return password;
  }

  /**
   * Check if a hash needs to be rehashed (e.g., after config change or algorithm upgrade)
   * Supports both Argon2 and legacy bcrypt hashes
   */
  static needsRehash(hash: string): boolean {
    // Check if it's an Argon2 hash
    if (hash.startsWith("$argon2")) {
      // Parse Argon2 hash parameters: $argon2id$v=19$m=19456,t=2,p=1$salt$hash
      const match = hash.match(/\$argon2id\$v=\d+\$m=(\d+),t=(\d+),p=(\d+)\$/);
      if (!match) return true; // Invalid format, needs rehash

      const hashMemoryCost = parseInt(match[1], 10);
      const hashTimeCost = parseInt(match[2], 10);
      const hashParallelism = parseInt(match[3], 10);

      const configMemoryCost =
        this.config?.argon2Options?.memoryCost || this.DEFAULT_MEMORY_COST;
      const configTimeCost =
        this.config?.argon2Options?.timeCost || this.DEFAULT_TIME_COST;
      const configParallelism =
        this.config?.argon2Options?.parallelism || this.DEFAULT_PARALLELISM;

      // Needs rehash if any parameter is lower than configured
      return (
        hashMemoryCost < configMemoryCost ||
        hashTimeCost < configTimeCost ||
        hashParallelism < configParallelism
      );
    }

    // Legacy bcrypt hash - always needs rehash to upgrade to Argon2
    if (hash.startsWith("$2")) {
      return true;
    }

    // Unknown hash format - needs rehash
    return true;
  }

  /**
   * Calculate password entropy (bits of randomness)
   */
  static calculateEntropy(password: string): number {
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

    if (charsetSize === 0) return 0;
    return Math.floor(password.length * Math.log2(charsetSize));
  }
}

/**
 * Custom Password Error class
 */
export class PasswordError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "PasswordError";
    this.code = code;
  }
}
