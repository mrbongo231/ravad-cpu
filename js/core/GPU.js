class GPU {
  constructor(memory, canvasId) {
    this.memory = memory;
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Unified Memory Architecture (UMA):
    // The GPU reads directly from the CPU's memory!
    // We map a 32x32 display to addresses 2048 through 3071 (1024 pixels total)
    this.fbStart = 2048;
    this.fbSize = 1024;
    
    // Each pixel will be drawn 10x10 on a 320x320 canvas
    this.pixelSize = 10;
    
    // A simple palette mapped to integer values in memory
    this.colors = [
      '#000000', // 0: Black
      '#ffffff', // 1: White
      '#ff00ea', // 2: Magenta
      '#00f3ff', // 3: Cyan
      '#39ff14', // 4: Green
      '#ff6600', // 5: Orange
      '#ff0000', // 6: Red
      '#0000ff'  // 7: Blue
    ];
    
    // Hardware 3D Accelerator Mode
    this.is3DMode = false;
    this.angle = 0;
    
    // Start continuous render loop (60 FPS naturally)
    this._renderLoop();
  }
  
  start3DEngine() {
    this.is3DMode = true;
  }

  stop3DEngine() {
    this.is3DMode = false;
  }
  
  _renderLoop() {
    if (this.is3DMode) {
      this._draw3D();
    } else {
      this._draw2D();
    }
    requestAnimationFrame(() => this._renderLoop());
  }
  
  _draw2D() {
    for (let i = 0; i < this.fbSize; i++) {
      // Read directly from RAM. No bus transfers! (UMA)
      let val = this.memory.read(this.fbStart + i);
      
      // Map memory value to color palette
      let colorIndex = val % this.colors.length;
      if (val < 0) colorIndex = 0; // Handle negative numbers safely
      
      let color = this.colors[colorIndex];
      
      let x = i % 32;
      let y = Math.floor(i / 32);
      
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
    }
  }

  // A simulated Hardware Accelerated 3D Graphics Pipeline
  _draw3D() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = '#050a14';
    this.ctx.fillRect(0, 0, width, height);

    // 1. Vertex Processing (Define a 3D Cube)
    const vertices = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];

    const edges = [
      [0,1], [1,2], [2,3], [3,0], // back
      [4,5], [5,6], [6,7], [7,4], // front
      [0,4], [1,5], [2,6], [3,7]  // connecting
    ];

    this.angle += 0.02;
    const sinA = Math.sin(this.angle);
    const cosA = Math.cos(this.angle);

    // 2. Transformation & Projection
    const projected = vertices.map(v => {
      // Rotate Y
      let x1 = v[0] * cosA - v[2] * sinA;
      let z1 = v[0] * sinA + v[2] * cosA;
      // Rotate X
      let y2 = v[1] * cosA - z1 * sinA;
      let z2 = v[1] * sinA + z1 * cosA;

      // Project to 2D
      const distance = 3;
      const z = 1 / (distance - z2);
      const px = x1 * z * 150 + width / 2;
      const py = y2 * z * 150 + height / 2;
      return [px, py];
    });

    // 3. Rasterization (Draw Lines)
    this.ctx.strokeStyle = 'var(--neon-cyan)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    
    edges.forEach(edge => {
      const p1 = projected[edge[0]];
      const p2 = projected[edge[1]];
      this.ctx.moveTo(p1[0], p1[1]);
      this.ctx.lineTo(p2[0], p2[1]);
    });
    
    this.ctx.stroke();

    // Draw some "GPU Stats" overlay
    this.ctx.fillStyle = 'var(--neon-magenta)';
    this.ctx.font = '12px monospace';
    this.ctx.fillText('AAA Graphics Engine v1.0', 10, 20);
    this.ctx.fillText('Vertices: 8 | Tris: 12', 10, 40);
    this.ctx.fillText('Hardware Accel: ON', 10, 60);
  }
}

window.GPU = GPU;
