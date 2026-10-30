/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "./assertions/regex-end-assertion.node.extensions.js";
import "./assertions/regex-non-word-boundary-assertion.node.extensions.js";
import "./assertions/regex-start-assertion.node.extensions.js";
import "./assertions/regex-word-boundary-assertion.node.extensions.js";
import "./classes/regex-character-class.node.extensions.js";
import "./classes/regex-class-intersection.node.extensions.js";
import "./classes/regex-class-string-disjunction.node.extensions.js";
import "./classes/regex-class-subtraction.node.extensions.js";
import "./classes/regex-class-union.node.extensions.js";
import "./escapes/regex-backspace-escape.node.extensions.js";
import "./escapes/regex-carriage-return-escape.node.extensions.js";
import "./escapes/regex-class-control-escape.node.extensions.js";
import "./escapes/regex-control-letter-escape.node.extensions.js";
import "./escapes/regex-form-feed-escape.node.extensions.js";
import "./escapes/regex-hex-escape.node.extensions.js";
import "./escapes/regex-identity-escape.node.extensions.js";
import "./escapes/regex-legacy-octal-escape.node.extensions.js";
import "./escapes/regex-newline-escape.node.extensions.js";
import "./escapes/regex-null-escape.node.extensions.js";
import "./escapes/regex-tab-escape.node.extensions.js";
import "./escapes/regex-unicode-escape.node.extensions.js";
import "./escapes/regex-unicode-property-escape.node.extensions.js";
import "./escapes/regex-vertical-tab-escape.node.extensions.js";
import "./punctuators/regex-ampersand-ampersand.node.extensions.js";
import "./punctuators/regex-asterisk.node.extensions.js";
import "./punctuators/regex-bar.node.extensions.js";
import "./punctuators/regex-close-brace.node.extensions.js";
import "./punctuators/regex-close-bracket.node.extensions.js";
import "./punctuators/regex-close-parenthesis.node.extensions.js";
import "./punctuators/regex-colon.node.extensions.js";
import "./punctuators/regex-comma.node.extensions.js";
import "./punctuators/regex-equals.node.extensions.js";
import "./punctuators/regex-exclamation.node.extensions.js";
import "./punctuators/regex-greater-than.node.extensions.js";
import "./punctuators/regex-hyphen-hyphen.node.extensions.js";
import "./punctuators/regex-hyphen.node.extensions.js";
import "./punctuators/regex-less-than.node.extensions.js";
import "./punctuators/regex-open-brace.node.extensions.js";
import "./punctuators/regex-open-bracket.node.extensions.js";
import "./punctuators/regex-open-parenthesis.node.extensions.js";
import "./punctuators/regex-plus.node.extensions.js";
import "./punctuators/regex-question.node.extensions.js";
import "./regex-character.node.extensions.js";

import { Node, type SourceSpan } from "@noldova/context.parsers";

import { RegexClassUnionNode } from "../../models/nodes/classes/regex-class-union.node.js";
import type { RegexSyntaxParser } from "../../services/regex-syntax.parser.js";

declare module "@noldova/context.parsers" {
  interface Node {
    getRegexCharacterValue(): number | undefined;
    getRegexQuantifierMinimum(): bigint | undefined;
    getRegexQuantifierMaximum(): bigint | undefined;
    isSimpleRegexAssertion(): boolean;
    isRegexClassSetOperator(): boolean;
    mayContainRegexStrings(): boolean;
    createRegexClassSetExpression(operands: readonly Node[], span: SourceSpan): Node;
    parseRegexAtom(parser: RegexSyntaxParser): Node | undefined;
  }
}

Node.prototype.getRegexCharacterValue = function (this: Node): number | undefined {
  return undefined;
};

Node.prototype.getRegexQuantifierMinimum = function (this: Node): bigint | undefined {
  return undefined;
};

Node.prototype.getRegexQuantifierMaximum = function (this: Node): bigint | undefined {
  return undefined;
};

Node.prototype.isSimpleRegexAssertion = function (this: Node): boolean {
  return false;
};

Node.prototype.isRegexClassSetOperator = function (this: Node): boolean {
  return false;
};

Node.prototype.mayContainRegexStrings = function (this: Node): boolean {
  return false;
};

Node.prototype.createRegexClassSetExpression = function (this: Node, operands: readonly Node[], span: SourceSpan): RegexClassUnionNode {
  return new RegexClassUnionNode(operands, span);
};

Node.prototype.parseRegexAtom = function (this: Node, parser: RegexSyntaxParser): Node {
  parser.advance();
  return this;
};
