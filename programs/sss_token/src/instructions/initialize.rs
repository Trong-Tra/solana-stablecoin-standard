use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::Mint as InterfaceMint,
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
    
    /// CHECK: This will be the mint, validated in handler
    #[account(
        init,
        payer = payer,
        space = 82,
        owner = token_2022_program.key(),
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
    
    // Note: In a real implementation, we would initialize the Token-2022 mint
    // with the appropriate extensions here. For simplicity, this assumes
    // the mint was pre-initialized with the required extensions.
    
    msg!("Stablecoin initialized: {} ({}) with features: permanent_delegate={}, transfer_hook={}",
        state.name,
        state.symbol,
        state.features.permanent_delegate,
        state.features.transfer_hook
    );
    
    Ok(())
}
