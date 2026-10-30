/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

/**
 * The semantic category of a diagnostic. Category is part of diagnostic
 * identity; no formatter, consumer, or later phase may rewrite it.
 * The producer selects it from its catalog, not from display preferences.
 */
export declare enum DiagnosticCategory {
  /**
   * A condition that prevents the requested operation from succeeding.
   */
  Error = "Error",

  /**
   * A condition that deserves attention but does not prevent success.
   */
  Warning = "Warning",

  /**
   * A non-failing recommendation for improving the source.
   */
  Suggestion = "Suggestion",

  /**
   * Informational diagnostic output without an error or warning condition.
   */
  Message = "Message",
}

/**
 * One diagnostic-code namespace and the prefix used to display its codes.
 * Authorities are closed canonical identities rather than arbitrary strings.
 * Use the shared instances; callers cannot construct or register an authority.
 *
 * @example
 * ```ts
 * DiagnosticAuthority.context.codePrefix; // "CTX"
 * DiagnosticAuthority.typeScript.codePrefix; // "TS"
 * ```
 */
export declare class DiagnosticAuthority {
  /**
   * The shared CONTEXT-owned diagnostic-code namespace, displayed with `CTX`.
   */
  public static readonly context: DiagnosticAuthority;

  /**
   * The shared upstream TypeScript diagnostic-code namespace, displayed with `TS`.
   */
  public static readonly typeScript: DiagnosticAuthority;

  /**
   * The canonical prefix placed before a numeric code in display text. It is
   * presentation data owned by the authority, not a separately registered identity.
   */
  public readonly codePrefix: string;

  private constructor(codePrefix: string);
}

/**
 * An immutable code pairing a canonical authority with a positive safe integer.
 * The producer supplies the exact upstream TypeScript number or a registered
 * CONTEXT number from its allocated range. Construction validates the numeric
 * value only; it does not allocate codes or check catalog membership or uniqueness.
 */
export declare class DiagnosticCode {
  /**
   * The namespace that owns the numeric code.
   */
  public readonly authority: DiagnosticAuthority;

  /**
   * The display form: the authority prefix followed by the value, such as
   * `TS2304` or `CTX1001`.
   */
  public readonly displayText: string;

  /**
   * The positive safe integer assigned by the owning authority.
   */
  public readonly value: number;

  /**
   * Creates a code in the supplied authority's namespace.
   *
   * @param authority The canonical namespace that owns the numeric code.
   * @param value The assigned integer, from 1 through `Number.MAX_SAFE_INTEGER`
   * inclusive. Zero is not a valid code or an absence marker.
   * @throws {ArgumentOutOfRangeException} If `value` is nonpositive, fractional,
   * non-finite, or outside the safe integer range. The exception identifies
   * `value` and retains the rejected number as `actualValue`.
   * @example
   * ```ts
   * import { DiagnosticAuthority, DiagnosticCode } from "@noldova/context.diagnostics";
   *
   * const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2304);
   * code.displayText; // "TS2304"
   * ```
   */
  public constructor(authority: DiagnosticAuthority, value: number);
}

/**
 * One diagnostic location: an optional canonical source identity and one exact
 * UTF-16 span. The span is half-open: `[start, start + length)`. Zero-length
 * spans, including an end-of-file span, are valid. Line and character
 * coordinates are derived presentation and are never stored here.
 */
export declare class DiagnosticLocation {
  /**
   * The caller-supplied canonical logical source identity, preserved verbatim.
   * `undefined` represents anonymous input; no path or synthetic name is inferred.
   */
  public readonly sourceIdentity: string | undefined;

  /**
   * The zero-based UTF-16 offset at which the span begins.
   */
  public readonly start: number;

  /**
   * The number of UTF-16 code units in the span.
   */
  public readonly length: number;

  /**
   * Creates a source span, optionally checking it against a known source length.
   *
   * @param sourceIdentity The canonical logical identity supplied by the input
   * owner, or `undefined` for anonymous text. A supplied identity must be nonblank;
   * it is not trimmed, resolved as a path, or otherwise canonicalized here.
   * @param start The zero-based UTF-16 code-unit offset. It must be a non-negative
   * safe integer, and `start + length` must also be a safe integer.
   * @param length The number of UTF-16 code units covered, as a non-negative safe
   * integer. Zero describes a position without covering a character, including EOF.
   * @param sourceLength The source snapshot's UTF-16 length, as a non-negative
   * safe integer. When supplied, the span end must not exceed it. It is used only
   * for validation and is not retained; omission leaves the upper bound unchecked.
   * @throws {ArgumentException} If a supplied source identity is empty or whitespace-only.
   * @throws {ArgumentOutOfRangeException} If a numeric argument is negative,
   * fractional, non-finite, or unsafe, the span end is unsafe, or the span exceeds
   * `sourceLength`. Span-end failures identify `length`; individual numeric
   * failures identify the offending argument and retain its value.
   * @example
   * ```ts
   * const text = "A\u{1F600}B";
   * const character = new DiagnosticLocation(undefined, 1, 2, text.length);
   * text.slice(character.start, character.start + character.length); // "\u{1F600}"
   * const end = new DiagnosticLocation("sample.ts", text.length, 0, text.length);
   * end.length; // 0: an end-of-file position.
   * const empty = new DiagnosticLocation(undefined, 0, 0, 0);
   * empty.sourceIdentity; // undefined: an empty anonymous source.
   * ```
   */
  public constructor(sourceIdentity: string | undefined, start: number, length: number, sourceLength?: number);
}

/**
 * A structured marker applicable to a diagnostic. A tag is complete at
 * creation and is never inferred later from message wording.
 * Tags do not replace or change {@link DiagnosticCategory}.
 */
export declare enum DiagnosticTag {
  /**
   * The diagnosed source is unnecessary.
   */
  Unnecessary = "Unnecessary",

  /**
   * The diagnosed source refers to a deprecated API or construct.
   */
  Deprecated = "Deprecated",
}

/**
 * One canonical message node: its code, category, canonical English text,
 * and ordered children. A nested message chain is a tree of these nodes;
 * child order is preserved exactly. Flattening the chain into one string is
 * a presentation concern and never a substitute for this structure.
 */
export declare class DiagnosticMessage {
  /**
   * The diagnostic code carried by this message node.
   */
  public readonly code: DiagnosticCode;

  /**
   * The semantic category carried by this message node.
   */
  public readonly category: DiagnosticCategory;

  /**
   * The complete nonblank canonical English text of this node, preserved
   * verbatim. It is not a deferred template or a flattened message chain.
   */
  public readonly text: string;

  /**
   * A shallow snapshot of the ordered child sequence. Child instances are
   * shared, not cloned; neither duplicate entries nor their order are changed.
   */
  public readonly children: readonly DiagnosticMessage[];

  /**
   * Creates one node in a structured message chain.
   *
   * @param code The code for this node, which may differ from its parent's code.
   * @param category This node's category; it is not inherited from a parent.
   * @param text The already formatted canonical text. It must contain at least
   * one non-whitespace character and is stored without trimming or reformatting.
   * @param children The ordered detail nodes, or an empty array for a leaf.
   * The array is copied; the child objects and their nested chains are retained.
   * @throws {ArgumentException} If `text` is empty or whitespace-only.
   * @example
   * ```ts
   * const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2322);
   * const detail = new DiagnosticMessage(code, DiagnosticCategory.Error,
   *   "Type 'string' is not assignable to type 'number'.", []);
   * const message = new DiagnosticMessage(code, DiagnosticCategory.Error,
   *   "The assignment is invalid.", [detail]);
   * message.children[0] === detail; // true: the array is copied, not the detail.
   * ```
   */
  public constructor(code: DiagnosticCode, category: DiagnosticCategory, text: string, children: readonly DiagnosticMessage[]);
}

/**
 * One related record of a diagnostic, preserved independently: its message
 * node and its optional location. The code and category are those of the
 * message node. Related information is never appended to the primary
 * message and never discarded by a formatter that does not display it.
 */
export declare class DiagnosticRelatedInformation {
  /**
   * The retained related message, including its independent code, category,
   * and any nested details.
   */
  public readonly message: DiagnosticMessage;

  /**
   * The related source location, when the information is source-bound.
   */
  public readonly location: DiagnosticLocation | undefined;

  /**
   * Pairs a related message with its optional source location.
   *
   * @param message The complete related message, not text to append to the
   * primary diagnostic. Its identity and message chain are retained unchanged.
   * @param location The related span, or `undefined` for information that is
   * not source-bound. It need not use the primary diagnostic's source identity.
   * @example
   * ```ts
   * const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2728);
   * const message = new DiagnosticMessage(code, DiagnosticCategory.Error,
   *   "'value' is declared here.", []);
   * const related = new DiagnosticRelatedInformation(message,
   *   new DiagnosticLocation("sample.ts", 3, 4));
   * related.message === message; // true
   * ```
   */
  public constructor(message: DiagnosticMessage, location: DiagnosticLocation | undefined);
}

/**
 * One complete reported diagnostic occurrence. A constructor establishes a
 * completely valid object; no consumer attaches, repairs, or replaces
 * fields after creation. The code and category are derived from the primary
 * message node, so one authority exists by construction.
 */
export declare class Diagnostic {
  /**
   * The primary message node of this occurrence.
   */
  public readonly message: DiagnosticMessage;

  /**
   * The code of the primary message node.
   */
  public readonly code: DiagnosticCode;

  /**
   * The category of the primary message node.
   */
  public readonly category: DiagnosticCategory;

  /**
   * The primary source location, when the occurrence is source-bound.
   */
  public readonly location: DiagnosticLocation | undefined;

  /**
   * A shallow snapshot of related records in their canonical order. The
   * records themselves are shared; repeated records are preserved.
   */
  public readonly relatedInformation: readonly DiagnosticRelatedInformation[];

  /**
   * A snapshot of the supplied tags in order, with no duplicates. These tags
   * do not change the occurrence's code or category.
   */
  public readonly tags: readonly DiagnosticTag[];

  /**
   * Publishes one complete occurrence from a primary message and its context.
   *
   * @param message The complete primary message or message-chain root. Its code
   * and category also become the occurrence's code and category; it is not cloned.
   * @param location The primary source span, or `undefined` for a global or
   * non-text diagnostic. An anonymous source still supplies a location with an
   * undefined source identity, rather than discarding its span.
   * @param relatedInformation Ordered related records, or an empty array.
   * The array is copied, retaining its elements, order, and repeated entries.
   * @param tags The final ordered tags, or an empty array. The array is copied;
   * every tag must occur at most once. No tags are inferred from the message.
   * @throws {ArgumentException} If `tags` contains a duplicate.
   * @example
   * ```ts
   * const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2304);
   * const message = new DiagnosticMessage(code, DiagnosticCategory.Error,
   *   "Cannot find name 'value'.", []);
   * const diagnostic = new Diagnostic(message,
   *   new DiagnosticLocation(undefined, 12, 5), [], []);
   * diagnostic.code === message.code; // true
   * diagnostic.location?.sourceIdentity; // undefined: anonymous, not unlocated.
   * ```
   */
  public constructor(
    message: DiagnosticMessage,
    location: DiagnosticLocation | undefined,
    relatedInformation: readonly DiagnosticRelatedInformation[],
    tags: readonly DiagnosticTag[]);
}

/**
 * One reusable, immutable diagnostic template owned by a producer catalog.
 * A template is not itself a reported diagnostic, and an occurrence cannot
 * be reused as a template.
 */
export declare class DiagnosticTemplate {
  /**
   * The code assigned to every occurrence created from this template.
   */
  public readonly code: DiagnosticCode;

  /**
   * The category assigned to every occurrence created from this template.
   */
  public readonly category: DiagnosticCategory;

  /**
   * The nonblank canonical positional template, using Core's
   * {@link StringConstructor.format} placeholder convention.
   */
  public readonly messageTemplate: string;

  /**
   * A snapshot of the default tags, applied in this order before occurrence
   * tags. The array contains no duplicates and is unchanged by creating occurrences.
   */
  public readonly defaultTags: readonly DiagnosticTag[];

  /**
   * Creates a reusable catalog definition without reporting a diagnostic.
   *
   * @param code The producer-assigned code shared by all created occurrences.
   * Catalog membership and allocation are the producer's responsibility.
   * @param category The category applied to every occurrence without reinterpretation.
   * @param messageTemplate Nonblank canonical English text with zero-based
   * placeholders such as `{0}`. Catalogs and their generators validate placeholder
   * correctness; this constructor neither parses nor caches placeholder structure.
   * @param defaultTags Tags applied to every occurrence, in order. Omission or
   * `undefined` uses an empty sequence. The input array is copied and must contain
   * no duplicates.
   * @throws {ArgumentException} If `messageTemplate` is empty or whitespace-only,
   * or `defaultTags` contains a duplicate.
   * @example
   * See {@link DiagnosticTemplate.create} for a reusable template and its occurrences.
   */
  public constructor(code: DiagnosticCode, category: DiagnosticCategory, messageTemplate: string, defaultTags?: readonly DiagnosticTag[]);

  /**
   * Creates one immutable occurrence, formatting its primary message exactly
   * once through {@link StringConstructor.format}. To publish a nested chain,
   * construct {@link DiagnosticMessage} nodes and a {@link Diagnostic} directly.
   *
   * @param location The primary span, or `undefined` for a diagnostic without a
   * source location. Anonymous text can use a {@link DiagnosticLocation} without
   * a source identity.
   * @param messageArguments String and number substitutions, indexed from zero.
   * Omission or `undefined` supplies none. Unavailable or unrecognized placeholders
   * remain unchanged; the producer must supply arguments matching its catalog.
   * @param relatedInformation Ordered related records. Omission or `undefined`
   * uses an empty sequence. The occurrence copies the array and retains its elements.
   * @param tags Occurrence-specific tags appended after {@link DiagnosticTemplate.defaultTags}.
   * Omission or `undefined` supplies none. The combined sequence must have no duplicates.
   * @returns A new occurrence and primary message node, with the template's code
   * and category and no message children. Formatting arguments are not retained;
   * the template is unchanged and can create further independent occurrences.
   * @throws {ArgumentException} If the formatted message is empty or whitespace-only,
   * or a tag repeats within the occurrence tags or overlaps a default tag. A valid
   * template such as `"{0}"` can still produce invalid blank text after substitution.
   * @example
   * ```ts
   * const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2304);
   * const template = new DiagnosticTemplate(code, DiagnosticCategory.Error, "Cannot find name '{0}'.");
   * const first = template.create(undefined, ["value"]);
   * const second = template.create(undefined, ["other"]);
   * first.message.text; // "Cannot find name 'value'."
   * second.message.text; // "Cannot find name 'other'."
   * first !== second; // true
   * ```
   */
  public create(
    location: DiagnosticLocation | undefined,
    messageArguments?: readonly (string | number)[],
    relatedInformation?: readonly DiagnosticRelatedInformation[],
    tags?: readonly DiagnosticTag[]): Diagnostic;
}
