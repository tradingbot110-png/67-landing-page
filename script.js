document.addEventListener('DOMContentLoaded', () => {
    // GameFi Protocol Configuration
    let liveTokenPriceUsd = 0.00015; // Fallback starting price
    
    // Fetch Live Price from DexScreener
    async function fetchLivePrice() {
        try {
            const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/GCDcDJEW25W4sNUdzC1YNr9ojbi1Cwof5AbVd2qTxA7A');
            const data = await response.json();
            if (data && data.pairs && data.pairs.length > 0) {
                // Find the SOL pair
                const solPair = data.pairs.find(p => p.quoteToken.symbol === 'SOL' || p.quoteToken.address === 'So11111111111111111111111111111111111111112');
                if (solPair && solPair.priceUsd) {
                    liveTokenPriceUsd = parseFloat(solPair.priceUsd);
                } else if (data.pairs[0].priceUsd) {
                    liveTokenPriceUsd = parseFloat(data.pairs[0].priceUsd);
                }
            }
        } catch (error) {
            console.error("Failed to fetch live $67 price:", error);
        }
    }
    
    // Initial fetch and interval
    fetchLivePrice();
    setInterval(fetchLivePrice, 60000); // Update every 60 seconds

    
    // UI Elements
    const connectBtn = document.getElementById('btn-connect-phantom');
    const disconnectBtn = document.getElementById('disconnect-wallet');
    const paywallBox = document.getElementById('paywall-box');
    const dashboard = document.getElementById('grid-dashboard');
    const walletDisplayStr = document.querySelector('#wallet-address span');
    
    const liveRewardsSpan = document.getElementById('live-rewards');
    const hashRateSpan = document.getElementById('hash-rate');
    const claimStatus = document.getElementById('claim-status');
    const claimBtn = document.getElementById('claim-rewards');
    
    let userWallet = null;
    let gridActive = false;
    let accumulatedRewards = 0;
    let mockWalletBalance = 600000000;
    let lastUpdateTimestamp = Date.now();

    // Hardware Tiers Math Model (BTC-Style ASIC Scaling)
    const TIERS = {
        1: { name: "SixtySevenMiner S67", pegSOL: 0.5, rawHashes: 100000 }, // 100.0 kH/s
        2: { name: "SixtySevenMiner M67", pegSOL: 5.0, rawHashes: 1100000 }, // 1.1 MH/s
        3: { name: "SixtySevenMiner L67", pegSOL: 20.0, rawHashes: 4600000 }, // 4.6 MH/s
        4: { name: "SixtySevenMiner XL67", pegSOL: 100.0, rawHashes: 25000000 }, // 25.0 MH/s
        5: { name: "SixtySevenMiner XXL67", pegSOL: 500.0, rawHashes: 135000000 }, // 135.0 MH/s
        6: { name: "SixtySevenMiner XXXL67", pegSOL: 1000.0, rawHashes: 300000000 } // 300.0 MH/s
    };
    
    let currentTierCosts67 = { 1: 50000, 2: 500000, 3: 2000000, 4: 10000000, 5: 50000000, 6: 100000000 };

    let userMiners = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    let currentGlobalHashRate = 6300000; // Base value before user influence
    
    function getTotalMiners() {
        return Object.values(userMiners).reduce((a, b) => a + b, 0);
    }

    // Mock Leaderboard Base Data (10 Members, 15 Miners total: ~5 M67 and 10 S67s)
    let mockLeaderboard = [
        { address: "uqfxYB...", hashes: 1200000 }, // 1 M67 + 1 S67 (1.2 MH/s)
        { address: "9kLpM2...", hashes: 1200000 }, // 1 M67 + 1 S67
        { address: "4zAqP9...", hashes: 1100000 }, // 1 M67
        { address: "x7TmN1...", hashes: 1100000 }, // 1 M67
        { address: "pQ9vL5...", hashes: 1100000 }, // 1 M67
        { address: "1kRzM8...", hashes:  200000 }, // 2 S67
        { address: "wY2bP9...", hashes:  100000 }, // 1 S67
        { address: "6nDvT1...", hashes:  100000 }, // 1 S67
        { address: "k3LmP4...", hashes:  100000 }, // 1 S67
        { address: "y9RjK2...", hashes:  100000 }  // 1 S67
    ];

    function getUserRawHashes() {
        let totalRawHashes = 0;
        for (let t = 1; t <= 6; t++) {
            totalRawHashes += userMiners[t] * TIERS[t].rawHashes;
        }
        return totalRawHashes;
    }

    function getUserBurned() {
        let totalBurned = 0;
        for (let t = 1; t <= 6; t++) {
            totalBurned += userMiners[t] * currentTierCosts67[t];
        }
        return totalBurned;
    }

    function updateLeaderboardUI() {
        let userHashes = getUserRawHashes();
        let fullBoard = [...mockLeaderboard];
        
        if (userHashes > 0 && userWallet) {
            fullBoard.push({
                address: userWallet.substring(0,4) + '...' + userWallet.substring(userWallet.length-4),
                hashes: userHashes,
                isUser: true
            });
        }
        
        fullBoard.sort((a,b) => b.hashes - a.hashes);
        
        const rankDisplay = document.getElementById('user-rank-display');
        if (rankDisplay) {
            if (userHashes > 0 && userWallet) {
                let userRank = fullBoard.findIndex(u => u.isUser) + 1;
                rankDisplay.innerText = `#${userRank}`;
                rankDisplay.style.color = "#FFD700";
            } else {
                rankDisplay.innerText = "Unranked";
                rankDisplay.style.color = "rgba(255,255,255,0.5)";
            }
        }
        
        const lbList = document.getElementById('leaderboard-list');
        if (lbList) {
            lbList.innerHTML = '';
            fullBoard.forEach((u, index) => {
                const rank = index + 1;
                let color = "rgba(255,255,255,0.8)";
                if (rank === 1) color = "#FFD700";
                else if (rank === 2) color = "#C0C0C0";
                else if (rank === 3) color = "#CD7F32";
                if (u.isUser) color = "#00ff88"; 
                
                const tr = document.createElement('li');
                tr.style.display = "flex";
                tr.style.justifyContent = "space-between";
                tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                tr.style.padding = "8px 0";
                
                if (u.isUser) {
                    tr.style.background = "rgba(0, 255, 136, 0.1)";
                    tr.style.padding = "8px 5px";
                    tr.style.borderRadius = "4px";
                }

                if (typeof formatHashRate === 'function') {
                    tr.innerHTML = `<span style="color: ${color};">${rank}. ${u.address} ${u.isUser ? '<b>(YOU)</b>' : ''}</span><span>${formatHashRate(u.hashes)}</span>`;
                } else {
                    tr.innerHTML = `<span style="color: ${color};">${rank}. ${u.address} ${u.isUser ? '<b>(YOU)</b>' : ''}</span><span>${(u.hashes / 1000000).toFixed(2)} MH/s</span>`;
                }
                lbList.appendChild(tr);
            });
        }
        
        const totalNetHash = fullBoard.reduce((sum, u) => sum + u.hashes, 0);
        currentGlobalHashRate = totalNetHash; // Update global state
        
        const statNetHash = document.getElementById('stat-hashrate');
        const dashNetHash = document.getElementById('dashboard-global-hashrate');
        
        let formattedHash;
        if (typeof formatHashRate === 'function') {
            formattedHash = formatHashRate(totalNetHash);
        } else {
            formattedHash = (totalNetHash / 1000000).toFixed(1) + " MH/s";
        }
        
        if (statNetHash) statNetHash.innerText = formattedHash;
        if (dashNetHash) dashNetHash.innerText = formattedHash;
        
        const statMiners = document.getElementById('stat-miners');
        if (statMiners) {
            statMiners.innerText = (15 + fullBoard.length - mockLeaderboard.length + (userHashes > 0 ? 1 : 0)).toLocaleString(); 
        }
        
        // Burn Stats UI
        const globalBurnedEl = document.getElementById('dashboard-global-burned');
        const userBurnedEl = document.getElementById('dashboard-user-burned');
        
        let userBurnedAmount = getUserBurned();
        if (userBurnedEl) {
            userBurnedEl.innerText = `(You: ${userBurnedAmount > 0 ? formatNumberShort(userBurnedAmount) : '0'})`;
        }
        if (globalBurnedEl) {
            // A pseudo-realistic global burn calculated largely from network hashes + user input
            let baseGlobalBurned = 425000000; // 425M base mock
            let totalGlobalBurnDisplay = baseGlobalBurned + userBurnedAmount;
            globalBurnedEl.innerText = totalGlobalBurnDisplay.toLocaleString();
        }
    }
    
    function formatNumberShort(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toLocaleString();
    }

    // Fetch Dynamic Entry Price pegged to SOL for all Tiers
    async function fetchDynamicEntryFee() {
        try {
            // Live fetch logic for Dynamic "God Candle" Pricing (Option B)
            const res = await fetch('https://api.dexscreener.com/latest/dex/tokens/GCDcDJEW25W4sNUdzC1YNr9ojbi1Cwof5AbVd2qTxA7A');
            const data = await res.json();
            if (data.pairs && data.pairs.length > 0) {
                const priceNative = parseFloat(data.pairs[0].priceNative); 
                if (priceNative > 0) {
                    for(let i=1; i<=6; i++) {
                        currentTierCosts67[i] = Math.ceil(TIERS[i].pegSOL / priceNative);
                    }
                }
            }
        } catch (err) {
            console.log("Using static tier costs for beta:", currentTierCosts67[1]);
        }
        
        // Initial build of leaderboard to populate stats
        updateLeaderboardUI();
        
        // Update Paywall UI Elements
        const feeElement = document.getElementById('dynamic-entry-fee');
        const linkElement = document.getElementById('dynamic-buy-link');
        
        if (feeElement) feeElement.innerText = `${currentTierCosts67[1].toLocaleString()} $67 Tokens (~${TIERS[1].pegSOL} SOL)`;
        if (linkElement) linkElement.innerText = `Don't have ${currentTierCosts67[1].toLocaleString()}? Get $67 on Jupiter`;
        
        // Update Dashboard Upgrade Costs for display
        updateUpgradeUI(); 
    }

    // Hash rate formatter (1000x standard)
    function formatHashRate(rawHashes) {
        if (rawHashes === 0) return "0.00 H/s";
        const units = ['H/s', 'kH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s', 'ZH/s'];
        const k = 1000;
        const i = Math.floor(Math.log(rawHashes) / Math.log(k));
        const value = rawHashes / Math.pow(k, i);
        return value.toFixed(2) + ' ' + units[i];
    }

    // Init Tasks
    fetchDynamicEntryFee();
    
    // Check localStorage for existing session
    const savedWallet = localStorage.getItem('67_grid_wallet');
    if (savedWallet) {
        initSession(savedWallet);
    }

    // Wallet Connection Logic (with mocked balance check for MVP)
    async function connectWallet() {
        if (window.solana && window.solana.isPhantom) {
            try {
                // UI feedback
                connectBtn.innerText = "Verifying Certificate...";
                connectBtn.style.opacity = "0.7";
                
                const response = await window.solana.connect();
                const address = response.publicKey.toString();
                
                // Mock RPC Balance Check (Delay for dramatic effect)
                setTimeout(() => {
                    initSession(address);
                }, 1500);

            } catch (err) {
                console.error("Wallet connection failed:", err);
                connectBtn.innerText = "Connection Failed";
                setTimeout(() => { connectBtn.innerText = "Connect Phantom"; connectBtn.style.opacity = "1"; }, 2000);
            }
        } else {
            alert("Phantom Wallet not found. Please install the browser extension to enter The Grid.");
            window.open('https://phantom.app/', '_blank');
        }
    }

    function initSession(address) {
        userWallet = address;
        localStorage.setItem('67_grid_wallet', userWallet);
        
        // UI Updates - Switch from Paywall to Dashboard
        paywallBox.style.display = 'none';
        dashboard.style.display = 'block';
        
        walletDisplayStr.innerText = `${address.slice(0, 4)}...${address.slice(-4)}`;
        
        // Load persistent state
        const savedData = JSON.parse(localStorage.getItem(`67_grid_data_${address}`)) || {
            rewards: 0,
            miners: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
            walletBalance: 600000000,
            lastVisit: Date.now()
        };
        
        accumulatedRewards = parseFloat(savedData.rewards) || 0;
        userMiners = savedData.miners || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        // Cleanup legacy data
        if (savedData.tier !== undefined && savedData.tier > 0) {
            userMiners[savedData.tier] = 1;
        }
        mockWalletBalance = parseFloat(savedData.walletBalance) || 600000000;
        
        // UI Tier update
        const tierDisplay = document.getElementById('current-tier');
        if (tierDisplay) {
            const totalCount = getTotalMiners();
            if (totalCount === 0) {
                tierDisplay.innerText = "0 Miners";
                tierDisplay.style.color = "#ff3c3c";
            } else {
                tierDisplay.innerText = `${totalCount} Miners Active`;
                tierDisplay.style.color = "#00ff88"; // standard highlight
            }
        }
        
        updateUpgradeUI();

        // Calculate offline rewards (Simulate node running while user was away)
        const now = Date.now();
        const offlineSecs = (now - savedData.lastVisit) / 1000;
        
        // Global Hash Rate (GHR) simulation: Difficulty increases slowly
        const launchTimestamp = 1773339736690;
        const hoursSinceLaunch = (now - launchTimestamp) / (1000 * 60 * 60);
        const ghrDifficulty = Math.max(1, Math.pow(1.005, hoursSinceLaunch)); 
        
        let totalRawHashes = 0;
        for (let t = 1; t <= 6; t++) {
            totalRawHashes += userMiners[t] * TIERS[t].rawHashes;
        }
        
        if (totalRawHashes > 0) {
            const BASE_REWARD_PER_SEC = 0.001585; 
            const userHashFactor = totalRawHashes / 100000;
            const currentRatePerSec = (BASE_REWARD_PER_SEC * userHashFactor) / ghrDifficulty;
            
            const offlineGain = Math.max(0, offlineSecs * currentRatePerSec);
            
            // Cap offline gain to prevent absurd numbers if unvisited for months without upgrades
            const offlineGainCapped = Math.min(offlineGain, currentRatePerSec * 86400 * 14); // Max 14 days offline gain
            accumulatedRewards += offlineGainCapped;
        }
        
        gridActive = true;
        updateLeaderboardUI();
        startSimulation();
    }

    function disconnect() {
        gridActive = false;
        userWallet = null;
        localStorage.removeItem('67_grid_wallet');
        
        // Reset UI
        dashboard.style.display = 'none';
        paywallBox.style.display = 'block';
        connectBtn.innerText = "Connect Phantom";
        connectBtn.style.opacity = "1";
    }

    window.buyUpgrade = (tier) => {
        if (!gridActive || !userWallet) return;
        
        const cost = currentTierCosts67[tier];
        const totalAvailableBalance = accumulatedRewards + mockWalletBalance;
        
        if (totalAvailableBalance < cost) {
            alert(`Insufficient Funds! You need ${cost.toLocaleString()} $67.\nYou only have ${Math.floor(totalAvailableBalance).toLocaleString()} total (Wallet + Pending).`);
            return;
        }

        if (!confirm(`Deploy ${TIERS[tier].name}?\n\nThis will BURN ${cost.toLocaleString()} $67 from your balance to activate this Miner.\nProceed?`)) {
            return;
        }

        // Deduct cost
        let remainingCost = cost;
        if (accumulatedRewards >= remainingCost) {
            accumulatedRewards -= remainingCost;
        } else {
            remainingCost -= accumulatedRewards;
            accumulatedRewards = 0;
            mockWalletBalance -= remainingCost;
        }

        userMiners[tier]++;
        alert(`Solana Transaction Sent!\nSuccessfully BURNED ${cost.toLocaleString()} $67 from your Wallet/Yields to activate 1x ${TIERS[tier].name}!`);
        
        const tierDisplay = document.getElementById('current-tier');
        if (tierDisplay) {
             const totalCount = getTotalMiners();
             tierDisplay.innerText = `${totalCount} Miners Active`;
             tierDisplay.style.color = "#00ff88"; 
        }
        
        updateLeaderboardUI();
        updateUpgradeUI();
        saveState();
        
        // Visual feedback
        const el = document.querySelector(`[data-tier="${tier}"]`);
        el.style.boxShadow = "0 0 20px #00ff88";
        setTimeout(() => { el.style.boxShadow = "none"; }, 1000);
    };

    function updateUpgradeUI() {
        const totalAvailableBalance = accumulatedRewards + mockWalletBalance;
        
        document.querySelectorAll('.upgrade-card').forEach(card => {
            const tier = parseInt(card.dataset.tier);
            const cost = currentTierCosts67[tier] || 500000;
            const btn = card.querySelector('.btn-buy');
            const costSpan = card.querySelector('.up-cost');
            const ownedSpan = card.querySelector('.up-owned');
            
            if (costSpan && currentTierCosts67[tier]) {
                const cost67 = currentTierCosts67[tier];
                const usdValue = (cost67 * liveTokenPriceUsd).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                costSpan.innerHTML = `Cost: ${cost67.toLocaleString()} $67 <br><span style="font-size: 0.65rem; color: rgba(255,255,255,0.4);">≈ $${usdValue} USD</span>`;
            }
            if (ownedSpan) {
                ownedSpan.innerText = `Owned: ${userMiners[tier]}`;
            }
            
            if (totalAvailableBalance < cost) {
                btn.classList.add('locked');
                btn.style.background = "rgba(255,255,255,0.05)";
                btn.style.color = "gray";
                btn.style.borderColor = "transparent";
            } else {
                btn.classList.remove('locked');
                btn.style.background = "rgba(123, 44, 191, 0.2)";
                btn.style.color = "#fff";
                btn.style.borderColor = "#7B2CBF";
            }
            
            const actionWords = {1: "Deploy", 2: "Deploy", 3: "Deploy", 4: "Deploy", 5: "Deploy", 6: "God Mode"};
            btn.innerText = actionWords[tier] + " (Burn $67)";
        });
    }

    function saveState() {
        if (!userWallet) return;
        localStorage.setItem(`67_grid_data_${userWallet}`, JSON.stringify({
            rewards: accumulatedRewards,
            miners: userMiners,
            walletBalance: mockWalletBalance,
            lastVisit: Date.now()
        }));
    }

    function startSimulation() {
        setInterval(() => {
            if (!gridActive) return;
            
            const now = Date.now();
            const elapsedMs = now - lastUpdateTimestamp;
            lastUpdateTimestamp = now;
            
            // Re-calculate difficulty dynamically based on Math Model
            const launchTimestamp = 1773339736690;
            const hoursSinceLaunch = (now - launchTimestamp) / (1000 * 60 * 60);
            const ghrDifficulty = Math.max(1, Math.pow(1.005, hoursSinceLaunch)); 
            
            // Year 1 Pool = 200,000,000 tokens => ~547,945 tokens per day => ~6.34 tokens per second globally
            const GLOBAL_REWARD_PER_SEC = 6.34; 
            
            let totalRawHashes = 0;
            for (let t = 1; t <= 6; t++) {
                totalRawHashes += userMiners[t] * TIERS[t].rawHashes;
            }
            
            let gain = 0;
            if (totalRawHashes > 0) {
                // Dynamic difficulty: User's proportion of the total Global Network Hashrate
                let userShare = totalRawHashes / currentGlobalHashRate;
                if (userShare > 1) userShare = 1; // Sanity check

                const currentRatePerSec = (GLOBAL_REWARD_PER_SEC * userShare) / ghrDifficulty;
                gain = (elapsedMs / 1000) * currentRatePerSec;
            }
            accumulatedRewards += gain;

            // Save roughly every 5 seconds (50 ticks) to not spam localStorage
            if (Math.random() < 0.02) saveState();
            
            // --- Update UI ---
            if (liveRewardsSpan) {
                liveRewardsSpan.innerText = accumulatedRewards.toFixed(6);
            }
            const liveRewardsUSDSpan = document.getElementById('live-rewards-usd');
            if (liveRewardsUSDSpan) {
                liveRewardsUSDSpan.innerText = `≈ $${(accumulatedRewards * liveTokenPriceUsd).toFixed(8)} USD`;
            }
            
            const walletDisplay = document.getElementById('wallet-balance-display');
            if (walletDisplay) {
                walletDisplay.innerText = `Wallet Demo: ${Math.floor(mockWalletBalance).toLocaleString()} $67`;
            }
            
            // Update Hash Rate Display with Noise & Strict 1000x formatting
            if (hashRateSpan) {
                if (totalRawHashes === 0) {
                    hashRateSpan.innerText = "0.00 H/s";
                } else {
                    const noise = (Math.random() * 0.05) - 0.025; // +/- 2.5% jitter
                    const baseRawHashes = totalRawHashes / ghrDifficulty;
                    const currentDisplayHash = baseRawHashes + (noise * baseRawHashes);
                    hashRateSpan.innerText = formatHashRate(currentDisplayHash);
                }
            }
            
            // Real-time button states (Cost unlock check)
            updateUpgradeUI();
            
            
            // Claim Checking (No minimum, but enable button if reward > 0)
            if (claimBtn) {
                if (accumulatedRewards > 10) {
                    claimBtn.style.cursor = "pointer";
                    claimBtn.style.opacity = "1";
                    claimBtn.onclick = () => {
                        alert(`Strato-Server Connection Initiated.\nPending Payout: ${accumulatedRewards.toFixed(2)} $67 will be sent to ${userWallet.slice(0, 4)}...${userWallet.slice(-4)}\n\n(This triggers the actual Web3 PHP backend transaction)`);
                        accumulatedRewards = 0; // Optimistic update
                    };
                } else {
                    claimBtn.style.cursor = "not-allowed";
                    claimBtn.style.opacity = "0.5";
                    claimBtn.onclick = null;
                }
            }

        }, 100);
    }

    // Attach Listeners
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnect);
    }
    
    const resetBtn = document.getElementById('btn-reset-demo');
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            location.reload();
        });
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
