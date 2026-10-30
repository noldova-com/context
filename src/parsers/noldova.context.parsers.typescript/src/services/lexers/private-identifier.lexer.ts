/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { Node } from "@noldova/context.parsers";

import "../../extensions/diagnostic-collector.extensions.js";
import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptPrivateIdentifierNode } from "../../models/nodes/identifiers/typescript-private-identifier.node.js";
import { Resources } from "../../resources.js";
import { InvalidCharacterLexer } from "./invalid-character.lexer.js";
import { TypeScriptIdentifierValueReader } from "./readers/typescript-identifier-value.reader.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class PrivateIdentifierLexer {
  private readonly identifierValueReader: TypeScriptIdentifierValueReader = new TypeScriptIdentifierValueReader();
  private readonly invalidCharacterLexer: InvalidCharacterLexer = new InvalidCharacterLexer();

  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): Node {
    const reader = lexer.reader;
    if (reader.startsWith(Resources.shebang))
      return this.invalidCharacterLexer.lex(lexer, leadingTrivia);

    const startOffset = reader.currentOffset;
    reader.advance(Resources.hash.length);

    const identifier = this.identifierValueReader.read(reader);
    if (Object.isUndefined(identifier)) {
      const span = reader.createSpan(startOffset, Resources.hash.length);
      lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1127, span);
      return new TypeScriptPrivateIdentifierNode(Resources.hash, span, leadingTrivia);
    }

    const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
    return new TypeScriptPrivateIdentifierNode(Resources.hash + identifier, span, leadingTrivia);
  }
}
