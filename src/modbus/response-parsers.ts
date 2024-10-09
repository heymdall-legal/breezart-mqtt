import { unsignToSign } from './utils';

export function parseMainResponse(responseMap: Record<number, number>) {
    const StateAHU = responseMap[1] + responseMap[2] * 0x10000;
    const result = {
        RawTemp: unsignToSign(responseMap[3]),
        IsGdT: responseMap[4] & 0xFF,
        RawHum: responseMap[5],
        IsGdH: responseMap[6] & 0xFF,
        RawSpeed: responseMap[7],
        IsGdSp: responseMap[8] & 0xFF,
        Speed: 0,
        StatePwr: responseMap[0],
        StateAHU: responseMap[1] + responseMap[2] * 0x10000,
        StatePwrFull: StateAHU & 3,
        IsWinter: (StateAHU >> 2) & 1,
        IsWarning: (StateAHU >> 3) & 1,
        IsFatalErr: (StateAHU >> 4) & 1,
        IsInflowActive: (StateAHU >> 5) & 1,
        IsRecircActive: (StateAHU >> 6) & 1,
        IsHeatActive: (StateAHU >> 7) & 1,
        IsCoolActive: (StateAHU >> 8) & 1,
        IsHumActive: (StateAHU >> 9) & 1,
        IsDehumActive: (StateAHU >> 10) & 1,
        IsRecupActive: (StateAHU >> 11) & 1,
        IsComfortActive: (StateAHU >> 12) & 1,
        IsPreHeatActive: (StateAHU >> 13) & 1,
        IsTrainPumpActive: (StateAHU >> 14) & 1,
        IsBlowHeaterActive: (StateAHU >> 15) & 1,
        ToLowTemper: (StateAHU >> 16) & 1,
        OnByRemote: (StateAHU >> 17) & 1,
        IsWorkClock: (StateAHU >> 18) & 1,
        IsHotWater: (StateAHU >> 19) & 1,
        IsSetTimer: (StateAHU >> 20) & 1,
        StateConRem: (StateAHU >> 21) & 1,
        IsWaitRemote: (StateAHU >> 22) & 1,
        IsCntEnergyFull: (StateAHU >> 23) & 1,
        IsCalibrateMode: (StateAHU >> 24) & 1,
        IsSmoothVent: (StateAHU >> 25) & 1,
        CodeErr: responseMap[9] + responseMap[10] * 0x10000,
        CodeWarn: responseMap[11] + responseMap[12] * 0x10000,
        CodeEW: 0,
    };

    if (result.RawSpeed < 10) {
        result.Speed = 0;
    } else {
        result.Speed = parseInt(((result.RawSpeed - 1) / 1000).toFixed(0));
    }

    result.CodeEW = result.CodeErr | result.CodeWarn;

    return result;
}

export function parseSensorResponse(MBReg: Record<number, number>) {
    const RegUser = MBReg[4];
    const result = {
        RawSpeedTarget: MBReg[0],
        SpeedTarget: 0,
        TemperTarget: unsignToSign(MBReg[1]),
        HumidTarget: MBReg[2],
        PwrTarget: MBReg[3],
        RegUser,
        ComfortMode: (RegUser >> 0) & 1,
        RestartMode: (RegUser >> 1) & 1,
        HumMode: (RegUser >> 2) & 1,
        DeHumMode: (RegUser >> 3) & 1,
        CoolMode: (RegUser >> 4) & 1,
        RecupMode: (RegUser >> 5) & 1,
        RecircMode: (RegUser >> 6) & 1,
        FlagTimersScenario: !((RegUser >> 7) & 1),
        AHUMode: MBReg[5],
        CFilterRaw: [MBReg[6], MBReg[7]],
        CFilterShow: [Math.round(MBReg[6] / 100), Math.round(MBReg[7] / 100)],
        FanFactProc: Math.round(MBReg[10] / 100),
        FactTenPwr: MBReg[11] * 10, // кВт
    };
    if (result.RawSpeedTarget < 10) {
        result.SpeedTarget = 0;
    } else {
        result.SpeedTarget = parseInt(((result.RawSpeedTarget - 1) / 1000).toFixed(0));
    }

    return result;
}

export function parseEnergyResponse(registries: Record<number, number>) {
    return registries[0];
}
