/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as api from "@noldova/context.parsers";
import {
  CommentNode,
  CompositeNode,
  EndOfFileNode,
  InvalidOffsetException,
  InvalidSpanException,
  LineOutOfBoundsException,
  LiteralNode,
  Node,
  Parser,
  ParserContext,
  ParserException,
  ParserResult,
  ValueNode,
  WhitespaceNode
} from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ParsersApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    const exportNames = [
      "CommentNode", "CompositeNode", "DiagnosticCollector", "EndOfFileNode", "InvalidOffsetException",
      "InvalidSpanException", "Lexer", "LineOutOfBoundsException", "SourcePosition", "LiteralNode", "SourceSpan",
      "Node", "Parser", "ParserContext", "ParserException", "ParserResult", "Source",
      "SourceLine", "SourceLineMap", "SourceReader", "ValueNode", "WhitespaceNode",
    ];

    Assert.areEqual(exportNames.sort().join(","), Object.keys(api).sort().join(","));
  }

  @TestMethod
  public exposesThePackageExceptionHierarchy(): void {
    Assert.isInstanceOf(InvalidOffsetException.prototype, ParserException);
    Assert.isInstanceOf(InvalidSpanException.prototype, ParserException);
    Assert.isInstanceOf(LineOutOfBoundsException.prototype, ParserException);
  }

  @TestMethod
  public exportsTheNodeAndParserHierarchy(): void {
    Assert.isInstanceOf(CommentNode.prototype, ValueNode);
    Assert.isInstanceOf(CompositeNode.prototype, Node);
    Assert.isInstanceOf(EndOfFileNode.prototype, Node);
    Assert.isInstanceOf(LiteralNode.prototype, ValueNode);
    Assert.isInstanceOf(WhitespaceNode.prototype, ValueNode);
    Assert.isInstanceOf(ParserContext.prototype, Object);
    Assert.isInstanceOf(Parser.prototype, Object);
    Assert.isInstanceOf(ParserResult.prototype, Object);
  }
}
