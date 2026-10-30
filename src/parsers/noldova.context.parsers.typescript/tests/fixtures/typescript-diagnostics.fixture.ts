/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Diagnostic } from "@noldova/context.diagnostics";
import { TypeScriptParser } from "@noldova/context.parsers.typescript";

export class TypeScriptDiagnosticsFixture {
  private static readonly SEPARATOR: string = "|";
  private static readonly TEXT_SEPARATOR: string = ",";

  public static parse(content: string): string {
    return TypeScriptDiagnosticsFixture.project(TypeScriptParser.parse(content).diagnostics);
  }

  public static project(diagnostics: readonly Diagnostic[]): string {
    return diagnostics.map(t => TypeScriptDiagnosticsFixture.position(t)).join(TypeScriptDiagnosticsFixture.SEPARATOR);
  }

  public static projectText(content: string, diagnostics: readonly Diagnostic[]): string {
    return diagnostics.map(t => `${t.code.displayText}:${TypeScriptDiagnosticsFixture.text(content, t)}`).join(TypeScriptDiagnosticsFixture.TEXT_SEPARATOR);
  }

  public static projectTextWithMessages(content: string, diagnostics: readonly Diagnostic[]): string {
    return diagnostics.map(t => `${t.code.displayText}:${TypeScriptDiagnosticsFixture.text(content, t)} ${t.message.text}`)
      .join(TypeScriptDiagnosticsFixture.TEXT_SEPARATOR);
  }

  public static projectWithRelated(diagnostics: readonly Diagnostic[]): string {
    return diagnostics.map(t => TypeScriptDiagnosticsFixture.position(t)
      + t.relatedInformation.map(related => `{${related.message.text}@${related.location!.start}}`).join(String.empty))
      .join(TypeScriptDiagnosticsFixture.SEPARATOR);
  }

  public static projectWithMessages(diagnostics: readonly Diagnostic[]): string {
    return diagnostics.map(t => `${TypeScriptDiagnosticsFixture.position(t)} ${t.message.text}`).join(TypeScriptDiagnosticsFixture.SEPARATOR);
  }

  private static position(diagnostic: Diagnostic): string {
    return `${diagnostic.code.displayText}@${diagnostic.location!.start}:${diagnostic.location!.length}`;
  }

  private static text(content: string, diagnostic: Diagnostic): string {
    const location = diagnostic.location!;
    return content.slice(location.start, location.start + location.length);
  }
}
