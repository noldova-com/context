/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceReader } from "@noldova/context.parsers";

export class TypeScriptSourceReaderProbe extends SourceReader {
  public operationCount: number = 0;

  public override seek(offset: number): void {
    this.operationCount++;
    super.seek(offset);
  }

  public override advance(count: number = 1): void {
    this.operationCount++;
    super.advance(count);
  }

  public override readCodeUnit(): string {
    this.operationCount++;
    return super.readCodeUnit();
  }

  public override readCodePoint(): number {
    this.operationCount++;
    return super.readCodePoint();
  }
}
