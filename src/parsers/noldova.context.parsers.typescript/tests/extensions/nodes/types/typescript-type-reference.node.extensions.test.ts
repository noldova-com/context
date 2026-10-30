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
export class TypeScriptTypeReferenceNodeExtensionsTests {
  @TestData("declare function f({ a } = { b?: 1 } as const): void;", "TS2371@19:26|TS1162@30:1")
  @TestData("declare function f({ a } = <const>{ b?: 1 }): void;", "TS2371@19:24|TS1162@37:1")
  @TestData("declare function f({ a } = { b?: 1 } as any): void;", "TS2371@19:24")
  @TestData("declare function f({ a } = <any>{ b?: 1 }): void;", "TS2371@19:22")
  @TestData("declare function f({ a } = { b?: 1 } as T): void;", "TS2371@19:22")
  @TestData("declare function f({ a } = { b?: 1 } as const<T>): void;", "TS2371@19:29")
  @TestData("declare function f({ a } = <const<T>>{ b?: 1 }): void;", "TS2371@19:27")
  @TestMethod
  public checksAnInitializerAssertedAsConst(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
