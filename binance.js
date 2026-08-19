const ANALYSIS_API =
    "https://ish-labs-backend.onrender.com/api/analysis";

const BINANCE_PRICE_API =
    "https://fapi.binance.com/fapi/v1/ticker/price?symbol=BTCUSDT";

let lastPrice = null;
let latestAnalysis = null;

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

        const testElement =
            document.querySelector("#live-diagnostics");

        if (testElement) {

            testElement.innerHTML += `
                <div class="analysis-row">
                    <span>ISH Labs API</span>
                    <strong class="check">
                        CONNECTED
                    </strong>
                </div>

                <div class="analysis-row">
                    <span>Signal</span>
                    <strong>
                        ${analysis.signal?.signal ?? "N/A"}
                    </strong>
                </div>

                <div class="analysis-row">
                    <span>Decision</span>
                    <strong>
                        ${analysis.final_decision?.decision ?? "N/A"}
                    </strong>
                </div>
            `;
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
