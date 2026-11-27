/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source } from "@noldova/context.parsers";
import { type TypeScriptNode, TypeScriptParser, type TypeScriptSourceKind } from "@noldova/context.parsers.typescript";

import { SourceText } from "./source-text.js";

export class SourceFile extends SourceText {
  public readonly rootNode: TypeScriptNode;

  private constructor(path: string, source: Source, sourceKind: TypeScriptSourceKind) {
    super(path, source);
    this.rootNode = new TypeScriptParser(source, sourceKind).parse().rootNode;
  }

  public static parse(path: string, text: string, sourceKind: TypeScriptSourceKind): SourceFile {
    return new SourceFile(path, new Source(text, path), sourceKind);
  }
}
