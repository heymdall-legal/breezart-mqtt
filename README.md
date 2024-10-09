# breezart-mqtt
Map breezart modbus messages to mqtt. Provide easy homeassistant integration.

## How to use:
```shell
docker build -t breezart .
docker run -d --env MQTT_BROKER=... --env MQTT_USER=... --env MQTT_PASSWORD=... --env BREEZART_HOST=... breezart
```

## Available setting

- `MQTT_BROKER` - full url to mqtt broker. Default: `tcp://localhost:1883`
- `MQTT_USER` - mqtt auth username. Default: `user`
- `MQTT_PASSWORD` - mqtt auth password. Default: `` (empty sting)
- `BREEZART_HOST` - ip of breezart controller. Example: `192.168.1.2`
- `DEVICE_ID` - device identifier. Will be used as entity id in homeassistant discovery messages. Default: `breezart_1`.
