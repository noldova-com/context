/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { Plugin } from "@noldova/context.sdk/plugins/models/plugin.js";
import type { PluginContext } from "@noldova/context.sdk/plugins/models/plugin-context.js";
import type { SourceFile } from "@noldova/context.sdk/plugins/models/source-file.js";

export class TestPlugin extends Plugin {
  public static readonly packageIdentity: string = "noldova.context.plugintest";

  public override readonly name: string;
  public override readonly packageName: string;
  public runs: number = 0;

  private readonly action: (context: PluginContext) => void;

  public constructor(name: string, action: (context: PluginContext) => void, packageName: string = TestPlugin.packageIdentity) {
    super();
    this.name = name;
    this.packageName = packageName;
    this.action = action;
  }

  public static replacing(text: string, replacement: string, name: string = "replacer"): TestPlugin {
    return new TestPlugin(name, context => {
      for (const source of context.sources.where(t => t.source.content.includes(text)))
        context.replace(source, TestPlugin.spanOf(source, text), replacement);
    });
  }

  public static spanOf(source: SourceFile, text: string): SourceSpan {
    return new SourceSpan(source.source.content.indexOf(text), text.length);
  }

  public override run(context: PluginContext): void {
    this.runs++;
    this.action(context);
  }
}
