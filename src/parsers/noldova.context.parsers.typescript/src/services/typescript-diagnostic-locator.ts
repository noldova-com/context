/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { Diagnostic, DiagnosticLocation } from "@noldova/context.diagnostics";

import { TypeScriptParserException } from "../exceptions/typescript-parser.exception.js";
import { Resources } from "../resources.js";

export class TypeScriptDiagnosticLocator {
  public static locate(diagnostic: Diagnostic): DiagnosticLocation {
    if (Object.isUndefined(diagnostic.location))
      throw new TypeScriptParserException(Resources.parseDiagnosticUnlocated);

    return diagnostic.location;
  }
}
