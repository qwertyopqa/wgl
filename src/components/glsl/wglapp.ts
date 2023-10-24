export type tickCallback = () => boolean;

export type UniformCtrlInfo = {
    type: string,
    name: string,
    value: {
        default: number,
        current: number,
    },
    ctrlID: string,
    args:number[]
}

export type FragShaderInfo = {
    version: 1|2,
    source: string,
    uniforms: {
        std: string[],
        custom: {
            [key:string]:UniformCtrlInfo
        }
    },
    panels: {
        [key:string]:any
    }
}

type Info = {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    pos: {
        vertices: Float32Array;
        vao: WebGLVertexArrayObject | null;
        vbo: WebGLBuffer | null;
    };
    canvas: HTMLCanvasElement;
    time: {
        start: number;
        elapsed: number;
        frame: number;
    };
    uniforms: {
        resolution: WebGLUniformLocation | null;
        time: WebGLUniformLocation | null;
        [key: string]: WebGLUniformLocation | null;
    };
    shader: FragShaderInfo;
    onTick: tickCallback;
};

function initPositionBuffer(gl:WebGL2RenderingContext) {
    const info = {
        vertices: new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]),
        vao: gl.createVertexArray(),
        vbo: gl.createBuffer()
    };
    gl.bindVertexArray(info.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, info.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, info.vertices, gl.STATIC_DRAW);
    return info;
}

function initVertexLayout(gl:WebGL2RenderingContext, program:WebGLProgram) {
    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function initBuffers(gl:WebGL2RenderingContext, program:WebGLProgram) {
    const pos = initPositionBuffer(gl);
    initVertexLayout(gl, program);
    return pos;
}

function addShader(gl:WebGL2RenderingContext, type:number, source:string) : WebGLShader | false {
    const shader = gl.createShader(type) as WebGLShader;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return false;
    }
    return shader;
}

function add2DVertexShader(gl:WebGL2RenderingContext) : WebGLShader {
    return addShader(
        gl,
        gl.VERTEX_SHADER,
        `#version 300 es
        precision highp float;
        in vec4 position;
        void main(void){gl_Position = position;}`
    );
}

function initShaderProgram(gl:WebGL2RenderingContext, shaderInfo:FragShaderInfo) {
    const program = gl.createProgram() as WebGLProgram;
    gl.attachShader(program, add2DVertexShader(gl));
    gl.attachShader(program, addShader(gl, gl.FRAGMENT_SHADER, shaderInfo.source));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Shader program failed to link:', gl.getProgramInfoLog(program));
        return null;
    }
    gl.useProgram(program);
    return program;
}

function getUniformsInfo(gl:WebGL2RenderingContext, shaderInfo:FragShaderInfo, program:WebGLProgram) {
    const locations:any = {};
    shaderInfo.uniforms.std.forEach((name:string) => {
        locations[name] = gl.getUniformLocation(program, name);
    });
    Object.keys(shaderInfo.uniforms.custom).forEach((name:string) => {
        locations[name] = gl.getUniformLocation(program, name);
    });
    return locations;

}

function updateUniforms(gl:WebGL2RenderingContext, info:Info) {
    info.shader.uniforms.std.map((name:string) => {
        switch(name) {
            case 'u_resolution':
                gl.uniform2f(info.uniform.u_resolution, info.canvas.width, info.canvas.height);
                break;
            case 'u_time':
                gl.uniform1f(info.uniform.u_time, info.time.elapsed * 0.001);
                break;

        }
    });
    const customU = info.shader.uniforms.custom;
    Object.keys(customU).map((name:string) => {
        const ctrl = customU[name] as UniformCtrlInfo;
        switch(ctrl.type) {
            case 'int':
                gl.uniform1i(info.uniform[name], ctrl.value.current);
                break;
            case 'float':
                gl.uniform1f(info.uniform[name], ctrl.value.current);
                break;
            case 'vec3':
                gl.uniform3fv(info.uniform[name], new Float32Array(ctrl.value.current));
                break;
        }
    });
}

export function updateCustomUniforValue(info:Info, name:string, value:number) {
    info.shader.uniforms.custom[name].value.current = value;
};

function render(gl:WebGL2RenderingContext, program:WebGLProgram, info:Info) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    info.time.elapsed = performance.now() - info.time.start;

    updateUniforms(gl, info);
    gl.bindVertexArray(info.pos.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);

    if (!info.onTick || info.onTick()) {
        requestAnimationFrame(() => {render(gl, program, info)});
    }
}


export function initGlApp(canvas:HTMLCanvasElement, shaderInfo:fragShaderInfo, onTick:tickCallback) {
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
    if (!gl) {
        console.error("Unable to initialize WebGL 2. Your browser may not support it.");
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const program = initShaderProgram(gl, shaderInfo) as WebGLProgram;

    const info:Info = {
        gl,
        program,
        pos: initBuffers(gl, program),
        canvas: canvas,
        time: {
            start: performance.now(),
            elapsed: 0,
            frame: 0
        },
        uniform: getUniformsInfo(gl, shaderInfo, program),
        shader: shaderInfo,
        onTick,
    };

    render(gl, program, info);
    return info;
}

function getFragShader(url:string, cb:Function) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
        if (xhr.status === 200) {
            cb(xhr.responseText);
        }
    };
    xhr.send();
}

function processFragShader(source:string) {
    let info:FragShaderInfo = {
        version: 1,
        uniforms: {
            std: [],
            custom: {}
        },
        panels:{},
        source,
    };
    if (source.indexOf('#version 300 es') >= 0) {
        info.version = 2;
    }
    let lines = source.split('\n').map((line:string) => {
        line = line.trim();
        if (line.indexOf('uniform ') === 0) {
            let parts = line.split(' ');
            info.uniforms.std.push(parts[2].replace(';', ''));
        } else if (line.indexOf('@uniform') > 0) {
            const reA = /^(\S*)\s?(\S*)\s*=\s*(.*)\s*;.*@uniform /.exec(line)
            const reB = /@uniform (.*)\((.*)\)/.exec(line);
            let value = reA[3];
            switch(reA[1]) {
                case 'int':
                    value = Number(value);
                    break;
                case 'float':
                    value = Number(value);
                    break;
                case 'vec3':
                    const reV = /vec3\((\S*)\s*,\s*(\S*)\s*,\s*(\S*)\)/.exec(value);
                    value = reV.splice(1, 3).map((v:string) => Number(v));
                    break;
            }
            info.uniforms.custom[reA[2]] = {
                type: reA[1],
                name: reA[2],
                value: {
                    default: value,
                    current: value,
                },
                ctrlID: reB[1],
                args: reB[2].split(',').map((s:string) => Number(s.trim()))
            };
            line = `uniform ${reA[1]} ${reA[2]};`;
        }
        if (line.indexOf('@panel ') > 0) {
            const re = /\/\/@panel \s*(V|>)\s(\S*)\s*\[(.*)\]/.exec(line);
            info.panels[re[2]] = {
                orientation: re[1],
                label: re[2],
                children: re[3].split(',').map((s:string) => s.trim())
            };
        }
        return line;
    });
    info.source = lines.join('\n');
    return info;

}

export function getAndProcessFragShader(url:string, cb:Function) {
    getFragShader(url, (source:FragShaderInfo) => {
        cb(processFragShader(source));
    });
}