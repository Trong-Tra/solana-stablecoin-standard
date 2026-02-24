use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{Burn, Token2022},
    token_interface::{Mint as InterfaceMint, TokenAccount as InterfaceTokenAccount},
};
use crate::{
    error::SssTokenError,
    state::*,
};

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [STABLECOIN_STATE_SEED, mint.key().as_ref()],
        bump = stablecoin_state.bump
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,
    
    #[account(
        mut,
        constraint = stablecoin_state.mint == mint.key()
    )]
    pub mint: InterfaceAccount<'info, InterfaceMint>,
    
    #[account(
        mut,
        constraint = from.owner == authority.key() || is_burner(&stablecoin_state, &authority.key())
    )]
    pub from: InterfaceAccount<'info, InterfaceTokenAccount>,
    
    /// CHECK: Burner state PDA (optional)
    #[account(
        seeds = [BURNER_STATE_SEED, mint.key().as_ref(), authority.key().as_ref()],
        bump
    )]
    pub burner_state: Option<Account<'info, BurnerState>>,
    
    pub token_2022_program: Program<'info, Token2022>,
}

fn is_burner(state: &StablecoinState, authority: &Pubkey) -> bool {
    // Check if authority is master or a designated burner
    authority == &state.master_authority
}

pub fn handler(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
    require!(amount > 0, SssTokenError::InvalidAmount);
    
    let state = &mut ctx.accounts.stablecoin_state;
    
    // Verify authority is owner, burner, or master
    let is_owner = ctx.accounts.from.owner == ctx.accounts.authority.key();
    let is_master = ctx.accounts.authority.key() == state.master_authority;
    let is_designated_burner = ctx.accounts.burner_state.as_ref()
        .map(|b| b.active)
        .unwrap_or(false);
    
    require!(
        is_owner || is_master || is_designated_burner,
        SssTokenError::Unauthorized
    );
    
    // Update total burned
    state.total_burned = state
        .total_burned
        .checked_add(amount)
        .ok_or(SssTokenError::MathOverflow)?;
    
    // Execute burn via CPI
    let cpi_accounts = Burn {
        mint: ctx.accounts.mint.to_account_info(),
        from: ctx.accounts.from.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_2022_program.to_account_info(),
        cpi_accounts,
    );
    
    anchor_spl::token_2022::burn(cpi_ctx, amount)?;
    
    msg!("Burned {} tokens from {}", amount, ctx.accounts.from.owner);
    
    Ok(())
}
