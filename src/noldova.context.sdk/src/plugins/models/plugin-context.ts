/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";
import type { Diagnostic } from "@noldova/context.diagnostics";
import type { SourceSpan } from "@noldova/context.parsers";

import type { Declaration } from "./declaration.js";
import type { SourceFile } from "./source-file.js";
import type { SourceOrigin } from "./source-origin.js";

export abstract class PluginContext {
  public abstract readonly projectName: string;
  public abstract readonly sources: IReadOnlyList<SourceFile>;

  public abstract resolve(source: SourceFile, name: string): Declaration | undefined;
  public abstract replace(source: SourceFile, span: SourceSpan, text: string): void;
  public abstract addFile(path: string, text: string, origin: SourceOrigin): void;
  public abstract report(diagnostic: Diagnostic): void;
}
