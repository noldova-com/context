/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { StringBuilder } from "@noldova/context.text";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { RegexUnicodeEscapeNode } from "../../models/nodes/escapes/regex-unicode-escape.node.js";
import { RegexNamedCapturingGroupNode } from "../../models/nodes/groups/regex-named-capturing-group.node.js";
import { RegexGreaterThanNode } from "../../models/nodes/punctuators/regex-greater-than.node.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";
import { RegexGroupNameValidator } from "../validators/regex-group-name.validator.js";
import type { RegexGroupEndParser } from "./regex-group-end.parser.js";

export class RegexNamedCapturingGroupParser {
  private readonly groupEndParser: RegexGroupEndParser;
  private readonly groupNameValidator: RegexGroupNameValidator = new RegexGroupNameValidator();
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser, groupEndParser: RegexGroupEndParser) {
    this.regexParser = regexParser;
    this.groupEndParser = groupEndParser;
  }

  public parse(startOffset: number): RegexNamedCapturingGroupNode {
    const groupIndex = this.regexParser.context.claimCapturingGroupIndex();
    const groupNameBuilder = new StringBuilder();
    let isValidName = true;

    this.regexParser.regexLexer.enterGroupName();
    this.regexParser.advance();
    const nameStartOffset = this.regexParser.currentNode.span.startOffset;
    try {
      while (!this.regexParser.isEndOfFile && !(this.regexParser.currentNode instanceof RegexGreaterThanNode)) {
        const node = this.regexParser.currentNode;
        const value = node instanceof RegexUnicodeEscapeNode
          ? String.fromCodePoint(node.codePoint)
          : this.regexParser.context.source.getText(node.span);
        const codePoint = value.codePointAt(0)!;
        if (!this.groupNameValidator.isValidCodePoint(codePoint, groupNameBuilder.length === 0))
          isValidName = false;
        groupNameBuilder.append(value);

        this.regexParser.advance();
      }
    }
    finally {
      this.regexParser.regexLexer.leaveGroupName();
    }

    const groupName = groupNameBuilder.toString();
    const nameEndOffset = this.regexParser.currentNode.span.startOffset;
    const nameSpan = this.regexParser.regexLexer.reader.createSpan(nameStartOffset, nameEndOffset - nameStartOffset);
    if (!isValidName || groupNameBuilder.length === 0)
      this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1023, nameSpan);
    else
      this.regexParser.context.registerNamedCapturingGroup(groupName, nameSpan);

    this.regexParser.tryConsume(RegexGreaterThanNode);
    const disjunctionNode = this.regexParser.parseDisjunction(true);
    const endOffset = this.groupEndParser.parse();
    const span = this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset);

    return new RegexNamedCapturingGroupNode(groupIndex, groupName, disjunctionNode, span);
  }
}
