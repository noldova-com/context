/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Diagnostic } from "@noldova/context.diagnostics";
import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptDeferredRecords } from "./typescript-deferred-records.js";

export class TypeScriptReparsedRegion {
  public readonly statements: readonly Node[];
  public readonly diagnostics: readonly Diagnostic[];
  public readonly span: SourceSpan;
  public readonly records: TypeScriptDeferredRecords;

  public constructor(statements: readonly Node[], diagnostics: readonly Diagnostic[], span: SourceSpan, records: TypeScriptDeferredRecords) {
    this.statements = statements;
    this.diagnostics = diagnostics;
    this.span = span;
    this.records = records;
  }
}
