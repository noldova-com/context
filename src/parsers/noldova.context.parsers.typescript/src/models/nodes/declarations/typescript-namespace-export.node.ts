/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptAsKeywordNode } from "../keywords/typescript-as-keyword.node.js";
import type { TypeScriptAsteriskNode } from "../operators/typescript-asterisk.node.js";

export class TypeScriptNamespaceExportNode extends Node {
  public readonly asteriskNode: TypeScriptAsteriskNode;
  public readonly asKeywordNode: TypeScriptAsKeywordNode | undefined;
  public readonly nameNode: Node | undefined;

  public constructor(
    asteriskNode: TypeScriptAsteriskNode,
    span: SourceSpan,
    asKeywordNode?: TypeScriptAsKeywordNode,
    nameNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.asteriskNode = asteriskNode;
    this.asKeywordNode = asKeywordNode;
    this.nameNode = nameNode;
  }
}
