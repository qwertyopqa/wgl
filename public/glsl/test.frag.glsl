#version 300 es
precision mediump float;

#define M_PI 3.1415926535897932384626433832795
#define M_PI2 6.2831853071795864769252867675590

uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

int divs = 4; // @uniform slider(1,16,1)
int iterations = 8; // @uniform slider(1,20,1)
float main_rotation = .0; // @uniform slider(-1,1,.1)
vec3 color_ramp = vec3(.1, .2, .3); // @uniform colorRamp()
vec3 color_ramp2 = vec3(1., .8, .6); // @uniform colorRamp()

float n_sin(float x) {
    return sin(x) * .5 + .5;
}
float n_tri(float x) {
    float m1 = mod(x, .5);
    float m2 = mod(x, 1.);
    return m2 < .5 ?  m1 : .5 - m1;
}

vec3 getRamp(float p) {
    return (cos((p + color_ramp) * M_PI2) * .5 + .5 ) * color_ramp2;
}

void _cNP(inout vec2 p, inout float a, float s ) {
    float tp = n_sin((u_time + s * -.1 ) * .5 + s * .1  ) ;
    float ti = n_sin(u_time * .25) ;

    //p -= vec2(n_sin(ti * M_PI2), n_sin(tp / s)) / s;
    p -= vec2(.2 + ti * .3 - s * .1, ti * .4 + s * -.1) / s * .6;
    a = atan(p.y, p.x) - M_PI * tp;
    //a = atan(p.y, p.x) + (M_PI + M_PI * tp / s * 2.1) + s * .1 - .7 ;
    p = vec2(cos(a), sin(a)) * length(p);
}

void _ocNP(inout vec2 p, inout float a,  float s) {
    float warpFactor = 1.;
    float ti = n_sin(u_time * .05 * s * .5) ;
    warpFactor -= ti;
    vec2 tp = vec2(.4 + ti * .1, ti * -.2 - length(p)) / (s * 1.2);
    float tpa = atan(tp.y, tp.x) + a;
    p -= vec2(cos(tpa), sin(tpa)) * length(tp) * warpFactor;
    a = atan(p.y, p.x) + (M_PI );
    p = vec2(cos(a), sin(a)) * length(p);
    a = mod(a + M_PI2, M_PI2);
}

void colorize(inout vec3 col, vec2 p, float i, float a) {
    if (p.x > 0.) {
        float len = length(p);
        col += ( p.y >= .0 && p.y < .002) ? vec3(.25) : vec3(.0);

        col += ( p.y >= .0 && p.y < .01) ? vec3(.5 * (3. - i)) * (.05 + i * .001) : vec3(.005);

        //col += ( p.y >= .0 && p.y < 0.011 && p.x > 0.) ? vec3(.1) : vec3(.0);

        col += getRamp(len * (.2 * (i/(p.y < 0. ? 0.01 * len : 1.))) + n_sin(u_time * .2) + i * .6 ) * (.2 * sign(p.y*p.x*p.x) + .01);

        col += ( p.y >= .0 && p.y < 0.01 / (i * .5 + 2.)) ? vec3(p.x,p.y,0) : vec3(.0);
    }
}


vec3 getIteratorColor(vec2 p) {
    vec3 col = (p.x > 0. && p.y < 0.0001) ? vec3(.1) : vec3(.0);
    float a = 0.;
    for (float i = 0.; i < float(iterations); i += 1.) {
        if (mod(i, 2.) < 1.) {
            _cNP(p, a, i + 1.);
        } else {
            _ocNP(p, a, i + 1.);
        }
        colorize(col, p, i, a);
    }
    return col;
}

void getQuadrantColor(vec2 p, float a, inout vec3 col) {
    float divS = M_PI2 / (float(divs) * 2.);

    float l = length(p);
    //a += sin(u_time * 2.) * (.5 - l) * .5 ;
    a = mod(a , M_PI2);
    float q = floor(a / divS);
    float s = 1.;
    for (float i = 0.; i < float(divs) * 2.; i += 1.) {
        if (q == i) {
            a -= i * divS - (s * .5 - .5) * divS;
            a = mod(a, M_PI2);
            p = vec2(cos(a), sin(a)) * l ;
            p.y *= s;
            col = getIteratorColor(p);
        }
        s *= -1.;
    }
}

void main()
{
    vec2 p = gl_FragCoord.xy / u_resolution.x - vec2(.5) * vec2(1., u_resolution.y / u_resolution.x);
    float a = atan(p.y, p.x) + M_PI * .5 + u_time * main_rotation;
    vec3 col = vec3(0.);
    getQuadrantColor(p, a, col);
    fragColor = vec4(col, 1.);
}