const BINANCE_WS =
    "wss://fstream.binance.com/ws/btcusdt@kline_1m";

const BINANCE_PRICE_API =
    "https://fapi.binance.com/fapi/v1/ticker/price?symbol=BTCUSDT";

let binanceSocket = null;
let messageCount = 0;
let reconnectAttempts = 0;

function setPrice(price) {
    const priceElement =
        document.querySelector(".price-value");

    if (!priceElement) return;

    priceElement.textContent =
        Number(price).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
}

function setStatus(message, connected = true) {
    const statusElement =
        document.querySelector(".status");

    if (!statusElement) return;

    statusElement.innerHTML = connected
        ? `<span class="status-dot"></span>${message}`
        : `<span class="status-dot" style="background:#ff6673"></span>${message}`;
}

function updateDiagnosticPanel(data) {

    const panel =
        document.querySelector("#live-diagnostics");

    if (!panel) return;

    panel.innerHTML = `
        <div class="analysis-row">
            <span>WebSocket</span>
            <strong class="check">CONNECTED</strong>
        </div>

        <div class="analysis-row">
            <span>Messages Received</span>
            <strong>${messageCount}</strong>
        </div>

        <div class="analysis-row">
            <span>Last Update</span>
            <strong>${new Date().toLocaleTimeString()}</strong>
        </div>

        <div class="analysis-row">
            <span>Stream</span>
            <strong>BTCUSDT 1M</strong>
        </div>

        <div class="analysis-row">
            <span>Candle Status</span>
            <strong class="${data.closed ? "check" : "waiting"}">
                ${data.closed ? "CLOSED" : "FORMING"}
            </strong>
        </div>

        <div class="analysis-row">
            <span>Open</span>
            <strong>${data.open.toLocaleString()}</strong>
        </div>

        <div class="analysis-row">
            <span>High</span>
            <strong>${data.high.toLocaleString()}</strong>
        </div>

        <div class="analysis-row">
            <span>Low</span>
            <strong>${data.low.toLocaleString()}</strong>
        </div>

        <div class="analysis-row">
            <span>Volume</span>
            <strong>${data.volume.toLocaleString()}</strong>
        </div>
    `;
}

async function getInitialPrice() {

    try {

        const response =
            await fetch(BINANCE_PRICE_API, {
                cache: "no-store"
            });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data =
            await response.json();

        if (data.price) {
            setPrice(data.price);
        }

    } catch (error) {

        console.error(
            "Initial Binance price failed:",
            error
        );

        setStatus("Price API Error", false);
    }
}

function connectToBinance() {

    console.log(
        "Connecting to Binance Futures..."
    );

    setStatus(
        "Connecting...",
        false
    );

    binanceSocket =
        new WebSocket(BINANCE_WS);

    binanceSocket.onopen = () => {

        console.log(
            "Binance WebSocket connected."
        );

        reconnectAttempts = 0;

        setStatus(
            "Binance Live",
            true
        );
    };

    binanceSocket.onmessage = (event) => {

        try {

            const data =
                JSON.parse(event.data);

            if (!data.k) return;

            const candle =
                data.k;

            const candleData = {

                symbol: candle.s,

                open:
                    Number(candle.o),

                high:
                    Number(candle.h),

                low:
                    Number(candle.l),

                close:
                    Number(candle.c),

                volume:
                    Number(candle.v),

                closed:
                    candle.x,

                timestamp:
                    candle.t
            };

            messageCount++;

            setPrice(
                candleData.close
            );

            updateDiagnosticPanel(
                candleData
            );

        } catch (error) {

            console.error(
                "Could not process Binance message:",
                error
            );
        }
    };

    binanceSocket.onerror = (error) => {

        console.error(
            "Binance WebSocket error:",
            error
        );

        setStatus(
            "WebSocket Error",
            false
        );
    };

    binanceSocket.onclose = () => {

        console.log(
            "Binance WebSocket disconnected."
        );

        setStatus(
            "Reconnecting...",
            false
        );

        reconnectAttempts++;

        const delay =
            Math.min(
                3000 * reconnectAttempts,
                15000
            );

        setTimeout(
            connectToBinance,
            delay
        );
    };
}

getInitialPrice();

connectToBinance();
