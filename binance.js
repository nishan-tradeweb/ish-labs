const ANALYSIS_API =
    "https://ish-labs-backend.onrender.com/api/analysis";

const BINANCE_PRICE_API =
    "https://fapi.binance.com/fapi/v1/ticker/price?symbol=BTCUSDT";

let lastPrice = null;
let latestAnalysis = null;
let lastAlertedTrade = null;
let signalMonitoringReady = false;
let audioContext = null;
let audioUnlocked = false;

function unlockAlertSound() {

    if (audioUnlocked) return;

    try {

        audioContext =
            new (window.AudioContext ||
                window.webkitAudioContext)();

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        audioUnlocked = true;

        console.log(
            "ISH LABS ALERT SOUND UNLOCKED"
        );

    } catch (error) {

        console.error(
            "Alert sound unlock failed:",
            error
        );

    }
}

document.addEventListener(
    "click",
    unlockAlertSound,
    { once: true }
);


document.addEventListener(
    "touchstart",
    unlockAlertSound,
    { once: true }
);

function playTradeAlertSound() {

    if (!audioContext || !audioUnlocked) {
        console.log(
            "Alert sound not ready — user interaction required."
        );
        return;
    }

    try {

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.type = "sine";

        oscillator.frequency.setValueAtTime(
            880,
            audioContext.currentTime
        );

        oscillator.frequency.setValueAtTime(
            1174,
            audioContext.currentTime + 0.15
        );

        gain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.25,
            audioContext.currentTime + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.45
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 0.45
        );

        console.log(
            "ISH LABS TRADE ALERT SOUND"
        );

    } catch (error) {

        console.error(
            "Trade alert sound failed:",
            error
        );

    }
}

async function checkTradingSignal() {

    try {

        const response = await fetch(
            ANALYSIS_API + "?_=" + Date.now(),
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                "Analysis API HTTP " + response.status
            );
        }

        const analysis =
            await response.json();

        latestAnalysis = analysis;

        console.log(
            "ISH LABS ANALYSIS:",
            analysis
        );
        if (
            analysis.trade_levels?.status === "VALID"
        ) {

            const tradeId =
                JSON.stringify(analysis.trade_levels);

            if (!signalMonitoringReady) {

                lastAlertedTrade = tradeId;
                signalMonitoringReady = true;

                console.log(
                    "ISH LABS SIGNAL MONITORING READY"
                );

            } else if (lastAlertedTrade !== tradeId) {

                lastAlertedTrade = tradeId;

                console.log(
                    "NEW VALID TRADE:",
                    analysis.trade_levels
                );

                playTradeAlertSound();

                showTradeAlert(analysis);
            }
        }

    } catch (error) {

        console.error(
            "ISH LABS analysis update failed:",
            error
        );
    }
}

async function updateBTCPrice() {
    try {
        const response = await fetch(
            BINANCE_PRICE_API + "&_=" + Date.now(),
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        const price = Number(data.price);

        if (!Number.isFinite(price)) {
            throw new Error("Invalid BTCUSDT price");
        }

        lastPrice = price;

        const priceElement =
            document.querySelector(".price-value");

        if (priceElement) {
            priceElement.textContent =
                price.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
        }

        const changeElement =
            document.querySelector(".price-change");

        if (changeElement) {
            changeElement.textContent =
                "LIVE • Binance Futures";
        }

        const statusElement =
            document.querySelector(".status");

        if (statusElement) {
            statusElement.innerHTML =
                '<span class="status-dot"></span> Binance Live';
        }

        updateLivePanel(price);

    } catch (error) {

        console.error(
            "BTCUSDT price update failed:",
            error
        );

        const statusElement =
            document.querySelector(".status");

        if (statusElement) {
            statusElement.innerHTML =
                '<span class="status-dot" style="background:#ff6673"></span> Data Error';
        }
    }
}

function updateLivePanel(price) {

    const panel =
        document.querySelector("#live-diagnostics");

    if (!panel) return;

    panel.innerHTML = `
        <div class="analysis-row">
            <span>Data Source</span>
            <strong class="check">BINANCE</strong>
        </div>

        <div class="analysis-row">
            <span>Market</span>
            <strong>BTCUSDT PERPETUAL</strong>
        </div>

        <div class="analysis-row">
            <span>Price</span>
            <strong>${price.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}</strong>
        </div>

        <div class="analysis-row">
            <span>Last Update</span>
            <strong>${new Date().toLocaleTimeString()}</strong>
        </div>

        <div class="analysis-row">
            <span>Update Interval</span>
            <strong>2 SECONDS</strong>
        </div>

        <div class="analysis-row">
            <span>Connection</span>
            <strong class="check">LIVE</strong>
        </div>

        ${
            latestAnalysis
                ? `
                    <div class="analysis-row">
                        <span>ISH Labs API</span>
                        <strong class="check">CONNECTED</strong>
                    </div>

                    <div class="analysis-row">
                        <span>Signal</span>
                        <strong>
                            ${latestAnalysis.signal?.signal ?? "N/A"}
                        </strong>
                    </div>

                    <div class="analysis-row">
                        <span>Decision</span>
                        <strong>
                            ${latestAnalysis.final_decision?.decision ?? "N/A"}
                        </strong>
                    </div>
                `
                : ""
        }
    `;
}
    
updateBTCPrice();

setInterval(
    updateBTCPrice,
    2000
);

checkTradingSignal();

setInterval(
    checkTradingSignal,
    5000
);

function showTradeAlert(analysis) {

    const trade =
        analysis.trade_levels;

    const decision =
        analysis.final_decision;

    const existing =
        document.querySelector("#ish-trade-alert");

    if (existing) {
        existing.remove();
    }

    const alert =
        document.createElement("div");

    alert.id = "ish-trade-alert";

    alert.innerHTML = `
        <div class="ish-alert-box">

            <div class="ish-alert-title">
                🚨 ISH LABS SIGNAL
            </div>

            <div class="ish-alert-signal">
                ${decision.decision}
            </div>

            <div class="ish-alert-row">
                <span>Entry</span>
                <strong>${trade.entry_price}</strong>
            </div>

            <div class="ish-alert-row">
                <span>Stop Loss</span>
                <strong>${trade.stop_loss}</strong>
            </div>

            <div class="ish-alert-row">
                <span>Take Profit</span>
                <strong>${trade.take_profit}</strong>
            </div>

            <div class="ish-alert-row">
                <span>Risk / Reward</span>
                <strong>1:${trade.risk_reward}</strong>
            </div>

            <div class="ish-alert-row">
                <span>Confidence</span>
                <strong>${decision.confidence}%</strong>
            </div>

            <button
                id="ish-alert-close"
                type="button"
            >
                CLOSE
            </button>

        </div>
    `;

    document.body.appendChild(alert);

    document
        .querySelector("#ish-alert-close")
        .addEventListener(
            "click",
            () => alert.remove()
        );
}
