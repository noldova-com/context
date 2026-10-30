/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LineTerminator } from "@noldova/context.text";

export class LineFeedLineTerminator extends LineTerminator {
  public override getLength(value: string, index: number): 0 | 1 {
    return value.charAt(index) === "\n" ? 1 : 0;
  }

  public override isLineTerminator(character: string): boolean {
    return character === "\n";
  }
}
