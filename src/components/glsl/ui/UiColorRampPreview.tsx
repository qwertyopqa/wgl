import { useState, useRef, useEffect } from 'react';
import { initGlApp, getAndProcessFragShader, updateCustomUniforValue } from '../wglapp.ts';
import type { FragShaderInfo } from '../wglapp.ts';
import styles from '../glsl.module.scss';


export function UiColorRampPreview({ parentRef }) {
    const [wglApp, setWglApp] = useState();
    const wrappertRef = useRef(null);

    useEffect(() => {
        getAndProcessFragShader('/glsl/color_ramp.frag.glsl', (fragShaderInfo:FragShaderInfo) => {
            setWglApp(
                initGlApp(wrappertRef.current.querySelector("canvas"), fragShaderInfo, ()=>true)
            );
        });
    }, []);

    useEffect(() => {
        if (wglApp) {
            parentRef.current.addEventListener("updated", (e) => {
                updateCustomUniforValue(wglApp, "color_ramp", e.detail.values);
            });
        }
    }, [parentRef, wglApp]);


    return (<div ref={wrappertRef} className={styles.uiColorRampPreview}>
        <canvas></canvas>
    </div>);
}