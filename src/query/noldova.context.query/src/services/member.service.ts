/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";

export class MemberService {
  public static read(target: unknown, name: string): unknown {
    if (Object.isNullOrUndefined(target))
      throw new TypeError(Resources.memberOfNullOrUndefined);

    return Reflect.get(Object(target), name, target);
  }

  public static call(target: unknown, method: unknown, values: readonly unknown[]): unknown {
    if (!Object.isFunction(method))
      throw new TypeError(Resources.methodNotFunction);

    return Reflect.apply(method, target, values);
  }
}
