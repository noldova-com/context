/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptDeleteExpressionNodeExtensionsTests {
  @TestData("declare let x: any;\ndelete x.y;", "")
  @TestData("declare let x: any;\ndelete x[0];", "")
  @TestData("declare let x: any;\ndelete x?.y;", "")
  @TestData("declare let x: any;\ndelete (x.y);", "")
  @TestData("declare let x: any;\ndelete ((x.y));", "")
  @TestData("delete 1;", "TS2703@7:1")
  @TestData("delete (1);", "TS2703@8:1")
  @TestData("delete this;", "TS2703@7:4")
  @TestData("declare let x: any;\ndelete x();", "TS2703@27:3")
  @TestData("declare let x: any;\ndelete x!;", "TS2703@27:2")
  @TestData("declare let x: any;\ndelete <any>x;", "TS2703@27:6")
  @TestData("declare let x: any;\ndelete (x.y as any);", "TS2703@28:10")
  @TestData("declare let x: any;\ndelete delete x.y;", "TS2703@27:10")
  @TestMethod
  public requiresAPropertyReferenceInsideAnyParentheses(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare let x: any;\ndelete x;", "TS1102@27:1|TS2703@27:1")
  @TestData("delete undefined;", "TS1102@7:9|TS2703@7:9")
  @TestData("declare let x: any;\ndelete (x);", "TS2703@28:1")
  @TestData("delete (undefined);", "TS2703@8:9")
  @TestMethod
  public reportsDeletingAnUnparenthesizedIdentifier(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare let x: any;\ndeclare function f(a = delete x): void;", "TS2371@39:12|TS1102@50:1")
  @TestData("declare function f(a = delete undefined): void;", "TS2371@19:20|TS1102@30:9")
  @TestData("declare let x: any;\ndeclare function f(a = delete (x)): void;", "TS2371@39:14")
  @TestData("declare function f(a = delete 1): void;", "TS2371@19:12")
  @TestMethod
  public reportsDeletingAnIdentifierInAnInitializerTheCheckerSkips(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare namespace N { delete x.y; }", "TS1036@22:6")
  @TestMethod
  public reportsAnAmbientStatementAtItsDeleteKeyword(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
