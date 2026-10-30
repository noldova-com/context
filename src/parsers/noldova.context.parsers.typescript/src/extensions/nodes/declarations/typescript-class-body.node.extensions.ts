/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptClassBodyNode } from "../../../models/nodes/declarations/typescript-class-body.node.js";
import { TypeScriptConstructorDeclarationNode } from "../../../models/nodes/declarations/typescript-constructor-declaration.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

declare module "../../../models/nodes/declarations/typescript-class-body.node.js" {
  interface TypeScriptClassBodyNode {
    reportTypeScriptConstructorImplementations(context: TypeScriptParserContext): void;
  }
}

TypeScriptClassBodyNode.prototype.reportTypeScriptConstructorImplementations = function (this: TypeScriptClassBodyNode, context: TypeScriptParserContext): void {
  const constructorNodes = this.children.filter(t => t instanceof TypeScriptConstructorDeclarationNode);
  if (constructorNodes.filter(t => t.hasTypeScriptBody()).length <= 1)
    return;

  for (const constructorNode of constructorNodes)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS2392, constructorNode.nameNode.span);
};
