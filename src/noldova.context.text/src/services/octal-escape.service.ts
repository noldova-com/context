/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";

export class OctalEscapeService {
  public static decode(text: string): string {
    return text.replace(Resources.octalEscape, (_, code: string) => String.fromCharCode(Number.parseInt(code, Resources.octalRadix)));
  }
}
