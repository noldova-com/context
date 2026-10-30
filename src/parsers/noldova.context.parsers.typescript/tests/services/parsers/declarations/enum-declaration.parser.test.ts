/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBinaryExpressionNode,
  TypeScriptEnumDeclarationNode,
  TypeScriptExpressionStatementNode,
  TypeScriptMissingExpressionNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class EnumDeclarationParserTests {
  @TestData("enum E {}", 0, 0, "")
  @TestData("enum E { A, B = 2, C }", 3, 2, "")
  @TestData("enum E { A, }", 1, 1, "")
  @TestData('enum E { "a" = "text", default = 2, async }', 3, 2, "")
  @TestData("enum E { [name] = 1, 1 = 2, 2n = 3, #private = 4 }", 4, 3, "TS1164,TS18024")
  @TestData("enum\nE {}", 0, 0, "")
  @TestMethod
  public preservesNamesMembersAndWrittenCommas(content: string, members: number, commas: number, expectedCodes: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptEnumDeclarationNode);
    Assert.areEqual(members, node.children.length);
    Assert.areEqual(commas, node.commaNodes.length);
    Assert.isDefined(node.openBraceNode);
    Assert.isDefined(node.closeBraceNode);
    Assert.areEqual(expectedCodes, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("enum E { [name] = 1 }", "TS1164@9:6")
  @TestData("enum E { [name] }", "TS1164@9:6")
  @TestData("const enum E { [name.other] = 1 }", "TS1164@15:12")
  @TestData("declare enum E { [1 + 1] = 1 }", "TS1164@17:7")
  @TestData("enum E { [-1] = 1 }", "TS1164@9:4")
  @TestData("enum E { [1n] = 1 }", "TS1164@9:4")
  @TestData('enum E { ["literal"] = 1 }', "")
  @TestData("enum E { [1] = 1 }", "")
  @TestData("enum E { [`text`] = 1 }", "")
  @TestData("enum E { #name = 1 }", "TS18024@9:5")
  @TestData("enum E { #name }", "TS18024@9:5")
  @TestData("enum E { #other = 2, [name] = 1 }", "TS18024@9:6|TS1164@21:6")
  @TestData("enum E { [name] = 1 } )", "TS1128@22:1")
  @TestData("enum E { [] = 1 }", "TS1109@10:1")
  @TestMethod
  public readsWhetherAWrittenNameNamesAMember(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public retainsExpressionTreesWithoutComputingConstants(): void {
    const result = TypeScriptParser.parse("enum E { A, B = 1 << 2, C = f(1,2), D = (1,2), E = value ? 1 : 2 }");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptEnumDeclarationNode);
    Assert.areEqual(5, node.children.length);
    Assert.areEqual(4, node.commaNodes.length);
    Assert.isUndefined(node.children[0]?.initializerNode);
    Assert.isInstanceOf(node.children[1]?.initializerNode, TypeScriptBinaryExpressionNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("enum", "TS1003", 4, 0, "Identifier expected.")
  @TestData("enum {}", "TS1003", 5, 1, "Identifier expected.")
  @TestData("enum class {}", "TS1359", 5, 5, "Identifier expected. 'class' is a reserved word that cannot be used here.")
  @TestData("enum E", "TS1005", 6, 0, "'{' expected.")
  @TestData("enum E { A", "TS1005", 10, 0, "'}' expected.")
  @TestData("enum E { A B }", "TS1357", 11, 1, "An enum member name must be followed by a ',', '=', or '}'.")
  @TestData("enum E { A\nB }", "TS1357", 11, 1, "An enum member name must be followed by a ',', '=', or '}'.")
  @TestData("enum E { A,,B }", "TS1132", 11, 1, "Enum member expected.")
  @TestData("enum E { , }", "TS1132", 9, 1, "Enum member expected.")
  @TestData("enum E { = 1, B }", "TS1132", 9, 1, "Enum member expected.")
  @TestData("enum E { A: 1 }", "TS1357", 10, 1, "An enum member name must be followed by a ',', '=', or '}'.")
  @TestMethod
  public recoversAMalformedEnumWithItsDiagnostic(content: string, code: string, start: number, length: number, message: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptEnumDeclarationNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
    Assert.areEqual(message, result.diagnostics[0]?.message.text);
  }

  @TestMethod
  public abandonsTheMembersAtATokenThatStartsAStatement(): void {
    const result = TypeScriptParser.parse("enum E { A (x) }");

    Assert.areEqual(2, result.diagnostics.length);
    Assert.areEqual("TS1357", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(11, result.diagnostics[0]?.location?.start);
    Assert.areEqual("TS1128", result.diagnostics[1]?.code.displayText);
    Assert.areEqual(15, result.diagnostics[1]?.location?.start);
    Assert.areEqual(2, result.rootNode.children.length);
  }

  @TestMethod
  public skipsAStraySemicolonBetweenMembers(): void {
    const result = TypeScriptParser.parse("enum E { A; B }");

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1357", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(10, result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.rootNode.children.length);
  }

  @TestData("enum E { A = , B }", 2, 1)
  @TestData("enum E { A = }", 1, 0)
  @TestMethod
  public missingInitializersPreserveTheNextMemberAndClosingBrace(content: string, members: number, commas: number): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptEnumDeclarationNode);
    Assert.areEqual(members, node.children.length);
    Assert.areEqual(commas, node.commaNodes.length);
    Assert.isDefined(node.closeBraceNode);
    const initializer = node.children[0]?.initializerNode;
    Assert.isInstanceOf(initializer, TypeScriptMissingExpressionNode);
    Assert.areEqual(0, initializer.span.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1109", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(13, result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics[0]?.location?.length);
  }

  @TestData("await", TypeScriptContextFlags.Await)
  @TestData("yield", TypeScriptContextFlags.Yield)
  @TestMethod
  public parsesInitializersOutsideTheEnclosingAsyncOrGeneratorContext(name: string, flags: TypeScriptContextFlags): void {
    const parser = TypeScriptParserFixture.create(`enum E { A = ${name} + 1 }`, flags);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptEnumDeclarationNode);
    Assert.isInstanceOf(node.children[0]?.initializerNode, TypeScriptBinaryExpressionNode);
    Assert.areEqual(flags, parser.context.contextFlags);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public restoresNavigationAndDiagnosticsAfterATentativeDeclaration(): void {
    const parser = TypeScriptParserFixture.create("enum E { Value = } next;");
    const initialNode = parser.currentNode;
    const initialOffset = parser.typescriptLexer.reader.currentOffset;

    parser.lookAhead(() => {
      parser.parseStatement();
      Assert.areEqual("TS1109@17:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
      return true;
    });
    Assert.areEqual(initialNode, parser.currentNode);
    Assert.areEqual(initialOffset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);

    parser.tryParse(() => {
      parser.parseStatement();
      return undefined;
    });
    Assert.areEqual(initialNode, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);

    const node = parser.parseStatement();
    Assert.isInstanceOf(node, TypeScriptEnumDeclarationNode);
    Assert.areEqual(18, node.span.endOffset);
    Assert.areEqual("TS1109@17:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public leavesAFollowingStatementOutsideTheDeclaration(): void {
    const result = TypeScriptParser.parse("enum E { A } next();");

    Assert.areEqual(2, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptEnumDeclarationNode);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptExpressionStatementNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("enum E { a = await, b = f(a if (b) c) }\nexport {};", "TS1005@28:2|TS1357@31:1|TS1005@35:1|TS1128@36:1|TS1128@38:1")
  @TestData("enum await { a } f(a if (b) c);\nexport {};", "TS1005@21:2|TS1434@28:1|TS1128@29:1")
  @TestData("enum E { a = await }\nexport {};", "")
  @TestMethod
  public forgetsTheAwaitNamesAnEnumReads(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("enum #E {}", "TS18016@5:2 Private identifiers are not allowed outside class bodies.")
  @TestData("enum \\u0063lass {}", "TS1359@5:10 Identifier expected. '\\u0063lass' is a reserved word that cannot be used here.")
  @TestData("enum {}", "TS1003@5:1 Identifier expected.")
  @TestMethod
  public readsItsNameAsAnIdentifier(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("enum {}", "TS1003@5:1")
  @TestData("enum 5 {}", "TS1003@5:1|TS1005@7:1")
  @TestData("enum class {}", "TS1359@5:5")
  @TestMethod
  public writesAMissingNameWhereTheSourceLacksOne(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptEnumDeclarationNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(4, node.nameNode.span.startOffset);
    Assert.areEqual(0, node.nameNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("enum E { a )", "enum E { a )")
  @TestData("enum E { a, )", "enum E { a, )")
  @TestData("enum E { )", "enum E { )")
  @TestMethod
  public endsAtATokenItsMemberListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptEnumDeclarationNode);
    Assert.areEqual(expected, parser.context.source.getText(node.span));
  }
}
