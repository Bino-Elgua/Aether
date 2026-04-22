module aether::escrow {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;

    struct Escrow has key, store {
        id: UID,
        human: address,
        agent: address,
        amount: Coin<SUI>,
        status: u8,
    }

    const STATUS_LOCKED: u8 = 0;
    const STATUS_RELEASED: u8 = 1;
    const STATUS_REFUNDED: u8 = 2;

    public entry fun create_escrow(
        human: &mut TxContext,
        agent: address,
        amount: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let escrow = Escrow {
            id: object::new(ctx),
            human: tx_context::sender(ctx),
            agent: agent,
            amount: amount,
            status: STATUS_LOCKED,
        };
        transfer::share_object(escrow);
    }

    public entry fun release(escrow: &mut Escrow, ctx: &TxContext) {
        assert!(escrow.human == tx_context::sender(ctx), 0);
        escrow.status = STATUS_RELEASED;
        let amount = coin::into_balance(escrow.amount);
        transfer::public_transfer(coin::from_balance(amount, ctx), escrow.agent);
    }
}
