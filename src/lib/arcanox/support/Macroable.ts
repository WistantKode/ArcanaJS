/**
 * Macroable trait
 * Allows adding custom methods to a class at runtime
 */
export class Macroable {
  protected static macros: Record<string, Function> = {};

  /**
   * Register a custom macro
   */
  static macro(name: string, macro: Function): void {
    this.macros[name] = macro;
    (this.prototype as any)[name] = macro;
  }

  /**
   * Mix another object into the class
   */
  static mixin(mixin: Record<string, Function>): void {
    Object.keys(mixin).forEach((key) => {
      this.macro(key, mixin[key]);
    });
  }

  /**
   * Check if macro exists
   */
  static hasMacro(name: string): boolean {
    return !!this.macros[name];
  }
}
