/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Post } from "./post.fixture.js";
import type { Profile } from "./profile.fixture.js";

export class Author {
  public id: number = 0;
  public name: string = "";
  public posts: Post[] = [];
  public profile: Profile | null = null;
}
