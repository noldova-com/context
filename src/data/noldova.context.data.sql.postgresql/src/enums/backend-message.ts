/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum BackendMessage {
  Authentication = 82,
  BackendKeyData = 75,
  BindComplete = 50,
  CloseComplete = 51,
  CommandComplete = 67,
  CopyBothResponse = 87,
  CopyData = 100,
  CopyDone = 99,
  CopyInResponse = 71,
  CopyOutResponse = 72,
  DataRow = 68,
  EmptyQueryResponse = 73,
  ErrorResponse = 69,
  FunctionCallResponse = 86,
  NegotiateProtocolVersion = 118,
  NoData = 110,
  NoticeResponse = 78,
  NotificationResponse = 65,
  ParameterDescription = 116,
  ParameterStatus = 83,
  ParseComplete = 49,
  PortalSuspended = 115,
  ReadyForQuery = 90,
  RowDescription = 84
}
