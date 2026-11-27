/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Writer } from "./writer.fixture.js";

export class Book {
  public id: number = 0;
  public title: string = "";
  public writerId: number = 0;
  public writer: Writer | null = null;
}
