import { useState, useRef, useEffect } from 'react';

import styles from './glsl.module.scss';
import { initGlApp, getAndProcessFragShader, updateCustomUniforValue } from './wglapp.ts';
import type { tickCallback, FragShaderInfo, Info } from './wglapp.ts';

import {GlslCanvasPanel} from './GlslCanvasPanel.tsx';
import {UiSlider} from './ui/UiSlider.tsx';
import {UiColorRamp} from './ui/UiColorRamp.tsx';

type Size = {w:number, h:number};

let init = false;

export default function GlslCanvas({ frag }) {
    const wrappertRef = useRef(null);
    const [wglApp, setWglApp] = useState(null);
    const [shaderURL, setShaderURL] = useState(frag);
    const [shaderInfo, setShaderInfo] = useState(null);


    function getCanvas() {
        const wrapper = wrappertRef.current as any as HTMLElement;
        return wrapper.querySelector("canvas") as HTMLCanvasElement;
    }
    function cloneCanvas(canvas:HTMLCanvasElement, size:Size) {
        const clone = canvas.cloneNode(true) as HTMLCanvasElement;
        canvas.parentElement?.insertBefore(clone, canvas);
        canvas.parentElement?.removeChild(canvas);
        clone.width = size.w;
        clone.height = size.h;
        return true;
    }

    function wasCanvasResized(recreate:boolean = false) {
        let canvas = getCanvas();
        const size:Size = {w:canvas.clientWidth * 2, h: canvas.clientHeight * 2};
        if (canvas.width  !== size.w || canvas.height  !== size.h) {
            return (recreate) ? cloneCanvas(canvas, size) : false;
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
            const app = initGlApp(getCanvas(), fragShaderInfo, ()=>!resized);
            setWglApp(app);
            resized = false;
        }

        if (!init && getCanvas()) {
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

    function injectQueryParams(fragShaderInfo) {
        const urlSearchParams = new URLSearchParams(window.location.search);
        const params = Object.fromEntries(urlSearchParams.entries());
        Object.keys(params).forEach((key) => {
            if (key in fragShaderInfo.uniforms.custom) {
                const u = fragShaderInfo.uniforms.custom[key];
                if (u.type === "vec3") {
                    fragShaderInfo.uniforms.custom[key].value.current = params[key].split(",").map((v) => Number(v));
                }
                if (u.type === "float" || u.type === "int") {
                    fragShaderInfo.uniforms.custom[key].value.current = Number(params[key]);
                }
            }
        });
    }

    useEffect(() => {
        getAndProcessFragShader(shaderURL, (fragShaderInfo:FragShaderInfo) => {
            injectQueryParams(fragShaderInfo);
            setShaderInfo(fragShaderInfo);
        });
    }, [shaderURL]);

    useEffect(() => {
        if (shaderInfo) start(shaderInfo);
    }, [shaderInfo]);


    return (
        <div ref={wrappertRef}>
            <canvas className={styles.glslCanvas}></canvas>
            <GlslCanvasPanel fragShaderInfo={shaderInfo} wglApp={wglApp}/>
        </div>
    );

}