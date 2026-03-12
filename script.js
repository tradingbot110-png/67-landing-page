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
        
        // Load state
        const savedData = JSON.parse(localStorage.getItem(`67_data_${address}`)) || {
            rewards: 0,
            pending: 0,
            lastVisit: Date.now()
        };
        
        accumulatedRewards = savedData.rewards;
        let pendingRealRewards = savedData.pending || 0;
        
        // Calculate offline rewards
        const now = Date.now();
        const offlineTime = now - savedData.lastVisit;
        const offlineGain = offlineTime * USER_MINING_RATE;
        accumulatedRewards += offlineGain;
        
        miningActive = true;
        updateHashRate();
        startSimulation(pendingRealRewards);
    }

    function updateHashRate() {
        // ... (not needed to replace, but startSimulation needs the arg)
    }

    function startSimulation(initialPending) {
        let pendingRealRewards = initialPending;
        
        setInterval(() => {
            if (!miningActive) return;
            
            const now = Date.now();
            const elapsed = now - lastUpdateTimestamp;
            lastUpdateTimestamp = now;
            
            const gain = elapsed * USER_MINING_RATE;
            accumulatedRewards += gain;

            // --- REWARD RESET LOGIC ---
            if (accumulatedRewards >= 1000) {
                pendingRealRewards += 10;
                accumulatedRewards -= 1000;
            }
            
            // Persist
            localStorage.setItem(`67_data_${userWallet}`, JSON.stringify({
                rewards: accumulatedRewards,
                pending: pendingRealRewards,
                lastVisit: now
            }));
            
            // Update UI
            if (liveRewardsSpan) {
                liveRewardsSpan.innerText = `${accumulatedRewards.toFixed(10)} $67`;
            }

            // Update Global Pool & Progress
            const poolLabel = document.getElementById('pool-label');
            const poolProgress = document.getElementById('pool-progress');
            if (poolLabel && poolProgress) {
                const launchDate = new Date('2026-03-12T18:00:00Z').getTime();
                const totalElapsed = now - launchDate;
                const globalDrain = (totalElapsed * NOMINAL_RATE_PER_MS * 12.5);
                const remaining = Math.max(TOTAL_MINING_REWARDS - globalDrain, 0);
                poolLabel.innerText = `Mining Pool: ${Math.floor(remaining).toLocaleString()} $67 Remaining`;
                const progressPercent = ((TOTAL_MINING_REWARDS - remaining) / TOTAL_MINING_REWARDS) * 100;
                poolProgress.style.width = `${Math.min(progressPercent + 1, 100)}%`;
            }
            
            // Update Difficulty (Difficulty increases as pool drains = PH goes down)
            if (miningActive && hashRateSpan) {
                const launchDateString = '2026-03-12T18:00:00Z';
                const launchDate = new Date(launchDateString).getTime();
                const totalElapsedSinceLaunch = now - launchDate;
                const globalDrain = (totalElapsedSinceLaunch * NOMINAL_RATE_PER_MS * 12.5);
                const progressFactor = globalDrain / TOTAL_MINING_REWARDS; 
                
                // Base 4.2 PH/s, decreases as pool drains
                const noise = Math.sin(now / 5000) * 0.3;
                const difficultyLoss = progressFactor * 2.0; 
                const currentHash = Math.max(4.2 + noise - difficultyLoss, 0.1);
                
                hashRateSpan.innerText = `${currentHash.toFixed(2)} PH/s`;
            }
            
            // Update Milestone & Verification
            const milestoneStatus = document.getElementById('milestone-status');
            const pendingSpan = document.getElementById('pending-real-rewards');
            const hashSpan = document.getElementById('verification-hash');
            const claimBtn = document.getElementById('claim-rewards');

            if (milestoneStatus) {
                const progress = ((accumulatedRewards / 1000) * 100).toFixed(1);
                milestoneStatus.innerText = `${progress}% to next tier`;
            }
            if (pendingSpan) pendingSpan.innerText = `${pendingRealRewards} $67`;
            
            let currentVCode = "---";
            if (userWallet) {
                // Verification Code: Simple hash-like string of wallet + pending
                currentVCode = btoa(userWallet.slice(0, 8) + pendingRealRewards).slice(0, 12).toUpperCase();
                if (hashSpan) hashSpan.innerText = `67-V-${currentVCode}`;
            }

            // Claim Button Logic
            if (claimBtn) {
                if (pendingRealRewards > 0) {
                    claimBtn.classList.remove('disabled');
                    claimBtn.onclick = () => {
                        const msg = encodeURIComponent(`Hi Admin! I want to claim my rewards.\n\nWallet: ${userWallet}\nPending: ${pendingRealRewards} $67\nID: 67-V-${currentVCode}`);
                        window.open(`https://t.me/your_telegram_link?text=${msg}`, '_blank');
                    };
                } else {
                    claimBtn.classList.add('disabled');
                    claimBtn.onclick = null;
                }
            }
            
            // ... (countdown logic)
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
