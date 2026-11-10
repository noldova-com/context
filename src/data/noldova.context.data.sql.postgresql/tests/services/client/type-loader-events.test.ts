/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
import { TypeLoaderEvents } from "@noldova/context.data.sql.postgresql/services/client/type-loader-events.js";
import { TypeRegistry } from "@noldova/context.data.sql.postgresql/models/type-registry.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { FakeEvents } from "../../fixtures/fake-events.fixture.js";

@TestClass
export class TypeLoaderEventsTests {
  @TestMethod
  public delegatesTypesAndNotifications(): void {
    const inner = new FakeEvents(new ClientOptions());
    const events = new TypeLoaderEvents(inner);
    inner.isTyped = false;
    inner.unknownTypes = true;

    Assert.isFalse(events.typed);
    Assert.isTrue(events.plain);
    Assert.isTrue(events.findParser(23) === inner.registry.findParser(23));
    Assert.isTrue(events.findSerializer(16) === inner.registry.findSerializer(16));
    Assert.isTrue(events.findDecoder(23, TypeRegistry.number) === inner.registry.findDecoder(23, TypeRegistry.number));
    Assert.isTrue(events.findBinaryDecoder(1007) === inner.registry.findBinaryDecoder(1007));
    Assert.isTrue(events.hasUnknownTypes([16400]));
    events.onNotify("jobs", "1", 3);
    Assert.areEqual("jobs:1:3", inner.notifications.join());
    const cancel = Promise.resolve();
    events.onCancelling(cancel);
    Assert.areEqual(1, inner.cancelled.length);
    Assert.isTrue(inner.cancelled[0] === cancel);
    Assert.isTrue(events.cancels === inner.cancels);
  }

  @TestMethod
  public ignoresTheConnectionsLifecycle(): void {
    const inner = new FakeEvents(new ClientOptions());
    const events = new TypeLoaderEvents(inner);

    events.requestTypes();
    events.onReady();
    events.onClose();
    events.onParameter();
    events.onTimed();

    Assert.areEqual(0, inner.needed.length);
    Assert.areEqual(0, inner.ready);
    Assert.areEqual(0, inner.closes.length);
    Assert.areEqual(0, inner.parameters.length);
    Assert.areEqual(0, inner.timed.length);
  }
}
