/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Diagnostic, DiagnosticRelatedInformation } from "@noldova/context.diagnostics";

import { ComparedMessage } from "./compared-message.js";
import type { ConformanceCaseUnit } from "./conformance-case-unit.js";
import type { ExpectedDiagnostic } from "./expected-diagnostic.js";
import type { JsonObject } from "./json-object.js";

export class ComparedDiagnostic {
  private static readonly RELATED_SEPARATOR: string = " related ";
  private static readonly TAG_SEPARATOR: string = ",";

  public readonly unit: string | undefined;
  public readonly start: number | undefined;
  public readonly length: number | undefined;
  public readonly message: ComparedMessage;
  public readonly related: readonly ComparedDiagnostic[];
  public readonly tags: readonly string[];

  public constructor(unit: string | undefined, start: number | undefined, length: number | undefined, message: ComparedMessage,
    related: readonly ComparedDiagnostic[], tags: readonly string[]) {
    this.unit = unit;
    this.start = start;
    this.length = length;
    this.message = message;
    this.related = related;
    this.tags = tags;
  }

  public get key(): string {
    return JSON.stringify(this);
  }

  public get keyWithoutRelated(): string {
    return this.withRelated([]).key;
  }

  public static fromExpected(diagnostic: ExpectedDiagnostic, units: readonly ConformanceCaseUnit[]): ComparedDiagnostic {
    const unit = typeof diagnostic.file === "number" ? units[diagnostic.file]!.name : diagnostic.file;
    return new ComparedDiagnostic(unit, diagnostic.start, diagnostic.length, ComparedMessage.fromExpected(diagnostic),
      diagnostic.related.map(t => ComparedDiagnostic.fromExpected(t, units)), diagnostic.tags);
  }

  public static fromReported(diagnostic: Diagnostic): ComparedDiagnostic {
    return new ComparedDiagnostic(diagnostic.location?.sourceIdentity, diagnostic.location?.start, diagnostic.location?.length,
      ComparedMessage.fromReported(diagnostic.message), diagnostic.relatedInformation.map(t => ComparedDiagnostic.fromRelated(t)),
      diagnostic.tags.map(t => t.toLowerCase()));
  }

  public static from(object: JsonObject): ComparedDiagnostic {
    return new ComparedDiagnostic(object.optionalString("unit"), object.optionalNumber("start"), object.optionalNumber("length"),
      ComparedMessage.from(object.object("message")), object.objects("related").map(t => ComparedDiagnostic.from(t)), object.strings("tags"));
  }

  public static compare(left: ComparedDiagnostic, right: ComparedDiagnostic): number {
    return ComparedDiagnostic.compareText(left.unit ?? String.empty, right.unit ?? String.empty)
      || (left.start ?? 0) - (right.start ?? 0)
      || (left.length ?? 0) - (right.length ?? 0)
      || left.message.code - right.message.code
      || ComparedDiagnostic.compareText(left.message.text, right.message.text)
      || ComparedDiagnostic.compareText(left.keyWithoutRelated, right.keyWithoutRelated)
      || ComparedDiagnostic.compareText(left.key, right.key);
  }

  public withRelated(related: readonly ComparedDiagnostic[]): ComparedDiagnostic {
    return new ComparedDiagnostic(this.unit, this.start, this.length, this.message, related, this.tags);
  }

  public describe(): string {
    const tags = this.tags.length === 0 ? String.empty : ` [${this.tags.join(ComparedDiagnostic.TAG_SEPARATOR)}]`;
    return [`${this.unit}@${this.start}+${this.length} ${this.message.describe()}${tags}`, ...this.related.map(t => t.describe())]
      .join(ComparedDiagnostic.RELATED_SEPARATOR);
  }

  private static fromRelated(related: DiagnosticRelatedInformation): ComparedDiagnostic {
    return new ComparedDiagnostic(related.location?.sourceIdentity, related.location?.start, related.location?.length,
      ComparedMessage.fromReported(related.message), [], []);
  }

  private static compareText(left: string, right: string): number {
    return left < right ? -1 : left > right ? 1 : 0;
  }
}
