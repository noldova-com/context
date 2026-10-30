/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptBreakStatementNode } from "../../../models/nodes/statements/typescript-break-statement.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptBreakStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptBreakStatementNode): SourceSpan {
  return this.breakKeywordNode.span;
};

TypeScriptBreakStatementNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptBreakStatementNode, context: TypeScriptParserContext): void {
  if (context.isAmbient && !context.hasReportedAmbientStatement)
    return;

  const template = context.readJumpTarget(this.labelNode, false);
  if (!Object.isUndefined(template))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, template, this.span);
};
