/**
 * CPU - Mathematical Computing Platform with Arbitrary-Precision Digit Generation
 *
 * Irrational number instructions (PI, E, SQRT2, PHI) use BigInt-based
 * spigot/digit-extraction algorithms to generate unlimited digits.
 * Each REFINE call extracts the NEXT digit. OUT prints the accumulated string.
 *
 * OPCODE MAP:
 *   0:  HALT
 *  10-15: MOV variants
 *  30-31: ADD, 40-41: SUB, 42-43: MUL, 44-45: DIV, 46-47: MOD
 *  60-65: AND, OR, XOR (bitwise, truncates to int)
 *  70-71: CMP
 *  80-84: JMP, JEQ, JNE, JLT, JGT
 *  90-96: PUSH, POP, CALL, RET, OUT
 * 100-108: SQRT, POW, ABS, SIN, COS, TAN, LOG, EXP, FLOOR
 * 110-113: PI, E, SQRT2, PHI  (init digit-streaming spigot)
 * 120: REFINE (extract next digit)
 */
class CPU {
  constructor(memory) {
    this.memory = memory;
    this.registers = {
      R0: 0, R1: 0, R2: 0, R3: 0,
      PC: 0,
      SP: memory.size - 1,
      IR: 0,
      FLAGS: { Z: 0, N: 0 }
    };

    this.halted = true;
    this.state = 'FETCH';
    this.instructionsExecuted = 0;

    // Digit-streaming state per register
    this._refinement = { R0: null, R1: null, R2: null, R3: null };

    this.onStateChange = null;
    this.onRegisterChange = null;
    this.onHalt = null;
    this.onInstructionExecuted = null;
    this.onOutput = null;
  }

  reset() {
    this.registers.R0 = 0;
    this.registers.R1 = 0;
    this.registers.R2 = 0;
    this.registers.R3 = 0;
    this.registers.PC = 0;
    this.registers.SP = this.memory.size - 1;
    this.registers.IR = 0;
    this.registers.FLAGS = { Z: 0, N: 0 };
    this.halted = true;
    this.state = 'FETCH';
    this.instructionsExecuted = 0;
    this._refinement = { R0: null, R1: null, R2: null, R3: null };
    this._notifyState();
    this._notifyRegisters();
  }

  run()  { this.halted = false; this._notifyState(); }
  pause(){ this.halted = true;  this._notifyState(); }

  step() {
    if (this.halted) this.run();
    this.tick();
    if (this.state === 'FETCH') this.pause();
  }

  tick() {
    if (this.halted && this.state === 'FETCH') return;
    switch (this.state) {
      case 'FETCH':
        this.registers.IR = this.memory.read(this.registers.PC++);
        this.state = 'EXECUTE';
        break;
      case 'EXECUTE':
        this._execute();
        this.instructionsExecuted++;
        if (this.onInstructionExecuted) this.onInstructionExecuted(this.instructionsExecuted);
        if (!this.halted) this.state = 'FETCH';
        break;
    }
    this._notifyState();
    this._notifyRegisters();
  }

  _getRegName(idx) { return ['R0', 'R1', 'R2', 'R3'][idx]; }

  _updateFlags(val) {
    this.registers.FLAGS.Z = (val === 0) ? 1 : 0;
    this.registers.FLAGS.N = (val < 0) ? 1 : 0;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ARBITRARY-PRECISION DIGIT GENERATORS (BigInt-powered)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * π spigot — Gibbons unbounded spigot algorithm
   * Extracts one decimal digit of π per call, using only BigInt arithmetic.
   * Can run forever, generating unlimited digits.
   */
  _piSpigotInit() {
    return {
      q: 1n, r: 0n, t: 1n, k: 1n, n: 3n, l: 3n,
      digits: '',
      digitCount: 0
    };
  }

  _piSpigotNextDigit(s) {
    while (true) {
      if (4n * s.q + s.r - s.t < s.n * s.t) {
        // Safe to extract digit
        const digit = Number(s.n);
        if (s.digitCount === 0) {
          s.digits = digit + '.';
        } else {
          s.digits += digit;
        }
        s.digitCount++;
        // Advance state
        const nr = 10n * (s.r - s.n * s.t);
        const nq = 10n * s.q;
        s.n = (10n * (3n * s.q + s.r)) / s.t - 10n * s.n;
        s.q = nq;
        s.r = nr;
        return digit;
      } else {
        // Need more input from the continued fraction
        const nr = (2n * s.q + s.r) * s.l;
        const nn = (s.q * (7n * s.k + 2n) + s.r * s.l) / (s.t * s.l);
        s.q = s.q * s.k;
        s.t = s.t * s.l;
        s.l += 2n;
        s.k += 1n;
        s.r = nr;
        s.n = nn;
      }
    }
  }

  /**
   * e digits — computed via Taylor series with BigInt precision
   * Precomputes a large batch of digits, then streams them one by one.
   * When the buffer runs out, it computes more.
   */
  _eDigitInit() {
    const allDigits = this._computeEDigits(500);
    return {
      allDigits: allDigits,
      digits: '',
      digitCount: 0,
      index: 0
    };
  }

  _eNextDigit(s) {
    if (s.index >= s.allDigits.length) {
      // Compute more digits
      s.allDigits = this._computeEDigits(s.allDigits.length + 500);
    }
    const d = parseInt(s.allDigits[s.index], 10);
    s.index++;
    if (s.digitCount === 0) {
      s.digits = d + '.';
    } else {
      s.digits += d;
    }
    s.digitCount++;
    return d;
  }

  _computeEDigits(numDigits) {
    const extra = 20;
    const scale = 10n ** BigInt(numDigits + extra);
    let sum = 0n;
    let term = scale;
    for (let i = 1n; term > 0n; i++) {
      sum += term;
      term = term / i;
    }
    const str = sum.toString();
    // str is like "271828182845..." — the "2" is the integer part
    return str.substring(0, numDigits + 1);
  }

  /**
   * √2 digits — Newton's method with BigInt
   */
  _sqrt2DigitInit() {
    const allDigits = this._computeSqrt2Digits(500);
    return {
      allDigits: allDigits,
      digits: '',
      digitCount: 0,
      index: 0
    };
  }

  _sqrt2NextDigit(s) {
    if (s.index >= s.allDigits.length) {
      s.allDigits = this._computeSqrt2Digits(s.allDigits.length + 500);
    }
    const d = parseInt(s.allDigits[s.index], 10);
    s.index++;
    if (s.digitCount === 0) {
      s.digits = d + '.';
    } else {
      s.digits += d;
    }
    s.digitCount++;
    return d;
  }

  _computeSqrt2Digits(numDigits) {
    const extra = 20;
    const prec = BigInt(numDigits + extra);
    const scale = 10n ** prec;
    // Newton's method: x = (x + 2*scale^2/x) / 2, starting at x = scale
    let x = scale;
    for (let i = 0; i < 200; i++) {
      const xnew = (x + 2n * scale * scale / x) / 2n;
      if (xnew === x) break;
      x = xnew;
    }
    // x ≈ sqrt(2) * scale, so x/scale ≈ 1.41421356...
    const str = x.toString();
    // str starts with "1414213562..." — first char is the integer part "1"
    return str.substring(0, numDigits + 1);
  }

  /**
   * φ digits — (1 + √5) / 2 using BigInt √5
   */
  _phiDigitInit() {
    const allDigits = this._computePhiDigits(500);
    return {
      allDigits: allDigits,
      digits: '',
      digitCount: 0,
      index: 0
    };
  }

  _phiNextDigit(s) {
    if (s.index >= s.allDigits.length) {
      s.allDigits = this._computePhiDigits(s.allDigits.length + 500);
    }
    const d = parseInt(s.allDigits[s.index], 10);
    s.index++;
    if (s.digitCount === 0) {
      s.digits = d + '.';
    } else {
      s.digits += d;
    }
    s.digitCount++;
    return d;
  }

  _computePhiDigits(numDigits) {
    const extra = 20;
    const prec = BigInt(numDigits + extra);
    const scale = 10n ** prec;
    // Compute sqrt(5) via Newton's method
    let x = 2n * scale; // initial guess ≈ 2
    for (let i = 0; i < 200; i++) {
      const xnew = (x + 5n * scale * scale / x) / 2n;
      if (xnew === x) break;
      x = xnew;
    }
    // phi = (1 + sqrt5) / 2 = (scale + x) / 2
    const phi = (scale + x) / 2n;
    const str = phi.toString();
    return str.substring(0, numDigits + 1);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXECUTE
  // ═══════════════════════════════════════════════════════════════════════

  _execute() {
    const opcode = this.registers.IR;
    let r1, r2, val, addr;

    switch (opcode) {
      case 0: // HALT
        this.halted = true;
        if (this.onHalt) this.onHalt();
        break;

      // ─── MOV ────────────────────────────────────────────────────────
      case 10: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        val = this.memory.read(this.registers.PC++);
        this.registers[r1] = val; break;
      case 11: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        r2 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = this.registers[r2]; break;
      case 12: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        addr = this.memory.read(this.registers.PC++);
        this.registers[r1] = this.memory.read(addr); break;
      case 13: addr = this.memory.read(this.registers.PC++);
        r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this.memory.write(addr, this.registers[r1]); break;
      case 14: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        r2 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = this.memory.read(this.registers[r2]); break;
      case 15: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        r2 = this._getRegName(this.memory.read(this.registers.PC++));
        this.memory.write(this.registers[r1], this.registers[r2]); break;

      // ─── ARITHMETIC ─────────────────────────────────────────────────
      case 30: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        val = this.memory.read(this.registers.PC++);
        this.registers[r1] += val; break;
      case 31: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        r2 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] += this.registers[r2]; break;
      case 40: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        val = this.memory.read(this.registers.PC++);
        this.registers[r1] -= val; break;
      case 41: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        r2 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] -= this.registers[r2]; break;
      case 42: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        val = this.memory.read(this.registers.PC++);
        this.registers[r1] *= val; break;
      case 43: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        r2 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] *= this.registers[r2]; break;
      case 44: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        val = this.memory.read(this.registers.PC++);
        this.registers[r1] = this.registers[r1] / val; break;
      case 45: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        r2 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = this.registers[r1] / this.registers[r2]; break;
      case 46: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        val = this.memory.read(this.registers.PC++);
        this.registers[r1] = this.registers[r1] % val; break;
      case 47: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        r2 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = this.registers[r1] % this.registers[r2]; break;

      // ─── BITWISE ────────────────────────────────────────────────────
      case 60: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        val = this.memory.read(this.registers.PC++);
        this.registers[r1] = (this.registers[r1] | 0) & (val | 0); break;
      case 61: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        r2 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = (this.registers[r1] | 0) & (this.registers[r2] | 0); break;
      case 62: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        val = this.memory.read(this.registers.PC++);
        this.registers[r1] = (this.registers[r1] | 0) | (val | 0); break;
      case 63: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        r2 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = (this.registers[r1] | 0) | (this.registers[r2] | 0); break;
      case 64: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        val = this.memory.read(this.registers.PC++);
        this.registers[r1] = (this.registers[r1] | 0) ^ (val | 0); break;
      case 65: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        r2 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = (this.registers[r1] | 0) ^ (this.registers[r2] | 0); break;

      // ─── CMP ────────────────────────────────────────────────────────
      case 70: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        val = this.memory.read(this.registers.PC++);
        this._updateFlags(this.registers[r1] - val); break;
      case 71: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        r2 = this._getRegName(this.memory.read(this.registers.PC++));
        this._updateFlags(this.registers[r1] - this.registers[r2]); break;

      // ─── BRANCH ─────────────────────────────────────────────────────
      case 80: addr = this.memory.read(this.registers.PC++); this.registers.PC = addr; break;
      case 81: addr = this.memory.read(this.registers.PC++); if (this.registers.FLAGS.Z) this.registers.PC = addr; break;
      case 82: addr = this.memory.read(this.registers.PC++); if (!this.registers.FLAGS.Z) this.registers.PC = addr; break;
      case 83: addr = this.memory.read(this.registers.PC++); if (this.registers.FLAGS.N) this.registers.PC = addr; break;
      case 84: addr = this.memory.read(this.registers.PC++); if (!this.registers.FLAGS.Z && !this.registers.FLAGS.N) this.registers.PC = addr; break;

      // ─── STACK & I/O ───────────────────────────────────────────────
      case 90: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this.memory.write(this.registers.SP--, this.registers[r1]); break;
      case 91: val = this.memory.read(this.registers.PC++);
        this.memory.write(this.registers.SP--, val); break;
      case 92: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = this.memory.read(++this.registers.SP); break;
      case 93: addr = this.memory.read(this.registers.PC++);
        this.memory.write(this.registers.SP--, this.registers.PC);
        this.registers.PC = addr; break;
      case 94: this.registers.PC = this.memory.read(++this.registers.SP); break;

      // OUT — if the register has a digit stream, output the accumulated string
      case 95: // OUT_R
        r1 = this._getRegName(this.memory.read(this.registers.PC++));
        if (this._refinement[r1] && this._refinement[r1].digits) {
          if (this.onOutput) this.onOutput(this._refinement[r1].digits);
        } else {
          if (this.onOutput) this.onOutput(this.registers[r1]);
        }
        break;
      case 96: val = this.memory.read(this.registers.PC++);
        if (this.onOutput) this.onOutput(val); break;

      // ─── ADVANCED MATH ──────────────────────────────────────────────
      case 100: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = Math.sqrt(this.registers[r1]); break;
      case 101: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        r2 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = Math.pow(this.registers[r1], this.registers[r2]); break;
      case 102: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = Math.abs(this.registers[r1]); break;
      case 103: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = Math.sin(this.registers[r1]); break;
      case 104: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = Math.cos(this.registers[r1]); break;
      case 105: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = Math.tan(this.registers[r1]); break;
      case 106: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = Math.log(this.registers[r1]); break;
      case 107: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = Math.exp(this.registers[r1]); break;
      case 108: r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this.registers[r1] = Math.floor(this.registers[r1]); break;

      // ─── IRRATIONAL DIGIT STREAMS ──────────────────────────────────
      case 110: // PI R — init Gibbons spigot, extract first digit
        r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this._refinement[r1] = { type: 'PI', state: this._piSpigotInit() };
        this._refinement[r1].digits = this._refinement[r1].state.digits;
        this.registers[r1] = this._piSpigotNextDigit(this._refinement[r1].state);
        this._refinement[r1].digits = this._refinement[r1].state.digits;
        break;

      case 111: // E R — init Taylor digit stream, extract first digit
        r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this._refinement[r1] = { type: 'E', state: this._eDigitInit() };
        this.registers[r1] = this._eNextDigit(this._refinement[r1].state);
        this._refinement[r1].digits = this._refinement[r1].state.digits;
        break;

      case 112: // SQRT2 R
        r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this._refinement[r1] = { type: 'SQRT2', state: this._sqrt2DigitInit() };
        this.registers[r1] = this._sqrt2NextDigit(this._refinement[r1].state);
        this._refinement[r1].digits = this._refinement[r1].state.digits;
        break;

      case 113: // PHI R
        r1 = this._getRegName(this.memory.read(this.registers.PC++));
        this._refinement[r1] = { type: 'PHI', state: this._phiDigitInit() };
        this.registers[r1] = this._phiNextDigit(this._refinement[r1].state);
        this._refinement[r1].digits = this._refinement[r1].state.digits;
        break;

      // ─── REFINE — extract next digit ───────────────────────────────
      case 120:
        r1 = this._getRegName(this.memory.read(this.registers.PC++));
        if (this._refinement[r1]) {
          const ref = this._refinement[r1];
          switch (ref.type) {
            case 'PI':    this.registers[r1] = this._piSpigotNextDigit(ref.state); break;
            case 'E':     this.registers[r1] = this._eNextDigit(ref.state); break;
            case 'SQRT2': this.registers[r1] = this._sqrt2NextDigit(ref.state); break;
            case 'PHI':   this.registers[r1] = this._phiNextDigit(ref.state); break;
          }
          ref.digits = ref.state.digits;
        }
        break;

      default:
        console.warn(`Unknown opcode: ${opcode} at PC ${this.registers.PC - 1}`);
        this.halted = true;
        if (this.onHalt) this.onHalt();
        break;
    }
  }

  _notifyState() {
    if (this.onStateChange) this.onStateChange(this.state, this.halted);
  }
  _notifyRegisters() {
    if (this.onRegisterChange) this.onRegisterChange(this.registers);
  }
}

window.CPU = CPU;
