/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Owner {
  public code: string = "";
  public name: string = "";
}

export class Note {
  public id: number = 0;
  public title: string | null = null;
  public text: string | null = null;
  public rank: number = 0;
}
