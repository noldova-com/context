/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptArrowFunctionNode } from "../../../models/nodes/expressions/typescript-arrow-function.node.js";
import { TypeScriptBlockNode } from "../../../models/nodes/statements/typescript-block.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { TypeScriptCharacterClassifier } from "../../../services/lexers/typescript-character-classifier.js";

TypeScriptArrowFunctionNode.prototype.getTypeScriptDeclarationNameSpan = function (this: TypeScriptArrowFunctionNode,
  context: TypeScriptParserContext): SourceSpan {
  if (!(this.bodyNode instanceof TypeScriptBlockNode))
    return this.span;

  const content = context.source.content;
  const bodyStartOffset = this.arrowNode?.span.endOffset ?? this.bodyNode.span.startOffset;
  for (let offset = bodyStartOffset; offset < this.bodyNode.span.endOffset; offset++)
    if (TypeScriptCharacterClassifier.isLineTerminator(content.charAt(offset)))
      return new SourceSpan(this.span.startOffset, offset - this.span.startOffset);

  return this.span;
};

TypeScriptArrowFunctionNode.prototype.isTypeScriptNonArithmeticLiteral = function (this: TypeScriptArrowFunctionNode): boolean {
  return true;
};

TypeScriptArrowFunctionNode.prototype.readsTypeScriptContextualType = function (this: TypeScriptArrowFunctionNode): boolean {
  return true;
};

TypeScriptArrowFunctionNode.prototype.getTypeScriptThisParameterRejection = function (this: TypeScriptArrowFunctionNode): DiagnosticTemplate | undefined {
  return TypeScriptDiagnosticTemplates.TS2730;
};

TypeScriptArrowFunctionNode.prototype.hasTypeScriptBody = function (this: TypeScriptArrowFunctionNode): boolean {
  return true;
};
