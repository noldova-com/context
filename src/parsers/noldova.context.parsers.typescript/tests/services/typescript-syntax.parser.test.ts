/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptArrowFunctionNode,
  TypeScriptBinaryExpressionNode,
  TypeScriptExpressionStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptInKeywordNode,
  TypeScriptParameterNode,
  TypeScriptParser,
  TypeScriptPrefixUnaryExpressionNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { TypeScriptListKind } from "@noldova/context.parsers.typescript/enums/typescript-list-kind.js";
import { TypeScriptRecursionLimitException } from "@noldova/context.parsers.typescript/exceptions/typescript-recursion-limit.exception.js";
import { TypeScriptParserContext } from "@noldova/context.parsers.typescript/models/typescript-parser-context.js";
import { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";
import { TypeScriptSyntaxParser } from "@noldova/context.parsers.typescript/services/typescript-syntax.parser.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../fixtures/typescript-parser.fixture.js";
import { TypeScriptSourceReaderProbe } from "../fixtures/typescript-source-reader-probe.js";
import { TypeScriptSyntaxParserProbe } from "../fixtures/typescript-syntax-parser-probe.js";

@TestClass
export class TypeScriptSyntaxParserTests {
  @TestMethod
  public restoresImportMetaAfterLookaheadRejectionAndExceptions(): void {
    const parser = TypeScriptParserFixture.create("import.meta");
    const node = parser.currentNode;
    parser.lookAhead(() => {
      parser.parseAssignmentExpression();
      Assert.isTrue(parser.context.records.hasImportMeta);
      return true;
    });
    Assert.isFalse(parser.context.records.hasImportMeta);
    Assert.areEqual(node, parser.currentNode);
    parser.tryParse(() => {
      parser.parseAssignmentExpression();
      Assert.isTrue(parser.context.records.hasImportMeta);
      return undefined;
    });
    Assert.isFalse(parser.context.records.hasImportMeta);
    Assert.throws(() => parser.tryParse(() => {
      parser.parseAssignmentExpression();
      throw new Error("interrupted");
    }), Error);
    Assert.isFalse(parser.context.records.hasImportMeta);
    Assert.areEqual(node, parser.currentNode);
    const result = parser.tryParse(() => parser.parseAssignmentExpression());
    Assert.isDefined(result);
    Assert.isTrue(parser.context.records.hasImportMeta);
  }

  @TestData("type F = ([a = { x: 1, x: 2 }]) => void;", "TS2371@11:1|TS1117@23:1")
  @TestData("type F = (public a) => void;", "TS2369@10:8")
  @TestMethod
  public releasesEveryRecordALookAheadWrites(content: string, expected: string): void {
    const result = TypeScriptParserFixture.create(content).parse();

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData(16)
  @TestData(128)
  @TestData(512)
  @TestMethod
  public boundsModuleReinterpretationToOneAdditionalPass(statementCount: number): void {
    const reader = new TypeScriptSourceReaderProbe(new Source("await(value);".repeat(statementCount) + "export {};"));
    const context = new TypeScriptParserContext(reader.source);
    const parser = new TypeScriptSyntaxParser(context, new TypeScriptLexer(reader, context.diagnosticCollector, context.records.commentDirectiveOffsets));
    const result = parser.parse();
    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(statementCount + 1, result.rootNode.children.length);
    Assert.areEqual(TypeScriptContextFlags.None, parser.context.contextFlags);
    Assert.areEqual(reader.endOffset, reader.currentOffset);
    Assert.isTrue(reader.operationCount <= statementCount * 64 + 64);
  }

  @TestData(16)
  @TestData(128)
  @TestData(512)
  @TestMethod
  public consumesFlatMemberAndCallChainsWithoutRepeatedScans(suffixCount: number): void {
    const content = "value" + ".field()[key]".repeat(suffixCount) + ";";
    const parser = new TypeScriptSyntaxParserProbe(content);

    const result = parser.parse();

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(content.length, result.rootNode.span.endOffset);
    Assert.isTrue(parser.advanceCount <= suffixCount * 8 + 4);
  }

  @TestData("var v = y", " as any", ";", "")
  @TestData("var v = y", " satisfies any", ";", "")
  @TestData("var v = y", " as any satisfies any", ";", "")
  @TestData("var v = a + b", " as any", " * c;", "TS1005")
  @TestData("(y", " as any", ") = 1;", "")
  @TestData("y", "!", "++;", "")
  @TestData("[y", "!", "] = [1];", "")
  @TestData("y", ".a", " = 1;", "")
  @TestData("y?.a", ".a", " = 1;", "TS2779")
  @TestData("y", "[0]", " = 1;", "")
  @TestData("@y", ".a", " class C {}", "")
  @TestData("@y", "()", " class C {}", "TS1497")
  @TestData("@y", "!", " class C {}", "")
  @TestData("declare namespace N { y", ".a", "; }", "TS1036")
  @TestData("declare namespace N { y", " + y", "; }", "TS1036")
  @TestData("declare namespace N { y", " as any", "; }", "TS1036")
  @TestData("declare namespace N { y", "`x`", "; }", "TS1036")
  @TestMethod
  public readsLongChainsInLinearWorkWithoutDeepRecursion(prefix: string, link: string, suffix: string, expected: string): void {
    const content = prefix + link.repeat(50000) + suffix;
    const parser = new TypeScriptSyntaxParserProbe(content);

    const result = parser.parse();

    Assert.areEqual(expected, result.diagnostics.map(t => t.code.displayText).join(","));
    Assert.areEqual(content.length, result.rootNode.span.endOffset);
    Assert.isTrue(parser.advanceCount <= content.length);
  }

  @TestData(16)
  @TestData(64)
  @TestData(128)
  @TestMethod
  public consumesUnaryPrefixesWithoutRepeatedScans(prefixCount: number): void {
    const content = "!".repeat(prefixCount) + "value;";
    const parser = new TypeScriptSyntaxParserProbe(content);

    const result = parser.parse();

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(content.length, result.rootNode.span.endOffset);
    Assert.isTrue(parser.advanceCount <= prefixCount + 2);
  }

  @TestMethod
  public rejectsANonArrowAsyncPrefixWithoutConsumingItsName(): void {
    const parser = TypeScriptParserFixture.create("async value;");
    const node = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;

    Assert.isUndefined(parser.tryParseArrowFunction());
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public keepsInRestrictionsSeparateAcrossParses(): void {
    const parser = TypeScriptParserFixture.create("first in second");
    parser.lookAhead(() => {
      Assert.isInstanceOf(parser.parseExpressionWithoutIn(), TypeScriptIdentifierNode);
      Assert.isInstanceOf(parser.currentNode, TypeScriptInKeywordNode);
      return true;
    });
    Assert.areEqual(TypeScriptContextFlags.None, parser.context.contextFlags);
    parser.lookAhead(() => {
      Assert.isInstanceOf(parser.parseAssignmentExpression(), TypeScriptBinaryExpressionNode);
      return true;
    });

    parser.context.contextFlags = TypeScriptContextFlags.DisallowIn;
    parser.lookAhead(() => {
      Assert.isInstanceOf(parser.parseExpression(), TypeScriptIdentifierNode);
      Assert.isInstanceOf(parser.currentNode, TypeScriptInKeywordNode);
      return true;
    });
    parser.lookAhead(() => {
      Assert.isInstanceOf(parser.parseExpressionAllowingIn(), TypeScriptBinaryExpressionNode);
      return true;
    });
    Assert.isInstanceOf(parser.parseAssignmentExpressionAllowingIn(), TypeScriptBinaryExpressionNode);
    Assert.areEqual(TypeScriptContextFlags.DisallowIn, parser.context.contextFlags);
  }

  @TestData("async function*(){ return ", "; }")
  @TestData("async function*(parameter = ", ") {}")
  @TestData("async () => ", "")
  @TestData("async () => { return ", "; }")
  @TestData("function(): ", " {}")
  @TestMethod
  public restoresFunctionContextWhenTentativeParsingIsInterrupted(prefix: string, suffix: string): void {
    const parser = TypeScriptParserFixture.create(prefix + "(".repeat(800) + "value" + ")".repeat(800) + suffix);
    const node = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;

    Assert.throws(() => parser.lookAhead(() => {
      parser.parseExpression();
      return true;
    }), TypeScriptRecursionLimitException);

    Assert.areEqual(TypeScriptContextFlags.None, parser.context.contextFlags);
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData(false)
  @TestData(true)
  @TestMethod
  public restoresRecursionStateAndTokensAfterAnInterruptedTrial(usesLookahead: boolean): void {
    const parser = TypeScriptParserFixture.create("(".repeat(800) + "value" + ")".repeat(800) + ";");
    const firstNode = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;
    const failure = Assert.throws(() => {
      if (usesLookahead)
        parser.lookAhead(() => {
          parser.parseExpression();
          return true;
        });
      else
        parser.tryParse(() => parser.parseExpression());
    }, TypeScriptRecursionLimitException);

    Assert.areEqual(firstNode, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);

    const span = new SourceSpan(0, 1);
    for (let depth = 0; depth < 512; depth++)
      parser.context.enterRecursion(span);
    for (let depth = 0; depth < 512; depth++)
      parser.context.leaveRecursion();

    const result = parser.parse();
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX2000", result.diagnostics[0]?.code.displayText);
    Assert.isTrue(failure.span.startOffset > 0);
    Assert.areEqual(0, parser.context.getRejectedArrowOffsets(parser.context.contextFlags).size);
    Assert.areEqual(0, parser.context.unclosedTypeArgumentOffsets.size);
  }

  @TestData("(", "value", ")", 300)
  @TestData("[", "value", "]", 150)
  @TestData("!", "value", "", 300)
  @TestData("value = ", "value", "", 300)
  @TestMethod
  public parsesOrdinaryNestingWithoutRetainingDepth(opening: string, value: string, closing: string, depth: number): void {
    const parser = TypeScriptParserFixture.create(opening.repeat(depth) + value + closing.repeat(depth) + ";");
    parser.lookAhead(() => {
      parser.parseExpression();
      return false;
    });
    const result = parser.parse();

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("value", false)
  @TestData(" /* text */ value", false)
  @TestData("/*\ntext */value", true)
  @TestData("// text\nvalue", true)
  @TestData(" \r\nvalue", true)
  @TestData("/*\u2028*/value", true)
  @TestData("#!ctx\nvalue", true)
  @TestData("<<<<<<< branch\nvalue", true)
  @TestData("=======\ntext\n>>>>>>> branch\nvalue", true)
  @TestMethod
  public readsLineBreakFactsWithoutChangingParserState(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;
    const diagnosticCount = parser.context.diagnosticCollector.diagnostics.length;

    Assert.areEqual(expected, parser.hasPrecedingLineBreak());
    Assert.areEqual(expected, parser.hasPrecedingLineBreak());
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(diagnosticCount, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData(10, TypeScriptContextFlags.None)
  @TestData(20, TypeScriptContextFlags.None)
  @TestData(40, TypeScriptContextFlags.None)
  @TestData(80, TypeScriptContextFlags.None)
  @TestData(10, TypeScriptContextFlags.Await)
  @TestData(20, TypeScriptContextFlags.Await)
  @TestData(40, TypeScriptContextFlags.Await)
  @TestData(80, TypeScriptContextFlags.Await)
  @TestData(10, TypeScriptContextFlags.Yield)
  @TestData(20, TypeScriptContextFlags.Yield)
  @TestData(40, TypeScriptContextFlags.Yield)
  @TestData(80, TypeScriptContextFlags.Yield)
  @TestData(10, TypeScriptContextFlags.Await | TypeScriptContextFlags.Yield)
  @TestData(20, TypeScriptContextFlags.Await | TypeScriptContextFlags.Yield)
  @TestData(40, TypeScriptContextFlags.Await | TypeScriptContextFlags.Yield)
  @TestData(80, TypeScriptContextFlags.Await | TypeScriptContextFlags.Yield)
  @TestMethod
  public boundsAlternatingAsyncCallsAndParenthesizedDefaults(depth: number, contextFlags: TypeScriptContextFlags): void {
    const content = "async(value = (other = ".repeat(depth) + "value" + "))".repeat(depth) + ";";
    const parser = new TypeScriptSyntaxParserProbe(content);
    parser.context.contextFlags = contextFlags;
    const result = parser.parse();

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.isTrue(parser.advanceCount <= depth * depth * 10 + depth * 20 + 50);
  }

  @TestData(128)
  @TestData(400)
  @TestData(4000)
  @TestMethod
  public capsAlternatingAsyncCallsAndParenthesizedDefaultsAtTheRecursionLimit(depth: number): void {
    const content = "async(value = (other = ".repeat(depth) + "value" + "))".repeat(depth) + ";";
    const parser = new TypeScriptSyntaxParserProbe(content);
    const result = parser.parse();

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX2000", result.diagnostics[0]?.code.displayText);
    Assert.isTrue(parser.advanceCount <= 160000 + depth * 10);
  }

  @TestData(10)
  @TestData(20)
  @TestData(40)
  @TestData(80)
  @TestMethod
  public boundsNestedAsyncCallDefaults(depth: number): void {
    const parser = new TypeScriptSyntaxParserProbe("async(value = ".repeat(depth) + "value" + ")".repeat(depth) + ";");
    const result = parser.parse();

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.isTrue(parser.advanceCount <= depth * 20 + 30);
  }

  @TestData(10)
  @TestData(20)
  @TestData(40)
  @TestData(80)
  @TestMethod
  public boundsNestedDefaultAssignmentWork(depth: number): void {
    const content = "(value = ".repeat(depth) + "value" + ")".repeat(depth) + ";";
    const parser = new TypeScriptSyntaxParserProbe(content);
    const result = parser.parse();

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.isTrue(parser.advanceCount <= depth * 20 + 30);
  }

  @TestData(10)
  @TestData(20)
  @TestData(40)
  @TestData(80)
  @TestMethod
  public boundsIncompleteNestedDefaultAssignmentWork(depth: number): void {
    const parser = new TypeScriptSyntaxParserProbe("(value = ".repeat(depth) + "value;");
    const result = parser.parse();

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("')' expected.", result.diagnostics[0]?.message.text);
    Assert.areEqual("(value = ".length * depth + "value".length, result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics[0]?.location?.length);
    Assert.isTrue(parser.advanceCount <= depth * 20 + 30);
  }

  @TestData(10, "/[)]/")
  @TestData(20, "/[)]/")
  @TestData(40, "/[)]/")
  @TestData(10, "`value${call()})`")
  @TestData(20, "`value${call()})`")
  @TestData(40, "`value${call()})`")
  @TestMethod
  public boundsNestedContextualInitializersInAnArrow(depth: number, initializer: string): void {
    const parser = new TypeScriptSyntaxParserProbe("(value = ".repeat(depth) + initializer + ")".repeat(depth) + " => value;");
    const result = parser.parse();

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.isTrue(parser.advanceCount <= depth * 20 + 30);
  }

  @TestData(50)
  @TestData(100)
  @TestData(200)
  @TestMethod
  public boundsRecognitionWorkInsideParenthesizedArithmetic(operationCount: number): void {
    const parser = new TypeScriptSyntaxParserProbe("(" + "value + ".repeat(operationCount) + "value);");
    const result = parser.parse();

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.isTrue(parser.advanceCount <= operationCount * 4 + 16);
  }

  @TestData(50)
  @TestData(100)
  @TestData(200)
  @TestMethod
  public boundsRepeatedRejectedArrowsWithContextualInitializers(statementCount: number): void {
    const parser = new TypeScriptSyntaxParserProbe("(value = /[)]/);".repeat(statementCount));
    const result = parser.parse();

    Assert.areEqual(statementCount, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.isTrue(parser.advanceCount <= statementCount * 16);
  }

  @TestData(50)
  @TestData(100)
  @TestData(200)
  @TestMethod
  public boundsRepeatedAcceptedArrowsWithContextualInitializers(statementCount: number): void {
    const parser = new TypeScriptSyntaxParserProbe("(value = `x${call()})`) => value;".repeat(statementCount));
    const result = parser.parse();

    Assert.areEqual(statementCount, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.isTrue(parser.advanceCount <= statementCount * 20);
  }

  @TestMethod
  public retainsRecognitionFactsAcrossRollbackAndClearsThemAtPublication(): void {
    const parser = TypeScriptParserFixture.create("(value); name < other;");
    parser.lookAhead(() => {
      while (!parser.isEndOfFile)
        parser.parseStatement();
      return false;
    });

    Assert.isTrue(parser.context.getSharedRejectedArrowOffsets(parser.context.contextFlags).has(0));
    Assert.areEqual(1, parser.context.unclosedTypeArgumentOffsets.size);
    Assert.isTrue(parser.context.unclosedTypeArgumentOffsets.has(14));
    const result = parser.parse();

    Assert.areEqual(2, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(0, parser.context.getRejectedArrowOffsets(parser.context.contextFlags).size);
    Assert.areEqual(0, parser.context.getSharedRejectedArrowOffsets(parser.context.contextFlags).size);
    Assert.areEqual(0, parser.context.unclosedTypeArgumentOffsets.size);
  }

  @TestData("let 1;", "TS1440@0:3 Variable declaration not allowed at this location.")
  @TestData("let \"a\";", "TS1440@0:3 Variable declaration not allowed at this location.")
  @TestData("let export interface I {}", "TS1440@0:3 Variable declaration not allowed at this location.")
  @TestData("let export;", "TS1440@0:3 Variable declaration not allowed at this location.|TS1128@4:6 Declaration or statement expected.")
  @TestData("let @dec class C {}", "TS1440@0:3 Variable declaration not allowed at this location.")
  @TestData("function f() { let 1; }", "TS1440@15:3 Variable declaration not allowed at this location.")
  @TestData("if (x) let 1;", "TS1440@7:3 Variable declaration not allowed at this location.")
  @TestData("x: let 1;", "TS1440@3:3 Variable declaration not allowed at this location.")
  @TestData("l\\u0065t 1;", "TS1440@0:8 Variable declaration not allowed at this location.")
  @TestData("typ\\u0065 1;", "TS2457@10:1 Type alias name cannot be '1'.")
  @TestData("interf\\u0061ce 1;", "TS2427@15:1 Interface name cannot be '1'.")
  @TestData("interface 0x10 {}", "TS2427@10:4 Interface name cannot be '16'.|TS1005@15:1 ';' expected.")
  @TestData("interface 0x1Fn {}", "TS2427@10:5 Interface name cannot be '0x1fn'.|TS1005@16:1 ';' expected.")
  @TestData("interface \"abc\" {}", "TS2427@10:5 Interface name cannot be 'abc'.|TS1005@16:1 ';' expected.")
  @TestData("type 'a\\x62' = 1;", "TS2457@5:7 Type alias name cannot be 'ab'.")
  @TestData("functi\\u006fnx 1;", "TS1435@0:14 Unknown keyword or identifier. Did you mean 'function'?")
  @TestData("type @d class C {}", "TS2457@5:1 Type alias name cannot be 'type'.")
  @TestData("typ\\u0065 @d class C {}", "TS2457@10:1 Type alias name cannot be 'type'.")
  @TestData("interface )", "TS2427@10:1 Interface name cannot be 'interface'.")
  @TestData("type class C {}", "TS2457@5:5 Type alias name cannot be 'class'.")
  @TestData("type #x;", "TS2457@5:2 Type alias name cannot be '#x'.")
  @TestData("asynd function f() {}", "TS1435@0:5 Unknown keyword or identifier. Did you mean 'async'?")
  @TestData("type 100 = 1;", "TS2457@5:3 Type alias name cannot be '100'.")
  @TestData("module {}", "TS1437@7:1 Namespace must be given a name.")
  @TestData("declare\nx;", "")
  @TestData("is string;", "TS1228@0:3 A type predicate is only allowed in return type position for functions and methods.")
  @TestData("namespace 100 {}", "TS2819@10:3 Namespace name cannot be '100'.|TS1005@14:1 ';' expected.")
  @TestData("foo §;", "TS1127@4:1 Invalid character.")
  @TestMethod
  public reportsTheWordAStatementEndsInByTheNameItSpells(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public readsASingleNameArrowToTheEndOfInput(): void {
    const parser = TypeScriptParserFixture.create("value => value");
    const node = parser.tryParseArrowFunction();

    Assert.isInstanceOf(node, TypeScriptArrowFunctionNode);
    Assert.isUndefined(node.parameterListNode);
    Assert.isInstanceOf(node.parameterNode, TypeScriptParameterNode);
    Assert.isInstanceOf(node.parameterNode.nameNode, TypeScriptIdentifierNode);
    Assert.areEqual("value", node.parameterNode.nameNode.value);
    Assert.isInstanceOf(node.bodyNode, TypeScriptIdentifierNode);
    Assert.areEqual("value", node.bodyNode.value);
    Assert.areEqual(9, node.bodyNode.span.startOffset);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("async <T>(p = call( }", TypeScriptContextFlags.Await)
  @TestData("(value = call( }", TypeScriptContextFlags.None)
  @TestData("async(value = call( }", TypeScriptContextFlags.Await)
  @TestMethod
  public keepsBoundaryDependentArrowRejectionsInTheirScope(content: string, headFlags: TypeScriptContextFlags): void {
    const parser = TypeScriptParserFixture.create(content);
    parser.context.enterList(TypeScriptListKind.BlockStatements);
    parser.tryParse(() => {
      parser.parseAssignmentExpression();
      return undefined;
    });

    Assert.isTrue(parser.context.getRejectedArrowOffsets(headFlags).has(0));
    Assert.isFalse(parser.context.getSharedRejectedArrowOffsets(headFlags).has(0));
    parser.context.leaveList();
    Assert.isFalse(parser.context.getRejectedArrowOffsets(headFlags).has(0));
  }

  @TestData("x.await(a if (b) c);\nexport {};", "TS1005@10:2|TS1005@17:1")
  @TestData("f(x.await, a if (b) c);\nexport {};", "TS1005@13:2|TS1005@20:1")
  @TestData("f(x?.await, a if (b) c);\nexport {};", "TS1005@14:2|TS1005@21:1")
  @TestData("f(x!.await, a if (b) c);\nexport {};", "TS1005@14:2|TS1005@21:1")
  @TestData("f(x as A.await, a if (b) c);\nexport {};", "TS1005@18:2|TS1005@25:1")
  @TestData("let x: A.await = f(a if (b) c);\nexport {};", "TS1005@21:2|TS1005@28:1")
  @TestData("f(new.await, a if (b) c);\nexport {};", "TS1005@15:2|TS1005@22:1")
  @TestData("f(import.await, a if (b) c);\nexport {};", "TS1005@18:2|TS1005@25:1")
  @TestData("f(async () => x.await, a if (b) c);\nexport {};", "TS1005@25:2|TS1005@32:1")
  @TestData("var await = f(a if (b) c);\nexport {};", "TS1005@16:2|TS1434@23:1|TS1128@24:1")
  @TestData("var await, y = f(a if (b) c);\nexport {};", "TS1005@19:2|TS1434@26:1|TS1128@27:1")
  @TestData("for (const await of x) f(a if (b) c);\nexport {};", "TS1005@27:2|TS1434@34:1|TS1128@35:1")
  @TestData("f(function await() {}, a if (b) c);\nexport {};", "TS1005@25:2|TS1434@32:1|TS1128@33:1")
  @TestData("f(([await]) => 1, a if (b) c);\nexport {};", "TS1005@20:2|TS1434@27:1|TS1128@28:1")
  @TestData("try {} catch (await) { f(a if (b) c) }\nexport {};", "TS1005@27:2|TS1434@34:1|TS1128@35:1")
  @TestData("f({ await: 1 }, a if (b) c);\nexport {};", "TS1005@18:2|TS1434@25:1|TS1128@26:1")
  @TestData("f({ await }, a if (b) c);\nexport {};", "TS1005@15:2|TS1434@22:1|TS1128@23:1")
  @TestData("f(x.#await, a if (b) c);\nexport {};", "TS1005@14:2|TS1434@21:1|TS1128@22:1")
  @TestMethod
  public readsAgainOnlyAStatementThatUsesAwaitAsAName(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("identifier")
  @TestData("42")
  @TestData("1n")
  @TestData("\"text\"")
  @TestData("`text`")
  @TestData("/value/gu")
  @TestData("false")
  @TestData("null")
  @TestData("super.value")
  @TestData("this")
  @TestData("true")
  @TestData("undefined")
  @TestMethod
  public parsesAPrimaryExpressionAsAStatement(content: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExpressionStatementNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public reportsAMissingPrefixOperand(): void {
    const result = TypeScriptParser.parse("+");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptPrefixUnaryExpressionNode);
    Assert.areEqual("TS1109@1:0", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("break", "TS1109@0:5")
  @TestData("const", "TS1109@0:5")
  @TestData("else", "TS1109@0:4")
  @TestData("if", "TS1109@0:2")
  @TestData("return", "TS1109@0:6")
  @TestData("while", "TS1109@0:5")
  @TestMethod
  public reportsAKeywordThatStartsNoPrimaryExpression(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);

    parser.parsePrimaryExpression();

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public reportsAnExpectedTokenAtTheCurrentToken(): void {
    const parser = TypeScriptParserFixture.create("value }");
    parser.advance();

    parser.reportExpected(";");

    Assert.areEqual("TS1005@6:1 ';' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }
}
