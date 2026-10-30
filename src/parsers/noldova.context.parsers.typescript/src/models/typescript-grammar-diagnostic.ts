/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Diagnostic } from "@noldova/context.diagnostics";

export class TypeScriptGrammarDiagnostic extends Diagnostic {
  public readonly diagnostic: Diagnostic;

  public constructor(diagnostic: Diagnostic) {
    super(diagnostic.message, diagnostic.location, diagnostic.relatedInformation, diagnostic.tags);
    this.diagnostic = diagnostic;
  }
}
