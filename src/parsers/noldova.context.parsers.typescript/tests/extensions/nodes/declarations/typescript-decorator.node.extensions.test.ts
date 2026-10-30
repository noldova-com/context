/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptDecoratorNodeExtensionsTests {
  @TestData("@d function f() {}", "TS1206")
  @TestData("@d interface I {}", "TS1206")
  @TestData("@d const value = 1;", "TS1206")
  @TestData("@d import value from \"module\";", "TS1206")
  @TestData("@d export * from \"module\";", "TS1206")
  @TestData("@d declare namespace N {}", "TS1206")
  @TestData("@d export const enum E { A }", "TS1206")
  @TestData("class C { @d static {} }", "TS1206")
  @TestData("class C { @d constructor() {} }", "TS1206")
  @TestData("class C { @d declare value: Value; }", "TS1206")
  @TestData("abstract class C { @d abstract value: Value; }", "TS1206")
  @TestData("class C { @d get value(); }", "TS1206")
  @TestData("class C { @d set value(input); }", "TS1206")
  @TestData("class C { @d [key: string]: Value; }", "TS1206")
  @TestData("function f(@d input: Value) {}", "TS1206")
  @TestData("class C { constructor(@d public input: Value) {} }", "TS1206")
  @TestData("class C { @d method(); }", "TS1249")
  @TestData("abstract class C { @d abstract method(); }", "TS1249")
  @TestMethod
  public reportsADecoratorTheDeclarationCannotCarry(content: string, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(expectedCode, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf("@"), result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics[0]?.location?.length);
  }

  @TestData("@d class C {}")
  @TestData("@d export default class C {}")
  @TestData("const C = @d class {};")
  @TestData("class C { @d value = 1; }")
  @TestData("class C { @d accessor value = 1; }")
  @TestData("class C { @d method() {} }")
  @TestData("class C { @d get value() { return 1; } }")
  @TestData("class C { @d set value(input) {} }")
  @TestData("declare class C { @d value: Value; }")
  @TestMethod
  public acceptsADecoratorOnAClassAndOnTheMembersThatImplementOne(content: string): void {
    Assert.areEqual(0, TypeScriptParser.parse(content).diagnostics.length);
  }

  @TestData("class C { @d?.e value: Value; }", "d?.e", "?.")
  @TestData("class C { @a.b?.c value: Value; }", "a.b?.c", "?.")
  @TestData("class C { @d?.() value: Value; }", "d?.()", "?.")
  @TestData("class C { @d().e value: Value; }", "d().e", "d()")
  @TestData("class C { @d()() value: Value; }", "d()()", "d()")
  @TestData("class C { @(d)! value: Value; }", "(d)!", "(d)")
  @TestData("class C { @(d)() value: Value; }", "(d)()", "(d)")
  @TestData("class C { @new d() value: Value; }", "new d()", "new d()")
  @TestData("class C { @this value: Value; }", "this", "this")
  @TestData("class C { @super.d value: Value; }", "super.d", "super")
  @TestData("class C { @d?.[key] value: Value; }", "d?.[key]", "d?.[key]")
  @TestData("class C { @d?.()() value: Value; }", "d?.()()", "?.")
  @TestData("class C { @d.e?.()() value: Value; }", "d.e?.()()", "?.")
  @TestData("class C { @d()!() value: Value; }", "d()!()", "d()")
  @TestMethod
  public reportsADecoratorExpressionThatParenthesesWouldHaveEnclosed(content: string, expectedText: string, expectedRelatedText: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    const diagnostic = result.diagnostics[0];
    Assert.areEqual("TS1497", diagnostic?.code.displayText);
    Assert.areEqual(content.indexOf(expectedText), diagnostic?.location?.start);
    Assert.areEqual(expectedText.length, diagnostic?.location?.length);
    Assert.areEqual(1, diagnostic?.relatedInformation.length);
    const related = diagnostic?.relatedInformation[0];
    Assert.areEqual("TS1498", related?.message.code.displayText);
    Assert.areEqual(content.indexOf(expectedRelatedText), related?.location?.start);
    Assert.areEqual(expectedRelatedText.length, related?.location?.length);
  }

  @TestData("class C { @d value: Value; }")
  @TestData("class C { @d.e.f value: Value; }")
  @TestData("class C { @d.#e value: Value; }")
  @TestData("class C { @d() value: Value; }")
  @TestData("class C { @d<Value>() value: Value; }")
  @TestData("class C { @d<Value>\nvalue: Value; }")
  @TestData("class C { @d.e<Value>\nvalue: Value; }")
  @TestData("class C { @d.e! value: Value; }")
  @TestData("class C { @d!.e value: Value; }")
  @TestData("class C { @d!() value: Value; }")
  @TestData("class C { @d()! value: Value; }")
  @TestData("class C { @(d + e) value: Value; }")
  @TestMethod
  public acceptsADecoratorThatNamesAMemberChain(content: string): void {
    Assert.areEqual(0, TypeScriptParser.parse(content).diagnostics.length);
  }

  @TestMethod
  public readsEachWrittenDecoratorOfOneMember(): void {
    const content = "class C { @a?.b @c?.d value: Value; }";
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(2, result.diagnostics.length);
    Assert.areEqual("TS1497", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf("a?.b"), result.diagnostics[0]?.location?.start);
    Assert.areEqual("TS1497", result.diagnostics[1]?.code.displayText);
    Assert.areEqual(content.indexOf("c?.d"), result.diagnostics[1]?.location?.start);
  }

  @TestData("@dec class {}", "TS1211@0:1")
  @TestData("@dec.a.b class {}", "TS1211@0:1")
  @TestData("@dec @dec2 class {}", "TS1211@0:1")
  @TestData("export @dec class {}", "TS1211@0:6")
  @TestData("class {}", "TS1211@0:5")
  @TestMethod
  public namesTheAtOfADecoratorWhereADeclarationNamesItsFirstToken(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
