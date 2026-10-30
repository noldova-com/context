/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptAsKeywordNode } from "../keywords/typescript-as-keyword.node.js";
import type { TypeScriptTypeKeywordNode } from "../keywords/typescript-type-keyword.node.js";

export abstract class TypeScriptImportExportSpecifierNode extends Node {
  public readonly nameNode: Node;
  public readonly asKeywordNode: TypeScriptAsKeywordNode | undefined;
  public readonly aliasNode: Node | undefined;
  public readonly typeKeywordNode: TypeScriptTypeKeywordNode | undefined;

  public constructor(
    span: SourceSpan,
    nameNode: Node,
    asKeywordNode?: TypeScriptAsKeywordNode,
    aliasNode?: Node,
    typeKeywordNode?: TypeScriptTypeKeywordNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.nameNode = nameNode;
    this.asKeywordNode = asKeywordNode;
    this.aliasNode = aliasNode;
    this.typeKeywordNode = typeKeywordNode;
  }
}
