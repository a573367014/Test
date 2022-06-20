export const vertexShader = `
attribute vec4 a_Position;
#ifdef HAS_NORMALS
attribute vec4 a_Normal;
#endif
#ifdef HAS_TANGENTS
attribute vec4 a_Tangent;
#endif
#ifdef HAS_UV
attribute vec2 a_UV;
#endif
uniform mat4 u_MVPMatrix,u_ModelMatrix,u_NormalMatrix;varying vec3 v_Position;varying vec2 v_UV;
#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
varying mat3 v_TBN;
#else
varying vec3 v_Normal;
#endif
#endif
void main(){vec4 v=u_ModelMatrix*a_Position;v_Position=vec3(v.rgb)/v.a;
#ifdef HAS_NORMALS

#ifdef HAS_TANGENTS
vec3 H=normalize(vec3(u_NormalMatrix*vec4(a_Normal.rgb,0.))),u=normalize(vec3(u_ModelMatrix*vec4(a_Tangent.rgb,0.))),b=cross(H,u)*a_Tangent.a;v_TBN=mat3(u,b,H);
#else
v_Normal=normalize(vec3(u_ModelMatrix*vec4(a_Normal.rgb,0.)));
#endif

#endif

#ifdef HAS_UV
v_UV=a_UV;
#else
v_UV=vec2(0.,0.);
#endif
gl_Position=u_MVPMatrix*a_Position;}
`;

export const fragmentShader = `
#extension GL_EXT_shader_texture_lod:enable
#extension GL_OES_standard_derivatives:enable
#define NR_POINT_LIGHTS 3

precision highp float;
struct PointLight{vec3 pos;vec3 color;float strength;};uniform PointLight u_Lights[NR_POINT_LIGHTS];
#ifdef USE_IBL
uniform samplerCube u_DiffuseEnvSampler,u_SpecularEnvSampler;uniform sampler2D u_brdfLUT;
#endif
#ifdef HAS_BASECOLORMAP
uniform sampler2D u_BaseColorSampler;
#endif
#ifdef HAS_NORMALMAP
uniform sampler2D u_NormalSampler;uniform float u_NormalScale;
#endif
#ifdef HAS_EMISSIVEMAP
uniform sampler2D u_EmissiveSampler;uniform vec3 u_EmissiveFactor;
#endif
#ifdef HAS_METALROUGHNESSMAP
uniform sampler2D u_MetallicRoughnessSampler;
#endif
#ifdef HAS_OCCLUSIONMAP
uniform sampler2D u_OcclusionSampler;uniform float u_OcclusionStrength;
#endif
uniform vec2 u_MetallicRoughnessValues;uniform vec4 u_BaseColorFactor;uniform float u_BaseColorScale;uniform vec3 u_Camera;uniform vec4 u_ScaleDiffBaseMR,u_ScaleFGDSpec,u_ScaleIBLAmbient;varying vec3 v_Position;varying vec2 v_UV;
#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
varying mat3 v_TBN;
#else
varying vec3 v_Normal;
#endif
#endif
struct PBRInfo{float NdotL;float NdotV;float NdotH;float LdotH;float VdotH;float perceptualRoughness;float metalness;vec3 reflectance0;vec3 reflectance90;float alphaRoughness;vec3 diffuseColor;vec3 specularColor;};const float u=3.14159,v=.04;
vec4 m(vec4 u){
#ifdef MANUAL_SRGB // here
#ifdef SRGB_FAST_APPROXIMATION
vec3 H=pow(u.rgb,vec3(2.2));
#else
vec3 v=step(vec3(.04045),u.rgb),r=mix(u.rgb/vec3(12.92),pow((u.rgb+vec3(.055))/vec3(1.055),vec3(2.4)),v);
#endif
return vec4(r,u.a);
#else
return u;
#endif
}
vec3 m(){
#ifndef HAS_TANGENTS
vec3 u=dFdx(v_Position),v=dFdy(v_Position),t=dFdx(vec3(v_UV,0.)),c=dFdy(vec3(v_UV,0.)),r=(c.g*u-t.g*v)/(t.r*c.g-c.r*t.g);
#ifdef HAS_NORMALS
vec3 s=normalize(v_Normal);
#else
vec3 s=cross(u,v);
#endif
r=normalize(r-s*dot(s,r));vec3 b=normalize(cross(s,r));mat3 P=mat3(r,b,s);
#else
mat3 P=v_TBN;
#endif

#ifdef HAS_NORMALMAP
vec3 N=texture2D(u_NormalSampler,v_UV).rgb;N=normalize(P*((2.*N-1.)*vec3(u_NormalScale,u_NormalScale,1.)));
#else
vec3 N=normalize(P[2].rgb);
#endif
return N;}
#ifdef USE_IBL
vec3 m(PBRInfo u,vec3 v,vec3 r){float H=9.,b=u.perceptualRoughness*H;vec3 s=m(texture2D(u_brdfLUT,vec2(u.NdotV,1.-u.perceptualRoughness))).rgb,c=m(textureCube(u_DiffuseEnvSampler,v)).rgb;
#ifdef USE_TEX_LOD
vec3 n=m(textureCubeLodEXT(u_SpecularEnvSampler,r,b)).rgb;
#else
vec3 n=m(textureCube(u_SpecularEnvSampler,r)).rgb;
#endif
vec3 f=c*u.diffuseColor,g=n*(u.specularColor*s.r+s.g);f*=u_ScaleIBLAmbient.r;g*=u_ScaleIBLAmbient.g;return f+g;}
#endif
vec3 x(PBRInfo v){return v.diffuseColor/u;}vec3 H(PBRInfo u){return u.reflectance0+(u.reflectance90-u.reflectance0)*pow(clamp(1.-u.VdotH,0.,1.),5.);}float s(PBRInfo u){float v=u.NdotL,r=u.NdotV,b=u.alphaRoughness,H=2.*v/(v+sqrt(b*b+(1.-b*b)*(v*v))),s=2.*r/(r+sqrt(b*b+(1.-b*b)*(r*r)));return H*s;}float p(PBRInfo v){float H=v.alphaRoughness*v.alphaRoughness,r=(v.NdotH*H-v.NdotH)*v.NdotH+1.;return H/(u*r*r);}void main(){float u=u_MetallicRoughnessValues.g,r=u_MetallicRoughnessValues.r;
#ifdef HAS_METALROUGHNESSMAP
vec4 c=texture2D(u_MetallicRoughnessSampler,v_UV);u=c.g*u;r=c.b*r;
#endif
u=clamp(u,v,1.);r=clamp(r,0.,1.);float b=u*u;
#ifdef HAS_BASECOLORMAP
vec4 n=m(texture2D(u_BaseColorSampler,v_UV/u_BaseColorScale))*u_BaseColorFactor;
#else
vec4 n=u_BaseColorFactor;
#endif
vec3 P=vec3(.04),g=n.rgb*(vec3(1.)-P);g*=1.-r;vec3 t=mix(P,n.rgb,r);float N=max(max(t.r,t.g),t.b),V=clamp(N*25.,0.,1.);vec3 U=t.rgb,e=vec3(1.,1.,1.)*V,a=m(),d=normalize(u_Camera-v_Position),l=-normalize(reflect(d,a)),i=vec3(0,0,0);float L,R,T,o,h;PBRInfo S;vec3 G;float M,A;vec3 B,E;for(int I=0;I<NR_POINT_LIGHTS;++I){vec3 O=normalize(u_Lights[I].pos-v_Position),D=normalize(O+d);L=clamp(dot(a,O),.001,1.);R=clamp(abs(dot(a,d)),.001,1.);T=clamp(dot(a,D),0.,1.);o=clamp(dot(O,D),0.,1.);h=clamp(dot(d,D),0.,1.);S=PBRInfo(L,R,T,o,h,u,r,U,e,b,g,t);G=H(S);M=s(S);A=p(S);B=(1.-G)*x(S);E=G*M*A/(4.*L*R);vec3 C=L*u_Lights[I].color*(B+E);C*=u_Lights[I].strength;i+=C;}
#ifdef USE_IBL
i+=m(S,a,l);
#endif

#ifdef HAS_OCCLUSIONMAP
float O=texture2D(u_OcclusionSampler,v_UV).r;i=mix(i,i*O,u_OcclusionStrength);
#endif

#ifdef HAS_EMISSIVEMAP
vec3 C=m(texture2D(u_EmissiveSampler,v_UV)).rgb*u_EmissiveFactor;i+=C;
#endif
i=mix(i,G,u_ScaleFGDSpec.r);i=mix(i,vec3(M),u_ScaleFGDSpec.g);i=mix(i,vec3(A),u_ScaleFGDSpec.b);i=mix(i,E,u_ScaleFGDSpec.a);i=mix(i,B,u_ScaleDiffBaseMR.r);i=mix(i,n.rgb,u_ScaleDiffBaseMR.g);i=mix(i,vec3(r),u_ScaleDiffBaseMR.b);i=mix(i,vec3(u),u_ScaleDiffBaseMR.a);gl_FragColor=vec4(i.rgb,n.a);}

`;
