/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptLabeledStatementNodeExtensionsTests {
  @TestData("label: const value = 1;", "TS1344@0:5")
  @TestData("label: var value = 1;", "TS1344@0:5")
  @TestData("label: function f() {}", "TS1344@0:5")
  @TestData("label: class C {}", "TS1344@0:5")
  @TestData("label: interface I {}", "TS1344@0:5")
  @TestData("label: type T = number;", "TS1344@0:5")
  @TestData("label: enum E {}", "TS1344@0:5")
  @TestData("label: @dec class C {}", "TS1344@0:5")
  @TestData("label: namespace N {}", "TS1344@0:5|TS1235@7:9")
  @TestData("label: global {}", "TS1344@0:5|TS1234@7:6")
  @TestData("label: import 'm';", "TS1344@0:5|TS1232@7:6")
  @TestData("label: import x = require('m');", "TS1344@0:5|TS1232@7:6")
  @TestData("label: export {};", "TS1344@0:5|TS1233@7:6")
  @TestData("label: export = value;", "TS1344@0:5|TS1231@7:6")
  @TestData("label: export as namespace G;", "TS1344@0:5|TS1316@7:22")
  @TestData("label: declare const value: number;", "TS1344@0:5|TS1184@7:7")
  @TestData("outer: inner: const value = 1;", "TS1344@7:5")
  @TestData("label: @dec;", "TS1146@11:0")
  @TestData("label: @dec 1;", "TS1146@11:0")
  @TestData("label: run();", "")
  @TestData("label: { run(); }", "")
  @TestData("label: while (x) {}", "")
  @TestData("label: if (x) run();", "")
  @TestMethod
  public readsWhetherWhatALabelNamesIsWrittenOrRun(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
