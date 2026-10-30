/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { Node } from "@noldova/context.parsers";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { RegexIdentityEscapeNode } from "../../models/nodes/escapes/regex-identity-escape.node.js";
import { RegexNamedBackreferenceNode } from "../../models/nodes/escapes/regex-named-backreference.node.js";
import { RegexUnknownNode } from "../../models/nodes/regex-unknown.node.js";
import { Resources } from "../../resources.js";
import { RegexGroupNameReader } from "../readers/regex-group-name.reader.js";
import { RegexIdentityEscapeValidator } from "../validators/regex-identity-escape.validator.js";
import type { RegexLexer } from "./regex.lexer.js";

export class NamedBackreferenceLexer {
  private readonly groupNameReader: RegexGroupNameReader = new RegexGroupNameReader();
  private readonly identityEscapeValidator: RegexIdentityEscapeValidator = new RegexIdentityEscapeValidator();

  public lex(lexer: RegexLexer, startOffset: number, codePoint: number): Node {
    if (lexer.isInCharacterClass || !lexer.hasNamedCapturingGroups || lexer.reader.peekCodeUnit() !== Resources.lessThan)
      return this.createFallback(lexer, startOffset, codePoint);

    lexer.reader.advance();
    const groupName = this.groupNameReader.read(lexer.reader);
    if (Object.isUndefined(groupName))
      return this.createUnknown(lexer, startOffset);

    const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
    if (!groupName.isValid) {
      lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1032, span);
      return new RegexNamedBackreferenceNode(lexer.reader.source.getText(span), groupName.value, span);
    }

    if (!lexer.hasNamedCapturingGroup(groupName.value))
      lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1016, span, [groupName.value]);

    return new RegexNamedBackreferenceNode(lexer.reader.source.getText(span), groupName.value, span);
  }

  private createFallback(lexer: RegexLexer, startOffset: number, codePoint: number): Node {
    const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
    if (this.identityEscapeValidator.isValid(lexer, Resources.namedBackreferenceEscapeCharacter))
      return new RegexIdentityEscapeNode(lexer.reader.source.getText(span), codePoint, span);

    lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1014, span);
    return new RegexUnknownNode(lexer.reader.source.getText(span), span);
  }

  private createUnknown(lexer: RegexLexer, startOffset: number): RegexUnknownNode {
    const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
    lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1015, span);
    return new RegexUnknownNode(lexer.reader.source.getText(span), span);
  }
}
