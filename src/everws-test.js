var WebSocketServer = require("ws").Server
var EventEmitter = require("events").EventEmitter
var WebSocket = require("./everws")
var assert = require("assert")

describe("websocket", function () {
  var port = 8000
  
  beforeEach(function () {
    this.port = port++
  })
  
  it("should reconnect on server restart", function (done) {
    var s1 = new WebSocketServer({ port: this.port })
    var ws = new WebSocket("ws://localhost:" + this.port)
    
    ws.once("open", function () {
      s1.close()
    })
    
    ws.once("close", function () {
      var s2 = new WebSocketServer({ port: this.port })
      ws.once("open", function () {
        ws.close()
        s2.close()
        done()
      })
    }.bind(this))
  })
  
  it("should send messages", function (done) {
    var s = new WebSocketServer({ port: this.port })
    s.on("connection", function (ws) {
      ws.on("message", function () {
        s.close()
        done()
      })
    })
    var ws = new WebSocket("ws://localhost:" + this.port)
    ws.on("open", function () {
      ws.send("some message")
    })
  })
  
  it("should close", function (done) {
    var s = new WebSocketServer({ port: this.port })
    var ws = new WebSocket("ws://localhost:" + this.port)
    ws.on("open", function () {
      ws.on("close", function () {
        s.close()
        done()
      })
      ws.close()
    })
  })
  
  it("should error on send when closed", function (done) {
    var ws = new WebSocket("ws://localhost:" + this.port)
    ws.send("message", function (err) {
      if (err) {
        ws.close()
        done()
      }
    })
    ws.on("error", function (err) {
      if (err.code == "ECONNREFUSED") {
        return
      } else {
        throw err
      }
    })
  })
  
  it("should proxy ready state", function (done) {
    var s = new WebSocketServer({ port: this.port })
    var ws = new WebSocket("ws://localhost:" + this.port)
    
    assert.equal(ws.readyState, 0)
    
    ws.on("open", function () {
      assert.equal(ws.readyState, 1)
      ws.close()
    })
    
    ws.on("close", function () {
      assert.equal(ws.readyState, 3)
      s.close()
      done()
    })
  })
  
  it("should proxy property events", function (done) {
    var s = new WebSocketServer({ port: this.port })
    var ws = new WebSocket("ws://localhost:" + this.port)
    
    ws.onopen = function () {
      ws.close()
      s.close()
      done()
    }
  })
  
  it("should copy over constants", function () {
    assert.equal(WebSocket.CONNECTING, 0)
    assert.equal(WebSocket.OPEN, 1)
    assert.equal(WebSocket.CLOSING, 2)
    assert.equal(WebSocket.CLOSED, 3)
  })
})
