/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceLineMap } from "@noldova/context.parsers";
import { EcmaScriptLineTerminator } from "@noldova/context.text";

export class SourceText {
  public readonly path: string;
  public readonly source: Source;
  public readonly lines: SourceLineMap;

  protected constructor(path: string, source: Source) {
    this.path = path;
    this.source = source;
    this.lines = new SourceLineMap(source, new EcmaScriptLineTerminator());
  }

  public static of(path: string, text: string): SourceText {
    return new SourceText(path, new Source(text, path));
  }
}
