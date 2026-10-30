/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type TypeScriptConformanceCase from "./typescript-conformance-case.ts";
import TypeScriptExpectedRecord from "./typescript-expected-record.ts";

export default class TypeScriptExpectedInapplicableRecord extends TypeScriptExpectedRecord {
  public static readonly APPLICABILITY: "inapplicable" = "inapplicable";

  public readonly applicability: typeof TypeScriptExpectedInapplicableRecord.APPLICABILITY;
  public readonly reason: string;

  public constructor(conformanceCase: TypeScriptConformanceCase) {
    super(conformanceCase.path, conformanceCase.sha256);
    this.applicability = TypeScriptExpectedInapplicableRecord.APPLICABILITY;
    this.reason = conformanceCase.inapplicabilityReason;
  }
}
