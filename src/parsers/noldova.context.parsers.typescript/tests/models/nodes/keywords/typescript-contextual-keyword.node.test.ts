/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptContextualKeywordNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptContextualKeywordNodeTests {
  @TestData("abstract", true)
  @TestData("accessor", true)
  @TestData("any", true)
  @TestData("as", true)
  @TestData("assert", true)
  @TestData("asserts", true)
  @TestData("async", true)
  @TestData("await", true)
  @TestData("bigint", true)
  @TestData("boolean", true)
  @TestData("break", false)
  @TestData("case", false)
  @TestData("catch", false)
  @TestData("class", false)
  @TestData("const", false)
  @TestData("constructor", true)
  @TestData("continue", false)
  @TestData("debugger", false)
  @TestData("declare", true)
  @TestData("default", false)
  @TestData("defer", true)
  @TestData("delete", false)
  @TestData("do", false)
  @TestData("else", false)
  @TestData("enum", false)
  @TestData("export", false)
  @TestData("extends", false)
  @TestData("false", false)
  @TestData("finally", false)
  @TestData("for", false)
  @TestData("from", true)
  @TestData("function", false)
  @TestData("get", true)
  @TestData("global", true)
  @TestData("if", false)
  @TestData("immediate", true)
  @TestData("implements", false)
  @TestData("import", false)
  @TestData("in", false)
  @TestData("infer", true)
  @TestData("instanceof", false)
  @TestData("interface", false)
  @TestData("intrinsic", true)
  @TestData("is", true)
  @TestData("keyof", true)
  @TestData("let", false)
  @TestData("module", true)
  @TestData("namespace", true)
  @TestData("never", true)
  @TestData("new", false)
  @TestData("null", false)
  @TestData("number", true)
  @TestData("object", true)
  @TestData("of", true)
  @TestData("out", true)
  @TestData("override", true)
  @TestData("package", false)
  @TestData("private", false)
  @TestData("protected", false)
  @TestData("public", false)
  @TestData("readonly", true)
  @TestData("require", true)
  @TestData("return", false)
  @TestData("satisfies", true)
  @TestData("set", true)
  @TestData("static", false)
  @TestData("string", true)
  @TestData("super", false)
  @TestData("switch", false)
  @TestData("symbol", true)
  @TestData("this", false)
  @TestData("throw", false)
  @TestData("true", false)
  @TestData("try", false)
  @TestData("type", true)
  @TestData("typeof", false)
  @TestData("undefined", true)
  @TestData("unique", true)
  @TestData("unknown", true)
  @TestData("using", true)
  @TestData("var", false)
  @TestData("void", false)
  @TestData("while", false)
  @TestData("with", false)
  @TestData("yield", false)
  @TestMethod
  public setsApartTheKeywordsTheReferenceReadsAsNames(word: string, isContextual: boolean): void {
    const node = TypeScriptParserFixture.create(word).currentNode;

    Assert.areEqual(isContextual, node instanceof TypeScriptContextualKeywordNode);
  }
}
