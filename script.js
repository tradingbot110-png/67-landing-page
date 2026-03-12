document.addEventListener('DOMContentLoaded', () => {
    // SixtySeven Protocol Configuration
    const TOTAL_MINING_REWARDS = 600000000; // 60% of 1B
    const MINING_TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;
    const NOMINAL_RATE_PER_MS = TOTAL_MINING_REWARDS / MINING_TEN_YEARS_MS;
    const PERSONAL_SHARE_FACTOR = 0.0005; // Balanced for visible movement & scarcity
    const USER_MINING_RATE = NOMINAL_RATE_PER_MS * PERSONAL_SHARE_FACTOR;
    
    // UI Elements
    const connectBtn = document.getElementById('connect-wallet');
    const walletDisplay = document.getElementById('wallet-address');
    const liveRewardsSpan = document.getElementById('live-rewards');
    const hashRateSpan = document.getElementById('hash-rate');
    const halvingSpan = document.getElementById('halving-countdown');
    
    let userWallet = null;
    let miningActive = false;
    let accumulatedRewards = 0;
    let lastUpdateTimestamp = Date.now();

    // Check localStorage for existing session
    const savedWallet = localStorage.getItem('67_wallet_address');
    if (savedWallet) {
        initSession(savedWallet);
    }

    // Wallet Connection Logic
    async function connectWallet() {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect();
                const address = response.publicKey.toString();
                initSession(address);
            } catch (err) {
                console.error("Wallet connection failed:", err);
            }
        } else {
            window.open('https://phantom.app/', '_blank');
        }
    }

    function initSession(address) {
        userWallet = address;
        localStorage.setItem('67_wallet_address', userWallet);
        
        // UI Updates
        connectBtn.classList.add('hidden');
        walletDisplay.innerText = `${address.slice(0, 4)}...${address.slice(-4)}`;
        walletDisplay.classList.remove('hidden');
        
        // Load precision state
        const savedData = JSON.parse(localStorage.getItem(`67_data_${address}`)) || {
            rewards: 0,
            lastVisit: Date.now()
        };
        
        accumulatedRewards = savedData.rewards;
        
        // Calculate offline rewards (simulated catch-up)
        const now = Date.now();
        const offlineTime = now - savedData.lastVisit;
        const offlineGain = offlineTime * USER_MINING_RATE;
        accumulatedRewards += offlineGain;
        
        miningActive = true;
        updateHashRate();
        startSimulation();
    }

    function updateHashRate() {
        if (miningActive) {
            const simulatedHash = (3.5 + Math.random() * 2).toFixed(2);
            hashRateSpan.innerText = `${simulatedHash} PH/s`; // Petahash scale for "Persistence" feel
        } else {
            hashRateSpan.innerText = `0.00 H/s`;
        }
    }

    function startSimulation() {
        setInterval(() => {
            if (!miningActive) return;
            
            const now = Date.now();
            const elapsed = now - lastUpdateTimestamp;
            lastUpdateTimestamp = now;
            
            const gain = elapsed * USER_MINING_RATE;
            accumulatedRewards += gain;
            
            // Persist every update
            localStorage.setItem(`67_data_${userWallet}`, JSON.stringify({
                rewards: accumulatedRewards,
                lastVisit: now
            }));
            
            // Update UI
            if (liveRewardsSpan) {
                if (miningActive) {
                    liveRewardsSpan.innerText = `${accumulatedRewards.toFixed(10)} $67`;
                } else {
                    liveRewardsSpan.innerText = "Connect Wallet to Start";
                }
            }

            // --- NEW: Global Pool & Progress Simulation ---
            const poolLabel = document.getElementById('pool-label');
            const poolProgress = document.getElementById('pool-progress');
            if (poolLabel && poolProgress) {
                // We simulate that the pool drains globally based on time passed since launch
                const launchDate = new Date('2026-03-12T18:00:00Z').getTime();
                const totalElapsed = now - launchDate;
                
                // We simulate thousands of miners globally
                const globalDrain = (totalElapsed * NOMINAL_RATE_PER_MS * 12.5); // Global factor 12.5x nominal
                const remaining = Math.max(TOTAL_MINING_REWARDS - globalDrain, 0);
                
                poolLabel.innerText = `Mining Pool: ${Math.floor(remaining).toLocaleString()} $67 Remaining`;
                
                const progressPercent = ((TOTAL_MINING_REWARDS - remaining) / TOTAL_MINING_REWARDS) * 100;
                poolProgress.style.width = `${Math.min(progressPercent + 1, 100)}%`; // +1 for visible start
            }
            
            // --- NEW: Difficulty / Hash Rate Jitter ---
            if (miningActive && hashRateSpan) {
                // Bitcoin difficulty style: Jitter based on "Network Load"
                const noise = Math.sin(now / 5000) * 0.5; // Sine wave jitter
                const difficultyFactor = 1.0 + (noise * 0.2); 
                const baseHash = 4.2 + noise;
                hashRateSpan.innerText = `${baseHash.toFixed(2)} PH/s`;
                
                // Visual Color Shift if "Difficulty" is high
                if (baseHash > 4.5) {
                    hashRateSpan.style.color = '#ff3366'; // Reddish for high difficulty
                } else {
                    hashRateSpan.style.color = '#00ffcc'; // Standard neon
                }
            }
            
            // Update Milestone
            const milestoneStatus = document.getElementById('milestone-status');
            if (milestoneStatus) {
                const progress = Math.min((accumulatedRewards / 1000) * 100, 100).toFixed(1);
                milestoneStatus.innerText = `${progress}% to Goal (1,000 $67)`;
                if (progress >= 100) {
                    milestoneStatus.style.color = '#00ffcc';
                    milestoneStatus.innerText = "GOAL REACHED! Claim in Telegram 🚀";
                }
            }
            
            // Update Countdown (Simulated based on Phase 2 start)
            if (halvingSpan) {
                const halvingDate = new Date('2028-03-12T20:00:00Z').getTime();
                const diff = halvingDate - now;
                
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                
                halvingSpan.innerText = `${days}d ${hours}h ${mins}m`;
            }

            // Visual Hash Jitter removed (handled above)
        }, 100);
    }

    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }

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
