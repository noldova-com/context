/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DiagnosticCategory } from "@noldova/context.diagnostics";
import { type Node, ValueNode } from "@noldova/context.parsers";
import {
  TypeScriptClassDeclarationNode,
  TypeScriptExpressionWithTypeArgumentsNode,
  TypeScriptExtendsKeywordNode,
  TypeScriptParser,
  TypeScriptPropertyDeclarationNode,
  TypeScriptStaticKeywordNode
} from "@noldova/context.parsers.typescript";

import { DataToolsException } from "../exceptions/data-tools.exception.js";
import { SourceClass } from "../models/sources/source-class.js";
import { SourceProperty } from "../models/sources/source-property.js";
import { Resources } from "../resources.js";

export class SourceClassReader {
  public static read(content: string, filePath: string): readonly SourceClass[] {
    const result = TypeScriptParser.parse(content, filePath);
    const error = result.diagnostics.find(t => t.category === DiagnosticCategory.Error);
    if (!Object.isUndefined(error))
      throw new DataToolsException(Resources.formatSourceInvalid(filePath, error.message.text));

    const classes: SourceClass[] = [];
    for (const node of result.rootNode.children)
      if (node instanceof TypeScriptClassDeclarationNode && node.nameNode instanceof ValueNode)
        classes.push(new SourceClass(node.nameNode.value, filePath, SourceClassReader.readBaseName(node), SourceClassReader.readProperties(node)));

    return classes;
  }

  private static readBaseName(node: TypeScriptClassDeclarationNode): string | null {
    const clause = node.heritageClauseNodes.find(t => t.keywordNode instanceof TypeScriptExtendsKeywordNode);
    const base = clause?.children.find(t => t instanceof TypeScriptExpressionWithTypeArgumentsNode);
    if (!(base instanceof TypeScriptExpressionWithTypeArgumentsNode) || !(base.expressionNode instanceof ValueNode))
      return null;

    return base.expressionNode.value;
  }

  private static readProperties(node: TypeScriptClassDeclarationNode): readonly SourceProperty[] {
    const properties: SourceProperty[] = [];
    for (const member of node.bodyNode.children)
      if (member instanceof TypeScriptPropertyDeclarationNode && member.nameNode instanceof ValueNode && !SourceClassReader.isStatic(member.modifierNodes))
        properties.push(new SourceProperty(member.nameNode.value, member.typeNode, !Object.isUndefined(member.questionNode)));

    return properties;
  }

  private static isStatic(modifiers: readonly Node[]): boolean {
    return modifiers.some(t => t instanceof TypeScriptStaticKeywordNode);
  }
}
