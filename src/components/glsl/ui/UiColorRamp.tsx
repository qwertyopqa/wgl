import { useEffect, useState } from "react";
import type { UniformCtrlInfo } from "../wglapp";
import {UiSlider} from './UiSlider.tsx';
import styles from '../glsl.module.scss';

export function UiColorRamp({ name, value, onChange }) {
    const [rampComps, setRampComps] = useState([]);
    const [rampValue, setRampValue] = useState(value);
    const [rampName, setRampName] = useState(name);

    function getInfoFor(key:string, value:any) {
        return {
            name: key,
            value: {current:value},
            args: [0.0, 1.0, 0.01],
        };
    }

    function onSliderUpdate(key:string, value:any) {
        let values = rampValue;
        values["RGB".indexOf(key)] = Number(value);
        setRampValue(values);
        return values;
    }

    useEffect(() => {
        setRampValue(value);
        setRampName(name);
        setRampComps([
            UiSlider.new("colorRamp"+name+"R", getInfoFor("R", value[0]), (value) => {
                onChange(onSliderUpdate("R", value));
            }),
            UiSlider.new("colorRamp"+name+"G", getInfoFor("G", value[1]), (value) => {
                onChange(onSliderUpdate("G", value));
            }),
            UiSlider.new("colorRamp"+name+"B", getInfoFor("B", value[2]), (value) => {
                onChange(onSliderUpdate("B", value));
            })
        ]);
    }, [value, name, onChange]);


    return (
        <div className={styles.uiColorRamp}>
            {rampComps}
        </div>
    );
}

UiColorRamp.new = (key:string, info:UniformCtrlInfo, onChange:(value:any)=>void) => {
    return <UiColorRamp
        key={key}
        value={info.value.current}
        onChange={onChange}
    />
};