/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptClassDeclarationNode,
  TypeScriptIndexSignatureNode,
  TypeScriptParser,
  TypeScriptPropertyDeclarationNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class IndexSignatureParserTests {
  @TestMethod
  public distinguishesIndexSignaturesFromComputedProperties(): void {
    const bodyNode = ClassBodyParserFixture.parse("class { @decorator [key: string]: Value; [computed]: Value; }");

    Assert.isInstanceOf(bodyNode.children[0], TypeScriptIndexSignatureNode);
    Assert.areEqual(1, bodyNode.children[0].modifierNodes.length);
    Assert.isInstanceOf(bodyNode.children[1], TypeScriptPropertyDeclarationNode);
  }

  @TestData("class C { [first: string, second: number]: unknown; }", "TS1096@11:5")
  @TestData("class C { [...values: string[]]: unknown; }", "TS1017@11:3")
  @TestData("class C { [public value: string]: unknown; }", "TS2369@11:20|TS1018@18:5")
  @TestData("class C { [value?: string]: unknown; }", "TS1019@16:1")
  @TestData("class C { [value: string = fallback]: unknown; }", "TS1020@11:5|TS2371@11:24")
  @TestData("class C { [value,]: unknown; }", "TS1022@11:5|TS1025@16:1")
  @TestData("class C { [value: string] }", "TS1021@10:15")
  @TestData("class C { [value: string,]: unknown; }", "TS1025@24:1")
  @TestData("class C { public [key: string]: unknown; }", "TS1071@10:6")
  @TestMethod
  public reportsInvalidIndexSignatures(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { [...: string[]]: unknown; }", "TS1003@14:1 Identifier expected.")
  @TestData("class C { [... = fallback]: unknown; }", "TS1003@15:1 Identifier expected.")
  @TestMethod
  public reportsAMissingRestParameterNameInAnIndexSignature(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const classNode = result.rootNode.children[0];

    Assert.isInstanceOf(classNode, TypeScriptClassDeclarationNode);
    Assert.isInstanceOf(classNode.bodyNode.children[0], TypeScriptIndexSignatureNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("class C { [a, \"x\"]: number }", "TS1003:\"x\" Identifier expected.")
  @TestData("declare var a: any;\nclass C { async [a, \"x\"](); }",
    "TS1003:\"x\" Identifier expected.,TS1005:( ';' expected.,TS1109:) Expression expected.,TS1128:} Declaration or statement expected.")
  @TestData("class C { [a, 1](); }", "TS1003:1 Identifier expected.,TS1005:( ';' expected.,TS1109:) Expression expected.,TS1128:} Declaration or statement expected.")
  @TestData("interface I { [a, \"x\"]: number }", "TS1003:\"x\" Identifier expected.")
  @TestData("type T = { [a, \"x\"]: number };", "TS1003:\"x\" Identifier expected.")
  @TestData("class C { [a, \"x\", b]: number }", "TS1003:\"x\" Identifier expected.,TS1138:, Parameter declaration expected.")
  @TestData("class C { [a: string; b]: any }", "TS1005:; ',' expected.")
  @TestData("interface I { [a: string b: number]: any }", "TS1005:b ',' expected.")
  @TestData("interface I { [a: string ) ]: any }", "TS1005:) ']' expected.,TS1131:] Property or signature expected.,TS1131:: Property or signature expected.")
  @TestMethod
  public readsIndexSignatureParametersAsADelimitedParameterList(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectTextWithMessages(content, result.diagnostics));
  }
}
