/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";

import { TypedParameter } from "../../models/typed-parameter.js";
import { Resources } from "../../resources.js";
import type { ValueSerializer } from "../../types/value-serializer.js";

export class ArraySerializer {
  public static serialize(values: readonly unknown[], serialize: ValueSerializer, delimiter: string = Resources.arrayDelimiter, undefinedValue: unknown = undefined): string {
    const items = values.map(item => ArraySerializer.serializeItem(item, serialize, delimiter, undefinedValue));
    return Resources.arrayStart + items.join(delimiter) + Resources.arrayEnd;
  }

  private static serializeItem(item: unknown, serialize: ValueSerializer, delimiter: string, undefinedValue: unknown): string {
    const typed = item instanceof TypedParameter;
    let value = typed ? item.value : item;
    if (Object.isUndefined(value)) {
      value = undefinedValue;
      if (Object.isUndefined(value))
        throw new DataException(Resources.undefinedValue);
    }

    if (Array.isArray(value) && !typed)
      return ArraySerializer.serialize(value, serialize, delimiter, undefinedValue);
    if (Object.isNull(value))
      return Resources.nullLiteral;

    const text = String(serialize(value))
      .replaceAll(Resources.stringEscape, Resources.escapedBackslash)
      .replaceAll(Resources.identifierQuote, Resources.escapedQuote);
    return Resources.identifierQuote + text + Resources.identifierQuote;
  }
}
