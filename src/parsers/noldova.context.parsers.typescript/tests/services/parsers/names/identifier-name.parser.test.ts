/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValueNode } from "@noldova/context.parsers";
import { IdentifierNameParser } from "@noldova/context.parsers.typescript/services/parsers/names/identifier-name.parser.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class IdentifierNameParserTests {
  @TestMethod
  public distinguishesIdentifierNamesFromStringNames(): void {
    const parser = TypeScriptParserFixture.create('"quoted"');
    const original = parser.currentNode;
    Assert.isFalse(original.isTypeScriptIdentifierName());
    Assert.isTrue(original.isTypeScriptModuleExportName());
    const names = new IdentifierNameParser(parser);
    Assert.isUndefined(names.parseIdentifierName());
    Assert.areEqual(original, parser.currentNode);
    Assert.areEqual(original, names.parseIdentifierOrStringName());
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual("TS1003", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestData("name")
  @TestData("class")
  @TestData('"quoted"')
  @TestMethod
  public preservesModuleExportNamesAsWritten(content: string): void {
    const parser = TypeScriptParserFixture.create(content + ",");
    const original = parser.currentNode;
    const node = new IdentifierNameParser(parser).parseIdentifierOrStringName();
    Assert.areEqual(original, node);
    Assert.isInstanceOf(node, ValueNode);
    Assert.areEqual(content, node.value);
    Assert.areEqual(content.length, parser.currentNode.span.startOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("name")
  @TestData("await")
  @TestMethod
  public acceptsBindingNamesWithoutReclassifyingTheirNodes(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const original = parser.currentNode;
    Assert.areEqual(original, new IdentifierNameParser(parser).parseBindingIdentifier());
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestMethod
  public rejectsAReservedBindingNameWithoutConsumingTheNextGrammar(): void {
    const parser = TypeScriptParserFixture.create("class");
    const original = parser.currentNode;
    Assert.isUndefined(new IdentifierNameParser(parser).parseBindingIdentifier());
    Assert.areEqual(original, parser.currentNode);
    Assert.areEqual("TS1359", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public preservesADelimiterAfterMissingNames(): void {
    const parser = TypeScriptParserFixture.create("}");
    const original = parser.currentNode;
    const names = new IdentifierNameParser(parser);
    Assert.isUndefined(names.parseIdentifierOrStringName());
    Assert.isUndefined(names.parseBindingIdentifier());
    Assert.areEqual(original, parser.currentNode);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS1003", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }
}
