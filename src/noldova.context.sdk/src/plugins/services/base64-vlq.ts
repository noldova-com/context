/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Enumerable, type IReadOnlyList, List } from "@noldova/context.collections";
import { StringBuilder } from "@noldova/context.text";

import { SourceMapping } from "../models/source-mapping.js";
import { PluginResources } from "../plugin-resources.js";

export class Base64Vlq {
  public static decode(mappings: string): IReadOnlyList<IReadOnlyList<SourceMapping>> {
    let sourceIndex = 0;
    let line = 0;
    let character = 0;
    let nameIndex = 0;

    return Enumerable.from(mappings.split(PluginResources.mappingLineSeparator)).select(text => {
      let column = 0;

      return Enumerable.from(text.split(PluginResources.mappingSegmentSeparator)).where(t => t !== "").select(segment => {
        const values = Base64Vlq.decodeValues(segment);
        const [columnDelta = 0, sourceDelta = 0, lineDelta = 0, characterDelta = 0, nameDelta = 0] = values;
        column += columnDelta;
        sourceIndex += sourceDelta;
        line += lineDelta;
        character += characterDelta;
        nameIndex += nameDelta;

        return new SourceMapping(column, sourceIndex, line, character, nameIndex, values.count());
      }).toList();
    }).toList();
  }

  public static encode(lines: IReadOnlyList<IReadOnlyList<SourceMapping>>): string {
    let sourceIndex = 0;
    let line = 0;
    let character = 0;
    let nameIndex = 0;

    return lines.select(mappings => {
      let column = 0;

      return mappings.select(t => {
        const deltas = Enumerable.from([t.column - column, t.sourceIndex - sourceIndex, t.line - line, t.character - character, t.nameIndex - nameIndex]).take(t.fieldCount).toList();
        column = t.column;
        if (t.hasSource) {
          sourceIndex = t.sourceIndex;
          line = t.line;
          character = t.character;
        }
        if (t.fieldCount > 4)
          nameIndex = t.nameIndex;

        return deltas.select(value => Base64Vlq.encodeValue(value)).toArray().join("");
      }).toArray().join(PluginResources.mappingSegmentSeparator);
    }).toArray().join(PluginResources.mappingLineSeparator);
  }

  private static decodeValues(segment: string): IReadOnlyList<number> {
    const values = new List<number>();
    let value = 0;
    let shift = 0;
    for (const character of segment) {
      const digit = PluginResources.base64Digits.indexOf(character);
      value += (digit & PluginResources.vlqValueMask) << shift;
      shift += PluginResources.vlqShift;
      if ((digit & PluginResources.vlqContinuationBit) === 0) {
        values.add((value & 1) === 1 ? -(value >>> 1) : value >>> 1);
        value = 0;
        shift = 0;
      }
    }

    return values;
  }

  private static encodeValue(value: number): string {
    let remaining = value < 0 ? (-value << 1) | 1 : value << 1;
    const text = new StringBuilder();
    do {
      const digit = remaining & PluginResources.vlqValueMask;
      remaining >>>= PluginResources.vlqShift;
      text.append(PluginResources.base64Digits.charAt(remaining > 0 ? digit | PluginResources.vlqContinuationBit : digit));
    } while (remaining > 0);

    return text.toString();
  }
}
