use crate::{error::SssTokenError, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
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

pub fn handler_update(ctx: Context<UpdateMetadata>, uri: String) -> Result<()> {
    require!(uri.len() <= 200, SssTokenError::UriTooLong);

    let state = &mut ctx.accounts.stablecoin_state;
    state.uri = uri.clone();

    msg!("Metadata updated for {}: URI={}", state.mint, uri);

    Ok(())
}
