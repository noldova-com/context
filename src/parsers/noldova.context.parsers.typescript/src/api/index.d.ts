/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CommentNode, CompositeNode, LiteralNode, Node, ParserResult, Source, SourceReader, SourceSpan, ValueNode } from "@noldova/context.parsers";

/**
 * Identifies whether one parser input is code or declaration input; its name
 * never selects the kind.
 *
 * This is a source-level choice, not a syntax-node classification or a module
 * resolution setting. Whether the input is a module is decided separately, as
 * {@link TypeScriptParser} describes.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse(
 *   "export function read(): string;", undefined, TypeScriptSourceKind.Declaration);
 * result.diagnostics.length; // 0
 * ```
 */
export declare enum TypeScriptSourceKind {
  /**
   * Ordinary TypeScript source, including scripts and modules. The default.
   */
  Code = "Code",
  /**
   * Declaration input corresponding to TypeScript declaration-file grammar.
   * No physical file or particular identity suffix is required.
   */
  Declaration = "Declaration"
}

/**
 * The shared roles of a TypeScript getter or setter, a declaration or a
 * signature. A getter writes a return type; a setter's return type and colon
 * are retained for diagnostics.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("class Box { get value(): number { return 1; } set value(next: number) {} }");
 * const classNode = result.rootNode.children[0];
 * if (classNode instanceof TypeScriptClassDeclarationNode) {
 *   const [getter, setter] = classNode.bodyNode.children;
 *   console.log(getter instanceof TypeScriptGetAccessorNode && getter instanceof TypeScriptAccessorNode); // true
 *   console.log(setter instanceof TypeScriptSetAccessorNode); // true
 * }
 * ```
 */
export declare abstract class TypeScriptAccessorNode extends Node {
  /**
   * The accessor body, when the accessor is a concrete declaration; an empty, zero-width block without braces where neither its opening
   * brace nor a terminator follows.
   */
  public readonly bodyNode: TypeScriptBlockNode | undefined;

  /**
   * The colon introducing the return type, when written.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The accessed property name.
   */
  public readonly nameNode: Node;

  /**
   * The accessor parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   */
  public readonly parameterListNode: TypeScriptParameterListNode;

  /**
   * The return type, when parsed.
   */
  public readonly returnTypeNode: Node | undefined;

  /**
   * The comma or semicolon terminating a signature, when explicit.
   */
  public readonly terminatorNode: TypeScriptCommaNode | TypeScriptSemicolonNode | undefined;

  /**
   * Type parameters retained for diagnostics when present.
   */
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  /**
   * Creates the shared roles of an accessor.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param span The exact recovered span of the accessor.
   * @param nameNode The accessed property name.
   * @param parameterListNode The parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   * @param typeParameterListNode Invalid type parameters retained for diagnostics.
   * @param colonNode The return-type colon, when present.
   * @param returnTypeNode The return type, when parsed.
   * @param bodyNode The concrete accessor body, when present; an empty, zero-width block without braces where neither its opening brace
   * nor a terminator follows.
   * @param terminatorNode The explicit signature terminator, when present.
   * @param leadingTrivia Trivia preceding the accessor.
   * @param trailingTrivia Trivia following the accessor.
   *
   * @see {@link TypeScriptAccessorNode} for usage.
   */
  public constructor(
    modifierNodes: readonly Node[],
    span: SourceSpan,
    nameNode: Node,
    parameterListNode: TypeScriptParameterListNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    bodyNode?: TypeScriptBlockNode,
    terminatorNode?: TypeScriptCommaNode | TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript array binding pattern whose children are its binding elements
 * and explicit omitted positions.
 */
export declare class TypeScriptArrayBindingPatternNode extends TypeScriptBindingPatternNode {
  /**
   * The closing bracket, when present.
   */
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;

  /**
   * The opening bracket beginning the binding pattern.
   */
  public readonly openBracketNode: TypeScriptOpenBracketNode;

  /**
   * Creates an array binding pattern from its elements and delimiters.
   *
   * @param openBracketNode The opening bracket.
   * @param elementNodes The binding elements and omitted positions in source order.
   * @param commaNodes The commas separating elements.
   * @param span The exact recovered span of the binding pattern.
   * @param closeBracketNode The closing bracket, when present.
   * @param leadingTrivia Trivia preceding the binding pattern.
   * @param trailingTrivia Trivia following the binding pattern.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    openBracketNode: TypeScriptOpenBracketNode,
    elementNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    closeBracketNode?: TypeScriptCloseBracketNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * One element of an array or object binding pattern.
 */
export declare class TypeScriptBindingElementNode extends Node {
  /**
   * The colon separating an object property name from its binding name.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The rest marker, when present.
   */
  public readonly dotDotDotNode: TypeScriptDotDotDotNode | undefined;

  /**
   * The equals token introducing a default value, when present.
   */
  public readonly equalsNode: TypeScriptEqualsNode | undefined;

  /**
   * The default-value expression, when parsed.
   */
  public readonly initializerNode: Node | undefined;

  /**
   * The identifier or nested binding pattern receiving the value, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly nameNode: Node;

  /**
   * The property name of an object binding element written as `name: binding`, a {@link TypeScriptMissingIdentifierNode} where the source
   * lacks one; undefined for a shorthand or array element.
   */
  public readonly propertyNameNode: Node | undefined;

  /**
   * Creates a binding element from its exact syntax roles.
   *
   * @param span The exact recovered span of the binding element.
   * @param nameNode The receiving name or nested pattern, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param dotDotDotNode The rest marker, when present.
   * @param propertyNameNode The source property name, when present.
   * @param colonNode The property-name colon, when present.
   * @param equalsNode The equals token, when present.
   * @param initializerNode The default-value expression, when parsed.
   * @param leadingTrivia Trivia preceding the binding element.
   * @param trailingTrivia Trivia following the binding element.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    span: SourceSpan,
    nameNode: Node,
    dotDotDotNode?: TypeScriptDotDotDotNode,
    propertyNameNode?: Node,
    colonNode?: TypeScriptColonNode,
    equalsNode?: TypeScriptEqualsNode,
    initializerNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * An array or object binding pattern, whose children are its binding elements.
 */
export declare abstract class TypeScriptBindingPatternNode extends TypeScriptDelimitedListNode { }

/**
 * A callable signature declared within a TypeScript type.
 */
export declare class TypeScriptCallSignatureNode extends Node {
  /**
   * The colon introducing the return type, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The signature parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   */
  public readonly parameterListNode: TypeScriptParameterListNode;

  /**
   * The returned type, when parsed.
   */
  public readonly returnTypeNode: Node | undefined;

  /**
   * The comma or semicolon terminating the signature, when explicit.
   */
  public readonly terminatorNode: TypeScriptCommaNode | TypeScriptSemicolonNode | undefined;

  /**
   * The generic type-parameter list, when present.
   */
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  /**
   * Creates a call signature from its named syntax roles.
   *
   * @param span The exact recovered span of the signature.
   * @param parameterListNode The parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   * @param typeParameterListNode The generic type parameters, when present.
   * @param colonNode The return-type colon, when present.
   * @param returnTypeNode The returned type, when parsed.
   * @param terminatorNode The explicit comma or semicolon, when present.
   * @param leadingTrivia Trivia preceding the signature.
   * @param trailingTrivia Trivia following the signature.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    span: SourceSpan,
    parameterListNode: TypeScriptParameterListNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    terminatorNode?: TypeScriptCommaNode | TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A brace-delimited TypeScript class body whose children are its members. Where the opening brace is missing, the body is written empty and
 * zero-width at the end of the preceding token, without braces or trivia.
 */
export declare class TypeScriptClassBodyNode extends CompositeNode {
  /**
   * The closing brace, when present.
   */
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  /**
   * The opening brace beginning the class body, or undefined where it is missing.
   */
  public readonly openBraceNode: TypeScriptOpenBraceNode | undefined;

  /**
   * Creates a class body from its members and delimiters.
   *
   * @param openBraceNode The opening brace, or undefined where it is missing.
   * @param memberNodes The class members in source order.
   * @param span The exact recovered span of the class body.
   * @param closeBraceNode The closing brace, when present.
   * @param leadingTrivia Trivia preceding the class body.
   * @param trailingTrivia Trivia following the class body.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    openBraceNode: TypeScriptOpenBraceNode | undefined,
    memberNodes: readonly Node[],
    span: SourceSpan,
    closeBraceNode?: TypeScriptCloseBraceNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript property name computed from an expression.
 */
export declare class TypeScriptComputedPropertyNameNode extends Node {
  /**
   * The closing bracket, when present.
   */
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;

  /**
   * The expression computing the property name, including a missing-expression node during recovery.
   */
  public readonly expressionNode: Node;

  /**
   * The opening bracket beginning the computed name.
   */
  public readonly openBracketNode: TypeScriptOpenBracketNode;

  /**
   * Creates a computed property name from its named syntax roles.
   *
   * @param openBracketNode The opening bracket.
   * @param span The exact recovered span of the computed name.
   * @param expressionNode The name expression, including a missing-expression node during recovery.
   * @param closeBracketNode The closing bracket, when present.
   * @param leadingTrivia Trivia preceding the computed name.
   * @param trailingTrivia Trivia following the computed name.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    openBracketNode: TypeScriptOpenBracketNode,
    span: SourceSpan,
    expressionNode: Node,
    closeBracketNode?: TypeScriptCloseBracketNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A construct signature declared within a TypeScript type.
 */
export declare class TypeScriptConstructSignatureNode extends Node {
  /**
   * The colon introducing the constructed type, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The `new` keyword introducing the signature.
   */
  public readonly newKeywordNode: TypeScriptNewKeywordNode;

  /**
   * The signature parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   */
  public readonly parameterListNode: TypeScriptParameterListNode;

  /**
   * The constructed type, when parsed.
   */
  public readonly returnTypeNode: Node | undefined;

  /**
   * The comma or semicolon terminating the signature, when explicit.
   */
  public readonly terminatorNode: TypeScriptCommaNode | TypeScriptSemicolonNode | undefined;

  /**
   * The generic type-parameter list, when present.
   */
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  /**
   * Creates a construct signature from its named syntax roles.
   *
   * @param newKeywordNode The `new` keyword.
   * @param span The exact recovered span of the signature.
   * @param parameterListNode The parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   * @param typeParameterListNode The generic type parameters, when present.
   * @param colonNode The constructed-type colon, when present.
   * @param returnTypeNode The constructed type, when parsed.
   * @param terminatorNode The explicit comma or semicolon, when present.
   * @param leadingTrivia Trivia preceding the signature.
   * @param trailingTrivia Trivia following the signature.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    newKeywordNode: TypeScriptNewKeywordNode,
    span: SourceSpan,
    parameterListNode: TypeScriptParameterListNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    terminatorNode?: TypeScriptCommaNode | TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript class constructor declaration.
 *
 * Quoted constructor names retain their original spelling. Written generic
 * parameters and return annotations are preserved even when they are illegal.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("class Example { constructor(value: string) {} }");
 * const declaration = result.rootNode.children[0];
 * if (declaration instanceof TypeScriptClassDeclarationNode) {
 *   const member = declaration.bodyNode.children[0];
 *   if (member instanceof TypeScriptConstructorDeclarationNode)
 *     member.parameterListNode.children.length; // 1
 * }
 * ```
 */
export declare class TypeScriptConstructorDeclarationNode extends Node {
  /**
   * The constructor body, when present; an empty, zero-width block without braces where neither its opening brace nor a terminator follows.
   */
  public readonly bodyNode: TypeScriptBlockNode | undefined;

  /**
   * The written constructor name: its contextual keyword or quoted spelling.
   */
  public readonly nameNode: TypeScriptConstructorKeywordNode | TypeScriptStringLiteralNode;

  /**
   * Written type parameters, retained for later constructor-legality checks.
   */
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  /**
   * The colon introducing a written return annotation, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * A written return annotation, retained without implying it is legal.
   */
  public readonly returnTypeNode: Node | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The constructor parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   */
  public readonly parameterListNode: TypeScriptParameterListNode;

  /**
   * The semicolon terminating a bodyless declaration, when explicit.
   */
  public readonly terminatorNode: TypeScriptSemicolonNode | undefined;

  /**
   * Creates a constructor declaration from its named syntax roles.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param nameNode The contextual constructor keyword or quoted constructor name.
   * @param span The exact recovered span of the declaration.
   * @param parameterListNode The parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   * @param bodyNode The constructor body, when present; an empty, zero-width block without braces where neither its opening brace nor a terminator follows.
   * @param terminatorNode The explicit semicolon, when present.
   * @param typeParameterListNode Written type parameters, even when later checking rejects them.
   * @param colonNode The return-annotation colon, when written.
   * @param returnTypeNode The return annotation, retained for later legality checks.
   * @param leadingTrivia Trivia preceding the declaration.
   * @param trailingTrivia Trivia following the declaration.
   * @example See {@link TypeScriptConstructorDeclarationNode} for a parsed constructor and its parameters.
   */
  public constructor(
    modifierNodes: readonly Node[],
    nameNode: TypeScriptConstructorKeywordNode | TypeScriptStringLiteralNode,
    span: SourceSpan,
    parameterListNode: TypeScriptParameterListNode,
    bodyNode?: TypeScriptBlockNode,
    terminatorNode?: TypeScriptSemicolonNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript decorator and the expression it applies.
 */
export declare class TypeScriptDecoratorNode extends Node {
  /**
   * The `@` token introducing the decorator.
   */
  public readonly atNode: TypeScriptAtNode;

  /**
   * The decorator expression, including a missing-expression node during recovery.
   */
  public readonly expressionNode: Node;

  /**
   * Creates a decorator from its marker and expression.
   *
   * @param atNode The `@` token introducing the decorator.
   * @param span The exact recovered span of the decorator.
   * @param expressionNode The decorator expression, including a missing-expression node during recovery.
   * @param leadingTrivia Trivia preceding the decorator.
   * @param trailingTrivia Trivia following the decorator.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    atNode: TypeScriptAtNode,
    span: SourceSpan,
    expressionNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript getter declaration or getter signature.
 */
export declare class TypeScriptGetAccessorNode extends TypeScriptAccessorNode {
  /**
   * The `get` keyword.
   */
  public readonly getKeywordNode: TypeScriptGetKeywordNode;

  /**
   * Creates a getter from its exact declaration roles.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param getKeywordNode The `get` keyword.
   * @param span The exact recovered span of the getter.
   * @param nameNode The accessed property name.
   * @param parameterListNode The parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   * @param typeParameterListNode Invalid type parameters retained for diagnostics.
   * @param colonNode The return-type colon, when present.
   * @param returnTypeNode The returned type, when parsed.
   * @param bodyNode The concrete getter body, when present; an empty, zero-width block without braces where neither its opening brace nor a terminator follows.
   * @param terminatorNode The explicit signature terminator, when present.
   * @param leadingTrivia Trivia preceding the getter.
   * @param trailingTrivia Trivia following the getter.
   *
   * @see {@link TypeScriptAccessorNode} for usage.
   */
  public constructor(
    modifierNodes: readonly Node[],
    getKeywordNode: TypeScriptGetKeywordNode,
    span: SourceSpan,
    nameNode: Node,
    parameterListNode: TypeScriptParameterListNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    bodyNode?: TypeScriptBlockNode,
    terminatorNode?: TypeScriptCommaNode | TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript `extends` or `implements` clause whose children are its referenced types.
 */
export declare class TypeScriptHeritageClauseNode extends TypeScriptDelimitedListNode {
  /**
   * The `extends` or `implements` keyword introducing the clause.
   */
  public readonly keywordNode: TypeScriptExtendsKeywordNode | TypeScriptImplementsKeywordNode;

  /**
   * Creates a heritage clause from its keyword and referenced types.
   *
   * @param keywordNode The `extends` or `implements` keyword.
   * @param typeNodes The referenced types in source order.
   * @param commaNodes The commas separating referenced types.
   * @param span The exact recovered span of the clause.
   * @param leadingTrivia Trivia preceding the clause.
   * @param trailingTrivia Trivia following the clause.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    keywordNode: TypeScriptExtendsKeywordNode | TypeScriptImplementsKeywordNode,
    typeNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A bracket-delimited TypeScript index-parameter list.
 */
export declare class TypeScriptIndexParameterListNode extends TypeScriptDelimitedListNode {
  /**
   * The parsed index parameters in source order, excluding delimiters and commas.
   */
  public readonly children: readonly TypeScriptParameterNode[];

  /**
   * The closing bracket, when present.
   */
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;

  /**
   * The opening bracket beginning the list.
   */
  public readonly openBracketNode: TypeScriptOpenBracketNode;

  /**
   * Creates an index-parameter list from its parameters and delimiters.
   *
   * @param openBracketNode The opening bracket.
   * @param parameterNodes The parsed index parameters in source order.
   * @param commaNodes Commas retained from malformed multi-parameter input.
   * @param span The exact recovered span of the list.
   * @param closeBracketNode The closing bracket, when present.
   * @param leadingTrivia Trivia preceding the list.
   * @param trailingTrivia Trivia following the list.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    openBracketNode: TypeScriptOpenBracketNode,
    parameterNodes: readonly TypeScriptParameterNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    closeBracketNode?: TypeScriptCloseBracketNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript index signature.
 */
export declare class TypeScriptIndexSignatureNode extends Node {
  /**
   * The colon introducing the indexed value type, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The bracketed index parameters.
   */
  public readonly indexParameterListNode: TypeScriptIndexParameterListNode;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The comma or semicolon terminating the signature, when explicit.
   */
  public readonly terminatorNode: TypeScriptCommaNode | TypeScriptSemicolonNode | undefined;

  /**
   * The indexed value type, when parsed.
   */
  public readonly typeNode: Node | undefined;

  /**
   * Creates an index signature from its exact syntax roles.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param indexParameterListNode The bracketed index parameters.
   * @param span The exact recovered span of the signature.
   * @param colonNode The value-type colon, when present.
   * @param typeNode The indexed value type, when parsed.
   * @param terminatorNode The explicit comma or semicolon, when present.
   * @param leadingTrivia Trivia preceding the signature.
   * @param trailingTrivia Trivia following the signature.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    modifierNodes: readonly Node[],
    indexParameterListNode: TypeScriptIndexParameterListNode,
    span: SourceSpan,
    colonNode?: TypeScriptColonNode,
    typeNode?: Node,
    terminatorNode?: TypeScriptCommaNode | TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A method declaration in a class body or an object literal. A class method may be bodyless, as an overload, abstract,
 * or ambient signature ending at an optional semicolon; recovery may leave either form without a body where a terminator can end it.
 */
export declare class TypeScriptMethodDeclarationNode extends Node {
  /**
   * A written exclamation marker, retained for later legality checks.
   */
  public readonly exclamationNode: TypeScriptExclamationNode | undefined;

  /**
   * The generator asterisk, when present.
   */
  public readonly asteriskNode: TypeScriptAsteriskNode | undefined;

  /**
   * The method body, when present; an empty, zero-width block without braces where neither its opening brace nor a terminator follows.
   */
  public readonly bodyNode: TypeScriptBlockNode | undefined;

  /**
   * The colon introducing the return type, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The method name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly nameNode: Node;

  /**
   * The method parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   */
  public readonly parameterListNode: TypeScriptParameterListNode;

  /**
   * The optional-method question mark, when present.
   */
  public readonly questionNode: TypeScriptQuestionNode | undefined;

  /**
   * The returned type, when parsed.
   */
  public readonly returnTypeNode: Node | undefined;

  /**
   * The semicolon terminating a bodyless declaration, when explicit.
   */
  public readonly terminatorNode: TypeScriptSemicolonNode | undefined;

  /**
   * The generic type-parameter list, when present.
   */
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  /**
   * Creates a method declaration from its named syntax roles.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param span The exact recovered span of the declaration.
   * @param nameNode The method name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param parameterListNode The parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   * @param asteriskNode The generator asterisk, when present.
   * @param questionNode The optional-method question mark, when present.
   * @param typeParameterListNode The generic type parameters, when present.
   * @param colonNode The return-type colon, when present.
   * @param returnTypeNode The returned type, when parsed.
   * @param bodyNode The method body, when present; an empty, zero-width block without braces where neither its opening brace nor a terminator follows.
   * @param terminatorNode The explicit semicolon, when present.
   * @param exclamationNode A written exclamation marker, retained even when illegal on a method.
   * @param leadingTrivia Trivia preceding the declaration.
   * @param trailingTrivia Trivia following the declaration.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    modifierNodes: readonly Node[],
    span: SourceSpan,
    nameNode: Node,
    parameterListNode: TypeScriptParameterListNode,
    asteriskNode?: TypeScriptAsteriskNode,
    questionNode?: TypeScriptQuestionNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    bodyNode?: TypeScriptBlockNode,
    terminatorNode?: TypeScriptSemicolonNode,
    exclamationNode?: TypeScriptExclamationNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A named method signature declared within a TypeScript type.
 */
export declare class TypeScriptMethodSignatureNode extends Node {
  /**
   * The colon introducing the return type, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The method name.
   */
  public readonly nameNode: Node;

  /**
   * The method parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   */
  public readonly parameterListNode: TypeScriptParameterListNode;

  /**
   * The optional-method question mark, when present.
   */
  public readonly questionNode: TypeScriptQuestionNode | undefined;

  /**
   * The returned type, when parsed.
   */
  public readonly returnTypeNode: Node | undefined;

  /**
   * The comma or semicolon terminating the signature, when explicit.
   */
  public readonly terminatorNode: TypeScriptCommaNode | TypeScriptSemicolonNode | undefined;

  /**
   * The generic type-parameter list, when present.
   */
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  /**
   * Creates a method signature from its exact syntax roles.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param span The exact recovered span of the signature.
   * @param nameNode The method name.
   * @param parameterListNode The parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   * @param questionNode The optional-method question mark, when present.
   * @param typeParameterListNode The generic type parameters, when present.
   * @param colonNode The return-type colon, when present.
   * @param returnTypeNode The returned type, when parsed.
   * @param terminatorNode The explicit comma or semicolon, when present.
   * @param leadingTrivia Trivia preceding the signature.
   * @param trailingTrivia Trivia following the signature.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    modifierNodes: readonly Node[],
    span: SourceSpan,
    nameNode: Node,
    parameterListNode: TypeScriptParameterListNode,
    questionNode?: TypeScriptQuestionNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    terminatorNode?: TypeScriptCommaNode | TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript object binding pattern whose children are its binding elements.
 */
export declare class TypeScriptObjectBindingPatternNode extends TypeScriptBindingPatternNode {
  /**
   * The closing brace, when present.
   */
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  /**
   * The opening brace beginning the binding pattern.
   */
  public readonly openBraceNode: TypeScriptOpenBraceNode;

  /**
   * Creates an object binding pattern from its elements and delimiters.
   *
   * @param openBraceNode The opening brace.
   * @param elementNodes The binding elements in source order.
   * @param commaNodes The commas separating the elements.
   * @param span The exact recovered span of the binding pattern.
   * @param closeBraceNode The closing brace, when present.
   * @param leadingTrivia Trivia preceding the binding pattern.
   * @param trailingTrivia Trivia following the binding pattern.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    openBraceNode: TypeScriptOpenBraceNode,
    elementNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    closeBraceNode?: TypeScriptCloseBraceNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A parenthesized TypeScript parameter list whose children are its parameters. Where the opening parenthesis is missing, the list is written
 * empty and zero-width at the end of the preceding token, without parentheses or trivia.
 */
export declare class TypeScriptParameterListNode extends TypeScriptDelimitedListNode {
  /**
   * The parsed parameters in source order, excluding delimiters and commas.
   */
  public readonly children: readonly TypeScriptParameterNode[];

  /**
   * The closing parenthesis, when present.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * The opening parenthesis beginning the list, or undefined where it is missing.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;

  /**
   * Creates a parameter list from its parameters and delimiters.
   *
   * @param openParenthesisNode The opening parenthesis, or undefined where it is missing.
   * @param parameterNodes The parameters in source order.
   * @param commaNodes The commas separating the parameters.
   * @param span The exact recovered span of the list.
   * @param closeParenthesisNode The closing parenthesis, when present.
   * @param leadingTrivia Trivia preceding the list.
   * @param trailingTrivia Trivia following the list.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    openParenthesisNode: TypeScriptOpenParenthesisNode | undefined,
    parameterNodes: readonly TypeScriptParameterNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript function, method, constructor, or accessor parameter.
 */
export declare class TypeScriptParameterNode extends Node {
  /**
   * The colon introducing the type annotation, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The rest marker, when present.
   */
  public readonly dotDotDotNode: TypeScriptDotDotDotNode | undefined;

  /**
   * The equals token introducing the initializer, when present.
   */
  public readonly equalsNode: TypeScriptEqualsNode | undefined;

  /**
   * The default-value expression, when parsed.
   */
  public readonly initializerNode: Node | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The parameter identifier or binding pattern, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly nameNode: Node;

  /**
   * The optional-parameter question mark, when present.
   */
  public readonly questionNode: TypeScriptQuestionNode | undefined;

  /**
   * The parameter type annotation, when parsed.
   */
  public readonly typeNode: Node | undefined;

  /**
   * Creates a parameter from its exact syntax roles.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param span The exact recovered span of the parameter.
   * @param nameNode The identifier or binding pattern, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param dotDotDotNode The rest marker, when present.
   * @param questionNode The optional-parameter question mark, when present.
   * @param colonNode The type-annotation colon, when present.
   * @param typeNode The parameter type, when parsed.
   * @param equalsNode The equals token, when present.
   * @param initializerNode The default-value expression, when parsed.
   * @param leadingTrivia Trivia preceding the parameter.
   * @param trailingTrivia Trivia following the parameter.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    modifierNodes: readonly Node[],
    span: SourceSpan,
    nameNode: Node,
    dotDotDotNode?: TypeScriptDotDotDotNode,
    questionNode?: TypeScriptQuestionNode,
    colonNode?: TypeScriptColonNode,
    typeNode?: Node,
    equalsNode?: TypeScriptEqualsNode,
    initializerNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript class property declaration.
 */
export declare class TypeScriptPropertyDeclarationNode extends Node {
  /**
   * The colon introducing the property type, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The equals token introducing the initializer, when present.
   */
  public readonly equalsNode: TypeScriptEqualsNode | undefined;

  /**
   * The definite-assignment assertion, when present.
   */
  public readonly exclamationNode: TypeScriptExclamationNode | undefined;

  /**
   * The property initializer, when parsed.
   */
  public readonly initializerNode: Node | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The property name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one, as where modifiers stand without one.
   */
  public readonly nameNode: Node;

  /**
   * The optional-property question mark, when present.
   */
  public readonly questionNode: TypeScriptQuestionNode | undefined;

  /**
   * The semicolon terminating the declaration, when explicit.
   */
  public readonly terminatorNode: TypeScriptSemicolonNode | undefined;

  /**
   * The property type, when parsed.
   */
  public readonly typeNode: Node | undefined;

  /**
   * Creates a property declaration from its named syntax roles.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param span The exact recovered span of the declaration.
   * @param nameNode The property name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param questionNode The optional-property question mark, when present.
   * @param exclamationNode The definite-assignment assertion, when present.
   * @param colonNode The property-type colon, when present.
   * @param typeNode The property type, when parsed.
   * @param equalsNode The equals token, when present.
   * @param initializerNode The initializer expression, when parsed.
   * @param terminatorNode The explicit semicolon, when present.
   * @param leadingTrivia Trivia preceding the declaration.
   * @param trailingTrivia Trivia following the declaration.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    modifierNodes: readonly Node[],
    span: SourceSpan,
    nameNode: Node,
    questionNode?: TypeScriptQuestionNode,
    exclamationNode?: TypeScriptExclamationNode,
    colonNode?: TypeScriptColonNode,
    typeNode?: Node,
    equalsNode?: TypeScriptEqualsNode,
    initializerNode?: Node,
    terminatorNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A property signature declared within a TypeScript type.
 */
export declare class TypeScriptPropertySignatureNode extends Node {
  /**
   * The colon introducing the property type, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The equals token introducing an invalid initializer, when present.
   */
  public readonly equalsNode: TypeScriptEqualsNode | undefined;

  /**
   * An initializer retained so the diagnostic phase can reject it.
   */
  public readonly initializerNode: Node | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The property name.
   */
  public readonly nameNode: Node;

  /**
   * The optional-property question mark, when present.
   */
  public readonly questionNode: TypeScriptQuestionNode | undefined;

  /**
   * The comma or semicolon terminating the signature, when explicit.
   */
  public readonly terminatorNode: TypeScriptCommaNode | TypeScriptSemicolonNode | undefined;

  /**
   * The property type, when parsed.
   */
  public readonly typeNode: Node | undefined;

  /**
   * Creates a property signature from its exact syntax roles.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param span The exact recovered span of the signature.
   * @param nameNode The property name.
   * @param questionNode The optional-property question mark, when present.
   * @param colonNode The property-type colon, when present.
   * @param typeNode The property type, when parsed.
   * @param equalsNode The equals token, when present.
   * @param initializerNode An invalid initializer retained for diagnostics.
   * @param terminatorNode The explicit comma or semicolon, when present.
   * @param leadingTrivia Trivia preceding the signature.
   * @param trailingTrivia Trivia following the signature.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    modifierNodes: readonly Node[],
    span: SourceSpan,
    nameNode: Node,
    questionNode?: TypeScriptQuestionNode,
    colonNode?: TypeScriptColonNode,
    typeNode?: Node,
    equalsNode?: TypeScriptEqualsNode,
    initializerNode?: Node,
    terminatorNode?: TypeScriptCommaNode | TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A semicolon class element retained as a distinct class member.
 */
export declare class TypeScriptSemicolonClassElementNode extends Node {
  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The semicolon represented by the class element.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode;

  /**
   * Creates a semicolon class element from its recovered syntax roles.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param semicolonNode The semicolon represented by the element.
   * @param span The exact recovered span of the element.
   * @param leadingTrivia Trivia preceding the element.
   * @param trailingTrivia Trivia following the element.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    modifierNodes: readonly Node[],
    semicolonNode: TypeScriptSemicolonNode,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript setter declaration or setter signature.
 */
export declare class TypeScriptSetAccessorNode extends TypeScriptAccessorNode {
  /**
   * The `set` keyword.
   */
  public readonly setKeywordNode: TypeScriptSetKeywordNode;

  /**
   * Creates a setter from its exact declaration roles.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param setKeywordNode The `set` keyword.
   * @param span The exact recovered span of the setter.
   * @param nameNode The accessed property name.
   * @param parameterListNode The parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   * @param typeParameterListNode Invalid type parameters retained for diagnostics.
   * @param colonNode An invalid return-type colon, when present.
   * @param returnTypeNode An invalid return type retained for diagnostics.
   * @param bodyNode The concrete setter body, when present; an empty, zero-width block without braces where neither its opening brace nor a terminator follows.
   * @param terminatorNode The explicit signature terminator, when present.
   * @param leadingTrivia Trivia preceding the setter.
   * @param trailingTrivia Trivia following the setter.
   *
   * @see {@link TypeScriptAccessorNode} for usage.
   */
  public constructor(
    modifierNodes: readonly Node[],
    setKeywordNode: TypeScriptSetKeywordNode,
    span: SourceSpan,
    nameNode: Node,
    parameterListNode: TypeScriptParameterListNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    bodyNode?: TypeScriptBlockNode,
    terminatorNode?: TypeScriptCommaNode | TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript static initialization block.
 */
export declare class TypeScriptStaticBlockNode extends Node {
  /**
   * The block containing the initialization statements.
   */
  public readonly bodyNode: TypeScriptBlockNode;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The `static` keyword introducing the block.
   */
  public readonly staticKeywordNode: TypeScriptStaticKeywordNode;

  /**
   * Creates a static initialization block.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param staticKeywordNode The `static` keyword.
   * @param bodyNode The initialization block.
   * @param span The exact span of the static block.
   * @param leadingTrivia Trivia preceding the static block.
   * @param trailingTrivia Trivia following the static block.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    modifierNodes: readonly Node[],
    staticKeywordNode: TypeScriptStaticKeywordNode,
    bodyNode: TypeScriptBlockNode,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * The root of one parsed TypeScript input.
 */
export declare class TypeScriptNode extends CompositeNode {
  /**
   * Creates a TypeScript root from its statements and boundary trivia.
   *
   * @param statements The top-level statements in source order.
   * @param span The exact span of the parsed source input.
   * @param leadingTrivia Trivia preceding the first TypeScript token.
   * @param trailingTrivia Trivia following the final TypeScript statement.
   *
   * @see {@link TypeScriptParser} for usage.
   */
  public constructor(
    statements: readonly Node[],
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * The TypeScript `@` decorator marker token.
 */
export declare class TypeScriptAtNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptOpenParenthesisNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `}` closing brace token.
 */
export declare class TypeScriptCloseBraceNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptOpenParenthesisNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `]` closing bracket token.
 */
export declare class TypeScriptCloseBracketNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptOpenParenthesisNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `)` closing parenthesis token.
 */
export declare class TypeScriptCloseParenthesisNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptOpenParenthesisNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `:` colon token.
 */
export declare class TypeScriptColonNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptOpenParenthesisNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `,` comma token.
 */
export declare class TypeScriptCommaNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptOpenParenthesisNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `...` ellipsis token.
 */
export declare class TypeScriptDotDotDotNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptOpenParenthesisNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `.` dot token.
 */
export declare class TypeScriptDotNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptOpenParenthesisNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `{` opening brace token.
 */
export declare class TypeScriptOpenBraceNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptOpenParenthesisNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `[` opening bracket token.
 */
export declare class TypeScriptOpenBracketNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptOpenParenthesisNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `(` opening parenthesis token.
 *
 * @example Delimiter tokens are read from the construct that writes them, or constructed at a span.
 * ```ts
 * const statement = TypeScriptParser.parse("(value);").rootNode.children[0];
 * if (statement instanceof TypeScriptExpressionStatementNode && statement.expressionNode instanceof TypeScriptParenthesizedExpressionNode)
 *   console.log(statement.expressionNode.openParenthesisNode.value); // "("
 * console.log(new TypeScriptOpenParenthesisNode(new SourceSpan(0, 1)).value); // "("
 * ```
 */
export declare class TypeScriptOpenParenthesisNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptOpenParenthesisNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `;` semicolon token.
 */
export declare class TypeScriptSemicolonNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptOpenParenthesisNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A parenthesized list of call or construction arguments.
 */
export declare class TypeScriptArgumentListNode extends TypeScriptDelimitedListNode {
  /**
   * The closing parenthesis, when recovered from the source.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * The written opening parenthesis beginning the argument list; undefined when missing during recovery.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;

  /**
   * Creates an argument list from its delimiters and ordered arguments.
   *
   * @param openParenthesisNode The written opening parenthesis, or undefined when recovery begins without one.
   * @param argumentNodes The argument expressions in source order.
   * @param commaNodes The separating comma tokens.
   * @param span The exact recovered span of the list.
   * @param closeParenthesisNode The closing parenthesis, when present.
   * @param leadingTrivia Trivia preceding the list.
   * @param trailingTrivia Trivia following the list.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    openParenthesisNode: TypeScriptOpenParenthesisNode | undefined,
    argumentNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript array-literal expression.
 */
export declare class TypeScriptArrayLiteralExpressionNode extends TypeScriptDelimitedListNode {
  /**
   * The closing bracket, when recovered from the source.
   */
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;

  /**
   * The opening bracket beginning the array literal.
   */
  public readonly openBracketNode: TypeScriptOpenBracketNode;

  /**
   * Creates an array literal from its delimiters and ordered elements.
   *
   * @param openBracketNode The opening bracket.
   * @param elementNodes The element, spread, and omitted-expression nodes.
   * @param commaNodes The separating comma tokens.
   * @param span The exact recovered span of the expression.
   * @param closeBracketNode The closing bracket, when present.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    openBracketNode: TypeScriptOpenBracketNode,
    elementNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    closeBracketNode?: TypeScriptCloseBracketNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript arrow-function expression.
 */
export declare class TypeScriptArrowFunctionNode extends Node {
  /**
   * The written arrow token separating the signature and body, or undefined
   * when a recognizable arrow-function signature is recovered without it.
   */
  public readonly arrowNode: TypeScriptArrowNode | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The expression or block forming the function body.
   */
  public readonly bodyNode: Node;

  /**
   * The colon introducing an explicit return type.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The parenthesized parameter list, when that syntax was used. Undefined for the single-parameter form and for a
   * standalone `=>`, which is recovered as an arrow whose parameters are missing.
   */
  public readonly parameterListNode: TypeScriptParameterListNode | undefined;

  /**
   * The single unparenthesized parameter, when that syntax was used. Undefined for the parenthesized form and for a
   * standalone `=>`, which is recovered as an arrow whose parameters are missing.
   */
  public readonly parameterNode: TypeScriptParameterNode | undefined;

  /**
   * The explicit return type, when present.
   */
  public readonly returnTypeNode: Node | undefined;

  /**
   * The generic type-parameter list, when present.
   */
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  /**
   * Creates an arrow function from its recovered signature and body.
   *
   * @param span The exact recovered source span.
   * @param arrowNode The written arrow, or undefined when it was missing.
   * @param bodyNode The expression or block forming the body.
   * @param modifierNodes Written modifiers in source order, including async.
   * @param typeParameterListNode The generic parameters, when present.
   * @param parameterNode The single unparenthesized parameter, when used.
   * @param parameterListNode The parenthesized parameters, when used.
   * @param colonNode The colon introducing a return annotation, when present.
   * @param returnTypeNode The explicit return type, when present.
   * @param leadingTrivia Trivia preceding the function.
   * @param trailingTrivia Trivia following the function.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    span: SourceSpan,
    arrowNode: TypeScriptArrowNode | undefined,
    bodyNode: Node,
    modifierNodes?: readonly Node[],
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    parameterNode?: TypeScriptParameterNode,
    parameterListNode?: TypeScriptParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript `as` assertion expression.
 */
export declare class TypeScriptAsExpressionNode extends TypeScriptTypeCheckExpressionNode {
  /**
   * The `as` keyword joining the expression and type.
   */
  public readonly asKeywordNode: TypeScriptAsKeywordNode;

  /**
   * Creates an `as` expression from its value and asserted type.
   *
   * @param expressionNode The asserted expression.
   * @param asKeywordNode The `as` keyword.
   * @param span The exact recovered span of the expression.
   * @param typeNode The asserted type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptTypeCheckExpressionNode} for usage.
   */
  public constructor(
    expressionNode: Node,
    asKeywordNode: TypeScriptAsKeywordNode,
    span: SourceSpan,
    typeNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript `await` expression.
 */
export declare class TypeScriptAwaitExpressionNode extends Node {
  /**
   * The `await` keyword introducing the expression.
   */
  public readonly awaitKeywordNode: TypeScriptAwaitKeywordNode;

  /**
   * The awaited operand, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly expressionNode: Node;

  /**
   * Creates an await expression from its keyword and operand.
   *
   * @param awaitKeywordNode The `await` keyword.
   * @param span The exact recovered span of the expression.
   * @param expressionNode The awaited operand, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    awaitKeywordNode: TypeScriptAwaitKeywordNode,
    span: SourceSpan,
    expressionNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript binary, assignment, or comma expression.
 *
 * @example An expression names its operands and its operator token.
 * ```ts
 * const statement = TypeScriptParser.parse("first + second;").rootNode.children[0];
 * if (statement instanceof TypeScriptExpressionStatementNode && statement.expressionNode instanceof TypeScriptBinaryExpressionNode) {
 *   const expression = statement.expressionNode;
 *   console.log(expression.operatorNode instanceof TypeScriptPlusNode); // true
 *   console.log(expression.leftNode instanceof TypeScriptIdentifierNode); // true
 * }
 * ```
 */
export declare class TypeScriptBinaryExpressionNode extends Node {
  /**
   * The expression to the left of the operator.
   */
  public readonly leftNode: Node;

  /**
   * The exact operator token.
   */
  public readonly operatorNode: Node;

  /**
   * The expression to the right of the operator, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly rightNode: Node;

  /**
   * Creates a binary expression while preserving its exact operator token.
   *
   * @param leftNode The left operand.
   * @param operatorNode The operator token.
   * @param span The exact recovered span of the expression.
   * @param rightNode The right operand, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    leftNode: Node,
    operatorNode: Node,
    span: SourceSpan,
    rightNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript call expression, including optional calls.
 */
export declare class TypeScriptCallExpressionNode extends Node {
  /**
   * The argument list.
   */
  public readonly argumentListNode: TypeScriptArgumentListNode;

  /**
   * The expression being invoked.
   */
  public readonly expressionNode: Node;

  /**
   * The optional-chain token, when this is an optional call.
   */
  public readonly questionDotNode: TypeScriptQuestionDotNode | undefined;

  /**
   * The explicit type arguments, when present.
   */
  public readonly typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;

  /**
   * Creates a call expression from its callee and invocation suffix.
   *
   * @param expressionNode The callee expression.
   * @param span The exact recovered span of the call.
   * @param argumentListNode The value arguments.
   * @param questionDotNode The optional-chain token, when present.
   * @param typeArgumentListNode The explicit type arguments, when present.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    expressionNode: Node,
    span: SourceSpan,
    argumentListNode: TypeScriptArgumentListNode,
    questionDotNode?: TypeScriptQuestionDotNode,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A named interface and its ordered type members.
 * Inherited `children` contains only members; keywords, braces, type parameters,
 * and heritage clauses occupy their named roles without duplication.
 * The node records syntax, not structural type checking or declaration merging.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("interface Box<T> { value: T; }");
 * const node = result.rootNode.children[0];
 * if (node instanceof TypeScriptInterfaceDeclarationNode)
 *   console.log(node.children.length); // 1
 * ```
 */
export declare class TypeScriptInterfaceDeclarationNode extends CompositeNode {
  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The introducing `interface` keyword.
   */
  public readonly interfaceKeywordNode: TypeScriptInterfaceKeywordNode;

  /**
   * The declared name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly nameNode: Node;

  /**
   * The generic type parameters, when present.
   */
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  /**
   * The written heritage clauses in source order, including recovered clauses.
   * Their legality is not established by their presence in this sequence.
   */
  public readonly heritageClauseNodes: readonly TypeScriptHeritageClauseNode[];

  /**
   * The opening body brace, when present.
   */
  public readonly openBraceNode: TypeScriptOpenBraceNode | undefined;

  /**
   * The closing body brace; undefined if the body was absent or incomplete.
   */
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  /**
   * Creates an interface from its named roles and ordered members.
   *
   * @param interfaceKeywordNode The introducing keyword.
   * @param memberNodes The members in source order, retained as `children` without cloning. Do not mutate the sequence after publication.
   * @param heritageClauseNodes The heritage clauses in source order, retained without cloning. Use an empty sequence when absent.
   * @param span The absolute UTF-16 span of the recovered declaration.
   * @param nameNode The declared name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param typeParameterListNode The type parameters, when present.
   * @param openBraceNode The opening brace, when recovered.
   * @param closeBraceNode The closing brace, when recovered.
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param leadingTrivia Trivia preceding the declaration.
   * @param trailingTrivia Trivia following the declaration.
   *
   * @example See {@link TypeScriptInterfaceDeclarationNode} for a parsed generic interface.
   */
  public constructor(
    interfaceKeywordNode: TypeScriptInterfaceKeywordNode,
    memberNodes: readonly Node[],
    heritageClauseNodes: readonly TypeScriptHeritageClauseNode[],
    span: SourceSpan,
    nameNode: Node,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    openBraceNode?: TypeScriptOpenBraceNode,
    closeBraceNode?: TypeScriptCloseBraceNode,
    modifierNodes?: readonly Node[],
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * An enum declaration retaining its members and written separators.
 * Initializers remain syntax trees; implicit values and constant evaluation
 * are responsibilities of semantic analysis, not this node.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("enum Color { Red, Green = 2 }");
 * const node = result.rootNode.children[0];
 * if (node instanceof TypeScriptEnumDeclarationNode)
 *   console.log(node.children.length, node.commaNodes.length); // 2, 1
 * ```
 */
export declare class TypeScriptEnumDeclarationNode extends TypeScriptDelimitedListNode {
  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The enum members in source order, excluding comma tokens and named declaration roles.
   */
  public readonly children: readonly TypeScriptEnumMemberNode[];

  /**
   * The introducing `enum` keyword.
   */
  public readonly enumKeywordNode: TypeScriptEnumKeywordNode;

  /**
   * The declared name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly nameNode: Node;

  /**
   * The opening body brace, when present.
   */
  public readonly openBraceNode: TypeScriptOpenBraceNode | undefined;

  /**
   * The closing body brace; undefined if the body was absent or incomplete.
   */
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  /**
   * Creates an enum without computing member values.
   *
   * @param enumKeywordNode The introducing keyword.
   * @param memberNodes The members in source order, retained as `children` without cloning. Do not mutate the sequence after publication.
   * @param commaNodes The consumed separators in source order, retained without cloning. Do not mutate the sequence after publication.
   * @param span The absolute UTF-16 span of the recovered declaration.
   * @param nameNode The declared name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param openBraceNode The opening brace, when recovered.
   * @param closeBraceNode The closing brace, when recovered.
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param leadingTrivia Trivia preceding the declaration.
   * @param trailingTrivia Trivia following the declaration.
   *
   * @example See {@link TypeScriptEnumDeclarationNode} for explicit and implicit initializers.
   */
  public constructor(
    enumKeywordNode: TypeScriptEnumKeywordNode,
    memberNodes: readonly TypeScriptEnumMemberNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    nameNode: Node,
    openBraceNode?: TypeScriptOpenBraceNode,
    closeBraceNode?: TypeScriptCloseBraceNode,
    modifierNodes?: readonly Node[],
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * One enum member with its written name and optional initializer expression.
 * Retaining a name or expression does not establish its semantic legality.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("enum Mode { First, Second = 1 + 2 }");
 * const node = result.rootNode.children[0];
 * if (node instanceof TypeScriptEnumDeclarationNode)
 *   console.log(node.children[0]?.initializerNode); // undefined, not an inferred zero
 * ```
 */
export declare class TypeScriptEnumMemberNode extends Node {
  /**
   * The written property name, including literal or computed names retained for validation.
   */
  public readonly nameNode: Node;

  /**
   * The assignment token, when an explicit initializer was started.
   */
  public readonly equalsNode: TypeScriptEqualsNode | undefined;

  /**
   * The initializer syntax, or undefined for an implicit member.
   * A written equals sign with a missing expression can produce a
   * {@link TypeScriptMissingExpressionNode}; no numeric value is inferred.
   */
  public readonly initializerNode: Node | undefined;

  /**
   * Creates a member from its name and optional initializer.
   *
   * @param nameNode The written member name.
   * @param span The absolute UTF-16 span from the name through the recovered initializer, excluding any following comma.
   * @param equalsNode The assignment token, when present.
   * @param initializerNode The initializer expression, when present or recovered; never an evaluated constant.
   * @param leadingTrivia Trivia preceding the member.
   * @param trailingTrivia Trivia following the member.
   *
   * @example See {@link TypeScriptEnumMemberNode} for an implicit member with no synthesized value.
   */
  public constructor(
    nameNode: Node,
    span: SourceSpan,
    equalsNode?: TypeScriptEqualsNode,
    initializerNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A declaration prefix that could not be attached to a supported declaration.
 * Keeps its written tokens for recovery; it does not represent a valid declaration.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("@decorator");
 * console.log(result.rootNode.children[0] instanceof TypeScriptMissingDeclarationNode); // true
 * console.log(result.diagnostics.length > 0); // true
 * ```
 */
export declare class TypeScriptMissingDeclarationNode extends Node {
  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * Retains a declaration prefix without inventing a declaration body.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param span The absolute UTF-16 span of the consumed prefix.
   * @param leadingTrivia Trivia preceding the prefix.
   * @param trailingTrivia Trivia following the prefix.
   *
   * @example See {@link TypeScriptMissingDeclarationNode} for a recovered prefix.
   */
  public constructor(modifierNodes: readonly Node[], span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The shared written roles of a named import or export specifier.
 *
 * @example See {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode} for module-syntax examples.
 */
export declare abstract class TypeScriptImportExportSpecifierNode extends Node {
  /**
   * The first written name.
   */
  public readonly nameNode: Node;

  /**
   * The alias separator, when present.
   */
  public readonly asKeywordNode: TypeScriptAsKeywordNode | undefined;

  /**
   * The written alias after `as`, a {@link TypeScriptMissingIdentifierNode} where the source lacks one; undefined without `as`.
   */
  public readonly aliasNode: Node | undefined;

  /**
   * The specifier-level type-only marker; a binding named type does not populate this role.
   */
  public readonly typeKeywordNode: TypeScriptTypeKeywordNode | undefined;

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param nameNode The first written name.
   * @param asKeywordNode The alias separator, when present.
   * @param aliasNode The written alias after `as`, a {@link TypeScriptMissingIdentifierNode} where the source lacks one; undefined without `as`.
   * @param typeKeywordNode The specifier-level type-only marker; a binding named type does not populate this role.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    span: SourceSpan,
    nameNode: Node,
    asKeywordNode?: TypeScriptAsKeywordNode,
    aliasNode?: Node,
    typeKeywordNode?: TypeScriptTypeKeywordNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A braced list of named imports; children contains only import specifiers.
 *
 * @example See {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode} for module-syntax examples.
 */
export declare class TypeScriptNamedImportsNode extends TypeScriptDelimitedListNode {
  /**
   * The ordered entries, excluding separators and the named enclosing roles.
   */
  public readonly children: readonly TypeScriptImportSpecifierNode[];

  /**
   * The opening brace, when recovered.
   */
  public readonly openBraceNode: TypeScriptOpenBraceNode | undefined;

  /**
   * The closing brace, when recovered.
   */
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param memberNodes The ordered entries retained as children. The sequence is retained without cloning; do not mutate it after publication.
   * @param commaNodes The written comma separators in source order, including a trailing comma. The sequence is retained without cloning; do not mutate it after publication.
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param openBraceNode The opening brace, when recovered.
   * @param closeBraceNode The closing brace, when recovered.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    memberNodes: readonly TypeScriptImportSpecifierNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    openBraceNode?: TypeScriptOpenBraceNode,
    closeBraceNode?: TypeScriptCloseBraceNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A braced list of named exports; children contains only export specifiers.
 *
 * @example See {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode} for module-syntax examples.
 */
export declare class TypeScriptNamedExportsNode extends TypeScriptDelimitedListNode {
  /**
   * The ordered entries, excluding separators and the named enclosing roles.
   */
  public readonly children: readonly TypeScriptExportSpecifierNode[];

  /**
   * The opening brace, when recovered.
   */
  public readonly openBraceNode: TypeScriptOpenBraceNode | undefined;

  /**
   * The closing brace, when recovered.
   */
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param memberNodes The ordered entries retained as children. The sequence is retained without cloning; do not mutate it after publication.
   * @param commaNodes The written comma separators in source order, including a trailing comma. The sequence is retained without cloning; do not mutate it after publication.
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param openBraceNode The opening brace, when recovered.
   * @param closeBraceNode The closing brace, when recovered.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    memberNodes: readonly TypeScriptExportSpecifierNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    openBraceNode?: TypeScriptOpenBraceNode,
    closeBraceNode?: TypeScriptCloseBraceNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A namespace import binding written as * as name.
 *
 * @example See {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode} for module-syntax examples.
 */
export declare class TypeScriptNamespaceImportNode extends Node {
  /**
   * The star introducing the namespace binding.
   */
  public readonly asteriskNode: TypeScriptAsteriskNode;

  /**
   * The required alias separator, or undefined during recovery.
   */
  public readonly asKeywordNode: TypeScriptAsKeywordNode | undefined;

  /**
   * The local namespace binding name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly nameNode: Node;

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param asteriskNode The star introducing the namespace binding.
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param nameNode The local namespace binding name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param asKeywordNode The required alias separator, or undefined during recovery.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    asteriskNode: TypeScriptAsteriskNode,
    span: SourceSpan,
    nameNode: Node,
    asKeywordNode?: TypeScriptAsKeywordNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A wildcard export, optionally assigning a namespace alias.
 *
 * @example See {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode} for module-syntax examples.
 */
export declare class TypeScriptNamespaceExportNode extends Node {
  /**
   * The star selecting the exported namespace.
   */
  public readonly asteriskNode: TypeScriptAsteriskNode;

  /**
   * The optional alias separator.
   */
  public readonly asKeywordNode: TypeScriptAsKeywordNode | undefined;

  /**
   * The exported alias after `as`, a {@link TypeScriptMissingIdentifierNode} where the source lacks one; undefined for an unaliased wildcard.
   */
  public readonly nameNode: Node | undefined;

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param asteriskNode The star selecting the exported namespace.
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param asKeywordNode The optional alias separator.
   * @param nameNode The exported alias after `as`, a {@link TypeScriptMissingIdentifierNode} where the source lacks one; undefined for an unaliased wildcard.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    asteriskNode: TypeScriptAsteriskNode,
    span: SourceSpan,
    asKeywordNode?: TypeScriptAsKeywordNode,
    nameNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * The binding portion of an import, excluding import, from, and the module specifier.
 *
 * @example See {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode} for module-syntax examples.
 */
export declare class TypeScriptImportClauseNode extends Node {
  /**
   * The default import binding, when present.
   */
  public readonly defaultNameNode: Node | undefined;

  /**
   * The comma joining a default binding to named or namespace bindings.
   */
  public readonly commaNode: TypeScriptCommaNode | undefined;

  /**
   * The named or namespace bindings, when present.
   */
  public readonly namedBindingsNode: TypeScriptNamedImportsNode | TypeScriptNamespaceImportNode | undefined;

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param defaultNameNode The default import binding, when present.
   * @param commaNode The comma joining a default binding to named or namespace bindings.
   * @param namedBindingsNode The named or namespace bindings, when present.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    span: SourceSpan,
    defaultNameNode?: Node,
    commaNode?: TypeScriptCommaNode,
    namedBindingsNode?: TypeScriptNamedImportsNode | TypeScriptNamespaceImportNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * One written import attribute, retaining its name and value syntax without evaluating it.
 *
 * @example See {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode} for module-syntax examples.
 */
export declare class TypeScriptImportAttributeNode extends Node {
  /**
   * The attribute name.
   */
  public readonly nameNode: Node;

  /**
   * The name/value separator, when recovered.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The value expression, including a missing-expression node during recovery.
   */
  public readonly valueNode: Node;

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param nameNode The attribute name.
   * @param valueNode The value expression, including a missing-expression node during recovery.
   * @param colonNode The name/value separator, when recovered.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    span: SourceSpan,
    nameNode: Node,
    valueNode: Node,
    colonNode?: TypeScriptColonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A with or legacy assert attribute clause; children contains only attribute entries.
 *
 * @example See {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode} for module-syntax examples.
 */
export declare class TypeScriptImportAttributesNode extends TypeScriptDelimitedListNode {
  /**
   * The ordered entries, excluding separators and the named enclosing roles.
   */
  public readonly children: readonly TypeScriptImportAttributeNode[];

  /**
   * The introducing keyword, which an import type may leave unwritten. Legacy assert syntax is retained alongside its diagnostic.
   */
  public readonly keywordNode: TypeScriptWithKeywordNode | TypeScriptAssertKeywordNode | undefined;

  /**
   * The opening attribute brace, when recovered.
   */
  public readonly openBraceNode: TypeScriptOpenBraceNode | undefined;

  /**
   * The closing attribute brace, when recovered.
   */
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  /**
   * The colon an import type writes after the keyword.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param keywordNode The introducing keyword, which an import type may leave unwritten. Legacy assert syntax is retained alongside its diagnostic.
   * @param memberNodes The ordered entries retained as children. The sequence is retained without cloning; do not mutate it after publication.
   * @param commaNodes The written comma separators in source order, including a trailing comma. The sequence is retained without cloning; do not mutate it after publication.
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param openBraceNode The opening attribute brace, when recovered.
   * @param closeBraceNode The closing attribute brace, when recovered.
   * @param colonNode The colon an import type writes after the keyword.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    keywordNode: TypeScriptWithKeywordNode | TypeScriptAssertKeywordNode | undefined,
    memberNodes: readonly TypeScriptImportAttributeNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    openBraceNode?: TypeScriptOpenBraceNode,
    closeBraceNode?: TypeScriptCloseBraceNode,
    colonNode?: TypeScriptColonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A static import declaration. This node records syntax, not module loading or resolution.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse('import main, { value as alias } from "pkg";');
 * const node = result.rootNode.children[0];
 * if (node instanceof TypeScriptImportDeclarationNode)
 *   console.log(node.importClauseNode?.namedBindingsNode instanceof TypeScriptNamedImportsNode); // true
 * ```
 */
export declare class TypeScriptImportDeclarationNode extends Node {
  /**
   * The introducing import keyword.
   */
  public readonly importKeywordNode: TypeScriptImportKeywordNode;

  /**
   * The written type-only or deferred-import marker; absent for an ordinary import.
   */
  public readonly phaseKeywordNode: TypeScriptTypeKeywordNode | TypeScriptDeferKeywordNode | undefined;

  /**
   * The binding clause; absent for a side-effect-only import.
   */
  public readonly importClauseNode: TypeScriptImportClauseNode | undefined;

  /**
   * The from keyword, when written or recovered.
   */
  public readonly fromKeywordNode: TypeScriptFromKeywordNode | undefined;

  /**
   * The written module-specifier expression, including a missing-expression node during recovery. It is not established to be a valid
   * string literal.
   */
  public readonly moduleSpecifierNode: Node;

  /**
   * The import attributes, when present.
   */
  public readonly attributesNode: TypeScriptImportAttributesNode | undefined;

  /**
   * The explicit statement terminator; undefined for an automatic terminator or recovery.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param importKeywordNode The introducing import keyword.
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param moduleSpecifierNode The written module-specifier expression, including a missing-expression node during recovery. It is not
   * established to be a valid string literal.
   * @param phaseKeywordNode The declaration-level type or defer marker, when present.
   * @param importClauseNode The binding clause; absent for a side-effect-only import.
   * @param fromKeywordNode The from keyword, when written or recovered.
   * @param attributesNode The import attributes, when present.
   * @param semicolonNode The explicit statement terminator; undefined for an automatic terminator or recovery.
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    importKeywordNode: TypeScriptImportKeywordNode,
    span: SourceSpan,
    moduleSpecifierNode: Node,
    phaseKeywordNode?: TypeScriptTypeKeywordNode | TypeScriptDeferKeywordNode,
    importClauseNode?: TypeScriptImportClauseNode,
    fromKeywordNode?: TypeScriptFromKeywordNode,
    attributesNode?: TypeScriptImportAttributesNode,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes?: readonly Node[],
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A require(module) reference inside an import-equals declaration, not an ordinary runtime call.
 *
 * @example See {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode} for module-syntax examples.
 */
export declare class TypeScriptExternalModuleReferenceNode extends Node {
  /**
   * The introducing require keyword.
   */
  public readonly requireKeywordNode: TypeScriptRequireKeywordNode;

  /**
   * The opening parenthesis following require.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode;

  /**
   * The written module expression, including a missing-expression node during recovery; no module is loaded.
   */
  public readonly moduleSpecifierNode: Node;

  /**
   * The closing parenthesis, when recovered.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param requireKeywordNode The introducing require keyword.
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param openParenthesisNode The opening parenthesis following require.
   * @param moduleSpecifierNode The written module expression, including a missing-expression node during recovery; no module is loaded.
   * @param closeParenthesisNode The closing parenthesis, when recovered.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    requireKeywordNode: TypeScriptRequireKeywordNode,
    span: SourceSpan,
    openParenthesisNode: TypeScriptOpenParenthesisNode,
    moduleSpecifierNode: Node,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript import-equals declaration, referring to an external module or a qualified entity name.
 *
 * @example See {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode} for module-syntax examples.
 */
export declare class TypeScriptImportEqualsDeclarationNode extends Node {
  /**
   * The introducing import keyword.
   */
  public readonly importKeywordNode: TypeScriptImportKeywordNode;

  /**
   * The local binding name.
   */
  public readonly nameNode: Node;

  /**
   * The equals token, when recovered.
   */
  public readonly equalsNode: TypeScriptEqualsNode | undefined;

  /**
   * The qualified name or external module reference; a name missing its head starts with a {@link TypeScriptMissingIdentifierNode}.
   */
  public readonly moduleReferenceNode: Node;

  /**
   * The type-only import marker, when present.
   */
  public readonly typeKeywordNode: TypeScriptTypeKeywordNode | undefined;

  /**
   * The explicit terminator, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param importKeywordNode The introducing import keyword.
   * @param nameNode The local binding name.
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param moduleReferenceNode The qualified name or external module reference; a name missing its head starts with a
   * {@link TypeScriptMissingIdentifierNode}.
   * @param equalsNode The equals token, when recovered.
   * @param typeKeywordNode The type-only import marker, when present.
   * @param semicolonNode The explicit terminator, when present.
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    importKeywordNode: TypeScriptImportKeywordNode,
    nameNode: Node,
    span: SourceSpan,
    moduleReferenceNode: Node,
    equalsNode?: TypeScriptEqualsNode,
    typeKeywordNode?: TypeScriptTypeKeywordNode,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes?: readonly Node[],
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A named or wildcard export, optionally re-exporting from a module. Binding and resolution are not performed here.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse('export { value as renamed } from "pkg";');
 * const node = result.rootNode.children[0];
 * if (node instanceof TypeScriptExportDeclarationNode)
 *   console.log(node.exportClauseNode instanceof TypeScriptNamedExportsNode); // true
 * ```
 */
export declare class TypeScriptExportDeclarationNode extends Node {
  /**
   * The introducing export keyword.
   */
  public readonly exportKeywordNode: TypeScriptExportKeywordNode;

  /**
   * The declaration-level type-only marker, when present.
   */
  public readonly typeKeywordNode: TypeScriptTypeKeywordNode | undefined;

  /**
   * The named exports, or the namespace export holding the wildcard, with or without an alias.
   */
  public readonly exportClauseNode: TypeScriptNamedExportsNode | TypeScriptNamespaceExportNode;

  /**
   * The re-export separator, when present or recovered.
   */
  public readonly fromKeywordNode: TypeScriptFromKeywordNode | undefined;

  /**
   * The written source-module expression, when present.
   */
  public readonly moduleSpecifierNode: Node | undefined;

  /**
   * The re-export attributes, when present.
   */
  public readonly attributesNode: TypeScriptImportAttributesNode | undefined;

  /**
   * The explicit statement terminator, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param exportKeywordNode The introducing export keyword.
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param exportClauseNode The named exports, or the namespace export holding the wildcard, with or without an alias.
   * @param typeKeywordNode The declaration-level type-only marker, when present.
   * @param fromKeywordNode The re-export separator, when present or recovered.
   * @param moduleSpecifierNode The written source-module expression, when present.
   * @param attributesNode The re-export attributes, when present.
   * @param semicolonNode The explicit statement terminator, when present.
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    exportKeywordNode: TypeScriptExportKeywordNode,
    span: SourceSpan,
    exportClauseNode: TypeScriptNamedExportsNode | TypeScriptNamespaceExportNode,
    typeKeywordNode?: TypeScriptTypeKeywordNode,
    fromKeywordNode?: TypeScriptFromKeywordNode,
    moduleSpecifierNode?: Node,
    attributesNode?: TypeScriptImportAttributesNode,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes?: readonly Node[],
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A value export written with export default or export equals. Default-exported declarations use their own declaration nodes instead.
 *
 * @example See {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode} for module-syntax examples.
 */
export declare class TypeScriptExportAssignmentNode extends Node {
  /**
   * The introducing export keyword.
   */
  public readonly exportKeywordNode: TypeScriptExportKeywordNode;

  /**
   * The default keyword or equals token identifying the assignment form.
   */
  public readonly assignmentTokenNode: TypeScriptDefaultKeywordNode | TypeScriptEqualsNode;

  /**
   * The exported expression, including a missing-expression node during recovery.
   */
  public readonly expressionNode: Node;

  /**
   * The explicit statement terminator, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param exportKeywordNode The introducing export keyword.
   * @param assignmentTokenNode The default keyword or equals token identifying the assignment form.
   * @param expressionNode The exported expression, including a missing-expression node during recovery.
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param semicolonNode The explicit statement terminator, when present.
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    exportKeywordNode: TypeScriptExportKeywordNode,
    assignmentTokenNode: TypeScriptDefaultKeywordNode | TypeScriptEqualsNode,
    expressionNode: Node,
    span: SourceSpan,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes?: readonly Node[],
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * An export-as-namespace declaration exposing a module under a global namespace name.
 *
 * @example See {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode} for module-syntax examples.
 */
export declare class TypeScriptNamespaceExportDeclarationNode extends Node {
  /**
   * The introducing export keyword.
   */
  public readonly exportKeywordNode: TypeScriptExportKeywordNode;

  /**
   * The as keyword following export.
   */
  public readonly asKeywordNode: TypeScriptAsKeywordNode;

  /**
   * The namespace keyword, when recovered.
   */
  public readonly namespaceKeywordNode: TypeScriptNamespaceKeywordNode | undefined;

  /**
   * The global namespace name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly nameNode: Node;

  /**
   * The explicit terminator, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * Creates this syntax node from its written roles without semantic evaluation.
   *
   * @param exportKeywordNode The introducing export keyword.
   * @param span The absolute UTF-16 span of the recovered syntax.
   * @param asKeywordNode The as keyword following export.
   * @param nameNode The global namespace name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param namespaceKeywordNode The namespace keyword, when recovered.
   * @param semicolonNode The explicit terminator, when present.
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param leadingTrivia Trivia preceding this syntax.
   * @param trailingTrivia Trivia following this syntax.
   *
   * @example See the examples on {@link TypeScriptImportDeclarationNode} and {@link TypeScriptExportDeclarationNode}.
   */
  public constructor(
    exportKeywordNode: TypeScriptExportKeywordNode,
    span: SourceSpan,
    asKeywordNode: TypeScriptAsKeywordNode,
    nameNode: Node,
    namespaceKeywordNode?: TypeScriptNamespaceKeywordNode,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes?: readonly Node[],
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A named import; nameNode selects the imported name and aliasNode, when present, is the local binding.
 * Inherits the constructor and syntax roles of {@link TypeScriptImportExportSpecifierNode}.
 *
 * @example See {@link TypeScriptImportDeclarationNode}.
 */
export declare class TypeScriptImportSpecifierNode extends TypeScriptImportExportSpecifierNode { }

/**
 * A named export; nameNode selects the source name and aliasNode, when present, is the exported name.
 * Inherits the constructor and syntax roles of {@link TypeScriptImportExportSpecifierNode}.
 *
 * @example See {@link TypeScriptExportDeclarationNode}.
 */
export declare class TypeScriptExportSpecifierNode extends TypeScriptImportExportSpecifierNode { }

/**
 * A namespace, legacy named module, quoted external module, or global augmentation.
 * Dotted names use {@link TypeScriptQualifiedNameNode}; no nested declarations or
 * implicit export tokens are invented. Scope creation, augmentation legality, and
 * declaration merging belong to later semantic analysis.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("export namespace App.Tools { export const version = 1; }");
 * const node = result.rootNode.children[0];
 * if (node instanceof TypeScriptModuleDeclarationNode)
 *   console.log(node.nameNode instanceof TypeScriptQualifiedNameNode); // true
 * ```
 */
export declare class TypeScriptModuleDeclarationNode extends Node {
  /**
   * The written module, namespace, or global keyword identifying the declaration form.
   */
  public readonly keywordNode: TypeScriptModuleKeywordNode | TypeScriptNamespaceKeywordNode | TypeScriptGlobalKeywordNode;

  /**
   * The simple or qualified identifier name, or the quoted external-module name.
   * Undefined for a global augmentation. Missing identifier positions may contain
   * {@link TypeScriptMissingIdentifierNode}; no spelling is synthesized.
   */
  public readonly nameNode: Node | undefined;

  /**
   * The statement block. Undefined for a bodyless quoted module or global form;
   * a namespace or identifier module whose opening brace is missing holds an
   * empty, zero-width block without braces.
   */
  public readonly bodyNode: TypeScriptBlockNode | undefined;

  /**
   * The explicit terminator of a bodyless quoted-module or global form.
   * Undefined for an automatic terminator or a declaration with a body.
   * A semicolon after a body is a separate empty statement.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * Creates a module-family declaration from its written syntax roles.
   *
   * @param keywordNode The introducing module, namespace, or global keyword.
   * @param span The absolute UTF-16 span of the recovered declaration.
   * @param nameNode The simple, qualified, quoted, or recovered name; omitted for global augmentation.
   * @param bodyNode The statement block; omitted only for a bodyless quoted module or global form.
   * @param semicolonNode The explicit terminator of a bodyless form, when present.
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param leadingTrivia Trivia preceding the declaration.
   * @param trailingTrivia Trivia following the declaration.
   *
   * @example See {@link TypeScriptModuleDeclarationNode} for a parsed dotted namespace.
   */
  public constructor(
    keywordNode: TypeScriptModuleKeywordNode | TypeScriptNamespaceKeywordNode | TypeScriptGlobalKeywordNode,
    span: SourceSpan,
    nameNode?: Node,
    bodyNode?: TypeScriptBlockNode,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes?: readonly Node[],
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * An identifier position that could not be populated from source.
 * This recovery node has no invented identifier text; the parser writes it zero-width at the end of the preceding token and without
 * trivia.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("namespace App. {}");
 * const node = result.rootNode.children[0];
 * if (node instanceof TypeScriptModuleDeclarationNode && node.nameNode instanceof TypeScriptQualifiedNameNode)
 *   console.log(node.nameNode.rightNode instanceof TypeScriptMissingIdentifierNode); // true
 * ```
 */
export declare class TypeScriptMissingIdentifierNode extends Node {
  /**
   * Creates a missing-identifier marker without supplying a spelling.
   *
   * @param span The absolute UTF-16 recovery span; parser-produced markers are zero-width at the end of the preceding token.
   * @param leadingTrivia Trivia associated with the missing position, when present.
   * @param trailingTrivia Following trivia associated with the marker, when present.
   *
   * @example See {@link TypeScriptMissingIdentifierNode} for dotted-name recovery.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A with statement retaining its object expression and statement body. Scope effects and strict-mode legality are checked after parsing.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("with (scope) run();");
 * const node = result.rootNode.children[0];
 * console.log(node instanceof TypeScriptWithStatementNode); // true
 * ```
 */
export declare class TypeScriptWithStatementNode extends Node {
  /**
   * The written with keyword.
   */
  public readonly withKeywordNode: TypeScriptWithKeywordNode;

  /**
   * The expression tree, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly expressionNode: Node;

  /**
   * The single statement body, which may itself be a block or another labeled statement.
   */
  public readonly statementNode: Node;

  /**
   * The written opening parenthesis; undefined when absent or missing during recovery.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;

  /**
   * The written closing parenthesis; undefined when absent or missing during recovery.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * Creates this syntax from its recovered, source-owned roles.
   *
   * @param withKeywordNode The written with keyword.
   * @param expressionNode The expression tree, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param statementNode The single statement body, which may itself be a block or another labeled statement.
   * @param span The absolute UTF-16 source span of the recovered syntax, including written delimiters but excluding surrounding trivia.
   * @param openParenthesisNode The written opening parenthesis; undefined when absent or missing during recovery.
   * @param closeParenthesisNode The written closing parenthesis; undefined when absent or missing during recovery.
   * @param leadingTrivia Trivia preceding this syntax, when present.
   * @param trailingTrivia Trivia following this syntax, when present.
   *
   * @example See {@link TypeScriptWithStatementNode} for parsed syntax.
   */
  public constructor(
    withKeywordNode: TypeScriptWithKeywordNode,
    expressionNode: Node,
    statementNode: Node,
    span: SourceSpan,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * An identifier label and the statement it labels. Duplicate labels and jump-target legality belong to later grammar validation.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("outer: while (ready) break outer;");
 * const node = result.rootNode.children[0];
 * console.log(node instanceof TypeScriptLabeledStatementNode); // true
 * ```
 */
export declare class TypeScriptLabeledStatementNode extends Node {
  /**
   * The parsed identifier or contextual-keyword name used as the label, without a duplicate text field.
   */
  public readonly labelNode: Node;

  /**
   * The written colon separating the header from its statements.
   */
  public readonly colonNode: TypeScriptColonNode;

  /**
   * The single statement body, which may itself be a block or another labeled statement.
   */
  public readonly statementNode: Node;

  /**
   * Creates this syntax from its recovered, source-owned roles.
   *
   * @param labelNode The parsed identifier or contextual-keyword name used as the label, without a duplicate text field.
   * @param colonNode The written colon separating the header from its statements.
   * @param statementNode The single statement body, which may itself be a block or another labeled statement.
   * @param span The absolute UTF-16 source span of the recovered syntax, including written delimiters but excluding surrounding trivia.
   * @param leadingTrivia Trivia preceding this syntax, when present.
   * @param trailingTrivia Trivia following this syntax, when present.
   *
   * @example See {@link TypeScriptLabeledStatementNode} for parsed syntax.
   */
  public constructor(
    labelNode: Node,
    colonNode: TypeScriptColonNode,
    statementNode: Node,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A switch case whose children are its statements in source order. An empty list preserves fall-through into the next clause.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("switch (value) { case 1: }");
 * const node = result.rootNode.children[0];
 * console.log(node instanceof TypeScriptSwitchStatementNode && node.caseBlockNode.children[0] instanceof TypeScriptCaseClauseNode); // true
 * ```
 */
export declare class TypeScriptCaseClauseNode extends CompositeNode {
  /**
   * The written case keyword.
   */
  public readonly caseKeywordNode: TypeScriptCaseKeywordNode;

  /**
   * The case expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly expressionNode: Node;

  /**
   * The written colon separating the header from its statements. Undefined when the colon is missing.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * Creates this syntax from its recovered, source-owned roles.
   *
   * @param caseKeywordNode The written case keyword.
   * @param expressionNode The case expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param statements The statements in source order, stored only in children. The collection is retained without cloning and must not be
   * mutated after publication.
   * @param span The absolute UTF-16 source span of the recovered syntax, including written delimiters but excluding surrounding trivia.
   * @param colonNode The written colon separating the header from its statements.
   * @param leadingTrivia Trivia preceding this syntax, when present.
   * @param trailingTrivia Trivia following this syntax, when present.
   *
   * @example See {@link TypeScriptCaseClauseNode} for parsed syntax.
   */
  public constructor(
    caseKeywordNode: TypeScriptCaseKeywordNode,
    expressionNode: Node,
    statements: readonly Node[],
    span: SourceSpan,
    colonNode?: TypeScriptColonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A switch default clause whose children are its statements in source order. Duplicate default clauses remain in the tree for later validation.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("switch (value) { default: }");
 * const node = result.rootNode.children[0];
 * console.log(node instanceof TypeScriptSwitchStatementNode && node.caseBlockNode.children[0] instanceof TypeScriptDefaultClauseNode); // true
 * ```
 */
export declare class TypeScriptDefaultClauseNode extends CompositeNode {
  /**
   * The written default keyword.
   */
  public readonly defaultKeywordNode: TypeScriptDefaultKeywordNode;

  /**
   * The written colon separating the header from its statements. Undefined when the colon is missing.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * Creates this syntax from its recovered, source-owned roles.
   *
   * @param defaultKeywordNode The written default keyword.
   * @param statements The statements in source order, stored only in children. The collection is retained without cloning and must not be
   * mutated after publication.
   * @param span The absolute UTF-16 source span of the recovered syntax, including written delimiters but excluding surrounding trivia.
   * @param colonNode The written colon separating the header from its statements.
   * @param leadingTrivia Trivia preceding this syntax, when present.
   * @param trailingTrivia Trivia following this syntax, when present.
   *
   * @example See {@link TypeScriptDefaultClauseNode} for parsed syntax.
   */
  public constructor(
    defaultKeywordNode: TypeScriptDefaultKeywordNode,
    statements: readonly Node[],
    span: SourceSpan,
    colonNode?: TypeScriptColonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * The ordered case and default clauses of a switch statement, held in children. A malformed block may lack either brace.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("switch (value) {}");
 * const node = result.rootNode.children[0];
 * console.log(node instanceof TypeScriptSwitchStatementNode && node.caseBlockNode.children.length === 0); // true
 * ```
 */
export declare class TypeScriptCaseBlockNode extends CompositeNode {
  /**
   * The written opening brace; undefined when missing during recovery.
   */
  public readonly openBraceNode: TypeScriptOpenBraceNode | undefined;

  /**
   * The written closing brace; undefined when missing during recovery.
   */
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  /**
   * Creates this syntax from its recovered, source-owned roles.
   *
   * @param clauses The case and default clauses in source order, stored only in children. The collection is retained without cloning and must
   * not be mutated after publication.
   * @param span The absolute UTF-16 source span of the recovered syntax, including written delimiters but excluding surrounding trivia.
   * @param openBraceNode The written opening brace; undefined when missing during recovery.
   * @param closeBraceNode The written closing brace; undefined when missing during recovery.
   * @param leadingTrivia Trivia preceding this syntax, when present.
   * @param trailingTrivia Trivia following this syntax, when present.
   *
   * @example See {@link TypeScriptCaseBlockNode} for parsed syntax.
   */
  public constructor(
    clauses: readonly (TypeScriptCaseClauseNode | TypeScriptDefaultClauseNode)[],
    span: SourceSpan,
    openBraceNode?: TypeScriptOpenBraceNode,
    closeBraceNode?: TypeScriptCloseBraceNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A switch statement retaining its selection expression and ordered case block. Case expressions are not evaluated during parsing.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("switch (value) { case 1: break; default: run(); }");
 * const node = result.rootNode.children[0];
 * console.log(node instanceof TypeScriptSwitchStatementNode); // true
 * ```
 */
export declare class TypeScriptSwitchStatementNode extends Node {
  /**
   * The written switch keyword.
   */
  public readonly switchKeywordNode: TypeScriptSwitchKeywordNode;

  /**
   * The expression tree, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly expressionNode: Node;

  /**
   * The case block; its children retain written clause order, including empty and duplicate clauses.
   */
  public readonly caseBlockNode: TypeScriptCaseBlockNode;

  /**
   * The written opening parenthesis; undefined when absent or missing during recovery.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;

  /**
   * The written closing parenthesis; undefined when absent or missing during recovery.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * Creates this syntax from its recovered, source-owned roles.
   *
   * @param switchKeywordNode The written switch keyword.
   * @param expressionNode The expression tree, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param caseBlockNode The case block; its children retain written clause order, including empty and duplicate clauses.
   * @param span The absolute UTF-16 source span of the recovered syntax, including written delimiters but excluding surrounding trivia.
   * @param openParenthesisNode The written opening parenthesis; undefined when absent or missing during recovery.
   * @param closeParenthesisNode The written closing parenthesis; undefined when absent or missing during recovery.
   * @param leadingTrivia Trivia preceding this syntax, when present.
   * @param trailingTrivia Trivia following this syntax, when present.
   *
   * @example See {@link TypeScriptSwitchStatementNode} for parsed syntax.
   */
  public constructor(
    switchKeywordNode: TypeScriptSwitchKeywordNode,
    expressionNode: Node,
    caseBlockNode: TypeScriptCaseBlockNode,
    span: SourceSpan,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A catch clause with an optional binding declaration and its body. Destructuring, type annotations, and invalid initializers are preserved for
 * later validation.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("try {} catch (error: unknown) {}");
 * const node = result.rootNode.children[0];
 * console.log(node instanceof TypeScriptTryStatementNode && node.catchClauseNode instanceof TypeScriptCatchClauseNode); // true
 * ```
 */
export declare class TypeScriptCatchClauseNode extends Node {
  /**
   * The written catch keyword.
   */
  public readonly catchKeywordNode: TypeScriptCatchKeywordNode;

  /**
   * The catch body; an empty, zero-width block without braces where its opening brace is missing.
   */
  public readonly blockNode: TypeScriptBlockNode;

  /**
   * The written opening parenthesis; undefined when absent or missing during recovery.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;

  /**
   * The binding declaration inside catch parentheses; undefined for a bindingless catch. Missing names remain represented by the declaration's
   * recovery state.
   */
  public readonly variableDeclarationNode: TypeScriptVariableDeclarationNode | undefined;

  /**
   * The written closing parenthesis; undefined when absent or missing during recovery.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * Creates this syntax from its recovered, source-owned roles.
   *
   * @param catchKeywordNode The written catch keyword.
   * @param span The absolute UTF-16 source span of the recovered syntax, including written delimiters but excluding surrounding trivia.
   * @param blockNode The catch body; an empty, zero-width block without braces where its opening brace is missing.
   * @param openParenthesisNode The written opening parenthesis; undefined when absent or missing during recovery.
   * @param variableDeclarationNode The binding declaration inside catch parentheses; undefined for a bindingless catch. Missing names remain
   * represented by the declaration's recovery state.
   * @param closeParenthesisNode The written closing parenthesis; undefined when absent or missing during recovery.
   * @param leadingTrivia Trivia preceding this syntax, when present.
   * @param trailingTrivia Trivia following this syntax, when present.
   *
   * @example See {@link TypeScriptCatchClauseNode} for parsed syntax.
   */
  public constructor(
    catchKeywordNode: TypeScriptCatchKeywordNode,
    span: SourceSpan,
    blockNode: TypeScriptBlockNode,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    variableDeclarationNode?: TypeScriptVariableDeclarationNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A try statement retaining its body, optional catch clause, and optional finally body. A body whose opening brace is missing is an empty,
 * zero-width block without braces, and parser diagnostics describe the missing syntax.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("try {} finally {}");
 * const node = result.rootNode.children[0];
 * console.log(node instanceof TypeScriptTryStatementNode); // true
 * ```
 */
export declare class TypeScriptTryStatementNode extends Node {
  /**
   * The written try keyword; undefined when recovering a catch or finally without try.
   */
  public readonly tryKeywordNode: TypeScriptTryKeywordNode | undefined;

  /**
   * The try body; an empty, zero-width block without braces where its opening brace is missing.
   */
  public readonly tryBlockNode: TypeScriptBlockNode;

  /**
   * The catch clause, when one is written; undefined for a try statement that writes only a finally block or neither.
   */
  public readonly catchClauseNode: TypeScriptCatchClauseNode | undefined;

  /**
   * The written finally keyword; undefined when omitted, including recovery from a missing keyword.
   */
  public readonly finallyKeywordNode: TypeScriptFinallyKeywordNode | undefined;

  /**
   * The finally body, written when a finally keyword follows or the catch clause is absent; an empty, zero-width block without braces where
   * its opening brace is missing. After a recovery diagnostic it may be present without a finally keyword.
   */
  public readonly finallyBlockNode: TypeScriptBlockNode | undefined;

  /**
   * Creates this syntax from its recovered, source-owned roles.
   *
   * @param tryKeywordNode The written try keyword; undefined when recovering a catch or finally without try.
   * @param span The absolute UTF-16 source span of the recovered syntax, including written delimiters but excluding surrounding trivia.
   * @param tryBlockNode The try body; an empty, zero-width block without braces where its opening brace is missing.
   * @param catchClauseNode The catch clause, when one is written; undefined for a try statement that writes only a finally block or neither.
   * @param finallyKeywordNode The written finally keyword; undefined when omitted, including recovery from a missing keyword.
   * @param finallyBlockNode The finally body, written when a finally keyword follows or the catch clause is absent; an empty, zero-width block
   * without braces where its opening brace is missing. After a recovery diagnostic it may be present without a finally keyword.
   * @param leadingTrivia Trivia preceding this syntax, when present.
   * @param trailingTrivia Trivia following this syntax, when present.
   *
   * @example See {@link TypeScriptTryStatementNode} for parsed syntax.
   */
  public constructor(
    tryKeywordNode: TypeScriptTryKeywordNode | undefined,
    span: SourceSpan,
    tryBlockNode: TypeScriptBlockNode,
    catchClauseNode?: TypeScriptCatchClauseNode,
    finallyKeywordNode?: TypeScriptFinallyKeywordNode,
    finallyBlockNode?: TypeScriptBlockNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript construct whose children are a comma-delimited list, such as a
 * parameter list, an argument list, or an object literal. The commas are kept
 * apart from the children, a trailing comma included.
 *
 * @example
 * ```ts
 * const statement = TypeScriptParser.parse("call(first, second,);").rootNode.children[0];
 * if (statement instanceof TypeScriptExpressionStatementNode && statement.expressionNode instanceof TypeScriptCallExpressionNode) {
 *   const argumentList = statement.expressionNode.argumentListNode;
 *   console.log(argumentList instanceof TypeScriptDelimitedListNode); // true
 *   console.log(argumentList?.commaNodes.length); // 2
 * }
 * ```
 */
export declare abstract class TypeScriptDelimitedListNode extends CompositeNode {
  /**
   * The written commas in source order, a trailing comma included. The
   * collection is retained without cloning; do not mutate it after publication.
   */
  public readonly commaNodes: readonly TypeScriptCommaNode[];

  /**
   * Creates the shared roles of a delimited list.
   *
   * @param elementNodes The elements in source order, stored as the children and retained without cloning.
   * @param commaNodes The written commas in source order, retained without cloning.
   * @param span The exact recovered span of the construct.
   * @param leadingTrivia Trivia preceding the construct.
   * @param trailingTrivia Trivia following the construct.
   *
   * @see {@link TypeScriptDelimitedListNode} for usage.
   */
  public constructor(elementNodes: readonly Node[], commaNodes: readonly TypeScriptCommaNode[], span: SourceSpan, leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * Shared syntax roles of a TypeScript class declaration or expression.
 */
export declare abstract class TypeScriptClassNode extends Node {
  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The class body; an empty, zero-width body without braces where its opening brace is missing.
   */
  public readonly bodyNode: TypeScriptClassBodyNode;

  /**
   * The `class` keyword introducing the construct.
   */
  public readonly classKeywordNode: TypeScriptClassKeywordNode;

  /**
   * The class heritage clauses in source order.
   */
  public readonly heritageClauseNodes: readonly TypeScriptHeritageClauseNode[];

  /**
   * The class name, when present. This node retains anonymous syntax without
   * validating declaration naming rules.
   */
  public readonly nameNode: Node | undefined;

  /**
   * The generic type-parameter list, when present.
   */
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  /**
   * Creates a class node from its named syntax roles.
   *
   * @param classKeywordNode The `class` keyword.
   * @param heritageClauseNodes The class heritage clauses in source order.
   * @param span The exact recovered span of the construct.
   * @param bodyNode The class body; an empty, zero-width body without braces where its opening brace is missing.
   * @param nameNode The class name, when present.
   * @param typeParameterListNode The generic type parameters, when present.
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param leadingTrivia Trivia preceding the construct.
   * @param trailingTrivia Trivia following the construct.
   *
   * @example See {@link TypeScriptClassDeclarationNode} for a parsed declaration.
   */
  public constructor(
    classKeywordNode: TypeScriptClassKeywordNode,
    heritageClauseNodes: readonly TypeScriptHeritageClauseNode[],
    span: SourceSpan,
    bodyNode: TypeScriptClassBodyNode,
    nameNode?: Node,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    modifierNodes?: readonly Node[],
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A class used as an expression, including anonymous forms.
 * Inherits the syntax roles and constructor documented by {@link TypeScriptClassNode}.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("const Box = class {};");
 * console.log(result.diagnostics.length); // 0
 * ```
 */
export declare class TypeScriptClassExpressionNode extends TypeScriptClassNode { }

/**
 * A class in declaration position, rather than a class expression.
 * Inherits the syntax roles and constructor documented by {@link TypeScriptClassNode}.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("class Box {}");
 * console.log(result.rootNode.children[0] instanceof TypeScriptClassDeclarationNode); // true
 * ```
 */
export declare class TypeScriptClassDeclarationNode extends TypeScriptClassNode { }

/**
 * A TypeScript conditional expression.
 */
export declare class TypeScriptConditionalExpressionNode extends Node {
  /**
   * The colon separating the true and false branches, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The condition evaluated by the expression.
   */
  public readonly conditionNode: Node;

  /**
   * The expression selected for a false condition, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly falseExpressionNode: Node;

  /**
   * The question token introducing the true branch.
   */
  public readonly questionNode: TypeScriptQuestionNode;

  /**
   * The expression selected for a true condition, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly trueExpressionNode: Node;

  /**
   * Creates a conditional expression from its condition and branches.
   *
   * @param conditionNode The condition expression.
   * @param questionNode The question token.
   * @param span The exact recovered span of the expression.
   * @param trueExpressionNode The true branch, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param falseExpressionNode The false branch, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param colonNode The branch separator, when present.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    conditionNode: Node,
    questionNode: TypeScriptQuestionNode,
    span: SourceSpan,
    trueExpressionNode: Node,
    falseExpressionNode: Node,
    colonNode?: TypeScriptColonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript `delete` expression.
 */
export declare class TypeScriptDeleteExpressionNode extends Node {
  /**
   * The `delete` keyword introducing the expression.
   */
  public readonly deleteKeywordNode: TypeScriptDeleteKeywordNode;

  /**
   * The property reference or other operand, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly expressionNode: Node;

  /**
   * Creates a delete expression from its keyword and operand.
   *
   * @param deleteKeywordNode The `delete` keyword.
   * @param span The exact recovered span of the expression.
   * @param expressionNode The operand, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    deleteKeywordNode: TypeScriptDeleteKeywordNode,
    span: SourceSpan,
    expressionNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript bracketed element-access expression.
 */
export declare class TypeScriptElementAccessExpressionNode extends Node {
  /**
   * The index or key expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly argumentExpressionNode: Node;

  /**
   * The closing bracket, when recovered from the source.
   */
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;

  /**
   * The expression whose element is accessed.
   */
  public readonly expressionNode: Node;

  /**
   * The opening bracket beginning the argument.
   */
  public readonly openBracketNode: TypeScriptOpenBracketNode;

  /**
   * The optional-chain token, when this is an optional access.
   */
  public readonly questionDotNode: TypeScriptQuestionDotNode | undefined;

  /**
   * Creates an element access from its receiver and bracketed argument.
   *
   * @param expressionNode The receiver expression.
   * @param span The exact recovered span of the access.
   * @param argumentExpressionNode The index or key expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param openBracketNode The opening bracket.
   * @param questionDotNode The optional-chain token, when present.
   * @param closeBracketNode The closing bracket, when present.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    expressionNode: Node,
    span: SourceSpan,
    argumentExpressionNode: Node,
    openBracketNode: TypeScriptOpenBracketNode,
    questionDotNode?: TypeScriptQuestionDotNode,
    closeBracketNode?: TypeScriptCloseBracketNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * Shared syntax roles of a TypeScript function declaration or expression.
 * Modifiers, including `async`, are stored once in source order.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("export default async function() {}");
 * const node = result.rootNode.children[0];
 * if (node instanceof TypeScriptFunctionDeclarationNode)
 *   console.log(node.modifierNodes.length); // 3: export, default, async
 * ```
 */
export declare abstract class TypeScriptFunctionNode extends Node {
  /**
   * The generator asterisk, when present.
   */
  public readonly asteriskNode: TypeScriptAsteriskNode | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The body, undefined for a declaration ended by a terminator as a bodyless signature. An expression, and a declaration followed by
   * neither its opening brace nor a terminator, hold an empty, zero-width block without braces where the opening brace is missing.
   */
  public readonly bodyNode: TypeScriptBlockNode | undefined;

  /**
   * The colon introducing an explicit return type.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The `function` keyword introducing the construct.
   */
  public readonly functionKeywordNode: TypeScriptFunctionKeywordNode;

  /**
   * The name, when present. An expression or a default export may omit it; any other declaration holds a
   * {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly nameNode: Node | undefined;

  /**
   * The function parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   */
  public readonly parameterListNode: TypeScriptParameterListNode;

  /**
   * The explicit return type, when present.
   */
  public readonly returnTypeNode: Node | undefined;

  /**
   * The generic type-parameter list, when present.
   */
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  /**
   * Creates a function node from its named syntax roles.
   *
   * @param functionKeywordNode The `function` keyword.
   * @param span The exact recovered span of the construct.
   * @param parameterListNode The parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   * @param modifierNodes Written decorators and modifier keywords in source order, `async` included; defaults to an empty sequence. Their presence does not establish legality.
   * @param asteriskNode The generator asterisk, when written.
   * @param nameNode The function name, when written or recovered as a missing identifier.
   * @param typeParameterListNode The generic type parameters, when written.
   * @param colonNode The colon introducing the return type, when written.
   * @param returnTypeNode The explicit return type, when written.
   * @param bodyNode The function body, when written or recovered as an empty, zero-width block without braces.
   * @param leadingTrivia Trivia preceding the function.
   * @param trailingTrivia Trivia following the function.
   *
   * @example See {@link TypeScriptFunctionNode} for reading a parsed function's roles.
   */
  public constructor(
    functionKeywordNode: TypeScriptFunctionKeywordNode,
    span: SourceSpan,
    parameterListNode: TypeScriptParameterListNode,
    modifierNodes?: readonly Node[],
    asteriskNode?: TypeScriptAsteriskNode,
    nameNode?: Node,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    bodyNode?: TypeScriptBlockNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A function used as an expression, including anonymous forms.
 * Inherits the syntax roles and constructor documented by {@link TypeScriptFunctionNode}.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("const ready = function () {};");
 * console.log(result.diagnostics.length); // 0
 * ```
 */
export declare class TypeScriptFunctionExpressionNode extends TypeScriptFunctionNode { }

/**
 * A function declaration with an implementation body or a bodyless signature.
 * Inherits the syntax roles documented by {@link TypeScriptFunctionNode}.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("function ready(): boolean;");
 * console.log(result.rootNode.children[0] instanceof TypeScriptFunctionDeclarationNode); // true
 * ```
 */
export declare class TypeScriptFunctionDeclarationNode extends TypeScriptFunctionNode {
  /**
   * The explicit semicolon ending a bodyless signature, when present.
   * Undefined for an implicit terminator or a declaration with a body.
   * A semicolon after a body is a separate empty statement.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * Creates a function declaration from its named syntax roles.
   *
   * @param functionKeywordNode The `function` keyword.
   * @param span The exact recovered span of the construct.
   * @param parameterListNode The parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   * @param modifierNodes Written decorators and modifier keywords in source order, `async` included; defaults to an empty sequence. Their presence does not establish legality.
   * @param asteriskNode The generator asterisk, when written.
   * @param nameNode The function name, when written or recovered as a missing identifier; a default export may omit it.
   * @param typeParameterListNode The generic type parameters, when written.
   * @param colonNode The colon introducing the return type, when written.
   * @param returnTypeNode The explicit return type, when written.
   * @param bodyNode The function body, when written or recovered as an empty, zero-width block without braces; a bodyless declaration is
   * an overload signature.
   * @param semicolonNode The explicit semicolon ending a bodyless declaration, when written; omit it for a declaration with a body.
   * @param leadingTrivia Trivia preceding the declaration.
   * @param trailingTrivia Trivia following the declaration.
   *
   * @example See {@link TypeScriptFunctionNode} for reading a parsed function's roles.
   */
  public constructor(
    functionKeywordNode: TypeScriptFunctionKeywordNode,
    span: SourceSpan,
    parameterListNode: TypeScriptParameterListNode,
    modifierNodes?: readonly Node[],
    asteriskNode?: TypeScriptAsteriskNode,
    nameNode?: Node,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    bodyNode?: TypeScriptBlockNode,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * An `import.meta` or `new.target` meta-property expression.
 */
export declare class TypeScriptMetaPropertyNode extends Node {
  /**
   * The dot joining the keyword and property name.
   */
  public readonly dotNode: TypeScriptDotNode;

  /**
   * The `import` or `new` keyword.
   */
  public readonly keywordNode: Node;

  /**
   * The meta-property name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly nameNode: Node;

  /**
   * Creates a meta-property from its keyword, separator, and name.
   *
   * @param keywordNode The `import` or `new` keyword.
   * @param span The exact recovered span of the expression.
   * @param nameNode The property name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param dotNode The separating dot.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    keywordNode: Node,
    span: SourceSpan,
    nameNode: Node,
    dotNode: TypeScriptDotNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A required expression position that could not be populated from the source. The parser writes it zero-width at the end of the
 * preceding token and without trivia, unless it holds consumed unexpected syntax, whose span it then takes.
 */
export declare class TypeScriptMissingExpressionNode extends Node {
  /**
   * The unexpected syntax consumed while recovering, when present.
   */
  public readonly unexpectedNode: Node | undefined;

  /**
   * Creates a missing expression at its recovery span.
   *
   * @param span The recovery span; zero-width at the end of the preceding token unless unexpected syntax was consumed.
   * @param unexpectedNode The unexpected consumed syntax, when present.
   * @param leadingTrivia Trivia preceding the missing expression.
   * @param trailingTrivia Trivia following the missing expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, unexpectedNode?: Node, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A TypeScript construction expression.
 */
export declare class TypeScriptNewExpressionNode extends Node {
  /**
   * The constructor arguments, when parentheses are present.
   */
  public readonly argumentListNode: TypeScriptArgumentListNode | undefined;

  /**
   * The expression identifying the constructor, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly expressionNode: Node;

  /**
   * The `new` keyword introducing the expression.
   */
  public readonly newKeywordNode: TypeScriptNewKeywordNode;

  /**
   * The explicit constructor type arguments, when present.
   */
  public readonly typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;

  /**
   * Creates a construction expression from its constructor and arguments.
   *
   * @param newKeywordNode The `new` keyword.
   * @param span The exact recovered span of the expression.
   * @param expressionNode The constructor expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param typeArgumentListNode The explicit type arguments, when present.
   * @param argumentListNode The constructor arguments, when present.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    newKeywordNode: TypeScriptNewKeywordNode,
    span: SourceSpan,
    expressionNode: Node,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode,
    argumentListNode?: TypeScriptArgumentListNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript postfix non-null assertion.
 */
export declare class TypeScriptNonNullExpressionNode extends Node {
  /**
   * The non-null assertion token.
   */
  public readonly exclamationNode: TypeScriptExclamationNode;

  /**
   * The expression being asserted.
   */
  public readonly expressionNode: Node;

  /**
   * Creates a non-null assertion from its expression and token.
   *
   * @param expressionNode The asserted expression.
   * @param exclamationNode The non-null assertion token.
   * @param span The exact span of the expression.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    expressionNode: Node,
    exclamationNode: TypeScriptExclamationNode,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript object-literal expression.
 */
export declare class TypeScriptObjectLiteralExpressionNode extends TypeScriptDelimitedListNode {
  /**
   * The closing brace, when recovered from the source.
   */
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  /**
   * The opening brace beginning the object literal.
   */
  public readonly openBraceNode: TypeScriptOpenBraceNode;

  /**
   * Creates an object literal from its delimiters and ordered members.
   *
   * @param openBraceNode The opening brace.
   * @param propertyNodes The object members in source order.
   * @param commaNodes The separating comma tokens.
   * @param span The exact recovered span of the expression.
   * @param closeBraceNode The closing brace, when present.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    openBraceNode: TypeScriptOpenBraceNode,
    propertyNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    closeBraceNode?: TypeScriptCloseBraceNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A missing expression position retained during recovery.
 */
export declare class TypeScriptOmittedExpressionNode extends Node {
  /**
   * Creates an omitted expression at its zero-length source position.
   *
   * @param span The exact zero-length position of the omission.
   * @param leadingTrivia Trivia preceding the omitted position.
   * @param trailingTrivia Trivia following the omitted position.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A TypeScript expression enclosed by parentheses.
 */
export declare class TypeScriptParenthesizedExpressionNode extends Node {
  /**
   * The closing parenthesis, when one was present in the source.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * The enclosed expression, a {@link TypeScriptMissingExpressionNode} where the parentheses enclose none.
   */
  public readonly expressionNode: Node;

  /**
   * The opening parenthesis beginning the expression.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode;

  /**
   * Creates a parenthesized expression from its named syntax roles.
   *
   * @param openParenthesisNode The opening parenthesis beginning the expression.
   * @param expressionNode The enclosed expression, a {@link TypeScriptMissingExpressionNode} where the parentheses enclose none.
   * @param closeParenthesisNode The closing parenthesis, when present.
   * @param span The exact span of the recovered parenthesized expression.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    openParenthesisNode: TypeScriptOpenParenthesisNode,
    expressionNode: Node,
    closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript expression followed by an increment or decrement operator.
 */
export declare class TypeScriptPostfixUnaryExpressionNode extends Node {
  /**
   * The expression modified by the operator.
   */
  public readonly operandNode: Node;

  /**
   * The trailing increment or decrement token.
   */
  public readonly operatorNode: Node;

  /**
   * Creates a postfix unary expression from its operand and operator.
   *
   * @param operandNode The modified expression.
   * @param operatorNode The increment or decrement token.
   * @param span The exact span of the expression.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    operandNode: Node,
    operatorNode: Node,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript expression introduced by a prefix unary operator.
 */
export declare class TypeScriptPrefixUnaryExpressionNode extends Node {
  /**
   * The expression operated on, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly operandNode: Node;

  /**
   * The prefix unary operator.
   */
  public readonly operatorNode: Node;

  /**
   * Creates a prefix unary expression from its operator and operand.
   *
   * @param operatorNode The prefix unary operator.
   * @param span The exact recovered span of the expression.
   * @param operandNode The operand expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    operatorNode: Node,
    span: SourceSpan,
    operandNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript dotted property-access expression.
 */
export declare class TypeScriptPropertyAccessExpressionNode extends Node {
  /**
   * The dot or optional-chain token, or undefined when recovery found no separator.
   */
  public readonly accessNode: TypeScriptDotNode | TypeScriptQuestionDotNode | undefined;

  /**
   * The expression whose property is accessed.
   */
  public readonly expressionNode: Node;

  /**
   * The property name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly nameNode: Node;

  /**
   * Creates a property access from its receiver, separator, and name.
   *
   * @param expressionNode The receiver expression.
   * @param accessNode The dot or optional-chain token, or undefined when missing.
   * @param span The exact recovered span of the access.
   * @param nameNode The property name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    expressionNode: Node,
    accessNode: TypeScriptDotNode | TypeScriptQuestionDotNode | undefined,
    span: SourceSpan,
    nameNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A named property and initializer in an object literal.
 */
export declare class TypeScriptPropertyAssignmentNode extends Node {
  /**
   * Written decorators and modifier keywords, without a claim of legality.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The question marker following the property name, when written.
   */
  public readonly questionNode: TypeScriptQuestionNode | undefined;

  /**
   * The exclamation marker following the property name, when written.
   */
  public readonly exclamationNode: TypeScriptExclamationNode | undefined;

  /**
   * The colon separating the name and initializer, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The property initializer, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly initializerNode: Node;

  /**
   * The property name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly nameNode: Node;

  /**
   * Creates an object property assignment from its name and initializer.
   *
   * @param span The exact recovered span of the property.
   * @param nameNode The property name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param initializerNode The initializer expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param colonNode The colon separator, when present.
   * @param questionNode A written question marker; its presence does not establish legality.
   * @param exclamationNode A written exclamation marker, when present.
   * @param modifierNodes The written prefix in source order; defaults to an empty sequence.
   * @param leadingTrivia Trivia preceding the property.
   * @param trailingTrivia Trivia following the property.
   * @example
   * ```ts
   * const name = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
   * const colon = new TypeScriptColonNode(new SourceSpan(5, 1));
   * const value = new TypeScriptNumericLiteralNode("1", new SourceSpan(7, 1));
   * const property = new TypeScriptPropertyAssignmentNode(new SourceSpan(0, 8), name, value, colon);
   * property.initializerNode === value; // true
   * property.questionNode; // undefined
   * ```
   */
  public constructor(
    span: SourceSpan,
    nameNode: Node,
    initializerNode: Node,
    colonNode?: TypeScriptColonNode,
    questionNode?: TypeScriptQuestionNode,
    exclamationNode?: TypeScriptExclamationNode,
    modifierNodes?: readonly Node[],
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript `satisfies` expression.
 */
export declare class TypeScriptSatisfiesExpressionNode extends TypeScriptTypeCheckExpressionNode {
  /**
   * The `satisfies` keyword joining the expression and type.
   */
  public readonly satisfiesKeywordNode: TypeScriptSatisfiesKeywordNode;

  /**
   * Creates a satisfies expression from its value and required type.
   *
   * @param expressionNode The checked expression.
   * @param satisfiesKeywordNode The `satisfies` keyword.
   * @param span The exact recovered span of the expression.
   * @param typeNode The required type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptTypeCheckExpressionNode} for usage.
   */
  public constructor(
    expressionNode: Node,
    satisfiesKeywordNode: TypeScriptSatisfiesKeywordNode,
    span: SourceSpan,
    typeNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A shorthand property in an object literal.
 */
export declare class TypeScriptShorthandPropertyAssignmentNode extends Node {
  /**
   * Written decorators and modifier keywords, without a claim of legality.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The question marker following the property name, when written.
   */
  public readonly questionNode: TypeScriptQuestionNode | undefined;

  /**
   * The exclamation marker following the property name, when written.
   */
  public readonly exclamationNode: TypeScriptExclamationNode | undefined;

  /**
   * The default-value equals token, when present.
   */
  public readonly equalsNode: TypeScriptEqualsNode | undefined;

  /**
   * The default-value expression, when present.
   */
  public readonly initializerNode: Node | undefined;

  /**
   * The shorthand property name.
   */
  public readonly nameNode: Node;

  /**
   * Creates a shorthand property with an optional default value.
   *
   * @param nameNode The shorthand property name.
   * @param span The exact span of the property.
   * @param equalsNode The default-value equals token, when present.
   * @param initializerNode The default-value expression, when present.
   * @param questionNode A written question marker; its presence does not establish legality.
   * @param exclamationNode A written exclamation marker, when present.
   * @param modifierNodes The written prefix in source order; defaults to an empty sequence.
   * @param leadingTrivia Trivia preceding the property.
   * @param trailingTrivia Trivia following the property.
   * @example
   * ```ts
   * const name = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
   * const property = new TypeScriptShorthandPropertyAssignmentNode(name, name.span);
   * property.nameNode === name; // true
   * property.initializerNode; // undefined
   * ```
   */
  public constructor(
    nameNode: Node,
    span: SourceSpan,
    equalsNode?: TypeScriptEqualsNode,
    initializerNode?: Node,
    questionNode?: TypeScriptQuestionNode,
    exclamationNode?: TypeScriptExclamationNode,
    modifierNodes?: readonly Node[],
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A spread member in an object literal.
 */
export declare class TypeScriptSpreadAssignmentNode extends Node {
  /**
   * The spread token introducing the member.
   */
  public readonly dotDotDotNode: TypeScriptDotDotDotNode;

  /**
   * The spread operand, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly expressionNode: Node;

  /**
   * Creates an object spread assignment from its token and operand.
   *
   * @param dotDotDotNode The spread token.
   * @param span The exact recovered span of the member.
   * @param expressionNode The spread operand, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param leadingTrivia Trivia preceding the member.
   * @param trailingTrivia Trivia following the member.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    dotDotDotNode: TypeScriptDotDotDotNode,
    span: SourceSpan,
    expressionNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A spread element in an array literal or argument list.
 */
export declare class TypeScriptSpreadElementNode extends Node {
  /**
   * The spread token introducing the element.
   */
  public readonly dotDotDotNode: TypeScriptDotDotDotNode;

  /**
   * The spread operand, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly expressionNode: Node;

  /**
   * Creates a spread element from its token and operand.
   *
   * @param dotDotDotNode The spread token.
   * @param span The exact recovered span of the element.
   * @param expressionNode The spread operand, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param leadingTrivia Trivia preceding the element.
   * @param trailingTrivia Trivia following the element.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    dotDotDotNode: TypeScriptDotDotDotNode,
    span: SourceSpan,
    expressionNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript tagged-template expression.
 */
export declare class TypeScriptTaggedTemplateExpressionNode extends Node {
  /**
   * The optional-chain token, when present in recovered syntax.
   */
  public readonly questionDotNode: TypeScriptQuestionDotNode | undefined;

  /**
   * The expression serving as the template tag.
   */
  public readonly tagNode: Node;

  /**
   * The no-substitution literal or template expression.
   */
  public readonly templateNode: Node;

  /**
   * The explicit tag type arguments, when present.
   */
  public readonly typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;

  /**
   * Creates a tagged template from its tag, optional type arguments, and
   * template literal.
   *
   * @param tagNode The tag expression.
   * @param templateNode The template literal.
   * @param span The exact recovered span of the expression.
   * @param questionDotNode The optional-chain token, when present.
   * @param typeArgumentListNode The tag type arguments, when present.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    tagNode: Node,
    templateNode: Node,
    span: SourceSpan,
    questionDotNode?: TypeScriptQuestionDotNode,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript template expression containing substitutions.
 */
export declare class TypeScriptTemplateExpressionNode extends CompositeNode {
  /**
   * The initial template segment ending with `${`.
   */
  public readonly headNode: TypeScriptTemplateHeadNode;

  /**
   * Creates a template expression from its head and substitution spans.
   *
   * @param headNode The initial template segment.
   * @param spanNodes The substitution spans in source order.
   * @param span The exact recovered span of the expression.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    headNode: TypeScriptTemplateHeadNode,
    spanNodes: readonly TypeScriptTemplateSpanNode[],
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * One expression and following literal segment in a template expression.
 */
export declare class TypeScriptTemplateSpanNode extends Node {
  /**
   * The substituted expression.
   */
  public readonly expressionNode: Node;

  /**
   * The following template-middle or template-tail token, or undefined when missing.
   */
  public readonly literalNode: Node | undefined;

  /**
   * Creates a template span from its expression and following literal.
   *
   * @param expressionNode The substituted expression.
   * @param literalNode The following template segment, or undefined when missing.
   * @param span The exact span of the template span.
   * @param leadingTrivia Trivia preceding the span.
   * @param trailingTrivia Trivia following the span.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    expressionNode: Node,
    literalNode: Node | undefined,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript angle-bracket type assertion.
 */
export declare class TypeScriptTypeAssertionExpressionNode extends Node {
  /**
   * The asserted expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly expressionNode: Node;

  /**
   * The closing greater-than token, when recovered from the source.
   */
  public readonly greaterThanNode: TypeScriptGreaterThanNode | undefined;

  /**
   * The opening less-than token.
   */
  public readonly lessThanNode: TypeScriptLessThanNode;

  /**
   * The asserted type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   */
  public readonly typeNode: Node;

  /**
   * Creates a type assertion from its bracketed type and operand.
   *
   * @param lessThanNode The opening less-than token.
   * @param span The exact recovered span of the expression.
   * @param typeNode The asserted type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param expressionNode The asserted expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param greaterThanNode The closing greater-than token, when present.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    lessThanNode: TypeScriptLessThanNode,
    span: SourceSpan,
    typeNode: Node,
    expressionNode: Node,
    greaterThanNode?: TypeScriptGreaterThanNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * An expression compared with a written type: `value as Type` asserts the
 * type, and `value satisfies Type` verifies it.
 *
 * @example
 * ```ts
 * const statement = TypeScriptParser.parse("first + second as Total;").rootNode.children[0];
 * if (statement instanceof TypeScriptExpressionStatementNode && statement.expressionNode instanceof TypeScriptTypeCheckExpressionNode) {
 *   console.log(statement.expressionNode instanceof TypeScriptAsExpressionNode); // true
 *   console.log(statement.expressionNode.expressionNode instanceof TypeScriptBinaryExpressionNode); // true
 * }
 * ```
 */
export declare abstract class TypeScriptTypeCheckExpressionNode extends Node {
  /**
   * The expression compared with the type.
   */
  public readonly expressionNode: Node;

  /**
   * The written type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   */
  public readonly typeNode: Node;

  /**
   * Creates the shared roles of a type check.
   *
   * @param expressionNode The expression compared with the type.
   * @param span The exact recovered span of the expression.
   * @param typeNode The written type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptTypeCheckExpressionNode} for usage.
   */
  public constructor(expressionNode: Node, span: SourceSpan, typeNode: Node, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A TypeScript runtime `typeof` expression.
 */
export declare class TypeScriptTypeOfExpressionNode extends Node {
  /**
   * The inspected operand, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly expressionNode: Node;

  /**
   * The `typeof` keyword introducing the expression.
   */
  public readonly typeOfKeywordNode: TypeScriptTypeOfKeywordNode;

  /**
   * Creates a typeof expression from its keyword and operand.
   *
   * @param typeOfKeywordNode The `typeof` keyword.
   * @param span The exact recovered span of the expression.
   * @param expressionNode The inspected operand, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    typeOfKeywordNode: TypeScriptTypeOfKeywordNode,
    span: SourceSpan,
    expressionNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript `void` expression.
 */
export declare class TypeScriptVoidExpressionNode extends Node {
  /**
   * The evaluated operand, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly expressionNode: Node;

  /**
   * The `void` keyword introducing the expression.
   */
  public readonly voidKeywordNode: TypeScriptVoidKeywordNode;

  /**
   * Creates a void expression from its keyword and operand.
   *
   * @param voidKeywordNode The `void` keyword.
   * @param span The exact recovered span of the expression.
   * @param expressionNode The evaluated operand, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    voidKeywordNode: TypeScriptVoidKeywordNode,
    span: SourceSpan,
    expressionNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript `yield` or `yield*` expression.
 */
export declare class TypeScriptYieldExpressionNode extends Node {
  /**
   * The delegation asterisk, when present.
   */
  public readonly asteriskNode: TypeScriptAsteriskNode | undefined;

  /**
   * The yielded expression, when present.
   */
  public readonly expressionNode: Node | undefined;

  /**
   * The `yield` keyword introducing the expression.
   */
  public readonly yieldKeywordNode: TypeScriptYieldKeywordNode;

  /**
   * Creates a yield expression from its keyword, optional delegation marker,
   * and optional operand.
   *
   * @param yieldKeywordNode The `yield` keyword.
   * @param span The exact recovered span of the expression.
   * @param asteriskNode The delegation asterisk, when present.
   * @param expressionNode The yielded expression, when present.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(
    yieldKeywordNode: TypeScriptYieldKeywordNode,
    span: SourceSpan,
    asteriskNode?: TypeScriptAsteriskNode,
    expressionNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript identifier token carrying its decoded identifier value.
 *
 * @example An identifier keeps the name its escapes spell.
 * ```ts
 * const statement = TypeScriptParser.parse("\\u0076alue;").rootNode.children[0];
 * if (statement instanceof TypeScriptExpressionStatementNode && statement.expressionNode instanceof TypeScriptIdentifierNode)
 *   console.log(statement.expressionNode.value); // "value"
 * ```
 */
export declare class TypeScriptIdentifierNode extends ValueNode {
  /**
   * Creates the token from its decoded value and exact source span.
   *
   * @param value The decoded identifier value represented by the token.
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptIdentifierNode} for usage.
   */
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A TypeScript private-identifier token carrying its decoded identifier value.
 */
export declare class TypeScriptPrivateIdentifierNode extends ValueNode {
  /**
   * Creates the token from its decoded value and exact source span.
   *
   * @param value The decoded private identifier, including its leading `#`.
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptIdentifierNode} for usage.
   */
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A dotted TypeScript name that preserves its left and right name segments.
 */
export declare class TypeScriptQualifiedNameNode extends Node {
  /**
   * The dot separating the two name segments.
   */
  public readonly dotNode: TypeScriptDotNode;

  /**
   * The identifier or qualified name to the left of the dot.
   */
  public readonly leftNode: Node;

  /**
   * The identifier to the right of the dot.
   */
  public readonly rightNode: Node;

  /**
   * Creates a qualified name from its exact syntax roles.
   *
   * @param leftNode The identifier or qualified name to the left of the dot.
   * @param dotNode The dot separating the name segments.
   * @param rightNode The identifier to the right of the dot.
   * @param span The exact span of the qualified name.
   * @param leadingTrivia Trivia preceding the qualified name.
   * @param trailingTrivia Trivia following the qualified name.
   *
   * @see {@link TypeScriptIdentifierNode} for usage.
   */
  public constructor(
    leftNode: Node,
    dotNode: TypeScriptDotNode,
    rightNode: Node,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * The base class for TypeScript tokens whose decoded value is a recognized keyword.
 *
 * @example A keyword token is read from the construct that writes it and keeps its fixed spelling.
 * ```ts
 * const statement = TypeScriptParser.parse("return value;").rootNode.children[0];
 * if (statement instanceof TypeScriptReturnStatementNode) {
 *   console.log(statement.returnKeywordNode instanceof TypeScriptKeywordNode); // true
 *   console.log(statement.returnKeywordNode.value); // "return"
 * }
 * ```
 */
export declare abstract class TypeScriptKeywordNode extends ValueNode {
  /**
   * Creates a keyword token from its fixed value and exact source span.
   *
   * @param value The decoded keyword value represented by the token.
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  protected constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `abstract` keyword token.
 */
export declare class TypeScriptAbstractKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The `public`, `protected`, or `private` keyword, which sets a class
 * member's or parameter property's accessibility.
 */
export declare abstract class TypeScriptAccessibilityKeywordNode extends TypeScriptKeywordNode { }

/**
 * The TypeScript `accessor` keyword token.
 */
export declare class TypeScriptAccessorKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The `get` or `set` keyword, which names the kind of accessor a declaration
 * writes.
 */
export declare abstract class TypeScriptAccessorKindKeywordNode extends TypeScriptContextualKeywordNode { }

/**
 * The TypeScript `any` keyword token.
 */
export declare class TypeScriptAnyKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `as` keyword token.
 */
export declare class TypeScriptAsKeywordNode extends TypeScriptTypeCheckKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `assert` keyword token.
 */
export declare class TypeScriptAssertKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `asserts` keyword token.
 */
export declare class TypeScriptAssertsKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `async` keyword token.
 */
export declare class TypeScriptAsyncKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `await` keyword token.
 */
export declare class TypeScriptAwaitKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `bigint` keyword token.
 */
export declare class TypeScriptBigIntKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `boolean` keyword token.
 */
export declare class TypeScriptBooleanKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `break` keyword token.
 */
export declare class TypeScriptBreakKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `case` keyword token.
 */
export declare class TypeScriptCaseKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `catch` keyword token.
 */
export declare class TypeScriptCatchKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `class` keyword token.
 */
export declare class TypeScriptClassKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `const` keyword token.
 */
export declare class TypeScriptConstKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `constructor` keyword token.
 */
export declare class TypeScriptConstructorKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A TypeScript keyword whose meaning is selected by its surrounding grammar
 * and which may serve as an identifier where that grammar permits it.
 */
export declare abstract class TypeScriptContextualKeywordNode extends TypeScriptKeywordNode { }

/**
 * The TypeScript `continue` keyword token.
 */
export declare class TypeScriptContinueKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `debugger` keyword token.
 */
export declare class TypeScriptDebuggerKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `declare` keyword token.
 */
export declare class TypeScriptDeclareKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `default` keyword token.
 */
export declare class TypeScriptDefaultKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `defer` keyword token.
 */
export declare class TypeScriptDeferKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `delete` keyword token.
 */
export declare class TypeScriptDeleteKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `do` keyword token.
 */
export declare class TypeScriptDoKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `else` keyword token.
 */
export declare class TypeScriptElseKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `enum` keyword token.
 */
export declare class TypeScriptEnumKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `export` keyword token.
 */
export declare class TypeScriptExportKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `extends` keyword token.
 */
export declare class TypeScriptExtendsKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `false` keyword token.
 */
export declare class TypeScriptFalseKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `finally` keyword token.
 */
export declare class TypeScriptFinallyKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `for` keyword token.
 */
export declare class TypeScriptForKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `from` keyword token.
 */
export declare class TypeScriptFromKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `function` keyword token.
 */
export declare class TypeScriptFunctionKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `get` keyword token.
 */
export declare class TypeScriptGetKeywordNode extends TypeScriptAccessorKindKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `global` keyword token.
 */
export declare class TypeScriptGlobalKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `if` keyword token.
 */
export declare class TypeScriptIfKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `immediate` keyword token.
 */
export declare class TypeScriptImmediateKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `implements` keyword token.
 */
export declare class TypeScriptImplementsKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `import` keyword token.
 */
export declare class TypeScriptImportKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `in` keyword token.
 */
export declare class TypeScriptInKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `infer` keyword token.
 */
export declare class TypeScriptInferKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `instanceof` keyword token.
 */
export declare class TypeScriptInstanceOfKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `interface` keyword token.
 */
export declare class TypeScriptInterfaceKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `intrinsic` keyword token.
 */
export declare class TypeScriptIntrinsicKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `is` keyword token.
 */
export declare class TypeScriptIsKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `keyof` keyword token.
 */
export declare class TypeScriptKeyOfKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `let` keyword token.
 */
export declare class TypeScriptLetKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `module` keyword token.
 */
export declare class TypeScriptModuleKeywordNode extends TypeScriptModuleDeclarationKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The `module` or `namespace` keyword, which begins a module declaration.
 */
export declare abstract class TypeScriptModuleDeclarationKeywordNode extends TypeScriptContextualKeywordNode { }

/**
 * The TypeScript `namespace` keyword token.
 */
export declare class TypeScriptNamespaceKeywordNode extends TypeScriptModuleDeclarationKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `never` keyword token.
 */
export declare class TypeScriptNeverKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `new` keyword token.
 */
export declare class TypeScriptNewKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `null` keyword token.
 */
export declare class TypeScriptNullKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `number` keyword token.
 */
export declare class TypeScriptNumberKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `object` keyword token.
 */
export declare class TypeScriptObjectKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `of` keyword token.
 */
export declare class TypeScriptOfKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `out` keyword token.
 */
export declare class TypeScriptOutKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `override` keyword token.
 */
export declare class TypeScriptOverrideKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `package` keyword token.
 */
export declare class TypeScriptPackageKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `private` keyword token.
 */
export declare class TypeScriptPrivateKeywordNode extends TypeScriptAccessibilityKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `protected` keyword token.
 */
export declare class TypeScriptProtectedKeywordNode extends TypeScriptAccessibilityKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `public` keyword token.
 */
export declare class TypeScriptPublicKeywordNode extends TypeScriptAccessibilityKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `readonly` keyword token.
 */
export declare class TypeScriptReadonlyKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `require` keyword token.
 */
export declare class TypeScriptRequireKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `return` keyword token.
 */
export declare class TypeScriptReturnKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `satisfies` keyword token.
 */
export declare class TypeScriptSatisfiesKeywordNode extends TypeScriptTypeCheckKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `set` keyword token.
 */
export declare class TypeScriptSetKeywordNode extends TypeScriptAccessorKindKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `static` keyword token.
 */
export declare class TypeScriptStaticKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `string` keyword token.
 */
export declare class TypeScriptStringKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `super` keyword token.
 */
export declare class TypeScriptSuperKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `switch` keyword token.
 */
export declare class TypeScriptSwitchKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `symbol` keyword token.
 */
export declare class TypeScriptSymbolKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `this` keyword token.
 */
export declare class TypeScriptThisKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `throw` keyword token.
 */
export declare class TypeScriptThrowKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `true` keyword token.
 */
export declare class TypeScriptTrueKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `try` keyword token.
 */
export declare class TypeScriptTryKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The `as` or `satisfies` keyword, which compares the expression before it
 * with the type after it.
 */
export declare abstract class TypeScriptTypeCheckKeywordNode extends TypeScriptContextualKeywordNode { }

/**
 * The TypeScript `type` keyword token.
 */
export declare class TypeScriptTypeKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `typeof` keyword token.
 */
export declare class TypeScriptTypeOfKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `undefined` keyword token.
 */
export declare class TypeScriptUndefinedKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `unique` keyword token.
 */
export declare class TypeScriptUniqueKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `unknown` keyword token.
 */
export declare class TypeScriptUnknownKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `using` keyword token.
 */
export declare class TypeScriptUsingKeywordNode extends TypeScriptContextualKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `var` keyword token.
 */
export declare class TypeScriptVarKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `void` keyword token.
 */
export declare class TypeScriptVoidKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `while` keyword token.
 */
export declare class TypeScriptWhileKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `with` keyword token.
 */
export declare class TypeScriptWithKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `yield` keyword token.
 */
export declare class TypeScriptYieldKeywordNode extends TypeScriptKeywordNode {
  /**
   * Creates the keyword at its source span with optional attached trivia.
   *
   * @param span The exact source span of the keyword.
   * @param leadingTrivia Trivia preceding the keyword.
   * @param trailingTrivia Trivia following the keyword.
   *
   * @see {@link TypeScriptKeywordNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A TypeScript BigInt literal token preserving its exact source text.
 */
export declare class TypeScriptBigIntLiteralNode extends LiteralNode {
  /**
   * Creates the token from its preserved text and exact source span.
   *
   * @param value The complete source text represented by the token.
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptStringLiteralNode} for usage.
   */
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A complete template literal containing no substitution.
 */
export declare class TypeScriptNoSubstitutionTemplateLiteralNode extends LiteralNode {
  /**
   * Whether the text contains an escape sequence that only a tagged template accepts.
   */
  public readonly containsInvalidEscape: boolean;

  /**
   * Creates the token from its preserved text and exact source span.
   *
   * @param value The complete source text represented by the token.
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   * @param containsInvalidEscape Whether the text contains an escape sequence that only a tagged template accepts.
   *
   * @see {@link TypeScriptStringLiteralNode} for usage.
   */
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node, containsInvalidEscape?: boolean);
}

/**
 * A TypeScript numeric literal token preserving its exact source text.
 */
export declare class TypeScriptNumericLiteralNode extends LiteralNode {
  /**
   * Creates the token from its preserved text and exact source span.
   *
   * @param value The complete source text represented by the token.
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptStringLiteralNode} for usage.
   */
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A TypeScript string literal token preserving its exact source text.
 *
 * @example A literal token preserves its written text, delimiters and escapes included.
 * ```ts
 * const statement = TypeScriptParser.parse("'text';").rootNode.children[0];
 * if (statement instanceof TypeScriptExpressionStatementNode && statement.expressionNode instanceof TypeScriptStringLiteralNode)
 *   console.log(statement.expressionNode.value); // "'text'"
 * ```
 */
export declare class TypeScriptStringLiteralNode extends LiteralNode {
  /**
   * Creates the token from its preserved text and exact source span.
   *
   * @param value The complete source text represented by the token.
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptStringLiteralNode} for usage.
   */
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The opening text segment of a template expression before its first substitution.
 */
export declare class TypeScriptTemplateHeadNode extends LiteralNode {
  /**
   * Whether the text contains an escape sequence that only a tagged template accepts.
   */
  public readonly containsInvalidEscape: boolean;

  /**
   * Creates the token from its preserved text and exact source span.
   *
   * @param value The complete source text represented by the token.
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   * @param containsInvalidEscape Whether the text contains an escape sequence that only a tagged template accepts.
   *
   * @see {@link TypeScriptStringLiteralNode} for usage.
   */
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node, containsInvalidEscape?: boolean);
}

/**
 * A text segment between two substitutions of a template expression.
 */
export declare class TypeScriptTemplateMiddleNode extends LiteralNode {
  /**
   * Creates the token from its preserved text and exact source span.
   *
   * @param value The complete source text represented by the token.
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptStringLiteralNode} for usage.
   */
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The closing text segment of a template expression after its final substitution.
 */
export declare class TypeScriptTemplateTailNode extends LiteralNode {
  /**
   * Creates the token from its preserved text and exact source span.
   *
   * @param value The complete source text represented by the token.
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptStringLiteralNode} for usage.
   */
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `&&=` operator token.
 */
export declare class TypeScriptAmpersandAmpersandEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `&&` operator token.
 */
export declare class TypeScriptAmpersandAmpersandNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `&=` operator token.
 */
export declare class TypeScriptAmpersandEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `&` operator token.
 */
export declare class TypeScriptAmpersandNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `=>` operator token.
 */
export declare class TypeScriptArrowNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `**=` operator token.
 */
export declare class TypeScriptAsteriskAsteriskEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `**` operator token.
 */
export declare class TypeScriptAsteriskAsteriskNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `*=` operator token.
 */
export declare class TypeScriptAsteriskEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `*` operator token.
 */
export declare class TypeScriptAsteriskNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `||=` operator token.
 */
export declare class TypeScriptBarBarEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `||` operator token.
 */
export declare class TypeScriptBarBarNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `|=` operator token.
 */
export declare class TypeScriptBarEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `|` operator token.
 */
export declare class TypeScriptBarNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `^=` operator token.
 */
export declare class TypeScriptCaretEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `^` operator token.
 */
export declare class TypeScriptCaretNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `===` operator token.
 */
export declare class TypeScriptEqualsEqualsEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `==` operator token.
 */
export declare class TypeScriptEqualsEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `=` operator token.
 */
export declare class TypeScriptEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `!==` operator token.
 */
export declare class TypeScriptExclamationEqualsEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `!=` operator token.
 */
export declare class TypeScriptExclamationEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `!` operator token.
 */
export declare class TypeScriptExclamationNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `>=` operator token.
 */
export declare class TypeScriptGreaterThanEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `>` operator token.
 */
export declare class TypeScriptGreaterThanNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `<=` operator token.
 */
export declare class TypeScriptLessThanEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `<` operator token.
 */
export declare class TypeScriptLessThanNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `-=` operator token.
 */
export declare class TypeScriptMinusEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `--` operator token.
 */
export declare class TypeScriptMinusMinusNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `-` operator token.
 */
export declare class TypeScriptMinusNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `%=` operator token.
 */
export declare class TypeScriptPercentEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `%` operator token.
 */
export declare class TypeScriptPercentNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `+=` operator token.
 */
export declare class TypeScriptPlusEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `+` operator token.
 */
export declare class TypeScriptPlusNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `++` operator token.
 */
export declare class TypeScriptPlusPlusNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `?.` operator token.
 */
export declare class TypeScriptQuestionDotNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `?` operator token.
 */
export declare class TypeScriptQuestionNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `??=` operator token.
 */
export declare class TypeScriptQuestionQuestionEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `??` operator token.
 */
export declare class TypeScriptQuestionQuestionNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `<<=` operator token.
 */
export declare class TypeScriptShiftLeftEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `<<` operator token.
 */
export declare class TypeScriptShiftLeftNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `>>=` operator token.
 */
export declare class TypeScriptShiftRightEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `>>` operator token.
 */
export declare class TypeScriptShiftRightNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `/=` operator token.
 */
export declare class TypeScriptSlashEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `/` operator token.
 */
export declare class TypeScriptSlashNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `~` operator token.
 */
export declare class TypeScriptTildeNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `>>>=` operator token.
 */
export declare class TypeScriptUnsignedShiftRightEqualsNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The TypeScript `>>>` operator token.
 */
export declare class TypeScriptUnsignedShiftRightNode extends ValueNode {
  /**
   * Creates the token at its source span with optional attached trivia.
   *
   * @param span The exact source span of the token.
   * @param leadingTrivia Trivia preceding the token.
   * @param trailingTrivia Trivia following the token.
   *
   * @see {@link TypeScriptBinaryExpressionNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * One variable declaration within a declaration list.
 */
export declare class TypeScriptVariableDeclarationNode extends Node {
  /**
   * The colon introducing the declared type, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The equals token introducing the initializer, when present.
   */
  public readonly equalsNode: TypeScriptEqualsNode | undefined;

  /**
   * The definite-assignment assertion, when present.
   */
  public readonly exclamationNode: TypeScriptExclamationNode | undefined;

  /**
   * The initializer expression, when present.
   */
  public readonly initializerNode: Node | undefined;

  /**
   * The declared binding name or pattern, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly nameNode: Node;

  /**
   * The declared type, when present.
   */
  public readonly typeNode: Node | undefined;

  /**
   * Creates a variable declaration from its binding, type, and initializer syntax.
   *
   * @param span The exact declaration span.
   * @param nameNode The binding name or pattern, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param exclamationNode The definite-assignment assertion, when present.
   * @param colonNode The type-annotation colon, when present.
   * @param typeNode The declared type, when present.
   * @param equalsNode The initializer equals token, when present.
   * @param initializerNode The initializer expression, when present.
   * @param leadingTrivia Trivia preceding the declaration.
   * @param trailingTrivia Trivia following the declaration.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    span: SourceSpan,
    nameNode: Node,
    exclamationNode?: TypeScriptExclamationNode,
    colonNode?: TypeScriptColonNode,
    typeNode?: Node,
    equalsNode?: TypeScriptEqualsNode,
    initializerNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A comma-separated list of ordinary or resource-management declarations.
 * The declarations are stored only in children; keyword and comma tokens retain
 * their separate written roles. Resource type checks, initializer requirements,
 * permitted scopes, and disposal execution belong to later compiler stages.
 * Empty declaration lists remain represented for later validation.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("await using handle = open();");
 * const statement = result.rootNode.children[0];
 * if (statement instanceof TypeScriptVariableStatementNode) {
 *   const declarations = statement.declarationListNode;
 *   console.log(declarations.keywordNode instanceof TypeScriptUsingKeywordNode); // true
 *   console.log(declarations.awaitKeywordNode instanceof TypeScriptAwaitKeywordNode); // true
 * }
 * ```
 */
export declare class TypeScriptVariableDeclarationListNode extends TypeScriptDelimitedListNode {
  /**
   * The written await preceding using, when present. This is not the separate
   * await after for in an asynchronous loop. Undefined for non-awaited declarations.
   */
  public readonly awaitKeywordNode: TypeScriptAwaitKeywordNode | undefined;

  /**
   * The declarations in source order, excluding commas.
   */
  public readonly children: readonly TypeScriptVariableDeclarationNode[];

  /**
   * The written const, let, var, or using keyword. An awaited resource declaration
   * stores using here and its preceding await in awaitKeywordNode.
   */
  public readonly keywordNode: TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode;

  /**
   * Creates a declaration list from its written keyword, declaration sequence, and optional await.
   *
   * @param keywordNode The const, let, var, or using keyword introducing the list.
   * @param declarationNodes The declarations in source order, stored only in `children` and retained without cloning. Do not mutate after publication.
   * @param commaNodes The written commas in source order, retained without cloning. Do not mutate after publication.
   * @param span The absolute UTF-16 span, including the leading await when present and excluding the statement terminator.
   * @param awaitKeywordNode The await preceding using; omit it for an ordinary or synchronous declaration.
   * @param leadingTrivia Trivia preceding the list.
   * @param trailingTrivia Trivia following the list.
   *
   * @example See {@link TypeScriptVariableDeclarationListNode} for an awaited resource declaration.
   */
  public constructor(
    keywordNode: TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode,
    declarationNodes: readonly TypeScriptVariableDeclarationNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    awaitKeywordNode?: TypeScriptAwaitKeywordNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript type-alias declaration.
 */
export declare class TypeScriptTypeAliasDeclarationNode extends Node {
  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The equals token introducing the aliased type, when present.
   */
  public readonly equalsNode: TypeScriptEqualsNode | undefined;

  /**
   * The alias name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly nameNode: Node;

  /**
   * The explicit terminating semicolon, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * The `type` keyword.
   */
  public readonly typeKeywordNode: TypeScriptTypeKeywordNode;

  /**
   * The aliased type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   */
  public readonly typeNode: Node;

  /**
   * The alias type parameters, when present.
   */
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  /**
   * Creates a type alias from its name, parameters, and aliased type.
   *
   * @param typeKeywordNode The `type` keyword.
   * @param span The exact declaration span.
   * @param nameNode The alias name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param typeNode The aliased type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param typeParameterListNode The alias type parameters, when present.
   * @param equalsNode The equals token introducing the aliased type, when present.
   * @param semicolonNode The explicit terminating semicolon, when present.
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param leadingTrivia Trivia preceding the declaration.
   * @param trailingTrivia Trivia following the declaration.
   *
   * @see {@link TypeScriptClassDeclarationNode} for usage.
   */
  public constructor(
    typeKeywordNode: TypeScriptTypeKeywordNode,
    span: SourceSpan,
    nameNode: Node,
    typeNode: Node,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    equalsNode?: TypeScriptEqualsNode,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes?: readonly Node[],
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A variable declaration list used as a statement.
 */
export declare class TypeScriptVariableStatementNode extends Node {
  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The declaration list.
   */
  public readonly declarationListNode: TypeScriptVariableDeclarationListNode;

  /**
   * The explicit terminating semicolon, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * Creates a variable statement from its declaration list and optional terminator.
   *
   * @param declarationListNode The variable declaration list.
   * @param span The exact statement span.
   * @param semicolonNode The explicit terminating semicolon, when present.
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptReturnStatementNode} for usage.
   */
  public constructor(
    declarationListNode: TypeScriptVariableDeclarationListNode,
    span: SourceSpan,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes?: readonly Node[],
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript statement block delimited by braces. Where a required block's opening brace is missing, the block is written empty and
 * zero-width at the end of the preceding token, without braces or trivia. Where its closing brace is missing, the block ends with its last
 * written token.
 */
export declare class TypeScriptBlockNode extends CompositeNode {
  /**
   * The closing brace, when one was present in the source.
   */
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  /**
   * The opening brace, or undefined when recovery retained a body without one.
   */
  public readonly openBraceNode: TypeScriptOpenBraceNode | undefined;

  /**
   * Creates a block from its delimiters and contained statements.
   *
   * @param openBraceNode The opening brace, or undefined when it was missing.
   * @param statements The statements contained by the block in source order.
   * @param span The exact span of the block.
   * @param closeBraceNode The closing brace, when one was present in the source.
   * @param leadingTrivia Trivia preceding the block.
   * @param trailingTrivia Trivia following the block.
   *
   * @see {@link TypeScriptReturnStatementNode} for usage.
   */
  public constructor(
    openBraceNode: TypeScriptOpenBraceNode | undefined,
    statements: readonly Node[],
    span: SourceSpan,
    closeBraceNode?: TypeScriptCloseBraceNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A standalone TypeScript semicolon statement.
 */
export declare class TypeScriptEmptyStatementNode extends Node {
  /**
   * The semicolon represented by the statement.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode;

  /**
   * Creates an empty statement from its semicolon.
   *
   * @param semicolonNode The semicolon represented by the statement.
   * @param span The exact span of the statement.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptReturnStatementNode} for usage.
   */
  public constructor(
    semicolonNode: TypeScriptSemicolonNode,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript expression used as a statement with an optional semicolon.
 */
export declare class TypeScriptExpressionStatementNode extends Node {
  /**
   * The parsed expression.
   */
  public readonly expressionNode: Node;

  /**
   * The explicit terminating semicolon, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * Creates an expression statement from its expression and optional terminator.
   *
   * @param expressionNode The parsed expression.
   * @param span The exact span of the complete statement.
   * @param semicolonNode The explicit terminating semicolon, when present.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptReturnStatementNode} for usage.
   */
  public constructor(
    expressionNode: Node,
    span: SourceSpan,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A `break` statement with an optional label.
 */
export declare class TypeScriptBreakStatementNode extends Node {
  /**
   * The `break` keyword.
   */
  public readonly breakKeywordNode: TypeScriptBreakKeywordNode;

  /**
   * The target label, when present on the same line; a {@link TypeScriptMissingIdentifierNode} where something other than a name
   * follows there.
   */
  public readonly labelNode: Node | undefined;

  /**
   * The explicit terminating semicolon, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * Creates a break statement from its keyword, optional label, and terminator.
   *
   * @param breakKeywordNode The `break` keyword.
   * @param span The exact statement span.
   * @param labelNode The target label, when present; a {@link TypeScriptMissingIdentifierNode} where the source lacks its name.
   * @param semicolonNode The explicit terminating semicolon, when present.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptReturnStatementNode} for usage.
   */
  public constructor(
    breakKeywordNode: TypeScriptBreakKeywordNode,
    span: SourceSpan,
    labelNode?: Node,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A `continue` statement with an optional label.
 */
export declare class TypeScriptContinueStatementNode extends Node {
  /**
   * The `continue` keyword.
   */
  public readonly continueKeywordNode: TypeScriptContinueKeywordNode;

  /**
   * The target label, when present on the same line; a {@link TypeScriptMissingIdentifierNode} where something other than a name
   * follows there.
   */
  public readonly labelNode: Node | undefined;

  /**
   * The explicit terminating semicolon, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * Creates a continue statement from its keyword, optional label, and terminator.
   *
   * @param continueKeywordNode The `continue` keyword.
   * @param span The exact statement span.
   * @param labelNode The target label, when present; a {@link TypeScriptMissingIdentifierNode} where the source lacks its name.
   * @param semicolonNode The explicit terminating semicolon, when present.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptReturnStatementNode} for usage.
   */
  public constructor(
    continueKeywordNode: TypeScriptContinueKeywordNode,
    span: SourceSpan,
    labelNode?: Node,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A `debugger` statement.
 */
export declare class TypeScriptDebuggerStatementNode extends Node {
  /**
   * The `debugger` keyword.
   */
  public readonly debuggerKeywordNode: TypeScriptDebuggerKeywordNode;

  /**
   * The explicit terminating semicolon, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * Creates a debugger statement from its keyword and optional terminator.
   *
   * @param debuggerKeywordNode The `debugger` keyword.
   * @param span The exact statement span.
   * @param semicolonNode The explicit terminating semicolon, when present.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptReturnStatementNode} for usage.
   */
  public constructor(
    debuggerKeywordNode: TypeScriptDebuggerKeywordNode,
    span: SourceSpan,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A `do` statement and its trailing `while` condition.
 */
export declare class TypeScriptDoStatementNode extends Node {
  /**
   * The closing parenthesis, when present.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * The loop condition, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly conditionNode: Node;

  /**
   * The `do` keyword.
   */
  public readonly doKeywordNode: TypeScriptDoKeywordNode;

  /**
   * The opening parenthesis, when present.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;

  /**
   * The explicit terminating semicolon, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * The repeated statement.
   */
  public readonly statementNode: Node;

  /**
   * The trailing `while` keyword, when present.
   */
  public readonly whileKeywordNode: TypeScriptWhileKeywordNode | undefined;

  /**
   * Creates a do statement from its body and trailing condition syntax.
   *
   * @param doKeywordNode The `do` keyword.
   * @param statementNode The repeated statement.
   * @param span The exact statement span.
   * @param conditionNode The loop condition, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param whileKeywordNode The trailing `while` keyword, when present.
   * @param openParenthesisNode The opening parenthesis, when present.
   * @param closeParenthesisNode The closing parenthesis, when present.
   * @param semicolonNode The explicit terminating semicolon, when present.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptReturnStatementNode} for usage.
   */
  public constructor(
    doKeywordNode: TypeScriptDoKeywordNode,
    statementNode: Node,
    span: SourceSpan,
    conditionNode: Node,
    whileKeywordNode?: TypeScriptWhileKeywordNode,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * The shared written roles of a `for...in` or `for...of` statement.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("for (const key in record) {} for await (const item of items) {}");
 * const [inStatement, ofStatement] = result.rootNode.children;
 * console.log(inStatement instanceof TypeScriptForInStatementNode); // true
 * console.log(ofStatement instanceof TypeScriptForOfStatementNode && ofStatement.awaitKeywordNode !== undefined); // true
 * ```
 */
export declare abstract class TypeScriptForInOrOfStatementNode extends Node {
  /**
   * The closing parenthesis, when present.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * The iterated expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly expressionNode: Node;

  /**
   * The `for` keyword.
   */
  public readonly forKeywordNode: TypeScriptForKeywordNode;

  /**
   * The declaration list or iteration target written before `in` or `of`.
   */
  public readonly initializerNode: Node;

  /**
   * The opening parenthesis, when present.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;

  /**
   * The repeated statement.
   */
  public readonly statementNode: Node;

  /**
   * Creates the shared roles of a `for...in` or `for...of` statement.
   *
   * @param forKeywordNode The `for` keyword.
   * @param initializerNode The declaration list or iteration target.
   * @param expressionNode The iterated expression.
   * @param statementNode The repeated statement.
   * @param span The exact statement span.
   * @param openParenthesisNode The opening parenthesis, when present.
   * @param closeParenthesisNode The closing parenthesis, when present.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptForInOrOfStatementNode} for usage.
   */
  public constructor(
    forKeywordNode: TypeScriptForKeywordNode,
    initializerNode: Node,
    expressionNode: Node,
    statementNode: Node,
    span: SourceSpan,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A `for...in` statement.
 * Inherits the shared roles documented by {@link TypeScriptForInOrOfStatementNode}.
 */
export declare class TypeScriptForInStatementNode extends TypeScriptForInOrOfStatementNode {
  /**
   * The `in` keyword.
   */
  public readonly inKeywordNode: TypeScriptInKeywordNode;

  /**
   * Creates a `for...in` statement from its exact header and body syntax.
   *
   * @param forKeywordNode The `for` keyword.
   * @param initializerNode The declaration list or iteration target.
   * @param inKeywordNode The `in` keyword.
   * @param expressionNode The iterated expression.
   * @param statementNode The repeated statement.
   * @param span The exact statement span.
   * @param openParenthesisNode The opening parenthesis, when present.
   * @param closeParenthesisNode The closing parenthesis, when present.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptForInOrOfStatementNode} for usage.
   */
  public constructor(
    forKeywordNode: TypeScriptForKeywordNode,
    initializerNode: Node,
    inKeywordNode: TypeScriptInKeywordNode,
    expressionNode: Node,
    statementNode: Node,
    span: SourceSpan,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A `for...of` or `for await...of` statement.
 * Inherits the shared roles documented by {@link TypeScriptForInOrOfStatementNode}.
 */
export declare class TypeScriptForOfStatementNode extends TypeScriptForInOrOfStatementNode {
  /**
   * The written await immediately after for, when present.
   * An await using initializer stores its own, separate await on the declaration list.
   */
  public readonly awaitKeywordNode: TypeScriptAwaitKeywordNode | undefined;

  /**
   * The `of` keyword.
   */
  public readonly ofKeywordNode: TypeScriptOfKeywordNode;

  /**
   * Creates a `for...of` statement from its exact header and body syntax.
   *
   * @param forKeywordNode The `for` keyword.
   * @param initializerNode The declaration list or iteration target.
   * @param ofKeywordNode The `of` keyword.
   * @param expressionNode The iterated expression.
   * @param statementNode The repeated statement.
   * @param span The exact statement span.
   * @param awaitKeywordNode The `await` keyword, when present.
   * @param openParenthesisNode The opening parenthesis, when present.
   * @param closeParenthesisNode The closing parenthesis, when present.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptForInOrOfStatementNode} for usage.
   */
  public constructor(
    forKeywordNode: TypeScriptForKeywordNode,
    initializerNode: Node,
    ofKeywordNode: TypeScriptOfKeywordNode,
    expressionNode: Node,
    statementNode: Node,
    span: SourceSpan,
    awaitKeywordNode?: TypeScriptAwaitKeywordNode,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * An ordinary `for` statement; `for...in` and `for...of` have their own nodes.
 */
export declare class TypeScriptForStatementNode extends Node {
  /**
   * The closing parenthesis, when present.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * The loop condition, when present.
   */
  public readonly conditionNode: Node | undefined;

  /**
   * The first header semicolon, when present.
   */
  public readonly firstSemicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * The `for` keyword.
   */
  public readonly forKeywordNode: TypeScriptForKeywordNode;

  /**
   * The loop incrementor, when present.
   */
  public readonly incrementorNode: Node | undefined;

  /**
   * The loop initializer or declaration list, when present.
   */
  public readonly initializerNode: Node | undefined;

  /**
   * The opening parenthesis, when present.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;

  /**
   * The second header semicolon, when present.
   */
  public readonly secondSemicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * The repeated statement.
   */
  public readonly statementNode: Node;

  /**
   * Creates a for statement from its exact header and body syntax.
   *
   * @param forKeywordNode The `for` keyword.
   * @param statementNode The repeated statement.
   * @param span The exact statement span.
   * @param openParenthesisNode The opening parenthesis, when present.
   * @param initializerNode The initializer or declaration list, when present.
   * @param firstSemicolonNode The first header semicolon, when present.
   * @param conditionNode The loop condition, when present.
   * @param secondSemicolonNode The second header semicolon, when present.
   * @param incrementorNode The loop incrementor, when present.
   * @param closeParenthesisNode The closing parenthesis, when present.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptReturnStatementNode} for usage.
   */
  public constructor(
    forKeywordNode: TypeScriptForKeywordNode,
    statementNode: Node,
    span: SourceSpan,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    initializerNode?: Node,
    firstSemicolonNode?: TypeScriptSemicolonNode,
    conditionNode?: Node,
    secondSemicolonNode?: TypeScriptSemicolonNode,
    incrementorNode?: Node,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * An `if` statement with an optional `else` branch.
 */
export declare class TypeScriptIfStatementNode extends Node {
  /**
   * The closing parenthesis, when present.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * The condition expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly conditionNode: Node;

  /**
   * The `else` keyword, when present.
   */
  public readonly elseKeywordNode: TypeScriptElseKeywordNode | undefined;

  /**
   * The statement selected by a false condition, when present.
   */
  public readonly elseStatementNode: Node | undefined;

  /**
   * The `if` keyword.
   */
  public readonly ifKeywordNode: TypeScriptIfKeywordNode;

  /**
   * The opening parenthesis, when present.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;

  /**
   * The statement selected by a true condition.
   */
  public readonly statementNode: Node;

  /**
   * Creates an if statement from its condition and branches.
   *
   * @param ifKeywordNode The `if` keyword.
   * @param statementNode The statement selected by a true condition.
   * @param span The exact statement span.
   * @param conditionNode The condition expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param openParenthesisNode The opening parenthesis, when present.
   * @param closeParenthesisNode The closing parenthesis, when present.
   * @param elseKeywordNode The `else` keyword, when present.
   * @param elseStatementNode The statement selected by a false condition, when present.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptReturnStatementNode} for usage.
   */
  public constructor(
    ifKeywordNode: TypeScriptIfKeywordNode,
    statementNode: Node,
    span: SourceSpan,
    conditionNode: Node,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    elseKeywordNode?: TypeScriptElseKeywordNode,
    elseStatementNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A `return` statement with an optional value.
 *
 * @example A statement names its keyword, its operand, and its terminator when written.
 * ```ts
 * const statement = TypeScriptParser.parse("return value;").rootNode.children[0];
 * if (statement instanceof TypeScriptReturnStatementNode) {
 *   console.log(statement.expressionNode instanceof TypeScriptIdentifierNode); // true
 *   console.log(statement.semicolonNode instanceof TypeScriptSemicolonNode); // true
 * }
 * ```
 */
export declare class TypeScriptReturnStatementNode extends Node {
  /**
   * The returned expression, when present on the same line.
   */
  public readonly expressionNode: Node | undefined;

  /**
   * The `return` keyword.
   */
  public readonly returnKeywordNode: TypeScriptReturnKeywordNode;

  /**
   * The explicit terminating semicolon, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * Creates a return statement from its keyword, optional expression, and terminator.
   *
   * @param returnKeywordNode The `return` keyword.
   * @param span The exact statement span.
   * @param expressionNode The returned expression, when present.
   * @param semicolonNode The explicit terminating semicolon, when present.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptReturnStatementNode} for usage.
   */
  public constructor(
    returnKeywordNode: TypeScriptReturnKeywordNode,
    span: SourceSpan,
    expressionNode?: Node,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A `throw` statement and its required expression.
 */
export declare class TypeScriptThrowStatementNode extends Node {
  /**
   * The thrown expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one or a line break directly follows `throw`.
   */
  public readonly expressionNode: Node;

  /**
   * The explicit terminating semicolon, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * The `throw` keyword.
   */
  public readonly throwKeywordNode: TypeScriptThrowKeywordNode;

  /**
   * Creates a throw statement from its keyword, expression, and optional terminator.
   *
   * @param throwKeywordNode The `throw` keyword.
   * @param span The exact statement span.
   * @param expressionNode The thrown expression, a {@link TypeScriptMissingExpressionNode} where the source lacks one or a line break
   * directly follows `throw`.
   * @param semicolonNode The explicit terminating semicolon, when present.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptReturnStatementNode} for usage.
   */
  public constructor(
    throwKeywordNode: TypeScriptThrowKeywordNode,
    span: SourceSpan,
    expressionNode: Node,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A `while` statement.
 */
export declare class TypeScriptWhileStatementNode extends Node {
  /**
   * The closing parenthesis, when present.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * The loop condition, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   */
  public readonly conditionNode: Node;

  /**
   * The opening parenthesis, when present.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;

  /**
   * The repeated statement.
   */
  public readonly statementNode: Node;

  /**
   * The `while` keyword.
   */
  public readonly whileKeywordNode: TypeScriptWhileKeywordNode;

  /**
   * Creates a while statement from its condition and body.
   *
   * @param whileKeywordNode The `while` keyword.
   * @param statementNode The repeated statement.
   * @param span The exact statement span.
   * @param conditionNode The loop condition, a {@link TypeScriptMissingExpressionNode} where the source lacks one.
   * @param openParenthesisNode The opening parenthesis, when present.
   * @param closeParenthesisNode The closing parenthesis, when present.
   * @param leadingTrivia Trivia preceding the statement.
   * @param trailingTrivia Trivia following the statement.
   *
   * @see {@link TypeScriptReturnStatementNode} for usage.
   */
  public constructor(
    whileKeywordNode: TypeScriptWhileKeywordNode,
    statementNode: Node,
    span: SourceSpan,
    conditionNode: Node,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript array type written with trailing square brackets.
 */
export declare class TypeScriptArrayTypeNode extends Node {
  /**
   * The closing bracket, when one was present in the source.
   */
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;

  /**
   * The type of each array element.
   */
  public readonly elementTypeNode: Node;

  /**
   * The opening bracket following the element type.
   */
  public readonly openBracketNode: TypeScriptOpenBracketNode;

  /**
   * Creates an array type from its element type and brackets.
   *
   * @param elementTypeNode The type of each array element.
   * @param openBracketNode The opening bracket following the element type.
   * @param closeBracketNode The closing bracket, when present.
   * @param span The exact span of the array type.
   * @param leadingTrivia Trivia preceding the array type.
   * @param trailingTrivia Trivia following the array type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    elementTypeNode: Node,
    openBracketNode: TypeScriptOpenBracketNode,
    closeBracketNode: TypeScriptCloseBracketNode | undefined,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript conditional type with recoverable missing syntax roles.
 */
export declare class TypeScriptConditionalTypeNode extends Node {
  /**
   * The type tested by the conditional.
   */
  public readonly checkTypeNode: Node;

  /**
   * The colon separating the true and false branches, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The `extends` keyword beginning the condition.
   */
  public readonly extendsKeywordNode: TypeScriptExtendsKeywordNode;

  /**
   * The type used as the constraint, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   */
  public readonly extendsTypeNode: Node;

  /**
   * The type selected when the condition is false, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   */
  public readonly falseTypeNode: Node;

  /**
   * The question mark beginning the true branch, when present.
   */
  public readonly questionNode: TypeScriptQuestionNode | undefined;

  /**
   * The type selected when the condition is true, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   */
  public readonly trueTypeNode: Node;

  /**
   * Creates a conditional type from its named syntax roles.
   *
   * @param checkTypeNode The type tested by the conditional.
   * @param extendsKeywordNode The `extends` keyword beginning the condition.
   * @param span The exact recovered span of the conditional type.
   * @param extendsTypeNode The constraint type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param trueTypeNode The true-branch type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param falseTypeNode The false-branch type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param questionNode The question mark, when present.
   * @param colonNode The colon, when present.
   * @param leadingTrivia Trivia preceding the conditional type.
   * @param trailingTrivia Trivia following the conditional type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    checkTypeNode: Node,
    extendsKeywordNode: TypeScriptExtendsKeywordNode,
    span: SourceSpan,
    extendsTypeNode: Node,
    trueTypeNode: Node,
    falseTypeNode: Node,
    questionNode?: TypeScriptQuestionNode,
    colonNode?: TypeScriptColonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript constructor-function type.
 */
export declare class TypeScriptConstructorTypeNode extends Node {
  /**
   * The optional `abstract` modifier.
   */
  public readonly abstractKeywordNode: TypeScriptAbstractKeywordNode | undefined;

  /**
   * The arrow preceding the return type, when present.
   */
  public readonly arrowNode: TypeScriptArrowNode | undefined;

  /**
   * The `new` keyword introducing the constructor signature.
   */
  public readonly newKeywordNode: TypeScriptNewKeywordNode;

  /**
   * The constructor parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   */
  public readonly parameterListNode: TypeScriptParameterListNode;

  /**
   * The constructed type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   */
  public readonly returnTypeNode: Node;

  /**
   * The generic type-parameter list, when present.
   */
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  /**
   * Creates a constructor type from its named signature roles.
   *
   * @param newKeywordNode The `new` keyword introducing the signature.
   * @param span The exact recovered span of the constructor type.
   * @param returnTypeNode The constructed type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param parameterListNode The constructor parameters and their delimiters; an empty, zero-width list without parentheses where the
   * opening parenthesis is missing.
   * @param abstractKeywordNode The optional `abstract` modifier.
   * @param typeParameterListNode The generic type-parameter list, when present.
   * @param arrowNode The return-type arrow, when present.
   * @param leadingTrivia Trivia preceding the constructor type.
   * @param trailingTrivia Trivia following the constructor type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    newKeywordNode: TypeScriptNewKeywordNode,
    span: SourceSpan,
    returnTypeNode: Node,
    parameterListNode: TypeScriptParameterListNode,
    abstractKeywordNode?: TypeScriptAbstractKeywordNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    arrowNode?: TypeScriptArrowNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * An expression paired with its optional generic type arguments.
 *
 * Used both in heritage clauses and for standalone instantiation expressions such
 * as `factory<Value>`. Calls and tagged templates store their type arguments
 * directly on their own nodes instead.
 */
export declare class TypeScriptExpressionWithTypeArgumentsNode extends Node {
  /**
   * The expression being instantiated or used as a heritage expression.
   */
  public readonly expressionNode: Node;

  /**
   * The generic type arguments, when present.
   */
  public readonly typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;

  /**
   * Creates an expression with its optional type arguments.
   *
   * @param expressionNode The expression to which the type arguments apply.
   * @param span The exact span of the expression and its type arguments.
   * @param typeArgumentListNode The generic type arguments, when present.
   * @param leadingTrivia Trivia preceding the expression.
   * @param trailingTrivia Trivia following the expression or type arguments.
   *
   * @example
   * ```ts
   * const result = TypeScriptParser.parse("factory<Value>;");
   * const statement = result.rootNode.children[0];
   * if (statement instanceof TypeScriptExpressionStatementNode
   *   && statement.expressionNode instanceof TypeScriptExpressionWithTypeArgumentsNode)
   *   console.log(statement.expressionNode.typeArgumentListNode?.children.length); // 1
   * ```
   */
  public constructor(
    expressionNode: Node,
    span: SourceSpan,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript function type.
 */
export declare class TypeScriptFunctionTypeNode extends Node {
  /**
   * The arrow preceding the return type, when present.
   */
  public readonly arrowNode: TypeScriptArrowNode | undefined;

  /**
   * The function parameters and their delimiters; an empty, zero-width list without parentheses where the opening parenthesis is missing.
   */
  public readonly parameterListNode: TypeScriptParameterListNode;

  /**
   * The returned type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   */
  public readonly returnTypeNode: Node;

  /**
   * The generic type-parameter list, when present.
   */
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  /**
   * Creates a function type from its named signature roles.
   *
   * @param span The exact recovered span of the function type.
   * @param returnTypeNode The returned type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param parameterListNode The function parameters and their delimiters; an empty, zero-width list without parentheses where the opening
   * parenthesis is missing.
   * @param typeParameterListNode The generic type-parameter list, when present.
   * @param arrowNode The return-type arrow, when present.
   * @param leadingTrivia Trivia preceding the function type.
   * @param trailingTrivia Trivia following the function type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    span: SourceSpan,
    returnTypeNode: Node,
    parameterListNode: TypeScriptParameterListNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    arrowNode?: TypeScriptArrowNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript type imported from another module.
 */
export declare class TypeScriptImportTypeNode extends Node {
  /**
   * The module specifier supplied to `import`, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   */
  public readonly argumentNode: Node;

  /**
   * The closing brace of the attribute object, when present.
   */
  public readonly attributesCloseBraceNode: TypeScriptCloseBraceNode | undefined;

  /**
   * The comma written after the attributes inside the attribute object, when present.
   */
  public readonly attributesCommaNode: TypeScriptCommaNode | undefined;

  /**
   * The `with` member of the attribute object, when parsed.
   */
  public readonly attributesNode: TypeScriptImportAttributesNode | undefined;

  /**
   * The opening brace of the attribute object, when present.
   */
  public readonly attributesOpenBraceNode: TypeScriptOpenBraceNode | undefined;

  /**
   * The closing parenthesis, when present.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * The comma introducing import attributes, when present.
   */
  public readonly commaNode: TypeScriptCommaNode | undefined;

  /**
   * The dot preceding the qualifier, when present.
   */
  public readonly dotNode: TypeScriptDotNode | undefined;

  /**
   * The `import` keyword.
   */
  public readonly importKeywordNode: TypeScriptImportKeywordNode;

  /**
   * The opening parenthesis, when present.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;

  /**
   * The qualified exported name after the dot, a {@link TypeScriptMissingIdentifierNode} where the source lacks one; undefined without a dot.
   */
  public readonly qualifierNode: Node | undefined;

  /**
   * The type arguments applied to the imported type, when present.
   */
  public readonly typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;

  /**
   * The leading `typeof` keyword, when present.
   */
  public readonly typeOfKeywordNode: TypeScriptTypeOfKeywordNode | undefined;

  /**
   * Creates an import type from its named syntax roles.
   *
   * @param importKeywordNode The `import` keyword.
   * @param span The exact recovered span of the import type.
   * @param argumentNode The module specifier, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param typeOfKeywordNode The leading `typeof` keyword, when present.
   * @param openParenthesisNode The opening parenthesis, when present.
   * @param commaNode The comma introducing import attributes, when present.
   * @param attributesOpenBraceNode The opening brace of the attribute object, when present.
   * @param attributesNode The `with` member of the attribute object, when parsed.
   * @param attributesCommaNode The comma written after the attributes inside the attribute object, when present.
   * @param attributesCloseBraceNode The closing brace of the attribute object, when present.
   * @param closeParenthesisNode The closing parenthesis, when present.
   * @param dotNode The dot preceding the qualifier, when present.
   * @param qualifierNode The qualified exported name after the dot, a {@link TypeScriptMissingIdentifierNode} where the source lacks one;
   * undefined without a dot.
   * @param typeArgumentListNode The applied type arguments, when present.
   * @param leadingTrivia Trivia preceding the import type.
   * @param trailingTrivia Trivia following the import type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    importKeywordNode: TypeScriptImportKeywordNode,
    span: SourceSpan,
    argumentNode: Node,
    typeOfKeywordNode?: TypeScriptTypeOfKeywordNode,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    commaNode?: TypeScriptCommaNode,
    attributesOpenBraceNode?: TypeScriptOpenBraceNode,
    attributesNode?: TypeScriptImportAttributesNode,
    attributesCommaNode?: TypeScriptCommaNode,
    attributesCloseBraceNode?: TypeScriptCloseBraceNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    dotNode?: TypeScriptDotNode,
    qualifierNode?: Node,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript indexed-access type.
 */
export declare class TypeScriptIndexedAccessTypeNode extends Node {
  /**
   * The closing bracket, when present.
   */
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;

  /**
   * The type used as the index.
   */
  public readonly indexTypeNode: Node;

  /**
   * The type being indexed.
   */
  public readonly objectTypeNode: Node;

  /**
   * The opening bracket following the object type.
   */
  public readonly openBracketNode: TypeScriptOpenBracketNode;

  /**
   * Creates an indexed-access type from its named syntax roles.
   *
   * @param objectTypeNode The type being indexed.
   * @param openBracketNode The opening bracket following the object type.
   * @param span The exact recovered span of the indexed-access type.
   * @param indexTypeNode The type used as the index.
   * @param closeBracketNode The closing bracket, when present.
   * @param leadingTrivia Trivia preceding the indexed-access type.
   * @param trailingTrivia Trivia following the indexed-access type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    objectTypeNode: Node,
    openBracketNode: TypeScriptOpenBracketNode,
    span: SourceSpan,
    indexTypeNode: Node,
    closeBracketNode?: TypeScriptCloseBracketNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript inferred type variable.
 */
export declare class TypeScriptInferTypeNode extends Node {
  /**
   * The `infer` keyword.
   */
  public readonly inferKeywordNode: TypeScriptInferKeywordNode;

  /**
   * The inferred type parameter, whose name is a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly typeParameterNode: TypeScriptTypeParameterNode;

  /**
   * Creates an inferred type from its keyword and type parameter.
   *
   * @param inferKeywordNode The `infer` keyword.
   * @param span The exact recovered span of the inferred type.
   * @param typeParameterNode The inferred type parameter.
   * @param leadingTrivia Trivia preceding the inferred type.
   * @param trailingTrivia Trivia following the inferred type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    inferKeywordNode: TypeScriptInferKeywordNode,
    span: SourceSpan,
    typeParameterNode: TypeScriptTypeParameterNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript intersection of two or more types.
 */
export declare class TypeScriptIntersectionTypeNode extends CompositeNode {
  /**
   * The ampersands separating the child types in source order.
   */
  public readonly ampersandNodes: readonly TypeScriptAmpersandNode[];

  /**
   * Creates an intersection whose children are its constituent types.
   *
   * @param typeNodes The constituent types in source order.
   * @param ampersandNodes The ampersands separating the types.
   * @param span The exact span of the intersection type.
   * @param leadingTrivia Trivia preceding the intersection type.
   * @param trailingTrivia Trivia following the intersection type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    typeNodes: readonly Node[],
    ampersandNodes: readonly TypeScriptAmpersandNode[],
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript type formed from a literal value.
 */
export declare class TypeScriptLiteralTypeNode extends Node {
  /**
   * The literal expression represented as a type.
   */
  public readonly literalNode: Node;

  /**
   * Creates a literal type from its literal expression.
   *
   * @param literalNode The literal expression represented as a type.
   * @param span The exact span of the literal type.
   * @param leadingTrivia Trivia preceding the literal type.
   * @param trailingTrivia Trivia following the literal type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(literalNode: Node, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A TypeScript mapped type whose children are additional type members.
 */
export declare class TypeScriptMappedTypeNode extends CompositeNode {
  /**
   * The `as` keyword introducing key remapping, when present.
   */
  public readonly asKeywordNode: TypeScriptAsKeywordNode | undefined;

  /**
   * The closing brace, when present.
   */
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  /**
   * The closing bracket around the mapped type parameter, when present.
   */
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;

  /**
   * The colon introducing the mapped property type, when present.
   */
  public readonly colonNode: TypeScriptColonNode | undefined;

  /**
   * The key-remapping type following `as`, when present.
   */
  public readonly nameTypeNode: Node | undefined;

  /**
   * The opening brace beginning the mapped type.
   */
  public readonly openBraceNode: TypeScriptOpenBraceNode;

  /**
   * The opening bracket around the mapped type parameter, when present.
   */
  public readonly openBracketNode: TypeScriptOpenBracketNode | undefined;

  /**
   * The `+` or `-` operator applied to optionality, when present.
   */
  public readonly optionalOperatorNode: Node | undefined;

  /**
   * The optional-property question mark, when present.
   */
  public readonly questionNode: TypeScriptQuestionNode | undefined;

  /**
   * The `readonly` keyword, when present.
   */
  public readonly readonlyKeywordNode: TypeScriptReadonlyKeywordNode | undefined;

  /**
   * The `+` or `-` operator applied to `readonly`, when present.
   */
  public readonly readonlyOperatorNode: Node | undefined;

  /**
   * The semicolon terminating the mapped property, when present.
   */
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  /**
   * The mapped property type, when parsed.
   */
  public readonly typeNode: Node | undefined;

  /**
   * The type parameter iterated by the mapped type.
   */
  public readonly typeParameterNode: TypeScriptTypeParameterNode;

  /**
   * Creates a mapped type from its exact syntax roles and additional members.
   *
   * @param openBraceNode The opening brace beginning the mapped type.
   * @param memberNodes Additional type members in source order.
   * @param span The exact recovered span of the mapped type.
   * @param typeParameterNode The iterated type parameter.
   * @param readonlyOperatorNode The operator applied to `readonly`, when present.
   * @param readonlyKeywordNode The `readonly` keyword, when present.
   * @param openBracketNode The opening bracket, when present.
   * @param asKeywordNode The key-remapping `as` keyword, when present.
   * @param nameTypeNode The key-remapping type, when parsed.
   * @param closeBracketNode The closing bracket, when present.
   * @param optionalOperatorNode The operator applied to optionality, when present.
   * @param questionNode The optional-property question mark, when present.
   * @param colonNode The type-annotation colon, when present.
   * @param typeNode The mapped property type, when parsed.
   * @param semicolonNode The terminating semicolon, when present.
   * @param closeBraceNode The closing brace, when present.
   * @param leadingTrivia Trivia preceding the mapped type.
   * @param trailingTrivia Trivia following the mapped type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    openBraceNode: TypeScriptOpenBraceNode,
    memberNodes: readonly Node[],
    span: SourceSpan,
    typeParameterNode: TypeScriptTypeParameterNode,
    readonlyOperatorNode?: Node,
    readonlyKeywordNode?: TypeScriptReadonlyKeywordNode,
    openBracketNode?: TypeScriptOpenBracketNode,
    asKeywordNode?: TypeScriptAsKeywordNode,
    nameTypeNode?: Node,
    closeBracketNode?: TypeScriptCloseBracketNode,
    optionalOperatorNode?: Node,
    questionNode?: TypeScriptQuestionNode,
    colonNode?: TypeScriptColonNode,
    typeNode?: Node,
    semicolonNode?: TypeScriptSemicolonNode,
    closeBraceNode?: TypeScriptCloseBraceNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A required type position that could not be populated from the source. The parser writes it zero-width at the end of the
 * preceding token and without trivia.
 */
export declare class TypeScriptMissingTypeNode extends Node {
  /**
   * Creates a missing type at its recovery span.
   *
   * @param span The recovery span; parser-produced markers are zero-width at the end of the preceding token.
   * @param leadingTrivia Trivia preceding the missing type.
   * @param trailingTrivia Trivia following the missing type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A named element within a TypeScript tuple type.
 */
export declare class TypeScriptNamedTupleMemberNode extends Node {
  /**
   * The colon separating the name from its type.
   */
  public readonly colonNode: TypeScriptColonNode;

  /**
   * The rest marker preceding the name, when present.
   */
  public readonly dotDotDotNode: TypeScriptDotDotDotNode | undefined;

  /**
   * The tuple element name.
   */
  public readonly nameNode: Node;

  /**
   * The optional-element question mark, when present.
   */
  public readonly questionNode: TypeScriptQuestionNode | undefined;

  /**
   * The tuple element type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   */
  public readonly typeNode: Node;

  /**
   * Creates a named tuple member from its exact syntax roles.
   *
   * @param nameNode The tuple element name.
   * @param colonNode The colon separating the name and type.
   * @param span The exact recovered span of the tuple member.
   * @param typeNode The tuple element type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param dotDotDotNode The rest marker, when present.
   * @param questionNode The optional-element question mark, when present.
   * @param leadingTrivia Trivia preceding the tuple member.
   * @param trailingTrivia Trivia following the tuple member.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    nameNode: Node,
    colonNode: TypeScriptColonNode,
    span: SourceSpan,
    typeNode: Node,
    dotDotDotNode?: TypeScriptDotDotDotNode,
    questionNode?: TypeScriptQuestionNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * An optional element type used by tuple syntax.
 */
export declare class TypeScriptOptionalTypeNode extends Node {
  /**
   * The optional-element question mark.
   */
  public readonly questionNode: TypeScriptQuestionNode;

  /**
   * The element type made optional.
   */
  public readonly typeNode: Node;

  /**
   * Creates an optional type from its element type and question mark.
   *
   * @param typeNode The element type made optional.
   * @param questionNode The optional-element question mark.
   * @param span The exact span of the optional type.
   * @param leadingTrivia Trivia preceding the optional type.
   * @param trailingTrivia Trivia following the optional type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    typeNode: Node,
    questionNode: TypeScriptQuestionNode,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript type enclosed by parentheses.
 */
export declare class TypeScriptParenthesizedTypeNode extends Node {
  /**
   * The closing parenthesis, when present.
   */
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  /**
   * The opening parenthesis.
   */
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode;

  /**
   * The enclosed type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   */
  public readonly typeNode: Node;

  /**
   * Creates a parenthesized type from its named syntax roles.
   *
   * @param openParenthesisNode The opening parenthesis.
   * @param span The exact recovered span of the parenthesized type.
   * @param typeNode The enclosed type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param closeParenthesisNode The closing parenthesis, when present.
   * @param leadingTrivia Trivia preceding the parenthesized type.
   * @param trailingTrivia Trivia following the parenthesized type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    openParenthesisNode: TypeScriptOpenParenthesisNode,
    span: SourceSpan,
    typeNode: Node,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A rest element type used by tuple syntax.
 */
export declare class TypeScriptRestTypeNode extends Node {
  /**
   * The rest marker introducing the element type.
   */
  public readonly dotDotDotNode: TypeScriptDotDotDotNode;

  /**
   * The rest element type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   */
  public readonly typeNode: Node;

  /**
   * Creates a rest type from its marker and element type.
   *
   * @param dotDotDotNode The rest marker.
   * @param span The exact recovered span of the rest type.
   * @param typeNode The rest element type, a {@link TypeScriptMissingTypeNode} where the source lacks one.
   * @param leadingTrivia Trivia preceding the rest type.
   * @param trailingTrivia Trivia following the rest type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    dotDotDotNode: TypeScriptDotDotDotNode,
    span: SourceSpan,
    typeNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript template-literal type whose children are its interpolated spans.
 */
export declare class TypeScriptTemplateLiteralTypeNode extends CompositeNode {
  /**
   * The template head preceding the interpolated spans.
   */
  public readonly headNode: Node;

  /**
   * Creates a template-literal type from its head and spans.
   *
   * @param headNode The template head.
   * @param spanNodes The interpolated template spans in source order.
   * @param span The exact span of the template-literal type.
   * @param leadingTrivia Trivia preceding the template-literal type.
   * @param trailingTrivia Trivia following the template-literal type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    headNode: Node,
    spanNodes: readonly Node[],
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * One interpolated span within a TypeScript template-literal type.
 */
export declare class TypeScriptTemplateLiteralTypeSpanNode extends Node {
  /**
   * The template middle or tail following the type, or undefined when missing.
   */
  public readonly literalNode: Node | undefined;

  /**
   * The interpolated type.
   */
  public readonly typeNode: Node;

  /**
   * Creates a template-literal type span.
   *
   * @param typeNode The interpolated type.
   * @param literalNode The template middle or tail following the type, or undefined when missing.
   * @param span The exact span of the template span.
   * @param leadingTrivia Trivia preceding the template span.
   * @param trailingTrivia Trivia following the template span.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    typeNode: Node,
    literalNode: Node | undefined,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * The TypeScript `this` type.
 */
export declare class TypeScriptThisTypeNode extends Node {
  /**
   * The `this` keyword represented as a type.
   */
  public readonly thisKeywordNode: TypeScriptThisKeywordNode;

  /**
   * Creates a `this` type from its keyword token.
   *
   * @param thisKeywordNode The `this` keyword represented as a type.
   * @param span The exact span of the `this` type.
   * @param leadingTrivia Trivia preceding the `this` type.
   * @param trailingTrivia Trivia following the `this` type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    thisKeywordNode: TypeScriptThisKeywordNode,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript tuple type whose children are its element types.
 */
export declare class TypeScriptTupleTypeNode extends TypeScriptDelimitedListNode {
  /**
   * The closing bracket, when present.
   */
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;

  /**
   * The opening bracket beginning the tuple.
   */
  public readonly openBracketNode: TypeScriptOpenBracketNode;

  /**
   * Creates a tuple type from its delimiters and element types.
   *
   * @param openBracketNode The opening bracket beginning the tuple.
   * @param elementNodes The tuple element types in source order.
   * @param commaNodes The commas separating the elements.
   * @param span The exact recovered span of the tuple type.
   * @param closeBracketNode The closing bracket, when present.
   * @param leadingTrivia Trivia preceding the tuple type.
   * @param trailingTrivia Trivia following the tuple type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    openBracketNode: TypeScriptOpenBracketNode,
    elementNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    closeBracketNode?: TypeScriptCloseBracketNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript type-argument list whose children are its arguments.
 */
export declare class TypeScriptTypeArgumentListNode extends TypeScriptDelimitedListNode {
  /**
   * The closing greater-than token, when present.
   */
  public readonly greaterThanNode: TypeScriptGreaterThanNode | undefined;

  /**
   * The opening less-than token.
   */
  public readonly lessThanNode: TypeScriptLessThanNode;

  /**
   * Creates a type-argument list from its delimiters and arguments.
   *
   * @param lessThanNode The opening less-than token.
   * @param argumentNodes The type arguments in source order.
   * @param commaNodes The commas separating the arguments.
   * @param span The exact recovered span of the type-argument list.
   * @param greaterThanNode The closing greater-than token, when present.
   * @param leadingTrivia Trivia preceding the type-argument list.
   * @param trailingTrivia Trivia following the type-argument list.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    lessThanNode: TypeScriptLessThanNode,
    argumentNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    greaterThanNode?: TypeScriptGreaterThanNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript object type literal whose children are its type members.
 */
export declare class TypeScriptTypeLiteralNode extends CompositeNode {
  /**
   * The closing brace, when present.
   */
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  /**
   * The opening brace beginning the type literal.
   */
  public readonly openBraceNode: TypeScriptOpenBraceNode;

  /**
   * Creates a type literal from its delimiters and members.
   *
   * @param openBraceNode The opening brace beginning the type literal.
   * @param memberNodes The type members in source order.
   * @param span The exact recovered span of the type literal.
   * @param closeBraceNode The closing brace, when present.
   * @param leadingTrivia Trivia preceding the type literal.
   * @param trailingTrivia Trivia following the type literal.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    openBraceNode: TypeScriptOpenBraceNode,
    memberNodes: readonly Node[],
    span: SourceSpan,
    closeBraceNode?: TypeScriptCloseBraceNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A type operator and its operand, when the written form requires one.
 *
 * Also preserves JSDoc-style `?`, `!`, and `*` spellings encountered in
 * TypeScript input for later legality checking. Operator and operand spans
 * distinguish prefix from postfix spelling; the parser does not normalize them.
 *
 * @example
 * ```ts
 * const operand = new TypeScriptIdentifierNode("Value", new SourceSpan(1, 5));
 * const operator = new TypeScriptQuestionNode(new SourceSpan(0, 1));
 * const type = new TypeScriptTypeOperatorNode(operator, new SourceSpan(0, 6), operand);
 * type.operatorNode.span.startOffset < type.typeNode!.span.startOffset; // prefix
 * ```
 */
export declare class TypeScriptTypeOperatorNode extends Node {
  /**
   * The written operator keyword or punctuation.
   */
  public readonly operatorNode: Node;

  /**
   * The operand type, or undefined for an operandless form such as `*`.
   */
  public readonly typeNode: Node | undefined;

  /**
   * Creates a type operator from its written token and optional operand.
   *
   * @param operatorNode The operator keyword or punctuation exactly as written.
   * @param span The exact recovered span of the type operator.
   * @param typeNode The operand, a {@link TypeScriptMissingTypeNode} where the source lacks one; undefined only for an operandless form such as `*`.
   * @param leadingTrivia Trivia preceding the type operator.
   * @param trailingTrivia Trivia following the type operator.
   * @example See {@link TypeScriptParser} for parsing source into syntax nodes.
   */
  public constructor(
    operatorNode: Node,
    span: SourceSpan,
    typeNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript type-parameter list whose children are its parameters.
 */
export declare class TypeScriptTypeParameterListNode extends TypeScriptDelimitedListNode {
  /**
   * The closing greater-than token, when present.
   */
  public readonly greaterThanNode: TypeScriptGreaterThanNode | undefined;

  /**
   * The opening less-than token.
   */
  public readonly lessThanNode: TypeScriptLessThanNode;

  /**
   * Creates a type-parameter list from its delimiters and parameters.
   *
   * @param lessThanNode The opening less-than token.
   * @param parameterNodes The type parameters in source order.
   * @param commaNodes The commas separating the parameters.
   * @param span The exact recovered span of the type-parameter list.
   * @param greaterThanNode The closing greater-than token, when present.
   * @param leadingTrivia Trivia preceding the type-parameter list.
   * @param trailingTrivia Trivia following the type-parameter list.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    lessThanNode: TypeScriptLessThanNode,
    parameterNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    greaterThanNode?: TypeScriptGreaterThanNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript type parameter, including syntax retained for error recovery.
 */
export declare class TypeScriptTypeParameterNode extends Node {
  /**
   * The `extends` or `in` keyword introducing the constraint, when present.
   */
  public readonly constraintKeywordNode: Node | undefined;

  /**
   * The parsed constraint type, when present.
   */
  public readonly constraintNode: Node | undefined;

  /**
   * The default type, when present.
   */
  public readonly defaultTypeNode: Node | undefined;

  /**
   * The equals token introducing the default type, when present.
   */
  public readonly equalsNode: TypeScriptEqualsNode | undefined;

  /**
   * Written decorators and modifier keywords, in source order.
   */
  public readonly modifierNodes: readonly Node[];

  /**
   * The type-parameter name. Where no name can be read, as when a reserved word is written in its place, it is a
   * {@link TypeScriptMissingIdentifierNode}; no spelling is synthesized.
   */
  public readonly nameNode: Node;

  /**
   * Creates a type parameter from its exact syntax and recovery roles.
   *
   * @param modifierNodes Written decorators and modifier keywords in source order; legality is checked separately.
   * @param nameNode The type-parameter name, or a {@link TypeScriptMissingIdentifierNode} where none can be read.
   * @param span The exact recovered span of the type parameter.
   * @param constraintKeywordNode The constraint keyword, when present.
   * @param constraintNode The parsed constraint type, when present.
   * @param equalsNode The equals token introducing the default, when present.
   * @param defaultTypeNode The default type, when present.
   * @param leadingTrivia Trivia preceding the type parameter.
   * @param trailingTrivia Trivia following the type parameter.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    modifierNodes: readonly Node[],
    nameNode: Node,
    span: SourceSpan,
    constraintKeywordNode?: Node,
    constraintNode?: Node,
    equalsNode?: TypeScriptEqualsNode,
    defaultTypeNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript type predicate such as `value is string` or `asserts value`.
 */
export declare class TypeScriptTypePredicateNode extends Node {
  /**
   * The `asserts` keyword, when present.
   */
  public readonly assertsKeywordNode: TypeScriptAssertsKeywordNode | undefined;

  /**
   * The `is` keyword, when present.
   */
  public readonly isKeywordNode: TypeScriptIsKeywordNode | undefined;

  /**
   * The identifier or `this` node being narrowed.
   */
  public readonly parameterNameNode: Node;

  /**
   * The asserted type, when parsed.
   */
  public readonly typeNode: Node | undefined;

  /**
   * Creates a type predicate from its named syntax roles.
   *
   * @param parameterNameNode The identifier or `this` node being narrowed.
   * @param span The exact recovered span of the predicate.
   * @param assertsKeywordNode The `asserts` keyword, when present.
   * @param isKeywordNode The `is` keyword, when present.
   * @param typeNode The asserted type, when parsed.
   * @param leadingTrivia Trivia preceding the predicate.
   * @param trailingTrivia Trivia following the predicate.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    parameterNameNode: Node,
    span: SourceSpan,
    assertsKeywordNode?: TypeScriptAssertsKeywordNode,
    isKeywordNode?: TypeScriptIsKeywordNode,
    typeNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript type query beginning with `typeof`.
 */
export declare class TypeScriptTypeQueryNode extends Node {
  /**
   * The queried entity name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   */
  public readonly expressionNameNode: Node;

  /**
   * The type arguments applied to the query, when present.
   */
  public readonly typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;

  /**
   * The `typeof` keyword.
   */
  public readonly typeOfKeywordNode: TypeScriptTypeOfKeywordNode;

  /**
   * Creates a type query from its named syntax roles.
   *
   * @param typeOfKeywordNode The `typeof` keyword.
   * @param span The exact recovered span of the query.
   * @param expressionNameNode The queried entity name, a {@link TypeScriptMissingIdentifierNode} where the source lacks one.
   * @param typeArgumentListNode The applied type arguments, when present.
   * @param leadingTrivia Trivia preceding the type query.
   * @param trailingTrivia Trivia following the type query.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    typeOfKeywordNode: TypeScriptTypeOfKeywordNode,
    span: SourceSpan,
    expressionNameNode: Node,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript reference to a named type.
 */
export declare class TypeScriptTypeReferenceNode extends Node {
  /**
   * The identifier or qualified name being referenced.
   */
  public readonly nameNode: Node;

  /**
   * The applied type arguments, when present.
   */
  public readonly typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;

  /**
   * Creates a type reference from its name and optional arguments.
   *
   * @param nameNode The identifier or qualified name being referenced.
   * @param span The exact span of the type reference.
   * @param typeArgumentListNode The applied type arguments, when present.
   * @param leadingTrivia Trivia preceding the type reference.
   * @param trailingTrivia Trivia following the type reference.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    nameNode: Node,
    span: SourceSpan,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * A TypeScript union of two or more types.
 */
export declare class TypeScriptUnionTypeNode extends CompositeNode {
  /**
   * The bars separating the child types in source order.
   */
  public readonly barNodes: readonly TypeScriptBarNode[];

  /**
   * Creates a union whose children are its constituent types.
   *
   * @param typeNodes The constituent types in source order.
   * @param barNodes The bars separating the types.
   * @param span The exact span of the union type.
   * @param leadingTrivia Trivia preceding the union type.
   * @param trailingTrivia Trivia following the union type.
   *
   * @see {@link TypeScriptTypeOperatorNode} for usage.
   */
  public constructor(
    typeNodes: readonly Node[],
    barNodes: readonly TypeScriptBarNode[],
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node);
}

/**
 * An ordered TypeScript trivia collection preserving the concrete identities
 * of whitespace, comments, shebangs, and conflict markers.
 */
export declare class TypeScriptTriviaNode extends CompositeNode {
  /**
   * Creates the trivia node over its ordered children. The array is retained without copying; do not mutate it after publication.
   *
   * @param children The trivia nodes in source order.
   * @param span The exact source span containing all children.
   *
   * @see {@link TypeScriptLineCommentNode} for usage.
   */
  public constructor(children: readonly Node[], span: SourceSpan);
}

/**
 * A TypeScript block comment. The inherited value excludes the opening and
 * any present closing delimiter, preserving whitespace, line breaks, and
 * documentation-comment stars. The span includes all original delimiters.
 * An unterminated comment retains its complete remaining body; the lexer
 * reports the missing delimiter separately through diagnostics.
 *
 * @example
 * ```ts
 * import { CommentNode, Source, SourceSpan } from "@noldova/context.parsers";
 * import { TypeScriptBlockCommentNode } from "@noldova/context.parsers.typescript";
 *
 * const source = new Source("/* note *\/");
 * const comment = new TypeScriptBlockCommentNode(" note ", new SourceSpan(0, 10));
 * console.assert(comment.value === " note " && comment instanceof CommentNode);
 * console.assert(source.getText(comment.span) === "/* note *\/");
 * ```
 */
export declare class TypeScriptBlockCommentNode extends CommentNode {
  /**
   * Creates a block-comment node from lexer-selected body text and source span.
   * It does not parse, trim, or validate the supplied comment syntax.
   *
   * @param value The untrimmed body without the opening delimiter or a closing
   * delimiter that was present; empty text is valid.
   * @param span The absolute UTF-16 span of the whole comment, including its
   * delimiters or the complete remaining input when unterminated.
   * @param leadingTrivia Optional preceding language-owned trivia.
   * @param trailingTrivia Optional following language-owned trivia.
   * @see {@link TypeScriptBlockCommentNode} for body and original-text access.
   */
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A TypeScript line comment. The inherited value excludes the opening two
 * slashes and preserves the remaining body exactly. The terminating line
 * break is separate trivia, excluded from both the body and the full comment span.
 *
 * @example
 * ```ts
 * import { Source, SourceSpan } from "@noldova/context.parsers";
 * import { TypeScriptLineCommentNode } from "@noldova/context.parsers.typescript";
 *
 * const source = new Source("// note\n");
 * const comment = new TypeScriptLineCommentNode(" note", new SourceSpan(0, 7));
 * console.assert(comment.value === " note");
 * console.assert(source.getText(comment.span) === "// note");
 * const empty = new TypeScriptLineCommentNode("", new SourceSpan(0, 2));
 * console.assert(empty.value === "");
 * ```
 */
export declare class TypeScriptLineCommentNode extends CommentNode {
  /**
   * Creates a line-comment node from lexer-selected body text and source span.
   * It does not parse, trim, or validate the supplied comment syntax.
   *
   * @param value The untrimmed body after the opening two slashes and before
   * the line break or reader end; empty text is valid.
   * @param span The absolute UTF-16 span including the opening slashes but
   * excluding the terminating line break.
   * @param leadingTrivia Optional preceding language-owned trivia.
   * @param trailingTrivia Optional following language-owned trivia.
   * @see {@link TypeScriptLineCommentNode} for body and original-text access.
   */
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * A merge-conflict marker and the source text consumed with it as TypeScript
 * trivia.
 */
export declare class TypeScriptConflictMarkerNode extends ValueNode {
  /**
   * Creates the trivia node from its preserved text and exact source span.
   *
   * @param value The complete conflict-marker trivia text.
   * @param span The exact source span represented by the node.
   *
   * @see {@link TypeScriptLineCommentNode} for usage.
   */
  public constructor(value: string, span: SourceSpan);
}

/**
 * A shebang occurring at the beginning of a TypeScript source file.
 */
export declare class TypeScriptShebangNode extends ValueNode {
  /**
   * Creates the trivia node from its preserved text and exact source span.
   *
   * @param value The complete shebang without its following line break.
   * @param span The exact source span represented by the node.
   *
   * @see {@link TypeScriptLineCommentNode} for usage.
   */
  public constructor(value: string, span: SourceSpan);
}

/**
 * An unclassifiable source token, or the unparsed remainder kept after parsing stops at the recursion limit.
 */
export declare class TypeScriptUnknownNode extends ValueNode {
  /**
   * Preserves an unrecognized token or an unparsed region after a parser limit.
   *
   * @param value The complete source text represented by this node, unchanged.
   * @param span The absolute UTF-16 span covered by that text.
   * @param leadingTrivia Trivia preceding the preserved region, when present.
   * @param trailingTrivia Trivia following the preserved region, when present.
   * @example See {@link TypeScriptParser} for input and diagnostic handling.
   */
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node);
}

/**
 * The rest of an input that TypeScript reads as a file that is not text, from
 * the replacement character that shows it on. It is an unknown token to list
 * recovery, but a statement that ends before it still reports its missing
 * semicolon.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("let x = 1;\nabc �");
 * result.diagnostics.map(t => t.code.displayText); // ["TS1490", "TS1434", "TS1128"]
 * ```
 */
export declare class TypeScriptNonTextFileMarkerNode extends TypeScriptUnknownNode { }

/**
 * Parses one TypeScript input into its syntax tree and ordered diagnostics.
 * Lexer state, grammar services, and token navigation remain internal.
 * Node-owned grammar-legality checks run as each construct completes, without
 * an additional full-tree traversal. Tentative parsing rolls back both
 * diagnostic categories. Name binding, type checking, and complete
 * compiler-level diagnostic conformance are not provided.
 *
 * Syntax diagnostics are published first, a regular expression's own
 * diagnostics among them. Legality diagnostics follow only when the input
 * produced no TypeScript syntax diagnostic, did not stop at the recursion
 * limit, and wrote no `@ts-nocheck` comment before its first token, so a
 * recovered tree reports no secondary legality errors. A legality diagnostic
 * inside a region the reference's checker never visits is withheld unless the
 * reference's binder reports it, and one on the line after a `@ts-ignore` or
 * `@ts-expect-error` comment, looking back over blank lines and line comments
 * only, is withheld. Each group is ordered by start, then the shorter span, the
 * lower code, and the message text; a diagnostic repeating another's code,
 * span, and message appears once.
 *
 * The source kind alone selects declaration input. Code input is a module when
 * a top-level statement is an import declaration, an `import x = require(...)`
 * declaration, an export declaration or assignment, or a declaration written
 * with `export`; when `import.meta` appears anywhere; or when its identity ends
 * in `.mts` or `.cts`, in any letter case. A dynamic `import(...)`, an import
 * alias of an entity name, `export as namespace`, and an export inside a
 * namespace do not make it one. Declaration input is a module only by what it
 * writes and does not enable module top-level await.
 *
 * The bootstrap permits at most 512 simultaneously active recursive grammar
 * entries across expressions, types, binding patterns, and statements. This
 * counts parser recursion, not source parentheses: mixed constructs share the
 * budget. On reaching it, CTX2000 identifies the interrupted entry. Completed
 * top-level statements remain in the result; the unfinished statement and
 * remaining input become one {@link TypeScriptUnknownNode}. The reader reaches
 * its region's end, and that unparsed remainder is not resumed or accepted as
 * valid TypeScript. Unexpected internal failures still throw.
 *
 * @example
 * ```ts
 * const result = TypeScriptParser.parse("value + 1;", "example.ts");
 * result.rootNode.children.length; // 1
 * result.diagnostics.length; // 0
 * ```
 *
 * @example
 * ```ts
 * const source = new Source("prefixvalue;suffix", "embedded.ts");
 * const reader = new SourceReader(source, new SourceSpan(6, 6));
 * const result = new TypeScriptParser(reader).parse();
 * result.rootNode.span.startOffset; // 6
 * reader.currentOffset; // 12; "suffix" remains outside the input
 * ```
 */
export declare class TypeScriptParser {
  /**
   * Parses complete TypeScript source text in a fresh session.
   *
   * @param content The complete TypeScript source text; a file is not required.
   * @param identity The optional canonical logical source identity. Code input
   * whose identity ends in `.mts` or `.cts` is a module.
   * @param sourceKind The input interpretation. Defaults to Code; use Declaration
   * for declaration input regardless of its logical name or storage.
   * @returns The root and its diagnostics, published, ordered, and without
   * repeats as {@link TypeScriptParser} describes, including recovered or
   * unparsed syntax. CTX2000 means parsing stopped at the implementation
   * recursion limit.
   * @throws ArgumentException If a supplied identity is empty or whitespace.
   * @example See {@link TypeScriptParser} for string and bounded-reader examples.
   */
  public static parse(content: string, identity?: string, sourceKind?: TypeScriptSourceKind): ParserResult<TypeScriptNode>;

  /**
   * Creates a single-use parser from source text.
   *
   * @param content The complete TypeScript source text.
   * @param identity The optional logical identity preserved on diagnostic
   * locations. Code input whose identity ends in `.mts` or `.cts` is a module.
   * @param sourceKind The input interpretation, defaulting to Code.
   * @throws ArgumentException If a supplied identity is empty or whitespace.
   * @example See {@link TypeScriptParser} for a complete input and result example.
   */
  public constructor(content: string, identity?: string, sourceKind?: TypeScriptSourceKind);

  /**
   * Creates a single-use parser over an existing immutable source.
   *
   * @param source The shared source, including its optional logical identity.
   * @param sourceKind The input interpretation, defaulting to Code.
   * @remarks Uses a new reader; other readers over this source are not advanced.
   * @example See {@link TypeScriptParser} for source and reader usage.
   */
  public constructor(source: Source, sourceKind?: TypeScriptSourceKind);

  /**
   * Creates a single-use parser over a caller-supplied reader.
   *
   * @param reader The shared reader, consumed from its current position to its
   * region's end. Surrounding source text is not consumed.
   * @param sourceKind The bounded input's interpretation, defaulting to Code.
   * @remarks Construction reads the first token and advances the supplied reader.
   * Produced spans and diagnostic locations use absolute UTF-16 offsets.
   * @example See {@link TypeScriptParser} for a bounded embedded input.
   */
  public constructor(reader: SourceReader, sourceKind?: TypeScriptSourceKind);

  /**
   * Parses the complete remaining input and releases temporary recognition state.
   *
   * @returns The TypeScript root and an independent diagnostic sequence,
   * published, ordered, and without repeats as {@link TypeScriptParser}
   * describes. Malformed source produces diagnostics and recovered syntax.
   * Reaching the checked recursion limit produces CTX2000 and an explicit
   * unparsed remainder, as described by {@link TypeScriptParser}.
   * @throws ParserException If this session has already attempted parsing.
   * @remarks The result remains usable independently of the parser. Create a
   * new parser for another operation.
   * @example See {@link TypeScriptParser} for input, spans, and diagnostics.
   */
  public parse(): ParserResult<TypeScriptNode>;
}
