import mqtt from 'async-mqtt';
import { BreezartState, getState, setSpeed, setTemperature, setOn } from './modbus';
import { getMqttConfig, InfoTopic, CommandTopic } from './mqtt-config';

const MQTT_BROKER = process.env.MQTT_BROKER || 'tcp://localhost:1883';
const MQTT_USER = process.env.MQTT_USER || 'user';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';
const BREEZART_HOST = process.env.BREEZART_HOST || '127.0.0.1';
const UPDATE_INTERVAL = parseInt(process.env.UPDATE_INTERVAL || '', 10) || 5000;

const DEVICE_ID = process.env.DEVICE_ID || 'breezart_1';

type InfoTopicsMapper = {
    [key in InfoTopic]: (state: BreezartState) => any;
}

const infoTopicsMapper: InfoTopicsMapper = {
    temperature: (state) => state.RawTemp / 10,
    power: (state) => state.FactTenPwr,
    speed: (state) => state.SpeedTarget * 10,
    targetTemperature: (state) => state.TemperTarget / 10,
    fanMode: (state) => state.SpeedTarget,
    mode: (state) => {
        if (state.PwrTarget === 0) {
            return 'off';
        }
        return state.IsHeatActive ? 'heat' : 'fan_only'
    },
    powerConsumption: (state) => state.energy,
};

type CommandTopicsMapper = {
    [key in CommandTopic]: (payload: string) => Promise<void>;
}

const commandTopicsMapper: CommandTopicsMapper = {
    speed: (payload) => {
        const speed = parseInt(payload);
        if (speed < 0 || speed > 10) {
            throw new Error('Invalid speed');
        }

        return setSpeed(BREEZART_HOST, speed);
    },
    mode: async (payload) => {
        if (payload === 'off') {
            return setOn(BREEZART_HOST, false);
        }
        return setOn(BREEZART_HOST, true);
        // TODO: implement fan_only mode
    },
    fanMode: (payload) => {
        const speed = parseInt(payload);
        if (speed < 0 || speed > 10) {
            throw new Error('Invalid speed');
        }

        return setSpeed(BREEZART_HOST, speed);
    },
    temperature: (payload) => {
        const temperature = parseInt(payload);
        if (temperature < 10 || temperature > 30) {
            throw new Error('Invalid temperature');
        }

        return setTemperature(BREEZART_HOST, temperature);
    },
};


async function main() {
    let updateInterval: NodeJS.Timeout;
    const mqttConfig = getMqttConfig(DEVICE_ID);

    // publish discovery configs
    const mqttClient = await mqtt.connectAsync(MQTT_BROKER, {
        username: MQTT_USER,
        password: MQTT_PASSWORD,
    });

    const discoveryPromises = mqttConfig.discovery.map((config) => {
        return mqttClient.publish(config.topic, config.payload, {retain: config.retain});
    });
    await Promise.all(discoveryPromises);

    // publish bridge state
    await mqttClient.publish(mqttConfig.onlineTopic, 'online', {retain: true});

    async function publishState() {
        const state = await getState(BREEZART_HOST);

        Object.keys(infoTopicsMapper).forEach((topic) => {
            const value = infoTopicsMapper[topic as InfoTopic](state);
            mqttClient.publish(mqttConfig.topics[topic as InfoTopic], JSON.stringify({value}), {retain: false});
        });
    }

    // subscribe to commands
    await mqttClient.subscribe(Object.values(mqttConfig.commands));

    mqttClient.on('message', async (topic, payload) => {
        const commandTopic = Object.keys(mqttConfig.commands).find((key) => mqttConfig.commands[key as CommandTopic] === topic);
        if (!commandTopic) {
            return;
        }

        console.log('command', commandTopic, payload.toString());

        const command = commandTopicsMapper[commandTopic as CommandTopic];
        try {
            clearInterval(updateInterval); // stop publishing state while executing command. It may mess up modbus connection
            await command(payload.toString());
            publishState();
            setInterval(publishState, UPDATE_INTERVAL);
        } catch (err) {
            console.error(err);
        }
    });

    // publish state periodically
    await publishState();
    updateInterval = setInterval(publishState, UPDATE_INTERVAL);
}

main().catch(console.error);
