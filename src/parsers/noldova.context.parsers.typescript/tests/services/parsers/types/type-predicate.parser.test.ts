/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodeType } from "@noldova/context.parsers";
import {
  TypeScriptAssertsKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptObjectKeywordNode,
  TypeScriptParser,
  TypeScriptThisTypeNode,
  TypeScriptTypePredicateNode,
  TypeScriptTypeReferenceNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypePredicateParserTests {
  @TestData("let v: this is string;", "TS1228@7:14")
  @TestData("declare let q: new (x: unknown) => x is string;", "TS1228@35:11")
  @TestData("interface I { new (x: unknown): x is string; }", "TS1228@32:11")
  @TestData("class C { get g(): this is C { return true; } }", "TS1228@19:9")
  @TestData("function f(): Box<this is string> {}", "TS1228@18:14")
  @TestData("function f(x: unknown): x is string { return true; }", "")
  @TestData("function f(x: unknown): asserts x is string {}", "")
  @TestData("type T = (x: unknown) => x is string;", "")
  @TestData("interface I { m(x: unknown): x is string; (x: unknown): x is string; }", "")
  @TestMethod
  public reportsATypePredicateOutsideAReturnType(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("value is string", TypeScriptIdentifierNode)
  @TestData("object is object", TypeScriptObjectKeywordNode)
  @TestData("asserts is string", TypeScriptAssertsKeywordNode)
  @TestData("this is Value", TypeScriptThisTypeNode)
  @TestData("asserts value", TypeScriptIdentifierNode)
  @TestData("asserts value is Value", TypeScriptIdentifierNode)
  @TestData("asserts this is Value", TypeScriptThisTypeNode)
  @TestMethod
  public preservesPredicateNamesAndConsumesTheReturnType(content: string, expectedNameType: Function & NodeType): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseReturnType();
    Assert.isInstanceOf(node, TypeScriptTypePredicateNode);
    Assert.isInstanceOf(node.parameterNameNode, expectedNameType);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("value\n is string", 5)
  @TestData("asserts\n value", 7)
  @TestData("asserts", 7)
  @TestData("asserts 42", 7)
  @TestMethod
  public leavesUnrecognizedPredicatesAsTypeReferences(content: string, expectedLength: number): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseReturnType();
    Assert.isInstanceOf(node, TypeScriptTypeReferenceNode);
    Assert.areEqual(expectedLength, node.span.length);
  }

  @TestMethod
  public doesNotTreatAnOrdinaryTypeAsAParameterPredicate(): void {
    const parser = TypeScriptParserFixture.create("value is string");
    Assert.isInstanceOf(parser.parseType(), TypeScriptTypeReferenceNode);
    Assert.areEqual(6, parser.currentNode.span.startOffset);
  }

  @TestData("interface I { m(x): y is T; (x): y is T; n(...x): x is T; o([a]): a is T; } type F = (x) => y is T; type G = ({a}) => a is T;", "TS1225:y,TS1225:y,TS1229:x,TS1230:a,TS1225:y,TS1230:a")
  @TestMethod
  public readsAPredicateAgainstItsSignature(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }
}
