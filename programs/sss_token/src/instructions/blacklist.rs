use anchor_lang::prelude::*;
use crate::{
    error::SssTokenError,
    state::*,
};

#[derive(Accounts)]
pub struct BlacklistManagement<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [STABLECOIN_STATE_SEED, stablecoin_state.mint.as_ref()],
        bump = stablecoin_state.bump,
        constraint = authority.key() == stablecoin_state.master_authority @ SssTokenError::Unauthorized,
        constraint = stablecoin_state.features.permanent_delegate @ SssTokenError::ComplianceNotEnabled
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,
    
    #[account(
        init_if_needed,
        payer = authority,
        space = BlacklistEntry::LEN,
        seeds = [BLACKLIST_SEED, stablecoin_state.mint.as_ref(), target_address.as_ref()],
        bump
    )]
    pub blacklist_entry: Account<'info, BlacklistEntry>,
    
    /// CHECK: Target address to blacklist/unblacklist
    pub target_address: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler_add(
    ctx: Context<BlacklistManagement>,
    address: Pubkey,
    reason: String,
) -> Result<()> {
    require!(reason.len() <= 100, SssTokenError::ReasonTooLong);
    
    let entry = &mut ctx.accounts.blacklist_entry;
    let state = &ctx.accounts.stablecoin_state;
    
    // Initialize or update blacklist entry
    entry.address = address;
    entry.mint = state.mint;
    entry.reason = reason.clone();
    entry.added_at = Clock::get()?.unix_timestamp;
    entry.added_by = ctx.accounts.authority.key();
    
    // Emit event
    emit!(BlacklistEvent {
        mint: state.mint,
        address,
        action: BlacklistAction::Add,
        reason,
        timestamp: entry.added_at,
        authority: ctx.accounts.authority.key(),
    });
    
    msg!("Address blacklisted: {} - Reason: {}", address, entry.reason);
    
    Ok(())
}

pub fn handler_remove(
    ctx: Context<BlacklistManagement>,
    address: Pubkey,
) -> Result<()> {
    let entry = &mut ctx.accounts.blacklist_entry;
    let state = &ctx.accounts.stablecoin_state;
    
    // Clear the entry (mark as removed by zeroing)
    let removed_at = Clock::get()?.unix_timestamp;
    
    // Emit event before clearing
    emit!(BlacklistEvent {
        mint: state.mint,
        address,
        action: BlacklistAction::Remove,
        reason: entry.reason.clone(),
        timestamp: removed_at,
        authority: ctx.accounts.authority.key(),
    });
    
    // Close the account by draining lamports back to authority
    let entry_lamports = entry.get_lamports();
    **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += entry_lamports;
    **entry.to_account_info().try_borrow_mut_lamports()? = 0;
    
    msg!("Address removed from blacklist: {}", address);
    
    Ok(())
}
