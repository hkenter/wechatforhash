const order_type = {
    default: 0,
    Maker_Post_only: 1, // 只做Maker（Post only）
    FOK: 2, // 全部成交或立即取消（FOK）
    IOC: 3, //立即成交并取消剩余（IOC）
    Market: 4 // 市价委托
};

const type = {
    OPEN_LONG: 1,
    OPEN_SHORT: 2,
    CLOSE_LONG: 3,
    CLOSE_SHORT: 4
};

const instrument_id = {
    BTC_USD_SWAP: 'BTC-USD-SWAP',
    BTC_USDT_SWAP: 'BTC-USDT-SWAP'
};

module.exports = {
    order_type,
    type,
    instrument_id
};