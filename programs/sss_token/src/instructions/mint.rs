use crate::{error::SssTokenError, state::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{MintTo, Token2022},
    token_interface::{Mint as InterfaceMint, TokenAccount as InterfaceTokenAccount},
};

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [STABLECOIN_STATE_SEED, mint.key().as_ref()],
        bump = stablecoin_state.bump,
        constraint = !stablecoin_state.paused @ SssTokenError::Paused
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(
        mut,
        constraint = stablecoin_state.mint == mint.key()
    )]
    pub mint: InterfaceAccount<'info, InterfaceMint>,

    #[account(
        mut,
        constraint = !is_blacklisted(&stablecoin_state, &to.owner, &stablecoin_state.mint.to_bytes()) @ SssTokenError::Blacklisted
    )]
    pub to: InterfaceAccount<'info, InterfaceTokenAccount>,

    /// CHECK: Minter state PDA, validated in handler
    #[account(
        mut,
        seeds = [MINTER_STATE_SEED, mint.key().as_ref(), authority.key().as_ref()],
        bump = minter_state.bump
    )]
    pub minter_state: Account<'info, MinterState>,

    pub token_2022_program: Program<'info, Token2022>,
}

fn is_blacklisted(state: &StablecoinState, _owner: &Pubkey, _mint_bytes: &[u8]) -> bool {
    // Simplified check - in real implementation would check blacklist PDA
    // For SSS-2 with transfer hook, this is handled by the hook
    !state.features.transfer_hook && false // Placeholder
}

pub fn handler(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
    require!(amount > 0, SssTokenError::InvalidAmount);

    let state = &mut ctx.accounts.stablecoin_state;
    let minter_state = &mut ctx.accounts.minter_state;

    // Verify minter is active
    require!(minter_state.active, SssTokenError::Unauthorized);

    // Check quota if set
    if minter_state.quota > 0 {
        let new_minted = minter_state
            .minted
            .checked_add(amount)
            .ok_or(SssTokenError::MathOverflow)?;
        require!(
            new_minted <= minter_state.quota,
            SssTokenError::QuotaExceeded
        );
        minter_state.minted = new_minted;
    }

    // Update total minted
    state.total_minted = state
        .total_minted
        .checked_add(amount)
        .ok_or(SssTokenError::MathOverflow)?;

    // Execute mint via CPI
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_2022_program.to_account_info(),
        cpi_accounts,
    );

    anchor_spl::token_2022::mint_to(cpi_ctx, amount)?;

    msg!("Minted {} tokens to {}", amount, ctx.accounts.to.owner);

    Ok(())
}
