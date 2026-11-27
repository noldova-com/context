/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Author } from "./author.fixture.js";
import type { Tag } from "./tag.fixture.js";

export class Post {
  public id: number = 0;
  public title: string = "";
  public body: string | null = null;
  public authorId: number = 0;
  public author: Author | null = null;
  public tags: Tag[] = [];
}
