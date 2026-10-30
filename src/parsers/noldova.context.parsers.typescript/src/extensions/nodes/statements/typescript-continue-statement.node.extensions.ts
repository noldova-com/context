/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptContinueStatementNode } from "../../../models/nodes/statements/typescript-continue-statement.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptContinueStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptContinueStatementNode): SourceSpan {
  return this.continueKeywordNode.span;
};

TypeScriptContinueStatementNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptContinueStatementNode, context: TypeScriptParserContext): void {
  if (context.isAmbient && !context.hasReportedAmbientStatement)
    return;

  const template = context.readJumpTarget(this.labelNode, true);
  if (!Object.isUndefined(template))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, template, this.span);
};
