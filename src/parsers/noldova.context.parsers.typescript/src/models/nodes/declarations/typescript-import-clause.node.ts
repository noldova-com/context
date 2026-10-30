/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCommaNode } from "../delimiters/typescript-comma.node.js";
import type { TypeScriptNamedImportsNode } from "./typescript-named-imports.node.js";
import type { TypeScriptNamespaceImportNode } from "./typescript-namespace-import.node.js";

export class TypeScriptImportClauseNode extends Node {
  public readonly defaultNameNode: Node | undefined;
  public readonly commaNode: TypeScriptCommaNode | undefined;
  public readonly namedBindingsNode: TypeScriptNamedImportsNode | TypeScriptNamespaceImportNode | undefined;

  public constructor(
    span: SourceSpan,
    defaultNameNode?: Node,
    commaNode?: TypeScriptCommaNode,
    namedBindingsNode?: TypeScriptNamedImportsNode | TypeScriptNamespaceImportNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.defaultNameNode = defaultNameNode;
    this.commaNode = commaNode;
    this.namedBindingsNode = namedBindingsNode;
  }
}
