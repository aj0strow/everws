# `everws`

Websocket that reconnects on error or close. It emits multiple open and close events.

```js
// client.js

var WebSocket = require("everws")

var ws = new WebSocket("https://mysever.example.com")

ws.on("open", function () {
  console.log("open")
})

ws.on("reconnect", function () {
  console.log("reconnect")
})

ws.on("close", function () {
  console.log("close")
})
```

Example connection states.

```sh
$ start-server
// open
$ stop-server
// close
// reconnect
// reconnect
// reconnect
$ start-server
// open
```

**MIT License**
