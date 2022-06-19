function createImageData(ctx, width, height) {
  if (ctx.createImageData) {
    return ctx.createImageData(width, height);
  } else {
    return ctx.getImageData(0, 0, width, height);
  }
}

var changeColorWorkerStr = "\nfunction changeColor({\n    inData,\n    outData,\n    width,\n    height,\n    color,\n    progress,\n}) {\n    const n = width * height * 4;\n    let prog = 0;\n    let lastProg = 0;\n\n    for(let i = 0; i < n; i += 4) {\n        const { r, g, b } = color;\n\n        outData.data[i] = r;\n        outData.data[i + 1] = g;\n        outData.data[i + 2] = b;\n        outData.data[i + 3] = inData.data[i + 3];\n\n        if(progress) {\n            prog = (i / n * 100 >> 0) / 100;\n            if(prog > lastProg) {\n                lastProg = progress(prog);\n            }\n        }\n    }\n\n    return outData;\n}\nself.onmessage = function(e) {\n    self.postMessage(changeColor(e.data));\n};\n";
var changeColorWorkerBlob = new Blob([changeColorWorkerStr], {
  type: 'text/javascript'
});
var changeColorWorker = new Worker(window.URL.createObjectURL(changeColorWorkerBlob));

function changeImgColor(url, color) {
  return new Promise(function (resolve, reject) {
    var img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    img.onload = function () {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      changeCanvasColor(canvas, color).then(function () {
        resolve(canvas.toDataURL());
      });
    };

    img.onerror = reject;
    img.src = url;
  });
}

function changeCanvasColor(canvas, color) {
  var width = canvas.width,
      height = canvas.height;
  var ctx = canvas.getContext('2d');
  var inData = ctx.getImageData(0, 0, width, height);
  var outData = createImageData(ctx, width, height); // changeHSL({
  // inData: inData.data,
  // outData: outData.data,
  // width,
  // height,
  // options: {
  // hue: -0.04950532724505324,
  // saturation: 0.030000000000000027,
  // lightness: -0.2737254901960785
  // }
  // });

  return new Promise(function (resolve) {
    changeColorWorker.onmessage = function (e) {
      ctx.putImageData(e.data, 0, 0);
      resolve(e.data);
    };

    changeColorWorker.postMessage({
      inData: inData,
      outData: outData,
      width: width,
      height: height,
      color: color
    });
  });
}

export { changeImgColor, changeCanvasColor };