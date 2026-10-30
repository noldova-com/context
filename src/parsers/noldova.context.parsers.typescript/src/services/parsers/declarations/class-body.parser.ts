/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptClassBodyNode } from "../../../models/nodes/declarations/typescript-class-body.node.js";
import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import type { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { ClassMemberParser } from "./class-member.parser.js";

export class ClassBodyParser {
  private readonly classMemberParser: ClassMemberParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.classMemberParser = new ClassMemberParser(typescriptParser);
  }

  public parse(openBraceNode: TypeScriptOpenBraceNode): TypeScriptClassBodyNode {
    const context = this.typescriptParser.context;
    const previousClassBodyContext = context.isClassBodyContext;
    const previousTypeMemberContext = context.isTypeMemberContext;
    const previousClassStaticBlock = context.isClassStaticBlock;
    context.isClassBodyContext = true;
    context.isTypeMemberContext = false;
    context.isClassStaticBlock = false;
    context.enterList(TypeScriptListKind.ClassMembers);
    try {
      const typescriptParser = this.typescriptParser;
      typescriptParser.advance();
      const memberNodes: Node[] = [];
      let endNode: Node = openBraceNode;
      while (!typescriptParser.isEndOfFile && !(typescriptParser.currentNode instanceof TypeScriptCloseBraceNode)) {
        const node = typescriptParser.currentNode;
        if (!node.canStartTypeScriptClassMember(typescriptParser)) {
          typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1068, node.span);
          if (typescriptParser.context.isListBoundary(typescriptParser))
            break;
          typescriptParser.advance();
          continue;
        }
        const memberNode = this.classMemberParser.parse();
        memberNodes.push(memberNode);
        endNode = memberNode;
      }

      const closeBraceNode = typescriptParser.tryConsume(TypeScriptCloseBraceNode);
      if (Object.isUndefined(closeBraceNode))
        typescriptParser.reportExpected(Resources.closeBrace);
      else
        endNode = closeBraceNode;

      const endOffset = closeBraceNode?.span.endOffset
        ?? typescriptParser.currentNode.leadingTrivia?.span.startOffset ?? typescriptParser.currentNode.span.startOffset;
      const span = typescriptParser.typescriptLexer.reader.createSpan(openBraceNode.span.startOffset, endOffset - openBraceNode.span.startOffset);
      return new TypeScriptClassBodyNode(
        openBraceNode,
        memberNodes,
        span,
        closeBraceNode,
        openBraceNode.leadingTrivia,
        endNode.trailingTrivia);
    }
    finally {
      context.leaveList();
      context.isClassBodyContext = previousClassBodyContext;
      context.isTypeMemberContext = previousTypeMemberContext;
      context.isClassStaticBlock = previousClassStaticBlock;
    }
  }

  public reportMissing(): TypeScriptClassBodyNode {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    parser.reportExpected(Resources.openBrace);
    return new TypeScriptClassBodyNode(undefined, [], node.getTypeScriptMissingNodeSpan());
  }
}
