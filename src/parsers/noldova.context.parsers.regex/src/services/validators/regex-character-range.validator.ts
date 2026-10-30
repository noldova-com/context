/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";

export class RegexCharacterRangeValidator {
  public validate(regexParser: RegexSyntaxParser, start: Node, end: Node, span: SourceSpan): void {
    const startValue = start.getRegexCharacterValue();
    const endValue = end.getRegexCharacterValue();

    if (Object.isUndefined(startValue) || Object.isUndefined(endValue)) {
      if (regexParser.regexLexer.unicodeMode)
        regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1025, span);
      return;
    }

    if (startValue > endValue)
      regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1026, span);
  }
}
