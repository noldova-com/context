/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class BinarySearchService {
  public static floorIndex(values: readonly number[], target: number): number {
    let lowerIndex = 0;
    let upperIndex = values.length - 1;

    while (lowerIndex <= upperIndex) {
      const middleIndex = lowerIndex + ((upperIndex - lowerIndex) >>> 1);
      if (values[middleIndex]! <= target)
        lowerIndex = middleIndex + 1;
      else
        upperIndex = middleIndex - 1;
    }

    return upperIndex;
  }
}
