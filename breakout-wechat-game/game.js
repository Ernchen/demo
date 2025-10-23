// 游戏主逻辑文件
// 在微信小游戏中，系统会自动创建canvas，我们需要获取它
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

// 游戏状态
let score = 0;
let lives = 3;
let isGameOver = false;
let animationId = null;

// 挡板参数
const paddleHeight = 10;
const paddleWidth = 80; // 减小挡板宽度以适应手机屏幕
let paddleX = (canvas.width - paddleWidth) / 2;
let paddleY = canvas.height - 50; // 调整挡板位置，确保在底部

// 球参数
const ballRadius = 10;
let ballX = canvas.width / 2;
let ballY = canvas.height - 30;
let ballDX = 4;
let ballDY = -4;

// 砖块参数
const brickRowCount = 5;
const brickColumnCount = 6; // 减少列数以适应手机屏幕
const brickWidth = 45; // 略微减小砖块宽度
const brickHeight = 20;
const brickPadding = 8; // 略微减小间距
const brickOffsetTop = 60;
const brickOffsetLeft = 25;

// 创建砖块数组
const bricks = [];

// 初始化游戏
function initGame() {
  // 获取系统信息以适配不同屏幕
  const sysInfo = wx.getSystemInfoSync();
  const width = sysInfo.windowWidth;
  // 可以考虑稍微调整高度，以确保所有元素都能显示
  const height = sysInfo.windowHeight;
  
  // 设置canvas尺寸
  canvas.width = width;
  canvas.height = height;
  
  // 重新计算挡板和球的初始位置
  paddleX = (canvas.width - paddleWidth) / 2
  paddleY = canvas.height - 50;
  ballX = canvas.width / 2;
  ballY = canvas.height - 30;
  
  // 初始化砖块
  initBricks();
  
  // 监听触摸事件来控制挡板
  wx.onTouchMove(touchMoveHandler);
  
  // 开始游戏循环
  startGameLoop();
}

// 初始化砖块
function initBricks() {
  // 清空砖块数组
  bricks.length = 0;
  
  // 计算砖块间距以适应屏幕
  const totalBrickWidth = brickColumnCount * (brickWidth + brickPadding) - brickPadding;
  const newBrickOffsetLeft = (canvas.width - totalBrickWidth) / 2;
  const safeBrickOffsetLeft = Math.max(0, newBrickOffsetLeft);
  
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      // 计算砖块位置并确保在安全边界内
      const brickX = c * (brickWidth + brickPadding) + safeBrickOffsetLeft;
      const safeBrickX = Math.min(brickX, canvas.width - brickWidth);
      const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
      
      bricks[c][r] = {
        x: safeBrickX,
        y: brickY,
        status: 1, // 1表示存在，0表示被击碎
        color: getBrickColor(r) // 根据行数获取不同颜色
      };
    }
  }
}

// 根据行数获取砖块颜色
function getBrickColor(row) {
  const colors = ['#FF5252', '#FFD740', '#69F0AE', '#40C4FF', '#E040FB'];
  return colors[row % colors.length];
}

// 触摸移动处理函数
function touchMoveHandler(e) {
  // 微信小游戏中的触摸事件参数结构
  const touchX = e.touches[0].clientX;
  paddleX = touchX - paddleWidth / 2;
  
  // 确保挡板不会移出画布
  if (paddleX < 0) paddleX = 0;
  if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
}

// 绘制球
function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.closePath();
}

// 绘制挡板
function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight);
  ctx.fillStyle = '#40C4FF';
  ctx.fill();
  ctx.closePath();
}

// 绘制砖块
function drawBricks() {
  // 计算砖块间距以适应屏幕
  const totalBrickWidth = brickColumnCount * (brickWidth + brickPadding) - brickPadding;
  const newBrickOffsetLeft = (canvas.width - totalBrickWidth) / 2;
  
  // 确保砖块完全在画布内
  const safeBrickOffsetLeft = Math.max(0, newBrickOffsetLeft);
  
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + safeBrickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        
        // 确保砖块不超出右侧边界
        const safeBrickX = Math.min(brickX, canvas.width - brickWidth);
        
        bricks[c][r].x = safeBrickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(safeBrickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = bricks[c][r].color;
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

// 绘制得分
function drawScore() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('得分: ' + score, 8, 20);
}

// 绘制生命值
function drawLives() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('生命: ' + lives, canvas.width - 65, 20);
}

// 检测砖块碰撞
function detectBrickCollision() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        if (
          ballX > b.x &&
          ballX < b.x + brickWidth &&
          ballY > b.y &&
          ballY < b.y + brickHeight
        ) {
          ballDY = -ballDY;
          b.status = 0;
          score += 10;

          // 检查是否所有砖块都被击碎
          let allBricksDestroyed = true;
          for (let i = 0; i < brickColumnCount; i++) {
            for (let j = 0; j < brickRowCount; j++) {
              if (bricks[i][j].status === 1) {
                allBricksDestroyed = false;
                break;
              }
            }
            if (!allBricksDestroyed) break;
          }

          if (allBricksDestroyed) {
            gameOver(true);
          }
        }
      }
    }
  }
}

// 检测墙壁和挡板碰撞
function detectWallAndPaddleCollision() {
  // 检测左右墙壁碰撞
  if (ballX + ballDX > canvas.width - ballRadius || ballX + ballDX < ballRadius) {
    ballDX = -ballDX;
  }

  // 检测顶部墙壁碰撞
  if (ballY + ballDY < ballRadius) {
    ballDY = -ballDY;
  } else if (ballY + ballDY > paddleY - ballRadius) {
    // 检测挡板碰撞
    if (ballX > paddleX && ballX < paddleX + paddleWidth) {
      // 根据击中挡板的位置调整反弹角度
      const hitPosition = (ballX - paddleX) / paddleWidth;
      const angle = hitPosition * Math.PI - Math.PI / 2;
      const speed = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
      ballDX = Math.cos(angle) * speed;
      ballDY = -Math.abs(Math.sin(angle) * speed);
    } else if (ballY + ballDY > canvas.height - ballRadius) {
      // 球掉落，减少生命值
      lives--;
      
      if (lives <= 0) {
        gameOver(false);
      } else {
        // 重置球和挡板位置
        ballX = canvas.width / 2;
        ballY = canvas.height - 30;
        ballDX = 4;
        ballDY = -4;
        paddleX = (canvas.width - paddleWidth) / 2;
        paddleY = canvas.height - 50;
      }
    }
  }
}

// 游戏结束处理
function gameOver(isVictory) {
  isGameOver = true;
  
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  // 显示游戏结果
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  
  if (isVictory) {
    ctx.fillText('恭喜你获胜了！', canvas.width / 2, canvas.height / 2 - 20);
  } else {
    ctx.fillText('游戏结束！', canvas.width / 2, canvas.height / 2 - 20);
  }
  
  ctx.fillText('最终得分: ' + score, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText('点击任意位置重新开始', canvas.width / 2, canvas.height / 2 + 60);
  
  // 添加点击重新开始事件
  wx.onTouchStart(restartGame);
}

// 重新开始游戏
function restartGame() {
  // 移除点击事件，这里不需要显式移除，因为gameOver函数会重新注册
  
  // 重置游戏状态
  score = 0;
  lives = 3;
  isGameOver = false;
  
  // 重置球和挡板
  ballX = canvas.width / 2;
  ballY = canvas.height - 30;
  ballDX = 4;
  ballDY = -4;
  paddleX = (canvas.width - paddleWidth) / 2;
  paddleY = canvas.height - 50;
  
  // 重置砖块
  initBricks();
  
  // 开始游戏循环
  startGameLoop();
}

// 游戏主循环
function gameLoop() {
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 设置背景色
  ctx.fillStyle = '#222222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制游戏元素
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawLives();

  // 碰撞检测
  detectBrickCollision();
  detectWallAndPaddleCollision();

  // 更新球位置
  ballX += ballDX;
  ballY += ballDY;

  // 继续游戏循环
  animationId = requestAnimationFrame(gameLoop);
}

// 开始游戏循环
function startGameLoop() {
  if (!isGameOver) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

// 停止游戏循环
function stopGameLoop() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// 生命周期函数 - 游戏启动时执行
wx.onShow(function() {
  console.log('Breakout 微信小游戏启动');
  initGame();
});

// 生命周期函数 - 游戏隐藏时执行
wx.onHide(function() {
  stopGameLoop();
});

// 注意：微信小游戏中没有wx.onExit API，所以不再包含此生命周期函数