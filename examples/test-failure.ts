import { socketFactory, runMain, waitFor } from "./config"
import {
  EoswsClient,
  InboundMessageType,
  InboundMessage,
  createEoswsSocket,
  TableDeltaData,
  ActionTraceData,
  ListeningData,
  ErrorData
} from "@dfuse/eosws-js"

interface Transfer {
  from: string
  to: string
  quantity: string
  memo: string
}

async function main() {
  const client = new EoswsClient(createEoswsSocket(socketFactory))

  const tableRowsStream = client.getTableRows({
    code: "eosio",
    scope: "eosio",
    table: "global",
    json: true
  })

  const actionTracesStream = client.getActionTraces({
    account: "eosio.token",
    action_name: "transfer"
  })

  client.connect().then(() => {
    actionTracesStream.onMessage((message: InboundMessage<any>) => {
      switch (message.type) {
        case InboundMessageType.ACTION_TRACE:
          const transfer = (message.data as ActionTraceData<Transfer>).trace.act.data
          console.log(
            `Transfer [${transfer.from} -> ${transfer.to}, ${transfer.quantity}] (${transfer.memo})`
          )
          break

        case InboundMessageType.LISTENING:
          const listeningResp = message as InboundMessage<ListeningData>
          console.log(
            `Received Listening message event, reqID: ${listeningResp.req_id}, next_block: ${
              listeningResp.data.next_block
            }`
          )
          break

        case InboundMessageType.ERROR:
          const error = message.data as ErrorData
          console.log(`Received error: ${error.message} (${error.code})`, error.details)
          break

        default:
          console.log(`Unhandled message of type [${message.type}].`)
      }
    })
  })

  client.connect().then(() => {
    tableRowsStream.onMessage((message: InboundMessage<any>) => {
      switch (message.type) {
        case InboundMessageType.TABLE_DELTA:
          const tableDelta = message.data as TableDeltaData
          console.log(
            `Table eosio/eosio#global delta operation ${tableDelta.dbop.op} at block #${
              tableDelta.block_num
            }`
          )
          break

        case InboundMessageType.LISTENING:
          const listeningResp = message as InboundMessage<ListeningData>
          console.log(
            `Received Listening message event, reqID: ${listeningResp.req_id}, next_block: ${
              listeningResp.data.next_block
            }`
          )
          break

        case InboundMessageType.ERROR:
          const error = message.data as ErrorData
          console.log(`Received error: ${error.message} (${error.code})`, error.details)
          break

        default:
          console.log(`Unhandled message of type [${message.type}].`)
      }
    })
  })

  await waitFor(1000)
  console.log("Unlistening from table row updates...")
  tableRowsStream.unlisten()

  await waitFor(2000)
  console.log("Unlistening from action trace updates...")
  actionTracesStream.unlisten()

  client.disconnect()
}

runMain(main)
