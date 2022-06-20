export const vertexShader = `
    attribute vec4 position;
    #ifdef HAS_NORMALS
        attribute vec4 normal;
    #endif

    #ifdef HAS_UV
    attribute vec2 texCoord;
    #endif
    uniform mat4 u_MVPMatrix,u_ModelMatrix,u_NormalMatrix;
    varying vec3 v_Position;
    varying vec2 v_UV;
    #ifdef HAS_NORMALS
        varying vec3 v_Normal;
    #endif
    void main() {
        vec4 v=u_ModelMatrix*position;
        v_Position=vec3(v.rgb)/v.a;

        #ifdef HAS_NORMALS
            v_Normal = normalize(vec3(u_ModelMatrix*vec4(normal.rgb,0.)));
        #endif

        #ifdef HAS_UV
            v_UV=texCoord;
        #else
            v_UV=vec2(0.,0.);
        #endif

        gl_Position=u_MVPMatrix*position;
    }
`;

export const fragmentShader = `
#extension GL_EXT_shader_texture_lod: enable
#extension GL_OES_standard_derivatives : enable

precision highp float;

struct PointLight {vec3 pos;vec3 color;};
uniform PointLight u_Lights[NR_POINT_LIGHTS];

struct HemiLight {vec3 dir; vec3 color;};
uniform HemiLight u_HemiLight;

#ifdef USE_IBL
uniform samplerCube u_DiffuseEnvSampler;
uniform samplerCube u_SpecularEnvSampler;
uniform sampler2D u_brdfLUT;
uniform vec3 u_EnvColor;
#endif

#ifdef HAS_BASECOLORMAP
uniform sampler2D u_BaseColorSampler;
uniform mat3 u_TexMat;
#endif

#ifdef USE_GRADIENT
    uniform vec3 u_BoundingBox;
    uniform vec3 u_GradientVec;
    struct gradientStops {
        vec3 color;
        float offset;
    };
    uniform gradientStops u_GradientColor[NR_GRADIENT_COLORS];
#endif

#ifdef HAS_NORMALMAP
    uniform sampler2D u_NormalSampler;
    uniform float u_NormalScale;
    uniform float u_NormalStrength;
#endif

#ifdef HAS_METALROUGHNESSMAP
    uniform sampler2D u_MetallicRoughnessSampler;
#endif


uniform vec2 u_MetallicRoughnessValues;
uniform vec4 u_BaseColorFactor;
uniform float u_BaseColorScale;

uniform vec3 u_Camera;


uniform vec4 u_ScaleDiffBaseMR;
uniform vec4 u_ScaleFGDSpec;
uniform float u_ScaleIBLAmbient;
uniform int u_Type;
uniform vec3 u_FaceColor;

varying vec3 v_Position;

varying vec2 v_UV;

#ifdef HAS_NORMALS
    varying vec3 v_Normal;
#endif

struct PBRInfo {
    float NdotL; 
    float NdotV;
    float NdotH;
    float LdotH;
    float VdotH;
    float perceptualRoughness;
    float metalness;
    vec3 reflectance0;
    vec3 reflectance90;
    float alphaRoughness;
    vec3 diffuseColor;
    vec3 specularColor;
};

const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.04;

vec4 SRGBtoLINEAR(vec4 srgbIn) {
    #ifdef MANUAL_SRGB
        #ifdef SRGB_FAST_APPROXIMATION
            vec3 linOut = pow(srgbIn.xyz, vec3(2.2));
        #else
            vec3 bLess = step(vec3(0.04045), srgbIn.xyz);
            vec3 linOut = mix(srgbIn.xyz / vec3(12.92), pow((srgbIn.xyz + vec3(0.055)) / vec3(1.055), vec3(2.4)), bLess );
        #endif
        return vec4(linOut, srgbIn.w);
    #else
        return srgbIn;
    #endif
}

vec3 getNormal() {
    vec3 pos_dx = dFdx(v_Position);
    vec3 pos_dy = dFdy(v_Position);
    vec3 tex_dx = dFdx(vec3(v_UV, 0.0));
    vec3 tex_dy = dFdy(vec3(v_UV, 0.0));
    vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

    #ifdef HAS_NORMALS
        vec3 ng = normalize(v_Normal);
    #else
        vec3 ng = cross(pos_dx, pos_dy);
    #endif

    t = normalize(t - ng * dot(ng, t));
    vec3 b = normalize(cross(ng, t));
    mat3 tbn = mat3(t, b, ng);
    #ifdef HAS_NORMALMAP
        vec3 n = texture2D(u_NormalSampler, v_UV / u_NormalScale).rgb;
        n = normalize(tbn * ((2.0 * n - 1.0) * vec3(u_NormalStrength, u_NormalStrength, 1.0)));
    #else
        vec3 n = normalize(tbn[2].xyz);
    #endif

    return n;
}

#ifdef USE_IBL
vec3 getIBLContribution(PBRInfo pbrInputs, vec3 n, vec3 reflection) {
    float mipCount = 9.0;
    float lod = (pbrInputs.perceptualRoughness * mipCount);

    vec3 brdf = texture2D(u_brdfLUT, vec2(pbrInputs.NdotV, 1.0 - pbrInputs.perceptualRoughness)).rgb;
    vec3 diffuseLight = SRGBtoLINEAR(textureCube(u_DiffuseEnvSampler, n)).rgb;

    #ifdef USE_TEX_LOD
        vec3 specularLight = SRGBtoLINEAR(textureCubeLodEXT(u_SpecularEnvSampler, reflection, lod)).rgb;
    #else
        vec3 specularLight = SRGBtoLINEAR(textureCube(u_SpecularEnvSampler, reflection)).rgb;
    #endif

    vec3 diffuse = diffuseLight * pbrInputs.diffuseColor;
    vec3 specular = specularLight * (pbrInputs.specularColor * brdf.x + brdf.y);

    return (diffuse + specular) * u_ScaleIBLAmbient;
}
vec3 getColorEnvContribution(PBRInfo pbrInputs) {
    vec3 brdf = texture2D(u_brdfLUT, vec2(pbrInputs.NdotV, 1.0 - pbrInputs.perceptualRoughness)).rgb;
    vec3 diffuse = u_EnvColor * pbrInputs.diffuseColor;
    vec3 specular = u_EnvColor * (pbrInputs.specularColor * brdf.x + brdf.y);
    return diffuse + specular;
}
#endif

float hemiIntegral(float angle1){
    float i = sin(angle1);
    return max(0.5 * i * i/(1. - cos(angle1)), 0.);
}

vec3 getHEMIContribution(PBRInfo pbrInputs, vec3 n, vec3 reflection) {
    vec3 brdf = texture2D(u_brdfLUT, vec2(pbrInputs.NdotV, 1.0 - pbrInputs.perceptualRoughness)).rgb;
    float cosAngle = dot(u_HemiLight.dir, reflection) / (length(u_HemiLight.dir) * length(reflection));
    vec3 tempColor = u_HemiLight.color *  max(cosAngle, 0.);
    vec3 specularlight =  tempColor * hemiIntegral(0.5 * M_PI);
    vec3 diffuselight =  tempColor * hemiIntegral(0.5 * M_PI * pbrInputs.perceptualRoughness) * cosAngle;

    vec3 diffuse = diffuselight * pbrInputs.diffuseColor;
    vec3 specular = specularlight * (pbrInputs.specularColor * brdf.x + brdf.y);

    return diffuse + specular;
}

vec3 diffuse(PBRInfo pbrInputs) {
    return pbrInputs.diffuseColor / M_PI;
}

vec3 specularReflection(PBRInfo pbrInputs) {
    return pbrInputs.reflectance0 + (pbrInputs.reflectance90 - pbrInputs.reflectance0) * pow(clamp(1.0 - pbrInputs.VdotH, 0.0, 1.0), 5.0);
}

float geometricOcclusion(PBRInfo pbrInputs) {
    float NdotL = pbrInputs.NdotL;
    float NdotV = pbrInputs.NdotV;
    float r = pbrInputs.alphaRoughness;

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
    return attenuationL * attenuationV;
}

float microfacetDistribution(PBRInfo pbrInputs) {
    float roughnessSq = pbrInputs.alphaRoughness * pbrInputs.alphaRoughness;
    float f = (pbrInputs.NdotH * roughnessSq - pbrInputs.NdotH) * pbrInputs.NdotH + 1.0;
    return roughnessSq / (M_PI * f * f);
}

void main() {
    float metallic = u_MetallicRoughnessValues.x;
    float perceptualRoughness = u_MetallicRoughnessValues.y;

    #ifdef HAS_METALROUGHNESSMAP
        vec4 mrSample = texture2D(u_MetallicRoughnessSampler, v_UV);
        perceptualRoughness = mrSample.g * perceptualRoughness;
        metallic = mrSample.b * metallic;
    #endif

    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);

    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    vec3 f0 = vec3(c_MinRoughness);

    vec3 baseColor0 = vec3(0);
    vec3 baseColor1 = vec3(0);
    vec3 baseColor2 = vec3(0);

    if(u_Type == 0) {
        baseColor0 = u_FaceColor;
    }
    if(u_Type == 1) {
        vec3 uv = u_TexMat * vec3(v_UV,1);
        baseColor1 = vec3(texture2D(u_BaseColorSampler, uv.xy/uv.z));
    }
    if(u_Type == 2) {
        float u_GradientVecLegth = length(u_GradientVec);
        vec3 tempVec1 = vec3(u_BoundingBox[0], u_BoundingBox[1], -u_BoundingBox[2]);
        vec3 tempVec2 = vec3(u_BoundingBox[0], -u_BoundingBox[1], u_BoundingBox[2]);
        vec3 tempVec3 = vec3(u_BoundingBox[0], -u_BoundingBox[1], -u_BoundingBox[2]);
        float radius1 = abs(dot(u_BoundingBox,u_GradientVec)/u_GradientVecLegth);
        float radius2 = abs(dot(tempVec1,u_GradientVec)/u_GradientVecLegth);
        float radius3 = abs(dot(tempVec2,u_GradientVec)/u_GradientVecLegth);
        float radius4 = abs(dot(tempVec3,u_GradientVec)/u_GradientVecLegth);
        radius1 = max(radius1,radius2);
        radius2 = max(radius3,radius4);
        float radius = max(radius1,radius2)*1.0001;

        vec3 startPoint = -radius * normalize(u_GradientVec);
        float distance = dot((v_Position.xyz - startPoint),u_GradientVec)/u_GradientVecLegth;

        float projectionLength = clamp(distance/(2.*radius), u_GradientColor[0].offset, u_GradientColor[NR_GRADIENT_COLORS-1].offset);
        vec3 colorByPos = u_GradientColor[0].color;


        for(int i = 1; i < NR_GRADIENT_COLORS; ++i) {
            if(projectionLength >= u_GradientColor[i-1].offset && projectionLength <= u_GradientColor[i].offset ){
                float gradientDegree = (projectionLength - u_GradientColor[i-1].offset)/(u_GradientColor[i].offset-u_GradientColor[i-1].offset);
                colorByPos = mix(u_GradientColor[i-1].color, u_GradientColor[i].color, gradientDegree);
                break;
            };
        };

        baseColor2 = clamp(colorByPos, vec3(0.), vec3(1.));
    }

    vec4 baseColor = vec4(baseColor0 + baseColor1 + baseColor2, 1.) * u_BaseColorFactor;

    vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);
    diffuseColor *= 1.0 - metallic;
    vec3 specularColor = mix(f0, baseColor.rgb, metallic);

    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

    vec3 n = getNormal();
    vec3 v = normalize(u_Camera - v_Position);
    vec3 reflection = -normalize(reflect(v, n));

    vec3 color = vec3(0, 0, 0);
    float NdotL, NdotV, NdotH, LdotH, VdotH;
    NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);
    PBRInfo pbrInputs;
    vec3 F;
    float G, D;
    vec3 diffuseContrib, specContrib;

    for(int i = 0; i < NR_POINT_LIGHTS; ++i) {
        vec3 l = normalize(u_Lights[i].pos - v_Position);
        vec3 h = normalize(l + v);

        NdotL = clamp(dot(n, l), 0.001, 1.0);
        NdotH = clamp(dot(n, h), 0.0, 1.0);
        LdotH = clamp(dot(l, h), 0.0, 1.0);
        VdotH = clamp(dot(v, h), 0.0, 1.0);

        pbrInputs = PBRInfo(
            NdotL,
            NdotV,
            NdotH,
            LdotH,
            VdotH,
            perceptualRoughness,
            metallic,
            specularEnvironmentR0,
            specularEnvironmentR90,
            alphaRoughness,
            diffuseColor,
            specularColor
        );

        F = specularReflection(pbrInputs);
        G = geometricOcclusion(pbrInputs);
        D = microfacetDistribution(pbrInputs);

        diffuseContrib = (1.0 - F) * diffuse(pbrInputs);
        specContrib = F * G * D / (4.0 * NdotL * NdotV);

        vec3 lightColor = NdotL * u_Lights[i].color * (diffuseContrib + specContrib);
        color += lightColor;
    }

    color += getHEMIContribution(pbrInputs, n, reflection);
    #ifdef USE_IBL
        color += length(u_EnvColor)>0. ? getColorEnvContribution(pbrInputs) : getIBLContribution(pbrInputs, n, reflection);
    #endif

    color = mix(color, F, u_ScaleFGDSpec.x);
    color = mix(color, vec3(G), u_ScaleFGDSpec.y);
    color = mix(color, vec3(D), u_ScaleFGDSpec.z);
    color = mix(color, specContrib, u_ScaleFGDSpec.w);

    color = mix(color, diffuseContrib, u_ScaleDiffBaseMR.x);
    color = mix(color, baseColor.rgb, u_ScaleDiffBaseMR.y);
    color = mix(color, vec3(metallic), u_ScaleDiffBaseMR.z);
    color = mix(color, vec3(perceptualRoughness), u_ScaleDiffBaseMR.w);

    gl_FragColor = vec4(color, baseColor.a);
}
`;
