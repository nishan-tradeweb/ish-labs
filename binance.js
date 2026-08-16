const BINANCE_WS =
    "wss://fstream.binance.com/ws/btcusdt@kline_1m";

const BINANCE_PRICE_API =
    "https://fapi.binance.com/fapi/v1/ticker/price?symbol=BTCUSDT";

let binanceSocket = null;

function setPrice(price) {
    const priceElement = document.querySelector(".price-value");

    if (!priceElement) return;

    priceElement.textContent = Number(price).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function setStatus(message, connected = true) {
    const statusElement = document.querySelector(".status");

    if (!statusElement) return;

    statusElement.innerHTML = connected
        ? `<span class="status-dot"></span>${message}`
        : `<span class="status-dot" style="background:#ff6673"></span>${message}`;
}

async function getInitialPrice() {
    try {
        const response = await fetch(BINANCE_PRICE_API, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.price) {
            setPrice(data.price);
            console.log("Initial BTCUSDT price:", data.price);
        }

    } catch (error) {
        console.error("Initial Binance price failed:", error);
        setStatus("Price API Error", false);
    }
}

function connectToBinance() {

    console.log("Connecting to Binance Futures...");

    setStatus("Connecting...", false);

    binanceSocket = new WebSocket(BINANCE_WS);

    binanceSocket.onopen = () => {

        console.log("Binance WebSocket connected.");

        setStatus("Binance Live", true);

        getInitialPrice();
    };

    binanceSocket.onmessage = (event) => {

        try {

            const data = JSON.parse(event.data);

            console.log("Binance message:", data);

            if (!data.k) return;

            const candle = data.k;

            const candleData = {
                symbol: candle.s,
                open: Number(candle.o),
                high: Number(candle.h),
                low: Number(candle.l),
                close: Number(candle.c),
                volume: Number(candle.v),
                closed: candle.x,
                timestamp: candle.t
            };

            setPrice(candleData.close);

            console.log("BTCUSDT candle:", candleData);

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

        setStatus("WebSocket Error", false);
    };

    binanceSocket.onclose = () => {

        console.log(
            "Binance WebSocket disconnected."
        );

        setStatus("Reconnecting...", false);

        setTimeout(() => {
            connectToBinance();
        }, 3000);
    };
}

getInitialPrice();
connectToBinance();
