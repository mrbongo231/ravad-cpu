class MemoryView {
  constructor(memory) {
    this.memory = memory;
    this.container = document.getElementById('memory-grid-container');
    this.cells = [];
    this.pcMarker = 0;
    
    this._initGrid();
    
    // Bind memory events
    this.memory.onRead = (addr, val) => this._highlightCell(addr, 'read');
    this.memory.onWrite = (addr, val) => {
      this._updateCell(addr, val);
      this._highlightCell(addr, 'write');
    };
  }
  
  _initGrid() {
    this.container.innerHTML = '';
    for (let i = 0; i < this.memory.size; i++) {
      const cell = document.createElement('div');
      cell.className = 'memory-cell';
      
      const addrSpan = document.createElement('span');
      addrSpan.className = 'cell-addr';
      addrSpan.textContent = `0x${i.toString(16).padStart(2, '0').toUpperCase()}`;
      
      const valSpan = document.createElement('span');
      valSpan.className = 'cell-val';
      valSpan.textContent = this.memory.data[i];
      
      cell.appendChild(addrSpan);
      cell.appendChild(valSpan);
      
      // Allow editing
      cell.addEventListener('click', () => {
        const newVal = prompt(`Enter new value for address ${i}:`, this.memory.data[i]);
        if (newVal !== null) {
          const intVal = parseInt(newVal, 10);
          if (!isNaN(intVal)) {
            this.memory.write(i, intVal);
          }
        }
      });
      
      this.container.appendChild(cell);
      this.cells.push({ cell, valSpan });
    }
  }
  
  _updateCell(addr, val) {
    if (this.cells[addr]) {
      this.cells[addr].valSpan.textContent = val;
    }
  }
  
  _highlightCell(addr, type) {
    if (!this.cells[addr]) return;
    const el = this.cells[addr].cell;
    
    el.classList.add(type);
    
    setTimeout(() => {
      el.classList.remove(type);
    }, 300);
  }
  
  updatePC(addr) {
    if (this.cells[this.pcMarker]) {
      this.cells[this.pcMarker].cell.classList.remove('pc-marker');
    }
    if (this.cells[addr]) {
      this.cells[addr].cell.classList.add('pc-marker');
      this.pcMarker = addr;
      // Scroll into view if needed
      this.cells[addr].cell.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  
  refreshAll() {
    for (let i = 0; i < this.memory.size; i++) {
      this._updateCell(i, this.memory.data[i]);
    }
  }
}

window.MemoryView = MemoryView;
