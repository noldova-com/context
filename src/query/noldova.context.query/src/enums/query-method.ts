/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum QueryMethod {
  Any = "any",
  Count = "count",
  First = "first",
  FirstOrDefault = "firstOrDefault",
  OrderBy = "orderBy",
  OrderByDescending = "orderByDescending",
  Select = "select",
  Single = "single",
  SingleOrDefault = "singleOrDefault",
  Skip = "skip",
  Take = "take",
  ThenBy = "thenBy",
  ThenByDescending = "thenByDescending",
  ToArray = "toArray",
  Where = "where"
}
