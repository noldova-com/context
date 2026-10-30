/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type JsonObjectReader from "../../../../scripts/json-object.reader.ts";
import TypeScriptVendoredSectionRecord from "./typescript-vendored-section-record.ts";

export default class TypeScriptVendoredSuite {
  public readonly cases: TypeScriptVendoredSectionRecord;
  public readonly diagnosticBaselines: TypeScriptVendoredSectionRecord;

  public constructor(cases: TypeScriptVendoredSectionRecord, diagnosticBaselines: TypeScriptVendoredSectionRecord) {
    this.cases = cases;
    this.diagnosticBaselines = diagnosticBaselines;
  }

  public static read(reader: JsonObjectReader): TypeScriptVendoredSuite {
    return new TypeScriptVendoredSuite(
      TypeScriptVendoredSectionRecord.read(reader.object("cases")), TypeScriptVendoredSectionRecord.read(reader.object("diagnosticBaselines")));
  }
}
