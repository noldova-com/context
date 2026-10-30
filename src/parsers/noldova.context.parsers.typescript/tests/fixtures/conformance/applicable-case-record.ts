/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExpectedCaseFile } from "./expected-case-file.js";
import { ExpectedCaseRecord } from "./expected-case-record.js";
import { ExpectedDiagnosticFamilies } from "./expected-diagnostic-families.js";
import type { JsonObject } from "./json-object.js";

export class ApplicableCaseRecord extends ExpectedCaseRecord {
  public readonly files: readonly ExpectedCaseFile[];
  public readonly program: readonly number[];
  public readonly diagnostics: ExpectedDiagnosticFamilies;

  public constructor(path: string, sha256: string, files: readonly ExpectedCaseFile[], program: readonly number[], diagnostics: ExpectedDiagnosticFamilies) {
    super(path, sha256);
    this.files = files;
    this.program = program;
    this.diagnostics = diagnostics;
  }

  public static from(object: JsonObject): ApplicableCaseRecord {
    return new ApplicableCaseRecord(object.string("path"), object.string("sha256"), object.objects("files").map(t => ExpectedCaseFile.from(t)),
      object.numbers("program"), ExpectedDiagnosticFamilies.from(object.object("diagnostics")));
  }
}
