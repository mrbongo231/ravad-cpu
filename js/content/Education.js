document.addEventListener('DOMContentLoaded', () => {
  const content = `
    <div class="learn-section">
      <h3>1. What is a CPU?</h3>
      <p>The Central Processing Unit (CPU) is the brain of the computer. It performs basic arithmetic, logic, controlling, and input/output (I/O) operations specified by the instructions in the program.</p>
    </div>
    <div class="learn-section">
      <h3>2. The Fetch-Decode-Execute Cycle</h3>
      <p><strong>Fetch:</strong> The CPU fetches an instruction from memory (RAM) using the Program Counter (PC).</p>
      <p><strong>Decode:</strong> The Control Unit figures out what the instruction means.</p>
      <p><strong>Execute:</strong> The ALU performs the mathematical or logical operation.</p>
    </div>
    <div class="learn-section">
      <h3>3. Registers</h3>
      <p>Registers are tiny, extremely fast memory locations built directly into the CPU. The <strong>Accumulator (ACC)</strong> stores intermediate arithmetic results. The <strong>Program Counter (PC)</strong> holds the address of the next instruction.</p>
    </div>
    <div class="learn-section">
      <h3>4. Machine Code & Assembly</h3>
      <p>Computers only understand 1s and 0s (Binary). Assembly language is a human-readable representation of this binary machine code. For example, <code>LOAD 5</code> might translate to the number <code>10</code> followed by <code>5</code> in memory.</p>
    </div>
    <div class="learn-section">
      <h3>5. CPU vs GPU (3D Graphics)</h3>
      <p>A <strong>CPU</strong> is like a sports car: it goes very fast but can only carry a few instructions at a time. A <strong>GPU</strong> (Graphics Processing Unit) is like a bus: it moves slower, but can process thousands of pixels simultaneously! Modern AAA games use the GPU's hardware accelerator to do heavy 3D math (Vertex transformations, Projection, and Rasterization) so the CPU doesn't get bogged down.</p>
    </div>
    <div class="learn-section">
      <h3>Quiz</h3>
      <p>Which register holds the address of the next instruction?</p>
      <button class="btn" onclick="alert('Correct!')">Program Counter (PC)</button>
      <button class="btn" onclick="alert('Try again!')">Accumulator (ACC)</button>
    </div>
  `;

  const container = document.getElementById('learn-content');
  if (container) {
    container.innerHTML = content;
  }
});
