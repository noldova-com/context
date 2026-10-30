/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { Resources } from "../../resources.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";

export class RegexClassSetCharacterValidator {
  public validate(regexParser: RegexSyntaxParser, node: Node): void {
    const value = regexParser.context.source.getText(node.span);
    const diagnosedOffsets = regexParser.context.diagnosedReservedPunctuatorOffsets;
    if (diagnosedOffsets.has(node.span.startOffset))
      return;

    if (value.length === 1 && Resources.classSetReservedDoublePunctuators.includes(value)) {
      const nextOffset = node.span.endOffset;
      if (nextOffset < regexParser.regexLexer.reader.endOffset && regexParser.context.source.content.charAt(nextOffset) === value) {
        const span = regexParser.regexLexer.reader.createSpan(node.span.startOffset, value.length * 2);
        regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1029, span, [value + value]);
        diagnosedOffsets.add(node.span.startOffset);
        diagnosedOffsets.add(nextOffset);
        return;
      }
    }

    if (value.length === 1 && Resources.classSetSyntaxCharacters.includes(value))
      regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1034, node.span, [value]);
  }
}
