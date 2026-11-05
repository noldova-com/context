/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { JsonReader } from "@noldova/context.json";

export default class TypeScriptExpectedManifestTotals {
  public readonly caseFiles: number;
  public readonly applicable: number;
  public readonly inapplicable: number;
  public readonly inapplicableByReason: Readonly<Record<string, number>>;
  public readonly diagnostics: number;

  public constructor(caseFiles: number, applicable: number, inapplicableByReason: Readonly<Record<string, number>>, diagnostics: number) {
    this.caseFiles = caseFiles;
    this.applicable = applicable;
    this.inapplicable = caseFiles - applicable;
    this.inapplicableByReason = inapplicableByReason;
    this.diagnostics = diagnostics;
  }

  public static read(reader: JsonReader): TypeScriptExpectedManifestTotals {
    const reasons = reader.readObject("inapplicableByReason");

    return new TypeScriptExpectedManifestTotals(
      reader.readInteger("caseFiles"), reader.readInteger("applicable"), Object.fromEntries(Object.keys(reasons.toJson()).map(t => [t, reasons.readInteger(t)] as const)), reader.readInteger("diagnostics"));
  }
}
