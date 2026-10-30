/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { Resources } from "../../resources.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";

export class RegexFlagValidator {
  public validate(regexParser: RegexSyntaxParser): void {
    const flags = regexParser.regexLexer.flagsNode.value;
    const seen = new Set<string>();
    let hasUnicodeMode = false;
    let offset = regexParser.regexLexer.flagsNode.span.startOffset;

    for (const flag of flags) {
      const span = new SourceSpan(offset, flag.length);
      if (!Resources.flagCharacters.includes(flag))
        regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1000, span, [flag]);
      else if (seen.has(flag))
        regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1001, span, [flag]);
      else {
        seen.add(flag);

        if (flag === Resources.unicodeFlag || flag === Resources.unicodeSetsFlag) {
          if (hasUnicodeMode)
            regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1002, span);
          else
            hasUnicodeMode = true;
        }
      }

      offset += flag.length;
    }
  }
}
