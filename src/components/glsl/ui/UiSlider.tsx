import { useEffect, useState } from "react";
import type { UniformCtrlInfo } from "../wglapp";
import styles from "../glsl.module.scss";

export function UiSlider({ name, value, min, max, step, onChange }) {
    const [sliderValue, setSliderValue] = useState(value);
    const [sliderMin, setSliderMin] = useState(min);
    const [sliderMax, setSliderMax] = useState(max);
    const [sliderStep, setSliderStep] = useState(step);
    const [sliderName, setSliderName] = useState(name);

    useEffect(() => {
        setSliderValue(value);
        setSliderMin(min);
        setSliderMax(max);
        setSliderStep(step);
        setSliderName(name);
    }, [value, min, max, step, name]);


    return (
        <div className={styles.uiSlider}>
            <label htmlFor={sliderName}>{sliderName}</label>
            <input
                type="range"
                name={sliderName}
                min={sliderMin}
                max={sliderMax}
                step={sliderStep}
                value={sliderValue}
                onChange={(e) => {
                    setSliderValue(e.target.value);
                    onChange(e.target.value);
                }}
            />
        </div>
    );
}

UiSlider.new = (key:string, info:UniformCtrlInfo, onChange:(value:any)=>void) => {
    return <UiSlider
        key={key}
        name={info.name}
        value={info.value.current}
        min={info.args[0]}
        max={info.args[1]}
        step={info.args[2]}
        onChange={onChange}
    />
};