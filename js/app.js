document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Core
  const memory = new window.Memory(4096);
  const cpu = new window.CPU(memory);
  const assembler = window.Assembler;

  // 2. Initialize UI
  const dashboard = new window.Dashboard();
  const memoryView = new window.MemoryView(memory);
  const visualizer = new window.Visualizer(cpu);
  const gpu = new window.GPU(memory, 'gpu-canvas');
  window.gpu = gpu; // Expose globally for AAAGame demo

  const consoleOutput = document.getElementById('console-output');

  // Hook up CPU events
  cpu.onInstructionExecuted = (count) => {
    dashboard.updateInstructions(count);
  };

  // We'll update the PC in memory view when registers change
  const originalOnRegisterChange = cpu.onRegisterChange;
  cpu.onRegisterChange = (regs) => {
    if (originalOnRegisterChange) originalOnRegisterChange(regs); // For Visualizer
    memoryView.updatePC(regs.PC);
  };

  cpu.onOutput = (val) => {
    let display = val;
    if (typeof val === 'number' && !Number.isInteger(val)) {
      display = val.toPrecision(16);
    }
    // For digit streams, val is already a string like "3.14159..."
    consoleOutput.value = `> ${display}\n` + consoleOutput.value;
    // Keep console from growing too large
    if (consoleOutput.value.length > 50000) {
      consoleOutput.value = consoleOutput.value.substring(0, 50000);
    }
  };

  // Memory Usage Tracker Loop
  setInterval(() => {
    let used = 0;
    for (let i = 0; i < memory.size; i++) {
      if (memory.data[i] !== 0) used++;
    }
    dashboard.setMemUsage(used);
  }, 1000);

  // 3. Setup CPU Loop
  let cpuInterval = null;
  let turboInterval = null;
  const speedSlider = document.getElementById('clock-speed');
  
  function getIntervalMs() {
    // slider 1 (slow) to 100 (fast)
    // 100 -> 10ms, 1 -> 1000ms
    const speed = parseInt(speedSlider.value, 10);
    return 1010 - (speed * 10);
  }

  function runCpuLoop() {
    if (!cpu.halted) {
      cpu.tick();
      // Calculate a fake CPU usage based on speed
      const usage = Math.min((parseInt(speedSlider.value, 10) / 100) * 100 + (Math.random() * 10 - 5), 100);
      dashboard.setCpuUsage(usage);
    } else {
      dashboard.setCpuUsage(0);
    }
  }

  function startLoop() {
    stopAllLoops();
    cpuInterval = setInterval(runCpuLoop, getIntervalMs());
  }

  function startTurboLoop() {
    stopAllLoops();
    turboInterval = setInterval(() => {
      // Execute 50000 instructions per tick for math-heavy workloads
      for (let i = 0; i < 50000; i++) {
        if (!cpu.halted) {
          cpu.tick();
        } else {
          break;
        }
      }
      dashboard.setCpuUsage(100);
    }, 10);
  }

  function stopAllLoops() {
    if (cpuInterval) clearInterval(cpuInterval);
    if (turboInterval) clearInterval(turboInterval);
  }

  speedSlider.addEventListener('input', () => {
    if (!cpu.halted && cpuInterval) {
      startLoop();
    }
  });

  // 4. Setup Controls
  const btnPlay = document.getElementById('btn-play');
  const btnStep = document.getElementById('btn-step');
  const btnReset = document.getElementById('btn-reset');
  const btnTurbo = document.getElementById('btn-turbo');
  const btnAssemble = document.getElementById('btn-assemble');
  const btnAssembleRun = document.getElementById('btn-assemble-run');
  
  const codeEditor = document.getElementById('code-editor');

  btnPlay.addEventListener('click', () => {
    if (cpu.halted) {
      cpu.run();
      btnPlay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Pause`;
      startLoop();
    } else {
      cpu.pause();
      stopAllLoops();
      btnPlay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Run`;
    }
  });

  btnTurbo.addEventListener('click', () => {
    if (cpu.halted) {
      cpu.run();
      btnPlay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Pause`;
    }
    startTurboLoop();
  });

  btnStep.addEventListener('click', () => {
    cpu.pause();
    stopAllLoops();
    btnPlay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Run`;
    cpu.step();
    // momentary cpu usage spike
    dashboard.setCpuUsage(Math.random() * 30 + 10);
    setTimeout(() => dashboard.setCpuUsage(0), 100);
  });

  btnReset.addEventListener('click', () => {
    cpu.pause();
    stopAllLoops();
    cpu.reset();
    btnPlay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Run`;
    memoryView.updatePC(0);
    dashboard.setCpuUsage(0);
    consoleOutput.value = '';
  });

  cpu.onHalt = () => {
    stopAllLoops();
    btnPlay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Run`;
  };

  btnAssemble.addEventListener('click', () => {
    const code = codeEditor.value;
    const machineCode = assembler.assemble(code);
    memory.reset();
    memory.loadProgram(machineCode, 0);
    memoryView.refreshAll();
    
    // reset cpu
    cpu.pause();
    stopAllLoops();
    cpu.reset();
    consoleOutput.value = '';
    btnPlay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Run`;
    
    alert(`Assembled ${machineCode.length} bytes and loaded into RAM. Check the CPU Architecture panel to run it!`);
  });

  btnAssembleRun.addEventListener('click', () => {
    const code = codeEditor.value;
    const machineCode = assembler.assemble(code);
    memory.reset();
    memory.loadProgram(machineCode, 0);
    memoryView.refreshAll();
    
    // reset cpu
    cpu.pause();
    stopAllLoops();
    cpu.reset();
    consoleOutput.value = '';
    
    // Start running immediately
    cpu.run();
    btnPlay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Pause`;
    startLoop();
  });

  // 5. Tabs
  const tabs = document.querySelectorAll('.tab');
  const tabContents = {
    'tab-memory': document.getElementById('tab-memory'),
    'tab-code': document.getElementById('tab-code'),
    'tab-gpu': document.getElementById('tab-gpu')
  };
  const codeControls = document.getElementById('code-controls');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Hide all contents
      Object.values(tabContents).forEach(content => content.style.display = 'none');
      
      // Show target
      const targetId = tab.dataset.target;
      tabContents[targetId].style.display = targetId === 'tab-code' ? 'flex' : 'block';
      
      // Toggle controls
      if (targetId === 'tab-code') {
        codeControls.style.display = 'flex';
      } else {
        codeControls.style.display = 'none';
      }
    });
  });

  // 6. Modals
  const btnLearn = document.getElementById('btn-learn');
  const btnGames = document.getElementById('btn-games');
  const modalLearn = document.getElementById('modal-learn');
  const modalGames = document.getElementById('modal-games');

  btnLearn.addEventListener('click', () => {
    modalLearn.style.display = 'flex';
  });

  btnGames.addEventListener('click', () => {
    modalGames.style.display = 'flex';
  });
});
