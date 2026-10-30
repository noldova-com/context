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
import { RegexUnicodePropertyEscapeNode } from "../../models/nodes/escapes/regex-unicode-property-escape.node.js";
import { RegexUnknownNode } from "../../models/nodes/regex-unknown.node.js";
import { Resources } from "../../resources.js";
import { RegexUnicodePropertyCatalog } from "../unicode/regex-unicode-property-catalog.js";
import type { RegexLexer } from "./regex.lexer.js";

export class UnicodePropertyEscapeLexer {
  public lex(lexer: RegexLexer, startOffset: number, negated: boolean): Node {
    if (lexer.reader.peekCodeUnit() !== Resources.openBrace)
      return this.createUnknown(lexer, startOffset);

    lexer.reader.advance();
    const expressionStartOffset = lexer.reader.currentOffset;
    lexer.reader.readUntil(t => t === Resources.closeBrace);
    if (lexer.reader.peekCodeUnit() !== Resources.closeBrace)
      return this.createUnknown(lexer, startOffset);

    const expression = lexer.reader.source.getText(expressionStartOffset, lexer.reader.currentOffset - expressionStartOffset);
    lexer.reader.advance();
    if (expression.length === 0)
      return this.createUnknown(lexer, startOffset);

    const separatorIndex = expression.indexOf(Resources.equals);
    const propertyName = separatorIndex < 0 ? undefined : expression.substring(0, separatorIndex);
    const propertyValue = separatorIndex < 0 ? expression : expression.substring(separatorIndex + Resources.equals.length);
    const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
    let mayContainStrings = false;

    if (Object.isUndefined(propertyName)) {
      if (!RegexUnicodePropertyCatalog.isValidLoneProperty(propertyValue))
        lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1020, span, [propertyValue]);
      else if (RegexUnicodePropertyCatalog.isStringProperty(propertyValue)) {
        if (!lexer.unicodeSetsMode)
          lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1021, span, [propertyValue]);
        else if (negated)
          lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1022, span);
        else
          mayContainStrings = true;
      }
    }
    else {
      const canonicalName = RegexUnicodePropertyCatalog.getCanonicalPropertyName(propertyName);
      if (Object.isUndefined(canonicalName))
        lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1019, span, [propertyName]);
      else if (!RegexUnicodePropertyCatalog.isPropertyValue(canonicalName, propertyValue))
        lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1020, span, [propertyValue]);
    }

    return new RegexUnicodePropertyEscapeNode(lexer.reader.source.getText(span), propertyName, propertyValue, negated, mayContainStrings, span);
  }

  private createUnknown(lexer: RegexLexer, startOffset: number): RegexUnknownNode {
    const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
    lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1018, span);
    return new RegexUnknownNode(lexer.reader.source.getText(span), span);
  }
}
