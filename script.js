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

    const TIERS = {
        1: { name: "Laptop Miner", speed: 1.0 },
        2: { name: "ASIC Station", speed: 10.0 },
        3: { name: "Mining Farm", speed: 60.0 },
        4: { name: "Industrial Cluster", speed: 350.0 },
        5: { name: "Planet-Scale Grid", speed: 2300.0 }
    };

    let userTier = 1;

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
            tier: 1,
            lastVisit: Date.now()
        };
        
        accumulatedRewards = savedData.rewards;
        userTier = savedData.tier || 1;
        let pendingRealRewards = savedData.pending || 0;
        
        // UI Tier update
        const tierDisplay = document.getElementById('current-tier');
        if (tierDisplay) tierDisplay.innerText = TIERS[userTier].name;
        updateUpgradeUI();

        // Calculate offline rewards
        const now = Date.now();
        const offlineTime = now - savedData.lastVisit;
        // Global Hash Rate (GHR) simulation: Increases over time (simulated difficulty)
        const ghrFactor = Math.pow(1.000001, (now - 1773339736690) / 1000); // Very slow growth
        const currentRate = (USER_MINING_RATE * TIERS[userTier].speed) / ghrFactor;
        
        const offlineGain = offlineTime * currentRate;
        accumulatedRewards += offlineGain;
        
        miningActive = true;
        updateHashRate();
        startSimulation(pendingRealRewards);
    }

    window.buyUpgrade = (tier, cost) => {
        if (!miningActive || !userWallet) return;
        if (accumulatedRewards < cost) {
            alert("Not enough $67 Simulation Token!");
            return;
        }
        if (tier <= userTier) {
            alert("You already own this hardware or better!");
            return;
        }

        accumulatedRewards -= cost;
        userTier = tier;
        
        const tierDisplay = document.getElementById('current-tier');
        if (tierDisplay) tierDisplay.innerText = TIERS[userTier].name;
        
        updateUpgradeUI();
        updateHashRate();
        
        // Save immediately
        saveState(pendingGlobalRewards); // pendingGlobalRewards is local to startSimulation, we need global access
    };

    function updateUpgradeUI() {
        document.querySelectorAll('.upgrade-card').forEach(card => {
            const tier = parseInt(card.dataset.tier);
            const cost = parseInt(card.dataset.cost);
            const btn = card.querySelector('.btn-buy');
            
            if (tier <= userTier) {
                btn.innerText = "OWNED";
                btn.classList.add('owned');
                btn.classList.remove('locked');
            } else if (accumulatedRewards < cost) {
                btn.classList.add('locked');
            } else {
                btn.classList.remove('locked', 'owned');
                btn.innerText = "BUY";
            }
        });
    }

    let pendingGlobalRewards = 0; // Move it outside for access
    function saveState(pending) {
        if (!userWallet) return;
        localStorage.setItem(`67_data_${userWallet}`, JSON.stringify({
            rewards: accumulatedRewards,
            pending: pending,
            tier: userTier,
            lastVisit: Date.now()
        }));
    }

    function updateHashRate() {
        // ... (not needed to replace, but startSimulation needs the arg)
    }

    function startSimulation(initialPending) {
        pendingGlobalRewards = initialPending;
        
        setInterval(() => {
            // Maintenance Check: Don't mine if dashboard is hidden
            const dashboard = document.querySelector('.dashboard-mockup');
            if (!dashboard || dashboard.style.display === 'none') {
                miningActive = false;
                return;
            }

            if (!miningActive) return;
            
            const now = Date.now();
            const elapsed = now - lastUpdateTimestamp;
            lastUpdateTimestamp = now;
            
            // Dynamic ROI Logic with GHR
            const launchTimestamp = 1773339736690;
            const hoursSinceLaunch = (now - launchTimestamp) / (1000 * 60 * 60);
            const ghrDifficulty = Math.pow(1.002, hoursSinceLaunch); // 0.2% increase per hour
            
            const currentMiningRate = (USER_MINING_RATE * TIERS[userTier].speed) / ghrDifficulty;
            const gain = elapsed * currentMiningRate;
            accumulatedRewards += gain;

            // --- REWARD RESET LOGIC ---
            if (accumulatedRewards >= 1000) {
                pendingGlobalRewards += 10;
                accumulatedRewards -= 1000;
            }
            
            // Persist
            saveState(pendingGlobalRewards);
            
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
            
            // Update Hash Rate Display with Difficulty
            if (miningActive && hashRateSpan) {
                const noise = Math.sin(now / 5000) * 0.1;
                const baseHash = (4.2 * TIERS[userTier].speed) / ghrDifficulty;
                const currentDisplayHash = baseHash + (noise * baseHash);
                
                // Scale display
                if (currentDisplayHash > 1000) {
                    hashRateSpan.innerText = `${(currentDisplayHash / 1000).toFixed(2)} EH/s`;
                } else {
                    hashRateSpan.innerText = `${currentDisplayHash.toFixed(2)} PH/s`;
                }
            }
            
            // Update UI Elements
            updateUpgradeUI();

            const milestoneStatus = document.getElementById('milestone-status');
            const pendingSpan = document.getElementById('pending-real-rewards');
            const hashSpan = document.getElementById('verification-hash');
            const claimBtn = document.getElementById('claim-rewards');

            if (milestoneStatus) {
                const progress = ((accumulatedRewards / 1000) * 100).toFixed(1);
                milestoneStatus.innerText = `${progress}% to next tier`;
            }
            if (pendingSpan) pendingSpan.innerText = `${pendingGlobalRewards} $67`;
            
            let currentVCode = "---";
            if (userWallet) {
                currentVCode = btoa(userWallet.slice(0, 8) + pendingGlobalRewards).slice(0, 12).toUpperCase();
                if (hashSpan) hashSpan.innerText = `67-V-${currentVCode}`;
            }

            // Claim Logic
            if (claimBtn) {
                if (pendingGlobalRewards > 0) {
                    claimBtn.classList.remove('disabled');
                    claimBtn.onclick = () => {
                        const msg = encodeURIComponent(`Hi Admin! I want to claim my rewards.\n\nWallet: ${userWallet}\nPending: ${pendingGlobalRewards} $67\nID: 67-V-${currentVCode}`);
                        window.open(`https://t.me/your_telegram_link?text=${msg}`, '_blank');
                    };
                } else {
                    claimBtn.classList.add('disabled');
                    claimBtn.onclick = null;
                }
            }
            
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
