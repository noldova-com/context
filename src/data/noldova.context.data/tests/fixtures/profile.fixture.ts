/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Author } from "./author.fixture.js";

export class Profile {
  public profileId: number = 0;
  public authorId: number = 0;
  public author: Author | null = null;
}
