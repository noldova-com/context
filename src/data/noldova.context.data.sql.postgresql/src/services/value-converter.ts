/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataException, type DataValue } from "@noldova/context.data";

import { Resources } from "../resources.js";

export class ValueConverter {
  private static readonly bigint: number = 20;
  private static readonly numbers: ReadonlySet<number> = new Set([21, 23, 26, 700, 701]);

  public static read(type: number, text: string | null): DataValue {
    if (Object.isNull(text))
      return null;
    if (ValueConverter.numbers.has(type))
      return Number(text);
    if (type !== ValueConverter.bigint)
      return text;

    const value = Number(text);
    if (!Number.isSafeInteger(value))
      throw new DataException(Resources.unsafeInteger);

    return value;
  }

  public static write(value: DataValue): string | null {
    return Object.isNull(value) || Object.isString(value) ? value : value.toString();
  }
}
