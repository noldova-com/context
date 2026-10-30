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
import { TypeScriptPropertyAssignmentNode } from "../../../models/nodes/expressions/typescript-property-assignment.node.js";
import { TypeScriptBigIntLiteralNode } from "../../../models/nodes/literals/typescript-big-int-literal.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import "../operators/typescript-exclamation.node.extensions.js";
import "../operators/typescript-question.node.extensions.js";

declare module "../../../models/nodes/expressions/typescript-property-assignment.node.js" {
  interface TypeScriptPropertyAssignmentNode {
    reportTypeScriptObjectLiteralMember(context: TypeScriptParserContext): void;
  }
}

TypeScriptPropertyAssignmentNode.prototype.markTypeScriptPattern = function (this: TypeScriptPropertyAssignmentNode, context: TypeScriptParserContext): void {
  this.initializerNode.markTypeScriptPattern(context);
};

TypeScriptPropertyAssignmentNode.prototype.validateTypeScriptDestructuringTarget = function (this: TypeScriptPropertyAssignmentNode, context: TypeScriptParserContext): void {
  this.initializerNode.validateTypeScriptDestructuringTarget(context);
};

TypeScriptPropertyAssignmentNode.prototype.reportTypeScriptCommaComputedName = function (this: TypeScriptPropertyAssignmentNode, context: TypeScriptParserContext): void {
  this.nameNode.reportTypeScriptCommaComputedName(context);
};

TypeScriptPropertyAssignmentNode.prototype.getTypeScriptObjectMemberKind = function (this: TypeScriptPropertyAssignmentNode): TypeScriptObjectMemberKind {
  return TypeScriptObjectMemberKind.Property;
};

TypeScriptPropertyAssignmentNode.prototype.getTypeScriptObjectMemberName = function (this: TypeScriptPropertyAssignmentNode): Node {
  return this.nameNode;
};

TypeScriptPropertyAssignmentNode.prototype.reportTypeScriptObjectLiteralMember = function (this: TypeScriptPropertyAssignmentNode, context: TypeScriptParserContext): void {
  this.nameNode.reportTypeScriptObjectMemberName(context);
  (this.questionNode ?? this.exclamationNode)?.reportTypeScriptObjectMemberMarker(context);
};

TypeScriptPropertyAssignmentNode.prototype.validateTypeScriptObjectLiteralMember = function (this: TypeScriptPropertyAssignmentNode, context: TypeScriptParserContext): void {
  if (this.nameNode instanceof TypeScriptBigIntLiteralNode)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1539, this.nameNode.span);
};
