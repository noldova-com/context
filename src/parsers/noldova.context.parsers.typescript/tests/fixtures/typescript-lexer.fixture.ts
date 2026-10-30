/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticCollector, type NodeType, Source, SourceReader, ValueNode } from "@noldova/context.parsers";
import { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";
import { Assert } from "@noldova/context.testing";

export class TypeScriptLexerFixture {
  public static create(sourceOrReader: Source | SourceReader): TypeScriptLexer {
    const source = sourceOrReader instanceof SourceReader ? sourceOrReader.source : sourceOrReader;

    return new TypeScriptLexer(sourceOrReader, new DiagnosticCollector(source), []);
  }

  public static assertLexes(value: string, nodeType: Function & NodeType): void {
    const lexer = TypeScriptLexerFixture.create(new Source(` ${value}remaining`, "source.ts"));
    const result = lexer.lex();

    Assert.isInstanceOf(result, ValueNode);
    Assert.isInstanceOf(result, nodeType);
    Assert.areEqual(value, result.value);
    Assert.areEqual(1, result.span.startOffset);
    Assert.areEqual(value.length, result.span.length);
    Assert.areEqual(value.length + 1, lexer.reader.currentOffset);
    Assert.isDefined(result.leadingTrivia);
  }
}
