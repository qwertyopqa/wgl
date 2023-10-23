import { useState, useRef, useEffect } from 'react';

import styles from './glsl.module.scss';
import { initGlApp, getAndProcessFragShader, updateCustomUniforValue } from './wglapp.ts';
import type { tickCallback, FragShaderInfo, Info } from './wglapp.ts';

import {UiSlider} from './ui/UiSlider.tsx';
import {UiColorRamp} from './ui/UiColorRamp.tsx';



let init = false;

type Args = {
    frag: string;
}

export default function GlslCanvas({ frag }) {
    const [wglApp, setWglApp] = useState(null);
    const [shaderURL, setShaderURL] = useState(frag);
    const [uniformCtrls, setUniformCtrls] = useState([]);
    const wrappertRef = useRef(null);

    function getCanvas() {
        const wrapper = wrappertRef.current as any as HTMLElement;
        return wrapper.querySelector("canvas") as HTMLCanvasElement;
    }

    function wasCanvasResized(recreate:boolean = false) {
        let canvas = getCanvas();
        const client = {w:canvas.clientWidth * 2, h: canvas.clientHeight * 2};
        if (canvas.width  !== client.w || canvas.height  !== client.h) {
            if (recreate) {
                const clone = canvas.cloneNode(true) as HTMLCanvasElement;
                canvas.parentElement?.insertBefore(clone, canvas);
                canvas.parentElement?.removeChild(canvas);
                clone.width = client.w;
                clone.height = client.h;
            }
            return true;
        }
        return false;
    }

    function start(fragShaderInfo:FragShaderInfo) {
        let resized = false;
        let rt:false|number = false;

        function restart() {
            if (!wasCanvasResized(true)) {
                return;
            }
            setWglApp(
                initGlApp(getCanvas(), fragShaderInfo, ()=>!resized)
            );
            resized = false;
        }

        if (!init) {
            init = true;
            window.addEventListener("resize", function () {
                if (rt) {
                    clearTimeout(rt);
                }
                rt = setTimeout(() => wasCanvasResized() && restart(), 500);
            });
            restart();
        }
    }

    function updateInfo(name, value) {
        updateCustomUniforValue(wglApp, name, value);
    }

    function processUniformInfo(shaderInfo:FragShaderInfo) {
        let ctrls = [];
        let i = 0;
        for (let name in shaderInfo.uniforms.custom) {
            let info = shaderInfo.uniforms.custom[name];
            if (info.ctrlID === "slider") {
                ctrls.push(UiSlider.new("customUniform-"+i, info, (value) => updateInfo(info.name, value)));
            }
            if (info.ctrlID === "colorRamp") {
                ctrls.push(UiColorRamp.new("customUniform-"+i, info, (value) => updateInfo(info.name, value)));
            }
            i++;
        }
        setUniformCtrls(ctrls);
    }

    useEffect(() => {
        getAndProcessFragShader(shaderURL, (fragShaderInfo:FragShaderInfo) => {
            window.info = fragShaderInfo;
            start(fragShaderInfo);
            processUniformInfo(fragShaderInfo);
        });
    }, [shaderURL, wglApp]);

    return <div ref={wrappertRef}>
        <canvas className={styles.glslCanvas}></canvas>
        <div className={styles.glslCanvasUI}>
            {uniformCtrls}
        </div>
    </div>;
}