class SnakeGame {
  static start() {
    const container = document.getElementById('game-container');
    container.innerHTML = '<canvas id="game-canvas" width="300" height="300" style="border:1px solid var(--neon-cyan); background:black;"></canvas>';
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    let snake = [{x: 5, y: 5}];
    let dir = {x: 1, y: 0};
    let food = {x: 10, y: 10};
    
    // Bind keys
    const keyHandler = (e) => {
      if(e.key === 'ArrowUp' && dir.y === 0) dir = {x:0, y:-1};
      if(e.key === 'ArrowDown' && dir.y === 0) dir = {x:0, y:1};
      if(e.key === 'ArrowLeft' && dir.x === 0) dir = {x:-1, y:0};
      if(e.key === 'ArrowRight' && dir.x === 0) dir = {x:1, y:0};
    };
    window.addEventListener('keydown', keyHandler);
    
    const interval = setInterval(() => {
      // Logic
      let head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
      snake.unshift(head);
      
      if(head.x === food.x && head.y === food.y) {
        food = {x: Math.floor(Math.random()*15), y: Math.floor(Math.random()*15)};
      } else {
        snake.pop();
      }
      
      // Draw
      ctx.clearRect(0,0,300,300);
      
      ctx.fillStyle = 'var(--neon-green)';
      snake.forEach(p => ctx.fillRect(p.x*20, p.y*20, 18, 18));
      
      ctx.fillStyle = 'var(--neon-magenta)';
      ctx.fillRect(food.x*20, food.y*20, 18, 18);
      
      // Check collision
      if(head.x < 0 || head.x >= 15 || head.y < 0 || head.y >= 15) {
        clearInterval(interval);
        window.removeEventListener('keydown', keyHandler);
        ctx.fillStyle = 'white';
        ctx.fillText("GAME OVER", 120, 150);
      }
    }, 150);
    
    // Cleanup if modal closes
    const closeBtn = document.querySelector('#modal-games .btn-close');
    closeBtn.addEventListener('click', () => {
      clearInterval(interval);
      window.removeEventListener('keydown', keyHandler);
    }, {once:true});
  }
}
window.SnakeGame = SnakeGame;
