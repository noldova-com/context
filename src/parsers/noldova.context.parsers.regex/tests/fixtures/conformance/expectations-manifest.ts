/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { JsonObject } from "./json-object.js";

export class ExpectationsManifest {
  private static readonly LOCATION: string = "expected/MANIFEST.json";

  public readonly caseFiles: number;
  public readonly applicable: number;
  public readonly inapplicable: number;
  public readonly inapplicableByReason: ReadonlyMap<string, number>;
  public readonly acceptedPatterns: number;
  public readonly rejectedGroups: number;
  public readonly patternsSha256: string;

  private constructor(object: JsonObject) {
    this.caseFiles = object.number("caseFiles");
    this.applicable = object.number("applicable");
    this.inapplicable = object.number("inapplicable");
    this.inapplicableByReason = object.numberEntries("inapplicableByReason");
    this.acceptedPatterns = object.number("acceptedPatterns");
    this.rejectedGroups = object.number("rejectedGroups");
    this.patternsSha256 = object.string("patternsSha256");
  }

  public static parse(json: string): ExpectationsManifest {
    return new ExpectationsManifest(JsonObject.parse(json, ExpectationsManifest.LOCATION));
  }
}
