use anchor_lang::prelude::*;

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
