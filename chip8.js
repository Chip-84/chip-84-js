var opcode = 0;
var memory = new Uint8Array(0x10000);
var SV = new Uint8Array(8);
var V = new Uint8Array(16);
var I = 0;
var pc = 0;
var delay_timer = 0;
var sound_timer = 0;
var stack = new Uint16Array(16);
var sp = 0;
var keys = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var drawFlag = false;

var paused = false;
var playing = false;
var extendedScreen = 0;

var canvas_data = new Uint8Array(8192);

var fontset = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, //0
    0x20, 0x60, 0x20, 0x20, 0x70, //1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, //2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, //3
    0x90, 0x90, 0xF0, 0x10, 0x10, //4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, //5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, //6
    0xF0, 0x10, 0x20, 0x40, 0x40, //7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, //8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, //9
    0xF0, 0x90, 0xF0, 0x90, 0x90, //A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, //B
    0xF0, 0x80, 0x80, 0x80, 0xF0, //C
    0xE0, 0x90, 0x90, 0x90, 0xE0, //D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, //E
    0xF0, 0x80, 0xF0, 0x80, 0x80  //F
];
var fontset_ten = [
	0x7C, 0xC6, 0xCE, 0xDE, 0xD6, 0xF6, 0xE6, 0xC6, 0x7C, 0x00, // 0
	0x10, 0x30, 0xF0, 0x30, 0x30, 0x30, 0x30, 0x30, 0xFC, 0x00, // 1
	0x78, 0xCC, 0xCC, 0x0C, 0x18, 0x30, 0x60, 0xCC, 0xFC, 0x00, // 2
	0x78, 0xCC, 0x0C, 0x0C, 0x38, 0x0C, 0x0C, 0xCC, 0x78, 0x00, // 3
	0x0C, 0x1C, 0x3C, 0x6C, 0xCC, 0xFE, 0x0C, 0x0C, 0x1E, 0x00, // 4
	0xFC, 0xC0, 0xC0, 0xC0, 0xF8, 0x0C, 0x0C, 0xCC, 0x78, 0x00, // 5
	0x38, 0x60, 0xC0, 0xC0, 0xF8, 0xCC, 0xCC, 0xCC, 0x78, 0x00, // 6
	0xFE, 0xC6, 0xC6, 0x06, 0x0C, 0x18, 0x30, 0x30, 0x30, 0x00, // 7
	0x78, 0xCC, 0xCC, 0xEC, 0x78, 0xDC, 0xCC, 0xCC, 0x78, 0x00, // 8
	0x7C, 0xC6, 0xC6, 0xC6, 0x7E, 0x0C, 0x18, 0x30, 0x70, 0x00, // 9
	0x30, 0x78, 0xCC, 0xCC, 0xCC, 0xFC, 0xCC, 0xCC, 0xCC, 0x00, // A
	0xFC, 0x66, 0x66, 0x66, 0x7C, 0x66, 0x66, 0x66, 0xFC, 0x00, // B
	0x3C, 0x66, 0xC6, 0xC0, 0xC0, 0xC0, 0xC6, 0x66, 0x3C, 0x00, // C
	0xF8, 0x6C, 0x66, 0x66, 0x66, 0x66, 0x66, 0x6C, 0xF8, 0x00, // D
	0xFE, 0x62, 0x60, 0x64, 0x7C, 0x64, 0x60, 0x62, 0xFE, 0x00, // E
	0xFE, 0x66, 0x62, 0x64, 0x7C, 0x64, 0x60, 0x60, 0xF0, 0x00  // F
];

var step = 0;
var pixel;

var _y;
var _x;

var screen_width;
var screen_height;
var pixel_number;

function initialize() {
	opcode = I = sp = delay_timer = sound_timer = 0;
	pc = 0x200;
	
	extendedScreen = 0;
	screen_width = 64;
	screen_height = 32;
	
	pixel_number = 2048;
	
	canvas_data.fill(0);
	memset(keys, 0, 16);
	stack.fill(0);
	V.fill(0);
	SV.fill(0);
	memory.fill(0);
	
	memcpy2(memory, 0, fontset, 0, 80);
	memcpy2(memory, 80, fontset_ten, 0, 160);
}

function loadProgram(data) {
	playing = true;
	paused = false;
	
	var romSize = data.length;
	initialize();
	
	if((4096-512) > romSize) {
		for(var i = 0; i < romSize; ++i) {
			memory[i + 512] = data[i];
		}
	}
}

function skip() {
	pc += (opcode == 0xf000) ? 4 : 2;
}

function emulateCycle(steps) {
	for(step = 0; step < steps; ++step) {
		var i;
		var x;
		var y;
		opcode = (memory[pc] << 8) | memory[pc + 1];
		x = (opcode & 0x0f00) >> 8;
		y = (opcode & 0x00f0) >> 4;
		
		pc += 2;
		
		switch(opcode & 0xf000) {
			case 0x0000: {
				switch(opcode & 0x00f0) {
					case 0x00c0: {
						var n = (opcode & 0x000f);
						
						drawFlag = true;
						
						for(i = screen_height - 2; i >= 0; i--) {
							memcpy2(canvas_data, (i + n) * screen_width, canvas_data, i * screen_width, screen_width);
							canvas_data.fill(0, i * screen_width, i * screen_width + screen_width);
						}
						
						break;
					}
					break;
				}
				switch(opcode & 0x00ff) {
					case 0x00e0:
						drawFlag = true;
						canvas_data.fill(0);
						break;
					case 0x00ee:
						pc = stack[(--sp)&0xf];
						break;
					case 0x00fb: {
						var offset = 0;
						
						for(i = 0; i < screen_height; i++) {
							canvas_data.copyWithin(4 + offset, offset, offset + screen_width - 4);
							canvas_data.fill(0, offset, offset + 4);
							offset += screen_width;
						}
						break;
					}
					case 0x00fc: {
						var offset = 0;
						
						for(i = 0; i < screen_height; i++) {
							canvas_data.copyWithin(offset, 4 + offset, offset + 4 + screen_width);
							canvas_data.fill(0, offset + screen_width - 4, offset + screen_width);
							offset += screen_width;
						}
						break;
					}
					case 0x00fd:
						playing = 0;
						break;
					case 0x00fe:
						extendedScreen = 0;
						screen_width = 64;
						screen_height = 32;
						pixel_number = 2048;
						break;
					case 0x00ff:
						extendedScreen = 1;
						screen_width = 128;
						screen_height = 64;
						pixel_number = 8192;
						break;
					default:
						pc = (pc & 0x0fff);
						break;
				}
				break;
			}
			case 0x1000: {
				pc = (opcode & 0x0fff);
				break;
			}
			case 0x2000: {
				stack[sp++] = pc;
				pc = (opcode & 0x0fff);
				break;
			}
			case 0x3000: {
				if(V[x] == (opcode & 0x00ff))
					skip();
				break;
			}
			case 0x4000: {
				if(V[x] != (opcode & 0x00ff))
					skip();
				break;
			}
			case 0x5000: {
				switch(opcode & 0x000f) {
					case 0x0000: {
						if(V[x] == V[y])
							skip();
						break;
					}
					case 0x0002: {
						var dist = Math.abs(x - y);
						var z = 0;
						if(x < y) {
							for(z = 0; z <= dist; z++) {
								memory[I + z] = V[x + z];
							}
						} else {
							for(z = 0; z <= dist; z++) {
								memory[I + z] = V[x - z];
							}
						}
						break;
					}
					case 0x0003: {
						var dist = Math.abs(x - y);
						var z = 0;
						if(x < y) {
							for(z = 0; z <= dist; z++) {
								memory[x + z] = V[I + z];
							}
						} else {
							for(z = 0; z <= dist; z++) {
								memory[x - z] = V[I - z];
							}
						}
						break;
					}
					break;
				}
				break;
			}
			case 0x6000: {
				V[x] = (opcode & 0x00ff);
				break;
			}
			case 0x7000: {
				V[x] = (V[x] + (opcode & 0x00ff)) & 0xff;
				break;
			}
			case 0x8000: {
				switch(opcode & 0x000f) {
					case 0x0000: {
						V[x]  = V[y];
						break;
					}
					case 0x0001: {
						V[x] |= V[y];
						break;
					}
					case 0x0002: {
						V[x] &= V[y];
						break;
					}
					case 0x0003: {
						V[x] ^= V[y];
						break;
					}
					case 0x0004: {
						V[0xf] = (V[x] + V[y] > 0xff);
						V[x] += V[y];
						V[x] &= 255;
						break;
					}
					case 0x0005: {
						V[0xf] = V[x] >= V[y];
						V[x] -= V[y];
						break;
					}
					case 0x0006: {
						V[0xf] = V[x] & 1;
						V[x] >>= 1;
						break;
					}
					case 0x0007: {
						V[0xf] = V[y] >= V[x];
						V[x] = V[y] - V[x];
						break;
					}
					case 0x000E: {
						V[0xf] = V[x] >> 7;
						V[x] <<= 1;
						break;
					}
					break;
				}
				break;
			}
			case 0x9000: {
				if(V[x] != V[y])
					skip();
				break;
			}
			case 0xa000: {
				I = (opcode & 0x0fff);
				break;
			}
			case 0xb000: {
				pc = V[0] + (opcode & 0x0fff);
				break;
			}
			case 0xc000: {
				var rand = Math.floor(Math.random() * 256);
				V[x] = rand & (opcode & 0x00FF);
				break;
			}
			case 0xd000: {
				var xd = V[x];
				var yd = V[y];
				var height = (opcode & 0x000f);
				var index;
				
				V[0xf] = 0;
				
				drawFlag = true;
				
				if(extendedScreen) {
					//Extended screen DXY0
					var cols = 1;
					if(height == 0) {
						cols = 2;
						height = 16;
					}
					for(_y = 0; _y < height; ++_y) {
						pixel = memory[I + (cols*_y)];
						if(cols == 2) {
							pixel <<= 8;
							pixel |= memory[I + (_y << 1)+1];
						}
						for(_x = 0; _x < (cols << 3); ++_x) {
							if((pixel & (((cols == 2) ? 0x8000 : 0x80) >> _x)) != 0) {
								index = (((xd + _x) & 0x7f) + (((yd + _y) & 0x3f) << 7));
								V[0xf] |= canvas_data[index] & 1;
								if (canvas_data[index])
									canvas_data[index] = 0;
								else
									canvas_data[index] = 1;
							}
						}
					}
				} else {
					//Normal screen DXYN
					if(height == 0) height = 16;
					for(_y = 0; _y < height; ++_y) {
						pixel = memory[I + _y];
						for(_x = 0; _x < 8; ++_x) {
							if((pixel & (0x80 >> _x)) != 0) {
								index = (((xd + _x) & 0x3f) + (((yd + _y) & 0x1f) << 6));
								V[0xf] |= canvas_data[index] & 1;
								if (canvas_data[index])
									canvas_data[index] = 0;
								else
									canvas_data[index] = 1;
							}
						}
					}
				}
				
				break;
			}
			case 0xe000: {
				switch(opcode & 0x00ff) {
					case 0x009e: {
						if(keys[V[x]])
							skip();
						break;
					}
					case 0x00a1: {
						if(!keys[V[x]])
							skip();
						break;
					}
				}
				break;
			}
			case 0xf000: {
				switch(opcode & 0x00ff) {
					case 0x0000: {
						I = opcode & 0xffff;
						pc += 2;
						break;
					}
					case 0x0001: {
						plane = (x & 0x3);
						break;
					}
					case 0x0002: {
						var z;
						for(z = 0; z < 16; z++) {
							pattern[z] = memory[I + z];
						}
						break;
					}
					case 0x0007: {
						V[x] = delay_timer;
						break;
					}
					case 0x000A: {
						var key_pressed = false;
						pc -= 2;
						
						for(i = 0; i < 16; ++i) {
							if(keys[i]) {
								V[x] = i;
								pc += 2;
								key_pressed = true;
								break;
							}
						}
						
						if(!key_pressed)
							return;
					}
					case 0x0015: {
						delay_timer = V[x];
						break;
					}
					case 0x0018: {
						sound_timer = V[x];
						break;
					}
					case 0x001E: {
						V[0xf] = (I + V[x] > 0xff);
						I = (I + V[x]) & 0xffff;
						break;
					}
					case 0x0029: {
						I = (V[x] & 0xf) * 5;
						break;
					}
					case 0x0030: {
						I = (V[x] & 0xf) * 10 + 80;
						break;
					}
					case 0x0033: {
						memory[ I ] = V[x] / 100;
						memory[I+1] = (V[x] / 10) % 10;
						memory[I+2] = V[x] % 10;
						break;
					}
					case 0x0055: {
						for(i = 0; i <= x; ++i) {
							memory[I + i] = V[i];
						}
						break;
					}
					case 0x0065: {
						for(i = 0; i <= x; ++i) {
							V[i] = memory[I + i];
						}
						break;
					}
					case 0x0075: {
						if (x > 7) x = 7;
						for(i = 0; i <= x; ++i) {
							SV[i] = V[i];
						}
						break;
					}
					case 0x0085: {
						if (x > 7) x = 7;
						for(i = 0; i <= x; ++i) {
							V[i] = SV[i];
						}
						break;
					}
				}
				break;
			}
			default:
				break;
		}
	}
	if(sound_timer > 0) {
		--sound_timer;
	}
	if(delay_timer > 0) {
		--delay_timer;
	}
}