use anchor_lang::prelude::*;

/// Blacklist entry (mirrors the one in main program)
#[account]
pub struct BlacklistEntry {
    pub address: Pubkey,
    pub mint: Pubkey,
    pub reason: String,
    pub added_at: i64,
    pub added_by: Pubkey,
}

impl BlacklistEntry {
    pub const LEN: usize = 8 + 32 + 32 + 4 + 100 + 8 + 32;
}
