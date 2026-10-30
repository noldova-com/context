/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source } from "@noldova/context.parsers";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { TypeScriptParserContext } from "@noldova/context.parsers.typescript/models/typescript-parser-context.js";
import { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";
import { TypeScriptSyntaxParser } from "@noldova/context.parsers.typescript/services/typescript-syntax.parser.js";

export class TypeScriptParserFixture {
  public static create(content: string, contextFlags: TypeScriptContextFlags = TypeScriptContextFlags.None): TypeScriptSyntaxParser {
    const source = new Source(content, "source.ts");
    const context = new TypeScriptParserContext(source);
    context.contextFlags = contextFlags;
    return new TypeScriptSyntaxParser(context, new TypeScriptLexer(source, context.diagnosticCollector, context.records.commentDirectiveOffsets));
  }
}
