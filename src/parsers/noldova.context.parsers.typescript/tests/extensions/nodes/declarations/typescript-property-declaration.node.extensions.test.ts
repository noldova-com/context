/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source } from "@noldova/context.parsers";
import { TypeScriptPropertyDeclarationNode } from "@noldova/context.parsers.typescript";
import { TypeScriptParserContext } from "@noldova/context.parsers.typescript/models/typescript-parser-context.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptPropertyDeclarationNodeExtensionsTests {
  @TestData("abstract class C { abstract value: number = 1; }", "TS1267@28:5")
  @TestData("abstract class C { abstract value = 1; }", "TS1267@28:5")
  @TestData("abstract class C { abstract value: number; }", "")
  @TestData("abstract class C { value = 1; }", "")
  @TestData("class C { value = 1; }", "")
  @TestData("class C { abstract value: number = 1; }", "TS1253@10:8|TS1267@19:5")
  @TestData("abstract class C { abstract 'quoted name' = 1; }", "TS1267@28:13")
  @TestData("abstract class C { abstract [computed] = 1; }", "TS1267@28:10")
  @TestData("declare class C { value = 1; }", "TS1039@26:1")
  @TestData("declare class C { readonly value = 1; }", "")
  @TestData("declare class C { readonly value: number = 1; }", "TS1039@43:1")
  @TestData("declare class C { static value = 1; }", "TS1039@33:1")
  @TestData("class C { declare value = 1; }", "TS1039@26:1")
  @TestData("declare class C { abstract value = 1; }", "TS1253@18:8|TS1267@27:5")
  @TestData("abstract class C { abstract declare value = 1; }", "TS1267@36:5|TS1039@44:1")
  @TestMethod
  public readsTheValueAnAbstractOrAmbientPropertyWrites(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class { static value; }", 15, 5)
  @TestData("class { static const ...value; }", 20, 0)
  @TestMethod
  public namesItsWrittenOrMissingName(content: string, expectedStart: number, expectedLength: number): void {
    const node = ClassBodyParserFixture.parse(content).children[0];
    Assert.isInstanceOf(node, TypeScriptPropertyDeclarationNode);

    const span = node.getTypeScriptDeclarationNameSpan(new TypeScriptParserContext(new Source(content)));

    Assert.areEqual(expectedStart, span.startOffset);
    Assert.areEqual(expectedLength, span.length);
  }
}
