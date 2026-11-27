/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module "@noldova/context.sdk/services/project-graph.reader.js" {
  import type { Project } from "@noldova/context";

  export class ProjectGraphReader {
    public static readAsync(manifestPath: string): Promise<readonly Project[]>;
  }
}
