import createProgram from "./main.mjs";
import LoadTexture from "./TextureHandler.mjs"

const vertexShaderSrc = `precision mediump float;
attribute vec2 coords;
varying vec2 fragUV;

void main() {
    gl_Position = vec4(coords, 0.0, 1.0);
    fragUV = coords * 0.5 + 0.5;
}`;

const fragmentShaderSrc = `precision mediump float;
varying vec2 fragUV;
uniform sampler2D textureSampler;
void main() {
    gl_FragColor = texture2D(textureSampler, fragUV);
}`;

const uvVertexSrc = `
    attribute vec2 coords;

    uniform vec2 pivotPoint;
    uniform float rotation;

    void main() {
        vec2 relativePosition = coords - pivotPoint;
        
        float cosRot = cos(rotation);
        float sinRot = sin(rotation);

        vec2 rotatedPos = vec2(
            relativePosition.x * cosRot - relativePosition.y * sinRot,
            relativePosition.x * sinRot + relativePosition.y * cosRot
        );

        vec2 finalPos = rotatedPos + pivotPoint;
        gl_Position = vec4(finalPos * 2.0 - 1.0, 0.0, 1.0);
    }
`;

const uvFragmentSrc = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 0.2);
    }
`;

const pointVertexSrc = `
    uniform vec2 coords;
    void main() {
        gl_Position = vec4(coords * 2.0 - 1.0, 0.0, 1.0);
        gl_PointSize = 10.0;
    }
`;

const pointFragmentSrc = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
    }
`;

function trianglesToEdges(indices) {
    const edges = [];
    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];

        edges.push(a, b);
        edges.push(b, c);
        edges.push(c, a);
    }
    return edges;
}

export default function UVRenderer(mesh) {
    const canvas = document.getElementById('uvcanvas');
    const gl = canvas.getContext('webgl2');

    const diffuseTexture = LoadTexture(gl, "./textures/diffuse.jpg");

    const vertexBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    const textureBuffer = gl.createBuffer();

    const textureProgram = createProgram(gl, vertexShaderSrc, fragmentShaderSrc);
    const uvProgram = createProgram(gl, uvVertexSrc, uvFragmentSrc);
    const pointProgram = createProgram(gl, pointVertexSrc, pointFragmentSrc);

    let activePoint = [0.5, 0.5];
    let edgeCount = 0;

    function getCursorCoords(event) {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / canvas.width;
        const y = 1.0 - ((event.clientY - rect.top) / canvas.height);
        return [x, y];
    }

    function displayPointCoords() {
        document.getElementById('point-coordinates').textContent = `Point Coordinates: (${activePoint[0].toFixed(2)}, ${activePoint[1].toFixed(2)})`;
    }

    canvas.addEventListener('mousemove', (event) => {
        const [x, y] = getCursorCoords(event);
        document.getElementById('mouse-coordinates').textContent = `Mouse Coordinates: (${x.toFixed(2)}, ${y.toFixed(2)})`;

        if (event.buttons === 1) {
            activePoint = [x, y];
            mesh.point = activePoint;
            displayPointCoords();
            document.dispatchEvent(new Event('draw'));
        }
    });

    canvas.addEventListener('mousedown', (event) => {
        if (event.button === 0) {
            activePoint = getCursorCoords(event);
            mesh.point = activePoint;
            displayPointCoords();
            document.dispatchEvent(new Event('draw'));
        }
    });

    document.addEventListener('keydown', (event) => {
        const step = 0.01;
        let movement = [0, 0];

        switch (event.code) {
            case 'KeyW': movement[1] += step; break;
            case 'KeyS': movement[1] -= step; break;
            case 'KeyD': movement[0] += step; break;
            case 'KeyA': movement[0] -= step; break;
        }

        activePoint[0] = Math.min(Math.max(activePoint[0] + movement[0], 0.0), 1.0);
        activePoint[1] = Math.min(Math.max(activePoint[1] + movement[1], 0.0), 1.0);
        mesh.point = activePoint;
        displayPointCoords();
        document.dispatchEvent(new Event('draw'));
    });

    this.init = function () {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);

        this.update();
    };

    this.update = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.uvBuffer), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        const edges = trianglesToEdges(mesh.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(edges), gl.STATIC_DRAW);

        edgeCount = edges.length;
    };

    this.draw = function () {
        const rotation = parseFloat(document.getElementById('Angle').value) * (Math.PI / 180.0);

        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(textureProgram);
        let attrLoc = gl.getAttribLocation(textureProgram, 'coords');
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.enableVertexAttribArray(attrLoc);
        gl.vertexAttribPointer(attrLoc, 2, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.useProgram(uvProgram);
        attrLoc = gl.getAttribLocation(uvProgram, 'coords');
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.enableVertexAttribArray(attrLoc);
        gl.vertexAttribPointer(attrLoc, 2, gl.FLOAT, false, 0, 0);

        let uniformLoc = gl.getUniformLocation(uvProgram, 'pivotPoint');
        gl.uniform2fv(uniformLoc, activePoint);
        uniformLoc = gl.getUniformLocation(uvProgram, 'rotation');
        gl.uniform1f(uniformLoc, rotation);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.LINES, edgeCount, gl.UNSIGNED_INT, 0);

        gl.useProgram(pointProgram);
        uniformLoc = gl.getUniformLocation(pointProgram, 'coords');
        gl.uniform2fv(uniformLoc, activePoint);
        gl.drawArrays(gl.POINTS, 0, 1);
    };
}
