/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptExportDeclarationNode,
  TypeScriptExportSpecifierNode,
  TypeScriptImportDeclarationNode,
  TypeScriptImportSpecifierNode,
  TypeScriptNamedExportsNode,
  TypeScriptNamedImportsNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert } from "@noldova/context.testing";

export class ModuleSyntaxFixture {
  public static parseImport(content: string): TypeScriptImportDeclarationNode {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(0, result.diagnostics.length);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    return node;
  }

  public static parseExport(content: string): TypeScriptExportDeclarationNode {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(0, result.diagnostics.length);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptExportDeclarationNode);
    return node;
  }

  public static importSpecifier(content: string): TypeScriptImportSpecifierNode {
    const declaration = this.parseImport('import { ' + content + ' } from "pkg";');
    const bindings = declaration.importClauseNode?.namedBindingsNode;
    Assert.isInstanceOf(bindings, TypeScriptNamedImportsNode);
    const node = bindings.children[0];
    Assert.isDefined(node);
    return node;
  }

  public static exportSpecifier(content: string, hasModuleSpecifier: boolean = false): TypeScriptExportSpecifierNode {
    const declaration = this.parseExport("export { " + content + (hasModuleSpecifier ? ' } from "pkg";' : " };"));
    Assert.isInstanceOf(declaration.exportClauseNode, TypeScriptNamedExportsNode);
    const node = declaration.exportClauseNode.children[0];
    Assert.isDefined(node);
    return node;
  }
}
