/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBlockNode,
  TypeScriptBreakStatementNode,
  TypeScriptContinueStatementNode,
  TypeScriptDebuggerStatementNode,
  TypeScriptDoStatementNode,
  TypeScriptEmptyStatementNode,
  TypeScriptExpressionStatementNode,
  TypeScriptIfStatementNode,
  TypeScriptParser,
  TypeScriptWhileStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class StatementParserTests {
  @TestData("return a b;", "TS1005", 9, 1, "';' expected.")
  @TestData("throw a b;", "TS1434", 6, 1, "Unexpected keyword or identifier.")
  @TestData("break label next;", "TS1005", 12, 4, "';' expected.")
  @TestData("continue label next;", "TS1005", 15, 4, "';' expected.")
  @TestData("debugger next;", "TS1005", 9, 4, "';' expected.")
  @TestData("if (a) b else c;", "TS1434", 7, 1, "Unexpected keyword or identifier.")
  @TestMethod
  public validatesStatementTermination(content: string, code: string, start: number, length: number, message: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
    Assert.areEqual(message, result.diagnostics[0]?.message.text);
  }

  @TestData("a", "")
  @TestData("a;", "")
  @TestData("{ a }", "")
  @TestData("a\nb;", "")
  @TestData("return\nb;", "TS1108")
  @TestData("return a\nb;", "TS1108")
  @TestData("throw a\nb;", "")
  @TestData("break label\nnext;", "TS1116")
  @TestData("continue label\nnext;", "TS1115")
  @TestData("debugger\nnext;", "")
  @TestData("if (a) b\nelse c;", "")
  @TestMethod
  public acceptsExplicitAndAutomaticTerminators(content: string, expectedCodes: string): void {
    Assert.areEqual(expectedCodes, TypeScriptParser.parse(content).diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public keepsTheOptionalDoWhileSemicolon(): void {
    const result = TypeScriptParser.parse("do {} while (true) next();");

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(2, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptDoStatementNode);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptExpressionStatementNode);
  }

  @TestMethod
  public dispatchesEachStatementByItsFirstToken(): void {
    const result = TypeScriptParser.parse(
      ";{}break label;continue label;debugger;do {} while (condition);"
      + "if (condition) return; else throw error;while (condition) {}value;");

    Assert.areEqual(9, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptEmptyStatementNode);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptBlockNode);
    Assert.isInstanceOf(result.rootNode.children[2], TypeScriptBreakStatementNode);
    Assert.isInstanceOf(result.rootNode.children[3], TypeScriptContinueStatementNode);
    Assert.isInstanceOf(result.rootNode.children[4], TypeScriptDebuggerStatementNode);
    Assert.isInstanceOf(result.rootNode.children[5], TypeScriptDoStatementNode);
    Assert.isInstanceOf(result.rootNode.children[6], TypeScriptIfStatementNode);
    Assert.isInstanceOf(result.rootNode.children[7], TypeScriptWhileStatementNode);
    Assert.isInstanceOf(result.rootNode.children[8], TypeScriptExpressionStatementNode);
    Assert.areEqual("TS1116,TS1115,TS1108", result.diagnostics.map(t => t.code.displayText).join(","));
  }
}
