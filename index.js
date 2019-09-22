require('dotenv').config()
const resolve = require('path').resolve

const ThingShadow = require('aws-iot-device-sdk').thingShadow
// const Device = require('aws-iot-device-sdk').device
// const Jobs = require('aws-iot-device-sdk').jobs

const thingName = 'LEDController'
console.log(process.env.KEY_PATH)
const shadow = new ThingShadow({
  keyPath: resolve(process.env.KEY_PATH),
  certPath: resolve(process.env.CERT_PATH),
  caPath: resolve(process.env.CA_PATH),
  clientId: process.env.CLIENT_ID,
  host: process.env.HOST,
  offlineQueueMaxSize: 100,
  offlineQueueDropBehavior: 'oldest',
})

shadow.on('connect', () => {
  shadow.register(thingName, {}, () => {
    const state = {
      state: {
        desired: {
          foo: 'bar',
          ledCount: 150,
          brightnessPercent: 80,
        },
      },
    }

    const tokenUpdate = shadow.update(thingName, state)
    if (tokenUpdate === null) {
      console.log('update shadow failed, operation still in progress')
    } else {
      console.log(`Token received: ${tokenUpdate}`)
    }

    shadow.publish('test_topic', JSON.stringify({ from: thingName }), { qos: 0 }, () => {
      console.log(`publish successful`)
    })
  })
})

shadow.on('status', (thingName, stat, clientToken, stateObject) => {
  console.log(`received ${stat} (token: ${clientToken}) on ${thingName}: ${JSON.stringify(stateObject)}`)
})

shadow.on('delta', (thing, state) => {
  console.log(`Received delta on ${thing}: ${JSON.stringify(state)}`)
})

shadow.on('timeout', (thing, clientToken) => {
  console.log(`Received timeout on ${thing} with token: ${clientToken}`)
})

shadow.subscribe(`home/things/${thingName}/led/set`, { qos: 0 }, (err, granted) => {
  if (err) {
    console.log(err.message)
  }
  console.log(`Subscribed to ${granted[0].topic} with QoS: ${granted[0].qos}`)
})

shadow.on('message', (topic, payload) => {
  const json = JSON.parse(payload.toString('utf8'))
  console.log(`Received message on ${topic}: ${JSON.stringify(json)}`)
})
