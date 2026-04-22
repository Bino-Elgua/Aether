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
        witness_approved: bool,
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
            witness_approved: false,
            status: STATUS_LOCKED,
        };
        transfer::share_object(escrow);
    }

    public entry fun submit_witness_approval(escrow: &mut Escrow, _witness_signature: vector<u8>) {
        // In production, this would verify a ZK proof or MultiSig of valid witnesses
        escrow.witness_approved = true;
    }

    public entry fun release(escrow: &mut Escrow, ctx: &TxContext) {
        assert!(escrow.human == tx_context::sender(ctx), 0);
        assert!(escrow.witness_approved == true, 1);
        escrow.status = STATUS_RELEASED;
        let amount = coin::into_balance(escrow.amount);
        transfer::public_transfer(coin::from_balance(amount, ctx), escrow.agent);
    }
}
