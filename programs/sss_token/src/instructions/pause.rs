use anchor_lang::prelude::*;
use crate::{
    error::SssTokenError,
    state::*,
};

#[derive(Accounts)]
pub struct PauseStablecoin<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [STABLECOIN_STATE_SEED, stablecoin_state.mint.as_ref()],
        bump = stablecoin_state.bump,
        constraint = authority.key() == stablecoin_state.master_authority @ SssTokenError::Unauthorized
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,
}

pub fn handler_pause(ctx: Context<PauseStablecoin>) -> Result<()> {
    let state = &mut ctx.accounts.stablecoin_state;
    
    require!(!state.paused, SssTokenError::InvalidPreset);
    
    state.paused = true;
    
    msg!("Stablecoin paused: {}", state.mint);
    
    Ok(())
}

pub fn handler_unpause(ctx: Context<PauseStablecoin>) -> Result<()> {
    let state = &mut ctx.accounts.stablecoin_state;
    
    require!(state.paused, SssTokenError::InvalidPreset);
    
    state.paused = false;
    
    msg!("Stablecoin unpaused: {}", state.mint);
    
    Ok(())
}
