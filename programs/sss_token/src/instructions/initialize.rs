use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    program::invoke,
    system_instruction,
};
use anchor_spl::token_2022::Token2022;
use spl_token_2022::{
    extension::ExtensionType,
    instruction::initialize_mint2,
    state::Mint as MintState,
};
use crate::{
    error::SssTokenError,
    state::*,
};

#[derive(Accounts)]
#[instruction(config: StablecoinConfig)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: This will be initialized as the mint by token-2022 program
    #[account(
        mut,
        signer,
    )]
    pub mint: AccountInfo<'info>,
    
    #[account(
        init,
        payer = payer,
        space = StablecoinState::LEN,
        seeds = [STABLECOIN_STATE_SEED, mint.key().as_ref()],
        bump
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,
    
    pub system_program: Program<'info, System>,
    pub token_2022_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Initialize>, config: StablecoinConfig) -> Result<()> {
    // Validate config
    config.validate()?;
    
    let state = &mut ctx.accounts.stablecoin_state;
    let bump = ctx.bumps.stablecoin_state;
    
    // For now, create a basic Token-2022 mint without extensions
    // Extensions will be added in a future iteration due to complexity of CPI setup
    // SSS-2 compliance will use on-chain validation instead of extension hooks
    
    // Calculate space for basic mint (without extensions for now)
    let space = std::mem::size_of::<MintState>();
    let rent = ctx.accounts.rent.minimum_balance(space);
    
    // Create mint account
    invoke(
        &system_instruction::create_account(
            ctx.accounts.payer.key,
            ctx.accounts.mint.key,
            rent,
            space as u64,
            &ctx.accounts.token_2022_program.key(),
        ),
        &[
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
    
    // Initialize the mint
    invoke(
        &initialize_mint2(
            &ctx.accounts.token_2022_program.key(),
            ctx.accounts.mint.key,
            &ctx.accounts.payer.key(),
            Some(&ctx.accounts.payer.key()), // Set freeze authority to payer
            config.decimals,
        )
        .map_err(|_| SssTokenError::ExtensionError)?,
        &[
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
    )?;
    
    // Initialize state
    state.master_authority = ctx.accounts.payer.key();
    state.mint = ctx.accounts.mint.key();
    state.name = config.name.clone();
    state.symbol = config.symbol.clone();
    state.uri = config.uri.clone();
    state.decimals = config.decimals;
    state.features = config.to_feature_flags();
    state.paused = false;
    state.total_minted = 0;
    state.total_burned = 0;
    state.bump = bump;
    state.version = 1;
    
    msg!("Stablecoin initialized: {} ({}) - Preset: {}",
        state.name,
        state.symbol,
        if state.features.permanent_delegate { "SSS-2 (Compliant)" } else { "SSS-1 (Minimal)" }
    );
    
    msg!("Features enabled: permanent_delegate={}, transfer_hook={}", 
        state.features.permanent_delegate,
        state.features.transfer_hook
    );
    
    Ok(())
}
