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
export class TypeScriptMissingTypeNodeExtensionsTests {
  @TestData("(a: any): => 1;", "TS1110@10:2")
  @TestData("(a): => 1;", "TS1005@3:1|TS1128@5:2")
  @TestData("let f = (a): => 1;", "TS1005@11:1|TS1005@13:2")
  @TestData("let f = (a, b): => 1;", "TS1005@14:1|TS1005@16:2")
  @TestMethod
  public blocksAnAmbiguousArrowHead(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("(a): T => 1;", "")
  @TestData("(a): T<U> => 1;", "")
  @TestData("let f = (a): T.U => 1;", "")
  @TestData("(a): .T => 1;", "TS1110@5:1")
  @TestData("(a): .<T> => 1;", "TS1005@3:1|TS1128@5:1|TS1109@10:2")
  @TestData("let f = (a): .<T> => 1;", "TS1005@11:1|TS1134@13:1|TS1134@14:1|TS1109@18:2")
  @TestMethod
  public blocksAnAmbiguousArrowHeadOnlyWhereATypeNameIsMissing(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
