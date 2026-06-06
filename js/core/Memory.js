/**
 * Memory Module - Supports floating-point storage
 * Memory cells can hold any JavaScript number (IEEE-754 double precision)
 * which gives us 64-bit float support natively.
 */
class Memory {
  constructor(size = 4096) {
    this.size = size;
    // Float64Array gives us true IEEE-754 64-bit doubles natively
    this.data = new Float64Array(size);
    this.onRead = null;
    this.onWrite = null;
  }

  reset() {
    this.data.fill(0);
  }

  read(address) {
    if (address < 0 || address >= this.size) {
      console.warn(`Memory read out of bounds: ${address}`);
      return 0;
    }
    const val = this.data[address];
    if (this.onRead) this.onRead(address, val);
    return val;
  }

  write(address, value) {
    if (address < 0 || address >= this.size) {
      console.warn(`Memory write out of bounds: ${address}`);
      return;
    }
    this.data[address] = value;
    if (this.onWrite) this.onWrite(address, value);
  }

  loadProgram(programData, startAddress = 0) {
    for (let i = 0; i < programData.length; i++) {
      if (startAddress + i < this.size) {
        this.data[startAddress + i] = programData[i];
      }
    }
  }
}

window.Memory = Memory;
