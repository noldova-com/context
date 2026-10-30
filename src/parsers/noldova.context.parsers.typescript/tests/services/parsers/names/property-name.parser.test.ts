/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptComputedPropertyNameNode,
  TypeScriptMethodDeclarationNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptPropertyDeclarationNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class PropertyNameParserTests {
  @TestMethod
  public parsesEveryPropertyNameForm(): void {
    const bodyNode = ClassBodyParserFixture.parse("class { identifier; #private; new; 1n; 2; \"three\"; [computed]; }");

    Assert.areEqual(7, bodyNode.children.length);
    for (const childNode of bodyNode.children)
      Assert.isInstanceOf(childNode, TypeScriptPropertyDeclarationNode);

    const computedPropertyNode = bodyNode.children[6];
    Assert.isInstanceOf(computedPropertyNode, TypeScriptPropertyDeclarationNode);
    Assert.isInstanceOf(computedPropertyNode.nameNode, TypeScriptComputedPropertyNameNode);
  }

  @TestData("class { ...; }", "TS1068@8:3")
  @TestData("class { [name: Value; }", "TS1005@20:1|TS1138@22:1")
  @TestMethod
  public reportsInvalidAndUnclosedComputedNames(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);

    parser.parseExpression();

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("export {}; class C { [await] = 1 }", "TS1262@22:5")
  @TestData("export {}; class C { get [await]() { return 1; } }", "TS1262@26:5")
  @TestData("export {}; let o = { [await]: 1 };", "TS1262@22:5")
  @TestData("export {}; let { [await]: x } = o;", "TS1262@18:5")
  @TestData("export {}; enum E { [await] = 1 }", "TS1164@20:7|TS1262@21:5")
  @TestData("export {}; interface I { [await]: 1 }", "TS1262@26:5")
  @TestData("export {}; interface I { [await.x]: 1 }", "TS1262@26:5")
  @TestData("export {}; interface I { [await]: 1 } await;", "TS1109@43:1")
  @TestData("export {}; let o = { [await]: await };", "TS1109@27:1|TS1109@36:1")
  @TestData("export {}; let o = { [await]: 1 }, p = await;", "TS1109@27:1|TS1109@44:1")
  @TestData("export {}; let o = { [await]: 1 }; await;", "TS1109@40:1")
  @TestMethod
  public leavesAnAwaitNameUnmarkedForTheModulesAwaitReading(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = { [a in b]: 1 };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = class { [a in b]() {} };;) {}", "")
  @TestMethod
  public readsInAsAnOperatorInAComputedName(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class { * }", 9, "TS1003@10:1")
  @TestData("class { static async * }", 22, "TS1003@23:1")
  @TestMethod
  public writesAMissingNameWhereNoPropertyNameFollows(content: string, offset: number, expected: string): void {
    const node = ClassBodyParserFixture.parse(content).children[0];

    Assert.isInstanceOf(node, TypeScriptMethodDeclarationNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(offset, node.nameNode.span.startOffset);
    Assert.areEqual(0, node.nameNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
