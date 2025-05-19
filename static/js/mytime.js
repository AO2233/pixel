document.addEventListener('DOMContentLoaded', function() {
    // 常量计算 - 只计算一次
    const birthDate = new Date('1999-09-27').getTime();
    const lifeExpectancyYears = 75; // 假设预期寿命为75年 哈哈 活不长
    const endDate = birthDate + (lifeExpectancyYears * 365.25 * 24 * 60 * 60 * 1000);
    const totalLifespan = endDate - birthDate;
    const inverseLifespan = 100 / totalLifespan; // 预计算乘法因子
    
    // DOM引用缓存
    const percentElement = document.getElementById('percentPassed');
    const rootStyle = document.documentElement.style;
    
    // 性能优化变量
    let lastUpdateTime = 0;
    let animationFrameId = null;
    let lastPercent = -1; // 用于避免不必要的DOM更新
    
    function updatePercentage(timestamp) {
        if (timestamp - lastUpdateTime >= 500) {
            const now = Date.now();
            const timeElapsed = now - birthDate;
            
            // 使用预计算的乘法因子而不是除法
            const percentPassed = timeElapsed * inverseLifespan;
            const percentFixed = percentPassed.toFixed(8);
            
            // 只有当百分比变化时才更新DOM
            if (percentFixed !== lastPercent) {
                percentElement.textContent = percentFixed + '%';
                lastPercent = percentFixed;
            }
            lastUpdateTime = timestamp;
        }
        animationFrameId = requestAnimationFrame(updatePercentage);
    }

    animationFrameId = requestAnimationFrame(updatePercentage);

    const container = document.querySelector('.container');
    container.style.opacity = '0';
    
    // 页面不可见时暂停动画，节省资源
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId);
        } else {
            animationFrameId = requestAnimationFrame(updatePercentage);
        }
    });
}); 