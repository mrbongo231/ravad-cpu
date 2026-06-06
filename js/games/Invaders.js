class InvadersGame {
  static start() {
    const container = document.getElementById('game-container');
    container.innerHTML = '<canvas id="game-canvas" width="300" height="300" style="border:1px solid var(--neon-cyan); background:black;"></canvas>';
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    let px = 140;
    let bullets = [];
    let enemies = [{x: 50, y: 20}, {x: 100, y: 20}, {x: 150, y: 20}];
    
    const keyHandler = (e) => {
      if(e.key === 'ArrowLeft') px -= 10;
      if(e.key === 'ArrowRight') px += 10;
      if(e.key === ' ') bullets.push({x: px + 10, y: 280});
    };
    window.addEventListener('keydown', keyHandler);
    
    const interval = setInterval(() => {
      ctx.clearRect(0,0,300,300);
      
      // player
      ctx.fillStyle = 'var(--neon-cyan)';
      ctx.fillRect(px, 280, 20, 10);
      
      // bullets
      ctx.fillStyle = 'white';
      for(let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= 5;
        ctx.fillRect(bullets[i].x, bullets[i].y, 2, 5);
        if(bullets[i].y < 0) bullets.splice(i, 1);
      }
      
      // enemies
      ctx.fillStyle = 'var(--neon-magenta)';
      for(let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += 0.5;
        ctx.fillRect(enemies[i].x, enemies[i].y, 20, 15);
        
        // collision
        for(let j = bullets.length - 1; j >= 0; j--) {
          if(bullets[j].x > enemies[i].x && bullets[j].x < enemies[i].x + 20 &&
             bullets[j].y > enemies[i].y && bullets[j].y < enemies[i].y + 15) {
            enemies.splice(i, 1);
            bullets.splice(j, 1);
            break;
          }
        }
      }
      
      if(enemies.length === 0) {
        clearInterval(interval);
        ctx.fillStyle = 'var(--neon-green)';
        ctx.fillText("YOU WIN!", 120, 150);
      }
      
    }, 30);
    
    const closeBtn = document.querySelector('#modal-games .btn-close');
    closeBtn.addEventListener('click', () => {
      clearInterval(interval);
      window.removeEventListener('keydown', keyHandler);
    }, {once:true});
  }
}
window.InvadersGame = InvadersGame;
