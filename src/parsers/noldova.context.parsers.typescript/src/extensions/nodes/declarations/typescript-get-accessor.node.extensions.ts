/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptObjectMemberKind } from "../../../enums/typescript-object-member-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptGetAccessorNode } from "../../../models/nodes/declarations/typescript-get-accessor.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptGetAccessorNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptGetAccessorNode, context: TypeScriptParserContext): void {
  const span = this.nameNode.span;

  if (!Object.isUndefined(this.typeParameterListNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1094, span);
  else if (this.parameterListNode.children.some(t => !t.isTypeScriptThisParameter()))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1054, span);
};

TypeScriptGetAccessorNode.prototype.getTypeScriptObjectMemberKind = function (this: TypeScriptGetAccessorNode): TypeScriptObjectMemberKind {
  return TypeScriptObjectMemberKind.Get;
};
