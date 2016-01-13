var EventEmitter = require("events")
var util = require("util")
var backoff = require("backoff")
var WebSocket = require("ws")



function EverWS (url, options) {
  EventEmitter.call(this)
  
  this.connected = false
  this.reconnect = true
  this.backoff = backoff.fibonacci()
  
  var connect = function () {    
    if (this.connected) {
      return
    }
    if (!this.reconnect) {
      return
    }
    this.emit("reconnect")
    this.ws = new WebSocket(url, options)
    
    
    
    // Trigger reconnect
    
    var trigger = function () {
      if (this.reconnect) {
        try {
          this.backoff.backoff()
        } catch (err) {
          // ignore backoff error
          // why would it throw??
        }
      }
    }.bind(this)
    
    
    
    // Report connection errors
    
    var onError = function (err) {
      this.emit("error", err)
      if (!this.connected) {
        trigger()
      }
    }.bind(this)
    
    
    
    // Reconnect on close
    
    var onClose = function (err) {
      this.connected = false
      this.emit("close")
      trigger()
    }.bind(this)
    
    
    
    // Proxy websocket events
    
    this.ws.on("message", function (message) {
      this.emit("message", message)
    }.bind(this))
    
    this.ws.once("error", onError)
    this.ws.once("close", onClose)
    
    this.ws.once("open", function () {
      this.backoff.reset()
      this.connected = true
      this.emit("open")
    }.bind(this))
  }.bind(this)
  
  
  
  // Use fibonacci backoff
  
  this.backoff.on("fail", function (err) {
    this.reconnect = false
    this.emit("error", err)
  }.bind(this))
    
  this.backoff.on("ready", connect)
    
  connect()
}

util.inherits(EverWS, EventEmitter)



// Proxy websocket methods

var proto = EverWS.prototype

Object.defineProperty(proto, "readyState", {
  get: function () {
    return this.ws.readyState
  },
})

proto.send = function () {
  return this.ws.send.apply(this.ws, arguments)
}

proto.close = function () {
  this._reconnect = false
  return this.ws.close.apply(this.ws, arguments)
}



// Legacy websocket event handles

var events = [ "open", "error", "message", "close" ]
events.forEach(function (event) {
  Object.defineProperty(proto, "on" + event, {
    configurable: true,
    set: function (func) {
      this.removeAllListeners(event)
      if (func) {
        this.on(event, func)
      }
    }
  })
})



module.exports = EverWS

var constants = [ "CONNECTING", "OPEN", "CLOSING", "CLOSED" ]
constants.forEach(function (key) {
  module.exports[key] = WebSocket[key]
})
