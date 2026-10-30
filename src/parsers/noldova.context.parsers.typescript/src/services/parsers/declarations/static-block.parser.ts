/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptStaticBlockNode } from "../../../models/nodes/declarations/typescript-static-block.node.js";
import type { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import type { TypeScriptStaticKeywordNode } from "../../../models/nodes/keywords/typescript-static-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import type { BlockParser } from "../statements/block.parser.js";

export class StaticBlockParser {
  private readonly blockParser: BlockParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser, blockParser: BlockParser) {
    this.typescriptParser = typescriptParser;
    this.blockParser = blockParser;
  }

  public parse(
    modifierNodes: readonly Node[],
    staticKeywordNode: TypeScriptStaticKeywordNode,
    openBraceNode: TypeScriptOpenBraceNode): TypeScriptStaticBlockNode {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    const previousNewTargetScope = context.isNewTargetScope;
    const previousClassStaticBlock = context.isClassStaticBlock;
    const previousJumpTargets = context.jumpTargets;
    context.contextFlags = TypeScriptContextFlags.Await | (previousFlags & TypeScriptContextFlags.DisallowIn);
    context.isNewTargetScope = false;
    context.isClassStaticBlock = true;
    context.jumpTargets = [];
    try {
      const bodyNode = this.blockParser.parse(openBraceNode);
      const startNode = modifierNodes[0] ?? staticKeywordNode;
      const span = this.typescriptParser.typescriptLexer.reader.createSpan(startNode.span, bodyNode.span);
      return new TypeScriptStaticBlockNode(modifierNodes, staticKeywordNode, bodyNode, span, startNode.leadingTrivia, bodyNode.trailingTrivia);
    }
    finally {
      context.contextFlags = previousFlags;
      context.isNewTargetScope = previousNewTargetScope;
      context.isClassStaticBlock = previousClassStaticBlock;
      context.jumpTargets = previousJumpTargets;
    }
  }
}
