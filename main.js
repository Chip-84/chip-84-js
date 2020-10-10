var mainLoop;
var cpf = 20;
var c;
var ctx;
var SCREEN_SCALE = 4;

window.onload = function() {
	document.getElementById('fileselector').addEventListener('change', function() {
		var reader = new FileReader();
		reader.onload = function() {
			var arrayBuffer = this.result, array = new Uint8Array(arrayBuffer);
			loadProgram(array);
			startMainLoop();
		}
		reader.readAsArrayBuffer(this.files[0]);
	}, false);
	
	c = document.getElementById("screen");
	ctx = c.getContext('2d');
	ctx.canvas.width = SCREEN_SCALE * 128;
	ctx.canvas.height = SCREEN_SCALE * 64;
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	
	document.addEventListener("keydown", keyDown);
	document.addEventListener("keyup", keyUp);
}

function startMainLoop() {
	clearInterval(mainLoop);
	mainLoop = setInterval(function() {
		var slider = document.getElementById("cpf-input");
		cpf = slider.value;
		
		emulateCycle(cpf);
		
		ctx.canvas.width = SCREEN_SCALE * 128;
		ctx.canvas.height = SCREEN_SCALE * 64;
		var ss = 128 / screen_width * SCREEN_SCALE;
		for(var i = 0; i < pixel_number; i++) {
			if(canvas_data[i] == 0) {
				ctx.fillStyle = "#000000";
			} else {
				ctx.fillStyle = "#ffffff";
			}
			var x = i % screen_width;
			var y = Math.floor(i / screen_width);
			ctx.fillRect(x * ss, y * ss, ss, ss);
		}
	}, 1000/60);
}

function keyDown(e) {
	if(e.keyCode == 49) {
		keys[0x1] = 1;
	}
	if(e.keyCode == 50) {
		keys[0x2] = 1;
	}
	if(e.keyCode == 51) {
		keys[0x3] = 1;
	}
	if(e.keyCode == 52) {
		keys[0xc] = 1;
	}
	if(e.keyCode == 81) {
		keys[0x4] = 1;
	}
	if(e.keyCode == 87) {
		keys[0x5] = 1;
	}
	if(e.keyCode == 69) {
		keys[0x6] = 1;
	}
	if(e.keyCode == 82) {
		keys[0xd] = 1;
	}
	if(e.keyCode == 65) {
		keys[0x7] = 1;
	}
	if(e.keyCode == 83) {
		keys[0x8] = 1;
	}
	if(e.keyCode == 68) {
		keys[0x9] = 1;
	}
	if(e.keyCode == 70) {
		keys[0xe] = 1;
	}
	if(e.keyCode == 90) {
		keys[0xa] = 1;
	}
	if(e.keyCode == 88) {
		keys[0x0] = 1;
	}
	if(e.keyCode == 67) {
		keys[0xb] = 1;
	}
	if(e.keyCode == 86) {
		keys[0xf] = 1;
	}
}

function keyUp(e) {
	if(e.keyCode == 49) {
		keys[0x1] = 0;
	}
	if(e.keyCode == 50) {
		keys[0x2] = 0;
	}
	if(e.keyCode == 51) {
		keys[0x3] = 0;
	}
	if(e.keyCode == 52) {
		keys[0xc] = 0;
	}
	if(e.keyCode == 81) {
		keys[0x4] = 0;
	}
	if(e.keyCode == 87) {
		keys[0x5] = 0;
	}
	if(e.keyCode == 69) {
		keys[0x6] = 0;
	}
	if(e.keyCode == 82) {
		keys[0xd] = 0;
	}
	if(e.keyCode == 65) {
		keys[0x7] = 0;
	}
	if(e.keyCode == 83) {
		keys[0x8] = 0;
	}
	if(e.keyCode == 68) {
		keys[0x9] = 0;
	}
	if(e.keyCode == 70) {
		keys[0xe] = 0;
	}
	if(e.keyCode == 90) {
		keys[0xa] = 0;
	}
	if(e.keyCode == 88) {
		keys[0x0] = 0;
	}
	if(e.keyCode == 67) {
		keys[0xb] = 0;
	}
	if(e.keyCode == 86) {
		keys[0xf] = 0;
	}
}


