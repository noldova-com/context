/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class TypeScriptExpectedBatch {
  public readonly casesDirectory: string;
  public readonly librariesDirectory: string;
  public readonly cases: readonly string[];

  public constructor(casesDirectory: string, librariesDirectory: string, cases: readonly string[]) {
    this.casesDirectory = casesDirectory;
    this.librariesDirectory = librariesDirectory;
    this.cases = cases;
  }

  public static parse(json: string): TypeScriptExpectedBatch {
    const parsed: TypeScriptExpectedBatch = JSON.parse(json);

    return new TypeScriptExpectedBatch(parsed.casesDirectory, parsed.librariesDirectory, parsed.cases);
  }
}
