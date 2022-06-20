import { Vector2 } from '../math/Vector2.js';
import { Vector3 } from '../math/Vector3.js';
import { Box3 } from '../math/Box3.js';
import { EventDispatcher } from './EventDispatcher.js';
import {
    BufferAttribute,
    Float32BufferAttribute,
    Uint16BufferAttribute,
    Uint32BufferAttribute,
} from './BufferAttribute.js';
import { DirectGeometry } from './DirectGeometry.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Matrix3 } from '../math/Matrix3.js';
import { _Math } from '../math/Math.js';
import { arrayMax } from '../utils.js';
import { debug } from '../../../utils';

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mrdoob / http://mrdoob.com/
 */

let bufferGeometryId = 1; // BufferGeometry uses odd numbers as Id

function BufferGeometry() {
    Object.defineProperty(this, 'id', { value: (bufferGeometryId += 2) });

    this.uuid = _Math.generateUUID();

    this.name = '';
    this.type = 'BufferGeometry';

    this.index = null;
    this.attributes = {};

    this.morphAttributes = {};

    this.groups = [];

    this.boundingBox = null;
    this.boundingSphere = null;

    this.drawRange = { start: 0, count: Infinity };

    this.userData = {};

    // yunyang
    this.charVertexFlagArray = [];
    this.charCenterArray = [];
    this.charCenterArrayT = [];
    this.charVertexCountArray = [];
    this.charBBoxArray = [];
}

BufferGeometry.prototype = Object.assign(Object.create(EventDispatcher.prototype), {
    constructor: BufferGeometry,

    isBufferGeometry: true,

    getIndex: function () {
        return this.index;
    },

    setIndex: function (index) {
        if (Array.isArray(index)) {
            this.index = new (
                arrayMax(index) > 65535 ? Uint32BufferAttribute : Uint16BufferAttribute
            )(index, 1);
        } else {
            this.index = index;
        }
    },

    setIndexYunyang: function (index) {
        if (Array.isArray(index)) {
            this.index = new Uint32BufferAttribute(index, 1);
        } else {
            this.index = index;
        }
    },

    addAttribute: function (name, attribute) {
        if (
            !(attribute && attribute.isBufferAttribute) &&
            !(attribute && attribute.isInterleavedBufferAttribute)
        ) {
            console.warn('THREE.BufferGeometry: .addAttribute() now expects ( name, attribute ).');

            return this.addAttribute(name, new BufferAttribute(arguments[1], arguments[2]));
        }

        if (name === 'index') {
            console.warn('THREE.BufferGeometry.addAttribute: Use .setIndex() for index attribute.');
            this.setIndex(attribute);

            return this;
        }

        this.attributes[name] = attribute;

        return this;
    },

    getAttribute: function (name) {
        return this.attributes[name];
    },

    removeAttribute: function (name) {
        delete this.attributes[name];

        return this;
    },

    addGroup: function (start, count, materialIndex) {
        this.groups.push({
            start: start,
            count: count,
            materialIndex: materialIndex !== undefined ? materialIndex : 0,
        });
    },

    clearGroups: function () {
        this.groups = [];
    },

    setDrawRange: function (start, count) {
        this.drawRange.start = start;
        this.drawRange.count = count;
    },

    applyMatrix: function (matrix) {
        const position = this.attributes.position;

        if (position !== undefined) {
            matrix.applyToBufferAttribute(position);
            position.needsUpdate = true;
        }

        const normal = this.attributes.normal;

        if (normal !== undefined) {
            const normalMatrix = new Matrix3().getNormalMatrix(matrix);

            normalMatrix.applyToBufferAttribute(normal);
            normal.needsUpdate = true;
        }

        if (this.boundingBox !== null) {
            this.computeBoundingBox();
        }

        if (this.boundingSphere !== null) {
            this.computeBoundingSphere();
        }

        return this;
    },

    translate: (function () {
        // translate geometry

        const m1 = new Matrix4();

        return function translate(x, y, z) {
            m1.makeTranslation(x, y, z);

            this.applyMatrix(m1);

            return this;
        };
    })(),

    scale: (function () {
        // scale geometry

        const m1 = new Matrix4();

        return function scale(x, y, z) {
            m1.makeScale(x, y, z);

            this.applyMatrix(m1);

            return this;
        };
    })(),

    center: (function () {
        const offset = new Vector3();

        return function center() {
            this.computeBoundingBox();

            this.boundingBox.getCenter(offset).negate();

            this.translate(offset.x, offset.y, offset.z);

            return this;
        };
    })(),

    setFromObject: function (object) {
        // debug.log( 'THREE.BufferGeometry.setFromObject(). Converting', object, this );

        const geometry = object.geometry;

        if (object.isPoints || object.isLine) {
            const positions = new Float32BufferAttribute(geometry.vertices.length * 3, 3);

            this.addAttribute('position', positions.copyVector3sArray(geometry.vertices));

            if (
                geometry.lineDistances &&
                geometry.lineDistances.length === geometry.vertices.length
            ) {
                const lineDistances = new Float32BufferAttribute(geometry.lineDistances.length, 1);

                this.addAttribute('lineDistance', lineDistances.copyArray(geometry.lineDistances));
            }

            if (geometry.boundingSphere !== null) {
                this.boundingSphere = geometry.boundingSphere.clone();
            }

            if (geometry.boundingBox !== null) {
                this.boundingBox = geometry.boundingBox.clone();
            }
        } else if (object.isMesh) {
            if (geometry && geometry.isGeometry) {
                this.fromGeometry(geometry);
            }
        }

        return this;
    },

    setFromPoints: function (points) {
        const position = [];

        for (let i = 0, l = points.length; i < l; i++) {
            const point = points[i];
            position.push(point.x, point.y, point.z || 0);
        }

        this.addAttribute('position', new Float32BufferAttribute(position, 3));

        return this;
    },

    fromGeometry: function (geometry) {
        geometry.__directGeometry = new DirectGeometry().fromGeometry(geometry);

        return this.fromDirectGeometry(geometry.__directGeometry);
    },

    computeBoundingBox: function () {
        if (!this.boundingBox) {
            this.boundingBox = new Box3();
        }

        const { position } = this.attributes;

        if (position !== undefined) {
            this.boundingBox.setFromBufferAttribute(position);
        } else {
            this.boundingBox.makeEmpty();
        }

        if (
            isNaN(this.boundingBox.min.x) ||
            isNaN(this.boundingBox.min.y) ||
            isNaN(this.boundingBox.min.z)
        ) {
            console.error(
                'THREE.BufferGeometry.computeBoundingBox: Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',
                this,
            );
        }
    },

    computeFaceNormals: function () {
        // backwards compatibility
    },

    computeVertexNormals: function () {
        const index = this.index;
        const attributes = this.attributes;

        if (attributes.position) {
            const positions = attributes.position.array;

            if (attributes.normal === undefined) {
                this.addAttribute(
                    'normal',
                    new BufferAttribute(new Float32Array(positions.length), 3),
                );
            } else {
                // reset existing normals to zero

                const array = attributes.normal.array;

                for (let i = 0, il = array.length; i < il; i++) {
                    array[i] = 0;
                }
            }

            const normals = attributes.normal.array;

            let vA, vB, vC;
            const pA = new Vector3();
            const pB = new Vector3();
            const pC = new Vector3();
            const cb = new Vector3();
            const ab = new Vector3();

            // indexed elements

            if (index) {
                const indices = index.array;

                for (let i = 0, il = index.count; i < il; i += 3) {
                    vA = indices[i + 0] * 3;
                    vB = indices[i + 1] * 3;
                    vC = indices[i + 2] * 3;

                    pA.fromArray(positions, vA);
                    pB.fromArray(positions, vB);
                    pC.fromArray(positions, vC);

                    cb.subVectors(pC, pB);
                    ab.subVectors(pA, pB);
                    cb.cross(ab);

                    normals[vA] += cb.x;
                    normals[vA + 1] += cb.y;
                    normals[vA + 2] += cb.z;

                    normals[vB] += cb.x;
                    normals[vB + 1] += cb.y;
                    normals[vB + 2] += cb.z;

                    normals[vC] += cb.x;
                    normals[vC + 1] += cb.y;
                    normals[vC + 2] += cb.z;
                }
            } else {
                // non-indexed elements (unconnected triangle soup)

                for (let i = 0, il = positions.length; i < il; i += 9) {
                    pA.fromArray(positions, i);
                    pB.fromArray(positions, i + 3);
                    pC.fromArray(positions, i + 6);

                    cb.subVectors(pC, pB);
                    ab.subVectors(pA, pB);
                    cb.cross(ab);

                    normals[i] = cb.x;
                    normals[i + 1] = cb.y;
                    normals[i + 2] = cb.z;

                    normals[i + 3] = cb.x;
                    normals[i + 4] = cb.y;
                    normals[i + 5] = cb.z;

                    normals[i + 6] = cb.x;
                    normals[i + 7] = cb.y;
                    normals[i + 8] = cb.z;
                }
            }

            this.normalizeNormals();

            attributes.normal.needsUpdate = true;
        }
    },

    computeVertexNormals4TextgeometryYunyang: function (shadingSmoothAngle) {
        // debug.log("START computeVertexNormals4TextgeometryYunyang");
        const attributes = this.attributes;

        if (attributes.position) {
            const positions = attributes.position.array;

            if (attributes.normal === undefined) {
                this.addAttribute(
                    'normal',
                    new BufferAttribute(new Float32Array(positions.length), 3),
                );
            } else {
                // reset existing normals to zero

                const array = attributes.normal.array;

                for (let i = 0, il = array.length; i < il; i++) {
                    array[i] = 0;
                }
            }

            const normals = attributes.normal.array;

            // let vA, vB, vC;
            // let pA = new Vector3(), pB = new Vector3(), pC = new Vector3();
            // let cb = new Vector3(), ab = new Vector3();

            // let floatPointNumb = 3;
            // non-indexed elements (unconnected triangle soup)
            // let normalMap = new Map();
            const faceIdAndNormalMap = {}; // new Map();
            const positionIdAndKeyMap = {}; // new Map();
            // let positionIdAndFaceIdMap = {};//new Map();
            const KeyAndPositionIdMap = {}; // new Map();

            // iterate points
            // debug.log("iterate points");
            const pA = new Vector3();
            const materialIDs = [];
            for (let i = 0, il = positions.length; i < il; i += 3) {
                pA.fromArray(positions, i);
                const id = i / 3;

                let materialId = -1;
                for (let gId = 0; gId < this.groups.length; gId++) {
                    if (
                        id >= this.groups[gId].start &&
                        id <= this.groups[gId].start + this.groups[gId].count - 1
                    ) {
                        materialId = this.groups[gId].materialIndex;
                        break;
                    }
                }
                if (materialId === -1) {
                    console.log('material_id === -1');
                }

                if (materialId === 2) materialId = 1;

                materialIDs.push(materialId);

                // let key = pA.x.toFixed(floatPointNumb)+'+'+pA.y.toFixed(floatPointNumb)+'+'+pA.z.toFixed(floatPointNumb)+'+'+ material_id;//+ pB.x+pB.y+pB.z+ pC.x+pC.y+pC.z;
                const key =
                    '' +
                    Math.floor(pA.x * 10000) +
                    Math.floor(pA.y * 10000) +
                    Math.floor(pA.z * 10000) +
                    materialId;
                // normalMap.set(key, new Vector3(0,0,0));
                // positionIdAndKeyMap.set(id, key);
                positionIdAndKeyMap[id] = key;
                if (!KeyAndPositionIdMap[key]) {
                    KeyAndPositionIdMap[key] = [];
                }
                KeyAndPositionIdMap[key].push(id);
            }
            // debug.log("iterate points");

            // iterate faces
            // debug.log("iterate faces");
            // let pA = new Vector3();
            const pB = new Vector3();
            const pC = new Vector3();
            for (let i = 0, il = positions.length; i < il; i += 9) {
                // let vA, vB, vC;
                const cb = new Vector3();
                const ab = new Vector3();
                pA.fromArray(positions, i);
                pB.fromArray(positions, i + 3);
                pC.fromArray(positions, i + 6);

                cb.subVectors(pC, pB);
                ab.subVectors(pA, pB);
                cb.cross(ab);

                cb.normalize();

                const faceId = ~~(i / 9);
                faceIdAndNormalMap[faceId] = cb;
                // positionIdAndFaceIdMap[id1] = faceId;
                // positionIdAndFaceIdMap[id2] = faceId;
                // positionIdAndFaceIdMap[id3] = faceId;
            }
            // debug.log("iterate faces");

            // assign normal to each point
            // debug.log("assign normal to each point");
            const rad2degree = 180 / Math.PI;
            for (let i = 0, il = positions.length; i < il; i += 3) {
                const thisPositionId = i / 3;
                const key = positionIdAndKeyMap[thisPositionId];
                const thisFaceId = parseInt(thisPositionId / 3); // positionIdAndFaceIdMap[thisPositionId];
                const thisNormal = faceIdAndNormalMap[thisFaceId];
                const sumNormal = new Vector3(0, 0, 0);

                const positionIdList = KeyAndPositionIdMap[key];
                for (let m = 0; m < positionIdList.length; m++) {
                    // if(positionIdList[m] == thisPositionId) continue;
                    const faceId = parseInt(positionIdList[m] / 3); // positionIdAndFaceIdMap[positionIdList[m]];
                    const faceNormal = faceIdAndNormalMap[faceId];
                    const angle = thisNormal.angleTo(faceNormal) * rad2degree;
                    if (angle < shadingSmoothAngle) {
                        sumNormal.add(faceNormal);
                    }
                    // debug.log(i, m, thisNormal, faceNormal, angle);
                }

                // cb = thisNormal;//normalMap.get(positionIdAndKeyMap.get(id));
                sumNormal.normalize();
                normals[i] = sumNormal.x;
                normals[i + 1] = sumNormal.y;
                normals[i + 2] = sumNormal.z;
            }
            // debug.log("assign normal to each point");

            // debug.log("normalizeNormals");
            // this.normalizeNormals();
            // debug.log("normalizeNormals");

            attributes.normal.needsUpdate = true;
        }
    },

    // PreCalculation: function ( parameters )
    perCharCalculation: function () {
        // console.time('perCharCalculation');
        const attributes = this.attributes;
        const positions = attributes.position.array;
        const vertexNumb = parseInt(positions.length / 3);

        // let center= new Vector3();// minX, maxX, minY, maxY, minZ, maxZ;
        // [ center, minX, maxX, minY, maxY, minZ, maxZ] = this.CalculateBoundingBoxAndCenter(geometry);

        if (this.boundingBox === null) {
            this.computeBoundingBox();
        }
        const center = new Vector3();
        this.boundingBox.getCenter(center);
        const minX = this.boundingBox.min.x;
        const maxX = this.boundingBox.max.x;

        // let charCenterArray = [];//= new Array(geometry.charVertexFlagArray[geometry.charVertexFlagArray.length-1]);
        // let charVertexCountArray = [];
        // let charCenterArrayT = [];
        //
        // calculate center and bbx for each char
        //
        for (let i = 0; i < vertexNumb; i++) {
            // newVertices[i] = geometry.vertices[i].clone();//new Vector3();
            const charID = this.charVertexFlagArray[i];
            if (this.charBBoxArray[charID] === undefined) {
                this.charBBoxArray[charID] = new Box3();
            }
            if (this.charCenterArray[charID] === undefined) {
                this.charCenterArray[charID] = new Vector3();
            }
            const tempPosition = new Vector3();
            tempPosition.fromArray(positions, i * 3);
            // this.charCenterArray[charID].add(tempPosition);// geometry.vertices[i]);
            this.charBBoxArray[charID].expandByPoint(tempPosition);
            if (this.charVertexCountArray[charID] === undefined) {
                this.charVertexCountArray[charID] = 0;
            }
            this.charVertexCountArray[charID] = this.charVertexCountArray[charID] + 1;
        }

        for (let i = 0; i < this.charVertexCountArray.length; i++) {
            const charID = i;
            // this.charCenterArray[i].divideScalar(this.charVertexCountArray[i]);
            this.charBBoxArray[charID].getCenter(this.charCenterArray[charID]);
            // this.charCenterArray[i].y = center.y;
            // charCenterArrayT.push( (charCenterArray[i].x- minX) / ( maxX - minX) + parameters.offsetX);
            this.charCenterArrayT.push((this.charCenterArray[charID].x - minX) / (maxX - minX));
        }
        // return [center, minX, maxX, minY, maxY, minZ, maxZ, charCenterArray, charCenterArrayT]
        // console.timeEnd('perCharCalculation');
    },

    mergeSameVertex: function () {
        debug.time('mergeSameVertex');
        const attributes = this.attributes;

        const positions = attributes.position.array;
        const normals = attributes.normal.array;
        const uvs = attributes.uv.array;

        debug.log('before merge the vertex number is ' + positions.length);
        // debug.log(positions);
        // debug.log(normals);
        // debug.log(uvs);

        // if ( attributes.normal === undefined ) {
        // this.addAttribute( 'normal', new BufferAttribute( new Float32Array( positions.length ), 3 ) );

        // } else {

        // // reset existing normals to zero

        // let array = attributes.normal.array;

        // for ( let i = 0, il = array.length; i < il; i ++ ) {

        // array[ i ] = 0;

        // }

        // }

        const indexNumb = parseInt(positions.length / 3);

        // let faceIdAndNormalMap = {};//new Map();
        // let positionIdAndKeyMap = {};//new Map();
        // let positionIdAndFaceIdMap = {};//new Map();
        const KeyAndPositionIdMap = {}; // new Map();

        // iterate points

        const newIndex = [];

        const newPositions = [];
        const newNormals = [];
        const newUvs = [];
        const newCharVertexFlagArray = []; // [];
        let newIndexCount = 0;
        for (let i = 0; i < indexNumb; i++) {
            const tempPosition = new Vector3();
            const tempNormal = new Vector3();
            const tempUv = new Vector2();
            const tempCharVertexFlag = this.charVertexFlagArray[i];
            tempPosition.fromArray(positions, i * 3);
            tempNormal.fromArray(normals, i * 3);
            tempUv.fromArray(uvs, i * 2);

            let materialId = 1;
            for (let gId = 0; gId < this.groups.length; gId = gId + 2) {
                if (
                    i >= this.groups[gId].start &&
                    i <= this.groups[gId].start + this.groups[gId].count - 1
                ) {
                    materialId = 0;
                    break;
                }
            }

            // let key = pA.x.toFixed(floatPointNumb)+'+'+pA.y.toFixed(floatPointNumb)+'+'+pA.z.toFixed(floatPointNumb)+'+'+ material_id;//+ pB.x+pB.y+pB.z+ pC.x+pC.y+pC.z;
            const key =
                '' +
                Math.floor(tempPosition.x * 10000) +
                Math.floor(tempPosition.y * 10000) +
                Math.floor(tempPosition.z * 10000) +
                Math.floor(tempNormal.x * 10000) +
                Math.floor(tempNormal.y * 10000) +
                Math.floor(tempNormal.z * 10000) +
                Math.floor(tempUv.x * 10000) +
                Math.floor(tempUv.y * 10000) +
                materialId;

            if (!KeyAndPositionIdMap[key]) {
                KeyAndPositionIdMap[key] = newIndexCount;

                newPositions.push(tempPosition);
                newNormals.push(tempNormal);
                newUvs.push(tempUv);

                newIndex.push(newIndexCount);
                newIndexCount++;

                newCharVertexFlagArray.push(tempCharVertexFlag);
            } else {
                newIndex.push(KeyAndPositionIdMap[key]);
            }
        }

        // let newIndexBufferAttribute = new Uint32BufferAttribute( new Uint32Array( newIndex.length ), 1 );
        // newIndexBufferAttribute.copyArray( newIndex );

        const newPositionBufferAttribute = new Float32BufferAttribute(
            new Float32Array(newPositions.length * 3),
            3,
        );
        newPositionBufferAttribute.copyVector3sArray(newPositions);
        const newNormalBufferAttribute = new Float32BufferAttribute(
            new Float32Array(newPositions.length * 3),
            3,
        );
        newNormalBufferAttribute.copyVector3sArray(newNormals);
        const newUvBufferAttribute = new Float32BufferAttribute(
            new Float32Array(newUvs.length * 2),
            2,
        );
        newUvBufferAttribute.copyVector2sArray(newUvs);

        this.setIndexYunyang(newIndex);

        attributes.position.copy(newPositionBufferAttribute);
        attributes.normal.copy(newNormalBufferAttribute);
        attributes.uv.copy(newUvBufferAttribute);

        attributes.position.needsUpdate = true;
        attributes.normal.needsUpdate = true;
        attributes.uv.needsUpdate = true;

        this.charVertexFlagArray = newCharVertexFlagArray;

        debug.log('after merge the vertex number is : ' + newPositions.length);
        // debug.log(this.index);
        // debug.log(newPositionBufferAttribute);
        // debug.log(newNormalBufferAttribute);
        // debug.log(newUvBufferAttribute);

        debug.timeEnd('mergeSameVertex');
    },

    merge: function (geometry, offset) {
        if (!(geometry && geometry.isBufferGeometry)) {
            console.error(
                'THREE.BufferGeometry.merge(): geometry not an instance of THREE.BufferGeometry.',
                geometry,
            );
            return;
        }

        if (offset === undefined) {
            offset = 0;

            console.warn(
                'THREE.BufferGeometry.merge(): Overwriting original geometry, starting at offset=0. ' +
                    'Use BufferGeometryUtils.mergeBufferGeometries() for lossless merge.',
            );
        }

        const attributes = this.attributes;

        for (const key in attributes) {
            if (geometry.attributes[key] === undefined) continue;

            const attribute1 = attributes[key];
            const attributeArray1 = attribute1.array;

            const attribute2 = geometry.attributes[key];
            const attributeArray2 = attribute2.array;

            const attributeSize = attribute2.itemSize;

            for (let i = 0, j = attributeSize * offset; i < attributeArray2.length; i++, j++) {
                attributeArray1[j] = attributeArray2[i];
            }
        }

        return this;
    },

    normalizeNormals: (function () {
        const vector = new Vector3();

        return function normalizeNormals() {
            const normals = this.attributes.normal;

            for (let i = 0, il = normals.count; i < il; i++) {
                vector.x = normals.getX(i);
                vector.y = normals.getY(i);
                vector.z = normals.getZ(i);

                vector.normalize();

                normals.setXYZ(i, vector.x, vector.y, vector.z);
            }
        };
    })(),

    toNonIndexed: function () {
        if (this.index === null) {
            console.warn('THREE.BufferGeometry.toNonIndexed(): Geometry is already non-indexed.');
            return this;
        }

        const geometry2 = new BufferGeometry();

        const indices = this.index.array;
        const attributes = this.attributes;

        for (const name in attributes) {
            const attribute = attributes[name];

            const array = attribute.array;
            const itemSize = attribute.itemSize;

            const array2 = new array.constructor(indices.length * itemSize);

            let index = 0;
            let index2 = 0;

            for (let i = 0, l = indices.length; i < l; i++) {
                index = indices[i] * itemSize;

                for (let j = 0; j < itemSize; j++) {
                    array2[index2++] = array[index++];
                }
            }

            geometry2.addAttribute(name, new BufferAttribute(array2, itemSize));
        }

        const groups = this.groups;

        for (let i = 0, l = groups.length; i < l; i++) {
            const group = groups[i];
            geometry2.addGroup(group.start, group.count, group.materialIndex);
        }

        return geometry2;
    },

    toJSON: function () {
        const data = {
            metadata: {
                version: 4.5,
                type: 'BufferGeometry',
                generator: 'BufferGeometry.toJSON',
            },
        };

        // standard BufferGeometry serialization

        data.uuid = this.uuid;
        data.type = this.type;
        if (this.name !== '') data.name = this.name;
        if (Object.keys(this.userData).length > 0) data.userData = this.userData;

        if (this.parameters !== undefined) {
            const parameters = this.parameters;

            for (const key in parameters) {
                if (parameters[key] !== undefined) data[key] = parameters[key];
            }

            return data;
        }

        data.data = { attributes: {} };

        const index = this.index;

        if (index !== null) {
            const array = Array.prototype.slice.call(index.array);

            data.data.index = {
                type: index.array.constructor.name,
                array: array,
            };
        }

        const attributes = this.attributes;

        for (const key in attributes) {
            const attribute = attributes[key];

            const array = Array.prototype.slice.call(attribute.array);

            data.data.attributes[key] = {
                itemSize: attribute.itemSize,
                type: attribute.array.constructor.name,
                array: array,
                normalized: attribute.normalized,
            };
        }

        const groups = this.groups;

        if (groups.length > 0) {
            data.data.groups = JSON.parse(JSON.stringify(groups));
        }

        const boundingSphere = this.boundingSphere;

        if (boundingSphere !== null) {
            data.data.boundingSphere = {
                center: boundingSphere.center.toArray(),
                radius: boundingSphere.radius,
            };
        }

        return data;
    },

    clone: function () {
        return new BufferGeometry().copy(this);
    },

    copy: function (source) {
        let name, i, l;

        // reset

        this.index = null;
        this.attributes = {};
        this.morphAttributes = {};
        this.groups = [];
        this.boundingBox = null;
        this.boundingSphere = null;

        // name

        this.name = source.name;

        // index

        const index = source.index;

        if (index !== null) {
            this.setIndex(index.clone());
        }

        // attributes

        const attributes = source.attributes;

        for (name in attributes) {
            const attribute = attributes[name];
            this.addAttribute(name, attribute.clone());
        }

        // morph attributes

        const morphAttributes = source.morphAttributes;

        for (name in morphAttributes) {
            const array = [];
            const morphAttribute = morphAttributes[name]; // morphAttribute: array of Float32BufferAttributes

            for (i = 0, l = morphAttribute.length; i < l; i++) {
                array.push(morphAttribute[i].clone());
            }

            this.morphAttributes[name] = array;
        }

        // groups

        const groups = source.groups;

        for (i = 0, l = groups.length; i < l; i++) {
            const group = groups[i];
            this.addGroup(group.start, group.count, group.materialIndex);
        }

        // bounding box

        const boundingBox = source.boundingBox;

        if (boundingBox !== null) {
            this.boundingBox = boundingBox.clone();
        }

        // bounding sphere

        const boundingSphere = source.boundingSphere;

        if (boundingSphere !== null) {
            this.boundingSphere = boundingSphere.clone();
        }

        // draw range

        this.drawRange.start = source.drawRange.start;
        this.drawRange.count = source.drawRange.count;

        // user data

        this.userData = source.userData;

        return this;
    },

    dispose: function () {
        this.dispatchEvent({ type: 'dispose' });
    },
});

export { BufferGeometry };
