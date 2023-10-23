#version 300 es
precision mediump float;

#define M_PI 3.1415926535897932384626433832795
#define M_PI2 6.2831853071795864769252867675590

uniform vec2 u_resolution;
out vec4 fragColor;


vec3 color_ramp = vec3(.0, .1, .2); // @uniform colorRamp()
vec3 color_ramp2 = vec3(1., .8, .6); // @uniform colorRamp()


vec3 getRamp(float p) {
    return (cos((p + color_ramp) * M_PI2) * .5 + .5 ) * color_ramp2;
}


void main()
{
    vec2 p = gl_FragCoord.xy / u_resolution.xy;
    vec3 col = getRamp(p.x);
    fragColor = vec4(col, 1.);
}