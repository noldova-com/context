/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { BinaryOperator } from "@noldova/context.query.expressions";

export type ShortCircuitOperator = BinaryOperator.And | BinaryOperator.Or | BinaryOperator.Coalesce;
