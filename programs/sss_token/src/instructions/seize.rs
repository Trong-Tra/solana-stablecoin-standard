use crate::{error::SssTokenError, state::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{Token2022, TransferChecked},
    token_interface::{Mint as InterfaceMint, TokenAccount as InterfaceTokenAccount},
};

#[derive(Accounts)]
pub struct SeizeTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [STABLECOIN_STATE_SEED, mint.key().as_ref()],
        bump = stablecoin_state.bump,
        constraint = authority.key() == stablecoin_state.master_authority @ SssTokenError::Unauthorized,
        constraint = stablecoin_state.features.permanent_delegate @ SssTokenError::ComplianceNotEnabled
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(
        constraint = stablecoin_state.mint == mint.key()
    )]
    pub mint: InterfaceAccount<'info, InterfaceMint>,

    #[account(
        mut,
        constraint = from.is_frozen() @ SssTokenError::InvalidAuthority,
    )]
    pub from: InterfaceAccount<'info, InterfaceTokenAccount>,

    #[account(mut)]
    pub to: InterfaceAccount<'info, InterfaceTokenAccount>,

    /// CHECK: Blacklist entry to verify the from address is blacklisted
    #[account(
        seeds = [BLACKLIST_SEED, mint.key().as_ref(), from.owner.as_ref()],
        bump
    )]
    pub blacklist_entry: Account<'info, BlacklistEntry>,

    pub token_2022_program: Program<'info, Token2022>,
}

pub fn handler(ctx: Context<SeizeTokens>, amount: u64) -> Result<()> {
    require!(amount > 0, SssTokenError::InvalidAmount);

    let state = &ctx.accounts.stablecoin_state;

    // Verify the from account is blacklisted
    require!(
        ctx.accounts.blacklist_entry.address == ctx.accounts.from.owner,
        SssTokenError::InvalidAuthority
    );

    // Execute transfer via CPI using permanent delegate authority
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.from.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_2022_program.to_account_info(),
        cpi_accounts,
    );

    anchor_spl::token_2022::transfer_checked(cpi_ctx, amount, state.decimals)?;

    // Emit seizure event
    emit!(SeizureEvent {
        mint: state.mint,
        from: ctx.accounts.from.owner,
        to: ctx.accounts.to.owner,
        amount,
        timestamp: Clock::get()?.unix_timestamp,
        authority: ctx.accounts.authority.key(),
    });

    msg!(
        "Seized {} tokens from {} to {}",
        amount,
        ctx.accounts.from.owner,
        ctx.accounts.to.owner
    );

    Ok(())
}
