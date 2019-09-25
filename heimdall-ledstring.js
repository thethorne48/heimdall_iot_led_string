#!/usr/bin/env node

const resolve = require('path').resolve
const checkConfig = require('./checkConfig').checkConfig

const ThingShadow = require('aws-iot-device-sdk').thingShadow
// const Device = require('aws-iot-device-sdk').device
// const Jobs = require('aws-iot-device-sdk').jobs

async function main() {
  const config = await checkConfig(require(process.env.OPTS_JSON))

  const HOST_URL = config.HOST_URL
  const CLIENT_ID = config.CLIENT_ID
  const CA_FILE_NAME = config.CA_FILE_NAME
  const CERTIFICATE_ID = config.CERTIFICATE_ID
  const CERTIFICATE_PATH = resolve(`${process.env.SNAP_USER_DATA}/${config.CERTIFICATE_PATH}`)
  const CERTIFICATE_PREFIX = resolve(`${CERTIFICATE_PATH}/${CERTIFICATE_ID}`)

  const shadow = new ThingShadow({
    keyPath: `${CERTIFICATE_PREFIX}-private.pem.key`,
    certPath: `${CERTIFICATE_PREFIX}-certificate.pem.crt`,
    caPath: `${CERTIFICATE_PATH}/${CA_FILE_NAME}`,
    clientId: CLIENT_ID,
    host: HOST_URL,
    offlineQueueMaxSize: 50,
    offlineQueueDropBehavior: 'oldest',
  })

  shadow.on('connect', () => {
    shadow.register(CLIENT_ID, {}, () => {
      const state = {
        state: {
          desired: {
            foo: 'bar',
            ledCount: 150,
            brightnessPercent: 80,
          },
        },
      }

      const tokenUpdate = shadow.update(CLIENT_ID, state)
      if (tokenUpdate === null) {
        console.log('update shadow failed, operation still in progress')
      } else {
        console.log(`Token received: ${tokenUpdate}`)
      }

      shadow.publish('test_topic', JSON.stringify({ from: CLIENT_ID }), { qos: 0 }, () => {
        console.log(`publish successful`)
      })
    })
  })

  shadow.on('status', (CLIENT_ID, stat, clientToken, stateObject) => {
    console.log(`received ${stat} (token: ${clientToken}) on ${CLIENT_ID}: ${JSON.stringify(stateObject)}`)
  })

  shadow.on('delta', (thing, state) => {
    console.log(`Received delta on ${thing}: ${JSON.stringify(state)}`)
  })

  shadow.on('timeout', (thing, clientToken) => {
    console.log(`Received timeout on ${thing} with token: ${clientToken}`)
  })

  shadow.subscribe(`home/things/${CLIENT_ID}/led/set`, { qos: 0 }, (err, granted) => {
    if (err) {
      console.log(err.message)
    }
    console.log(`Subscribed to ${granted[0].topic} with QoS: ${granted[0].qos}`)
  })

  shadow.on('message', (topic, payload) => {
    const json = JSON.parse(payload.toString('utf8'))
    console.log(`Received message on ${topic}: ${JSON.stringify(json)}`)
  })
}

main()