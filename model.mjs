function get(name) {
    return parseFloat(document.getElementById(name).value);
}

function calculateNormals(vertices, indices) {
    const vertexCount = vertices.length / 3;
    const normals = new Float32Array(vertices.length).fill(0);

    for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i] * 3;
        const i2 = indices[i + 1] * 3;
        const i3 = indices[i + 2] * 3;

        const v1 = [vertices[i1], vertices[i1 + 1], vertices[i1 + 2]];
        const v2 = [vertices[i2], vertices[i2 + 1], vertices[i2 + 2]];
        const v3 = [vertices[i3], vertices[i3 + 1], vertices[i3 + 2]];

        const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
        const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];

        const normal = m4.normalize(m4.cross(edge1, edge2, [0, 1, 0]), []);

        normals[i1] += normal[0];
        normals[i1 + 1] += normal[1];
        normals[i1 + 2] += normal[2];

        normals[i2] += normal[0];
        normals[i2 + 1] += normal[1];
        normals[i2 + 2] += normal[2];

        normals[i3] += normal[0];
        normals[i3 + 1] += normal[1];
        normals[i3 + 2] += normal[2];
    }

    for (let i = 0; i < normals.length; i += 3) {
        const nx = normals[i];
        const ny = normals[i + 1];
        const nz = normals[i + 2];

        const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (length > 0) {
            normals[i] = nx / length;
            normals[i + 1] = ny / length;
            normals[i + 2] = nz / length;
        }
    }

    return normals;
}

function ModelBuilder() {
    const a = get('A');
    const p = get('P');
    
    const uSteps = get('USteps');
    const vSteps = get('VSteps');

    const uMin = get('UMin');
    const uMax = get('UMax');

    const vMin = get('VMin');
    const vMax = get('VMax');

    const du = (uMax - uMin) / uSteps;
    const dv = (vMax - vMin) / vSteps;

    this.w = function(u) {
        return p * u;
    }

    this.fx = function(u, v) {
        return (a + v) * Math.cos(this.w(u)) * Math.cos(u);
    }

    this.fy = function(u, v) {
        return (a + v) * Math.cos(this.w(u)) * Math.sin(u);
    }

    this.fz = function(u, v) {
        return (a + v) * Math.sin(this.w(u))
    }

    this.build = function() {
        const vertices = [];
        const indices = [];

        for (let i = 0; i <= uSteps; i++) {
            const u = uMin + i * du;
            for (let j = 0; j <= vSteps; j++) {
                const v = vMin + j * dv;

                const x = this.fx(u, v);
                const y = this.fy(u, v);
                const z = this.fz(u, v);

                vertices.push(x, y, z);
            }
        }

        for (let i = 0; i < uSteps; i++) {
            for (let j = 0; j < vSteps; j++) {
                const topLeft = i * (vSteps + 1) + j;
                const topRight = i * (vSteps + 1) + (j + 1);
                const bottomLeft = (i + 1) * (vSteps + 1) + j;
                const bottomRight = (i + 1) * (vSteps + 1) + (j + 1);

                indices.push(topLeft, bottomLeft, bottomRight);
                indices.push(topLeft, bottomRight, topRight);
            }
        }

        const normals = calculateNormals(vertices, indices);
        return { vertices, normals, indices };
    }
}

export default function Model(gl, shProgram) {
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices, normals, indices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        this.count = indices.length;
    };

    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    this.CreateSurfaceData = function() {
        let builder = new ModelBuilder();
        const { vertices, normals, indices } = builder.build();
        this.BufferData(vertices, normals, indices);
    }
}
