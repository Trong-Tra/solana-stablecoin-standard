use anchor_lang::prelude::*;

/// Seed prefixes for PDAs
pub const STABLECOIN_STATE_SEED: &[u8] = b"stablecoin_state";
pub const MINTER_STATE_SEED: &[u8] = b"minter_state";
pub const BURNER_STATE_SEED: &[u8] = b"burner_state";
pub const BLACKLIST_SEED: &[u8] = b"blacklist";
pub const METADATA_SEED: &[u8] = b"metadata";

/// Get PDA for stablecoin state
pub fn get_stablecoin_state_pda(mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[STABLECOIN_STATE_SEED, mint.as_ref()], &crate::ID)
}

/// Get PDA for minter state
pub fn get_minter_state_pda(mint: &Pubkey, minter: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[MINTER_STATE_SEED, mint.as_ref(), minter.as_ref()],
        &crate::ID,
    )
}

/// Get PDA for burner state
pub fn get_burner_state_pda(mint: &Pubkey, burner: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[BURNER_STATE_SEED, mint.as_ref(), burner.as_ref()],
        &crate::ID,
    )
}

/// Get PDA for blacklist entry
pub fn get_blacklist_pda(mint: &Pubkey, address: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[BLACKLIST_SEED, mint.as_ref(), address.as_ref()],
        &crate::ID,
    )
}
