class AAAGame {
  static start() {
    // Switch to GPU tab programmatically
    const tabs = document.querySelectorAll('.tab');
    const tabContents = {
      'tab-memory': document.getElementById('tab-memory'),
      'tab-code': document.getElementById('tab-code'),
      'tab-gpu': document.getElementById('tab-gpu')
    };
    
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector('.tab[data-target="tab-gpu"]').classList.add('active');
    
    Object.values(tabContents).forEach(content => content.style.display = 'none');
    tabContents['tab-gpu'].style.display = 'block';
    
    // Close modal
    document.getElementById('modal-games').style.display = 'none';
    
    // Activate 3D Mode on the global GPU
    if (window.gpu) {
      window.gpu.start3DEngine();
      
      // Update UI text dynamically for the demo
      const title = document.querySelector('#tab-gpu h3');
      const desc = document.querySelector('#tab-gpu p');
      title.textContent = "Cyberpunk 1977 - 3D Graphics Engine";
      title.style.color = "var(--neon-magenta)";
      desc.innerHTML = "The GPU is now using its <strong>Hardware Accelerator</strong> to process 3D vertex math, projection, and rasterization completely independently from the CPU!";
    }
  }
}
window.AAAGame = AAAGame;
