use anchor_lang::prelude::*;

/// Blacklist entry account
#[account]
pub struct BlacklistEntry {
    pub address: Pubkey,
    pub mint: Pubkey,
    pub reason: String,
    pub added_at: i64,
    pub added_by: Pubkey,
}

impl BlacklistEntry {
    // Space calculation with padding for variable-length string
    pub const LEN: usize = 8 + // discriminator
        32 + // address
        32 + // mint
        104 + // reason (4 bytes length + 100 max chars)
        8 +  // added_at
        32;  // added_by
}

/// Blacklist event for audit trail
#[event]
pub struct BlacklistEvent {
    pub mint: Pubkey,
    pub address: Pubkey,
    pub action: BlacklistAction,
    pub reason: String,
    pub timestamp: i64,
    pub authority: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum BlacklistAction {
    Add,
    Remove,
}

/// Seizure event for audit trail
#[event]
pub struct SeizureEvent {
    pub mint: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub authority: Pubkey,
}

/// Mint/Burn event for audit trail
#[event]
pub struct TokenEvent {
    pub mint: Pubkey,
    pub action: TokenAction,
    pub account: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub authority: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum TokenAction {
    Mint,
    Burn,
    Freeze,
    Thaw,
    Transfer,
}

