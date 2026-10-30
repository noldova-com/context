/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CompositeNode, Node, ParserResult, Source, SourceReader, SourceSpan, ValueNode } from "@noldova/context.parsers";

/**
 * The end assertion represented by `$`.
 */
export declare class RegexEndAssertionNode extends ValueNode {
  /**
   * Creates the end assertion at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the assertion.
   *
   * @see {@link RegexStartAssertionNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * A positive or negative lookahead assertion.
 *
 * @example Lookarounds have a disjunction and polarity, but allocate no capture index themselves.
 * ```ts
 * import { RegexLookaheadAssertionNode, RegexLookbehindAssertionNode, RegexParser } from "@noldova/context.parsers.regex";
 *
 * const nodes = new RegexParser("(?=a)(?<!b)").parse().rootNode.patternNode.disjunctionNode.children[0].children;
 * const ahead = nodes[0];
 * const behind = nodes[1];
 * console.assert(ahead instanceof RegexLookaheadAssertionNode && !ahead.negated);
 * console.assert(behind instanceof RegexLookbehindAssertionNode && behind.negated);
 * ```
 */
export declare class RegexLookaheadAssertionNode extends Node {
  /**
   * The disjunction tested without consuming input.
   */
  public readonly disjunctionNode: RegexDisjunctionNode;

  /**
   * Whether the assertion succeeds when its disjunction does not match.
   */
  public readonly negated: boolean;

  /**
   * Creates a lookahead assertion from its disjunction and polarity.
   *
   * @param disjunctionNode The disjunction tested by the assertion.
   * @param negated Whether the assertion is negative.
   * @param span The absolute UTF-16 source span of the assertion.
   *
   * @see {@link RegexLookaheadAssertionNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(disjunctionNode: RegexDisjunctionNode, negated: boolean, span: SourceSpan);
}

/**
 * A positive or negative lookbehind assertion.
 */
export declare class RegexLookbehindAssertionNode extends Node {
  /**
   * The disjunction tested behind the current input position.
   */
  public readonly disjunctionNode: RegexDisjunctionNode;

  /**
   * Whether the assertion succeeds when its disjunction does not match.
   */
  public readonly negated: boolean;

  /**
   * Creates a lookbehind assertion from its disjunction and polarity.
   *
   * @param disjunctionNode The disjunction tested by the assertion.
   * @param negated Whether the assertion is negative.
   * @param span The absolute UTF-16 source span of the assertion.
   *
   * @see {@link RegexLookaheadAssertionNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(disjunctionNode: RegexDisjunctionNode, negated: boolean, span: SourceSpan);
}

/**
 * The non-word-boundary assertion represented by `\B`.
 */
export declare class RegexNonWordBoundaryAssertionNode extends ValueNode {
  /**
   * Creates the non-word-boundary assertion at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the assertion.
   *
   * @see {@link RegexStartAssertionNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The start assertion represented by `^`.
 *
 * @example The same escape has assertion semantics outside a class and character semantics inside it.
 * ```ts
 * import {
 *   RegexBackspaceEscapeNode, RegexCharacterClassNode, RegexClassUnionNode, RegexEndAssertionNode,
 *   RegexParser, RegexStartAssertionNode, RegexWordBoundaryAssertionNode
 * } from "@noldova/context.parsers.regex";
 *
 * const nodes = new RegexParser("^\\b[\\b]$", "u").parse().rootNode.patternNode.disjunctionNode.children[0].children;
 * console.assert(nodes[0] instanceof RegexStartAssertionNode);
 * console.assert(nodes[1] instanceof RegexWordBoundaryAssertionNode);
 * console.assert(nodes[3] instanceof RegexEndAssertionNode);
 * const characterClass = nodes[2];
 * console.assert(characterClass instanceof RegexCharacterClassNode);
 * if (characterClass instanceof RegexCharacterClassNode && characterClass.expressionNode instanceof RegexClassUnionNode)
 *   console.assert(characterClass.expressionNode.children[0] instanceof RegexBackspaceEscapeNode);
 * ```
 */
export declare class RegexStartAssertionNode extends ValueNode {
  /**
   * Creates the start assertion at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the assertion.
   *
   * @see {@link RegexStartAssertionNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The word-boundary assertion represented by `\b`.
 */
export declare class RegexWordBoundaryAssertionNode extends ValueNode {
  /**
   * Creates the word-boundary assertion at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the assertion.
   *
   * @see {@link RegexStartAssertionNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * A character class containing a classic class union or a Unicode-set expression.
 *
 * @example A classic class exposes its range through the union expression.
 * ```ts
 * import { RegexCharacterClassNode, RegexCharacterRangeNode, RegexClassUnionNode, RegexParser } from "@noldova/context.parsers.regex";
 *
 * const node = new RegexParser("[^a-z]", "u").parse().rootNode.patternNode.disjunctionNode.children[0].children[0];
 * if (node instanceof RegexCharacterClassNode && node.expressionNode instanceof RegexClassUnionNode) {
 *   console.assert(node.negated && !node.mayContainStrings);
 *   const range = node.expressionNode.children[0];
 *   console.assert(range instanceof RegexCharacterRangeNode);
 *   console.assert(range?.span.startOffset === 2 && range.span.length === 3);
 * }
 * ```
 */
export declare class RegexCharacterClassNode extends Node {
  /**
   * The union, intersection, or subtraction expression contained by the class.
   */
  public readonly expressionNode: Node;

  /**
   * Whether the class selects the complement of its expression.
   */
  public readonly negated: boolean;

  /**
   * Whether the class may match a sequence containing zero or multiple characters.
   */
  public readonly mayContainStrings: boolean;

  /**
   * Creates a character class from its parsed expression and polarity.
   *
   * @param expressionNode The parsed character-set expression.
   * @param negated Whether the class selects the complement of the expression.
   * @param mayContainStrings Whether the expression may match a non-single-character sequence.
   * @param span The absolute UTF-16 source span of the complete character class.
   *
   * @see {@link RegexCharacterClassNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(expressionNode: Node, negated: boolean, mayContainStrings: boolean, span: SourceSpan);
}

/**
 * A source range form between two class atoms. In a non-Unicode Annex B
 * pattern, a character-class escape endpoint gives union semantics instead
 * of ordinary character-range semantics.
 */
export declare class RegexCharacterRangeNode extends Node {
  /**
   * The first class atom in the source range form.
   */
  public readonly startNode: Node;

  /**
   * The second class atom in the source range form.
   */
  public readonly endNode: Node;

  /**
   * Creates a character range from its parsed endpoints.
   *
   * @param startNode The first class atom.
   * @param endNode The second class atom.
   * @param span The absolute UTF-16 source span of the complete range.
   *
   * @see {@link RegexCharacterClassNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(startNode: Node, endNode: Node, span: SourceSpan);
}

/**
 * A Unicode-set intersection whose operands are evaluated from left to right.
 *
 * @example Unicode-set operators retain the ordered operands, not the operator tokens.
 * ```ts
 * import {
 *   RegexCharacterClassNode, RegexClassIntersectionNode, RegexClassSubtractionNode, RegexParser
 * } from "@noldova/context.parsers.regex";
 *
 * const nodes = new RegexParser("[a&&b][a--b]", "v").parse().rootNode.patternNode.disjunctionNode.children[0].children;
 * const intersection = nodes[0];
 * const subtraction = nodes[1];
 * if (intersection instanceof RegexCharacterClassNode && intersection.expressionNode instanceof RegexClassIntersectionNode)
 *   console.assert(intersection.expressionNode.children.length === 2);
 * if (subtraction instanceof RegexCharacterClassNode && subtraction.expressionNode instanceof RegexClassSubtractionNode)
 *   console.assert(subtraction.expressionNode.children.length === 2);
 * ```
 */
export declare class RegexClassIntersectionNode extends CompositeNode {
  /**
   * A non-empty snapshot of the ordered operands. Later changes to the
   * caller's collection do not alter this node.
   */
  public readonly children: readonly [Node, ...Node[]];

  /**
   * Creates an intersection from its ordered operands.
   *
   * @param operands One or more character-set operands in source order. The array is copied; the operand nodes remain shared.
   * @param span The absolute UTF-16 source span of the intersection.
   * @throws ArgumentException If the collection is empty.
   *
   * @see {@link RegexClassIntersectionNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(operands: readonly Node[], span: SourceSpan);
}

/**
 * A `\q{...}` disjunction of strings inside a Unicode-set character class.
 *
 * Strings are syntax alternatives inside the pattern, not the subject text that
 * a future matcher processes. Empty and multi-character alternatives set
 * mayContainStrings; a single supplementary code point still counts as one character.
 *
 * @example Inspect an empty and a two-character string alternative.
 * ```ts
 * import { RegexCharacterClassNode, RegexClassStringDisjunctionNode, RegexClassUnionNode, RegexParser } from "@noldova/context.parsers.regex";
 *
 * const result = new RegexParser("[\\q{|ab}]", "v").parse();
 * const characterClass = result.rootNode.patternNode.disjunctionNode.children[0].children[0];
 * if (characterClass instanceof RegexCharacterClassNode && characterClass.expressionNode instanceof RegexClassUnionNode) {
 *   const strings = characterClass.expressionNode.children[0];
 *   if (strings instanceof RegexClassStringDisjunctionNode) {
 *     console.assert(strings.children[0].children.length === 0);
 *     console.assert(strings.children[1]?.children.length === 2);
 *     console.assert(strings.mayContainStrings);
 *   }
 * }
 * ```
 */
export declare class RegexClassStringDisjunctionNode extends CompositeNode {
  /**
   * A non-empty snapshot of the ordered strings. Later changes to the
   * caller's collection do not alter this node.
   */
  public readonly children: readonly [RegexClassStringNode, ...RegexClassStringNode[]];

  /**
   * Whether at least one alternative contains zero or multiple characters.
   */
  public readonly mayContainStrings: boolean;

  /**
   * Creates a class-string disjunction from its alternatives.
   *
   * @param strings One or more alternatives in source order; each string may be empty. The array is copied; string nodes remain shared.
   * @param span The absolute UTF-16 source span of the complete `\q{...}` expression.
   * @throws ArgumentException If the collection is empty.
   *
   * @see {@link RegexClassStringDisjunctionNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(strings: readonly RegexClassStringNode[], span: SourceSpan);
}

/**
 * One character sequence inside a Unicode-set class-string disjunction.
 */
export declare class RegexClassStringNode extends CompositeNode {
  /**
   * Creates a class string from its ordered character-producing elements.
   *
   * @param characters Character-producing elements in source order; may be empty. The array is retained, not copied; do not mutate it after passing it.
   * @param span The absolute UTF-16 source span of the string alternative.
   *
   * @see {@link RegexClassStringDisjunctionNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(characters: readonly Node[], span: SourceSpan);
}

/**
 * A Unicode-set subtraction whose operands are evaluated from left to right.
 */
export declare class RegexClassSubtractionNode extends CompositeNode {
  /**
   * A non-empty snapshot of the ordered operands. Later changes to the
   * caller's collection do not alter this node.
   */
  public readonly children: readonly [Node, ...Node[]];

  /**
   * Creates a subtraction from its ordered operands.
   *
   * @param operands One or more character-set operands in source order. The array is copied; the operand nodes remain shared.
   * @param span The absolute UTF-16 source span of the subtraction.
   * @throws ArgumentException If the collection is empty.
   *
   * @see {@link RegexClassIntersectionNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(operands: readonly Node[], span: SourceSpan);
}

/**
 * An ordered union of character-class members, ranges, or nested set operands.
 */
export declare class RegexClassUnionNode extends CompositeNode {
  /**
   * Creates a union from its ordered operands.
   *
   * @param operands Character-set operands in source order; may be empty. The array is retained, not copied; do not mutate it after passing it.
   * @param span The absolute UTF-16 source span of the union.
   *
   * @see {@link RegexCharacterClassNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(operands: readonly Node[], span: SourceSpan);
}

/**
 * A numeric backreference to a capturing group in the complete pattern.
 *
 * @example A decimal reference can precede the capturing group it names.
 * ```ts
 * import { RegexBackreferenceNode, RegexParser } from "@noldova/context.parsers.regex";
 *
 * const result = new RegexParser("\\1(a)", "u").parse();
 * const reference = result.rootNode.patternNode.disjunctionNode.children[0].children[0];
 * console.assert(result.diagnostics.length === 0);
 * console.assert(reference instanceof RegexBackreferenceNode && reference.groupIndex === 1);
 * ```
 */
export declare class RegexBackreferenceNode extends ValueNode {
  /**
   * The one-based index of the referenced capturing group.
   */
  public readonly groupIndex: number;

  /**
   * Creates a numeric backreference from its source text and resolved group index.
   *
   * @param value The complete source text of the backreference.
   * @param groupIndex The one-based index of the referenced capturing group.
   * @param span The absolute UTF-16 source span of the backreference.
   *
   * @see {@link RegexBackreferenceNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, groupIndex: number, span: SourceSpan);
}

/**
 * The class-only backspace escape represented by `\b`.
 */
export declare class RegexBackspaceEscapeNode extends ValueNode {
  /**
   * Creates the backspace escape at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexDigitEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The carriage-return character escape represented by `\r`.
 */
export declare class RegexCarriageReturnEscapeNode extends ValueNode {
  /**
   * Creates the carriage-return escape at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexDigitEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * A legacy non-Unicode class-control escape represented by `\c` followed by a decimal digit or underscore.
 */
export declare class RegexClassControlEscapeNode extends ValueNode {
  /**
   * The code point produced by the escape.
   */
  public readonly codePoint: number;

  /**
   * Creates a class-control escape from its source text and resolved code point.
   *
   * @param value The complete source text of the escape.
   * @param codePoint The decoded integer character value, distinct from its source spelling; the constructor stores it without re-decoding value.
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexUnicodeEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, codePoint: number, span: SourceSpan);
}

/**
 * A control-letter escape represented by `\c` followed by its control letter.
 */
export declare class RegexControlLetterEscapeNode extends ValueNode {
  /**
   * The code point produced by the escape.
   */
  public readonly codePoint: number;

  /**
   * Creates a control-letter escape from its source text and resolved code point.
   *
   * @param value The complete source text of the escape.
   * @param codePoint The decoded integer character value, distinct from its source spelling; the constructor stores it without re-decoding value.
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexUnicodeEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, codePoint: number, span: SourceSpan);
}

/**
 * An invalid decimal escape retained for syntax recovery after its complete
 * pattern meaning has been checked.
 */
export declare class RegexDecimalEscapeNode extends ValueNode {
  /**
   * The decimal integer written after the reverse solidus.
   */
  public readonly decimalValue: bigint;

  /**
   * Creates a decimal escape from its source text and parsed integer.
   *
   * @param value The complete source text of the escape.
   * @param decimalValue The decimal integer written by the source.
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexUnknownNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, decimalValue: bigint, span: SourceSpan);
}

/**
 * The decimal-digit character-class escape represented by `\d`.
 *
 * @example Character-class escapes are class-valued nodes, not decoded character nodes.
 * ```ts
 * import { RegexDigitEscapeNode, RegexParser, RegexTabEscapeNode } from "@noldova/context.parsers.regex";
 *
 * const nodes = new RegexParser("\\d\\t", "u").parse().rootNode.patternNode.disjunctionNode.children[0].children;
 * console.assert(nodes[0] instanceof RegexDigitEscapeNode);
 * const tab = nodes[1];
 * console.assert(tab instanceof RegexTabEscapeNode && tab.value === "\\t");
 * ```
 */
export declare class RegexDigitEscapeNode extends ValueNode {
  /**
   * Creates the digit escape at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexDigitEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The form-feed character escape represented by `\f`.
 */
export declare class RegexFormFeedEscapeNode extends ValueNode {
  /**
   * Creates the form-feed escape at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexDigitEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * A hexadecimal character escape represented by `\x` and two hexadecimal digits.
 */
export declare class RegexHexEscapeNode extends ValueNode {
  /**
   * The code point produced by the escape.
   */
  public readonly codePoint: number;

  /**
   * Creates a hexadecimal escape from its source text and resolved code point.
   *
   * @param value The complete source text of the escape.
   * @param codePoint The decoded integer character value, distinct from its source spelling; the constructor stores it without re-decoding value.
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexUnicodeEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, codePoint: number, span: SourceSpan);
}

/**
 * An identity escape whose escaped character retains its own meaning.
 */
export declare class RegexIdentityEscapeNode extends ValueNode {
  /**
   * The code point produced by the escape.
   */
  public readonly codePoint: number;

  /**
   * Creates an identity escape from its source text and resolved code point.
   *
   * @param value The complete source text of the escape.
   * @param codePoint The decoded integer character value, distinct from its source spelling; the constructor stores it without re-decoding value.
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexUnicodeEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, codePoint: number, span: SourceSpan);
}

/**
 * A legacy octal character escape accepted by non-Unicode patterns.
 */
export declare class RegexLegacyOctalEscapeNode extends ValueNode {
  /**
   * The code point produced by the escape.
   */
  public readonly codePoint: number;

  /**
   * Creates a legacy octal escape from its source text and resolved code point.
   *
   * @param value The complete source text of the escape.
   * @param codePoint The decoded integer character value, distinct from its source spelling; the constructor stores it without re-decoding value.
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexUnicodeEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, codePoint: number, span: SourceSpan);
}

/**
 * A named backreference to a named capturing group in the complete pattern.
 */
export declare class RegexNamedBackreferenceNode extends ValueNode {
  /**
   * The decoded name of the referenced capturing group.
   */
  public readonly groupName: string;

  /**
   * Creates a named backreference from its source text and decoded group name.
   *
   * @param value The complete source text of the backreference.
   * @param groupName The decoded identifier, without normalization. Resolution and source-spelling validity are checked by the parser, not this constructor.
   * @param span The absolute UTF-16 source span of the backreference.
   *
   * @see {@link RegexNamedCapturingGroupNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, groupName: string, span: SourceSpan);
}

/**
 * The line-feed character escape represented by `\n`.
 */
export declare class RegexNewlineEscapeNode extends ValueNode {
  /**
   * Creates the newline escape at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexDigitEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The non-digit character-class escape represented by `\D`.
 */
export declare class RegexNonDigitEscapeNode extends ValueNode {
  /**
   * Creates the non-digit escape at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexDigitEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The non-whitespace character-class escape represented by `\S`.
 */
export declare class RegexNonWhitespaceEscapeNode extends ValueNode {
  /**
   * Creates the non-whitespace escape at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexDigitEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The non-word-character class escape represented by `\W`.
 */
export declare class RegexNonWordEscapeNode extends ValueNode {
  /**
   * Creates the non-word escape at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexDigitEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The null-character escape represented by `\0`.
 */
export declare class RegexNullEscapeNode extends ValueNode {
  /**
   * Creates the null escape at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexDigitEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The horizontal-tab character escape represented by `\t`.
 */
export declare class RegexTabEscapeNode extends ValueNode {
  /**
   * Creates the tab escape at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexDigitEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * A Unicode character escape in fixed-width or code-point form.
 *
 * The inherited value preserves escape spelling; codePoint holds the decoded
 * numeric value. A fixed-width surrogate pair combines in Unicode-aware mode
 * and in group names, whereas braced escapes each represent one element.
 *
 * @example Source width and decoded character width need not be the same.
 * ```ts
 * import { RegexHexEscapeNode, RegexParser, RegexUnicodeEscapeNode } from "@noldova/context.parsers.regex";
 *
 * const nodes = new RegexParser("\\x41\\u{1F600}", "u").parse().rootNode.patternNode.disjunctionNode.children[0].children;
 * const hex = nodes[0];
 * const unicode = nodes[1];
 * console.assert(hex instanceof RegexHexEscapeNode && hex.codePoint === 0x41 && hex.value === "\\x41");
 * if (unicode instanceof RegexUnicodeEscapeNode) {
 *   console.assert(unicode.codePoint === 0x1F600);
 *   console.assert(unicode.span.startOffset === 4 && unicode.span.length === 9);
 * }
 * ```
 */
export declare class RegexUnicodeEscapeNode extends ValueNode {
  /**
   * The code point produced by the escape.
   */
  public readonly codePoint: number;

  /**
   * Creates a Unicode escape from its source text and resolved code point.
   *
   * @param value The complete source text of the escape.
   * @param codePoint The decoded integer character value, distinct from its source spelling; the constructor stores it without re-decoding value.
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexUnicodeEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, codePoint: number, span: SourceSpan);
}

/**
 * A Unicode property escape that includes either a lone property value or an explicit property-name and value pair.
 *
 * Names and values preserve the supplied alias spelling; they are not
 * canonicalized. Accepted aliases come from the package's Unicode 15.1 profile.
 * String-valued properties require Unicode-set mode and cannot be complemented.
 *
 * @example Distinguish an explicit property pair from a lone property value.
 * ```ts
 * import { RegexParser, RegexUnicodePropertyEscapeNode } from "@noldova/context.parsers.regex";
 *
 * const nodes = new RegexParser("\\p{Script=Greek}\\P{ASCII}", "u").parse().rootNode.patternNode.disjunctionNode.children[0].children;
 * const script = nodes[0];
 * const complement = nodes[1];
 * if (script instanceof RegexUnicodePropertyEscapeNode) {
 *   console.assert(script.propertyName === "Script" && script.propertyValue === "Greek");
 *   console.assert(!script.negated && !script.mayContainStrings);
 * }
 * if (complement instanceof RegexUnicodePropertyEscapeNode)
 *   console.assert(complement.propertyName === undefined && complement.negated);
 * ```
 */
export declare class RegexUnicodePropertyEscapeNode extends ValueNode {
  /**
   * Whether the selected property may match strings instead of only individual characters.
   */
  public readonly mayContainStrings: boolean;

  /**
   * The explicit property name, or `undefined` when the escape contains a lone property value.
   */
  public readonly propertyName: string | undefined;

  /**
   * The property value selected by the escape.
   */
  public readonly propertyValue: string;

  /**
   * Whether the escape matches code points outside the selected property.
   */
  public readonly negated: boolean;

  /**
   * Creates a Unicode property escape from its parsed property expression.
   *
   * @param value The complete source text of the escape.
   * @param propertyName The explicit property name, or `undefined` for a lone value.
   * @param propertyValue The property value selected by the escape.
   * @param negated Whether the escape excludes the selected property.
   * @param mayContainStrings Whether the selected property can match strings.
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexUnicodePropertyEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, propertyName: string | undefined, propertyValue: string, negated: boolean, mayContainStrings: boolean, span: SourceSpan);
}

/**
 * The vertical-tab character escape represented by `\v`.
 */
export declare class RegexVerticalTabEscapeNode extends ValueNode {
  /**
   * Creates the vertical-tab escape at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexDigitEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The whitespace character-class escape represented by `\s`.
 */
export declare class RegexWhitespaceEscapeNode extends ValueNode {
  /**
   * Creates the whitespace escape at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexDigitEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The word-character class escape represented by `\w`.
 */
export declare class RegexWordEscapeNode extends ValueNode {
  /**
   * Creates the word escape at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the escape.
   *
   * @see {@link RegexDigitEscapeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * A capturing group represented by `(disjunction)`.
 *
 * @example Captures are numbered by opening-parenthesis order, including nested groups.
 * ```ts
 * import { RegexCapturingGroupNode, RegexNonCapturingGroupNode, RegexParser } from "@noldova/context.parsers.regex";
 *
 * const nodes = new RegexParser("(a(b))(?:c)").parse().rootNode.patternNode.disjunctionNode.children[0].children;
 * const outer = nodes[0];
 * if (outer instanceof RegexCapturingGroupNode) {
 *   const inner = outer.disjunctionNode.children[0].children[1];
 *   console.assert(outer.groupIndex === 1);
 *   console.assert(inner instanceof RegexCapturingGroupNode && inner.groupIndex === 2);
 * }
 * console.assert(nodes[1] instanceof RegexNonCapturingGroupNode);
 * ```
 */
export declare class RegexCapturingGroupNode extends Node {
  /**
   * The one-based capture index assigned by the complete pattern.
   */
  public readonly groupIndex: number;

  /**
   * The disjunction evaluated by the capturing group.
   */
  public readonly disjunctionNode: RegexDisjunctionNode;

  /**
   * Creates a capturing group from its parsed disjunction.
   *
   * @param groupIndex The one-based capture index assigned by source order.
   * @param disjunctionNode The disjunction evaluated by the group.
   * @param span The absolute UTF-16 source span of the complete group.
   *
   * @see {@link RegexCapturingGroupNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(groupIndex: number, disjunctionNode: RegexDisjunctionNode, span: SourceSpan);
}

/**
 * A modifier group that changes matching behavior for its nested disjunction.
 *
 * @example Modifiers apply to the group's disjunction, not to the root flags.
 * ```ts
 * import { RegexModifierGroupNode, RegexParser } from "@noldova/context.parsers.regex";
 *
 * const root = new RegexParser("(?im-s:a)").parse().rootNode;
 * const group = root.patternNode.disjunctionNode.children[0].children[0];
 * if (group instanceof RegexModifierGroupNode) {
 *   console.assert(group.enabledModifiers === "im");
 *   console.assert(group.disabledModifiers === "s");
 * }
 * console.assert(!root.flagsNode.ignoreCase);
 * ```
 */
export declare class RegexModifierGroupNode extends Node {
  /**
   * The modifier characters enabled within the group, in source order.
   */
  public readonly enabledModifiers: string;

  /**
   * The modifier characters disabled within the group, in source order.
   */
  public readonly disabledModifiers: string;

  /**
   * The disjunction evaluated with the modified matching behavior.
   */
  public readonly disjunctionNode: RegexDisjunctionNode;

  /**
   * Creates a modifier group from its enabled and disabled modifiers.
   *
   * @param enabledModifiers The enabled source characters, normally distinct i, m, or s; may be empty. Invalid spellings are retained during recovery.
   * @param disabledModifiers The disabled source characters, normally distinct i, m, or s; may be empty and must not overlap valid enabled modifiers.
   * @param disjunctionNode The disjunction evaluated by the group.
   * @param span The absolute UTF-16 source span of the complete group.
   *
   * @see {@link RegexModifierGroupNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(enabledModifiers: string, disabledModifiers: string, disjunctionNode: RegexDisjunctionNode, span: SourceSpan);
}

/**
 * A named capturing group represented by `(?<name>disjunction)`.
 *
 * The name is decoded without Unicode normalization. If the input is invalid,
 * recovery may retain the decoded name alongside diagnostics; a readable name
 * alone does not establish that its source spelling was valid.
 *
 * @example A named declaration and reference share a decoded name, not the same source spelling.
 * ```ts
 * import { RegexNamedBackreferenceNode, RegexNamedCapturingGroupNode, RegexParser } from "@noldova/context.parsers.regex";
 *
 * const result = new RegexParser("(?<\\u006E>a)\\k<n>", "u").parse();
 * const nodes = result.rootNode.patternNode.disjunctionNode.children[0].children;
 * const group = nodes[0];
 * const reference = nodes[1];
 * console.assert(result.diagnostics.length === 0);
 * console.assert(group instanceof RegexNamedCapturingGroupNode && group.groupName === "n");
 * console.assert(reference instanceof RegexNamedBackreferenceNode && reference.groupName === "n");
 * ```
 */
export declare class RegexNamedCapturingGroupNode extends Node {
  /**
   * The one-based capture index assigned by the complete pattern.
   */
  public readonly groupIndex: number;

  /**
   * The decoded name assigned to the captured value.
   */
  public readonly groupName: string;

  /**
   * The disjunction evaluated by the named capturing group.
   */
  public readonly disjunctionNode: RegexDisjunctionNode;

  /**
   * Creates a named capturing group from its decoded name and parsed disjunction.
   *
   * @param groupIndex The one-based capture index assigned by source order.
   * @param groupName The decoded identifier without normalization; invalid source can retain this value alongside a diagnostic.
   * @param disjunctionNode The disjunction evaluated by the group.
   * @param span The absolute UTF-16 source span of the complete group.
   *
   * @see {@link RegexNamedCapturingGroupNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(groupIndex: number, groupName: string, disjunctionNode: RegexDisjunctionNode, span: SourceSpan);
}

/**
 * A non-capturing group represented by `(?:disjunction)`.
 */
export declare class RegexNonCapturingGroupNode extends Node {
  /**
   * The disjunction evaluated without creating a capture.
   */
  public readonly disjunctionNode: RegexDisjunctionNode;

  /**
   * Creates a non-capturing group from its parsed disjunction.
   *
   * @param disjunctionNode The disjunction evaluated by the group.
   * @param span The absolute UTF-16 source span of the complete group.
   *
   * @see {@link RegexCapturingGroupNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(disjunctionNode: RegexDisjunctionNode, span: SourceSpan);
}

/**
 * The Unicode-set intersection punctuator represented by `&&`.
 */
export declare class RegexAmpersandAmpersandNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The asterisk punctuator used by the zero-or-more quantifier.
 *
 * Punctuator nodes carry their fixed spelling in the inherited value property.
 * They describe lexical syntax; the parser normally consumes them into semantic
 * nodes instead of retaining punctuation-only children in the finished AST.
 *
 * @example Construct a punctuator; parsing the same spelling as a quantifier produces a semantic node.
 * ```ts
 * import { SourceSpan } from "@noldova/context.parsers";
 * import { RegexAsteriskNode, RegexParser, RegexQuantifierNode } from "@noldova/context.parsers.regex";
 *
 * const token = new RegexAsteriskNode(new SourceSpan(4, 1));
 * console.assert(token.value === "*");
 * console.assert(token.span.startOffset === 4);
 * const nodes = new RegexParser("a*").parse().rootNode.patternNode.disjunctionNode.children[0].children;
 * console.assert(nodes[1] instanceof RegexQuantifierNode);
 * ```
 */
export declare class RegexAsteriskNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The vertical-bar punctuator separating alternatives or class strings.
 */
export declare class RegexBarNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The `\q{` punctuator that begins a Unicode-set class-string disjunction.
 */
export declare class RegexClassStringDisjunctionStartNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The closing-brace punctuator used by bounded quantifiers and braced constructs.
 */
export declare class RegexCloseBraceNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The punctuator that closes a character class.
 */
export declare class RegexCloseBracketNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The punctuator that closes a group or lookaround assertion.
 */
export declare class RegexCloseParenthesisNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The colon punctuator terminating a non-capturing or modifier-group prefix.
 */
export declare class RegexColonNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The comma punctuator separating bounded-quantifier limits.
 */
export declare class RegexCommaNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The equals punctuator used by positive lookaround prefixes.
 */
export declare class RegexEqualsNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The exclamation punctuator used by negative lookaround prefixes.
 */
export declare class RegexExclamationNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The greater-than punctuator that closes a named-group identifier.
 */
export declare class RegexGreaterThanNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The Unicode-set subtraction punctuator represented by `--`.
 */
export declare class RegexHyphenHyphenNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The hyphen punctuator used by character ranges and modifier groups.
 */
export declare class RegexHyphenNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The less-than punctuator used by lookbehind and named-group prefixes.
 */
export declare class RegexLessThanNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The opening-brace punctuator used by bounded quantifiers and braced constructs.
 */
export declare class RegexOpenBraceNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The punctuator that begins a character class.
 */
export declare class RegexOpenBracketNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The punctuator that begins a group or lookaround assertion.
 */
export declare class RegexOpenParenthesisNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The plus punctuator used by the one-or-more quantifier.
 */
export declare class RegexPlusNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The question punctuator used by quantifiers and group prefixes.
 */
export declare class RegexQuestionNode extends ValueNode {
  /**
   * Creates the punctuator at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the punctuator.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * An ordered sequence of regular-expression terms forming one alternative.
 *
 * An empty alternative has no children. A quantified term contributes its atom
 * followed by a separate {@link RegexQuantifierNode}; it is not wrapped in another node.
 *
 * @example Inspect quantified terms and an empty alternative.
 * ```ts
 * import { RegexCharacterNode, RegexParser, RegexQuantifierNode } from "@noldova/context.parsers.regex";
 *
 * const result = new RegexParser("a+|", "u").parse();
 * const alternatives = result.rootNode.patternNode.disjunctionNode.children;
 * const first = alternatives[0].children;
 * console.assert(first[0] instanceof RegexCharacterNode);
 * console.assert(first[1] instanceof RegexQuantifierNode);
 * console.assert(alternatives[1]?.children.length === 0);
 * ```
 */
export declare class RegexAlternativeNode extends CompositeNode {
  /**
   * Creates an alternative from its ordered terms and exact source span.
   *
   * @param terms Ordered terms, with each quantifier following its atom; may be empty. The array is retained, not copied; do not mutate it after passing it.
   * @param span The absolute UTF-16 source span of the alternative.
   *
   * @see {@link RegexAlternativeNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(terms: readonly Node[], span: SourceSpan);
}

/**
 * A regular-expression disjunction containing one or more alternatives.
 *
 * @example An empty pattern still has one empty alternative.
 * ```ts
 * import { RegexParser } from "@noldova/context.parsers.regex";
 *
 * const alternatives = new RegexParser("").parse().rootNode.patternNode.disjunctionNode.children;
 * console.assert(alternatives.length === 1);
 * console.assert(alternatives[0].children.length === 0);
 * ```
 */
export declare class RegexDisjunctionNode extends CompositeNode {
  /**
   * A non-empty snapshot of the ordered alternatives. Later changes to the
   * caller's collection do not alter this node.
   */
  public readonly children: readonly [RegexAlternativeNode, ...RegexAlternativeNode[]];

  /**
   * Creates a disjunction from its ordered alternatives and exact source span.
   *
   * @param alternatives One or more alternatives in source order, including empty alternatives. The array is copied; the alternative nodes remain shared.
   * @param span The absolute UTF-16 source span of the disjunction.
   * @throws ArgumentException If the collection is empty.
   *
   * @see {@link RegexDisjunctionNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(alternatives: readonly RegexAlternativeNode[], span: SourceSpan);
}

/**
 * The regular-expression wildcard atom represented by `.`.
 */
export declare class RegexDotNode extends ValueNode {
  /**
   * Creates the wildcard atom at its exact source span.
   *
   * @param span The absolute UTF-16 source span of the wildcard atom.
   *
   * @see {@link RegexAsteriskNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(span: SourceSpan);
}

/**
 * The flags supplied with a regular expression.
 *
 * Booleans describe the presence of flag characters, not successful validation.
 * Unknown, repeated, or conflicting flags remain in value; {@link RegexParser}
 * reports their diagnostics. These fields describe matching options but do not
 * perform matching.
 *
 * @example Invalid combinations are preserved for inspection.
 * ```ts
 * import { RegexParser } from "@noldova/context.parsers.regex";
 *
 * const result = new RegexParser("a", "uv").parse();
 * console.assert(result.rootNode.flagsNode.value === "uv");
 * console.assert(result.rootNode.flagsNode.unicode && result.rootNode.flagsNode.unicodeSets);
 * console.assert(result.diagnostics.length > 0);
 * ```
 */
export declare class RegexFlagsNode extends ValueNode {
  /**
   * Whether match indices are requested by the `d` flag.
   */
  public readonly hasIndices: boolean;

  /**
   * Whether all matches are requested by the `g` flag.
   */
  public readonly global: boolean;

  /**
   * Whether matching ignores case differences through the `i` flag.
   */
  public readonly ignoreCase: boolean;

  /**
   * Whether line boundaries affect anchors through the `m` flag.
   */
  public readonly multiline: boolean;

  /**
   * Whether the wildcard matches line terminators through the `s` flag.
   */
  public readonly dotAll: boolean;

  /**
   * Whether Unicode-aware matching is enabled through the `u` flag.
   */
  public readonly unicode: boolean;

  /**
   * Whether Unicode set notation is enabled through the `v` flag.
   */
  public readonly unicodeSets: boolean;

  /**
   * Whether matching begins at the current last index through the `y` flag.
   */
  public readonly sticky: boolean;

  /**
   * Creates the parsed flag value at its exact source span.
   *
   * @param value The exact supplied flags, normally a non-repeating selection from dgimsuvy with at most one of u and v; may be empty or invalid.
   * @param span The absolute UTF-16 source span of the flags.
   *
   * @see {@link RegexFlagsNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, span: SourceSpan);
}

/**
 * A raw UTF-16 code unit in a legacy pattern or a code point in a Unicode-aware
 * pattern. Group-name lexing uses code points regardless of the flags.
 *
 * @example The mode controls atom boundaries, while all spans remain UTF-16 based.
 * ```ts
 * import { RegexCharacterNode, RegexParser } from "@noldova/context.parsers.regex";
 *
 * const legacy = new RegexParser("😀").parse().rootNode.patternNode.disjunctionNode.children[0].children;
 * const unicode = new RegexParser("😀", "u").parse().rootNode.patternNode.disjunctionNode.children[0].children;
 * console.assert(legacy.length === 2 && legacy[0]?.span.length === 1);
 * const character = unicode[0];
 * console.assert(unicode.length === 1);
 * console.assert(character instanceof RegexCharacterNode && character.value === "😀" && character.span.length === 2);
 * ```
 */
export declare class RegexCharacterNode extends ValueNode {
  /**
   * Creates a literal character from its source value.
   *
   * @param value One raw UTF-16 code unit in legacy mode, or one raw code point in Unicode-aware mode or a group name; a code point may occupy two units.
   * @param span The absolute UTF-16 source span of the character.
   *
   * @see {@link RegexCharacterNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, span: SourceSpan);
}

/**
 * The root of a parsed regular expression.
 *
 * Node spans use absolute UTF-16 code-unit offsets in the original source,
 * including delimiters where the represented construct has them. Nodes store
 * spans, not source identities; diagnostics preserve a supplied Source's identity.
 *
 * Constructors assemble the values supplied by the caller; they do not parse or
 * revalidate ECMAScript grammar. Keep source spelling, decoded fields, child
 * roles, and spans consistent. Use {@link RegexParser} when accepting source text.
 * Children and spans are retained by reference. Collection constructors document
 * whether they retain the array or copy it; neither operation clones child nodes.
 *
 * @example Assemble a small tree; an atom and its quantifier remain separate children.
 * ```ts
 * import { SourceSpan } from "@noldova/context.parsers";
 * import {
 *   RegexAlternativeNode, RegexCharacterNode, RegexDisjunctionNode, RegexFlagsNode,
 *   RegexNode, RegexPatternNode, RegexQuantifierNode
 * } from "@noldova/context.parsers.regex";
 *
 * const character = new RegexCharacterNode("a", new SourceSpan(0, 1));
 * const quantifier = new RegexQuantifierNode("+", 1n, undefined, true, new SourceSpan(1, 1));
 * const alternative = new RegexAlternativeNode([character, quantifier], new SourceSpan(0, 2));
 * const disjunction = new RegexDisjunctionNode([alternative], new SourceSpan(0, 2));
 * const pattern = new RegexPatternNode("a+", disjunction, new SourceSpan(0, 2));
 * const flags = new RegexFlagsNode("u", new SourceSpan(2, 1));
 * const root = new RegexNode("a+u", pattern, flags, new SourceSpan(0, 3));
 * console.assert(root.patternNode.disjunctionNode.children[0].children[1] === quantifier);
 * console.assert(root.flagsNode.unicode);
 * ```
 */
export declare class RegexNode extends Node {
  /**
   * The exact inputSpan text for source/reader input, including supplied host
   * delimiters; for string input, the pattern followed by flags without added delimiters.
   */
  public readonly rawValue: string;

  /**
   * The parsed pattern.
   */
  public readonly patternNode: RegexPatternNode;

  /**
   * The parsed flags.
   */
  public readonly flagsNode: RegexFlagsNode;

  /**
   * Creates a regular-expression root from its original and parsed forms.
   *
   * @param rawValue The exact text covered by span, including any supplied host delimiters and flags; no delimiters are synthesized.
   * @param patternNode The parsed pattern.
   * @param flagsNode The parsed flags.
   * @param span The absolute UTF-16 source span of the complete regular expression.
   * @param leadingTrivia Optional outer-language trivia before the expression, retained by reference. Omission means no leading trivia.
   * @param trailingTrivia Optional outer-language trivia after the expression, retained by reference. Omission means no trailing trivia.
   *
   * @see {@link RegexNode} for tree-construction examples and shared node contracts.
   */
  public constructor(
    rawValue: string,
    patternNode: RegexPatternNode,
    flagsNode: RegexFlagsNode,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * An ECMAScript regular-expression pattern and its parsed disjunction.
 */
export declare class RegexPatternNode extends Node {
  /**
   * The original pattern text without delimiters or flags.
   */
  public readonly value: string;

  /**
   * The parsed top-level disjunction.
   */
  public readonly disjunctionNode: RegexDisjunctionNode;

  /**
   * Creates a pattern from its original text and parsed disjunction.
   *
   * @param value The original pattern text without delimiters or flags.
   * @param disjunctionNode The parsed top-level disjunction.
   * @param span The absolute UTF-16 source span of the pattern.
   *
   * @see {@link RegexNode} for tree-construction examples and shared node contracts.
   */
  public constructor(value: string, disjunctionNode: RegexDisjunctionNode, span: SourceSpan);
}

/**
 * A quantifier applied to the immediately preceding regular-expression atom.
 *
 * The bounds use bigint so large decimal counts do not lose precision. A malformed
 * bounded quantifier can retain minimum greater than maximum with a diagnostic;
 * its existence in a recovered AST is not evidence of valid repetition semantics.
 *
 * @example Read unbounded and lazy bounded repetition without parsing the spelling yourself.
 * ```ts
 * import { RegexParser, RegexQuantifierNode } from "@noldova/context.parsers.regex";
 *
 * const nodes = new RegexParser("a*b{2,4}?").parse().rootNode.patternNode.disjunctionNode.children[0].children;
 * const unbounded = nodes[1];
 * const bounded = nodes[3];
 * console.assert(unbounded instanceof RegexQuantifierNode && unbounded.minimum === 0n && unbounded.maximum === undefined);
 * if (bounded instanceof RegexQuantifierNode)
 *   console.assert(bounded.minimum === 2n && bounded.maximum === 4n && !bounded.greedy);
 * ```
 */
export declare class RegexQuantifierNode extends ValueNode {
  /**
   * The minimum number of matches required.
   */
  public readonly minimum: bigint;

  /**
   * The maximum number of matches permitted, or `undefined` when unbounded.
   */
  public readonly maximum: bigint | undefined;

  /**
   * Whether the quantifier initially attempts the greatest permitted match count.
   */
  public readonly greedy: boolean;

  /**
   * Creates a quantifier from its source value and parsed repetition bounds.
   *
   * @param value The original quantifier text, including a non-greedy suffix when present.
   * @param minimum The non-negative repetition count from the source, without floating-point precision loss.
   * @param maximum The non-negative upper count, or undefined when unbounded. Invalid bounded source may preserve a count smaller than minimum.
   * @param greedy Whether the quantifier initially attempts the greatest permitted match count.
   * @param span The absolute UTF-16 source span of the quantifier.
   *
   * @see {@link RegexQuantifierNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, minimum: bigint, maximum: bigint | undefined, greedy: boolean, span: SourceSpan);
}

/**
 * Source text retained when token classification fails or syntax recovery skips
 * a region, including recovery from the parser's nesting limit.
 *
 * @example Malformed escape text remains represented in a diagnostic-bearing tree.
 * ```ts
 * import { RegexParser, RegexUnknownNode } from "@noldova/context.parsers.regex";
 *
 * const result = new RegexParser("\\xQ", "u").parse();
 * const first = result.rootNode.patternNode.disjunctionNode.children[0].children[0];
 * console.assert(result.diagnostics.length > 0);
 * console.assert(first instanceof RegexUnknownNode);
 * ```
 */
export declare class RegexUnknownNode extends ValueNode {
  /**
   * Creates an unknown token from its exact source text.
   *
   * @param value The exact malformed or skipped source spelling, without normalization.
   * @param span The absolute UTF-16 source span of the token.
   *
   * @see {@link RegexUnknownNode} for usage and {@link RegexNode} for shared node-construction contracts.
   */
  public constructor(value: string, span: SourceSpan);
}

/**
 * Parses one ECMAScript regular-expression input and returns its AST and
 * diagnostics. Construct a new parser for each parse operation and call
 * {@link parse} once; token navigation, the lexer, and the parser context are internal.
 *
 * The implementation supports 512 enclosing groups and character classes
 * combined. Deeper input produces CTX1037 and is skipped to its closing
 * delimiter or the pattern boundary. This is an implementation limit, not an
 * ECMAScript grammar restriction.
 *
 * The accepted language profile is ECMAScript regular-expression syntax aligned
 * with TypeScript 7.0.2 and Unicode 15.1. Parsing does not execute a pattern,
 * match a subject string, or require the host RegExp engine's Unicode tables.
 *
 * @example Parse standalone text, inspect diagnostics, and keep the result after the session ends.
 * ```ts
 * import { RegexParser } from "@noldova/context.parsers.regex";
 *
 * const parser = new RegexParser("a+", "u");
 * const result = parser.parse();
 * console.assert(result.diagnostics.length === 0);
 * console.assert(result.rootNode.patternNode.value === "a+");
 * console.assert(result.rootNode.rawValue === "a+u"); // No slash delimiters were supplied.
 *
 * const invalid = new RegexParser("(", "u").parse();
 * console.assert(invalid.diagnostics.length > 0); // Source errors are data, not thrown exceptions.
 * console.assert(invalid.rootNode.patternNode.value === "(");
 * ```
 *
 * @example A second parse attempt is a caller error, not a syntax diagnostic.
 * ```ts
 * import { ParserException } from "@noldova/context.parsers";
 * import { RegexParser } from "@noldova/context.parsers.regex";
 *
 * const parser = new RegexParser("");
 * const first = parser.parse();
 * let rejected = false;
 * try {
 *   parser.parse();
 * }
 * catch (error) {
 *   if (!(error instanceof ParserException))
 *     throw error;
 *   rejected = true;
 * }
 * console.assert(rejected && first.rootNode.patternNode.value === "");
 * ```
 */
export declare class RegexParser {
  /**
   * Creates a parser for a pattern without host delimiters.
   *
   * @param pattern The pattern alone, with no enclosing slash delimiters; may be empty. Escape backslashes as required by the host string syntax.
   * @param flags The exact flag text; defaults to empty. Valid flags are dgimsuvy without duplicates and with at most one of u and v; invalid flags yield diagnostics.
   * @remarks An anonymous source contains the pattern followed by the flags.
   * Pattern spans start at zero; flag spans follow the pattern. The root's raw
   * value is that combined source text, without synthesized slash delimiters.
   *
   * @see {@link RegexParser} for standalone parsing and lifecycle examples.
   */
  public constructor(pattern: string, flags?: string);

  /**
   * Creates a parser for a bounded pattern within an existing source.
   *
   * @param source The immutable source shared with the embedding language; its optional identity is preserved in diagnostic locations.
   * @param patternSpan The bounded UTF-16 pattern region, excluding host delimiters and flags. May be empty; must lie within inputSpan.
   * @param flagsSpan The UTF-16 flags region at or after patternSpan.endOffset, contained in inputSpan. Use an empty span when there are no flags.
   * @param inputSpan The complete UTF-16 input region containing patternSpan and flagsSpan, including supplied host delimiters. Must lie within source.
   * @remarks All spans are absolute UTF-16 offsets in the supplied source.
   * The pattern and flags must remain within inputSpan. Parsing uses a new
   * bounded reader and preserves the source's optional identity in diagnostics.
   * @throws InvalidSpanException If any region extends outside source.
   * @throws ArgumentException If the pattern or flags lie outside inputSpan, or flags begin before the pattern ends.
   *
   * @example Parse an embedded literal while retaining host offsets and diagnostic identity.
   * ```ts
   * import { Source, SourceSpan } from "@noldova/context.parsers";
   * import { RegexParser } from "@noldova/context.parsers.regex";
   *
   * const source = new Source("before /(/u after", "example.ctx");
   * const result = new RegexParser(source, new SourceSpan(8, 1), new SourceSpan(10, 1), new SourceSpan(7, 4)).parse();
   * console.assert(result.rootNode.rawValue === "/(/u");
   * console.assert(result.rootNode.span.startOffset === 7);
   * console.assert(result.rootNode.patternNode.span.startOffset === 8);
   * console.assert(result.diagnostics.length > 0);
   * console.assert(result.diagnostics[0]?.location?.sourceIdentity === "example.ctx");
   * ```
   */
  public constructor(source: Source, patternSpan: SourceSpan, flagsSpan: SourceSpan, inputSpan: SourceSpan);

  /**
   * Creates a parser that consumes a caller-supplied bounded reader.
   *
   * @param reader The shared bounded pattern reader, positioned exactly at startOffset; an empty region is allowed. Construction may advance it to lex the first token.
   * @param flagsSpan The UTF-16 flags region at or after reader.endOffset and within inputSpan; may be empty.
   * @param inputSpan The complete UTF-16 input region containing the reader's region and flagsSpan, within the reader's source.
   * @remarks Construction and parsing use the same reader. Do not move it externally
   * until parse returns. A completed parse leaves it at endOffset without consuming
   * surrounding text; all spans are absolute UTF-16 source coordinates.
   * @throws InvalidSpanException If flagsSpan or inputSpan extends outside the reader's source.
   * @throws ArgumentException If the reader is not at startOffset, its region or flags lie outside inputSpan, or flags begin before reader.endOffset.
   *
   * @example The host owns delimiters and bounds; the Regex parser consumes only the pattern region.
   * ```ts
   * import { Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
   * import { RegexParser } from "@noldova/context.parsers.regex";
   *
   * const source = new Source("before /a+/u after");
   * const reader = new SourceReader(source, new SourceSpan(8, 2));
   * const parser = new RegexParser(reader, new SourceSpan(11, 1), new SourceSpan(7, 5));
   * const result = parser.parse();
   * console.assert(reader.currentOffset === 10);
   * console.assert(source.getText(reader.currentOffset, 1) === "/");
   * console.assert(result.rootNode.rawValue === "/a+/u");
   * console.assert(result.diagnostics.length === 0);
   * ```
   */
  public constructor(reader: SourceReader, flagsSpan: SourceSpan, inputSpan: SourceSpan);

  /**
   * Parses the complete pattern and validates its flags.
   *
   * @returns The recovered AST and a diagnostic snapshot in encounter order. A
   * clean parse has an empty diagnostic collection; malformed syntax is reported
   * through diagnostics and can leave recovery nodes in the tree. The result
   * remains usable after the single-use parser session ends; it does not expose
   * the internal lexer or parser context.
   * @throws ParserException If this session has already attempted parsing.
   * Create a new parser for another operation; the first result remains usable.
   *
   * @see {@link RegexParser} for successful parsing, diagnostics, and single-use examples.
   */
  public parse(): ParserResult<RegexNode>;
}
