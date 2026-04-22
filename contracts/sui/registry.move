module aether::registry {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::transfer;

    struct IdentityRegistry has key {
        id: UID,
        // Maps BIPỌ̀N39 address (aether://...) to Sui address
        registry: Table<vector<u8>, address>,
    }

    fun init(ctx: &mut TxContext) {
        let registry = IdentityRegistry {
            id: object::new(ctx),
            registry: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    public entry fun register_identity(
        registry: &mut IdentityRegistry,
        aether_addr: vector<u8>,
        ctx: &TxContext
    ) {
        table::add(&mut registry.registry, aether_addr, tx_context::sender(ctx));
    }
}
