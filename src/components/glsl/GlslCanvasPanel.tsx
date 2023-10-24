import { useState, useRef, useEffect } from 'react';

import styles from './glsl.module.scss';
import { initGlApp, getAndProcessFragShader, updateCustomUniforValue } from './wglapp.ts';
import type { tickCallback, FragShaderInfo, Info } from './wglapp.ts';

import {UiSlider} from './ui/UiSlider.tsx';
import {UiColorRamp} from './ui/UiColorRamp.tsx';

let init = false;

type Args = {
    wglApp: Info;
    fragShaderInfo: FragShaderInfo;
};

function UiPanel({info, children}:Args) {
    return (
        <div className={styles.uiPanel} rel="panel">
            <label>{info.label}<span>&nbsp;</span></label>
            <div className={styles.uiPanelContent} data-orientation={info.orientation}>
                {children}
            </div>
        </div>
    );
}

export function GlslCanvasPanel({ wglApp, fragShaderInfo }:Args) {

    const [uniformCtrls, setUniformCtrls] = useState({});
    const [panelsCtrls, setPanelsCtrls] = useState([]);

    function processUniformInfo(shaderInfo:FragShaderInfo) {
        let ctrls = {};
        let i = 0;
        for (let name in shaderInfo.uniforms.custom) {
            let info = shaderInfo.uniforms.custom[name];
            let ctrl = null;
            if (info.ctrlID === "slider") {
                ctrl = UiSlider.new("customUniform-"+i, info, (v) => updateInfo(info.name, v));
            }
            if (info.ctrlID === "colorRamp") {
                ctrl = UiColorRamp.new("customUniform-"+i, info, (v) => updateInfo(info.name, v));
            }
            if (ctrl) {
                ctrls[info.name] = ctrl;
            }
            i++;
        }
        setUniformCtrls(ctrls);
        let panels = {};
        let usedPanels = [];
        let rootPanels = [];
        for (let name in shaderInfo.panels) {
            let info = shaderInfo.panels[name];
            let panelCtrls = [];
            info.children.map((childName) => {
                if (ctrls[childName]) {
                    panelCtrls.push(ctrls[childName]);
                } else if(panels[childName]) {
                    usedPanels.push(childName);
                    panelCtrls.push(panels[childName]);
                }
            });
            panels[name] = <UiPanel key={name} info={info} children={panelCtrls}></UiPanel>;
        }
        for (let name in shaderInfo.panels) {
            if (!usedPanels.includes(name)) {
                rootPanels.push(panels[name]);
            }
        }
        setPanelsCtrls(rootPanels);
    }

    function updateInfo(name, value) {
        updateCustomUniforValue(wglApp, name, value);
    }


    useEffect(() => {
        if (fragShaderInfo && wglApp) {
            processUniformInfo(fragShaderInfo);
        }
    }, [fragShaderInfo, wglApp]);



    return (
        <div className={styles.glslCanvasUI}>
            {panelsCtrls}
        </div>
    );

}