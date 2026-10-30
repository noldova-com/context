/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticCollector } from "./diagnostic-collector.js";
import type { Source } from "./sources/source.js";

export class ParserContext {
  public readonly diagnosticCollector: DiagnosticCollector;
  public readonly source: Source;

  public constructor(source: Source) {
    this.diagnosticCollector = new DiagnosticCollector(source);
    this.source = source;
  }
}
