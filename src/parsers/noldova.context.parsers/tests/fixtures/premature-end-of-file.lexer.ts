/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type DiagnosticCollector, EndOfFileNode, Lexer, type Node, type Source } from "@noldova/context.parsers";

export class PrematureEndOfFileLexer extends Lexer {
  public constructor(source: Source, diagnosticCollector: DiagnosticCollector) {
    super(source, diagnosticCollector);
  }

  protected override lexNode(): Node {
    return new EndOfFileNode(this.reader.createSpan(this.reader.currentOffset, 0));
  }
}
