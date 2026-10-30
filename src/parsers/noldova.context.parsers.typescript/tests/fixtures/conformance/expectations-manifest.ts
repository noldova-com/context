/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { JsonObject } from "./json-object.js";

export class ExpectationsManifest {
  private static readonly LOCATION: string = "MANIFEST.json";

  public readonly caseFiles: number;
  public readonly applicable: number;
  public readonly inapplicable: number;
  public readonly inapplicableByReason: ReadonlyMap<string, number>;
  public readonly diagnostics: number;
  public readonly resultsSha256: string;

  public constructor(caseFiles: number, applicable: number, inapplicable: number, inapplicableByReason: ReadonlyMap<string, number>, diagnostics: number,
    resultsSha256: string) {
    this.caseFiles = caseFiles;
    this.applicable = applicable;
    this.inapplicable = inapplicable;
    this.inapplicableByReason = inapplicableByReason;
    this.diagnostics = diagnostics;
    this.resultsSha256 = resultsSha256;
  }

  public static parse(json: string): ExpectationsManifest {
    const manifest = JsonObject.parse(json, ExpectationsManifest.LOCATION);
    const totals = manifest.object("totals");
    return new ExpectationsManifest(totals.number("caseFiles"), totals.number("applicable"), totals.number("inapplicable"),
      totals.numberEntries("inapplicableByReason"), totals.number("diagnostics"), manifest.string("resultsSha256"));
  }
}
