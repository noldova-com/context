/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Diagnostic, DiagnosticAuthority } from "@noldova/context.diagnostics";
import { ParserResult, Source, SourceLineMap, SourceReader } from "@noldova/context.parsers";
import { EcmaScriptLineTerminator } from "@noldova/context.text";

import { TypeScriptSourceKind } from "../enums/typescript-source-kind.js";
import { TypeScriptParserDiagnosticTemplates } from "../models/diagnostics/typescript-parser-diagnostic-templates.js";
import type { TypeScriptNode } from "../models/nodes/typescript.node.js";
import { TypeScriptBinderDiagnostic } from "../models/typescript-binder-diagnostic.js";
import { TypeScriptGrammarDiagnostic } from "../models/typescript-grammar-diagnostic.js";
import { TypeScriptParserContext } from "../models/typescript-parser-context.js";
import { TypeScriptRegionSet } from "../models/typescript-region-set.js";
import { Resources } from "../resources.js";
import { TypeScriptLexer } from "./lexers/typescript.lexer.js";
import { TypeScriptSyntaxParser } from "./typescript-syntax.parser.js";

export class TypeScriptParser {
  private readonly syntaxParser: TypeScriptSyntaxParser;

  public static parse(content: string, identity?: string, sourceKind: TypeScriptSourceKind = TypeScriptSourceKind.Code): ParserResult<TypeScriptNode> {
    return new TypeScriptParser(content, identity, sourceKind).parse();
  }

  public constructor(content: string, identity?: string, sourceKind?: TypeScriptSourceKind);
  public constructor(source: Source, sourceKind?: TypeScriptSourceKind);
  public constructor(reader: SourceReader, sourceKind?: TypeScriptSourceKind);
  public constructor(input: string | Source | SourceReader, identityOrSourceKind?: string, sourceKind: TypeScriptSourceKind = TypeScriptSourceKind.Code) {
    const isDeclaration = (Object.isString(input) ? sourceKind : identityOrSourceKind) === TypeScriptSourceKind.Declaration;
    const reader = input instanceof SourceReader
      ? input
      : new SourceReader(Object.isString(input) ? new Source(input, identityOrSourceKind) : input);
    const context = new TypeScriptParserContext(reader.source, isDeclaration);
    this.syntaxParser = new TypeScriptSyntaxParser(context, new TypeScriptLexer(reader, context.diagnosticCollector, context.records.commentDirectiveOffsets));
  }

  public parse(): ParserResult<TypeScriptNode> {
    const result = this.syntaxParser.parse();
    if (result.diagnostics.length === 0)
      return result;
    const syntaxDiagnostics: Diagnostic[] = [];
    const grammarDiagnostics: TypeScriptGrammarDiagnostic[] = [];
    for (const diagnostic of result.diagnostics)
      if (diagnostic instanceof TypeScriptGrammarDiagnostic)
        grammarDiagnostics.push(diagnostic);
      else
        syntaxDiagnostics.push(diagnostic);

    const isGrammarRead = !this.syntaxParser.context.hasNoCheckDirective && !syntaxDiagnostics.some(
      t => t.code.authority === DiagnosticAuthority.typeScript || t.code === TypeScriptParserDiagnosticTemplates.CTX2000.code);
    return new ParserResult(result.rootNode, [...TypeScriptParser.publish(syntaxDiagnostics),
      ...(isGrammarRead ? TypeScriptParser.publish(this.withoutDirected(this.withoutUncheckedRegions(grammarDiagnostics))) : [])]);
  }

  private withoutUncheckedRegions(diagnostics: readonly TypeScriptGrammarDiagnostic[]): Diagnostic[] {
    const regions = new TypeScriptRegionSet(this.syntaxParser.context.records.uncheckedSpans);
    if (regions.isEmpty)
      return diagnostics.map(t => t.diagnostic);

    return diagnostics.filter(t => t instanceof TypeScriptBinderDiagnostic || !regions.contains(t.location!.start)).map(t => t.diagnostic);
  }

  private withoutDirected(diagnostics: Diagnostic[]): Diagnostic[] {
    const directiveOffsets = this.syntaxParser.context.records.commentDirectiveOffsets;
    if (directiveOffsets.length === 0)
      return diagnostics;

    const lineMap = new SourceLineMap(this.syntaxParser.context.source, new EcmaScriptLineTerminator());
    const directiveLines = new Set(directiveOffsets.map(t => lineMap.getPosition(t).lineIndex));
    return diagnostics.filter(t => {
      for (let line = lineMap.getPosition(t.location!.start).lineIndex - 1; line >= 0; line--) {
        if (directiveLines.has(line))
          return false;
        if (!TypeScriptParser.isCommentOrBlankLine(lineMap.getLineText(line)))
          return true;
      }
      return true;
    });
  }

  private static isCommentOrBlankLine(text: string): boolean {
    let index = 0;
    while (index < text.length && (text[index] === Resources.space || text[index] === Resources.tab))
      index++;
    return index === text.length || text.startsWith(Resources.slashSlash, index);
  }

  private static publish(diagnostics: Diagnostic[]): readonly Diagnostic[] {
    diagnostics.sort(TypeScriptParser.compare);
    return diagnostics.filter((diagnostic, index) => index === 0 || TypeScriptParser.compare(diagnostics[index - 1]!, diagnostic) !== 0);
  }

  private static compare(first: Diagnostic, second: Diagnostic): number {
    const firstText = first.message.text;
    const secondText = second.message.text;
    return first.location!.start - second.location!.start || first.location!.length - second.location!.length
      || first.code.value - second.code.value || (firstText < secondText ? -1 : firstText > secondText ? 1 : 0);
  }
}
