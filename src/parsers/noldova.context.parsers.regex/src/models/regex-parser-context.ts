/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ParserContext, type SourceSpan } from "@noldova/context.parsers";

import { RegexNamedGroupRegistry } from "../services/regex-named-group-registry.js";
import { RegexDiagnosticTemplates } from "./diagnostics/regex-diagnostic-templates.js";
import { RegexAlternativeBranch } from "./regex-alternative-branch.js";

export class RegexParserContext extends ParserContext {
  private readonly currentAlternativeBranches: RegexAlternativeBranch[] = [];
  private readonly namedGroupRegistry: RegexNamedGroupRegistry = new RegexNamedGroupRegistry();
  private nextCapturingGroupIndex: number = 1;
  private nextDisjunctionIndex: number = 0;

  public nestingDepth: number = 0;
  public readonly diagnosedReservedPunctuatorOffsets: Set<number> = new Set();

  public claimCapturingGroupIndex(): number {
    const index = this.nextCapturingGroupIndex;
    this.nextCapturingGroupIndex++;
    return index;
  }

  public beginDisjunction(): number {
    const index = this.nextDisjunctionIndex;
    this.nextDisjunctionIndex++;
    return index;
  }

  public enterAlternative(disjunctionIndex: number, alternativeIndex: number): void {
    this.currentAlternativeBranches.push(new RegexAlternativeBranch(disjunctionIndex, alternativeIndex));
  }

  public leaveAlternative(): void {
    this.currentAlternativeBranches.pop();
  }

  public registerNamedCapturingGroup(groupName: string, span: SourceSpan): void {
    if (this.namedGroupRegistry.hasConflict(groupName, this.currentAlternativeBranches))
      this.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1024, span, [groupName]);

    this.namedGroupRegistry.add(groupName, this.currentAlternativeBranches);
  }
}
