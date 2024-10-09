import axios from 'axios';
import { isNumeric } from './utils';

let requestCounter = 0;

export enum ModbusRequestType {
    ReadHR = 3,
    ReadIR = 4,
    WriteSHR = 6,
    WriteMHR = 16,
}

export type ModbusRequestParams<ResponseType> = {
    requestType: ModbusRequestType;
    address: number;
    registersCount: number; // кол-во регистров
    writeData: number[];
    parser: (responseMap: Record<number, number>) => ResponseType;
};

function createModbusRequest({requestType, address, registersCount, writeData}: ModbusRequestParams<unknown>) {
    const isRequestValid = isNumeric(address) && isNumeric(registersCount) && address >= 0 && address < 65536 && registersCount > 0 && registersCount < 33 && (address + registersCount) < 65536;

    if (!isRequestValid) {
        throw new Error('Invalid request');
    }

    let LenBuff;

    requestCounter++;

    if (requestType === ModbusRequestType.WriteMHR) {
        LenBuff = 13 + registersCount * 2;
    } else {
        LenBuff = 12;
    }
    const aBuff = new ArrayBuffer(LenBuff);
    const data = new Uint8Array(aBuff);
    const sessionId = (requestCounter + 0x10000) % 0x10000;

    data[0] = (sessionId >> 8) & 0xFF;
    data[1] = sessionId & 0xFF; // SesID
    data[2] = 0;
    data[3] = 0;
    data[4] = 0; 	// 0
    if (requestType === ModbusRequestType.WriteMHR) {
        data[5] = 7 + registersCount * 2;
    }// nData
    else {
        data[5] = 6;
    }
    data[6] = 1; // MB Addr
    data[7] = requestType; // 3, 4, 6, 16
    data[8] = (address >> 8) & 0xFF;
    data[9] = address & 0xFF; // 8-9 : MBAddr
    if (requestType === ModbusRequestType.ReadHR || requestType === ModbusRequestType.ReadIR) {
        data[10] = 0;
        data[11] = registersCount;
    } else if (requestType === ModbusRequestType.WriteSHR) {
        data[10] = (writeData[0] >> 8) & 0xFF;
        data[11] = writeData[0] & 0xFF;
    } else if (requestType === ModbusRequestType.WriteMHR) {
        data[10] = 0;
        data[11] = registersCount;
        data[12] = registersCount * 2;
        for (let i = 0; i < registersCount; i++) {
            data[i * 2 + 13] = (writeData[i] >> 8) & 0xFF;
            data[i * 2 + 14] = writeData[i] & 0xFF;
        }
    }

    return {data, sessionId};
}

export async function modbusQuery<ResponseType>(
    IP: string,
    requestParams: ModbusRequestParams<ResponseType>,
): Promise<ResponseType> {
    const request = createModbusRequest(requestParams);

    const response = await axios.post(`http://${ IP }/`, request.data, {
        timeout: 3000,
        responseType: 'arraybuffer',
    });


    const rawResponse = response.data;

    if (!rawResponse) {
        throw new Error('Request Error');
    }

    const byteArray = new Uint8Array(rawResponse);
    const responseSessionId = (byteArray[0] << 8) | byteArray[1]; // сессия из задания
    if (responseSessionId != request.sessionId) {
        throw new Error('Request SesionID Error');
    }

    const responseMap = modBusResponseToMap(byteArray);

    return requestParams.parser(responseMap);
}

function modBusResponseToMap(barr: Uint8Array) {
    const responseMap: Record<number, number> = {};
    if (barr[7] > 0x80) { // MB Err
        const errorNumber = barr[8];
        throw new Error(`Modbus Error #${ errorNumber }`);
    }

    for (let i = 0; i < barr[8] / 2; i++) {
        responseMap[i] = (barr[i * 2 + 9] << 8) | barr[i * 2 + 10];
    }

    return responseMap;
}
