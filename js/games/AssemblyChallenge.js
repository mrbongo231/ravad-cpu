class AssemblyChallenge {
  static start() {
    const container = document.getElementById('game-container');
    container.innerHTML = `
      <div style="color:var(--text-main); text-align: left; padding: 10px;">
        <h3 style="color:var(--neon-cyan)">Challenge 1: Factorial via Loop</h3>
        <p>Write an assembly program that calculates the factorial of 5 (5 * 4 * 3 * 2 * 1) and stores the result in R1.</p>
        <p>Hints: You can use <code>MOV R0, 5</code>, <code>MOV R1, 1</code>, and <code>MUL R1, R0</code> in a loop!</p>
        <button class="btn btn-primary" id="btnCheck">Verify Solution</button>
        <p id="challengeResult" style="margin-top:10px; font-weight:bold;"></p>
      </div>
    `;
    
    document.getElementById('btnCheck').onclick = () => {
      // Read directly from the code editor in the main UI
      const code = document.getElementById('code-editor').value;
      const mc = window.Assembler.assemble(code);
      
      // Spin up a temporary CPU and Memory to test
      const mem = new window.Memory(4096);
      mem.loadProgram(mc);
      const cpu = new window.CPU(mem);
      
      // Run it for a max of 1000 ticks to prevent infinite loops
      let ticks = 0;
      cpu.run();
      while(!cpu.halted && ticks < 1000) {
        cpu.tick();
        ticks++;
      }
      
      const res = document.getElementById('challengeResult');
      if (cpu.registers.R1 === 120 && cpu.halted) {
        res.style.color = 'var(--neon-green)';
        res.textContent = 'Success! R1 contains 120 (5!).';
      } else {
        res.style.color = 'var(--neon-magenta)';
        res.textContent = `Failed. R1 is ${cpu.registers.R1}, expected 120. Ensure you used HALT at the end.`;
      }
    };
  }
}
window.AssemblyChallenge = AssemblyChallenge;
