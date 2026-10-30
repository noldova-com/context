/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ParserException } from "../exceptions/parser.exception.js";
import { EndOfFileNode } from "../models/nodes/end-of-file.node.js";
import type { Node } from "../models/nodes/node.js";
import type { Source } from "../models/sources/source.js";
import { Resources } from "../resources.js";
import type { DiagnosticCollector } from "../models/diagnostic-collector.js";
import { SourceReader } from "./source.reader.js";

export abstract class Lexer {
  public readonly diagnosticCollector: DiagnosticCollector;
  public readonly reader: SourceReader;

  protected constructor(sourceOrReader: Source | SourceReader, diagnosticCollector: DiagnosticCollector) {
    this.reader = sourceOrReader instanceof SourceReader ? sourceOrReader : new SourceReader(sourceOrReader);
    this.diagnosticCollector = diagnosticCollector;
  }

  public lex(): Node {
    return this.lexWith(() => this.lexNode());
  }

  protected abstract lexNode(): Node;

  protected lexWith(action: () => Node): Node {
    const reader = this.reader;
    const startOffset = reader.currentOffset;
    const node = action();

    if (node instanceof EndOfFileNode) {
      if (!reader.isAtEnd || node.span.startOffset !== reader.currentOffset)
        throw new ParserException(Resources.lexerEndOfFileInvalid);
    }
    else if (reader.currentOffset <= startOffset) {
      if (!reader.isAtEnd)
        throw new ParserException(Resources.lexerDidNotAdvance(startOffset));

      throw new ParserException(Resources.lexerEndOfFileRequired);
    }

    return node;
  }
}
