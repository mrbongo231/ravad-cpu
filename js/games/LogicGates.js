class LogicGatesGame {
  static start() {
    const container = document.getElementById('game-container');
    container.innerHTML = `
      <div style="color:var(--text-main); font-family:var(--font-mono)">
        <h3>Logic Gate Sandbox</h3>
        <p>A = <button id="btnA" class="btn">0</button></p>
        <p>B = <button id="btnB" class="btn">0</button></p>
        <hr style="border: 1px solid var(--glass-border); margin: 10px 0;">
        <p>A AND B = <span id="outAnd" style="color:var(--neon-cyan)">0</span></p>
        <p>A OR B = <span id="outOr" style="color:var(--neon-magenta)">0</span></p>
        <p>A XOR B = <span id="outXor" style="color:var(--neon-green)">0</span></p>
      </div>
    `;
    
    let a = 0; let b = 0;
    const btnA = document.getElementById('btnA');
    const btnB = document.getElementById('btnB');
    const outAnd = document.getElementById('outAnd');
    const outOr = document.getElementById('outOr');
    const outXor = document.getElementById('outXor');
    
    const update = () => {
      btnA.textContent = a;
      btnB.textContent = b;
      outAnd.textContent = a & b;
      outOr.textContent = a | b;
      outXor.textContent = a ^ b;
    };
    
    btnA.onclick = () => { a = 1 - a; update(); };
    btnB.onclick = () => { b = 1 - b; update(); };
  }
}
window.LogicGatesGame = LogicGatesGame;
