class Visualizer {
  constructor(cpu) {
    this.cpu = cpu;
    this.container = document.getElementById('cpu-vis-container');
    this.statusLabel = document.getElementById('cpu-status');
    
    this.regs = {};
    this.comps = {};
    
    this._initBoard();
    
    // Bind CPU events
    this.cpu.onStateChange = (state, halted) => {
      this.statusLabel.textContent = halted ? 'HALTED' : state;
      this.statusLabel.style.color = halted ? 'var(--neon-magenta)' : 'var(--neon-cyan)';
      this._highlightComponent('CU', true);
      setTimeout(() => this._highlightComponent('CU', false), 200);
    };
    
    this.cpu.onRegisterChange = (registers) => {
      for (const [name, rawVal] of Object.entries(registers)) {
        if (this.regs[name]) {
          let displayVal;
          if (typeof rawVal === 'object') {
            displayVal = `Z:${rawVal.Z} N:${rawVal.N}`;
          } else if (typeof rawVal === 'number' && !Number.isInteger(rawVal)) {
            // Format floats to 15 significant digits max
            displayVal = rawVal.toPrecision(15);
          } else {
            displayVal = rawVal;
          }
          if (this.regs[name].val !== displayVal) {
            this.regs[name].el.textContent = displayVal;
            this.regs[name].val = displayVal;
            
            const container = this.regs[name].container;
            container.classList.remove('updated');
            void container.offsetWidth;
            container.classList.add('updated');
          }
        }
      }
    };
  }
  
  _initBoard() {
    this.container.innerHTML = '';
    
    const board = document.createElement('div');
    board.className = 'cpu-board';
    
    // Create ALU
    const alu = this._createComponent('ALU', 'comp-alu');
    board.appendChild(alu);
    
    // Create Control Unit
    const cu = this._createComponent('Control Unit', 'comp-cu');
    this.comps['CU'] = cu;
    board.appendChild(cu);
    
    // Create Registers Area
    const regArea = this._createComponent('Registers', 'comp-registers');
    
    // Sub-registers
    const regsToCreate = ['R0', 'R1', 'R2', 'R3', 'PC', 'SP', 'IR', 'FLAGS'];
    regsToCreate.forEach(name => {
      const reg = document.createElement('div');
      reg.className = 'register';
      
      const label = document.createElement('span');
      label.className = 'register-name';
      label.textContent = name;
      
      const val = document.createElement('span');
      val.className = 'register-value';
      val.textContent = '0';
      
      reg.appendChild(label);
      reg.appendChild(val);
      regArea.appendChild(reg);
      
      this.regs[name] = { el: val, container: reg, val: 0 };
    });
    
    board.appendChild(regArea);
    this.container.appendChild(board);
  }
  
  _createComponent(name, className) {
    const el = document.createElement('div');
    el.className = `cpu-component ${className}`;
    el.textContent = name;
    return el;
  }
  
  _highlightComponent(name, active) {
    if (this.comps[name]) {
      if (active) {
        this.comps[name].classList.add('active');
      } else {
        this.comps[name].classList.remove('active');
      }
    }
  }
  
  // Method to spawn an animated data packet between two DOM elements
  animateDataPacket(fromEl, toEl, color = 'var(--neon-cyan)') {
    // This is a simplified animation using CSS transitions.
    // Real paths would use an SVG overlay. For now, we spawn a div and move it.
    // To do this well without complex calculations, we'll keep it simple for the MVP.
  }
}

window.Visualizer = Visualizer;
