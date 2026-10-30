/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticMessage } from "@noldova/context.diagnostics";

import type { ExpectedDiagnostic } from "./expected-diagnostic.js";
import type { JsonObject } from "./json-object.js";

export class ComparedMessage {
  private static readonly CHAIN_SEPARATOR: string = " > ";

  public readonly code: number;
  public readonly category: string;
  public readonly text: string;
  public readonly chain: readonly ComparedMessage[];

  public constructor(code: number, category: string, text: string, chain: readonly ComparedMessage[]) {
    this.code = code;
    this.category = category;
    this.text = text;
    this.chain = chain;
  }

  public static fromExpected(diagnostic: ExpectedDiagnostic): ComparedMessage {
    return new ComparedMessage(diagnostic.code, diagnostic.category, diagnostic.text, diagnostic.chain.map(t => ComparedMessage.fromExpected(t)));
  }

  public static fromReported(message: DiagnosticMessage): ComparedMessage {
    return new ComparedMessage(message.code.value, message.category.toLowerCase(), message.text, message.children.map(t => ComparedMessage.fromReported(t)));
  }

  public static from(object: JsonObject): ComparedMessage {
    return new ComparedMessage(object.number("code"), object.string("category"), object.string("text"),
      object.objects("chain").map(t => ComparedMessage.from(t)));
  }

  public describe(): string {
    return [`TS${this.code} ${this.category}: ${this.text}`, ...this.chain.map(t => t.describe())].join(ComparedMessage.CHAIN_SEPARATOR);
  }
}
