const ResourceTypes = {
  DataBuffers: "DataBuffers",
  IndexBuffer: "IndexBuffer",
  Uniforms: "Uniforms",
  Textures: "Textures",
  OffscreenTarget: "OffscreenTarget"
};
const SchemaTypes = {
  vec4: "vec4",
  vec3: "vec3",
  vec2: "vec2",
  int: "int",
  float: "float",
  mat4: "mat4",
  mat3: "mat3",
  mat2: "mat2",
  tex2D: "tex2D",
  texCube: "texCube"
};
const GLTypes = {
  Triangles: "Triangles",
  Lines: "Lines",
  Repeat: "Repeat",
  MirroredRepeat: "MirroredRepeat",
  ClampToEdge: "ClampToEdge",
  Nearest: "Nearest",
  Linear: "Linear",
  NearestMipmapNearest: "NearestMipmapNearest",
  LinearMipmapNearest: "LinearMipmapNearest",
  NearestMipmapLinear: "NearestMipmapLinear",
  LinearMipmapLinear: "LinearMipmapLinear",
  RGB: "RGB",
  RGBA: "RGBA",
  SRGB: "SRGB"
};
const RendererConfig = {
  contextAttributes: {},
  extensions: ["OES_element_index_uint", "WEBGL_depth_texture"]
};
const isPowerOf2 = (value) => (value & value - 1) === 0;
const mapValue = (obj, valueMapper) => Object.keys(obj).reduce((newObj, key) => ({
  ...newObj,
  [key]: valueMapper(obj, key)
}), {});
const getNumComponents = (bufferType) => {
  const {
    vec2,
    vec3,
    vec4,
    float
  } = SchemaTypes;
  const mapping = {
    [vec2]: 2,
    [vec3]: 3,
    [vec4]: 4,
    [float]: 1
  };
  return mapping[bufferType];
};
const groupResources = (resources) => {
  const Types = ResourceTypes;
  let [dataBuffers, indexResource, uniforms, textures] = [{}, null, {}, {}];
  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];
    const {
      type
    } = resource;
    if (type === Types.DataBuffers) {
      dataBuffers = {
        ...dataBuffers,
        ...resource.buffers
      };
    } else if (type === Types.IndexBuffer) {
      indexResource = resource;
    } else if (type === Types.Uniforms) {
      uniforms = {
        ...uniforms,
        ...resource.state
      };
    } else if (type === Types.Textures) {
      textures = {
        ...textures,
        ...resource.textures
      };
    }
  }
  return [dataBuffers, indexResource, uniforms, textures];
};
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const getWebGLInstance = (canvas) => {
  return canvas.getContext("webgl");
};
const getExtensions = (gl, config) => {
  const extensions = {};
  config.extensions.forEach((name) => {
    extensions[name] = gl.getExtension(name);
  });
  return extensions;
};
const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Error compiling shaders", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};
const initShader = (gl, defines, vs, fs) => {
  const defineStr = Object.keys(defines).reduce((str, key) => defines[key] ? str + `#define ${key} ${defines[key]}
` : "", "");
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, defineStr + vs);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, defineStr + fs);
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error("Error initing program", gl.getProgramInfoLog(shaderProgram));
    return null;
  }
  return shaderProgram;
};
const initShaderRefs = (gl, defines, schema, vs, fs) => {
  const program = initShader(gl, defines, vs, fs);
  const attributes = mapValue(schema.buffers, (attributes2, key) => ({
    type: attributes2[key].type,
    location: gl.getAttribLocation(program, key)
  }));
  const uniforms = mapValue({
    ...schema.uniforms,
    ...schema.textures
  }, (uniforms2, key) => ({
    type: uniforms2[key].type,
    location: gl.getUniformLocation(program, key)
  }));
  return {
    program,
    attributes,
    uniforms
  };
};
const clear = (gl, color) => {
  const [r, g, b, a] = color;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(r, g, b, a);
  gl.clearDepth(1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
};
const initDataBuffers = (gl, state) => {
  const buffers = {};
  const bufferKeys = Object.keys(state);
  bufferKeys.forEach((key) => {
    const buffer = gl.createBuffer();
    buffers[key] = buffer;
    updateDataBuffer(gl, buffers[key], state[key]);
  });
  return buffers;
};
const updateDataBuffer = (gl, buffer, array) => {
  const data = array instanceof Float32Array ? array : new Float32Array(array);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
};
const destroyDataBuffer = (gl, buffer) => {
  gl.deleteBuffer(buffer);
};
const initIndexBuffer = (gl, state) => {
  const {
    array
  } = state;
  const buffer = gl.createBuffer();
  updateIndexBuffer(gl, buffer, array);
  return buffer;
};
const updateIndexBuffer = (gl, buffer, array) => {
  const data = array instanceof Uint32Array ? array : new Uint32Array(array);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
};
const destroyIndexBuffer = (gl, buffer) => {
  gl.deleteBuffer(buffer);
};
const compatSRGB = (gl) => {
  const {
    extensions
  } = gl;
  return !isSafari && extensions.EXT_SRGB ? extensions.EXT_SRGB.SRGB_EXT : gl.RGBA;
};
const compatSRGBA = (gl) => {
  const {
    extensions
  } = gl;
  return !isSafari && extensions.EXT_SRGB ? extensions.EXT_SRGB.SRGB_ALPHA_EXT : gl.RGBA;
};
const nativeTypeHOF = (gl) => (type) => {
  const map = {
    [GLTypes.Repeat]: gl.REPEAT,
    [GLTypes.MirroredRepeat]: gl.MIRRORED_REPEAT,
    [GLTypes.ClampToEdge]: gl.CLAMP_TO_EDGE,
    [GLTypes.Linear]: gl.LINEAR,
    [GLTypes.Nearest]: gl.NEAREST,
    [GLTypes.NearestMipmapNearest]: gl.NEAREST_MIPMAP_NEAREST,
    [GLTypes.LinearMipmapNearest]: gl.LINEAR_MIPMAP_NEAREST,
    [GLTypes.NearestMipmapLinear]: gl.NEAREST_MIPMAP_LINEAR,
    [GLTypes.LinearMipmapLinear]: gl.LINEAR_MIPMAP_LINEAR,
    [GLTypes.RGB]: gl.RGB,
    [GLTypes.RGBA]: gl.RGBA,
    [GLTypes.SRGB]: compatSRGB(gl),
    [GLTypes.SRGBA]: compatSRGBA(gl)
  };
  return map[type];
};
const init2DTexture = (gl, val) => {
  const texture = gl.createTexture();
  update2DTexture(gl, texture, val);
  return texture;
};
const initCubeTexture = (gl, val) => {
  const texture = gl.createTexture();
  updateCubeTexture(gl, texture, val);
  return texture;
};
const initTextures = (gl, state) => {
  const textures = {};
  Object.keys(state).forEach((key) => {
    const texture = state[key].image ? init2DTexture(gl, state[key]) : initCubeTexture(gl, state[key]);
    textures[key] = texture;
  });
  return textures;
};
const supportMipmap = (image) => image && isPowerOf2(image.width) && isPowerOf2(image.height) && image.nodeName !== "VIDEO";
const update2DTexture = (gl, texture, val) => {
  const native = nativeTypeHOF(gl);
  const {
    image,
    flip,
    space
  } = val;
  let {
    wrapS,
    wrapT,
    minFilter,
    magFilter
  } = val;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  if (image) {
    if (flip)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const s = native(space || GLTypes.RGBA);
    gl.texImage2D(gl.TEXTURE_2D, 0, s, s, gl.UNSIGNED_BYTE, image);
    if (supportMipmap(image))
      gl.generateMipmap(gl.TEXTURE_2D);
    if (!supportMipmap(image)) {
      if (!wrapS)
        wrapS = GLTypes.ClampToEdge;
      if (!wrapT)
        wrapT = GLTypes.ClampToEdge;
      if (!minFilter)
        minFilter = GLTypes.Linear;
    }
  }
  if (wrapS)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, native(wrapS));
  if (wrapT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, native(wrapT));
  if (minFilter) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, native(minFilter));
  }
  if (magFilter) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, native(magFilter));
  }
  return texture;
};
const updateCubeTexture = (gl, texture, val) => {
  const native = nativeTypeHOF(gl);
  const {
    images,
    level,
    flip,
    wrapS,
    wrapT,
    minFilter,
    magFilter,
    space
  } = val;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  if (wrapS) {
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, native(wrapS));
  }
  if (wrapT) {
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, native(wrapT));
  }
  if (minFilter) {
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, native(minFilter));
  }
  if (magFilter) {
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, native(magFilter));
  }
  if (images) {
    if (flip)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const faces = [gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
    let count = 0;
    const s = native(space || GLTypes.RGBA);
    for (let i = 0; i < faces.length; i++) {
      for (let j = 0; j <= level; j++) {
        const face = faces[i];
        gl.texImage2D(face, j, s, s, gl.UNSIGNED_BYTE, images[count]);
        count++;
      }
    }
  }
  return texture;
};
const destroyTexture = (gl, texture) => {
  gl.deleteTexture(texture);
};
const initColorOffscreen = (gl, state) => {
  const fbo = gl.createFramebuffer();
  const rbo = gl.createRenderbuffer();
  const colorTexture = gl.createTexture();
  const depthTexture = null;
  const {
    size
  } = state;
  gl.bindTexture(gl.TEXTURE_2D, colorTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);
  const e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (gl.FRAMEBUFFER_COMPLETE !== e) {
    console.error("Frame buffer object is incomplete: " + e.toString());
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  return {
    fbo,
    rbo,
    colorTexture,
    depthTexture
  };
};
const initDepthOffscreen = (gl, state) => {
  const {
    size
  } = state;
  const fbo = gl.createFramebuffer();
  const rbo = null;
  const colorTexture = gl.createTexture();
  const depthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, colorTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
  const e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (e !== gl.FRAMEBUFFER_COMPLETE) {
    console.error("framebuffer not complete", e.toString());
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return {
    fbo,
    rbo,
    colorTexture,
    depthTexture
  };
};
const initOffscreen = (gl, state) => {
  if (state.depth)
    return initDepthOffscreen(gl, state);
  else
    return initColorOffscreen(gl, state);
};
const padDefault = (schema, key, val) => {
  return val !== void 0 ? val : schema.uniforms[key].default;
};
const draw = (gl, plugin, dataBuffers, indexResource, uniforms, textures) => {
  const {
    schema,
    shaderRefs
  } = plugin;
  gl.useProgram(shaderRefs.program);
  Object.keys(shaderRefs.attributes).forEach((key) => {
    if (!schema.buffers[key] || schema.buffers[key].type === SchemaTypes.index)
      return;
    const {
      location
    } = shaderRefs.attributes[key];
    const {
      n,
      type
    } = schema.buffers[key];
    const numComponents = n || getNumComponents(type);
    gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffers[key]);
    gl.vertexAttribPointer(location, numComponents, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
  });
  const {
    buffer,
    state
  } = indexResource;
  const {
    offset,
    count
  } = state;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  let unit = -1;
  Object.keys(shaderRefs.uniforms).forEach((key) => {
    const {
      type,
      location
    } = shaderRefs.uniforms[key];
    let val;
    const isTexure = type === SchemaTypes.tex2D || type === SchemaTypes.texCube;
    if (!isTexure) {
      val = padDefault(schema, key, uniforms[key]);
    }
    const uniformSetterMapping = {
      [SchemaTypes.vec4]: () => gl.uniform4fv(location, val),
      [SchemaTypes.vec3]: () => gl.uniform3fv(location, val),
      [SchemaTypes.vec2]: () => gl.uniform2fv(location, val),
      [SchemaTypes.int]: () => {
        !val || typeof val === "number" || typeof val === "string" ? gl.uniform1i(location, val) : gl.uniform1iv(location, val);
      },
      [SchemaTypes.float]: () => {
        !val || typeof val === "number" || typeof val === "string" ? gl.uniform1f(location, val) : gl.uniform1fv(location, val);
      },
      [SchemaTypes.mat4]: () => gl.uniformMatrix4fv(location, false, val),
      [SchemaTypes.mat3]: () => gl.uniformMatrix3fv(location, false, val),
      [SchemaTypes.mat2]: () => gl.uniformMatrix2fv(location, false, val),
      [SchemaTypes.tex2D]: () => {
        unit++;
        const texture = textures[key];
        if (!texture)
          console.warn(`Missing texture ${key} at unit ${unit}`);
        gl.uniform1i(location, unit);
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
      },
      [SchemaTypes.texCube]: () => {
        unit++;
        const texture = textures[key];
        if (!texture)
          console.warn(`Missing texture ${key} at unit ${unit}`);
        gl.uniform1i(location, unit);
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      }
    };
    if (val !== void 0 || isTexure)
      uniformSetterMapping[type]();
  });
  const drawMode = schema.mode === GLTypes.Triangles ? gl.TRIANGLES : gl.LINES;
  gl.drawElements(drawMode, count, gl.UNSIGNED_INT, offset * 4);
};
class ShadePlugin {
  constructor(beam, pluginTemplate) {
    this.beam = beam;
    const {
      buffers = {},
      uniforms = {},
      textures = {},
      mode = GLTypes.Triangles
    } = pluginTemplate;
    this.schema = {
      buffers,
      uniforms,
      textures,
      mode
    };
    const {
      vs,
      fs,
      defines = {}
    } = pluginTemplate;
    this.shaderRefs = initShaderRefs(beam.gl, defines, this.schema, vs, fs);
  }
  set() {
  }
}
const createResource = (gl, type, state) => {
  const Types = ResourceTypes;
  class Resource {
    constructor() {
      this.state = state;
      this.type = type;
    }
    set(key, val) {
      this.state[key] = val;
      return this;
    }
  }
  class DataBuffersResource extends Resource {
    constructor() {
      super();
      this.buffers = initDataBuffers(gl, state);
    }
    set(key, val) {
      this.state[key] = val;
      updateDataBuffer(gl, this.buffers[key], val);
      return this;
    }
    destroy(key) {
      destroyDataBuffer(gl, this.buffers[key]);
      delete this.state[key];
    }
  }
  class IndexBufferResource extends Resource {
    constructor() {
      super();
      const {
        offset = 0,
        count = state.array.length
      } = state;
      this.state.offset = offset;
      this.state.count = count;
      this.buffer = initIndexBuffer(gl, state);
    }
    set(state2) {
      const {
        offset = 0,
        count = state2.array.length
      } = state2;
      this.state.offset = offset;
      this.state.count = count;
      updateIndexBuffer(gl, this.buffer, state2.array);
      return this;
    }
    destroy() {
      destroyIndexBuffer(gl, this.buffer);
      delete this.state;
    }
  }
  class UniformsResource extends Resource {
  }
  class TexturesResource extends Resource {
    constructor() {
      super();
      this.textures = initTextures(gl, state);
    }
    set(key, val) {
      const {
        textures,
        state: state2
      } = this;
      const oldVal = state2[key];
      let texture;
      if (val.constructor.name !== "Object") {
        const offscreenTarget = val;
        texture = offscreenTarget.state.depth ? offscreenTarget.depthTexture : offscreenTarget.colorTexture;
      } else if (oldVal) {
        const newVal = {
          ...val,
          flip: oldVal.flip,
          space: val.space || oldVal.space
        };
        if (oldVal.image) {
          texture = update2DTexture(gl, textures[key], newVal);
        } else {
          texture = updateCubeTexture(gl, textures[key], newVal);
        }
      } else {
        texture = val.image ? init2DTexture(gl, val) : initCubeTexture(gl, val);
      }
      textures[key] = texture;
      state2[key] = {
        ...state2[key],
        ...val
      };
      return this;
    }
    destroy(key) {
      destroyTexture(gl, this.textures[key]);
      delete this.state[key];
    }
  }
  class OffscreenTargetResource extends Resource {
    constructor() {
      super();
      const {
        size = 2048
      } = this.state;
      this.state.size = size;
      const {
        fbo,
        rbo,
        colorTexture,
        depthTexture
      } = initOffscreen(gl, state);
      this.fbo = fbo;
      this.rbo = rbo;
      this.colorTexture = colorTexture;
      this.depthTexture = depthTexture;
    }
  }
  const resourceCreatorMap = {
    [Types.DataBuffers]: () => new DataBuffersResource(),
    [Types.IndexBuffer]: () => new IndexBufferResource(),
    [Types.Uniforms]: () => new UniformsResource(),
    [Types.Textures]: () => new TexturesResource(),
    [Types.OffscreenTarget]: () => new OffscreenTargetResource()
  };
  return resourceCreatorMap[type]();
};
class Beam {
  constructor(canvas, config = {}) {
    this.gl = getWebGLInstance(canvas);
    this.config = {
      ...RendererConfig,
      ...config
    };
    this.gl.extensions = getExtensions(this.gl, this.config);
  }
  clear(color = [0, 0, 0, 0]) {
    clear(this.gl, color);
    return this;
  }
  draw(plugin, ...resources) {
    const groupedResources = groupResources(resources);
    draw(this.gl, plugin, ...groupedResources);
    return this;
  }
  plugin(pluginTemplate) {
    const plugin = new ShadePlugin(this, pluginTemplate);
    return plugin;
  }
  resource(type, state = {}) {
    return createResource(this.gl, type, state);
  }
  define({
    name,
    onBefore,
    onAfter
  }) {
    this[name] = (arg, modifier = () => {
    }) => {
      if (onBefore)
        onBefore(this.gl, arg);
      modifier(arg);
      if (onAfter)
        onAfter(this.gl, arg);
      return this;
    };
  }
}
class BeamRenderer {
  constructor(canvas) {
    this.beam = new Beam(canvas);
  }
  render() {
    this.beam.clear();
  }
}
const beforeWithColor = (gl, resource) => {
  const {
    state,
    colorTexture,
    fbo,
    rbo
  } = resource;
  const {
    size
  } = state;
  gl.viewport(0, 0, size, size);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};
const beforeWithDepth = (gl, resource) => {
  const {
    state,
    fbo
  } = resource;
  const {
    size
  } = state;
  gl.viewport(0, 0, size, size);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.clear(gl.DEPTH_BUFFER_BIT);
};
const Offscreen2DCommand = {
  name: "offscreen2D",
  onBefore(gl, resource) {
    const {
      depth
    } = resource.state;
    depth ? beforeWithDepth(gl, resource) : beforeWithColor(gl, resource);
  },
  onAfter(gl) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
  }
};
export { Beam, BeamRenderer, GLTypes, Offscreen2DCommand, ResourceTypes, SchemaTypes };
