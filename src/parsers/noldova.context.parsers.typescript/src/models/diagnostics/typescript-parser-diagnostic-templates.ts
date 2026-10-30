/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticTemplate } from "@noldova/context.diagnostics";

export class TypeScriptParserDiagnosticTemplates {
  public static readonly CTX2000: DiagnosticTemplate = new DiagnosticTemplate(
    new DiagnosticCode(DiagnosticAuthority.context, 2000),
    DiagnosticCategory.Error,
    "TypeScript parsing exceeds the supported recursion depth of {0}.");
}
