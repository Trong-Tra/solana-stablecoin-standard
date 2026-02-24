use anchor_lang::prelude::*;
use crate::{
    error::SssTokenError,
    state::*,
};

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [STABLECOIN_STATE_SEED, stablecoin_state.mint.as_ref()],
        bump = stablecoin_state.bump,
        constraint = authority.key() == stablecoin_state.master_authority @ SssTokenError::Unauthorized
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,
    
    /// CHECK: New authority to transfer to
    pub new_authority: AccountInfo<'info>,
}

pub fn handler_transfer(
    ctx: Context<TransferAuthority>,
    new_authority: Pubkey,
) -> Result<()> {
    let state = &mut ctx.accounts.stablecoin_state;
    
    require!(
        new_authority != Pubkey::default(),
        SssTokenError::InvalidAuthority
    );
    
    let old_authority = state.master_authority;
    state.master_authority = new_authority;
    
    msg!(
        "Authority transferred from {} to {}",
        old_authority,
        new_authority
    );
    
    Ok(())
}
