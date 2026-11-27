/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Owner {
  public id: number = 0;
  public name: string = "";
  public notes: Note[] = [];
}

export class Note {
  public id: number = 0;
  public title: string | null = null;
  public text: string | null = null;
  public rank: number = 0;
  public ownerId: number | null = null;
  public owner: Owner | null = null;
}
