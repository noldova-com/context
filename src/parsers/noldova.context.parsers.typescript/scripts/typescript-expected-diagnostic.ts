/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Diagnostic, DiagnosticCategory } from "typescript/unstable/sync";

import type TypeScriptReferenceIdentity from "./typescript-reference-identity.ts";

export default class TypeScriptExpectedDiagnostic {
  private static readonly CATEGORY_NAMES: ReadonlyMap<DiagnosticCategory, string> = new Map<DiagnosticCategory, string>([
    [DiagnosticCategory.Warning, "warning"],
    [DiagnosticCategory.Error, "error"],
    [DiagnosticCategory.Suggestion, "suggestion"],
    [DiagnosticCategory.Message, "message"],
  ]);
  private static readonly DEPRECATED_TAG: string = "deprecated";
  private static readonly UNNECESSARY_TAG: string = "unnecessary";

  public readonly code: number;
  public readonly category: string;
  public readonly file: number | string | undefined;
  public readonly start: number | undefined;
  public readonly length: number | undefined;
  public readonly text: string;
  public readonly tags: readonly string[] | undefined;
  public readonly chain: readonly TypeScriptExpectedDiagnostic[] | undefined;
  public readonly related: readonly TypeScriptExpectedDiagnostic[] | undefined;

  private constructor(diagnostic: Diagnostic, identity: TypeScriptReferenceIdentity, isLocated: boolean) {
    this.code = diagnostic.code;
    this.category = TypeScriptExpectedDiagnostic.categoryName(diagnostic.category);
    this.text = identity.ofText(diagnostic.text);

    if (isLocated && diagnostic.fileName !== undefined) {
      this.file = identity.ofFile(diagnostic.fileName);
      this.start = diagnostic.pos;
      this.length = diagnostic.end - diagnostic.pos;
    }

    const tags: string[] = [];
    if (diagnostic.reportsUnnecessary === true)
      tags.push(TypeScriptExpectedDiagnostic.UNNECESSARY_TAG);
    if (diagnostic.reportsDeprecated === true)
      tags.push(TypeScriptExpectedDiagnostic.DEPRECATED_TAG);
    if (tags.length !== 0)
      this.tags = tags;

    if (diagnostic.messageChain !== undefined && diagnostic.messageChain.length !== 0)
      this.chain = diagnostic.messageChain.map(t => TypeScriptExpectedDiagnostic.chainNode(diagnostic, t, identity));
    if (diagnostic.relatedInformation !== undefined && diagnostic.relatedInformation.length !== 0)
      this.related = diagnostic.relatedInformation.map(t => new TypeScriptExpectedDiagnostic(t, identity, true));
  }

  public static record(diagnostic: Diagnostic, identity: TypeScriptReferenceIdentity): TypeScriptExpectedDiagnostic {
    return new TypeScriptExpectedDiagnostic(diagnostic, identity, true);
  }

  private static chainNode(parent: Diagnostic, node: Diagnostic, identity: TypeScriptReferenceIdentity): TypeScriptExpectedDiagnostic {
    if (node.fileName !== undefined && (node.fileName !== parent.fileName || node.pos !== parent.pos || node.end !== parent.end))
      throw new Error(TypeScriptExpectedDiagnostic.chainNodeLocated(parent.code, node.code));

    return new TypeScriptExpectedDiagnostic(node, identity, false);
  }

  private static categoryName(category: DiagnosticCategory): string {
    const name = TypeScriptExpectedDiagnostic.CATEGORY_NAMES.get(category);
    if (name === undefined)
      throw new Error(TypeScriptExpectedDiagnostic.categoryUnknown(category));

    return name;
  }

  private static categoryUnknown(category: DiagnosticCategory): string {
    return `The reference reported a diagnostic category ${category} the expected diagnostics do not name.`;
  }

  private static chainNodeLocated(parentCode: number, nodeCode: number): string {
    return `A chain node TS${nodeCode} of TS${parentCode} carries a location its parent does not.`;
  }
}
