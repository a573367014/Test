// WARP bufferGeometry
// yunyang@gaoding.com

import { Vector3 } from '../math/Vector3.js';
import { Matrix3 } from '../math/Matrix3.js';
import { QuadraticBezierCurve3 } from '../extras/curves/QuadraticBezierCurve3.js';
import { LineCurve3 } from '../extras/curves/LineCurve3.js';
import { EllipseCurve } from '../extras/curves/EllipseCurve.js';
import { Box3 } from '../math/Box3.js';

export class Verbatim {
    RUN(bufferGeometry, parameters) {
        if (parameters.intensity === 0) return;
        if (
            parameters.pattern === '0' ||
            parameters.pattern === '1' ||
            parameters.pattern === '2'
        ) {
            this.runPattern0(bufferGeometry, parameters);
        } else if (
            parameters.pattern === '10' ||
            parameters.pattern === '11' ||
            parameters.pattern === '12'
        ) {
            this.runPattern1(bufferGeometry, parameters);
        } else if (
            parameters.pattern === '20' ||
            parameters.pattern === '21' ||
            parameters.pattern === '22'
        ) {
            this.runPattern2(bufferGeometry, parameters);
        } else if (
            parameters.pattern === '30' ||
            parameters.pattern === '31' ||
            parameters.pattern === '32'
        ) {
            this.runPattern3(bufferGeometry, parameters);
        } else if (parameters.pattern === '40') {
            this.runPattern4(bufferGeometry, parameters);
        } else if (parameters.pattern === '50' || parameters.pattern === '51') {
            this.runPattern5(bufferGeometry, parameters);
        } else if (parameters.pattern === '60' || parameters.pattern === '61') {
            this.runPattern6(bufferGeometry, parameters);
        } else if (parameters.pattern === '70' || parameters.pattern === '71') {
            this.runPattern7(bufferGeometry, parameters);
        } else if (parameters.pattern === '80') {
            this.runPattern8(bufferGeometry, parameters);
        } else if (parameters.pattern === '90') {
            this.runPattern9(bufferGeometry, parameters);
        }
    }

    runPattern0(bufferGeometry, parameters) {
        const positions = bufferGeometry.attributes.position.array;
        const vertexNumb = parseInt(positions.length / 3);

        const offset = new Vector3();
        if (parameters.pattern === '0') {
            offset.x = parameters.intensity;
        } else if (parameters.pattern === '1') {
            offset.y = parameters.intensity;
        } else if (parameters.pattern === '2') {
            offset.z = parameters.intensity;
        }

        const tempVect = new Vector3();
        for (let i = 0; i < vertexNumb; i++) {
            tempVect.fromArray(positions, i * 3);
            const charID = bufferGeometry.charVertexFlagArray[i];

            if (charID % 2 === 0) {
                tempVect.add(offset);
            } else {
                tempVect.sub(offset);
            }

            // bufferGeometry.vertices[i] = tempVect;
            positions[i * 3 + 0] = tempVect.x;
            positions[i * 3 + 1] = tempVect.y;
            positions[i * 3 + 2] = tempVect.z;
        }
    }

    runPattern1(bufferGeometry, parameters) {
        const positions = bufferGeometry.attributes.position.array;
        const vertexNumb = Math.fround(positions.length / 3);

        const { charCenterArrayT } = this.PerCharCalculation(bufferGeometry, parameters);
        const { intensity, pattern, maxLineWidth } = parameters;

        const offset = new Vector3();
        switch (pattern) {
            case '10':
                offset.x = 1;
                break;
            case '11':
                offset.y = 1;
                break;
            case '12':
                offset.z = 1;
                break;
        }

        const tempVect = new Vector3();
        for (let i = 0; i < vertexNumb; i++) {
            tempVect.fromArray(positions, i * 3);
            const charID = bufferGeometry.charVertexFlagArray[i];
            const scale = charCenterArrayT[charID] * 0.01 * intensity * maxLineWidth;
            tempVect.add(offset.clone().multiplyScalar(scale));

            positions[i * 3 + 0] = tempVect.x;
            positions[i * 3 + 1] = tempVect.y;
            positions[i * 3 + 2] = tempVect.z;
        }
    }

    runPattern2(bufferGeometry, parameters) {
        const { charCenterArrayT } = this.PerCharCalculation(bufferGeometry, parameters);
        const { intensity, pattern, maxLineWidth } = parameters;
        const positions = bufferGeometry.attributes.position.array;
        const vertexNumb = Math.fround(positions.length / 3);
        const offset = new Vector3();

        const val = intensity * 0.002 * maxLineWidth; // -100~100 -> -0.2maxWidth ~ 0.2maxWidth
        switch (pattern) {
            case '20':
                offset.x = val;
                break;
            case '21':
                offset.y = val;
                break;
            case '22':
                offset.z = val;
                break;
        }

        for (let i = 0; i < vertexNumb; i++) {
            const charID = bufferGeometry.charVertexFlagArray[i];
            const charIDT = charCenterArrayT[charID];
            const newOffset = offset.clone();
            newOffset.multiplyScalar(Math.sin(charIDT * Math.PI));

            positions[i * 3 + 0] += newOffset.x;
            positions[i * 3 + 1] += newOffset.y;
            positions[i * 3 + 2] += newOffset.z;
        }
    }

    runPattern3(bufferGeometry, parameters) {
        const positions = bufferGeometry.attributes.position.array;
        const vertexNumb = parseInt(positions.length / 3);

        const { charCenterArrayT } = this.PerCharCalculation(bufferGeometry, parameters);

        const offset = new Vector3();
        if (parameters.pattern === '30') {
            offset.x = parameters.intensity;
        } else if (parameters.pattern === '31') {
            offset.y = parameters.intensity;
        } else if (parameters.pattern === '32') {
            offset.z = parameters.intensity;
        }

        for (let i = 0; i < vertexNumb; i++) {
            const charID = bufferGeometry.charVertexFlagArray[i];
            const charIDT = charCenterArrayT[charID]; // + parameters.offsetX;// charID / bufferGeometry.charVertexFlagArray[bufferGeometry.charVertexFlagArray.length-1];  //[0,1]
            // bufferGeometry.vertices[i].add(offset.clone().multiplyScalar(Math.sin(charIDT*Math.PI*2)));// = tempVect;
            const finalOffset = offset.clone().multiplyScalar(Math.sin(charIDT * Math.PI * 2)); // = tempVect;
            positions[i * 3 + 0] += finalOffset.x;
            positions[i * 3 + 1] += finalOffset.y;
            positions[i * 3 + 2] += finalOffset.z;
        }
    }

    runPattern4(bufferGeometry, parameters) {
        const positions = bufferGeometry.attributes.position.array;
        const vertexNumb = parseInt(positions.length / 3);

        const scale = 0.1;

        const offsetArray = [];
        const tempVect = new Vector3();
        for (let i = 0; i < vertexNumb; i++) {
            // tempVect = bufferGeometry.vertices[i].clone();//new Vector3();
            tempVect.fromArray(positions, i * 3);
            const charID = bufferGeometry.charVertexFlagArray[i];

            if (offsetArray[charID] === undefined) {
                const offset = new Vector3();
                offset.y = (Math.random() * 2 - 1) * parameters.intensity * scale;
                offset.z = (Math.random() * 2 - 1) * parameters.intensity * scale;
                offsetArray[charID] = offset;
            }
            tempVect.add(offsetArray[charID]);
            // bufferGeometry.vertices[i] = tempVect;
            positions[i * 3 + 0] = tempVect.x;
            positions[i * 3 + 1] = tempVect.y;
            positions[i * 3 + 2] = tempVect.z;
        }
    }

    runPattern5(bufferGeometry, parameters) {
        const positions = bufferGeometry.attributes.position.array;
        const vertexNumb = parseInt(positions.length / 3);

        const { charCenterArray } = this.PerCharCalculation(bufferGeometry, parameters);

        const tempVect = new Vector3();
        let rotateAxis = new Vector3(0, 1, 0);
        if (parameters.pattern === '50') {
            rotateAxis = new Vector3(0, 1, 0);
        } else if (parameters.pattern === '51') {
            rotateAxis = new Vector3(0, 0, 1);
        }

        for (let i = 0; i < vertexNumb; i++) {
            const charID = bufferGeometry.charVertexFlagArray[i];
            // tempVect = bufferGeometry.vertices[i].clone();//new Vector3();
            tempVect.fromArray(positions, i * 3);
            tempVect.sub(charCenterArray[charID]);
            tempVect.applyAxisAngle(rotateAxis, (parameters.intensity / 180) * Math.PI);
            tempVect.add(charCenterArray[charID]);
            positions[i * 3 + 0] = tempVect.x;
            positions[i * 3 + 1] = tempVect.y;
            positions[i * 3 + 2] = tempVect.z;
        }
    }

    runPattern6(bufferGeometry, parameters) {
        const positions = bufferGeometry.attributes.position.array;
        const vertexNumb = parseInt(positions.length / 3);

        const scale = 0.1;

        const { charCenterArray } = this.PerCharCalculation(bufferGeometry, parameters);

        const rotateAxisArray = [];
        const tempVect = new Vector3();

        for (let i = 0; i < vertexNumb; i++) {
            const charID = bufferGeometry.charVertexFlagArray[i];
            // tempVect = bufferGeometry.vertices[i].clone();//new Vector3();

            tempVect.fromArray(positions, i * 3);
            tempVect.sub(charCenterArray[charID]);
            if (rotateAxisArray[charID] === undefined) {
                const rotateAxis = new Vector3(
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                );
                rotateAxis.normalize();
                rotateAxisArray[charID] = rotateAxis;
            }
            tempVect.applyAxisAngle(
                rotateAxisArray[charID],
                (parameters.intensity / 180) * Math.PI * scale,
            );
            // bufferGeometry.vertices[i] = tempVect.add(charCenterArray[charID]);
            tempVect.add(charCenterArray[charID]);
            positions[i * 3 + 0] = tempVect.x;
            positions[i * 3 + 1] = tempVect.y;
            positions[i * 3 + 2] = tempVect.z;
        }
    }

    runPattern7(bufferGeometry, parameters) {
        const positions = bufferGeometry.attributes.position.array;
        const vertexNumb = parseInt(positions.length / 3);

        const { center, minX, maxX, charCenterArray, charCenterArrayT, bboxPerLine } =
            this.PerCharCalculation(bufferGeometry, parameters);

        // let transformationMatrixArray = [];
        const translationArray = [];
        const rotationMatrixArray = [];

        // let v0, v1, v2, v3;
        // v0 =  new Vector3(minX, center.y, center.z);
        // v1 =  new Vector3((minX+center.x)/2, center.y + parameters.intensity, center.z);
        // v2 =  new Vector3((maxX+center.x)/2, center.y + parameters.intensity, center.z);
        // v3 =  new Vector3(maxX, center.y, center.z);
        // let curve = new CubicBezierCurve3(v0, v1, v2, v3);

        const charCount =
            bufferGeometry.charVertexFlagArray[bufferGeometry.charVertexFlagArray.length - 1] + 1;
        for (let i = 0; i < charCount; i++) {
            const charID = i; // bufferGeometry.charVertexFlagArray[i];
            const lineNumb = parameters.charPosDatas[charID].rowNum;
            const thisLineBbox = bboxPerLine[lineNumb];
            const thisLineCenter = new Vector3();
            thisLineBbox.getCenter(thisLineCenter);
            //
            // calculate translation from curve
            //
            let v0, v1, v2;
            if (parameters.pattern === '70') {
                v0 = new Vector3(minX, thisLineCenter.y, thisLineCenter.z);
                v1 = new Vector3(
                    center.x,
                    thisLineCenter.y + parameters.intensity,
                    thisLineCenter.z,
                );
                v2 = new Vector3(maxX, thisLineCenter.y, thisLineCenter.z);
            } else if (parameters.pattern === '71') {
                v0 = new Vector3(minX, thisLineCenter.y, thisLineCenter.z);
                v1 = new Vector3(
                    center.x,
                    thisLineCenter.y,
                    thisLineCenter.z + parameters.intensity,
                );
                v2 = new Vector3(maxX, thisLineCenter.y, thisLineCenter.z);
            }
            const curve = new QuadraticBezierCurve3(v0, v1, v2);
            const lineCurve = new LineCurve3(
                new Vector3(minX, thisLineCenter.y, thisLineCenter.z),
                new Vector3(maxX, thisLineCenter.y, thisLineCenter.z),
            );

            const charIDT = charCenterArrayT[i]; // + parameters.offsetX;// (charID+0.5 ) / (charCount);  //[0,1]
            // if(charCount === 1) charIDT = 0.5;
            if (translationArray[charID] === undefined) {
                const { x, y, z } = charCenterArray[charID];
                const newVec = new Vector3(x, y, z);
                const localOffset = newVec.sub(lineCurve.getPoint(charIDT));
                const centerOffset = curve
                    .getPointAt(charIDT)
                    .clone()
                    .sub(charCenterArray[charID])
                    .add(localOffset);
                let xAxis, yAxis, zAxis;
                if (parameters.pattern === '70') {
                    xAxis = curve.getTangentAt(charIDT).normalize();
                    zAxis = new Vector3(0, 0, 1);
                    yAxis = zAxis.clone().cross(xAxis).normalize();
                } else if (parameters.pattern === '71') {
                    xAxis = curve.getTangentAt(charIDT).normalize();
                    yAxis = new Vector3(0, 1, 0);
                    zAxis = xAxis.clone().cross(yAxis).normalize();
                }
                // let transformationMatrix = new Matrix4();
                // transformationMatrix.makeBasis(xAxis, yAxis, zAxis);                                                                                                      //todo
                // transformationMatrix.setPosition(centerOffset);
                translationArray[charID] = centerOffset;

                const rotationMatrix = new Matrix3();
                rotationMatrix.set(
                    xAxis.x,
                    xAxis.y,
                    xAxis.z,
                    yAxis.x,
                    yAxis.y,
                    yAxis.z,
                    zAxis.x,
                    zAxis.y,
                    zAxis.z,
                );
                rotationMatrix.transpose();
                rotationMatrixArray[charID] = rotationMatrix;
            }
        }

        //
        // Apply transformation for each vertex
        //
        const tempVect = new Vector3();
        for (let i = 0; i < vertexNumb; i++) {
            const charID = bufferGeometry.charVertexFlagArray[i];
            // let charIDT = (charID+0.5) / charCount;  //[0,1]

            tempVect.fromArray(positions, i * 3);
            tempVect.sub(charCenterArray[charID]);
            tempVect.applyMatrix3(rotationMatrixArray[charID]);
            tempVect.add(charCenterArray[charID]);
            tempVect.add(translationArray[charID]);

            // bufferGeometry.vertices[i] = tempVect;
            positions[i * 3 + 0] = tempVect.x;
            positions[i * 3 + 1] = tempVect.y;
            positions[i * 3 + 2] = tempVect.z;
        }

        // this.curve = curve;
    }

    runPattern8(bufferGeometry, parameters) {
        const positions = bufferGeometry.attributes.position.array;
        const vertexNumb = parseInt(positions.length / 3);

        const { intensity, randNum } = parameters;

        const { charCenterArray } = this.PerCharCalculation(bufferGeometry, parameters);

        const rotateAxisArray = [];
        const offsetArray = [];

        for (let i = 0; i < vertexNumb; i++) {
            const charID = bufferGeometry.charVertexFlagArray[i];
            const newVertice = new Vector3();
            newVertice.fromArray(positions, i * 3);
            newVertice.sub(charCenterArray[charID]);

            if (rotateAxisArray[charID] === undefined) {
                const rotateAxis = new Vector3(
                    this.getRandom(randNum + charID * Math.E),
                    this.getRandom(randNum + (charID + 1) * Math.E),
                    this.getRandom(randNum + (charID + 2) * Math.E),
                );
                rotateAxis.normalize();
                rotateAxisArray[charID] = rotateAxis;
            }

            if (offsetArray[charID] === undefined) {
                const offset = new Vector3(
                    0,
                    this.getRandom(randNum + charID * Math.SQRT2) * intensity,
                    this.getRandom(randNum + (charID + 1) * Math.SQRT2) * intensity,
                );
                offsetArray[charID] = offset;
            }
            // parameters.intensity1 的取值范围为 -50～50
            newVertice.applyAxisAngle(
                rotateAxisArray[charID],
                (parameters.intensity1 / 50) * Math.PI,
            );
            newVertice.add(offsetArray[charID]);
            // bufferGeometry.vertices[i] = newVertice[i].add(charCenterArray[charID]);
            newVertice.add(charCenterArray[charID]);
            positions[i * 3 + 0] = newVertice.x;
            positions[i * 3 + 1] = newVertice.y;
            positions[i * 3 + 2] = newVertice.z;
        }
    }

    // Circular path
    // parameters.intensity: radius, range (0,unlimited]
    // parameters.intensity1: pertentage of circle will be occupied, range (0,100]
    // NOTE: multiple lines of text are not well supported for this pattern.
    runPattern9(bufferGeometry, parameters) {
        const positions = bufferGeometry.attributes.position.array;
        const vertexNumb = parseInt(positions.length / 3);
        const { center, charCenterArray, charCenterArrayT } = this.PerCharCalculation(
            bufferGeometry,
            parameters,
        );

        const radius = parameters.intensity * 10;
        const startAngle = 1.5 * Math.PI - (1 - parameters.intensity1 / 100) * Math.PI;
        const endAngle = -0.5 * Math.PI + (1 - parameters.intensity1 / 100) * Math.PI;
        const curve = new EllipseCurve(
            center.x,
            center.y, // ax, aY
            radius,
            radius, // xRadius, yRadius
            startAngle,
            endAngle, // aStartAngle, aEndAngle
            true, // aClockwise
            0, // aRotation
        );
        const translationArray = [];
        const rotationMatrixArray = [];
        const charCount =
            bufferGeometry.charVertexFlagArray[bufferGeometry.charVertexFlagArray.length - 1] + 1;
        for (let i = 0; i < charCount; i++) {
            const charID = i;
            let CharIDt = charCenterArrayT[i];
            if (charCount === 1) CharIDt = 0.5;
            if (translationArray[charID] === undefined) {
                const pos2D = curve.getPoint(CharIDt);
                const centerOffset = new Vector3(pos2D.x, pos2D.y, 0).sub(charCenterArray[charID]);

                const xAxis2D = curve.getTangentAt(CharIDt).normalize();
                const xAxis = new Vector3(xAxis2D.x, xAxis2D.y, 0);
                const zAxis = new Vector3(0, 0, 1);
                const yAxis = zAxis.clone().cross(xAxis).normalize();

                translationArray[charID] = centerOffset;

                const rotationMatrix = new Matrix3();
                rotationMatrix.set(
                    xAxis.x,
                    xAxis.y,
                    xAxis.z,
                    yAxis.x,
                    yAxis.y,
                    yAxis.z,
                    zAxis.x,
                    zAxis.y,
                    zAxis.z,
                );
                rotationMatrix.transpose();
                rotationMatrixArray[charID] = rotationMatrix;
            }
        }

        //
        // Apply transformation for each vertex
        //
        const newVertice = new Vector3();
        for (let i = 0; i < vertexNumb; i++) {
            const charID = bufferGeometry.charVertexFlagArray[i];
            newVertice.fromArray(positions, i * 3);
            newVertice.sub(charCenterArray[charID]);
            newVertice.applyMatrix3(rotationMatrixArray[charID]);
            newVertice.add(charCenterArray[charID]);
            newVertice.add(translationArray[charID]);
            positions[i * 3 + 0] = newVertice.x;
            positions[i * 3 + 1] = newVertice.y;
            positions[i * 3 + 2] = newVertice.z;
        }
        this.curve = curve;
    }

    // using the per character calculation info from bufferGeometry
    PerCharCalculation(bufferGeometry, parameters) {
        const center = new Vector3();
        bufferGeometry.boundingBox.getCenter(center);
        const { charCenterArray, charCenterArrayT, charBBoxArray } = bufferGeometry;
        const { x: minX, y: minY, z: minZ } = bufferGeometry.boundingBox.min;
        const { x: maxX, y: maxY, z: maxZ } = bufferGeometry.boundingBox.max;

        //
        // Calculate PerLine BBox
        //
        const bboxPerLine = [];
        // Iterate all char
        for (let i = 0; i < parameters.charPosDatas.length; i++) {
            const lineNumb = parameters.charPosDatas[i].rowNum;
            bboxPerLine[lineNumb] = bboxPerLine[lineNumb] || new Box3();
            bboxPerLine[lineNumb].union(charBBoxArray[i]);
        }

        return {
            center,
            minX,
            maxX,
            minY,
            maxY,
            minZ,
            maxZ,
            charCenterArray,
            charCenterArrayT,
            charBBoxArray,
            bboxPerLine,
        };
    }

    // 根据一个数返回（-1，1之间的伪随机数）
    getRandom(num) {
        // 我也不明白为什么要用这样一个数,看别人这么用的；
        const tempNum = Math.sin(num) * 43758.5453123;
        return tempNum - Math.trunc(tempNum);
    }
}
