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
export class SourceDirectiveParserTests {
  @TestData("/// <reference path=\"a.ts\" />\nvar x;", "")
  @TestData("/// <reference path=\"missingquote.ts />\nclass C {}", "TS1084:/// <reference path=\"missingquote.ts />")
  @TestData("/// <reference types=\"pkg\" resolution-mode=\"esm\"/>\nfoo;", "TS1453:esm")
  @TestData("/// <reference types=\"pkg\" resolution-mode=\"import\"/>\n/// <reference types=\"pkg\" resolution-mode='require'/>\nvar x;", "")
  @TestData("/// <reference no-default-lib=\"true\"/>\n/// <reference no-default-lib=\"false\"/>\nvar x;", "TS1084:/// <reference no-default-lib=\"false\"/>")
  @TestData("///<reference lib = 'es2015' />\n// <reference foo=\"x\" />\n/// <notreference path=\"a\"/>\n/// <reference>\nvar x;", "TS1084:/// <reference>")
  @TestData("/// <reference path=\"a\" unknown=\"b\" />\n/// <reference resolution-mode=\"esm\" path=\"a\"/>\nvar x;", "")
  @TestData("var x;\n/// <reference path=\"missingquote.ts />", "")
  @TestData("/* block */ /// <reference/>\nvar x;", "TS1084:/// <reference/>")
  @TestData("#!/usr/bin/env node\n/// <reference path=\"x />\nvar x;", "TS1084:/// <reference path=\"x />")
  @TestData("/// <reference path=x />\n/// <reference types=\"a\" resolution-mode=\"esm\" path=\"b\"/>\n/// <reference TYPES=\"a\"/>\nvar x;", "TS1084:/// <reference path=x />,TS1453:esm")
  @TestData("/// <reference path=\"a\"/>\n\n/* c */\n\n/// <reference path='b' preserve=\"true\"/>\n/// <reference />\nvar x;", "TS1084:/// <reference />")
  @TestData("/// <reference path=\"a\"", "")
  @TestData("///\tx\n///", "")
  @TestData("/// <reference path/>\n/// <reference types /* c */ />\nvar x;", "TS1084:/// <reference path/>,TS1084:/// <reference types /* c */ />")
  @TestMethod
  public readsTheDirectivesWrittenBeforeTheFirstToken(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("// @ts-nocheck\nwith (x) {}\nvar o = { a: 1, a: 2 };", "")
  @TestData("/* c */\n// @ts-nocheck\nvar o = { a: 1, a: 2 };", "")
  @TestData("// @TS-NOCHECK\nvar o = { a: 1, a: 2 };", "")
  @TestData("/// @ts-nocheck\nvar o = { a: 1, a: 2 };", "")
  @TestData("// @ts-nocheck\n// @ts-check\nvar o = { a: 1, a: 2 };", "TS1117:a")
  @TestData("var y;\n// @ts-nocheck\nvar o = { a: 1, a: 2 };", "TS1117:a")
  @TestData("//@ts-nocheck extra words\nvar o = { a: 1, a: 2 };", "")
  @TestData("// @ts-nocheckx\nvar o = { a: 1, a: 2 };", "TS1117:a")
  @TestData("// @ts-nocheck\nvar o = { a: 1, a: 2 }\nvar p = ;", "TS1109:;")
  @TestData("// @ts-nocheck\nfunction f(eval) {}", "")
  @TestData("//  \t@ts-nocheck\nvar o = { a: 1, a: 2 };", "")
  @TestMethod
  public readsWhetherTheSourceOptsOutOfChecking(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }
}
