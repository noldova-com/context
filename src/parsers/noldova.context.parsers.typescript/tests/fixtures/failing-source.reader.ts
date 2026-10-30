/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ParserException, Source, SourceReader } from "@noldova/context.parsers";

export class FailingSourceReader extends SourceReader {
  public readonly failure: ParserException = new ParserException("Reader failure.");
  private readonly rewindsBeforeFailing: number;
  private rewindCount: number = 0;

  public constructor(content: string, rewindsBeforeFailing: number) {
    super(new Source(content));
    this.rewindsBeforeFailing = rewindsBeforeFailing;
  }

  public override seek(offset: number): void {
    if (offset === this.startOffset && this.currentOffset === this.endOffset)
      this.rewindCount++;
    if (this.rewindCount >= this.rewindsBeforeFailing && offset > this.startOffset && offset < this.endOffset)
      throw this.failure;
    super.seek(offset);
  }
}
