/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptObjectMemberKind } from "../../../enums/typescript-object-member-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptShorthandPropertyAssignmentNode } from "../../../models/nodes/expressions/typescript-shorthand-property-assignment.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import "../operators/typescript-exclamation.node.extensions.js";
import "../operators/typescript-question.node.extensions.js";

declare module "../../../models/nodes/expressions/typescript-shorthand-property-assignment.node.js" {
  interface TypeScriptShorthandPropertyAssignmentNode {
    reportTypeScriptObjectLiteralMember(context: TypeScriptParserContext): void;
  }
}

TypeScriptShorthandPropertyAssignmentNode.prototype.validateTypeScriptDestructuringTarget = function (this: TypeScriptShorthandPropertyAssignmentNode,
  _context: TypeScriptParserContext): void {
};

TypeScriptShorthandPropertyAssignmentNode.prototype.getTypeScriptObjectMemberKind = function (this: TypeScriptShorthandPropertyAssignmentNode): TypeScriptObjectMemberKind {
  return TypeScriptObjectMemberKind.Property;
};

TypeScriptShorthandPropertyAssignmentNode.prototype.getTypeScriptObjectMemberName = function (this: TypeScriptShorthandPropertyAssignmentNode): Node {
  return this.nameNode;
};

TypeScriptShorthandPropertyAssignmentNode.prototype.reportTypeScriptObjectLiteralMember = function (this: TypeScriptShorthandPropertyAssignmentNode,
  context: TypeScriptParserContext): void {
  (this.questionNode ?? this.exclamationNode)?.reportTypeScriptObjectMemberMarker(context);
};

TypeScriptShorthandPropertyAssignmentNode.prototype.validateTypeScriptObjectLiteralMember = function (this: TypeScriptShorthandPropertyAssignmentNode,
  context: TypeScriptParserContext): void {
  if (!Object.isUndefined(this.equalsNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1312, this.equalsNode.span);
};
