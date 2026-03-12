document.addEventListener('DOMContentLoaded', () => {
    // SixtySeven Mining Protocol Parameters
    const TOTAL_MINING_REWARDS = 400000000;
    const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;
    const REWARD_PER_MS = TOTAL_MINING_REWARDS / TEN_YEARS_MS;

    let currentRewards = 0;
    let startTime = Date.now();

    // Create Dashboard Elements
    const rewardsElement = document.createElement('div');
    rewardsElement.className = 'db-item';
    rewardsElement.innerHTML = `
        <span class="db-label">Protocol Rewards (Live)</span>
        <span class="db-value" id="live-rewards">0.000000 $67</span>
    `;

    const countdownElement = document.createElement('div');
    countdownElement.className = 'db-item';
    countdownElement.innerHTML = `
        <span class="db-label">Time to Next Halving</span>
        <span class="db-value" id="halving-countdown">730d 00h 00m</span>
    `;

    const dbGrid = document.querySelector('.db-grid');
    if (dbGrid) {
        dbGrid.appendChild(rewardsElement);
        dbGrid.appendChild(countdownElement);
    }

    const liveRewardsSpan = document.getElementById('live-rewards');
    const halvingSpan = document.getElementById('halving-countdown');

    // Real-time Mining Calculation
    function updateSimulation() {
        const elapsed = Date.now() - startTime;
        // Simulating a high-frequency hash rate
        currentRewards += (Math.random() * REWARD_PER_MS * 100);

        if (liveRewardsSpan) {
            liveRewardsSpan.innerText = `${currentRewards.toFixed(6)} $67`;
        }

        // Static countdown for demo, could be dynamic
        if (halvingSpan) {
            const now = new Date();
            const target = new Date(now.getTime() + (730 * 24 * 60 * 60 * 1000));
            // Just a static visual representation for the landing page
            halvingSpan.innerText = "729d 23h 59m";
        }
    }

    setInterval(updateSimulation, 100);

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
