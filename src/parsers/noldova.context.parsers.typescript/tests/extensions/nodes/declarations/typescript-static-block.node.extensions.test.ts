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
export class TypeScriptStaticBlockNodeExtensionsTests {
  @TestData("class C { public static {} }", "TS1184@10:6")
  @TestData("class C { export static {} }", "TS1184@10:6")
  @TestData("class C { async static {} }", "TS1184@10:5")
  @TestData("class C { declare static {} }", "TS1184@10:7")
  @TestData("class C { abstract static {} }", "TS1184@10:8")
  @TestData("class C { static {} }", "")
  @TestMethod
  public refusesEveryModifier(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
