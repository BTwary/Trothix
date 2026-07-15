/**
 * @fileoverview CompilerPass
 *
 * Abstract base class for every compiler pass.
 *
 * Every compiler pass receives a CompilerContext,
 * performs exactly one responsibility,
 * and either succeeds or throws an error.
 */

export class CompilerPass {
  constructor(name) {
    if (new.target === CompilerPass) {
      throw new Error("CompilerPass is abstract and cannot be instantiated directly.");
    }

    this.name = name;
  }

  /**
   * Execute this compiler pass.
   *
   * @param {CompilerContext} context
   */
  async run(context) {
    throw new Error(`${this.name}: run() not implemented.`);
  }
}