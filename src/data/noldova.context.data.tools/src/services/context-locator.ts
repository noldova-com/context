/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import "@noldova/context.core";

import { DataToolsException } from "../exceptions/data-tools.exception.js";
import type { SourceClass } from "../models/sources/source-class.js";
import { Resources } from "../resources.js";

export class ContextLocator {
  public static locate(classes: readonly SourceClass[], name: string | null): SourceClass {
    const sources = new List(classes);
    const contexts = sources.where(t => ContextLocator.isContext(sources, t, new Set())).toList();
    const named = Object.isNull(name) ? contexts : contexts.where(t => t.name === name).toList();
    if (named.count() === 1)
      return named.get(0);
    if (named.count() > 1)
      throw new DataToolsException(Resources.formatContextAmbiguous(named.select(t => `${t.name} (${t.filePath})`).toArray()));

    throw new DataToolsException(Object.isNull(name) ? Resources.contextMissing : Resources.formatContextNotFound(name));
  }

  private static isContext(sources: List<SourceClass>, sourceClass: SourceClass, seen: Set<SourceClass>): boolean {
    if (sourceClass.baseName === Resources.contextBaseName)
      return true;

    seen.add(sourceClass);
    const bases = sources.where(t => t.name === sourceClass.baseName).toList();

    return bases.count() === 1 && !seen.has(bases.get(0)) && ContextLocator.isContext(sources, bases.get(0), seen);
  }
}
