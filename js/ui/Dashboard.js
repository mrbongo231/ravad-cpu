class Dashboard {
  constructor() {
    this.cpuCanvas = document.getElementById('chart-cpu');
    this.ipsCanvas = document.getElementById('chart-ips');
    this.memCanvas = document.getElementById('chart-mem');
    
    this.cpuCtx = this.cpuCanvas.getContext('2d');
    this.ipsCtx = this.ipsCanvas.getContext('2d');
    this.memCtx = this.memCanvas.getContext('2d');
    
    this.cpuData = new Array(50).fill(0);
    this.ipsData = new Array(50).fill(0);
    this.memData = new Array(50).fill(0);
    
    this.statCpuUsage = document.getElementById('stat-cpu-usage');
    this.statIps = document.getElementById('stat-instructions');
    this.statMem = document.getElementById('stat-mem-usage');
    
    // Resize canvases
    this._resizeCanvases();
    window.addEventListener('resize', () => this._resizeCanvases());
    
    this.lastInstructions = 0;
    this.currentInstructions = 0;
    
    this.cpuUsage = 0;
    
    // Start draw loop
    this._drawLoop();
    
    // Start stats loop (1 sec intervals)
    setInterval(() => this._updateStats(), 1000);
  }
  
  _resizeCanvases() {
    // Quick hack to set canvas internal resolution to its CSS size
    const rect1 = this.cpuCanvas.parentElement.getBoundingClientRect();
    this.cpuCanvas.width = rect1.width;
    this.cpuCanvas.height = rect1.height;
    
    const rect2 = this.ipsCanvas.parentElement.getBoundingClientRect();
    this.ipsCanvas.width = rect2.width;
    this.ipsCanvas.height = rect2.height;
    
    const rect3 = this.memCanvas.parentElement.getBoundingClientRect();
    this.memCanvas.width = rect3.width;
    this.memCanvas.height = rect3.height;
  }
  
  updateInstructions(count) {
    this.currentInstructions = count;
  }
  
  setCpuUsage(usagePercentage) {
    this.cpuUsage = usagePercentage;
  }

  setMemUsage(bytes) {
    this.memUsage = bytes;
  }

  _updateStats() {
    // Calculate IPS (Instructions Per Second)
    const ips = this.currentInstructions - this.lastInstructions;
    this.lastInstructions = this.currentInstructions;
    
    // Update labels
    this.statIps.textContent = this.currentInstructions;
    this.statCpuUsage.textContent = `${Math.round(this.cpuUsage)}%`;
    this.statMem.textContent = `${this.memUsage || 0} B`;
    
    // Push to data arrays
    this.cpuData.push(this.cpuUsage);
    this.cpuData.shift();
    
    this.ipsData.push(ips);
    this.ipsData.shift();
    
    this.memData.push(this.memUsage || 0);
    this.memData.shift();
  }

  _drawLoop() {
    this._drawChart(this.cpuCtx, this.cpuCanvas.width, this.cpuCanvas.height, this.cpuData, '#00f3ff');
    
    // Max IPS can be dynamic, let's say max 1000 for chart scaling
    const maxIps = Math.max(10, ...this.ipsData) * 1.2;
    this._drawChart(this.ipsCtx, this.ipsCanvas.width, this.ipsCanvas.height, this.ipsData, '#ff00ea', maxIps);
    
    // Memory chart max scaling
    const maxMem = Math.max(100, ...this.memData) * 1.2;
    this._drawChart(this.memCtx, this.memCanvas.width, this.memCanvas.height, this.memData, '#39ff14', maxMem);
    
    requestAnimationFrame(() => this._drawLoop());
  }

  _drawChart(ctx, width, height, data, color, maxVal = 100) {
    ctx.clearRect(0, 0, width, height);
    
    if (data.length === 0) return;
    
    const stepX = width / (data.length - 1);
    
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      const normalized = Math.min(Math.max(val / maxVal, 0), 1);
      const y = height - (normalized * height * 0.8); // 80% max height
      
      if (i === 0) {
        ctx.moveTo(0, y);
      } else {
        ctx.lineTo(i * stepX, y);
      }
    }
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Fill under line
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = color + '22'; // 22 is hex for low opacity
    ctx.fill();
  }
}

window.Dashboard = Dashboard;
