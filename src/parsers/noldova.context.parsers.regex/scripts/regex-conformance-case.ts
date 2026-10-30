/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  type CallExpression,
  getTokenPosOfNode,
  isArrowFunction,
  isCallExpression,
  isFunctionExpression,
  isIdentifier,
  isNewExpression,
  isNoSubstitutionTemplateLiteral,
  isPropertyAccessExpression,
  isRegularExpressionLiteral,
  isStringLiteral,
  isTryStatement,
  type NewExpression,
  type Node,
  type NoSubstitutionTemplateLiteral,
  type SourceFile,
  type StringLiteral,
  SyntaxKind
} from "typescript/unstable/ast";

import RegexExpectedRecord from "./regex-expected-record.ts";
import RegexWrittenPattern from "./regex-written-pattern.ts";

export default class RegexConformanceCase {
  private static readonly FRONT_MATTER: RegExp = /\/\*---([\s\S]*?)---\*\//u;
  private static readonly PARSE_NEGATIVE: RegExp = /^negative:\s*\n\s+phase:\s*parse\s*\n\s+type:\s*SyntaxError\s*$/mu;
  private static readonly LINE_TERMINATOR: RegExp = /[\n\r\p{Zl}\p{Zp}]/u;
  private static readonly CATCHES_SYNTAX_ERROR: RegExp = /\binstanceof\s+SyntaxError\b/u;
  private static readonly LITERAL_DELIMITER: string = "/";
  private static readonly NO_FLAGS: string = "";
  private static readonly REGEXP_NAME: string = "RegExp";
  private static readonly ASSERT_NAME: string = "assert";
  private static readonly THROWS_NAME: string = "throws";
  private static readonly SYNTAX_ERROR_NAME: string = "SyntaxError";
  private static readonly ASSERT_THROWS_ARGUMENTS: number = 2;
  private static readonly MAXIMUM_CONSTRUCTION_ARGUMENTS: number = 2;

  private readonly path: string;
  private readonly sha256: string;
  private readonly sourceFile: SourceFile;
  private readonly hasSyntaxErrors: boolean;
  private readonly literals: RegexWrittenPattern[] = [];
  private readonly accepted: RegexWrittenPattern[] = [];
  private readonly rejectedGroups: Map<Node, RegexWrittenPattern[]> = new Map();
  private readonly undecidedScopes: Set<Node> = new Set();
  private hasRuntimePatterns: boolean = false;

  public constructor(path: string, sha256: string, sourceFile: SourceFile, hasSyntaxErrors: boolean) {
    this.path = path;
    this.sha256 = sha256;
    this.sourceFile = sourceFile;
    this.hasSyntaxErrors = hasSyntaxErrors;
  }

  public read(): RegexExpectedRecord {
    this.sourceFile.forEachChild(node => this.visit(node));
    if (this.isParseNegative())
      return this.literals.length === 0 || this.hasSyntaxErrors || this.literals.some(t => RegexConformanceCase.LINE_TERMINATOR.test(t.pattern))
        ? RegexExpectedRecord.inapplicable(this.path, this.sha256, RegexExpectedRecord.LITERAL_BOUNDARY)
        : RegexExpectedRecord.applicable(this.path, this.sha256, [], [this.literals]);

    const accepted = [...this.literals, ...this.accepted].toSorted((left, right) => left.start - right.start);
    const rejected = [...this.rejectedGroups].filter(([scope]) => !this.undecidedScopes.has(scope)).map(([, patterns]) => patterns);
    if (accepted.length === 0 && rejected.length === 0)
      return RegexExpectedRecord.inapplicable(this.path, this.sha256,
        this.hasRuntimePatterns ? RegexExpectedRecord.RUNTIME_PATTERNS : RegexExpectedRecord.NO_WRITTEN_PATTERN);

    return RegexExpectedRecord.applicable(this.path, this.sha256, accepted, rejected);
  }

  private visit(node: Node): undefined {
    if (isRegularExpressionLiteral(node)) {
      const delimiter = node.text.lastIndexOf(RegexConformanceCase.LITERAL_DELIMITER);
      this.literals.push(new RegexWrittenPattern(getTokenPosOfNode(node, this.sourceFile), node.text.slice(1, delimiter), node.text.slice(delimiter + 1)));
    }
    else if ((isNewExpression(node) || isCallExpression(node)) && isIdentifier(node.expression) && node.expression.text === RegexConformanceCase.REGEXP_NAME)
      this.readConstruction(node);

    return node.forEachChild(child => this.visit(child));
  }

  private readConstruction(node: NewExpression | CallExpression): void {
    const scope = this.findExpectationScope(node);
    const [patternNode, flagsNode] = node.arguments ?? [];
    if (patternNode === undefined || !RegexConformanceCase.isWrittenString(patternNode)
      || (node.arguments?.length ?? 0) > RegexConformanceCase.MAXIMUM_CONSTRUCTION_ARGUMENTS
      || (flagsNode !== undefined && !RegexConformanceCase.isWrittenString(flagsNode))) {
      this.hasRuntimePatterns = true;
      if (scope !== undefined)
        this.undecidedScopes.add(scope);
      return;
    }

    const pattern = new RegexWrittenPattern(getTokenPosOfNode(patternNode, this.sourceFile), patternNode.text,
      flagsNode === undefined ? RegexConformanceCase.NO_FLAGS : flagsNode.text);
    if (scope === undefined || !this.expectsSyntaxError(scope)) {
      if (scope !== undefined && isTryStatement(scope)) {
        this.hasRuntimePatterns = true;
        this.undecidedScopes.add(scope);
      }
      else
        this.accepted.push(pattern);
      return;
    }

    const group = this.rejectedGroups.get(scope) ?? [];
    group.push(pattern);
    this.rejectedGroups.set(scope, group);
  }

  private findExpectationScope(node: Node): Node | undefined {
    for (let current = node; current.kind !== SyntaxKind.SourceFile; current = current.parent) {
      const parent = current.parent;
      if ((isFunctionExpression(current) || isArrowFunction(current)) && isCallExpression(parent) && parent.arguments[1] === current
        && RegexConformanceCase.isAssertThrows(parent))
        return parent;

      if (isTryStatement(parent) && parent.tryBlock === current)
        return parent;
    }

    return undefined;
  }

  private expectsSyntaxError(scope: Node): boolean {
    if (isCallExpression(scope)) {
      const errorNode = scope.arguments[0]!;
      return isIdentifier(errorNode) && errorNode.text === RegexConformanceCase.SYNTAX_ERROR_NAME;
    }

    const catchBlock = isTryStatement(scope) ? scope.catchClause?.block : undefined;
    return catchBlock !== undefined
      && RegexConformanceCase.CATCHES_SYNTAX_ERROR.test(this.sourceFile.text.slice(getTokenPosOfNode(catchBlock, this.sourceFile), catchBlock.end));
  }

  private isParseNegative(): boolean {
    const frontMatter = RegexConformanceCase.FRONT_MATTER.exec(this.sourceFile.text)?.[1];
    return frontMatter !== undefined && RegexConformanceCase.PARSE_NEGATIVE.test(frontMatter);
  }

  private static isAssertThrows(node: CallExpression): boolean {
    const callee = node.expression;
    return isPropertyAccessExpression(callee) && isIdentifier(callee.expression) && callee.expression.text === RegexConformanceCase.ASSERT_NAME
      && isIdentifier(callee.name) && callee.name.text === RegexConformanceCase.THROWS_NAME
      && node.arguments.length >= RegexConformanceCase.ASSERT_THROWS_ARGUMENTS;
  }

  private static isWrittenString(node: Node): node is StringLiteral | NoSubstitutionTemplateLiteral {
    return isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node);
  }
}
