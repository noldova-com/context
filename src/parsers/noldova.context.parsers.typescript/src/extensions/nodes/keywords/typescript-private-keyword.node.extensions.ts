/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";

import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptPrivateKeywordNode } from "../../../models/nodes/keywords/typescript-private-keyword.node.js";

TypeScriptPrivateKeywordNode.prototype.getTypeScriptAbstractConflict = function (this: TypeScriptPrivateKeywordNode): DiagnosticTemplate {
  return TypeScriptDiagnosticTemplates.TS1243;
};

TypeScriptPrivateKeywordNode.prototype.getTypeScriptAccessibilityFlags = function (this: TypeScriptPrivateKeywordNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.Accessibility | TypeScriptModifierFlags.Private;
};
