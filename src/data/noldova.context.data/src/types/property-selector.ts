/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NameofSelector } from "@noldova/context.core";

export type PropertySelector<TEntity> = (t: NameofSelector<TEntity>) => keyof TEntity & string;
