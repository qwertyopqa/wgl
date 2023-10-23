import { useEffect, useState, useRef } from "react";
import type { UniformCtrlInfo } from "../wglapp";
import {UiSlider} from './UiSlider.tsx';
import {UiColorRampPreview} from './UiColorRampPreview.tsx';
import styles from '../glsl.module.scss';

export function UiColorRamp({ name, value, onChange }) {
    const wrapperRef = useRef(null);
    const [key, setKey] = useState(0);
    const [rampComps, setRampComps] = useState([]);
    const [rampValue, setRampValue] = useState(value);
    const [canvasCallback, setCanvasCallback] = useState(null);

    function getInfoFor(key:string, value:any) {
        return {
            name: key,
            value: {current:value},
            args: [0.0, 1.0, 0.01],
        };
    }

    function onSliderUpdate(key:string, value:any, cb:any) {
        let values = rampValue;
        values["RGB".indexOf(key)] = Number(value);
        setRampValue(values);
        const updtEvent = new CustomEvent("updated", {
            bubbles: false,
            detail: { values },
          });
        wrapperRef.current.dispatchEvent(updtEvent);
        return values;
    }

    useEffect(() => {
        setRampValue(value);
        setRampComps([
            UiSlider.new("colorRamp-R", getInfoFor("R", value[0]), (v) => {
                onChange(onSliderUpdate("R", v, canvasCallback));
            }),
            UiSlider.new("colorRamp-G", getInfoFor("G", value[1]), (v) => {
                onChange(onSliderUpdate("G", v, canvasCallback));
            }),
            UiSlider.new("colorRamp-B", getInfoFor("B", value[2]), (v) => {
                onChange(onSliderUpdate("B", v, canvasCallback));
            })
        ]);
    }, [value, onChange, canvasCallback]);


    return (
        <div ref={wrapperRef} className={styles.uiColorRamp} data-v={rampValue} >
            <UiColorRampPreview parentRef={wrapperRef}/>
            <div className={styles.uiColorRampComps}>
                {rampComps}
            </div>
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