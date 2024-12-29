function deg2rad(angle) {
    return angle * Math.PI / 180;
}

function CreateSurfaceData()
{
    let vertexList = [];
    const a = parseFloat(document.getElementById("a").value);
    const p = parseFloat(document.getElementById("p").value);
    const u_start = deg2rad(parseFloat(document.getElementById("u_start").value));
    const u_end = deg2rad(parseFloat(document.getElementById("u_end").value));
    const u_step = deg2rad(parseFloat(document.getElementById("u_step").value));
    const v_start = parseFloat(document.getElementById("v_start").value);
    const v_end = parseFloat(document.getElementById("v_end").value);
    const v_step = parseFloat(document.getElementById("v_step").value);
    const scaler = 6;
    for (let u=u_start; u<=u_end; u+=u_step) {
        let w = p*u;
        for (let v=v_start; v <=v_end; v += v_step){
            let x = (a+v)*Math.cos(w)*Math.cos(u);
            let y = (a+v)*Math.cos(w)*Math.sin(u);
            let z = (a+v)*Math.sin(w);
            vertexList.push(x/scaler,y/scaler,z/scaler);
        }
    }
    for (let v=v_start; v <=v_end; v += v_step){
        for (let u=u_start; u<=u_end; u+=u_step){
            let w = p*u;
            let x = (a+v)*Math.cos(w)*Math.cos(u);
            let y = (a+v)*Math.cos(w)*Math.sin(u);
            let z = (a+v)*Math.sin(w);
            vertexList.push(x/scaler,y/scaler,z/scaler);
        }
    }
    return vertexList;
}

// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length/3;
    }

    this.Draw = function() {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    }
}
