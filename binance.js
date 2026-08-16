const BINANCE_WS =
    "wss://fstream.binance.com/ws/btcusdt@kline_1m";

let binanceSocket = null;

function connectToBinance() {
    console.log("Connecting to Binance...");

    binanceSocket = new WebSocket(BINANCE_WS);

    binanceSocket.onopen = () => {
        console.log("Connected to Binance Futures.");
        updateConnectionStatus(true);
    };

    binanceSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (!data.k) return;

        const candle = data.k;

        const symbol = candle.s;
        const open = Number(candle.o);
        const high = Number(candle.h);
        const low = Number(candle.l);
        const close = Number(candle.c);
        const volume = Number(candle.v);
        const closed = candle.x;

        updateMarketData({
            symbol,
            open,
            high,
            low,
            close,
            volume,
            closed
        });
    };

    binanceSocket.onerror = (error) => {
        console.error("Binance WebSocket error:", error);
        updateConnectionStatus(false);
    };

    binanceSocket.onclose = () => {
        console.log("Binance connection closed.");
        updateConnectionStatus(false);

        setTimeout(() => {
            connectToBinance();
        }, 3000);
    };
}

function updateMarketData(data) {
    console.log("BTCUSDT:", data);

    const priceElement =
        document.querySelector(".price-value");

    if (priceElement) {
        priceElement.textContent =
            data.close.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
    }
}

function updateConnectionStatus(connected) {
    const statusText =
        document.querySelector(".status");

    if (!statusText) return;

    statusText.innerHTML = connected
        ? '<span class="status-dot"></span> Binance Live'
        : '<span class="status-dot" style="background:#ff6673"></span> Reconnecting...';
}

connectToBinance();
