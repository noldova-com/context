/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type JsonObjectReader from "../../../../scripts/json-object.reader.ts";

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

  public static read(reader: JsonObjectReader): TypeScriptExpectedManifestTotals {
    const reasons = reader.object("inapplicableByReason");

    return new TypeScriptExpectedManifestTotals(
      reader.integer("caseFiles"), reader.integer("applicable"), Object.fromEntries(reasons.names.map(t => [t, reasons.integer(t)] as const)), reader.integer("diagnostics"));
  }
}
