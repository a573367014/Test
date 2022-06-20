import { Vector3 } from '../math/Vector3.js';

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 */

function Face3(a, b, c, normal, materialIndex) {
    this.a = a;
    this.b = b;
    this.c = c;

    this.normal = normal && normal.isVector3 ? normal : new Vector3();
    this.vertexNormals = Array.isArray(normal) ? normal : [];

    this.materialIndex = materialIndex !== undefined ? materialIndex : 0;
}

Object.assign(Face3.prototype, {
    clone: function () {
        return new this.constructor().copy(this);
    },

    copy: function (source) {
        this.a = source.a;
        this.b = source.b;
        this.c = source.c;

        this.normal.copy(source.normal);

        this.materialIndex = source.materialIndex;

        for (let i = 0, il = source.vertexNormals.length; i < il; i++) {
            this.vertexNormals[i] = source.vertexNormals[i].clone();
        }

        return this;
    },
});

export { Face3 };
