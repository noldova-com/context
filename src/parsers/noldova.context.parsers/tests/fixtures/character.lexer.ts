/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticTemplate } from "@noldova/context.diagnostics";
import { type DiagnosticCollector, EndOfFileNode, Lexer, type Node, type Source, type SourceReader } from "@noldova/context.parsers";

import { LiteralNodeFixture } from "./literal-node.fixture.js";

export class CharacterLexer extends Lexer {
  private static readonly DIAGNOSTIC_TEMPLATE: DiagnosticTemplate = new DiagnosticTemplate(
    new DiagnosticCode(DiagnosticAuthority.context, 1), DiagnosticCategory.Error, "Character diagnostic.");

  private readonly addDiagnostics: boolean;

  public lexCount: number = 0;

  public constructor(sourceOrReader: Source | SourceReader, diagnosticCollector: DiagnosticCollector, addDiagnostics: boolean = false) {
    super(sourceOrReader, diagnosticCollector);
    this.addDiagnostics = addDiagnostics;
  }

  public reLex(action: () => Node): Node {
    return this.lexWith(action);
  }

  protected override lexNode(): Node {
    this.lexCount++;
    const startOffset = this.reader.currentOffset;
    const character = this.reader.readCodeUnit();
    const span = this.reader.createSpan(startOffset, this.reader.currentOffset - startOffset);
    if (this.addDiagnostics)
      this.diagnosticCollector.add(CharacterLexer.DIAGNOSTIC_TEMPLATE, span);

    return span.isEmpty ? new EndOfFileNode(span) : new LiteralNodeFixture(character, span);
  }
}
