/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import "../../extensions/diagnostic-collector.extensions.js";
import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptNonTextFileMarkerNode } from "../../models/nodes/typescript-non-text-file-marker.node.js";
import { TypeScriptUnknownNode } from "../../models/nodes/typescript-unknown.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class InvalidCharacterLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): TypeScriptUnknownNode {
    const reader = lexer.reader;
    if (reader.startsWith(Resources.replacementCharacter))
      return this.lexNonTextFile(lexer, leadingTrivia);

    const startOffset = reader.currentOffset;
    const isMisplacedShebang = reader.startsWith(Resources.shebang);

    reader.readCodePoint();

    const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
    if (isMisplacedShebang) {
      const diagnosticSpan = reader.createSpan(startOffset, Resources.shebang.length);
      lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS18026, diagnosticSpan);
    }
    else
      lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1127, span);

    return new TypeScriptUnknownNode(reader.source.getText(span), span, leadingTrivia);
  }

  private lexNonTextFile(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): TypeScriptNonTextFileMarkerNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;

    reader.seek(reader.endOffset);
    lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1490, reader.createSpan(0, 0));

    const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);

    return new TypeScriptNonTextFileMarkerNode(reader.source.getText(span), span, leadingTrivia);
  }
}
