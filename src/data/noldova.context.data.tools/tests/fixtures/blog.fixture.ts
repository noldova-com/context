/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Author {
  public id: number = 0;
  public name: string | null = null;
  public posts: Post[] = [];
}

export class Post {
  public id: number = 0;
  public authorId: number = 0;
  public author: Author | null = null;
}
