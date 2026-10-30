/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import { type Node, ParserContext, type Source, type SourceSpan } from "@noldova/context.parsers";

import { TypeScriptArrowHeadKind } from "../enums/typescript-arrow-head-kind.js";
import { TypeScriptContextFlags } from "../enums/typescript-context-flags.js";
import type { TypeScriptListKind } from "../enums/typescript-list-kind.js";
import { TypeScriptRecursionLimitException } from "../exceptions/typescript-recursion-limit.exception.js";
import { Resources } from "../resources.js";
import type { TypeScriptSyntaxParser } from "../services/typescript-syntax.parser.js";
import { TypeScriptDiagnosticTemplates } from "./diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptDeferredRecords } from "./typescript-deferred-records.js";
import { TypeScriptJumpTarget } from "./typescript-jump-target.js";
import { TypeScriptListScope } from "./typescript-list-scope.js";

export class TypeScriptParserContext extends ParserContext {
  private recursionDepth: number = 0;
  private readonly rootListScope: TypeScriptListScope = new TypeScriptListScope();
  private listScope: TypeScriptListScope = this.rootListScope;
  private readonly listScopeStack: TypeScriptListScope[] = [];
  private readonly sharedRejectedArrowOffsets: Map<TypeScriptContextFlags, Set<number>> = new Map();

  public contextFlags: TypeScriptContextFlags = TypeScriptContextFlags.None;
  public hasAmbientDeclaration: boolean = false;
  public isNestedStatement: boolean = false;
  public isModuleBody: boolean = false;
  private readonly arrowHeadKindsByFlags: Map<TypeScriptContextFlags, Map<number, TypeScriptArrowHeadKind>> = new Map();
  public hasReportedAmbientStatement: boolean = false;
  public jumpTargets: TypeScriptJumpTarget[] = [];
  public hasNoCheckDirective: boolean = false;
  public isNamespaceBody: boolean = false;
  public isFunctionScope: boolean = false;
  public isNewTargetScope: boolean = false;
  public isMemberInitializer: boolean = false;
  public isSubstatement: boolean = false;
  public isCaseClause: boolean = false;
  public readonly records: TypeScriptDeferredRecords = new TypeScriptDeferredRecords();
  public readonly isDeclaration: boolean;
  public hasReadListBoundary: boolean = false;
  public isClassBodyContext: boolean = false;
  public isAbstractClassBody: boolean = false;
  public hasEnclosingClass: boolean = false;
  public isClassStaticBlock: boolean = false;
  public isTypeMemberContext: boolean = false;
  public readonly unclosedTypeArgumentOffsets: Set<number> = new Set();

  public constructor(source: Source, isDeclaration: boolean = false) {
    super(source);
    this.isDeclaration = isDeclaration;
  }

  public get awaitFlags(): TypeScriptContextFlags {
    return this.contextFlags & (TypeScriptContextFlags.Await | TypeScriptContextFlags.TopLevelAwait);
  }

  public get isAwaitContext(): boolean {
    return this.awaitFlags !== TypeScriptContextFlags.None;
  }

  public get isModuleStatementList(): boolean {
    return !this.isNestedStatement && !this.isSubstatement && !this.isCaseClause;
  }

  public get isSourceTopLevel(): boolean {
    return !this.isFunctionScope && !this.isModuleBody && !this.isMemberInitializer;
  }

  public readJumpTarget(labelNode: Node | undefined, isContinue: boolean): DiagnosticTemplate | undefined {
    const text = labelNode?.getTypeScriptDiagnosticText();
    for (let index = this.jumpTargets.length - 1; index >= 0; index--) {
      const target = this.jumpTargets[index]!;
      if (Object.isUndefined(text)) {
        if (Object.isUndefined(target.labelNode) && (target.isIteration || !isContinue))
          return undefined;
      }
      else if (target.labelNode?.getTypeScriptDiagnosticText() === text)
        return isContinue && !target.isIteration ? TypeScriptDiagnosticTemplates.TS1115 : undefined;
    }
    if (this.isFunctionScope || this.isClassStaticBlock)
      return TypeScriptDiagnosticTemplates.TS1107;
    if (Object.isUndefined(text))
      return isContinue ? TypeScriptDiagnosticTemplates.TS1104 : TypeScriptDiagnosticTemplates.TS1105;
    return isContinue ? TypeScriptDiagnosticTemplates.TS1115 : TypeScriptDiagnosticTemplates.TS1116;
  }

  public get isDecoratorContext(): boolean {
    return (this.contextFlags & TypeScriptContextFlags.Decorator) !== 0;
  }

  public get isDisallowInContext(): boolean {
    return (this.contextFlags & TypeScriptContextFlags.DisallowIn) !== 0;
  }

  public get isAmbient(): boolean {
    return this.isDeclaration || this.hasAmbientDeclaration;
  }

  public get isCommonJsFile(): boolean {
    return (this.source.identity ?? String.empty).toLowerCase().endsWith(Resources.commonJsExtension);
  }

  public get isEsModuleFile(): boolean {
    return (this.source.identity ?? String.empty).toLowerCase().endsWith(Resources.esModuleExtension);
  }

  public get isYieldContext(): boolean {
    return (this.contextFlags & TypeScriptContextFlags.Yield) !== 0;
  }

  public getArrowHeadKinds(): Map<number, TypeScriptArrowHeadKind> {
    let kinds = this.arrowHeadKindsByFlags.get(this.contextFlags);
    if (Object.isUndefined(kinds)) {
      kinds = new Map();
      this.arrowHeadKindsByFlags.set(this.contextFlags, kinds);
    }

    return kinds;
  }

  public getRejectedArrowOffsets(flags: TypeScriptContextFlags): Set<number> {
    return this.getArrowRejections(flags, this.listScope.rejectedArrowOffsetsByContext);
  }

  public getSharedRejectedArrowOffsets(flags: TypeScriptContextFlags): Set<number> {
    return this.getArrowRejections(flags, this.sharedRejectedArrowOffsets);
  }

  private getArrowRejections(flags: TypeScriptContextFlags, cache: Map<TypeScriptContextFlags, Set<number>>): Set<number> {
    flags = this.getCacheFlags(flags);
    let offsets = cache.get(flags);
    if (Object.isUndefined(offsets)) {
      offsets = new Set();
      cache.set(flags, offsets);
    }

    return offsets;
  }

  public clearRecognitionCaches(): void {
    this.arrowHeadKindsByFlags.clear();
    for (const offsets of this.sharedRejectedArrowOffsets.values())
      offsets.clear();
    const scopes = [this.rootListScope];
    while (scopes.length > 0) {
      const scope = scopes.pop()!;
      for (const offsets of scope.rejectedArrowOffsetsByContext.values())
        offsets.clear();
      for (const nested of scope.nestedScopes.values())
        scopes.push(nested);
      scope.nestedScopes.clear();
    }
    this.unclosedTypeArgumentOffsets.clear();
  }

  public enterList(kind: TypeScriptListKind): void {
    this.listScopeStack.push(this.listScope);
    for (let current: TypeScriptListScope | undefined = this.listScope; !Object.isUndefined(current); current = current.parent)
      if (current.kind === kind)
        return;
    let scope = this.listScope.nestedScopes.get(kind);
    if (Object.isUndefined(scope)) {
      scope = new TypeScriptListScope(this.listScope, kind);
      this.listScope.nestedScopes.set(kind, scope);
    }
    this.listScope = scope;
  }

  public leaveList(): void {
    this.listScope = this.listScopeStack.pop()!;
  }

  public isListBoundary(parser: TypeScriptSyntaxParser): boolean {
    this.hasReadListBoundary = true;
    const node = parser.currentNode;
    for (let scope: TypeScriptListScope | undefined = this.listScope; !Object.isUndefined(scope); scope = scope.parent)
      if (!Object.isUndefined(scope.kind) && (node.isTypeScriptListElement(scope.kind, parser) || node.isTypeScriptListTerminator(scope.kind, parser)))
        return true;
    return false;
  }

  public enterRecursion(span: SourceSpan): void {
    if (this.recursionDepth >= Resources.maximumRecursionDepth)
      throw new TypeScriptRecursionLimitException(span);

    this.recursionDepth++;
  }

  public leaveRecursion(): void {
    this.recursionDepth--;
  }

  private getCacheFlags(flags: TypeScriptContextFlags): TypeScriptContextFlags {
    return this.isClassBodyContext ? flags | TypeScriptContextFlags.ClassBodyRecovery : flags;
  }
}
