use anchor_lang::prelude::*;
use crate::{
    error::SssTokenError,
    state::*,
};

#[derive(Accounts)]
pub struct UpdateMinterRole<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [STABLECOIN_STATE_SEED, mint.key().as_ref()],
        bump = stablecoin_state.bump,
        constraint = authority.key() == stablecoin_state.master_authority @ SssTokenError::Unauthorized
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,
    
    /// CHECK: The mint address
    pub mint: AccountInfo<'info>,
    
    /// CHECK: The target minter address
    pub target: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [MINTER_STATE_SEED, mint.key().as_ref(), target.key().as_ref()],
        bump = minter_state.bump
    )]
    pub minter_state: Account<'info, MinterState>,
}

#[derive(Accounts)]
pub struct UpdateBurnerRole<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [STABLECOIN_STATE_SEED, mint.key().as_ref()],
        bump = stablecoin_state.bump,
        constraint = authority.key() == stablecoin_state.master_authority @ SssTokenError::Unauthorized
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,
    
    /// CHECK: The mint address
    pub mint: AccountInfo<'info>,
    
    /// CHECK: The target burner address
    pub target: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [BURNER_STATE_SEED, mint.key().as_ref(), target.key().as_ref()],
        bump = burner_state.bump
    )]
    pub burner_state: Account<'info, BurnerState>,
}

pub fn handler_update_minter(
    ctx: Context<UpdateMinterRole>,
    minter: Pubkey,
    quota: u64,
    active: bool,
) -> Result<()> {
    let minter_state = &mut ctx.accounts.minter_state;
    
    minter_state.minter = minter;
    minter_state.mint = ctx.accounts.mint.key();
    minter_state.quota = quota;
    minter_state.active = active;
    minter_state.minted = if !active { 0 } else { minter_state.minted };
    
    msg!(
        "Minter {} updated: active={}, quota={}",
        minter,
        active,
        quota
    );
    
    Ok(())
}

pub fn handler_update_burner(
    ctx: Context<UpdateBurnerRole>,
    burner: Pubkey,
    active: bool,
) -> Result<()> {
    let burner_state = &mut ctx.accounts.burner_state;
    
    burner_state.burner = burner;
    burner_state.mint = ctx.accounts.mint.key();
    burner_state.active = active;
    
    msg!(
        "Burner {} updated: active={}",
        burner,
        active
    );
    
    Ok(())
}
