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
export class TypeScriptParenthesizedTypeNodeExtensionsTests {
  @TestData("(a): (1) => 1;", "")
  @TestData("(a): ((1)) => 1;", "")
  @TestData("(a): (.T) => 1;", "TS1110@6:1")
  @TestData("(a): (=>) => 1;", "TS1005@3:1|TS1005@6:2|TS1109@8:1|TS1005@10:2")
  @TestData("(a): ((=>)) => 1;", "TS1005@3:1|TS1005@7:2|TS1109@9:1|TS1005@12:2")
  @TestData("(a): (.<T>) => 1;", "TS1005@3:1|TS1109@6:1|TS1003@7:1|TS1005@12:2")
  @TestMethod
  public blocksAnAmbiguousArrowHeadWhenTheEnclosedTypeDoes(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
