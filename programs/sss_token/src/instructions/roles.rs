use anchor_lang::prelude::*;
use crate::{
    error::SssTokenError,
    state::*,
};

#[derive(Accounts)]
pub struct UpdateRole<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [STABLECOIN_STATE_SEED, mint.as_ref()],
        bump = stablecoin_state.bump,
        constraint = authority.key() == stablecoin_state.master_authority @ SssTokenError::Unauthorized
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,
    
    /// CHECK: The mint address
    pub mint: AccountInfo<'info>,
    
    /// CHECK: The target minter/burner address
    pub target: AccountInfo<'info>,
    
    #[account(
        init_if_needed,
        payer = authority,
        space = MinterState::LEN,
        seeds = [MINTER_STATE_SEED, mint.key().as_ref(), target.key().as_ref()],
        bump
    )]
    pub minter_state: Option<Account<'info, MinterState>>,
    
    #[account(
        init_if_needed,
        payer = authority,
        space = BurnerState::LEN,
        seeds = [BURNER_STATE_SEED, mint.key().as_ref(), target.key().as_ref()],
        bump
    )]
    pub burner_state: Option<Account<'info, BurnerState>>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler_update_minter(
    ctx: Context<UpdateRole>,
    minter: Pubkey,
    quota: u64,
    active: bool,
) -> Result<()> {
    let minter_state = ctx.accounts.minter_state.as_mut()
        .ok_or(SssTokenError::InvalidPreset)?;
    
    minter_state.minter = minter;
    minter_state.mint = ctx.accounts.mint.key();
    minter_state.quota = quota;
    minter_state.active = active;
    minter_state.minted = if !active { 0 } else { minter_state.minted };
    minter_state.bump = ctx.bumps.minter_state.unwrap();
    
    msg!(
        "Minter {} updated: active={}, quota={}",
        minter,
        active,
        quota
    );
    
    Ok(())
}

pub fn handler_update_burner(
    ctx: Context<UpdateRole>,
    burner: Pubkey,
    active: bool,
) -> Result<()> {
    let burner_state = ctx.accounts.burner_state.as_mut()
        .ok_or(SssTokenError::InvalidPreset)?;
    
    burner_state.burner = burner;
    burner_state.mint = ctx.accounts.mint.key();
    burner_state.active = active;
    burner_state.bump = ctx.bumps.burner_state.unwrap();
    
    msg!(
        "Burner {} updated: active={}",
        burner,
        active
    );
    
    Ok(())
}
