import { parseEnergyResponse, parseMainResponse, parseSensorResponse } from './response-parsers';
import { modbusQuery, ModbusRequestParams, ModbusRequestType } from './modbus-query';


const mainRequest = {
    requestType: ModbusRequestType.ReadIR,
    address: 10,
    registersCount: 13,
    writeData: [],
    parser: parseMainResponse,
};
function getMainState(ip: string) {
    return modbusQuery(ip, mainRequest);
}

const sensorsRequest = {
    requestType: ModbusRequestType.ReadIR,
    address: 64000,
    registersCount: 12,
    writeData: [],
    parser: parseSensorResponse,
};
function getSensorsState(ip: string) {
    return modbusQuery(ip, sensorsRequest);
}

// energy have 5 registries 8 bytes between them
const energyRequest1 = {
    requestType: ModbusRequestType.ReadHR,
    address: 31008,
    registersCount: 1,
    writeData: [],
    parser: parseEnergyResponse,
};
const energyRequest2 = {
    requestType: ModbusRequestType.ReadHR,
    address: 31016,
    registersCount: 1,
    writeData: [],
    parser: parseEnergyResponse,
};
const energyRequest3 = {
    requestType: ModbusRequestType.ReadHR,
    address: 31024,
    registersCount: 1,
    writeData: [],
    parser: parseEnergyResponse,
};
const energyRequest4 = {
    requestType: ModbusRequestType.ReadHR,
    address: 31032,
    registersCount: 1,
    writeData: [],
    parser: parseEnergyResponse,
};
const energyRequest5 = {
    requestType: ModbusRequestType.ReadHR,
    address: 31040,
    registersCount: 1,
    writeData: [],
    parser: parseEnergyResponse,
};

export async function getEnergyState(ip: string) {
    const energy1 = await modbusQuery(ip, energyRequest1);
    const energy2 = await modbusQuery(ip, energyRequest2);
    const energy3 = await modbusQuery(ip, energyRequest3);
    const energy4 = await modbusQuery(ip, energyRequest4);
    const energy5 = await modbusQuery(ip, energyRequest5);

    return (energy1 + energy2 + energy3 + energy4 + energy5) / 1000;
}

export async function getState(ip: string) {
    const mainState = await getMainState(ip);
    const sensorsState = await getSensorsState(ip);
    const energyState = await getEnergyState(ip);

    return {
        ...mainState,
        ...sensorsState,
        energy: energyState,
    };
}

export type BreezartState = Awaited<ReturnType<typeof getState>>;

function getSetSpeedRequest(speed: number): ModbusRequestParams<void> {
    return {
        requestType: ModbusRequestType.WriteSHR,
        address: 0,
        registersCount: 1,
        writeData: [speed * 1000],
        parser: (response) => response,
    };
}

export function setSpeed(ip: string, speed: number) {
    return modbusQuery(ip, getSetSpeedRequest(speed));
}

function getSetTemperatureRequest(temperature: number): ModbusRequestParams<void> {
    return {
        requestType: ModbusRequestType.WriteSHR,
        address: 1,
        registersCount: 1,
        writeData: [temperature * 10],
        parser: (response) => response,
    };
}

export function setTemperature(ip: string, temperature: number) {
    return modbusQuery(ip, getSetTemperatureRequest(temperature));
}

function getSetOnRequest(on: boolean): ModbusRequestParams<void> {
    return {
        requestType: ModbusRequestType.WriteSHR,
        address: 3,
        registersCount: 1,
        writeData: [on ? 1 : 0],
        parser: (response) => response,
    };
}

export function setOn(ip: string, on: boolean) {
    return modbusQuery(ip, getSetOnRequest(on));
}
// Heater mode control. Not implemented yet.
export enum HeaterMode {
    Heat = 0,
    FanOnly = 3,
}

function getSetHeaterModeRequest(mode: HeaterMode): ModbusRequestParams<void> {
    return {
        requestType: ModbusRequestType.WriteSHR,
        address: 2, // TODO
        registersCount: 1,
        writeData: [mode],
        parser: (response) => response,
    };
}

export function setHeaterMode(ip: string, mode: HeaterMode) {
    return modbusQuery(ip, getSetHeaterModeRequest(mode));
}
