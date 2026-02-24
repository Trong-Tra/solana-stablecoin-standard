use anchor_lang::prelude::*;
use crate::{
    error::SssTokenError,
    state::*,
};

#[derive(Accounts)]
pub struct CloseStablecoin<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [STABLECOIN_STATE_SEED, stablecoin_state.mint.as_ref()],
        bump = stablecoin_state.bump,
        constraint = authority.key() == stablecoin_state.master_authority @ SssTokenError::Unauthorized,
        close = authority
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,
    
    /// CHECK: The mint account to verify zero supply
    #[account(
        constraint = stablecoin_state.mint == mint.key()
    )]
    pub mint: AccountInfo<'info>,
}

pub fn handler(ctx: Context<CloseStablecoin>) -> Result<()> {
    let state = &ctx.accounts.stablecoin_state;
    
    // Verify total supply is zero (all tokens burned)
    // Note: In production, would check actual mint supply
    // For now, just verify accounting
    let net_supply = state
        .total_minted
        .checked_sub(state.total_burned)
        .ok_or(SssTokenError::MathOverflow)?;
    
    require!(net_supply == 0, SssTokenError::OutstandingSupply);
    
    msg!("Stablecoin closed: {}", state.mint);
    
    Ok(())
}
