use anchor_lang::prelude::*;

/// Role types for access control
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum Role {
    Master,
    Minter,
    Burner,
    Blacklister,
    Pauser,
    Seizer,
    Freezer,
}

/// Role management state
#[account]
pub struct RoleState {
    pub holder: Pubkey,
    pub role: Role,
    pub mint: Pubkey,
    pub active: bool,
    pub bump: u8,
}

impl RoleState {
    pub const LEN: usize = 8 + 32 + 1 + 32 + 1 + 1;
}

/// Seed for role state
pub const ROLE_STATE_SEED: &[u8] = b"role_state";

/// Get PDA for role state
pub fn get_role_state_pda(mint: &Pubkey, holder: &Pubkey, role: Role) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[ROLE_STATE_SEED, mint.as_ref(), holder.as_ref(), &[role as u8]],
        &crate::ID,
    )
}
