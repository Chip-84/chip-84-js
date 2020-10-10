function memset(array, number, size) {
	for(var i = 0; i < size; i++) {
		array[i] = number;
	}
}

function memset(array, number, size, array_start) {
	for(var i = array_start; i < size; i++) {
		array[i] = number;
	}
}

function memcpy2(dst, dstOffset, src, srcOffset, length) {
	for(var i = 0; i < length; i++) {
		dst[i + dstOffset] = src[i + srcOffset];
	}
}

function memcpy(dst, dstOffset, src, srcOffset, length) {
	var i;

	src = src.subarray || src.slice ? src : src.buffer;
	dst = dst.subarray || dst.slice ? dst : dst.buffer;

	src = srcOffset ? src.subarray ?
		src.subarray(srcOffset, length && srcOffset + length) :
		src.slice(srcOffset, length && srcOffset + length) : src;

	if (dst.set) {
		dst.set(src, dstOffset);
	} else {
		for (i=0; i<src.length; i++) {
			dst[i + dstOffset] = src[i];
		}
	}

	return dst;
}