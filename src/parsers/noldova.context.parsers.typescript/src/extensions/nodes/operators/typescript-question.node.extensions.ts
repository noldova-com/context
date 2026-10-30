/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptCloseBracketNode } from "../../../models/nodes/delimiters/typescript-close-bracket.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptQuestionNode.prototype.isTypeScriptFunctionTypeParameterIndicator = function (this: TypeScriptQuestionNode): boolean {
  return true;
};

TypeScriptQuestionNode.prototype.isTypeScriptIndexSignatureParameterIndicator = function (this: TypeScriptQuestionNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    const node = parser.currentNode;
    return node instanceof TypeScriptColonNode || node instanceof TypeScriptCommaNode || node instanceof TypeScriptCloseBracketNode;
  });
};

TypeScriptQuestionNode.prototype.canStartTypeScriptType = function (this: TypeScriptQuestionNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptQuestionNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptQuestionNode, parser: TypeParser): Node {
  return parser.parseNullableType(this);
};

TypeScriptQuestionNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptQuestionNode): boolean {
  return true;
};

declare module "../../../models/nodes/operators/typescript-question.node.js" {
  interface TypeScriptQuestionNode {
    reportTypeScriptObjectMemberMarker(context: TypeScriptParserContext): void;
  }
}

TypeScriptQuestionNode.prototype.reportTypeScriptObjectMemberMarker = function (this: TypeScriptQuestionNode, context: TypeScriptParserContext): void {
  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1162, this.span);
};
