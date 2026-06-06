/**
 * Assembler — Mathematical Computing Platform
 * 
 * Supports float literals (e.g. 3.14, -0.5), labels, and all new math/irrational instructions.
 */
class Assembler {
  static REGISTERS = { 'R0': 0, 'R1': 1, 'R2': 2, 'R3': 3 };

  static OPCODES = {
    'HALT': 0,
    // MOV
    'MOV_R_L': 10, 'MOV_R_R': 11, 'MOV_R_M': 12, 'MOV_M_R': 13, 'MOV_R_MR': 14, 'MOV_MR_R': 15,
    // MATH
    'ADD_R_L': 30, 'ADD_R_R': 31,
    'SUB_R_L': 40, 'SUB_R_R': 41,
    'MUL_R_L': 42, 'MUL_R_R': 43,
    'DIV_R_L': 44, 'DIV_R_R': 45,
    'MOD_R_L': 46, 'MOD_R_R': 47,
    // LOGIC
    'AND_R_L': 60, 'AND_R_R': 61,
    'OR_R_L':  62, 'OR_R_R':  63,
    'XOR_R_L': 64, 'XOR_R_R': 65,
    // COMPARE
    'CMP_R_L': 70, 'CMP_R_R': 71,
    // BRANCH
    'JMP': 80, 'JEQ': 81, 'JNE': 82, 'JLT': 83, 'JGT': 84,
    // STACK & I/O
    'PUSH_R': 90, 'PUSH_L': 91, 'POP_R': 92, 'CALL': 93, 'RET': 94,
    'OUT_R': 95, 'OUT_L': 96,
    // ADVANCED MATH (single-register)
    'SQRT_R': 100,
    'POW_R_R': 101,
    'ABS_R': 102,
    'SIN_R': 103, 'COS_R': 104, 'TAN_R': 105,
    'LOG_R': 106, 'EXP_R': 107,
    'FLOOR_R': 108,
    // IRRATIONAL CONSTANTS
    'PI_R': 110, 'E_R': 111, 'SQRT2_R': 112, 'PHI_R': 113,
    // REFINEMENT
    'REFINE_R': 120
  };

  // Single-register math instructions (no second operand)
  static SINGLE_REG = ['SQRT', 'ABS', 'SIN', 'COS', 'TAN', 'LOG', 'EXP', 'FLOOR', 'PI', 'E', 'SQRT2', 'PHI', 'REFINE'];
  // Two-register math
  static TWO_REG = ['POW'];

  static assemble(sourceCode) {
    const lines = sourceCode.split('\n');
    let instructions = [];
    let labels = {};
    let address = 0;

    // Pass 1: collect labels, parse instruction shapes
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].split(';')[0].trim();
      if (!line) continue;

      // Label-only line
      if (line.endsWith(':')) {
        labels[line.slice(0, -1).trim()] = address;
        continue;
      }

      // Inline label
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        labels[line.substring(0, colonIdx).trim()] = address;
        line = line.substring(colonIdx + 1).trim();
        if (!line) continue;
      }

      const parts = line.split(/[\s,]+/).filter(p => p);
      if (parts.length === 0) continue;

      const mnemonic = parts[0].toUpperCase();
      instructions.push({ lineNum: i + 1, mnemonic, args: parts.slice(1) });
      address += 1 + parts.slice(1).length;
    }

    // Pass 2: generate machine code
    const machineCode = [];

    for (const inst of instructions) {
      const { lineNum, mnemonic, args } = inst;
      let opcodeName = mnemonic;
      let compiledArgs = [];

      const parseArg = (arg) => {
        if (arg.toUpperCase() in this.REGISTERS) return { type: 'R', val: this.REGISTERS[arg.toUpperCase()] };
        if (arg.startsWith('[') && arg.endsWith(']')) {
          const inner = arg.substring(1, arg.length - 1).toUpperCase();
          if (inner in this.REGISTERS) return { type: 'MR', val: this.REGISTERS[inner] };
          return { type: 'M', val: parseFloat(inner) };
        }
        if (labels[arg] !== undefined) return { type: 'L', val: labels[arg] };
        // Support float literals
        const num = parseFloat(arg);
        if (!isNaN(num)) return { type: 'L', val: num };
        throw new Error(`Unknown argument "${arg}" on line ${lineNum}`);
      };

      try {
        if (mnemonic === 'HALT' || mnemonic === 'RET') {
          opcodeName = mnemonic;
        } else if (['JMP', 'JEQ', 'JNE', 'JLT', 'JGT', 'CALL'].includes(mnemonic)) {
          opcodeName = mnemonic;
          compiledArgs.push(parseArg(args[0]).val);
        } else if (['PUSH', 'POP', 'OUT'].includes(mnemonic)) {
          const a1 = parseArg(args[0]);
          opcodeName = `${mnemonic}_${a1.type}`;
          compiledArgs.push(a1.val);
        } else if (this.SINGLE_REG.includes(mnemonic)) {
          // Single-register instructions like SQRT R0, PI R0
          const a1 = parseArg(args[0]);
          opcodeName = `${mnemonic}_${a1.type}`;
          compiledArgs.push(a1.val);
        } else if (this.TWO_REG.includes(mnemonic)) {
          // Two-register instructions like POW R0, R1
          const a1 = parseArg(args[0]);
          const a2 = parseArg(args[1]);
          opcodeName = `${mnemonic}_${a1.type}_${a2.type}`;
          compiledArgs.push(a1.val);
          compiledArgs.push(a2.val);
        } else if (['MOV', 'ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'AND', 'OR', 'XOR', 'CMP'].includes(mnemonic)) {
          const a1 = parseArg(args[0]);
          const a2 = parseArg(args[1]);
          opcodeName = `${mnemonic}_${a1.type}_${a2.type}`;
          compiledArgs.push(a1.val);
          compiledArgs.push(a2.val);
        } else {
          throw new Error(`Unknown instruction "${mnemonic}" on line ${lineNum}`);
        }

        if (this.OPCODES[opcodeName] === undefined) {
          throw new Error(`Invalid addressing mode for "${mnemonic}" (resolved to ${opcodeName}) on line ${lineNum}`);
        }

        machineCode.push(this.OPCODES[opcodeName], ...compiledArgs);

      } catch (e) {
        console.error(e.message);
        machineCode.push(0); // HALT on error
      }
    }

    return machineCode;
  }
}

window.Assembler = Assembler;
