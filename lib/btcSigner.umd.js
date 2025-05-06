if (!globalThis.process?.browser) {
    globalThis.process = { browser: true, env: {}, };
}
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["btcSigner"] = factory();
	else
		root["btcSigner"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 9:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 111:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 251:
/***/ ((__unused_webpack_module, exports) => {

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ }),

/***/ 287:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */



const base64 = __webpack_require__(526)
const ieee754 = __webpack_require__(251)
const customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol['for'] === 'function') // eslint-disable-line dot-notation
    ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
    : null

exports.hp = Buffer
__webpack_unused_export__ = SlowBuffer
exports.IS = 50

const K_MAX_LENGTH = 0x7fffffff
__webpack_unused_export__ = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    const arr = new Uint8Array(1)
    const proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  const buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayView(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof SharedArrayBuffer !== 'undefined' &&
      (isInstance(value, SharedArrayBuffer) ||
      (value && isInstance(value.buffer, SharedArrayBuffer)))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  const valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  const b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length)
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpreted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  const length = byteLength(string, encoding) | 0
  let buf = createBuffer(length)

  const actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  const length = array.length < 0 ? 0 : checked(array.length) | 0
  const buf = createBuffer(length)
  for (let i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayView (arrayView) {
  if (isInstance(arrayView, Uint8Array)) {
    const copy = new Uint8Array(arrayView)
    return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength)
  }
  return fromArrayLike(arrayView)
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  let buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    const len = checked(obj.length) | 0
    const buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  let x = a.length
  let y = b.length

  for (let i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  let i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  const buffer = Buffer.allocUnsafe(length)
  let pos = 0
  for (i = 0; i < list.length; ++i) {
    let buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      if (pos + buf.length > buffer.length) {
        if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf)
        buf.copy(buffer, pos)
      } else {
        Uint8Array.prototype.set.call(
          buffer,
          buf,
          pos
        )
      }
    } else if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    } else {
      buf.copy(buffer, pos)
    }
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  const len = string.length
  const mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  let loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  let loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  const i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  const len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (let i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  const len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (let i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  const len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (let i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  const length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  let str = ''
  const max = exports.IS
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  let x = thisEnd - thisStart
  let y = end - start
  const len = Math.min(x, y)

  const thisCopy = this.slice(thisStart, thisEnd)
  const targetCopy = target.slice(start, end)

  for (let i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  let indexSize = 1
  let arrLength = arr.length
  let valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  let i
  if (dir) {
    let foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      let found = true
      for (let j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  const remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  const strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  let i
  for (i = 0; i < length; ++i) {
    const parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  const remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  let loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
      case 'latin1':
      case 'binary':
        return asciiWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  const res = []

  let i = start
  while (i < end) {
    const firstByte = buf[i]
    let codePoint = null
    let bytesPerSequence = (firstByte > 0xEF)
      ? 4
      : (firstByte > 0xDF)
          ? 3
          : (firstByte > 0xBF)
              ? 2
              : 1

    if (i + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
const MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  const len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  let res = ''
  let i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  let ret = ''
  end = Math.min(buf.length, end)

  for (let i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  let ret = ''
  end = Math.min(buf.length, end)

  for (let i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  const len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  let out = ''
  for (let i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]]
  }
  return out
}

function utf16leSlice (buf, start, end) {
  const bytes = buf.slice(start, end)
  let res = ''
  // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
  for (let i = 0; i < bytes.length - 1; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  const len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  const newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUintLE =
Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let val = this[offset]
  let mul = 1
  let i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUintBE =
Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  let val = this[offset + --byteLength]
  let mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUint8 =
Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUint16LE =
Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUint16BE =
Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUint32LE =
Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUint32BE =
Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const lo = first +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 24

  const hi = this[++offset] +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    last * 2 ** 24

  return BigInt(lo) + (BigInt(hi) << BigInt(32))
})

Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const hi = first * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    this[++offset]

  const lo = this[++offset] * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    last

  return (BigInt(hi) << BigInt(32)) + BigInt(lo)
})

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let val = this[offset]
  let mul = 1
  let i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let i = byteLength
  let mul = 1
  let val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  const val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  const val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const val = this[offset + 4] +
    this[offset + 5] * 2 ** 8 +
    this[offset + 6] * 2 ** 16 +
    (last << 24) // Overflow

  return (BigInt(val) << BigInt(32)) +
    BigInt(first +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 24)
})

Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const val = (first << 24) + // Overflow
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    this[++offset]

  return (BigInt(val) << BigInt(32)) +
    BigInt(this[++offset] * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    last)
})

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUintLE =
Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    const maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  let mul = 1
  let i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUintBE =
Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    const maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  let i = byteLength - 1
  let mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUint8 =
Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUint16LE =
Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUint16BE =
Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUint32LE =
Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUint32BE =
Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function wrtBigUInt64LE (buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7)

  let lo = Number(value & BigInt(0xffffffff))
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  return offset
}

function wrtBigUInt64BE (buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7)

  let lo = Number(value & BigInt(0xffffffff))
  buf[offset + 7] = lo
  lo = lo >> 8
  buf[offset + 6] = lo
  lo = lo >> 8
  buf[offset + 5] = lo
  lo = lo >> 8
  buf[offset + 4] = lo
  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
  buf[offset + 3] = hi
  hi = hi >> 8
  buf[offset + 2] = hi
  hi = hi >> 8
  buf[offset + 1] = hi
  hi = hi >> 8
  buf[offset] = hi
  return offset + 8
}

Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE (value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
})

Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE (value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
})

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    const limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  let i = 0
  let mul = 1
  let sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    const limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  let i = byteLength - 1
  let mul = 1
  let sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE (value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
})

Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE (value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
})

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  const len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      const code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  } else if (typeof val === 'boolean') {
    val = Number(val)
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  let i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    const bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    const len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// CUSTOM ERRORS
// =============

// Simplified versions from Node, changed for Buffer-only usage
const errors = {}
function E (sym, getMessage, Base) {
  errors[sym] = class NodeError extends Base {
    constructor () {
      super()

      Object.defineProperty(this, 'message', {
        value: getMessage.apply(this, arguments),
        writable: true,
        configurable: true
      })

      // Add the error code to the name to include it in the stack trace.
      this.name = `${this.name} [${sym}]`
      // Access the stack to generate the error message including the error code
      // from the name.
      this.stack // eslint-disable-line no-unused-expressions
      // Reset the name to the actual name.
      delete this.name
    }

    get code () {
      return sym
    }

    set code (value) {
      Object.defineProperty(this, 'code', {
        configurable: true,
        enumerable: true,
        value,
        writable: true
      })
    }

    toString () {
      return `${this.name} [${sym}]: ${this.message}`
    }
  }
}

E('ERR_BUFFER_OUT_OF_BOUNDS',
  function (name) {
    if (name) {
      return `${name} is outside of buffer bounds`
    }

    return 'Attempt to access memory outside buffer bounds'
  }, RangeError)
E('ERR_INVALID_ARG_TYPE',
  function (name, actual) {
    return `The "${name}" argument must be of type number. Received type ${typeof actual}`
  }, TypeError)
E('ERR_OUT_OF_RANGE',
  function (str, range, input) {
    let msg = `The value of "${str}" is out of range.`
    let received = input
    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
      received = addNumericalSeparator(String(input))
    } else if (typeof input === 'bigint') {
      received = String(input)
      if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
        received = addNumericalSeparator(received)
      }
      received += 'n'
    }
    msg += ` It must be ${range}. Received ${received}`
    return msg
  }, RangeError)

function addNumericalSeparator (val) {
  let res = ''
  let i = val.length
  const start = val[0] === '-' ? 1 : 0
  for (; i >= start + 4; i -= 3) {
    res = `_${val.slice(i - 3, i)}${res}`
  }
  return `${val.slice(0, i)}${res}`
}

// CHECK FUNCTIONS
// ===============

function checkBounds (buf, offset, byteLength) {
  validateNumber(offset, 'offset')
  if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
    boundsError(offset, buf.length - (byteLength + 1))
  }
}

function checkIntBI (value, min, max, buf, offset, byteLength) {
  if (value > max || value < min) {
    const n = typeof min === 'bigint' ? 'n' : ''
    let range
    if (byteLength > 3) {
      if (min === 0 || min === BigInt(0)) {
        range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`
      } else {
        range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and < 2 ** ` +
                `${(byteLength + 1) * 8 - 1}${n}`
      }
    } else {
      range = `>= ${min}${n} and <= ${max}${n}`
    }
    throw new errors.ERR_OUT_OF_RANGE('value', range, value)
  }
  checkBounds(buf, offset, byteLength)
}

function validateNumber (value, name) {
  if (typeof value !== 'number') {
    throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value)
  }
}

function boundsError (value, length, type) {
  if (Math.floor(value) !== value) {
    validateNumber(value, type)
    throw new errors.ERR_OUT_OF_RANGE(type || 'offset', 'an integer', value)
  }

  if (length < 0) {
    throw new errors.ERR_BUFFER_OUT_OF_BOUNDS()
  }

  throw new errors.ERR_OUT_OF_RANGE(type || 'offset',
                                    `>= ${type ? 1 : 0} and <= ${length}`,
                                    value)
}

// HELPER FUNCTIONS
// ================

const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  let codePoint
  const length = string.length
  let leadSurrogate = null
  const bytes = []

  for (let i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  const byteArray = []
  for (let i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  let c, hi, lo
  const byteArray = []
  for (let i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  let i
  for (i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
const hexSliceLookupTable = (function () {
  const alphabet = '0123456789abcdef'
  const table = new Array(256)
  for (let i = 0; i < 16; ++i) {
    const i16 = i * 16
    for (let j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

// Return not function with Error if BigInt not supported
function defineBigIntMethod (fn) {
  return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn
}

function BufferBigIntNotDefined () {
  throw new Error('BigInt not supported')
}


/***/ }),

/***/ 401:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 526:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}


/***/ }),

/***/ 539:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 672:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 707:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 726:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 730:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 920:
/***/ (() => {

/* (ignored) */

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  BigNumber: () => (/* reexport */ BigNumber),
  CoinBalance: () => (/* reexport */ CoinBalance),
  CoinProvider: () => (/* reexport */ CoinProvider),
  CoinTX: () => (/* reexport */ CoinTX),
  CoinWallet: () => (/* reexport */ CoinWallet),
  DEFAULT_FEE_MULTIPLIER: () => (/* reexport */ DEFAULT_FEE_MULTIPLIER),
  MempoolProvider: () => (/* reexport */ MempoolProvider),
  MnemonicWallet: () => (/* reexport */ MnemonicWallet),
  RBF_INPUT_SEQUENCE: () => (/* reexport */ RBF_INPUT_SEQUENCE),
  VoidWallet: () => (/* reexport */ VoidWallet),
  addrTypes: () => (/* reexport */ addrTypes),
  base64ToBytes: () => (/* reexport */ base64ToBytes),
  binaryToBytes: () => (/* reexport */ binaryToBytes),
  bitcoin: () => (/* reexport */ factory_bitcoin),
  bytesToBase64: () => (/* reexport */ bytesToBase64),
  bytesToBinary: () => (/* reexport */ bytesToBinary),
  bytesToHex: () => (/* reexport */ bytesToHex),
  checkHex: () => (/* reexport */ checkHex),
  chunk: () => (/* reexport */ chunk),
  crypto: () => (/* reexport */ cryptoUtils_crypto),
  decryptString: () => (/* reexport */ decryptString),
  digest: () => (/* reexport */ digest),
  electrumKeys: () => (/* reexport */ electrumKeys),
  encryptString: () => (/* reexport */ encryptString),
  entropyToMnemonic: () => (/* reexport */ entropyToMnemonic),
  formatCoins: () => (/* reexport */ formatCoins),
  generateHexWithId: () => (/* reexport */ generateHexWithId),
  generateHexWithIdLegacy: () => (/* reexport */ generateHexWithIdLegacy),
  generateMnemonicWithId: () => (/* reexport */ generateMnemonicWithId),
  getAddress: () => (/* reexport */ getAddress),
  getBytes: () => (/* reexport */ getBytes),
  getDerivation: () => (/* reexport */ getDerivation),
  getEntropy: () => (/* reexport */ getEntropy),
  getInputs: () => (/* reexport */ getInputs),
  getKeyAndIv: () => (/* reexport */ getKeyAndIv),
  getMnemonic: () => (/* reexport */ getMnemonic),
  getPubBytes: () => (/* reexport */ getPubBytes),
  getRandomMnemonic: () => (/* reexport */ getRandomMnemonic),
  getScriptType: () => (/* reexport */ getScriptType),
  hexToBytes: () => (/* reexport */ hexToBytes),
  isNode: () => (/* reexport */ isNode),
  mnemonicToEntropy: () => (/* reexport */ mnemonicToEntropy),
  mnemonicToSeed: () => (/* reexport */ mnemonicToSeed),
  parseCoins: () => (/* reexport */ parseCoins),
  pbkdf2: () => (/* reexport */ pbkdf2),
  rBytes: () => (/* reexport */ rBytes),
  repeatDigest: () => (/* reexport */ repeatDigest),
  sleep: () => (/* reexport */ sleep),
  textDecoder: () => (/* reexport */ textDecoder),
  textEncoder: () => (/* reexport */ textEncoder)
});

// EXTERNAL MODULE: bignumber.js (ignored)
var bignumber_ignored_ = __webpack_require__(726);
// EXTERNAL MODULE: ./node_modules/buffer/index.js
var buffer = __webpack_require__(287);
// EXTERNAL MODULE: bitcoinjs-lib (ignored)
var bitcoinjs_lib_ignored_ = __webpack_require__(111);
// EXTERNAL MODULE: bip32 (ignored)
var bip32_ignored_ = __webpack_require__(672);
var bip32_ignored_default = /*#__PURE__*/__webpack_require__.n(bip32_ignored_);
// EXTERNAL MODULE: bip39 (ignored)
var bip39_ignored_ = __webpack_require__(707);
// EXTERNAL MODULE: bs58check (ignored)
var bs58check_ignored_ = __webpack_require__(920);
var bs58check_ignored_default = /*#__PURE__*/__webpack_require__.n(bs58check_ignored_);
// EXTERNAL MODULE: ecpair (ignored)
var ecpair_ignored_ = __webpack_require__(730);
var ecpair_ignored_default = /*#__PURE__*/__webpack_require__.n(ecpair_ignored_);
// EXTERNAL MODULE: @bitcoinerlab/secp256k1 (ignored)
var secp256k1_ignored_ = __webpack_require__(539);
// EXTERNAL MODULE: coininfo (ignored)
var coininfo_ignored_ = __webpack_require__(9);
var coininfo_ignored_default = /*#__PURE__*/__webpack_require__.n(coininfo_ignored_);
;// ./src/bitcoinjs.ts









const bitcoin = bitcoinjs_lib_ignored_;
if (bitcoin?.initEccLib) {
  bitcoin.initEccLib(secp256k1_ignored_);
  bitcoin.bip32 = bip32_ignored_default()(secp256k1_ignored_);
  bitcoin.bip39 = bip39_ignored_;
  bitcoin.bs58check = (bs58check_ignored_default());
  bitcoin.Buffer = buffer/* Buffer */.hp;
  bitcoin.coininfo = (coininfo_ignored_default());
  bitcoin.ECPair = ecpair_ignored_default()(secp256k1_ignored_);
}

;// ./src/factory.ts



const factory_bitcoin = globalThis?.bitcoin || bitcoin;
const BigNumber = globalThis?.BigNumber || bignumber_ignored_.BigNumber;

;// ./src/coinUtils.ts


const { opcodes, payments } = factory_bitcoin;
function formatCoins(amount, decimals = 8) {
  return BigNumber(String(amount)).div(10 ** decimals).toString();
}
function parseCoins(amount, decimals = 8) {
  return BigNumber(amount).times(10 ** decimals).toNumber();
}
function getDerivation(addrType) {
  switch (addrType) {
    // https://github.com/bitcoin/bips/blob/master/bip-0086.mediawiki
    case "taproot":
      return 86;
    // https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki
    case "bech32":
      return 84;
    // https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki
    case "segwit":
      return 49;
    // https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
    default:
      return 44;
  }
}
function getBytes(addrType, isInput = true) {
  switch (addrType) {
    case "taproot":
      return isInput ? 58 : 43;
    case "bech32":
      return isInput ? 68 : 31;
    case "segwit":
      return isInput ? 91 : 32;
    case "legacy":
      return isInput ? 148 : 34;
    default:
      return isInput ? 392 : 34;
  }
}
function getScriptType(script) {
  if (script[0] === opcodes.OP_1 && script[1] === 32) {
    return "taproot";
  }
  if (script[0] == opcodes.OP_0 && script[1] == 20) {
    return "bech32";
  }
  if (script[0] == opcodes.OP_HASH160 && script[1] == 20) {
    return "segwit";
  }
  if (script[0] == opcodes.OP_DUP && script[1] == opcodes.OP_HASH160 && script[2] == 20) {
    return "legacy";
  }
  throw new Error("Unknown address");
}
function getAddress(pubkey, addrType, network) {
  if (addrType === "taproot") {
    const internalPubkey = pubkey.slice(1, 33);
    return payments.p2tr({
      internalPubkey,
      network
    }).address;
  } else if (addrType === "bech32") {
    return payments.p2wpkh({
      pubkey,
      network
    }).address;
  } else if (addrType === "segwit") {
    const redeem = payments.p2wpkh({
      pubkey,
      network
    });
    return payments.p2sh({
      redeem,
      network
    }).address;
  } else if (addrType === "legacy") {
    return payments.p2pkh({
      pubkey,
      network
    }).address;
  }
}
function getPubBytes(addrType) {
  switch (addrType) {
    case "segwit":
      return "049d7cb2";
    case "bech32":
      return "04b24746";
    default:
      return "0488b21e";
  }
}

// EXTERNAL MODULE: crypto (ignored)
var crypto_ignored_ = __webpack_require__(401);
;// ./src/cryptoUtils.ts


const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const isNode = !process?.browser && typeof globalThis.window === "undefined";
const cryptoUtils_crypto = isNode ? crypto_ignored_.webcrypto : globalThis.crypto;
function hexToBytes(input) {
  let hex = typeof input === "bigint" ? input.toString(16) : input;
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }
  if (hex.length % 2 !== 0) {
    hex = "0" + hex;
  }
  return Uint8Array.from(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}
function binaryToBytes(binaryString) {
  while (binaryString.length % 8 != 0) {
    binaryString = "0" + binaryString;
  }
  return new Uint8Array(binaryString.match(/(.{1,8})/g)?.map((bin) => parseInt(bin, 2)) || []);
}
function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
function bytesToHex(bytes) {
  return "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function bytesToBinary(bytes) {
  return Array.from(bytes).map((b) => b.toString(2).padStart(8, "0")).join("");
}
function bytesToBase64(bytes) {
  return btoa(bytes.reduce((data, byte) => data + String.fromCharCode(byte), ""));
}
function rBytes(bytesLength = 32) {
  return cryptoUtils_crypto.getRandomValues(new Uint8Array(bytesLength));
}
async function digest(input, algorithm = "SHA-512") {
  return new Uint8Array(await cryptoUtils_crypto.subtle.digest(algorithm, input));
}
async function repeatDigest(input, count = 1, algorithm = "SHA-512") {
  if (count < 1) {
    throw new Error("Invalid sha count");
  }
  for (let i = 0; i < count; ++i) {
    input = bytesToHex(await digest(textEncoder.encode(input), algorithm)).substring(2);
  }
  return "0x" + input;
}
async function pbkdf2(input, salt, iterations = 2048, byteLength = 512, hash = "SHA-512") {
  const baseKey = await cryptoUtils_crypto.subtle.importKey("raw", input, "PBKDF2", false, ["deriveBits"]);
  const arrayBuffer = await cryptoUtils_crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash,
      salt,
      iterations
    },
    baseKey,
    byteLength
  );
  return new Uint8Array(arrayBuffer);
}
async function getKeyAndIv(password, salt, hash = "SHA-512", iterations = 1e4, cipher = "AES-CBC", cipherLength = 256) {
  const enc = textEncoder.encode(password);
  const keys = await pbkdf2(enc, salt, iterations, cipherLength + 128, hash);
  const iv = keys.slice(cipherLength / 8);
  const key = await cryptoUtils_crypto.subtle.importKey("raw", keys.slice(0, cipherLength / 8), cipher, false, [
    "encrypt",
    "decrypt"
  ]);
  return { iv, key };
}
async function encryptString(plainString, password, saltArray, hash = "SHA-512", iterations = 1e4, cipher = "AES-CBC", cipherLength = 256, saltSize = 8) {
  const salt = saltArray || rBytes(saltSize);
  const { iv, key } = await getKeyAndIv(password, salt, hash, iterations, cipher, cipherLength);
  const cipherBuffer = new Uint8Array(
    await cryptoUtils_crypto.subtle.encrypt(
      {
        name: cipher,
        iv
      },
      key,
      textEncoder.encode(plainString)
    )
  );
  const prefix = textEncoder.encode("Salted__");
  const enc = new Uint8Array(prefix.byteLength + salt.byteLength + cipherBuffer.byteLength);
  enc.set(prefix, 0);
  enc.set(salt, prefix.byteLength);
  enc.set(cipherBuffer, prefix.byteLength + salt.byteLength);
  return bytesToBase64(enc);
}
async function decryptString(encryptedString, password, hash = "SHA-512", iterations = 1e4, cipher = "AES-CBC", cipherLength = 256, saltSize = 8) {
  const enc = base64ToBytes(encryptedString);
  const prefixLength = 8;
  const saltLength = prefixLength + saltSize;
  const prefix = enc.slice(0, prefixLength);
  const salt = enc.slice(prefixLength, saltLength);
  const data = enc.slice(saltLength);
  if (textDecoder.decode(prefix) !== "Salted__") {
    throw new Error("Encrypted data not salted?");
  }
  const { iv, key } = await getKeyAndIv(password, salt, hash, iterations, cipher, cipherLength);
  try {
    const decrypted = await cryptoUtils_crypto.subtle.decrypt(
      {
        name: cipher,
        iv
      },
      key,
      data
    );
    return textDecoder.decode(decrypted);
  } catch (e) {
    if (!e.message) {
      throw new Error(
        "Failed to decrypt with blank error, make sure you have the correct data / password"
      );
    }
    throw e;
  }
}

;// ./src/emailSeed.ts



const { bip39, Buffer } = factory_bitcoin;
const entropyToMnemonic = bip39.entropyToMnemonic;
const mnemonicToEntropy = bip39.mnemonicToEntropy;
const mnemonicToSeed = bip39.mnemonicToSeed;
function generateHexWithIdLegacy(email, pass) {
  let s = email;
  s += "|" + pass + "|";
  s += s.length + "|!@" + (pass.length * 7 + email.length) * 7;
  const regchars = pass.match(/[a-z]+/g)?.length || 1;
  const regupchars = pass.match(/[A-Z]+/g)?.length || 1;
  const regnums = pass.match(/[0-9]+/g)?.length || 1;
  s += (regnums + regchars + regupchars) * pass.length + "3571";
  s += s + "" + s;
  return repeatDigest(s, 52, "SHA-256");
}
async function generateHexWithId(id, password, thirdParams = [], nonce = 0) {
  if (id.length < 5 || password.length < 5) {
    throw new Error("Invalid id or password length, must longer than 5");
  }
  id = id.normalize("NFKD");
  password = password.normalize("NFKD");
  if (thirdParams.length) {
    thirdParams = thirdParams.map((t) => t.normalize("NFKD"));
  }
  let s = id + "|" + password + "|";
  if (thirdParams.length) {
    s += thirdParams.join("|") + "|";
  }
  s += s.length + `|!@${(password.length * 7 + id.length + thirdParams.length) * 7}`;
  const regchars = password.match(/[a-z]+/g)?.length || 1;
  const regupchars = password.match(/[A-Z]+/g)?.length || 1;
  const regnums = password.match(/[0-9]+/g)?.length || 1;
  s += `${(regnums + regchars + regupchars + nonce) * password.length}${id.length}${password.length}${thirdParams.length}${nonce}`;
  s += "|" + s + "|" + s;
  const [hashedHexString, saltHexString] = await Promise.all([
    repeatDigest(s, 10 + nonce),
    repeatDigest(s.slice(0, Math.floor(s.length / 2)), 7 + nonce)
  ]);
  const encryptedHexString = bytesToHex(
    await pbkdf2(
      textEncoder.encode(hashedHexString.substring(2)),
      textEncoder.encode(saltHexString.substring(2))
    )
  );
  const hashedString = await repeatDigest(encryptedHexString.substring(2), 50 + nonce);
  return hashedString;
}
async function getEntropy(initEntropy, mnemonicLength) {
  const shaHex = await digest(textEncoder.encode(initEntropy), "SHA-256");
  let bins = bytesToBinary(shaHex);
  while (bins.length % 256 != 0) {
    bins = "0" + bins;
  }
  const numberOfBins = 32 * mnemonicLength / 3;
  bins = bins.substring(0, numberOfBins);
  return bytesToHex(binaryToBytes(bins)).substring(2);
}
async function getMnemonic(entropy, mnemonicLength) {
  if (!mnemonicLength) {
    const mnemonic2 = entropyToMnemonic(Buffer.from(entropy, "hex"));
    const seed2 = (await mnemonicToSeed(mnemonic2)).toString("hex");
    return {
      mnemonic: mnemonic2,
      seed: seed2
    };
  }
  const newEntropy = await getEntropy(entropy, mnemonicLength);
  const mnemonic = entropyToMnemonic(Buffer.from(newEntropy, "hex"));
  const seed = (await mnemonicToSeed(mnemonic)).toString("hex");
  return {
    newEntropy,
    mnemonic,
    seed
  };
}
async function getRandomMnemonic(mnemonicLength) {
  const entropy = bytesToHex(cryptoUtils_crypto.getRandomValues(new Uint8Array(32))).substring(2);
  const { newEntropy, mnemonic, seed } = await getMnemonic(entropy, mnemonicLength);
  return {
    entropy: newEntropy || entropy,
    mnemonic,
    seed
  };
}
async function generateMnemonicWithId(id, password, thirdParams = [], mnemonicLength, nonce = 0) {
  const hex = await generateHexWithId(id, password, thirdParams, nonce);
  const prefixLength = 2;
  const entropy = hex.slice(prefixLength, prefixLength + 64);
  const entropy2 = hex.slice(prefixLength + 64);
  const [{ newEntropy, mnemonic, seed }, { newEntropy: newEntropy2, mnemonic: mnemonic2, seed: seed2 }] = await Promise.all([getMnemonic(entropy, mnemonicLength), getMnemonic(entropy2, mnemonicLength)]);
  return {
    hex,
    entropy: newEntropy || entropy,
    entropy2: newEntropy2 || entropy2,
    mnemonic,
    mnemonic2,
    seed,
    seed2
  };
}
/* harmony default export */ const emailSeed = ((/* unused pure expression or super */ null && (generateMnemonicWithId)));

;// ./src/utils.ts

const chunk = (arr, size) => [...Array(Math.ceil(arr.length / size))].map((_, i) => arr.slice(size * i, size + size * i));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function checkHex(hexStr) {
  try {
    if (hexStr.slice(0, 2) !== "0x") {
      return false;
    }
    BigInt(hexStr);
    return true;
  } catch {
    return false;
  }
}

;// ./src/provider.ts



const DEFAULT_FEE_MULTIPLIER = 2;
class CoinProvider {
  backend;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchOptions;
  feeFallback;
  feeMultiplier;
  txChunks;
  range;
  // max scan range
  constructor(config) {
    this.backend = config.backend;
    this.fetchOptions = config.fetchOptions;
    this.feeFallback = config.feeFallback || 1e-5;
    this.feeMultiplier = config.feeMultiplier;
    this.txChunks = config.txChunks || 10;
    this.range = config.range || 20;
  }
  async estimateFee() {
    try {
      const data = await (await fetch(`${this.backend}/api/v2/estimatefee/1`, {
        ...this.fetchOptions || {},
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })).json();
      if (data.error) {
        throw new Error(data.error);
      }
      let parsedFee = Number(data.result);
      if (!parsedFee || parsedFee < this.feeFallback) {
        parsedFee = this.feeFallback;
      }
      const feeMultiplier = await this.feeMultiplier?.() || DEFAULT_FEE_MULTIPLIER;
      return Math.floor(parseCoins(parsedFee * feeMultiplier / 1e3));
    } catch {
      return Math.floor(parseCoins(this.feeFallback / 1e3));
    }
  }
  async getBlockNumber() {
    const resp = await fetch(`${this.backend}/api/blocks/tip/height`, {
      ...this.fetchOptions || {},
      method: "GET"
    });
    const data = await resp.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return Number(data.blockbook?.bestHeight);
  }
  async getUnspent(address, scan = false) {
    let utxoUrl = `${this.backend}/api/v2/utxo/${address}`;
    if (scan) {
      utxoUrl += `?gap=${this.range}`;
    }
    const utxos = await (await fetch(utxoUrl, {
      ...this.fetchOptions || {},
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })).json();
    if (utxos.error) {
      throw new Error(utxos.error);
    }
    return utxos.map((utxo) => {
      const pathSplit = utxo.path ? utxo.path.split("/") : [];
      if (pathSplit[pathSplit.length - 1]) {
        utxo.addressIndex = Number(pathSplit[pathSplit.length - 1]);
      }
      utxo.value = Number(utxo.value);
      utxo.height = Number(utxo.height);
      return utxo;
    }).sort((a, b) => {
      if (a.height === b.height) {
        return a.vout - b.vout;
      }
      return a.height - b.height;
    });
  }
  async getTransactions(txs) {
    const results = [];
    for (const chunks of chunk(txs, this.txChunks)) {
      const chunkResults = await Promise.all(
        chunks.map(async (tx, index) => {
          await sleep(10 * index);
          const result = await (await fetch(`${this.backend}/api/v2/tx/${tx}`, {
            ...this.fetchOptions || {},
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          })).json();
          if (result.error) {
            throw new Error(result.error);
          }
          return result;
        })
      );
      results.push(...chunkResults);
    }
    return results;
  }
  async broadcastTransaction(signedTx) {
    const resp = await fetch(`${this.backend}/api/v2/sendtx/`, {
      ...this.fetchOptions || {},
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: signedTx
    });
    const data = await resp.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.result;
  }
}
class MempoolProvider extends CoinProvider {
  async estimateFee() {
    try {
      const data = await (await fetch(`${this.backend}/api/v1/fees/recommended`, {
        ...this.fetchOptions || {},
        method: "GET"
      })).json();
      if (data.error) {
        throw new Error(data.error);
      }
      const fallbackFee = parseCoins(this.feeFallback / 1e3);
      let parsedFee = Number(data.fastestFee);
      if (!parsedFee || parsedFee < fallbackFee) {
        parsedFee = fallbackFee;
      }
      const feeMultiplier = await this.feeMultiplier?.() || DEFAULT_FEE_MULTIPLIER;
      return Math.floor(parsedFee * feeMultiplier);
    } catch {
      return Math.floor(parseCoins(this.feeFallback / 1e3));
    }
  }
  async getBlockNumber() {
    const resp = await fetch(`${this.backend}/api/blocks/tip/height`, {
      ...this.fetchOptions || {},
      method: "GET"
    });
    if (!resp.ok) {
      throw new Error(await resp.text());
    }
    return Number(await resp.text());
  }
  async getUtxoInternal(address) {
    const resp = await fetch(`${this.backend}/api/address/${address}/utxo`, {
      ...this.fetchOptions || {},
      method: "GET"
    });
    if (!resp.ok) {
      throw new Error(await resp.text());
    }
    return await resp.json();
  }
  async getUnspent(address) {
    const [blockHeight, utxos] = await Promise.all([
      this.getBlockNumber(),
      this.getUtxoInternal(address)
    ]);
    return utxos.map((utxo) => {
      const height = Number(utxo.status?.block_height);
      const confirmations = height ? blockHeight - height + 1 : 0;
      return {
        txid: utxo.txid,
        vout: utxo.vout,
        height,
        confirmations,
        value: Number(utxo.value)
      };
    }).sort((a, b) => {
      if (a.height === b.height) {
        return a.vout - b.vout;
      }
      return a.height - b.height;
    });
  }
  async getTransactions(txs) {
    const results = [];
    for (const chunks of chunk(txs, this.txChunks)) {
      const chunkResults = await Promise.all(
        chunks.map(async (tx, index) => {
          await sleep(10 * index);
          const resp = await fetch(`${this.backend}/api/tx/${tx}/hex`, {
            ...this.fetchOptions || {},
            method: "GET"
          });
          const hex = await resp.text();
          if (!resp.ok) {
            throw new Error(hex);
          }
          return {
            txid: tx,
            hex
          };
        })
      );
      results.push(...chunkResults);
    }
    return results;
  }
  async broadcastTransaction(signedTx) {
    const resp = await fetch(`${this.backend}/api/tx`, {
      ...this.fetchOptions || {},
      method: "POST",
      body: signedTx
    });
    const txid = await resp.text();
    if (!resp.ok) {
      throw new Error(txid);
    }
    return txid;
  }
}
/* harmony default export */ const provider = ((/* unused pure expression or super */ null && (CoinProvider)));

;// ./src/types.ts

const electrumKeys = {
  taproot: "p2tr",
  bech32: "p2wpkh",
  segwit: "p2wpkh-p2sh",
  legacy: "p2pkh",
  p2tr: "taproot",
  p2wpkh: "bech32",
  "p2wpkh-p2sh": "segwit",
  p2pkh: "legacy"
};
const addrTypes = ["legacy", "segwit", "bech32", "taproot"];

;// ./src/wallet.ts





const {
  Psbt,
  Transaction,
  address: bitcoinAddress,
  payments: wallet_payments,
  crypto: bitcoinCrypto,
  networks,
  Buffer: wallet_Buffer,
  bip32,
  bip39: wallet_bip39,
  bs58check,
  ECPair
} = factory_bitcoin;
const RBF_INPUT_SEQUENCE = 4294967293;
function getInputs(utxos, outputs, spendAll = false) {
  if (!outputs.length && !spendAll) {
    throw new Error("getInputs: spendAll not specified but no outputs!");
  }
  const outputAmounts = outputs.reduce((acc, output) => {
    acc += output.value;
    return acc;
  }, 0);
  const { inputs } = utxos.reduce(
    (acc, tx) => {
      if (!spendAll && acc.amounts > outputAmounts) {
        return acc;
      }
      acc.amounts += Number(tx.value);
      acc.inputs.push(tx);
      return acc;
    },
    {
      amounts: 0,
      inputs: []
    }
  );
  if (inputs.length + outputs.length > 650) {
    const error = `Selected UTXO is too big (inputs: ${inputs.length}, outputs: ${outputs.length}), make sure to consolidate UTXOs before using it`;
    throw new Error(error);
  }
  return inputs;
}
class CoinTX {
  psbt;
  fees;
  inputAmounts;
  inputs;
  outputAmounts;
  outputs;
  vBytes;
  txid;
  constructor(props) {
    this.psbt = props.psbt;
    this.fees = props.fees;
    this.inputAmounts = props.inputAmounts;
    this.inputs = props.inputs;
    this.outputAmounts = props.outputAmounts;
    this.outputs = props.outputs;
    this.vBytes = props.vBytes;
  }
  toJSON() {
    return {
      fees: this.fees,
      inputAmounts: this.inputAmounts,
      inputs: this.inputs,
      outputAmounts: this.outputAmounts,
      outputs: this.outputs.map((output) => ({
        value: output.value,
        address: output.address,
        bytes: output.bytes
      })),
      vBytes: this.vBytes,
      txid: this.txid
    };
  }
}
class CoinBalance {
  feePerByte;
  utxos;
  utxoBalance;
  coinbase;
  constructor(props) {
    this.feePerByte = props.feePerByte;
    this.utxos = props.utxos;
    this.utxoBalance = props.utxoBalance;
    this.coinbase = props.coinbase;
  }
}
class CoinWallet {
  provider;
  addrType;
  network;
  address;
  publicKey;
  privateKey;
  privateKeyWithPrefix;
  constructor(provider, config, generateRandom = true) {
    this.provider = provider;
    this.network = config.network || {
      ...networks.bitcoin,
      versions: {
        bip44: 0
      }
    };
    this.addrType = this.network.bech32 ? config.addrType || "taproot" : "legacy";
    const keyPair = config.privateKey ? ECPair.fromWIF(config.privateKey, this.network) : generateRandom ? ECPair.makeRandom({ network: this.network }) : null;
    const pubKey = wallet_Buffer.from(keyPair?.publicKey || []);
    this.address = keyPair ? getAddress(pubKey, this.addrType, this.network) : "";
    this.publicKey = keyPair ? pubKey.toString("hex") : "";
    this.privateKey = keyPair ? keyPair.toWIF() : "";
    this.privateKeyWithPrefix = keyPair ? `${electrumKeys[this.addrType]}:${this.privateKey}` : "";
  }
  static fromBuffer(provider, config, bufferKey) {
    const network = config.network || networks.bitcoin;
    const keyPair = ECPair.fromPrivateKey(bufferKey, { network });
    return new CoinWallet(provider, {
      ...config,
      privateKey: keyPair.toWIF()
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getKey(index = 0) {
    if (!this.privateKey) {
      throw new Error("View only wallet or privateKey not available");
    }
    return ECPair.fromWIF(this.privateKey, this.network);
  }
  getKeyInfo(index = 0) {
    const keyPair = this.getKey(index);
    const pubKey = wallet_Buffer.from(keyPair?.publicKey || []);
    this.address = getAddress(pubKey, this.addrType, this.network);
    this.publicKey = pubKey.toString("hex");
    this.privateKey = keyPair.toWIF();
    this.privateKeyWithPrefix = `${electrumKeys[this.addrType]}:${this.privateKey}`;
    return {
      keyPair,
      address: getAddress(pubKey, this.addrType, this.network),
      publicKey: pubKey.toString("hex"),
      privateKey: keyPair.toWIF(),
      privateKeyWithPrefix: `${electrumKeys[this.addrType]}:${this.privateKey}`
    };
  }
  getBip32Derivation(index = 0) {
    return [];
  }
  getChangeAddress() {
    return this.address;
  }
  getUtxoAddress() {
    return {
      address: this.address
    };
  }
  async getBalance(requiredConfirmations) {
    let coinbase = 0;
    let utxoBalance = 0;
    const provider = this.provider;
    const { address, isPub } = this.getUtxoAddress();
    const [feePerByte, unspents] = await Promise.all([
      provider.estimateFee(),
      provider.getUnspent(address, isPub)
    ]);
    const utxos = unspents.filter((utxo) => {
      if (utxo.coinbase && utxo.confirmations && utxo.confirmations < 100) {
        coinbase += utxo.value;
        return false;
      }
      if (requiredConfirmations && (!utxo.confirmations || utxo.confirmations < requiredConfirmations)) {
        return false;
      }
      utxoBalance += utxo.value;
      return true;
    });
    return new CoinBalance({
      feePerByte,
      utxos,
      utxoBalance,
      coinbase
    });
  }
  async getMaxSpendable({ changeAddress, customFeePerByte, cachedBalance } = {}) {
    const { inputAmounts, fees } = await this.populateTransaction([], {
      changeAddress,
      customFeePerByte,
      spendAll: true,
      deductFees: false,
      cachedBalance
    });
    return parseCoins(inputAmounts) - parseCoins(fees);
  }
  async populateTransaction(outputs, {
    changeAddress,
    customFeePerByte,
    spendAll,
    deductFees,
    cachedBalance,
    requiredConfirmations
  } = {}) {
    const balance = cachedBalance || await this.getBalance(requiredConfirmations);
    const feePerByte = customFeePerByte || balance.feePerByte;
    const inputs = getInputs(balance.utxos, outputs, spendAll);
    const { addrType, network } = this;
    let inputAmounts = 0;
    let outputAmounts = 0;
    let inputBytes = 0;
    let outputBytes = 0;
    inputs.forEach((input) => {
      inputAmounts += input.value;
      inputBytes += input.bytes = getBytes(addrType);
    });
    outputs.forEach((output) => {
      if (output.returnData && output.value === 0) {
        const data = checkHex(output.returnData) ? wallet_Buffer.from(output.returnData.slice(2), "hex") : wallet_Buffer.from(output.returnData, "utf8");
        output.script = wallet_payments.embed({
          data: [data]
        }).output;
        outputBytes += output.bytes = data.length + 12;
        return;
      }
      if (!output?.value) {
        return;
      }
      outputAmounts += output.value;
      outputBytes += output.bytes = getBytes(
        getScriptType(bitcoinAddress.toOutputScript(output.address, network)),
        false
      );
    });
    let vBytes = 10 + inputBytes + outputBytes;
    let fees = vBytes * feePerByte;
    if (deductFees) {
      outputs.forEach((output) => {
        const feePerOutput = Math.ceil(fees / outputs.length);
        output.value -= feePerOutput;
        outputAmounts -= feePerOutput;
      });
    }
    const change = inputAmounts - outputAmounts - fees;
    const changeAddr = changeAddress || this.getChangeAddress();
    if (change < 0) {
      const error = `Insufficient amount to cover fees, wants ${formatCoins(outputAmounts + fees)} have ${formatCoins(inputAmounts)}`;
      throw new Error(error);
    }
    if (change > fees && changeAddr) {
      const output = {
        address: changeAddr,
        value: change,
        bytes: getBytes(getScriptType(bitcoinAddress.toOutputScript(changeAddr, network)), false)
      };
      const outputFee = output.bytes * feePerByte;
      output.value -= outputFee;
      fees += outputFee;
      outputAmounts += output.value;
      outputBytes += output.bytes;
      vBytes += output.bytes;
      outputs.push(output);
    }
    return new CoinTX({
      fees: formatCoins(fees),
      inputAmounts: formatCoins(inputAmounts),
      inputs,
      outputAmounts: formatCoins(outputAmounts),
      outputs,
      vBytes
    });
  }
  async populatePsbt(coinTx) {
    const { inputs, outputs } = coinTx;
    const txs = this.addrType === "legacy" ? await this.provider.getTransactions([...new Set(inputs.map((t) => t.txid))]) : [];
    const { addrType, network } = this;
    const psbt = new Psbt({ network });
    inputs.forEach((input) => {
      const { txid: hash, vout: index, value, address, addressIndex } = input;
      const script = bitcoinAddress.toOutputScript(address || this.address, network);
      const key = this.getKey(addressIndex);
      const pubkey = wallet_Buffer.from(key?.publicKey || []);
      const tapInternalKey = pubkey.slice(1, 33);
      const bip32Derivation = this.getBip32Derivation(addressIndex);
      if (addrType === "taproot") {
        psbt.addInput({
          hash,
          index,
          sequence: RBF_INPUT_SEQUENCE,
          witnessUtxo: {
            script,
            value
          },
          tapInternalKey,
          tapBip32Derivation: bip32Derivation
        });
      } else if (addrType === "bech32") {
        psbt.addInput({
          hash,
          index,
          sequence: RBF_INPUT_SEQUENCE,
          witnessUtxo: {
            script,
            value
          },
          bip32Derivation
        });
      } else if (addrType === "segwit") {
        const { output: redeemScript } = wallet_payments.p2wpkh({
          pubkey,
          network
        });
        psbt.addInput({
          hash,
          index,
          sequence: RBF_INPUT_SEQUENCE,
          witnessUtxo: {
            script,
            value
          },
          redeemScript,
          bip32Derivation
        });
      } else {
        const tx = txs.find((t) => t.txid === hash);
        if (!tx?.hex) {
          return;
        }
        psbt.addInput({
          hash,
          index,
          sequence: RBF_INPUT_SEQUENCE,
          nonWitnessUtxo: wallet_Buffer.from(tx.hex, "hex"),
          bip32Derivation
        });
      }
    });
    outputs.forEach((output) => {
      if (output.returnData && output.value === 0) {
        const data = checkHex(output.returnData) ? wallet_Buffer.from(output.returnData.slice(2), "hex") : wallet_Buffer.from(output.returnData, "utf8");
        output.script = wallet_payments.embed({
          data: [data]
        }).output;
        psbt.addOutput(output);
        return;
      }
      if (!output?.value) {
        return;
      }
      psbt.addOutput(output);
    });
    coinTx.psbt = psbt;
  }
  async populateConsolidation({
    customFeePerByte,
    cachedBalance,
    requiredConfirmations
  } = {}) {
    const balance = cachedBalance || await this.getBalance(requiredConfirmations);
    const feePerByte = customFeePerByte || balance.feePerByte;
    const inputs = chunk(balance.utxos, 500);
    return await Promise.all(
      inputs.map(async (input) => {
        const tx = await this.populateTransaction([], {
          spendAll: true,
          cachedBalance: new CoinBalance({
            feePerByte,
            utxos: input,
            utxoBalance: input.reduce((acc, curr) => acc + curr.value, 0),
            coinbase: 0
          })
        });
        await this.populatePsbt(tx);
        return tx;
      })
    );
  }
  parseTransaction(psbtHex) {
    const psbt = Psbt.fromHex(psbtHex, { network: this.network });
    let inputAmounts = 0;
    let outputAmounts = 0;
    const inputBytes = getBytes(this.addrType) * psbt.txInputs.length;
    let outputBytes = 0;
    const inputs = psbt.txInputs.map((input, index) => {
      const txInput = psbt.data.inputs[index];
      const nonWitnessTx = txInput.nonWitnessUtxo ? Transaction.fromBuffer(txInput.nonWitnessUtxo, false) : void 0;
      const txid = input.hash.toString("hex");
      const vout = input.index;
      const value = txInput.witnessUtxo?.value || nonWitnessTx?.outs?.[vout]?.value;
      inputAmounts += value;
      return {
        // Height and conf not really necessary for parsed PSBT
        height: NaN,
        confirmations: NaN,
        txid,
        vout,
        value,
        bytes: inputBytes
      };
    });
    const outputs = psbt.txOutputs.map((output) => {
      let bytes = 0;
      try {
        bytes = getBytes(getScriptType(output.script), false);
      } catch {
        bytes = output.script?.byteLength || 0;
      }
      outputAmounts += output.value;
      outputBytes += bytes;
      return {
        ...output,
        address: output.address,
        bytes
      };
    });
    const vBytes = 10 + inputBytes + outputBytes;
    const fees = inputAmounts - outputAmounts;
    const createdTx = {
      fees: formatCoins(fees),
      inputAmounts: formatCoins(inputAmounts),
      inputs,
      outputAmounts: formatCoins(outputAmounts),
      outputs,
      vBytes
    };
    return new CoinTX({
      psbt,
      ...createdTx
    });
  }
  signTransaction(psbt, keyIndex = 0) {
    const key = this.getKey(keyIndex);
    const pubKey = wallet_Buffer.from(key.publicKey);
    const tapKey = pubKey.slice(1, 33);
    const tweakedKey = key.tweak(bitcoinCrypto.taggedHash("TapTweak", tapKey));
    psbt.signAllInputs(this.addrType !== "taproot" ? key : tweakedKey);
    psbt.finalizeAllInputs();
    return psbt.extractTransaction();
  }
  async sendTransaction(outputs, populateOptions = {}) {
    const coinTx = await this.populateTransaction(outputs, populateOptions);
    await this.populatePsbt(coinTx);
    const signed = this.signTransaction(coinTx.psbt);
    coinTx.txid = await this.provider.broadcastTransaction(signed.toHex());
    return coinTx;
  }
  async sendConsolidations({
    customFeePerByte,
    cachedBalance,
    requiredConfirmations
  } = {}) {
    const txs = await this.populateConsolidation({
      customFeePerByte,
      cachedBalance,
      requiredConfirmations
    });
    for (const tx of txs) {
      const signedTx = this.signTransaction(tx.psbt);
      tx.txid = await this.provider.broadcastTransaction(signedTx.toHex());
    }
    return txs;
  }
}
class MnemonicWallet extends CoinWallet {
  mnemonic;
  mnemonicIndex;
  onlySingle;
  constructor(provider, config, onlySingle = false, generateRandom = true) {
    super(provider, config, false);
    this.mnemonic = config.mnemonic || (generateRandom ? wallet_bip39.generateMnemonic(128) : "");
    this.mnemonicIndex = config.mnemonicIndex || 0;
    this.onlySingle = onlySingle;
    this.setKey(this.mnemonicIndex);
  }
  setKey(index = 0) {
    const { address, publicKey, privateKey, privateKeyWithPrefix } = this.getKeyInfo(index);
    this.address = address;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.privateKeyWithPrefix = privateKeyWithPrefix;
    this.mnemonicIndex = index;
  }
  // Get Account Extended Public Key compatible with blockbook instance
  // Can cross-check with https://iancoleman.io/bip39/
  getPub() {
    const root = bip32.fromSeed(wallet_bip39.mnemonicToSeedSync(this.mnemonic), this.network);
    const key = root.derivePath(
      `m/${getDerivation(this.addrType)}'/${this.network.versions.bip44 || 0}'/0'`
    );
    if (this.addrType === "taproot") {
      return `tr(${key.neutered().toBase58()})`;
    }
    const data = wallet_Buffer.concat([
      wallet_Buffer.from(getPubBytes(this.addrType), "hex"),
      bs58check.decode(key.neutered().toBase58()).slice(4)
    ]);
    return bs58check.encode(data);
  }
  getUtxoAddress() {
    if (this.onlySingle) {
      return {
        address: this.address
      };
    }
    return {
      address: this.getPub(),
      isPub: true
    };
  }
  getKey(index = 0) {
    const root = bip32.fromSeed(wallet_bip39.mnemonicToSeedSync(this.mnemonic), this.network);
    return root.derivePath(
      `m/${getDerivation(this.addrType)}'/${this.network.versions.bip44 || 0}'/0'/0/${index}`
    );
  }
  getBip32Derivation(index = 0) {
    if (this.onlySingle) {
      return super.getBip32Derivation(index);
    }
    const root = bip32.fromSeed(wallet_bip39.mnemonicToSeedSync(this.mnemonic), this.network);
    const path = `m/${getDerivation(this.addrType)}'/${this.network.versions.bip44 || 0}'/0'/0/${index}`;
    const pubkey = root.derivePath(path).publicKey;
    if (this.addrType === "taproot") {
      return [
        {
          masterFingerprint: root.fingerprint,
          path,
          pubkey: pubkey.slice(1, 33),
          leafHashes: []
        }
      ];
    }
    return [
      {
        masterFingerprint: root.fingerprint,
        path,
        pubkey
      }
    ];
  }
  signTransaction(psbt) {
    if (this.onlySingle) {
      return super.signTransaction(psbt, this.mnemonicIndex);
    }
    const root = bip32.fromSeed(wallet_bip39.mnemonicToSeedSync(this.mnemonic), this.network);
    if (this.addrType === "taproot") {
      psbt.data.inputs.forEach((txInput, index) => {
        const derivation = txInput.tapBip32Derivation[0];
        const key = root.derivePath(derivation.path);
        const tapKey = key.publicKey.slice(1, 33);
        const tweakedKey = key.tweak(bitcoinCrypto.taggedHash("TapTweak", tapKey));
        psbt.signTaprootInput(index, tweakedKey);
      });
    } else {
      psbt.signAllInputsHD(root);
    }
    psbt.finalizeAllInputs();
    return psbt.extractTransaction();
  }
}
class VoidWallet extends CoinWallet {
  constructor(provider, config) {
    super(provider, config, false);
    this.publicKey = config.publicKey;
    this.address = getAddress(wallet_Buffer.from(this.publicKey, "hex"), this.addrType, this.network);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getKey(index = 0) {
    return {
      publicKey: wallet_Buffer.from(this.publicKey, "hex"),
      toWIF: () => "",
      tweak: () => {
      }
    };
  }
}
/* harmony default export */ const wallet = ((/* unused pure expression or super */ null && (MnemonicWallet)));

;// ./src/index.ts










})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});