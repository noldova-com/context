/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { SourceSpan } from "@noldova/context.parsers";
import { StringBuilder } from "@noldova/context.text";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { RegexModifierGroupNode } from "../../models/nodes/groups/regex-modifier-group.node.js";
import { RegexColonNode } from "../../models/nodes/punctuators/regex-colon.node.js";
import { RegexHyphenNode } from "../../models/nodes/punctuators/regex-hyphen.node.js";
import { RegexCharacterNode } from "../../models/nodes/regex-character.node.js";
import { Resources } from "../../resources.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";
import type { RegexGroupEndParser } from "./regex-group-end.parser.js";

export class RegexModifierGroupParser {
  private readonly groupEndParser: RegexGroupEndParser;
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser, groupEndParser: RegexGroupEndParser) {
    this.regexParser = regexParser;
    this.groupEndParser = groupEndParser;
  }

  public parse(startOffset: number): RegexModifierGroupNode {
    const prefixStartOffset = this.regexParser.currentNode.span.startOffset;
    const enabledModifiers = this.readModifiers();
    let disabledModifiers = String.empty;
    let hasMinus = false;

    if (this.regexParser.currentNode instanceof RegexHyphenNode) {
      hasMinus = true;
      this.regexParser.advance();
      disabledModifiers = this.readModifiers();
    }

    if (hasMinus && enabledModifiers.length === 0 && disabledModifiers.length === 0)
      this.regexParser.context.diagnosticCollector.add(
        RegexDiagnosticTemplates.CTX1006,
        this.createSpan(prefixStartOffset, this.regexParser.currentNode.span.startOffset));

    this.validateModifiers(enabledModifiers, disabledModifiers, prefixStartOffset);
    if (Object.isUndefined(this.regexParser.tryConsume(RegexColonNode)))
      this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1010, this.regexParser.currentNode.span);

    const disjunctionNode = this.regexParser.parseDisjunction(true);
    const endOffset = this.groupEndParser.parse();
    return new RegexModifierGroupNode(enabledModifiers, disabledModifiers, disjunctionNode, this.createSpan(startOffset, endOffset));
  }

  private createSpan(startOffset: number, endOffset: number): SourceSpan {
    return this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset);
  }

  private readModifiers(): string {
    const modifiers = new StringBuilder();
    let node = this.regexParser.currentNode;

    while (node instanceof RegexCharacterNode) {
      if (Resources.modifierCharacters.includes(node.value))
        modifiers.append(node.value);
      else
        this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1007, node.span);

      this.regexParser.advance();
      node = this.regexParser.currentNode;
    }

    return modifiers.toString();
  }

  private validateModifiers(enabledModifiers: string, disabledModifiers: string, startOffset: number): void {
    const seenEnabled = new Set<string>();
    const seenDisabled = new Set<string>();
    const span = this.createSpan(startOffset, this.regexParser.currentNode.span.startOffset);

    for (const modifier of enabledModifiers) {
      if (seenEnabled.has(modifier))
        this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1008, span, [modifier]);
      else
        seenEnabled.add(modifier);
    }

    for (const modifier of disabledModifiers) {
      if (seenDisabled.has(modifier))
        this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1008, span, [modifier]);
      else
        seenDisabled.add(modifier);

      if (seenEnabled.has(modifier))
        this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1009, span, [modifier]);
    }
  }
}
