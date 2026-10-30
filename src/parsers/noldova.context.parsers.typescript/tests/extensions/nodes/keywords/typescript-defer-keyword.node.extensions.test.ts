/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptImportDeclarationNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptDeferKeywordNodeExtensionsTests {
  @TestData('import defer * as ns from "m";', "defer")
  @TestData('import defer from from "m";', "defer")
  @TestData('import defer from "m";', "")
  @TestData('import defer, { a } from "m";', "")
  @TestMethod
  public beginsAnImportPhaseUnlessItNamesTheDefaultImport(content: string, expected: string): void {
    const node = TypeScriptParser.parse(content, "source.ts").rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);

    Assert.areEqual(expected, node.phaseKeywordNode?.value ?? "");
  }
}
