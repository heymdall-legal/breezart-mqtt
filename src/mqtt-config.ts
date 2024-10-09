const DEVICE_MQTT_PREFIX = 'breezart';
const DISCOVERY_PREFIX = 'homeassistant';

function getBasePayload(deviceId: string) {
    return {
        availability: [
            {
                topic: `${DEVICE_MQTT_PREFIX}/bridge/state`,
            },
        ],
        device: {
            identifiers: [deviceId],
            manufacturer: 'Breezart',
            model: '550 Lux',
            name: 'Breezart 550 Lux',
        },
        origin: {
            name: 'Breezart Control',
        },
        enabled_by_default: true,
        platform: 'mqtt',
        unique_id: `${deviceId}_breezart`,
    };
}


function getPowerDiscovery(deviceId: string) {
    return {
        topic: `${DISCOVERY_PREFIX}/sensor/${deviceId}_power/config`,
        payload: JSON.stringify({
            ...getBasePayload(deviceId),
            device_class: 'power',
            object_id: `${deviceId}_power`,
            state_class: 'measurement',
            state_topic: getPowerStateTopic(deviceId),
            unique_id: `${deviceId}_power_breezart`,
            unit_of_measurement: 'W',
            value_template: '{{ value_json.value }}',
        }),
        retain: true,
    };
}

function getPowerStateTopic(deviceId: string) {
    return `${DEVICE_MQTT_PREFIX}/${deviceId}_power`;
}

function getPowerConsumptionDiscovery(deviceId: string) {
    return {
        topic: `${DISCOVERY_PREFIX}/sensor/${deviceId}_power_consumption/config`,
        payload: JSON.stringify({
            ...getBasePayload(deviceId),
            device_class: 'power',
            object_id: `${deviceId}_power_consumption`,
            state_class: 'measurement',
            state_topic: getPowerConsumptionStateTopic(deviceId),
            unique_id: `${deviceId}_power_consumption_breezart`,
            unit_of_measurement: 'kWh',
            value_template: '{{ value_json.value }}',
        }),
        retain: true,
    };
}

function getPowerConsumptionStateTopic(deviceId: string) {
    return `${DEVICE_MQTT_PREFIX}/${deviceId}_power_consumption`;
}

function getSpeedDiscovery(deviceId: string) {
    return {
        topic: `${DISCOVERY_PREFIX}/sensor/${deviceId}_speed/config`,
        payload: JSON.stringify({
            ...getBasePayload(deviceId),
            entity_category: 'config',
            object_id: `${deviceId}_speed`,
            state_topic: getSpeedStateTopic(deviceId),
            command_topic: getSpeedCommandTopic(deviceId),
            unique_id: `${deviceId}_speed_breezart`,
            unit_of_measurement: '%',
            value_template: '{{ value_json.value }}',
        }),
        retain: true,
    };
}

function getSpeedStateTopic(deviceId: string) {
    return `${DEVICE_MQTT_PREFIX}/${deviceId}_speed`;
}

function getSpeedCommandTopic(deviceId: string) {
    return `${DEVICE_MQTT_PREFIX}/${deviceId}_speed/set`;
}

function getHvacDiscovery(deviceId: string) {
    return {
        topic: `${DISCOVERY_PREFIX}/climate/${deviceId}_hvac/config`,
        payload: JSON.stringify({
            ...getBasePayload(deviceId),
            min_temp: 15,
            max_temp: 30,
            modes: ['off', 'heat', 'fan_only'],
            mode_state_topic: getModeStateTopic(deviceId),
            mode_state_template: '{{ value_json.value }}',
            mode_command_topic: getModeCommandTopic(deviceId),
            current_temperature_topic: getTemperatureStateTopic(deviceId),
            current_temperature_template: '{{ value_json.value }}',
            temperature_state_topic: getTargetTemperatureTopic(deviceId), // targetTemperature
            temperature_state_template: '{{ value_json.value }}',
            temperature_command_topic: getTemperatureCommandTopic(deviceId),
            fan_modes: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            fan_mode_state_topic: getFanModeStateTopic(deviceId),
            fan_mode_state_template: '{{ value_json.value }}',
            fan_mode_command_topic: getFanModeCommandTopic(deviceId),
            unique_id: `${deviceId}_hvac_breezart`,
            precision: 0.1,
            temp_step: 1,
            temperature_unit: 'C',
        }),
        retain: true,
    };
}

function getTemperatureStateTopic(deviceId: string) {
    return `${DEVICE_MQTT_PREFIX}/${deviceId}_temperature`;
}

function getTargetTemperatureTopic(deviceId: string) {
    return `${DEVICE_MQTT_PREFIX}/${deviceId}_target_temperature`;
}

function getTemperatureCommandTopic(deviceId: string) {
    return `${DEVICE_MQTT_PREFIX}/${deviceId}_target_temperature/set`;
}

function getFanModeStateTopic(deviceId: string) {
    return `${DEVICE_MQTT_PREFIX}/${deviceId}_fan_mode`;
}

function getFanModeCommandTopic(deviceId: string) {
    return `${DEVICE_MQTT_PREFIX}/${deviceId}_fan_mode/set`;
}

function getModeStateTopic(deviceId: string) {
    return `${DEVICE_MQTT_PREFIX}/${deviceId}_mode`;
}

function getModeCommandTopic(deviceId: string) {
    return `${DEVICE_MQTT_PREFIX}/${deviceId}_mode/set`;
}


export function getMqttConfig(deviceId: string) {
    return {
        topics: {
            speed: getSpeedStateTopic(deviceId),
            mode: getModeStateTopic(deviceId),
            fanMode: getFanModeStateTopic(deviceId),
            temperature: getTemperatureStateTopic(deviceId),
            targetTemperature: getTargetTemperatureTopic(deviceId),
            power: getPowerStateTopic(deviceId),
            powerConsumption: getPowerConsumptionStateTopic(deviceId),
        },
        commands: {
            speed: getSpeedCommandTopic(deviceId),
            mode: getModeCommandTopic(deviceId),
            fanMode: getFanModeCommandTopic(deviceId),
            temperature: getTemperatureCommandTopic(deviceId),
        },
        onlineTopic: `${DEVICE_MQTT_PREFIX}/bridge/state`,
        discovery: [
            getHvacDiscovery(deviceId),
            getSpeedDiscovery(deviceId),
            getPowerDiscovery(deviceId),
            getPowerConsumptionDiscovery(deviceId),
        ],
    };
}

type MqttConfig = ReturnType<typeof getMqttConfig>;

export type InfoTopic = keyof MqttConfig['topics'];
export type CommandTopic = keyof MqttConfig['commands'];
