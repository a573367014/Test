// Free Form Deformation of buffer geometry
// yunyang@gaoding.com

import { Vector3 } from '../math/Vector3.js';

export class FFD {
    _factorial(num) {
        let rval = 1;
        for (let i = 2; i <= num; i++) {
            rval = rval * i;
        }
        return rval;
    }

    // 从n个不同元素中每次取出m个不同元素
    _combination(n, m) {
        return this._factorial(n) / (this._factorial(m) * this._factorial(n - m));
    }

    _bernsteinBasis(l, i, s) {
        return this._combination(l, i) * Math.pow(s, i) * Math.pow(1 - s, l - i);
    }

    _linearBasis(l, i, s) {
        const k = i < s * l ? i + 1 - s * l : s * l - i + 1;
        return Math.max(0, k);
    }

    _basisFunction(l, i, s, basisType) {
        if (basisType === undefined) basisType = 'bernstein';

        if (basisType === 'bernstein') {
            return this._bernsteinBasis(l, i, s);
        } else if (basisType === 'linear') {
            return this._linearBasis(l, i, s);
        }
    }

    _calculateSTUfromX(X) {
        const S = this.S;
        const T = this.T;
        const U = this.U;
        const P0 = this.P0;

        const stu = new Vector3(0, 0, 0);

        const temp = T.clone().cross(U).dot(X.clone().sub(P0));
        const de = T.clone().cross(U).dot(S);
        stu.x = temp / de;
        stu.y = S.clone().cross(U).dot(X.clone().sub(P0)) / S.clone().cross(U).dot(T);
        stu.z = S.clone().cross(T).dot(X.clone().sub(P0)) / S.clone().cross(T).dot(U);
        return stu;
    }

    // bernstein polynominals
    _calculateXfromSTU(s, t, u, basisType) {
        const X = new Vector3(0, 0, 0);
        for (let i = 0; i < this.m; i++) {
            for (let j = 0; j < this.n; j++) {
                for (let k = 0; k < this.o; k++) {
                    const coeff =
                        this._basisFunction(this.m - 1, i, s, basisType) *
                        this._basisFunction(this.n - 1, j, t, basisType) *
                        this._basisFunction(this.o - 1, k, u, basisType);
                    X.add(this.P[i][j][k].clone().multiplyScalar(coeff));
                }
            }
        }
        return X;
    }

    // init control points
    _initP(bufferGeometry, m, n, o) {
        let meshGeometryBoundingBoxMaxx = 0;
        let meshGeometryBoundingBoxMinx = 0;
        let meshGeometryBoundingBoxMaxy = 0;
        let meshGeometryBoundingBoxMiny = 0;
        let meshGeometryBoundingBoxMaxz = 0;
        let meshGeometryBoundingBoxMinz = 0;

        for (let i = 0; i < bufferGeometry.attributes.position.count; i++) {
            const vertex = new Vector3().fromArray(bufferGeometry.attributes.position.array, i * 3); // geometry.vertices[i];//new Vector3(); newVertices[i].copy( geometry.vertices[i] ).applyMatrix4( InverseP );
            if (vertex.x > meshGeometryBoundingBoxMaxx) {
                meshGeometryBoundingBoxMaxx = vertex.x;
            }
            if (vertex.x < meshGeometryBoundingBoxMinx) {
                meshGeometryBoundingBoxMinx = vertex.x;
            }
            if (vertex.y > meshGeometryBoundingBoxMaxy) {
                meshGeometryBoundingBoxMaxy = vertex.y;
            }
            if (vertex.y < meshGeometryBoundingBoxMiny) {
                meshGeometryBoundingBoxMiny = vertex.y;
            }
            if (vertex.z > meshGeometryBoundingBoxMaxz) {
                meshGeometryBoundingBoxMaxz = vertex.z;
            }
            if (vertex.z < meshGeometryBoundingBoxMinz) {
                meshGeometryBoundingBoxMinz = vertex.z;
            }
        }

        const origin = new Vector3(
            meshGeometryBoundingBoxMinx,
            meshGeometryBoundingBoxMiny,
            meshGeometryBoundingBoxMinz,
        );

        const XWidth = meshGeometryBoundingBoxMaxx - meshGeometryBoundingBoxMinx;
        const YWidth = meshGeometryBoundingBoxMaxy - meshGeometryBoundingBoxMiny;
        const ZWidth = meshGeometryBoundingBoxMaxz - meshGeometryBoundingBoxMinz;

        this.XWidth = XWidth;
        this.YWidth = YWidth;
        this.ZWidth = ZWidth;

        const center = new Vector3(
            (meshGeometryBoundingBoxMaxx + meshGeometryBoundingBoxMinx) * 0.5,
            (meshGeometryBoundingBoxMaxy + meshGeometryBoundingBoxMiny) * 0.5,
            (meshGeometryBoundingBoxMaxz + meshGeometryBoundingBoxMinz) * 0.5,
        );
        this.center = center;

        // let num = 2;
        // let m = num;
        // let n = num;
        // let o = num;
        this.m = m;
        this.n = n;
        this.o = o;
        const vvvP = new Array(m);
        for (let i = 0; i < m; i++) {
            vvvP[i] = new Array(n);
            for (let j = 0; j < n; j++) {
                vvvP[i][j] = new Array(o);
            }
        }

        const stepX = XWidth / (m - 1);
        const stepY = YWidth / (n - 1);
        const stepZ = ZWidth / (o - 1);

        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                for (let k = 0; k < o; k++) {
                    const offset = new Vector3(0, 0, 0);
                    offset.x = i * stepX;
                    offset.y = j * stepY;
                    offset.z = k * stepZ;
                    vvvP[i][j][k] = origin.clone().add(offset);
                }
            }
        }

        this.P = vvvP;
        this.P0 = origin;
        this.S = new Vector3(XWidth, 0, 0);
        this.T = new Vector3(0, YWidth, 0);
        this.U = new Vector3(0, 0, ZWidth);
    }

    _getP(i, j, k) {
        if (i < 0 || i >= this.m) return;
        if (j < 0 || j >= this.n) return;
        if (k < 0 || k >= this.o) return;
        return this.P[i][j][k];
    }

    _changeP(i, j, k, newPos) {
        if (!newPos.isVector3) return;
        if (i < 0 || i >= this.m) return;
        if (j < 0 || j >= this.n) return;
        if (k < 0 || k >= this.o) return;
        // this.P.at( i, j, k) = newPos;
        this.P[i][j][k] = newPos;
    }

    _addP(i, j, k, newPos) {
        if (!newPos.isVector3) return;
        if (i < 0 || i >= this.m) return;
        if (j < 0 || j >= this.n) return;
        if (k < 0 || k >= this.o) return;
        // this.P.at( i, j, k) = newPos;
        this.P[i][j][k].add(newPos);
    }

    _initSTUs(bufferGeometry) {
        const STUs = [];
        for (let i = 0; i < bufferGeometry.attributes.position.count; i++) {
            STUs[i] = this._calculateSTUfromX(
                new Vector3().fromArray(bufferGeometry.attributes.position.array, i * 3),
            ); // geometry.vertices[i]);
        }
        this.STUs = STUs;
    }

    _calculateDeformedGeometry(bufferGeometry, basisType) {
        for (let i = 0; i < bufferGeometry.attributes.position.count; i++) {
            const deformedPos = this._calculateXfromSTU(
                this.STUs[i].x,
                this.STUs[i].y,
                this.STUs[i].z,
                basisType,
            );
            bufferGeometry.attributes.position.array[i * 3 + 0] = deformedPos.x;
            bufferGeometry.attributes.position.array[i * 3 + 1] = deformedPos.y;
            bufferGeometry.attributes.position.array[i * 3 + 2] = deformedPos.z;
        }
    }

    _calculateBoundingBox(bufferGeometry) {
        // calculate boundingbox
        let meshGeometryBoundingBoxMaxx = 0;
        let meshGeometryBoundingBoxMinx = 0;
        let meshGeometryBoundingBoxMaxy = 0;
        let meshGeometryBoundingBoxMiny = 0;
        let meshGeometryBoundingBoxMaxz = 0;
        let meshGeometryBoundingBoxMinz = 0;

        for (let i = 0; i < bufferGeometry.attributes.position.count; i++) {
            if (bufferGeometry.attributes.position.array[i * 3 + 0] > meshGeometryBoundingBoxMaxx) {
                meshGeometryBoundingBoxMaxx = bufferGeometry.attributes.position.array[i * 3 + 0];
            }
            if (bufferGeometry.attributes.position.array[i * 3 + 0] < meshGeometryBoundingBoxMinx) {
                meshGeometryBoundingBoxMinx = bufferGeometry.attributes.position.array[i * 3 + 0];
            }
            if (bufferGeometry.attributes.position.array[i * 3 + 1] > meshGeometryBoundingBoxMaxy) {
                meshGeometryBoundingBoxMaxy = bufferGeometry.attributes.position.array[i * 3 + 1];
            }
            if (bufferGeometry.attributes.position.array[i * 3 + 1] < meshGeometryBoundingBoxMiny) {
                meshGeometryBoundingBoxMiny = bufferGeometry.attributes.position.array[i * 3 + 1];
            }
            if (bufferGeometry.attributes.position.array[i * 3 + 2] > meshGeometryBoundingBoxMaxz) {
                meshGeometryBoundingBoxMaxz = bufferGeometry.attributes.position.array[i * 3 + 2];
            }
            if (bufferGeometry.attributes.position.array[i * 3 + 2] < meshGeometryBoundingBoxMinz) {
                meshGeometryBoundingBoxMinz = bufferGeometry.attributes.position.array[i * 3 + 2];
            }
        }

        const meshWidthX = meshGeometryBoundingBoxMaxx - meshGeometryBoundingBoxMinx;
        const meshWidthY = meshGeometryBoundingBoxMaxy - meshGeometryBoundingBoxMiny;
        const meshWidthZ = meshGeometryBoundingBoxMaxz - meshGeometryBoundingBoxMinz;
        return [meshWidthX, meshWidthY, meshWidthZ];
    }

    RUN(bufferGeometry, options) {
        let pattern = options.pattern ? Number(options.pattern) : 1;
        pattern = parseInt(pattern); // temp

        const intensity = options.intensity / 100 || 0;
        const intensity1 = options.intensity1 / 100 || 0;
        const basisType = options.basisType || 'bernstein';
        // let latticeDimX = (options.latticeDimX!=undefined)options.latticeDimX?: 4;
        // let latticeDimY = (options.latticeDimY!=undefined)options.latticeDimY?: 2;
        // let latticeDimZ = (options.latticeDimZ!=undefined)options.latticeDimZ?: 2;

        if (intensity === 0 && intensity1 === 0) return;
        const tag = 100; // latticeDimX = 3 和 4 的分界点
        const tag1 = 200; // latticeDimX = 3 和 4 的分界点
        const tag2 = 300; // latticeDimX = 3 和 4 的分界点
        const tag3 = 400; // latticeDimX = 3 和 4 的分界点
        const tag4 = 500; // latticeDimX = 3 和 4 的分界点
        // let dim = 10;
        // let basisType = 'bernstein'
        // let basisType = 'linear'
        let latticeDimX; // = 4;//dim;
        let latticeDimY; // = 2;//dim;
        let latticeDimZ; // = 2;

        if (pattern <= tag) {
            // this._changeP(0,0,0, new Vector3(-10,-10,0));
            latticeDimX = 3; // dim;
            latticeDimY = 2; // dim;
            latticeDimZ = 2;
        } else if (pattern > tag && pattern < tag1) {
            latticeDimX = 4; // dim;
            latticeDimY = 2; // dim;
            latticeDimZ = 2;
        } else if (pattern >= tag1 && pattern < tag2) {
            latticeDimX = 4; // dim;
            latticeDimY = 4; // dim;
            latticeDimZ = 2;
        } else if (pattern >= tag2 && pattern < tag3) {
            latticeDimX = 10; // dim;
            latticeDimY = 2; // dim;
            latticeDimZ = 2;
        } else if (pattern >= tag3 && pattern < tag4) {
            // this._changeP(0,0,0, new Vector3(-10,-10,0));
            latticeDimX = 2; // dim;
            latticeDimY = 3; // dim;
            latticeDimZ = 2;
        } else if (pattern >= tag4) {
            latticeDimX = 2; // dim;
            latticeDimY = 2; // dim;
            latticeDimZ = 2;
        }

        //
        // init control points
        //
        this._initP(bufferGeometry, latticeDimX, latticeDimY, latticeDimZ);

        const { baseLineHeight = 100, maxLineWidth = 400 } = options;
        //
        // init stu (which is geometry's projection onto coord constructed by control points)
        //
        this._initSTUs(bufferGeometry);

        // 以上两步，每个mesh做一遍就可以了。待优化

        //
        // change control points
        //
        // define patterns

        if (pattern === 0) {
            this._changeP(0, 0, 0, new Vector3(-intensity, -intensity, 0));
        } else if (pattern === 1) {
            const y = intensity * baseLineHeight * 2;
            this._addP(1, 1, 0, new Vector3(0, y, 0));
            this._addP(1, 1, 1, new Vector3(0, y, 0));
        } else if (pattern === 2) {
            let y = intensity * baseLineHeight;
            if (y > 0) y = y * 0.5;
            // left
            this._addP(0, 1, 0, new Vector3(0, -y, 0));
            this._addP(0, 1, 1, new Vector3(0, -y, 0));
            this._addP(0, 0, 0, new Vector3(0, y, 0));
            this._addP(0, 0, 1, new Vector3(0, y, 0));
            // middle
            const scale = 2;
            this._addP(1, 1, 0, new Vector3(0, scale * y, 0));
            this._addP(1, 1, 1, new Vector3(0, scale * y, 0));
            this._addP(1, 0, 0, new Vector3(0, -scale * y, 0));
            this._addP(1, 0, 1, new Vector3(0, -scale * y, 0));
            // left
            this._addP(2, 1, 0, new Vector3(0, -y, 0));
            this._addP(2, 1, 1, new Vector3(0, -y, 0));
            this._addP(2, 0, 0, new Vector3(0, y, 0));
            this._addP(2, 0, 1, new Vector3(0, y, 0));
        } else if (pattern === 3) {
            // arch
            const y = intensity * baseLineHeight * 2;
            this._addP(1, 1, 0, new Vector3(0, y, 0));
            this._addP(1, 1, 1, new Vector3(0, y, 0));
            this._addP(1, 0, 0, new Vector3(0, y, 0));
            this._addP(1, 0, 1, new Vector3(0, y, 0));
        } else if (pattern === 4) {
            const y = intensity * baseLineHeight * 2;
            this._addP(1, 0, 0, new Vector3(0, y, 0));
            this._addP(1, 0, 1, new Vector3(0, y, 0));
        } else if (pattern === 5) {
            // 下倾斜
            const y = intensity * baseLineHeight;
            this._addP(0, 0, 0, new Vector3(0, y, 0));
            this._addP(0, 0, 1, new Vector3(0, y, 0));
            this._addP(2, 0, 0, new Vector3(0, -y, 0));
            this._addP(2, 0, 1, new Vector3(0, -y, 0));

            // get middle new pos
            const leftLength = this._getP(0, 1, 0).distanceTo(this._getP(0, 0, 0));
            const rightLength = this._getP(2, 1, 0).distanceTo(this._getP(2, 0, 0));
            const ratio = leftLength / (leftLength + rightLength);
            this._changeP(
                1,
                0,
                0,
                this._getP(0, 0, 0)
                    .clone()
                    .multiplyScalar(1 - ratio)
                    .add(this._getP(2, 0, 0).clone().multiplyScalar(ratio)),
            );
            this._changeP(
                1,
                1,
                0,
                this._getP(0, 1, 0)
                    .clone()
                    .multiplyScalar(1 - ratio)
                    .add(this._getP(2, 1, 0).clone().multiplyScalar(ratio)),
            );
            this._changeP(
                1,
                0,
                1,
                this._getP(0, 0, 1)
                    .clone()
                    .multiplyScalar(1 - ratio)
                    .add(this._getP(2, 0, 1).clone().multiplyScalar(ratio)),
            );
            this._changeP(
                1,
                1,
                1,
                this._getP(0, 1, 1)
                    .clone()
                    .multiplyScalar(1 - ratio)
                    .add(this._getP(2, 1, 1).clone().multiplyScalar(ratio)),
            );

            // 拉高
            const YChange = intensity1 * baseLineHeight;
            this._addP(0, 1, 1, new Vector3(0, YChange, 0));
            this._addP(0, 1, 0, new Vector3(0, YChange, 0));
            this._addP(1, 1, 0, new Vector3(0, YChange, 0));
            this._addP(1, 1, 1, new Vector3(0, YChange, 0));
            this._addP(2, 1, 0, new Vector3(0, YChange, 0));
            this._addP(2, 1, 1, new Vector3(0, YChange, 0));
            // 拉高结束
        } else if (pattern === 6) {
            // 上倾斜
            const y = intensity * baseLineHeight;
            this._addP(0, 1, 0, new Vector3(0, y, 0));
            this._addP(0, 1, 1, new Vector3(0, y, 0));
            this._addP(2, 1, 0, new Vector3(0, -y, 0));
            this._addP(2, 1, 1, new Vector3(0, -y, 0));

            // get middle new pos
            const leftLength = this._getP(0, 1, 0).distanceTo(this._getP(0, 0, 0));
            const rightLength = this._getP(2, 1, 0).distanceTo(this._getP(2, 0, 0));
            const ratio = leftLength / (leftLength + rightLength);
            this._changeP(
                1,
                0,
                0,
                this._getP(0, 0, 0)
                    .clone()
                    .multiplyScalar(1 - ratio)
                    .add(this._getP(2, 0, 0).clone().multiplyScalar(ratio)),
            );
            this._changeP(
                1,
                1,
                0,
                this._getP(0, 1, 0)
                    .clone()
                    .multiplyScalar(1 - ratio)
                    .add(this._getP(2, 1, 0).clone().multiplyScalar(ratio)),
            );
            this._changeP(
                1,
                0,
                1,
                this._getP(0, 0, 1)
                    .clone()
                    .multiplyScalar(1 - ratio)
                    .add(this._getP(2, 0, 1).clone().multiplyScalar(ratio)),
            );
            this._changeP(
                1,
                1,
                1,
                this._getP(0, 1, 1)
                    .clone()
                    .multiplyScalar(1 - ratio)
                    .add(this._getP(2, 1, 1).clone().multiplyScalar(ratio)),
            );

            // 拉高
            const YChange = intensity1 * baseLineHeight;
            this._addP(0, 1, 1, new Vector3(0, YChange, 0));
            this._addP(0, 1, 0, new Vector3(0, YChange, 0));
            this._addP(1, 1, 0, new Vector3(0, YChange, 0));
            this._addP(1, 1, 1, new Vector3(0, YChange, 0));
            this._addP(2, 1, 0, new Vector3(0, YChange, 0));
            this._addP(2, 1, 1, new Vector3(0, YChange, 0));
            // 拉高结束
        } else if (pattern === 7) {
            const x = intensity * maxLineWidth * 0.5;
            // top
            this._addP(0, 1, 0, new Vector3(x, 0, 0));
            this._addP(0, 1, 1, new Vector3(x, 0, 0));
            this._addP(2, 1, 0, new Vector3(-x, 0, 0));
            this._addP(2, 1, 1, new Vector3(-x, 0, 0));

            // bottom
            this._addP(0, 0, 0, new Vector3(-x, 0, 0));
            this._addP(0, 0, 1, new Vector3(-x, 0, 0));
            this._addP(2, 0, 0, new Vector3(x, 0, 0));
            this._addP(2, 0, 1, new Vector3(x, 0, 0));
        } else if (pattern === 8) {
            const x = intensity * maxLineWidth * 0.5;
            this._addP(0, 0, 0, new Vector3(x, 0, 0));
            this._addP(0, 0, 1, new Vector3(x, 0, 0));
            this._addP(2, 0, 0, new Vector3(-x, 0, 0));
            this._addP(2, 0, 1, new Vector3(-x, 0, 0));
        } else if (pattern === 9) {
            const x = intensity * baseLineHeight;
            const y = intensity1 * maxLineWidth;

            this._addP(0, 0, 0, new Vector3(-x, y, 0));
            this._addP(0, 1, 0, new Vector3(x, y, 0));
            this._addP(1, 0, 0, new Vector3(-x, 0, 0));
            this._addP(1, 1, 0, new Vector3(x, 0, 0));
            this._addP(2, 1, 0, new Vector3(x, -y, 0));
            this._addP(2, 0, 0, new Vector3(-x, -y, 0));

            this._addP(0, 0, 1, new Vector3(-x, y, 0));
            this._addP(0, 1, 1, new Vector3(x, y, 0));
            this._addP(1, 0, 1, new Vector3(-x, 0, 0));
            this._addP(1, 1, 1, new Vector3(x, 0, 0));
            this._addP(2, 1, 1, new Vector3(x, -y, 0));
            this._addP(2, 0, 1, new Vector3(-x, -y, 0));
        } else if (pattern === 10) {
            // 上下同时倾斜
            const y = intensity * baseLineHeight * 0.5;
            this._addP(0, 0, 0, new Vector3(0, y, 0));
            this._addP(0, 0, 1, new Vector3(0, y, 0));
            this._addP(0, 1, 0, new Vector3(0, -y, 0));
            this._addP(0, 1, 1, new Vector3(0, -y, 0));

            this._addP(2, 0, 0, new Vector3(0, -y, 0));
            this._addP(2, 0, 1, new Vector3(0, -y, 0));
            this._addP(2, 1, 0, new Vector3(0, y, 0));
            this._addP(2, 1, 1, new Vector3(0, y, 0));

            // get middle new pos
            const leftLength = this._getP(0, 1, 0).distanceTo(this._getP(0, 0, 0));
            const rightLength = this._getP(2, 1, 0).distanceTo(this._getP(2, 0, 0));
            const ratio = leftLength / (leftLength + rightLength);
            this._changeP(
                1,
                0,
                0,
                new Vector3().lerpVectors(this._getP(0, 0, 0), this._getP(2, 0, 0), ratio),
            );
            this._changeP(
                1,
                1,
                0,
                new Vector3().lerpVectors(this._getP(0, 1, 0), this._getP(2, 1, 0), ratio),
            );
            this._changeP(
                1,
                0,
                1,
                new Vector3().lerpVectors(this._getP(0, 0, 1), this._getP(2, 0, 1), ratio),
            );
            this._changeP(
                1,
                1,
                1,
                new Vector3().lerpVectors(this._getP(0, 1, 1), this._getP(2, 1, 1), ratio),
            );

            // 拉高
            const YChange = intensity1 * baseLineHeight;
            this._addP(0, 1, 1, new Vector3(0, YChange, 0));
            this._addP(0, 1, 0, new Vector3(0, YChange, 0));
            this._addP(1, 1, 0, new Vector3(0, YChange, 0));
            this._addP(1, 1, 1, new Vector3(0, YChange, 0));
            this._addP(2, 1, 0, new Vector3(0, YChange, 0));
            this._addP(2, 1, 1, new Vector3(0, YChange, 0));
            // 拉高结束
        } else if (pattern === 14) {
            // 沿z轴负方向收缩
            const x = intensity * 100;
            const y = intensity1 * 100;
            const XChange = this.XWidth * 0.5 * x;
            const YChange = this.YWidth * 0.5 * y;

            this._addP(0, 0, 0, new Vector3(-XChange, -YChange, 0));
            this._addP(0, 1, 0, new Vector3(-XChange, YChange, 0));
            this._addP(1, 0, 0, new Vector3(0, -YChange, 0));
            this._addP(1, 1, 0, new Vector3(0, YChange, 0));
            this._addP(2, 0, 0, new Vector3(XChange, -YChange, 0));
            this._addP(2, 1, 0, new Vector3(XChange, YChange, 0));
        } else if (pattern === 15) {
            // 往x和y方向偏移
            const XChange = intensity * 100;
            const YChange = intensity1 * 100;

            this._addP(0, 0, 0, new Vector3(XChange, YChange, 0));
            this._addP(0, 1, 0, new Vector3(XChange, YChange, 0));
            this._addP(1, 0, 0, new Vector3(XChange, YChange, 0));
            this._addP(1, 1, 0, new Vector3(XChange, YChange, 0));
            this._addP(2, 0, 0, new Vector3(XChange, YChange, 0));
            this._addP(2, 1, 0, new Vector3(XChange, YChange, 0));
        } else if (pattern === 16) {
            const y = intensity * maxLineWidth;
            const y1 = intensity1 * maxLineWidth;
            this._addP(0, 0, 0, new Vector3(0, -y1, 0));
            this._addP(1, 0, 0, new Vector3(0, y1, 0));
            this._addP(2, 0, 0, new Vector3(0, -y1, 0));
            this._addP(0, 1, 0, new Vector3(0, -y, 0));
            this._addP(1, 1, 0, new Vector3(0, y, 0));
            this._addP(2, 1, 0, new Vector3(0, -y, 0));

            this._addP(0, 0, 1, new Vector3(0, -y1, 0));
            this._addP(1, 0, 1, new Vector3(0, y1, 0));
            this._addP(2, 0, 1, new Vector3(0, -y1, 0));
            this._addP(0, 1, 1, new Vector3(0, -y, 0));
            this._addP(1, 1, 1, new Vector3(0, y, 0));
            this._addP(2, 1, 1, new Vector3(0, -y, 0));
        } else if (pattern === tag + 1) {
            const y = intensity * baseLineHeight;
            this._addP(1, 1, 0, new Vector3(0, y, 0));
            this._addP(1, 1, 1, new Vector3(0, y, 0));
            this._addP(1, 0, 0, new Vector3(0, y, 0));
            this._addP(1, 0, 1, new Vector3(0, y, 0));

            this._addP(2, 1, 0, new Vector3(0, -y, 0));
            this._addP(2, 1, 1, new Vector3(0, -y, 0));
            this._addP(2, 0, 0, new Vector3(0, -y, 0));
            this._addP(2, 0, 1, new Vector3(0, -y, 0));
        } else if (pattern === tag + 2) {
            let y = intensity * baseLineHeight;
            if (y > 0) y = y * 0.5;
            this._addP(0, 1, 0, new Vector3(0, -y, 0));
            this._addP(0, 1, 1, new Vector3(0, -y, 0));
            this._addP(0, 0, 0, new Vector3(0, y, 0));
            this._addP(0, 0, 1, new Vector3(0, y, 0));

            this._addP(1, 1, 0, new Vector3(0, y, 0));
            this._addP(1, 1, 1, new Vector3(0, y, 0));
            this._addP(1, 0, 0, new Vector3(0, -y, 0));
            this._addP(1, 0, 1, new Vector3(0, -y, 0));

            this._addP(2, 1, 0, new Vector3(0, y, 0));
            this._addP(2, 1, 1, new Vector3(0, y, 0));
            this._addP(2, 0, 0, new Vector3(0, -y, 0));
            this._addP(2, 0, 1, new Vector3(0, -y, 0));

            this._addP(3, 1, 0, new Vector3(0, -y, 0));
            this._addP(3, 1, 1, new Vector3(0, -y, 0));
            this._addP(3, 0, 0, new Vector3(0, y, 0));
            this._addP(3, 0, 1, new Vector3(0, y, 0));
        } else if (pattern === tag1 + 1) {
            // 波形
            const y = intensity * baseLineHeight;
            this._addP(1, 1, 0, new Vector3(0, y, 0));
            this._addP(1, 1, 1, new Vector3(0, y, 0));
            this._addP(1, 2, 0, new Vector3(0, y, 0));
            this._addP(1, 2, 1, new Vector3(0, y, 0));

            this._addP(2, 1, 0, new Vector3(0, -y, 0));
            this._addP(2, 1, 1, new Vector3(0, -y, 0));
            this._addP(2, 2, 0, new Vector3(0, -y, 0));
            this._addP(2, 2, 1, new Vector3(0, -y, 0));
        } else if (pattern === tag3 + 2) {
            const x = intensity * maxLineWidth * 0.5;
            // top
            this._addP(0, 2, 0, new Vector3(x, 0, 0));
            this._addP(0, 2, 1, new Vector3(x, 0, 0));
            this._addP(1, 2, 0, new Vector3(-x, 0, 0));
            this._addP(1, 2, 1, new Vector3(-x, 0, 0));

            // bottom
            this._addP(0, 0, 0, new Vector3(-x, 0, 0));
            this._addP(0, 0, 1, new Vector3(-x, 0, 0));
            this._addP(1, 0, 0, new Vector3(x, 0, 0));
            this._addP(1, 0, 1, new Vector3(x, 0, 0));

            // get middle new pos
            const topLength = this._getP(0, 2, 0).distanceTo(this._getP(1, 2, 0));
            const bottomLength = this._getP(0, 0, 0).distanceTo(this._getP(1, 0, 0));
            const ratio = topLength / (topLength + bottomLength);
            this._changeP(
                0,
                1,
                0,
                this._getP(0, 2, 0)
                    .clone()
                    .multiplyScalar(1 - ratio)
                    .add(this._getP(0, 0, 0).clone().multiplyScalar(ratio)),
            );
            this._changeP(
                1,
                1,
                0,
                this._getP(1, 2, 0)
                    .clone()
                    .multiplyScalar(1 - ratio)
                    .add(this._getP(1, 0, 0).clone().multiplyScalar(ratio)),
            );
            this._changeP(
                0,
                1,
                1,
                this._getP(0, 2, 1)
                    .clone()
                    .multiplyScalar(1 - ratio)
                    .add(this._getP(0, 0, 1).clone().multiplyScalar(ratio)),
            );
            this._changeP(
                1,
                1,
                1,
                this._getP(1, 2, 1)
                    .clone()
                    .multiplyScalar(1 - ratio)
                    .add(this._getP(1, 0, 1).clone().multiplyScalar(ratio)),
            );

            // 拉高
            const YChange = intensity1 * baseLineHeight;
            this._addP(0, 2, 1, new Vector3(0, YChange, 0));
            this._addP(0, 2, 0, new Vector3(0, YChange, 0));
            this._addP(1, 2, 0, new Vector3(0, YChange, 0));
            this._addP(1, 2, 1, new Vector3(0, YChange, 0));

            this._addP(0, 1, 1, new Vector3(0, 0.5 * YChange, 0));
            this._addP(0, 1, 0, new Vector3(0, 0.5 * YChange, 0));
            this._addP(1, 1, 0, new Vector3(0, 0.5 * YChange, 0));
            this._addP(1, 1, 1, new Vector3(0, 0.5 * YChange, 0));
            // 拉高结束
        } else if (pattern === tag4 + 1) {
            // 往x方向拉伸
            const XChange = intensity * maxLineWidth;

            this._addP(1, 0, 0, new Vector3(XChange, 0, 0));
            this._addP(1, 0, 1, new Vector3(XChange, 0, 0));
            this._addP(1, 1, 0, new Vector3(XChange, 0, 0));
            this._addP(1, 1, 1, new Vector3(XChange, 0, 0));
        } else if (pattern === tag4 + 2) {
            // 往y方向拉伸
            const YChange = intensity * baseLineHeight;

            this._addP(0, 1, 1, new Vector3(0, YChange, 0));
            this._addP(0, 1, 0, new Vector3(0, YChange, 0));
            this._addP(1, 1, 0, new Vector3(0, YChange, 0));
            this._addP(1, 1, 1, new Vector3(0, YChange, 0));
        }

        this._calculateDeformedGeometry(bufferGeometry, basisType);
    }
}
