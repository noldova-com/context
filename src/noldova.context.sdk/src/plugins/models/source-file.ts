/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceLineMap } from "@noldova/context.parsers";
import { type TypeScriptNode, TypeScriptParser, type TypeScriptSourceKind } from "@noldova/context.parsers.typescript";
import { EcmaScriptLineTerminator } from "@noldova/context.text";

export class SourceFile {
  public readonly path: string;
  public readonly source: Source;
  public readonly lines: SourceLineMap;
  public readonly rootNode: TypeScriptNode;

  private constructor(path: string, source: Source, sourceKind: TypeScriptSourceKind) {
    this.path = path;
    this.source = source;
    this.lines = new SourceLineMap(source, new EcmaScriptLineTerminator());
    this.rootNode = new TypeScriptParser(source, sourceKind).parse().rootNode;
  }

  public static parse(path: string, text: string, sourceKind: TypeScriptSourceKind): SourceFile {
    return new SourceFile(path, new Source(text, path), sourceKind);
  }
}
