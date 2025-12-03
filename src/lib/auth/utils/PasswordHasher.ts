import bcrypt from "bcryptjs";

export class PasswordHasher {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a password.
   * @param password The password to hash.
   * @returns The hashed password.
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against a hash.
   * @param password The plain text password.
   * @param hash The hashed password.
   * @returns True if the password matches the hash.
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
