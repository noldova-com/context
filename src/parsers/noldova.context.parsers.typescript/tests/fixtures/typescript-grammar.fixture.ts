/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Diagnostic } from "@noldova/context.diagnostics";
import { TypeScriptGrammarDiagnostic } from "@noldova/context.parsers.typescript/models/typescript-grammar-diagnostic.js";
import type { TypeScriptSyntaxParser } from "@noldova/context.parsers.typescript/services/typescript-syntax.parser.js";

export class TypeScriptGrammarFixture {
  public static getDiagnostics(parser: TypeScriptSyntaxParser): readonly Diagnostic[] {
    return parser.context.diagnosticCollector.diagnostics.filter(t => t instanceof TypeScriptGrammarDiagnostic).map(t => t.diagnostic);
  }
}
