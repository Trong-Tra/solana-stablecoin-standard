use crate::{error::SssTokenError, state::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{ThawAccount, Token2022},
    token_interface::{Mint as InterfaceMint, TokenAccount as InterfaceTokenAccount},
};

#[derive(Accounts)]
pub struct ThawTokenAccount<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [STABLECOIN_STATE_SEED, mint.key().as_ref()],
        bump = stablecoin_state.bump,
        constraint = authority.key() == stablecoin_state.master_authority @ SssTokenError::Unauthorized
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(
        constraint = stablecoin_state.mint == mint.key()
    )]
    pub mint: InterfaceAccount<'info, InterfaceMint>,

    #[account(mut)]
    pub target_account: InterfaceAccount<'info, InterfaceTokenAccount>,

    pub token_2022_program: Program<'info, Token2022>,
}

pub fn handler(ctx: Context<ThawTokenAccount>) -> Result<()> {
    // Execute thaw via CPI
    let cpi_accounts = ThawAccount {
        account: ctx.accounts.target_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_2022_program.to_account_info(),
        cpi_accounts,
    );

    anchor_spl::token_2022::thaw_account(cpi_ctx)?;

    msg!("Thawed account: {}", ctx.accounts.target_account.key());

    Ok(())
}
