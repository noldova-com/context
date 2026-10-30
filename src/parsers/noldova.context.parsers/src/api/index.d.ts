/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Diagnostic, DiagnosticTemplate } from "@noldova/context.diagnostics";
import type { Exception, ExceptionOptions } from "@noldova/context.exceptions";
import type { LineTerminator, ReadOnlyStringSpan } from "@noldova/context.text";

/**
 * The base exception for failures owned by the Parsers package.
 * Invalid language input is normally reported as diagnostics; this exception
 * represents an invalid parser operation or a broken implementation invariant.
 *
 * @example
 * ```ts
 * import { ParserException } from "@noldova/context.parsers";
 * import { ExceptionOptions } from "@noldova/context.exceptions";
 *
 * const cause = new Error("Lexer failed.");
 * const failure = new ParserException("Parsing could not continue.", new ExceptionOptions(cause));
 * console.assert(failure.cause === cause);
 * ```
 */
export declare class ParserException extends Exception {
  /**
   * Creates a parser failure without translating its cause.
   *
   * @param message The failure description, preserved as supplied.
   * @param options Optional exception context, including the original cause.
   * @see {@link ParserException} for an example.
   */
  public constructor(message: string, options?: ExceptionOptions);
}

/**
 * Reports an absolute UTF-16 offset or permitted range that is invalid.
 *
 * @example
 * ```ts
 * import { InvalidOffsetException } from "@noldova/context.parsers";
 *
 * InvalidOffsetException.throwIfOutsideRange(5, 1, 5); // Both endpoints are valid.
 * try {
 *   InvalidOffsetException.throwIfOutsideRange(6, 1, 5);
 * } catch (error) {
 *   if (!(error instanceof InvalidOffsetException))
 *     throw error;
 *   console.assert(error.offset === 6 && error.maximumOffset === 5);
 * }
 * ```
 */
export declare class InvalidOffsetException extends ParserException {
  /**
   * The rejected absolute offset.
   */
  public readonly offset: number;

  /**
   * The inclusive minimum permitted offset.
   */
  public readonly minimumOffset: number;

  /**
   * The inclusive maximum permitted offset.
   */
  public readonly maximumOffset: number;

  /**
   * Records rejected offset data without validating it again.
   *
   * @param offset The rejected absolute UTF-16 offset; invalid numeric values are preserved.
   * @param minimumOffset The attempted inclusive lower bound.
   * @param maximumOffset The attempted inclusive upper bound.
   * @param options Optional exception context, including the original cause.
   * @see {@link InvalidOffsetException} for a guard example.
   */
  public constructor(offset: number, minimumOffset: number, maximumOffset: number, options?: ExceptionOptions);

  /**
   * Validates an offset against an inclusive non-negative range.
   *
   * @param offset The absolute UTF-16 offset to validate, including either endpoint.
   * @param minimumOffset The inclusive lower bound; a non-negative safe integer.
   * @param maximumOffset The inclusive upper bound; a safe integer no smaller than the lower bound.
   * @throws {InvalidOffsetException} If any number is not a safe integer, the bounds
   * are invalid, or the offset lies outside them.
   * @see {@link InvalidOffsetException} for accepted and rejected examples.
   */
  public static throwIfOutsideRange(offset: number, minimumOffset: number, maximumOffset: number): void;
}

/**
 * Reports a half-open UTF-16 span that is invalid for its source.
 *
 * @example
 * ```ts
 * import { InvalidSpanException } from "@noldova/context.parsers";
 *
 * InvalidSpanException.throwIfInvalid(0, 5, 5);
 * InvalidSpanException.throwIfInvalid(5, 0, 5); // Empty at the source end.
 * try {
 *   InvalidSpanException.throwIfInvalid(4, 2, 5);
 * } catch (error) {
 *   if (!(error instanceof InvalidSpanException))
 *     throw error;
 *   console.assert(error.startOffset === 4 && error.length === 2);
 * }
 * ```
 */
export declare class InvalidSpanException extends ParserException {
  /**
   * The rejected absolute start offset.
   */
  public readonly startOffset: number;

  /**
   * The rejected span length.
   */
  public readonly length: number;

  /**
   * The target source length.
   */
  public readonly sourceLength: number;

  /**
   * Records rejected span data without validating it again.
   *
   * @param startOffset The attempted absolute UTF-16 start offset.
   * @param length The attempted number of UTF-16 code units.
   * @param sourceLength The source length used for validation.
   * @param options Optional exception context, including the original cause.
   * @see {@link InvalidSpanException} for a guard example.
   */
  public constructor(startOffset: number, length: number, sourceLength: number, options?: ExceptionOptions);

  /**
   * Validates a half-open span, including empty spans at the source end.
   *
   * @param startOffset The non-negative safe-integer absolute UTF-16 start.
   * @param length The non-negative safe-integer number of UTF-16 code units.
   * @param sourceLength The non-negative safe-integer length of the complete source.
   * @throws {InvalidSpanException} If an argument or derived end is not a safe
   * integer, an argument is negative, or the span extends beyond the source.
   * @see {@link InvalidSpanException} for boundary examples.
   */
  public static throwIfInvalid(startOffset: number, length: number, sourceLength: number): void;
}

/**
 * Reports a zero-based line index that cannot identify a line in the given count.
 *
 * @example
 * ```ts
 * import { LineOutOfBoundsException } from "@noldova/context.parsers";
 *
 * LineOutOfBoundsException.throwIfOutOfBounds(1, 2);
 * try {
 *   LineOutOfBoundsException.throwIfOutOfBounds(2, 2);
 * } catch (error) {
 *   if (!(error instanceof LineOutOfBoundsException))
 *     throw error;
 *   console.assert(error.lineIndex === 2 && error.lineCount === 2);
 * }
 * ```
 */
export declare class LineOutOfBoundsException extends ParserException {
  /**
   * The rejected zero-based line index.
   */
  public readonly lineIndex: number;

  /**
   * The source line count.
   */
  public readonly lineCount: number;

  /**
   * Records rejected line data without validating it again.
   *
   * @param lineIndex The attempted zero-based line index.
   * @param lineCount The line count used for validation.
   * @param options Optional exception context, including the original cause.
   * @see {@link LineOutOfBoundsException} for a guard example.
   */
  public constructor(lineIndex: number, lineCount: number, options?: ExceptionOptions);

  /**
   * Validates that an index identifies an existing line.
   *
   * @param lineIndex The zero-based safe-integer index, strictly below the line count.
   * @param lineCount The non-negative safe-integer count; zero permits no index.
   * @throws {LineOutOfBoundsException} If either number is invalid or the index
   * does not identify an existing line.
   * @see {@link LineOutOfBoundsException} for boundary examples.
   */
  public static throwIfOutOfBounds(lineIndex: number, lineCount: number): void;
}

/**
 * The runtime identity of a node type, including abstract base classes.
 * TNode is the instance type the parser recognizes through this identity in
 * {@link Parser.tryConsume} and {@link Parser.requireCurrentNode}; the
 * contract requires a prototype, not a callable constructor. Grammar code
 * recognizes a known type with `instanceof` instead.
 *
 * @see {@link Parser} for consumption by node type.
 */
export declare type NodeType<TNode extends Node = Node> = {
  readonly prototype: TNode;
};

/**
 * A value-node class whose text is determined by its concrete type and whose
 * constructor accepts a span and optional trivia. TNode is the created type.
 * A class requiring a separate text argument does not satisfy this contract.
 *
 * @param span The absolute UTF-16 span to give the new node.
 * @param leadingTrivia Optional language-owned trivia preceding the node.
 * @param trailingTrivia Optional language-owned trivia following the node.
 * @returns A new concrete value node.
 * @example
 * ```ts
 * import { Node, SourceSpan, ValueNode, type ValueNodeType } from "@noldova/context.parsers";
 *
 * class PlusNode extends ValueNode {
 *   public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
 *     super("+", span, leadingTrivia, trailingTrivia);
 *   }
 * }
 * const type: ValueNodeType<PlusNode> = PlusNode;
 * const node = new type(new SourceSpan(0, 1));
 * console.assert(node.value === "+");
 * ```
 */
export declare type ValueNodeType<TNode extends ValueNode = ValueNode> = NodeType<TNode> & (new (
  span: SourceSpan,
  leadingTrivia?: Node,
  trailingTrivia?: Node) => TNode);

/**
 * The immutable base of parser node hierarchies. Each node records its exact
 * UTF-16 source span and optional language-owned trivia. Trivia is separate
 * from a composite's semantic children. Nodes do not retain their parser. A
 * language adds behavior to nodes through declaration merging on its own
 * package; the shared node carries structure only.
 *
 * @example
 * ```ts
 * import { LiteralNode, Node, SourceSpan, ValueNode, WhitespaceNode } from "@noldova/context.parsers";
 *
 * class TextLiteralNode extends LiteralNode {
 *   public constructor(value: string, span: SourceSpan, leadingTrivia?: Node) {
 *     super(value, span, leadingTrivia);
 *   }
 * }
 * const trivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
 * const node: Node = new TextLiteralNode("a", new SourceSpan(1, 1), trivia);
 * console.assert(node instanceof ValueNode);
 * console.assert(node.leadingTrivia === trivia);
 * ```
 */
export declare abstract class Node {
  /**
   * The exact source span represented by this node.
   */
  public readonly span: SourceSpan;

  /**
   * Trivia preceding this node, when the owning language attaches it.
   */
  public readonly leadingTrivia: Node | undefined;

  /**
   * Trivia following this node, when the owning language attaches it.
   */
  public readonly trailingTrivia: Node | undefined;

  /**
   * Initializes the shared node state without copying spans or trivia.
   *
   * @param span The exact absolute UTF-16 span of the node itself.
   * @param leadingTrivia Optional preceding trivia; omitted when the language attaches none.
   * @param trailingTrivia Optional following trivia; omitted when the language attaches none.
   * @see {@link Node} for a node with leading trivia.
   */
  protected constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The base of text-bearing nodes. Each concrete node defines whether its
 * value contains source text or a decoded representation.
 */
export declare abstract class ValueNode extends Node {
  /**
   * The node's text value. The empty string is a valid value; the exact source
   * spelling is identified by the node's span.
   */
  public readonly value: string;

  /**
   * Initializes a text-bearing node.
   *
   * @param value Source spelling or decoded text as defined by the concrete node; empty text is valid.
   * @param span The exact absolute UTF-16 source span, which need not have the decoded value's length.
   * @param leadingTrivia Optional preceding language-owned trivia.
   * @param trailingTrivia Optional following language-owned trivia.
   * @see {@link ValueNodeType} for a concrete subclass.
   */
  protected constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The base for genuine ordered semantic child collections, not fixed named
 * syntax roles. The supplied array is retained; callers must not mutate it
 * after publishing the node. Empty collections are valid.
 *
 * @example
 * ```ts
 * import { CompositeNode, LiteralNode, Node, SourceSpan } from "@noldova/context.parsers";
 *
 * class TextLiteralNode extends LiteralNode {
 *   public constructor(value: string, span: SourceSpan) {
 *     super(value, span);
 *   }
 * }
 * class SequenceNode extends CompositeNode {
 *   public constructor(children: readonly Node[], span: SourceSpan) {
 *     super(children, span);
 *   }
 * }
 * const leaf = new TextLiteralNode("a", new SourceSpan(0, 1));
 * const sequence = new SequenceNode([leaf], new SourceSpan(0, 1));
 * console.assert(sequence.children[0] === leaf);
 * console.assert(new SequenceNode([], new SourceSpan(1, 0)).children.length === 0);
 * ```
 */
export declare abstract class CompositeNode extends Node {
  /**
   * The children in source and grammar order. The supplied collection is
   * retained without copying.
   */
  public readonly children: readonly Node[];

  /**
   * Initializes an ordered child collection without cloning its array or nodes.
   *
   * @param children The children in source and grammar order; must remain unchanged after publication.
   * @param span The exact absolute UTF-16 source span represented by the composite.
   * @param leadingTrivia Optional preceding trivia, separate from the semantic children.
   * @param trailingTrivia Optional following trivia, separate from the semantic children.
   * @see {@link CompositeNode} for populated and empty collections.
   */
  protected constructor(children: readonly Node[], span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The abstract base for language-owned literal tokens. Concrete node types
 * identify the literal syntax and define whether their value is source text
 * or decoded text. This base neither decodes nor validates a language's grammar.
 *
 * @see {@link Node} for a literal with trivia.
 */
export declare abstract class LiteralNode extends ValueNode {
  /**
   * Initializes a concrete language literal without normalizing its text.
   *
   * @param value Source spelling or decoded text as defined by the concrete
   * node; empty text is permitted.
   * @param span The exact absolute UTF-16 span in the original source.
   * @param leadingTrivia Optional preceding language-owned trivia.
   * @param trailingTrivia Optional following language-owned trivia.
   * @see {@link Node} for an example.
   */
  protected constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The abstract base for language-owned comment syntax. The inherited value
 * is the comment body without delimiters; whitespace, line breaks, and
 * decorative characters are preserved. The span covers the complete original
 * comment, including delimiters that were present. Original spelling can be
 * recovered from the source through that span.
 *
 * @example
 * ```ts
 * import { CommentNode, Source, SourceSpan } from "@noldova/context.parsers";
 *
 * class LanguageCommentNode extends CommentNode {
 *   public constructor(value: string, span: SourceSpan) {
 *     super(value, span);
 *   }
 * }
 * const source = new Source("// note");
 * const comment = new LanguageCommentNode(" note", new SourceSpan(0, 7));
 * console.assert(comment.value === " note" && comment instanceof CommentNode);
 * console.assert(source.getText(comment.span) === "// note");
 * ```
 */
export declare abstract class CommentNode extends ValueNode {
  /**
   * Initializes a language-owned comment without normalizing its body.
   *
   * @param value The body selected by the language lexer, excluding opening
   * and any present closing delimiters. Empty text is permitted; do not trim it.
   * @param span The absolute UTF-16 span of the complete comment, including
   * any delimiters that were present. Its length need not equal the body length.
   * @param leadingTrivia Optional preceding language-owned trivia.
   * @param trailingTrivia Optional following language-owned trivia.
   * @see {@link CommentNode} for an example.
   */
  protected constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A generic whitespace node whose accepted characters are determined by its
 * language lexer; construction does not classify or normalize its text.
 *
 * @see {@link Node} for a whitespace node used as leading trivia.
 */
export declare class WhitespaceNode extends ValueNode {
  /**
   * Creates a whitespace node without normalizing its text.
   *
   * @param value The text preserved by the language lexer; empty text is permitted.
   * @param span The exact absolute UTF-16 span in the original source.
   * @param leadingTrivia Optional preceding language-owned trivia.
   * @param trailingTrivia Optional following language-owned trivia.
   * @see {@link Node} for an example.
   */
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A zero-length marker at the end of a lexer's reader region.
 * For embedded input this can precede the end of the complete source.
 * The node validates its length; the lexer validates its position.
 *
 * @example
 * ```ts
 * import { EndOfFileNode, SourceSpan } from "@noldova/context.parsers";
 *
 * const end = new EndOfFileNode(new SourceSpan(3, 0));
 * console.assert(end.span.isEmpty && end.span.startOffset === 3);
 * ```
 */
export declare class EndOfFileNode extends Node {
  /**
   * Creates an end marker, optionally carrying final trivia.
   *
   * @param span A zero-length absolute UTF-16 span at the reader's end.
   * @param leadingTrivia Optional trivia consumed before the end marker.
   * @param trailingTrivia Optional language-owned trailing trivia.
   * @throws {ArgumentException} If the span is not empty.
   * @see {@link EndOfFileNode} for an end marker.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * An immutable half-open source span with no source identity or retained text.
 * Offsets count UTF-16 code units, not Unicode code points. The span trusts
 * its arguments: the reader that creates spans during lexing guarantees them,
 * and a source or reader that accepts a span from elsewhere checks its bounds.
 *
 * @example
 * ```ts
 * import { SourceSpan } from "@noldova/context.parsers";
 *
 * const span = new SourceSpan(2, 3);
 * console.assert(span.endOffset === 5 && !span.isEmpty);
 * const empty = new SourceSpan(5, 0);
 * console.assert(empty.startOffset === empty.endOffset && empty.isEmpty);
 * ```
 */
export declare class SourceSpan {
  /**
   * The zero-based UTF-16 offset at which the span begins.
   */
  public readonly startOffset: number;

  /**
   * The number of UTF-16 code units in the span.
   */
  public readonly length: number;

  /**
   * The exclusive UTF-16 end offset.
   */
  public readonly endOffset: number;

  /**
   * True when the span has zero length.
   */
  public readonly isEmpty: boolean;

  /**
   * Creates an offset-only span.
   *
   * @param startOffset The absolute UTF-16 start.
   * @param length The number of UTF-16 code units.
   * @see {@link SourceSpan} for non-empty and empty spans.
   */
  public constructor(startOffset: number, length: number);
}

/**
 * Immutable metadata for one source line, excluding its line terminator from
 * the content span. The model does not retain a source or classify terminators.
 *
 * @example
 * ```ts
 * import { SourceLine } from "@noldova/context.parsers";
 *
 * const line = new SourceLine(0, 0, 3, 2); // "abc" followed by CRLF.
 * console.assert(line.length === 3 && line.lineBreakLength === 2);
 * ```
 */
export declare class SourceLine {
  /**
   * The zero-based index of the line within its source.
   */
  public readonly lineIndex: number;

  /**
   * The absolute UTF-16 offset at which the line begins.
   */
  public readonly startOffset: number;

  /**
   * The exclusive absolute offset of the line content, before its separator.
   */
  public readonly endOffset: number;

  /**
   * The number of UTF-16 code units occupied by the line separator.
   */
  public readonly lineBreakLength: 0 | 1 | 2;

  /**
   * The number of UTF-16 code units in the line, excluding its separator.
   */
  public readonly length: number;

  /**
   * Creates the metadata for one line.
   *
   * @param lineIndex The non-negative safe-integer zero-based line index.
   * @param startOffset The non-negative safe-integer absolute UTF-16 content start.
   * @param endOffset The safe-integer exclusive content end, no smaller than the start.
   * @param lineBreakLength The terminator width in UTF-16 code units: zero for none, otherwise one or two.
   * @throws {ArgumentOutOfRangeException} If the line index or content offsets are
   * invalid, including an end before the start.
   * @see {@link SourceLine} for CRLF metadata.
   */
  public constructor(lineIndex: number, startOffset: number, endOffset: number, lineBreakLength: 0 | 1 | 2);
}

/**
 * An immutable zero-based line and UTF-16 character coordinate.
 * This model validates the numbers; {@link SourceLineMap} checks whether the
 * position exists in a particular source.
 *
 * @see {@link SourceLineMap} for offset/position conversion.
 */
export declare class SourcePosition {
  /**
   * The zero-based line index.
   */
  public readonly lineIndex: number;

  /**
   * The zero-based UTF-16 character index from the start of the line.
   */
  public readonly characterIndex: number;

  /**
   * Creates line-relative coordinates without binding them to a source.
   *
   * @param lineIndex The non-negative safe-integer zero-based line index.
   * @param characterIndex The non-negative safe-integer UTF-16 offset from the line's start.
   * @throws {ArgumentOutOfRangeException} If either coordinate is negative or not a safe integer.
   * @see {@link SourceLineMap} for a conversion example.
   */
  public constructor(lineIndex: number, characterIndex: number);
}

/**
 * An immutable source buffer with an optional caller-supplied logical identity.
 * Offsets count UTF-16 code units. A source need not correspond to a file,
 * and this package neither resolves nor rewrites its identity.
 *
 * @example
 * ```ts
 * import { Source, SourceSpan } from "@noldova/context.parsers";
 *
 * const source = new Source("A😀B");
 * console.assert(source.identity === undefined && source.length === 4);
 * const view = source.getSpan(new SourceSpan(1, 2));
 * console.assert(view.toString() === "😀");
 * console.assert(source.getText(1, 2) === "😀");
 * console.assert(source.getText(new SourceSpan(4, 0)) === "");
 * ```
 */
export declare class Source {
  /**
   * The complete immutable source text.
   */
  public readonly content: string;

  /**
   * The caller-supplied canonical logical identity, when the source has one.
   */
  public readonly identity: string | undefined;

  /**
   * The number of UTF-16 code units in the source.
   */
  public readonly length: number;

  /**
   * Creates a complete source buffer without normalizing its content.
   *
   * @param content The exact input text, including any line terminators; empty input is valid.
   * @param identity Optional non-empty, non-whitespace logical identity; omitted for anonymous input.
   * @throws {ArgumentException} If a supplied identity is empty or whitespace-only.
   * @see {@link Source} for anonymous input and slicing.
   */
  public constructor(content: string, identity?: string);

  /**
   * Creates a view of a half-open range without copying its text.
   *
   * @param startOffset The non-negative safe-integer absolute UTF-16 start, up to the source length.
   * @param length The non-negative safe-integer width; the range must fit entirely in this source.
   * @returns A new {@link ReadOnlyStringSpan} retaining the source string,
   * including an empty view when length is zero.
   * @throws {InvalidSpanException} If either number or the resulting range is invalid.
   * @see {@link Source} for slicing examples.
   */
  public getSpan(startOffset: number, length: number): ReadOnlyStringSpan;

  /**
   * Creates a view of an existing offset-only span.
   *
   * @param span The absolute UTF-16 span, wholly contained in this source.
   * @returns A new view retaining the source string without copying its text;
   * an empty span at the source end is valid.
   * @throws {InvalidSpanException} If the span extends beyond this source.
   * @see {@link Source} for slicing examples.
   */
  public getSpan(span: SourceSpan): ReadOnlyStringSpan;

  /**
   * Returns the text selected by a half-open range.
   *
   * @param startOffset The non-negative safe-integer absolute UTF-16 start, up to the source length.
   * @param length The non-negative safe-integer width; the range must fit entirely in this source.
   * @returns The selected string, or an empty string for a zero-length range.
   * @throws {InvalidSpanException} If either number or the resulting range is invalid.
   * @see {@link Source} for slicing examples.
   */
  public getText(startOffset: number, length: number): string;

  /**
   * Returns the text selected by an offset-only span.
   *
   * @param span The absolute UTF-16 span, wholly contained in this source.
   * @returns The selected string; an empty span at the source end returns an empty string.
   * @throws {InvalidSpanException} If the span extends beyond this source.
   * @see {@link Source} for slicing examples.
   */
  public getText(span: SourceSpan): string;
}

/**
 * Maps one immutable source between absolute UTF-16 offsets and zero-based
 * line coordinates under the supplied line-terminator policy. Line metadata
 * is computed once at construction. An empty source has one
 * empty line; a trailing terminator introduces a final empty line.
 *
 * @example
 * ```ts
 * import { Source, SourceLineMap, SourcePosition } from "@noldova/context.parsers";
 * import { EcmaScriptLineTerminator } from "@noldova/context.text";
 *
 * const map = new SourceLineMap(new Source("a\r\nb\n"), new EcmaScriptLineTerminator());
 * console.assert(map.lineCount === 3 && map.getLineText(2) === "");
 * console.assert(map.getLineSpan(0).toString() === "a");
 * const position = map.getPosition(2); // The LF within CRLF belongs to line zero.
 * console.assert(position.lineIndex === 0 && position.characterIndex === 2);
 * console.assert(map.getOffset(position) === 2);
 * console.assert(map.getOffset(new SourcePosition(2, 0)) === 5); // End of source.
 * ```
 */
export declare class SourceLineMap {
  /**
   * Maps the lines of a source under its language's line-terminator policy.
   *
   * @param source The complete immutable source whose lines are mapped.
   * @param lineTerminator The policy used to identify terminator widths during construction.
   * @see {@link SourceLineMap} for a CRLF and trailing-line example.
   */
  public constructor(source: Source, lineTerminator: LineTerminator);

  /**
   * The number of lines. An empty source contains one empty line.
   */
  public get lineCount(): number;

  /**
   * Line metadata in source order under the selected terminator rules.
   */
  public readonly lines: readonly SourceLine[];

  /**
   * Creates a view of one line's content, excluding its terminator.
   *
   * @param lineIndex The zero-based safe-integer index of an existing line.
   * @returns A new view retaining the source string; empty lines produce empty views.
   * @throws {LineOutOfBoundsException} If the index is invalid or no such line exists.
   * @see {@link SourceLineMap} for line access examples.
   */
  public getLineSpan(lineIndex: number): ReadOnlyStringSpan;

  /**
   * Returns one line's content without its terminator.
   *
   * @param lineIndex The zero-based safe-integer index of an existing line.
   * @returns The line text, or an empty string for an empty line.
   * @throws {LineOutOfBoundsException} If the index is invalid or no such line exists.
   * @see {@link SourceLineMap} for line access examples.
   */
  public getLineText(lineIndex: number): string;

  /**
   * Converts an absolute UTF-16 offset to zero-based line coordinates.
   *
   * @param offset A safe-integer offset from zero through the complete source length, inclusive.
   * @returns A new position. Terminator code units belong to the line they end;
   * the source end is representable, including the final empty line when present.
   * @throws {InvalidOffsetException} If the offset is invalid or outside the source.
   * @see {@link SourceLineMap} for CRLF and end-position examples.
   */
  public getPosition(offset: number): SourcePosition;

  /**
   * Converts line coordinates to an absolute UTF-16 offset.
   *
   * @param position An existing line and character position. The character index
   * may address a terminator code unit or the end of the final line, but not the next line.
   * @returns The absolute source offset, including the source end when selected.
   * @throws {LineOutOfBoundsException} If the line does not exist.
   * @throws {ArgumentOutOfRangeException} If the character index extends beyond the selected line's permitted positions.
   * @see {@link SourceLineMap} for round-trip conversion.
   */
  public getOffset(position: SourcePosition): number;
}

/**
 * A mutable UTF-16 cursor over an immutable source or a bounded source region.
 * Offsets and spans remain absolute within the complete source. End-of-input
 * means this reader's end, not necessarily the complete source's end. Reads at
 * the end return the null character and code point 0 instead of a separate
 * marker, so a lexer compares characters only; because a null character is
 * also ordinary input, {@link SourceReader.isAtEnd} decides where that
 * matters. Positions handed back to the reader, through seek, advance, a
 * relative peek, or span creation, come from the reader itself and are not
 * validated again; the constructor validates the region it is given.
 * Language-specific trivia recognition belongs to the language lexer.
 *
 * @example
 * ```ts
 * import { Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
 *
 * const reader = new SourceReader(new Source("xA😀By"), new SourceSpan(1, 4));
 * console.assert(reader.peekCodeUnit() === "A");
 * console.assert(reader.peekCodeUnit(-1) === "\0"); // Before the region.
 * console.assert(reader.readCodeUnit() === "A");
 * console.assert(reader.peekCodePoint() === 0x1F600);
 * console.assert(reader.readCodePoint() === 0x1F600 && reader.currentOffset === 4);
 * console.assert(reader.startsWith("B") && !reader.startsWith("By"));
 * console.assert(reader.peekWhile(t => t === "B").toString() === "B");
 * console.assert(reader.readUntil(t => t === "B").toString() === "");
 * console.assert(reader.readWhile(t => t === "B").toString() === "B");
 * console.assert(reader.isAtEnd && reader.readCodeUnit() === "\0");
 * reader.seek(1);
 * reader.advance(100); // Stops at region end (5), not source end (6).
 * console.assert(reader.currentOffset === 5);
 * console.assert(reader.createSpan(1, 4).endOffset === 5);
 * console.assert(reader.createSpan(new SourceSpan(1, 1), new SourceSpan(4, 1)).length === 4);
 * ```
 */
export declare class SourceReader {
  /**
   * The absolute exclusive end offset of this reader's source region.
   */
  public readonly endOffset: number;

  /**
   * The immutable source traversed by this reader.
   */
  public readonly source: Source;

  /**
   * The absolute start offset of this reader's source region.
   */
  public readonly startOffset: number;

  /**
   * Creates a reader at the start of the complete source or a bounded region.
   *
   * @param source The immutable buffer to traverse.
   * @param span Optional contained absolute UTF-16 region; omitted to use the complete source.
   * @throws {InvalidSpanException} If the region extends beyond the source.
   * @see {@link SourceReader} for bounded navigation.
   */
  public constructor(source: Source, span?: SourceSpan);

  /**
   * The current zero-based UTF-16 offset.
   */
  public get currentOffset(): number;

  /**
   * True when the cursor is at the end of the reader's source region.
   */
  public get isAtEnd(): boolean;

  /**
   * Reads the current UTF-16 code unit without moving the cursor.
   *
   * @returns A one-code-unit string, including a lone surrogate or null character;
   * the null character at the reader's end.
   * @see {@link SourceReader} for bounded navigation.
   */
  public peekCodeUnit(): string;

  /**
   * Reads a Unicode code point without moving the cursor.
   *
   * @returns A numeric code point; 0 at the reader's end. Valid
   * surrogate pairs combine only when both code units are inside the region;
   * isolated surrogates return their code-unit values.
   * @see {@link SourceReader} for a supplementary character.
   */
  public peekCodePoint(): number;

  /**
   * Reads a code unit at a relative offset without moving the cursor.
   *
   * @param relativeOffset A UTF-16 distance from the cursor; negative values look backward.
   * @returns A one-code-unit string; the null character outside the reader's region.
   * @see {@link SourceReader} for a lookup before the region.
   */
  public peekCodeUnit(relativeOffset: number): string;

  /**
   * Reads one UTF-16 code unit and advances when input remains.
   *
   * @returns A one-code-unit string. At the reader's end returns the null
   * character without moving.
   * @see {@link SourceReader} for bounded consumption.
   */
  public readCodeUnit(): string;

  /**
   * Reads a Unicode code point and advances by its UTF-16 width.
   *
   * @returns A numeric code point; paired surrogates consume two code units and
   * isolated surrogates consume one. Pairs never cross the region boundary.
   * At the reader's end returns 0 without moving.
   * @see {@link SourceReader} for a supplementary character.
   */
  public readCodePoint(): number;

  /**
   * Moves forward, stopping at this reader's end.
   *
   * @param count The non-negative UTF-16 distance; defaults to one. Zero leaves
   * the cursor unchanged, and a larger distance is clamped to the region end.
   * @see {@link SourceReader} for clamped movement.
   */
  public advance(count?: number): void;

  /**
   * Moves directly to an absolute position in this reader's region.
   *
   * @param offset A UTF-16 offset between startOffset and endOffset, inclusive,
   * previously observed from this reader or from a span it created.
   * @see {@link SourceReader} for repositioning.
   */
  public seek(offset: number): void;

  /**
   * Checks the text at the cursor without moving or crossing the region boundary.
   *
   * @param text The exact UTF-16 sequence to match; an empty string matches even at the reader's end.
   * @returns True if the complete sequence fits and matches at the cursor; otherwise false.
   * @see {@link SourceReader} for matches at the bounded end.
   */
  public startsWith(text: string): boolean;

  /**
   * Consumes code units while the predicate accepts them.
   *
   * @param predicate A synchronous code-unit predicate; true consumes the current unit.
   * It must not reposition this reader. It is not called at the reader's end.
   * @returns A new view of the consumed text, retaining the source string;
   * an initial rejection or exhausted reader yields an empty view.
   * @remarks Predicate exceptions propagate, retaining progress already made.
   * @see {@link SourceReader} for scanning examples.
   */
  public readWhile(predicate: (character: string) => boolean): ReadOnlyStringSpan;

  /**
   * Consumes code units until the predicate identifies a stopping unit.
   *
   * @param predicate A synchronous code-unit predicate; true stops before consuming that unit.
   * It must not reposition this reader. It is not called at the reader's end.
   * @returns A new view of the consumed text, excluding the stopping unit and
   * retaining the source string. An immediate match yields an empty view.
   * @remarks Predicate exceptions propagate, retaining progress already made.
   * @see {@link SourceReader} for a stopping unit left unconsumed.
   */
  public readUntil(predicate: (character: string) => boolean): ReadOnlyStringSpan;

  /**
   * Scans matching code units without moving the cursor.
   *
   * @param predicate A synchronous code-unit predicate; true includes the unit.
   * It must not reposition this reader. It is not called beyond the region.
   * @returns A new source-string view of the matching prefix, empty on immediate
   * rejection or at the reader's end. The cursor remains unchanged.
   * @remarks Predicate exceptions propagate without navigation by this method.
   * @see {@link SourceReader} for a non-consuming scan.
   */
  public peekWhile(predicate: (character: string) => boolean): ReadOnlyStringSpan;

  /**
   * Creates an offset-only span contained in this reader's region without moving.
   *
   * @param startOffset The absolute UTF-16 start, inside this reader's region.
   * @param length The width of the span, ending inside this reader's region.
   * @returns A new {@link SourceSpan}; zero-length spans at either region boundary are valid.
   * @see {@link SourceReader} for a bounded span.
   */
  public createSpan(startOffset: number, length: number): SourceSpan;

  /**
   * Creates a span from the first span's start to the second span's end.
   * This uses those two endpoints; it does not compute a union of arbitrary spans.
   *
   * @param startSpan Supplies the absolute UTF-16 start offset.
   * @param endSpan Supplies the exclusive end offset, which must not precede the selected start.
   * @returns A new offset-only span contained in this reader's region, without moving the cursor.
   * @see {@link SourceReader} for endpoint-based span construction.
   */
  public createSpan(startSpan: SourceSpan, endSpan: SourceSpan): SourceSpan;
}

/**
 * Collects diagnostic occurrences for one source in production order.
 * Lexing and parsing share this collector; published parser results copy
 * the sequence, not the individual diagnostics.
 *
 * @example
 * ```ts
 * import { DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticTemplate } from "@noldova/context.diagnostics";
 * import { DiagnosticCollector, Source, SourceSpan } from "@noldova/context.parsers";
 *
 * const collector = new DiagnosticCollector(new Source("x", "sample.ts"));
 * const template = new DiagnosticTemplate(
 *   new DiagnosticCode(DiagnosticAuthority.context, 1), DiagnosticCategory.Error, "Expected {0}.");
 * collector.add(template, new SourceSpan(0, 1), ["name"]);
 * console.assert(collector.diagnostics[0]?.message.text === "Expected name.");
 * console.assert(collector.diagnostics[0]?.location?.sourceIdentity === "sample.ts");
 * const occurrence = template.create(undefined, ["value"]);
 * collector.add(occurrence);
 * const view = collector.diagnostics;
 * collector.truncate(1);
 * console.assert(view.length === 1); // Live view, not a snapshot.
 * ```
 */
export declare class DiagnosticCollector {
  /**
   * Associates template-based diagnostics with one source.
   *
   * @param source The immutable source supplying logical identity and bounds.
   * @see {@link DiagnosticCollector} for positioned and prebuilt diagnostics.
   */
  public constructor(source: Source);

  /**
   * A read-only view of the current sequence. It reflects later additions and
   * lookahead rollback; it is not a published snapshot.
   */
  public get diagnostics(): readonly Diagnostic[];

  /**
   * Appends an existing occurrence without changing its location or identity.
   *
   * @param diagnostic The complete occurrence to retain; repeated occurrences are not deduplicated.
   * @see {@link DiagnosticCollector} for appending an unpositioned occurrence.
   */
  public add(diagnostic: Diagnostic): void;

  /**
   * Creates and appends a positioned occurrence from a reusable template.
   *
   * @param template The diagnostic code, category, message template, and default tags.
   * @param span The absolute UTF-16 location, wholly contained in the collector's source.
   * @param messageArguments Ordered values for numbered message placeholders; defaults to an empty sequence.
   * @throws {ArgumentOutOfRangeException} If the span extends beyond the source.
   * @throws {ArgumentException} If formatting produces an empty or whitespace-only message.
   * @remarks Message formatting and occurrence construction follow {@link DiagnosticTemplate.create}.
   * @see {@link DiagnosticCollector} for a positioned diagnostic.
   */
  public add(template: DiagnosticTemplate, span: SourceSpan, messageArguments?: readonly (string | number)[]): void;

  /**
   * Removes occurrences at and after a sequence index.
   *
   * @param count The number of occurrences to retain, previously observed as the
   * sequence length. A value at or beyond the current length leaves the sequence unchanged.
   * @see {@link DiagnosticCollector} for truncation of a live view.
   */
  public truncate(count: number): void;
}

/**
 * Shared grammar state for one parsing operation. It owns the diagnostic
 * sequence the parser publishes; derived contexts add grammar state and
 * recognition caches, and grammar services belong to the syntax parser.
 * Tentative parsing does not snapshot added fields.
 *
 * @see {@link Parser} for a lexer-backed session.
 */
export declare class ParserContext {
  /**
   * The diagnostics reported so far, in production order: the lexer reports
   * into it as it lexes, and the grammar reports into it as it parses.
   */
  public readonly diagnosticCollector: DiagnosticCollector;

  /**
   * The source being parsed, for grammar code that reads its text without
   * reaching through the lexer's reader.
   */
  public readonly source: Source;

  /**
   * Creates the diagnostic sequence for a source.
   *
   * @param source The immutable source being parsed; its identity positions every diagnostic.
   * @see {@link Parser} for session construction.
   */
  public constructor(source: Source);
}

/**
 * Shared execution for top-level language lexers. A lexer owns its reader,
 * checks progress and end-marker invariants, and reports lexical diagnostics
 * into the parser context's collector as it lexes. Language lexers recognize
 * tokens and keep any lexical mode as their own fields.
 *
 * @see {@link Parser} for a complete lexer and parser example.
 */
export declare abstract class Lexer {
  /**
   * The collector lexical diagnostics are reported into: the same one the
   * parser context publishes, so a lexical diagnostic is visible the moment
   * its node is lexed.
   */
  public readonly diagnosticCollector: DiagnosticCollector;

  /**
   * The cursor over the source region being lexed. The parser rewinds it
   * during tentative parsing and contextual re-lexing.
   */
  public readonly reader: SourceReader;

  /**
   * Positions the lexer at the start of a source, or at a caller's reader, and
   * binds it to the collector its diagnostics go to.
   *
   * @param sourceOrReader The complete immutable source to tokenize from its start,
   * or the caller's reader with its region bounds and current offset. Navigation
   * is then shared with the caller; construction does not move it.
   * @param diagnosticCollector The parser context's collector for this parsing operation.
   * @see {@link Parser} for a concrete lexer.
   */
  protected constructor(sourceOrReader: Source | SourceReader, diagnosticCollector: DiagnosticCollector);

  /**
   * Produces the next node through {@link Lexer.lexNode}.
   *
   * @returns The recognized node. Diagnostics reported by the scan are already
   * in the collector when it returns.
   * @throws {ParserException} If the scan fails to advance without producing a
   * valid end marker, or reports an end marker away from the reader's end.
   * @remarks Exceptions from the concrete lexer propagate; this operation alone
   * does not roll back reader movement or diagnostics.
   * @see {@link Parser} for a concrete lexer.
   */
  public lex(): Node;

  /**
   * Recognizes the next node within a top-level lexical operation.
   *
   * @returns The recognized node, or an end marker at the reader's current end.
   * @remarks Consume input through {@link Lexer.reader} and report lexical
   * diagnostics through {@link Lexer.diagnosticCollector}.
   * @see {@link Parser} for an override.
   */
  protected abstract lexNode(): Node;

  /**
   * Lexes using the supplied scanning operation under the invariants applied to
   * ordinary lexing. A language's contextual re-lexing routine calls this so a
   * replacement scan is validated exactly like the scan it replaces.
   *
   * @param action The synchronous scan producing one immutable node from the
   * reader's current offset, with any lexical mode already selected by the caller.
   * @returns The node produced by the action.
   * @throws {ParserException} If progress or end-marker invariants are violated.
   * @remarks Action exceptions propagate without rollback by this method.
   * @see {@link Parser} for ordinary lexing through this execution boundary.
   */
  protected lexWith(action: () => Node): Node;
}

/**
 * The published result of one parser operation.
 * TNode is the language's root node type. The diagnostic array is an independent
 * snapshot; its occurrences and the root node are shared immutable objects.
 *
 * @example
 * ```ts
 * import type { Diagnostic } from "@noldova/context.diagnostics";
 * import { LiteralNode, ParserResult, SourceSpan } from "@noldova/context.parsers";
 *
 * class TextLiteralNode extends LiteralNode {
 *   public constructor(value: string, span: SourceSpan) {
 *     super(value, span);
 *   }
 * }
 * const diagnostics: Diagnostic[] = [];
 * const root = new TextLiteralNode("a", new SourceSpan(0, 1));
 * const result = new ParserResult(root, diagnostics);
 * console.assert(result.rootNode === root);
 * console.assert(result.diagnostics !== diagnostics && result.diagnostics.length === 0);
 * ```
 */
export declare class ParserResult<TNode extends Node> {
  /**
   * The diagnostics in production order.
   */
  public readonly diagnostics: readonly Diagnostic[];

  /**
   * The root of the produced syntax tree.
   */
  public readonly rootNode: TNode;

  /**
   * Publishes a root with an independent diagnostic sequence.
   *
   * @param rootNode The complete immutable root for the operation's declared scope.
   * @param diagnostics Occurrences in production order; the sequence is shallow-copied.
   * @see {@link ParserResult} for snapshot and node-sharing behavior.
   */
  public constructor(rootNode: TNode, diagnostics: readonly Diagnostic[]);
}

/**
 * Shared execution for language syntax parsers.
 * TNode is the language's root node type and TContext its grammar context.
 * The parser holds one current node: it advances by lexing the next node, and
 * it rewinds by restoring the current node, the reader offset, and the length
 * of the diagnostic sequence, which the lexer and the grammar share. It keeps
 * no token cache and no parse memoization, so a rewound region is lexed again.
 *
 * Token navigation is the surface language syntax parsers inherit and share
 * with their grammar drivers; a language's public facade exposes input and
 * results instead of inheriting this surface.
 *
 * @example
 * ```ts
 * import { DiagnosticCollector, EndOfFileNode, Lexer, LiteralNode, Node, Parser, ParserContext, Source, SourceSpan } from "@noldova/context.parsers";
 *
 * class TextLiteralNode extends LiteralNode {
 *   public constructor(value: string, span: SourceSpan) {
 *     super(value, span);
 *   }
 * }
 * class TextLexer extends Lexer {
 *   public constructor(source: Source, diagnosticCollector: DiagnosticCollector) {
 *     super(source, diagnosticCollector);
 *   }
 *
 *   protected override lexNode(): Node {
 *     const startOffset = this.reader.currentOffset;
 *     if (this.reader.isAtEnd)
 *       return new EndOfFileNode(new SourceSpan(startOffset, 0));
 *
 *     const text = this.reader.readWhile(() => true).toString();
 *     return new TextLiteralNode(text, new SourceSpan(startOffset, text.length));
 *   }
 * }
 * class TextParser extends Parser<LiteralNode> {
 *   public constructor(context: ParserContext, lexer: TextLexer) {
 *     super(context, lexer);
 *   }
 *
 *   protected override parseRootNode(): LiteralNode {
 *     const root = this.requireCurrentNode(LiteralNode);
 *     this.advance();
 *     return root;
 *   }
 * }
 * const source = new Source("text");
 * const node = new TextLexer(source, new DiagnosticCollector(source)).lex();
 * console.assert(node.span.startOffset === 0 && node.span.length === 4);
 * const context = new ParserContext(source);
 * const parser = new TextParser(context, new TextLexer(source, context.diagnosticCollector));
 * console.assert(parser.lookAhead(() => {
 *   parser.advance();
 *   return parser.isEndOfFile;
 * }));
 * const rejected = parser.tryParse(() => {
 *   parser.advance();
 *   return undefined;
 * });
 * console.assert(rejected === undefined && parser.currentNode instanceof LiteralNode);
 * console.assert(parser.tryConsume(EndOfFileNode) === undefined);
 * const result = parser.parse();
 * console.assert(result.rootNode.value === "text" && parser.isEndOfFile);
 * // The result remains usable; this parser cannot start another parse.
 * ```
 */
export declare abstract class Parser<TNode extends Node, TContext extends ParserContext = ParserContext> {
  /**
   * The shared context for this parsing operation.
   */
  public readonly context: TContext;

  /**
   * Starts a session by lexing its first node.
   *
   * @param context The grammar context whose collector publishes every diagnostic.
   * @param lexer The fully initialized token producer positioned where parsing
   * starts and reporting into that same collector.
   * @throws {ParserException} If the lexer reports into another collector,
   * which would keep its diagnostics out of the published result.
   * @remarks Lexical exceptions propagate during construction. The first scan
   * may advance the reader before construction completes.
   * @see {@link Parser} for a concrete syntax driver.
   */
  protected constructor(context: TContext, lexer: Lexer);

  /**
   * The node the parser is positioned on. The reader stands immediately after it.
   */
  public get currentNode(): Node;

  /**
   * True when the current node is an {@link EndOfFileNode}.
   */
  public get isEndOfFile(): boolean;

  /**
   * Parses the complete region and publishes its root and diagnostics.
   *
   * @returns The root node produced by {@link Parser.parseRootNode} with an
   * independent snapshot of the diagnostics reported for this source.
   * @throws {ParserException} If this parser has already parsed, or if input
   * remains after the root node.
   * @remarks Exceptions from the language's root parser propagate unchanged.
   * @see {@link Parser} for a complete session.
   */
  public parse(): ParserResult<TNode>;

  /**
   * Lexes the next node and positions the parser on it. At the end of input
   * the parser stays on its end marker.
   *
   * @throws {ParserException} If the lexer violates a progress or end-marker invariant.
   * @see {@link Parser} for ordinary consumption.
   */
  public advance(): void;

  /**
   * Consumes the current node when it has the requested type.
   * TCurrentNode is the instance type established by a successful check.
   *
   * @param type The required node class identity; abstract base classes are valid.
   * @returns The consumed node, leaving the parser on the following node, or
   * undefined with the position unchanged.
   * @throws {ParserException} If advancing violates a lexer invariant.
   * @see {@link Parser} for a rejected consumption.
   */
  public tryConsume<TCurrentNode extends Node>(type: NodeType<TCurrentNode>): TCurrentNode | undefined;

  /**
   * Requires the current node's type without consuming it.
   * TCurrentNode is the instance type established by a successful check.
   *
   * @param type The node class identity required by the recognized grammar branch.
   * @returns The current node, narrowed to the requested type.
   * @throws {ParserException} If the current node has another type, which
   * indicates a grammar implementation error rather than invalid source.
   * @see {@link Parser} for a required root node.
   */
  public requireCurrentNode<TCurrentNode extends Node>(type: NodeType<TCurrentNode>): TCurrentNode;

  /**
   * Runs a test that may move the parser, then always rewinds.
   *
   * @param action The synchronous test returning its recognition decision.
   * @returns The value returned by the test.
   * @throws {ParserException} If lexing during the test violates an invariant.
   * @remarks The current node, the reader offset, and the diagnostic sequence
   * are restored, including when the test throws; the exception then
   * propagates. Fields added by a language's lexer or parser context are not
   * restored, and nodes built during the test are discarded by the caller.
   * @see {@link Parser} for a lookahead that inspects the following node.
   */
  public lookAhead(action: () => boolean): boolean;

  /**
   * Runs a tentative interpretation, keeping its work only when it succeeds.
   * TResult is the language's accepted interpretation.
   *
   * @param action The synchronous callback returning a parsed result, or
   * undefined when the interpretation does not apply.
   * @returns The accepted result, including false, zero, or null, or undefined
   * after rejection and rewind.
   * @throws {ParserException} If lexing during the attempt violates an invariant.
   * @remarks A rejected or throwing attempt rewinds under {@link Parser.lookAhead}'s
   * obligations; a callback exception then propagates.
   * @see {@link Parser} for a rejected attempt.
   */
  public tryParse<TResult>(action: () => TResult | undefined): TResult | undefined;

  /**
   * Rewinds to the current node's start and replaces it through contextual
   * lexing, for a language whose token depends on the grammar position, such
   * as a slash that begins a regular expression rather than a division.
   *
   * @param lex The synchronous contextual scan producing the replacement node
   * from the rewound reader. Establish any required lexical mode before scanning,
   * and route the scan through {@link Lexer.lexWith} to keep its invariants.
   * @throws {ParserException} If the replacement scan violates a lexer invariant.
   * @remarks Nothing already reported is removed: the replacement scan reports
   * its own diagnostics after them, and a language whose scans could repeat a
   * diagnostic at the same position applies its own suppression rule, as
   * TypeScript does. Lexer exceptions propagate; this method alone does not
   * restore a failed scan.
   * @see {@link Parser} for the lexer and parser execution boundary.
   */
  protected reLexCurrentNode(lex: () => Node): void;

  /**
   * Parses the root through language-owned grammar and recovery.
   *
   * @returns The immutable root for this reader's region. The current node must
   * be an end marker before returning so {@link Parser.parse} can publish.
   * @remarks Diagnose invalid source and recover according to the language.
   * Implementation exceptions propagate through {@link Parser.parse}.
   * @see {@link Parser} for a root-parser override.
   */
  protected abstract parseRootNode(): TNode;
}
